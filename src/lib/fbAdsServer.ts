import type { SupabaseClient } from '@supabase/supabase-js';
import type { FbAdInfo } from './fbAds';

const GRAPH = 'https://graph.facebook.com/v21.0';
const FIELDS = [
    'name', 'status', 'effective_status',
    'adset{id,name}', 'campaign{id,name}',
    'creative{title,body,thumbnail_url,image_url,effective_object_story_id}',
].join(',');
const STALE_MS = 12 * 60 * 60 * 1000; // làm mới sau 12 giờ

/**
 * Lấy thông tin QC theo danh sách ad_id: đọc bảng fb_ads, cái nào thiếu hoặc cũ
 * thì gọi Graph API (gộp 50 mã/lần) rồi lưu lại. Không bao giờ ném lỗi.
 */
export async function getAdsInfo(
    supabase: SupabaseClient,
    adIds: string[],
    opts: { token?: string; force?: boolean } = {}
): Promise<Record<string, FbAdInfo>> {
    const ids = Array.from(new Set(adIds.filter(id => /^\d{5,30}$/.test(String(id)))));
    const result: Record<string, FbAdInfo> = {};
    if (ids.length === 0) return result;

    const { data: cached } = await supabase.from('fb_ads').select('*').in('ad_id', ids);
    const now = Date.now();
    (cached || []).forEach((r: FbAdInfo) => { result[r.ad_id] = r; });

    const token = opts.token || process.env.FB_ADS_ACCESS_TOKEN;
    if (!token) return result;

    const toFetch = ids.filter(id => opts.force || !result[id] ||
        now - new Date(result[id].fetched_at).getTime() > STALE_MS);

    for (let i = 0; i < toFetch.length; i += 50) {
        const chunk = toFetch.slice(i, i + 50);
        let json: any = {};
        try {
            const res = await fetch(`${GRAPH}/?ids=${chunk.join(',')}&fields=${encodeURIComponent(FIELDS)}&access_token=${token}`);
            json = await res.json();
        } catch (e: any) {
            json = { error: { message: e?.message || 'network error' } };
        }

        const rows: FbAdInfo[] = chunk.map(id => {
            const ad = json?.[id];
            const err = ad ? null : (json?.error?.message || 'Không đọc được quảng cáo (thiếu quyền ads_read hoặc QC đã bị xoá)');
            const storyId: string | null = ad?.creative?.effective_object_story_id || null;
            return {
                ad_id: id,
                ad_name: ad?.name ?? result[id]?.ad_name ?? null,
                status: ad?.status ?? result[id]?.status ?? null,
                effective_status: ad?.effective_status ?? result[id]?.effective_status ?? null,
                adset_id: ad?.adset?.id ?? result[id]?.adset_id ?? null,
                adset_name: ad?.adset?.name ?? result[id]?.adset_name ?? null,
                campaign_id: ad?.campaign?.id ?? result[id]?.campaign_id ?? null,
                campaign_name: ad?.campaign?.name ?? result[id]?.campaign_name ?? null,
                creative_title: ad?.creative?.title ?? result[id]?.creative_title ?? null,
                creative_body: ad?.creative?.body ?? result[id]?.creative_body ?? null,
                thumbnail_url: ad?.creative?.thumbnail_url || ad?.creative?.image_url || result[id]?.thumbnail_url || null,
                post_id: storyId ?? result[id]?.post_id ?? null,
                post_url: storyId ? `https://www.facebook.com/${storyId}` : (result[id]?.post_url ?? null),
                fetch_error: err,
                fetched_at: new Date().toISOString(),
            };
        });

        const { error } = await supabase.from('fb_ads').upsert(rows, { onConflict: 'ad_id' });
        if (error) console.error('[fbAds] upsert failed:', error.message);
        rows.forEach(r => { result[r.ad_id] = r; });
    }
    return result;
}

/** Tên hiển thị gọn để lưu vào social_conversations.ad_title. */
export function adTitleFrom(ad?: FbAdInfo | null): string | null {
    if (!ad?.ad_name) return null;
    return ad.campaign_name ? `${ad.ad_name} (${ad.campaign_name})` : ad.ad_name;
}
