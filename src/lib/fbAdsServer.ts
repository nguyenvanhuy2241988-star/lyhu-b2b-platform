import type { SupabaseClient } from '@supabase/supabase-js';
import type { FbAdInfo } from './fbAds';

const GRAPH = 'https://graph.facebook.com/v21.0';
const AD_FIELDS = [
    'name', 'status', 'effective_status',
    'adset{id,name}', 'campaign{id,name}',
    'creative{title,body,thumbnail_url,image_url,effective_object_story_id,call_to_action_type}',
].join(',');
const POST_FIELDS = 'message,full_picture,permalink_url,attachments{media_type,media,url,title,description}';
const STALE_MS = 12 * 60 * 60 * 1000; // làm mới sau 12 giờ

const EMPTY: Omit<FbAdInfo, 'ad_id' | 'fetched_at'> = {
    ad_name: null, status: null, effective_status: null, adset_id: null, adset_name: null,
    campaign_id: null, campaign_name: null, creative_title: null, creative_body: null,
    thumbnail_url: null, post_id: null, post_url: null, post_message: null,
    post_image_url: null, post_video_url: null, call_to_action: null, fetch_error: null,
};

/** Token của Fanpage sở hữu bài viết (post_id dạng PAGEID_POSTID). */
async function pageTokenForPost(supabase: SupabaseClient, postId: string): Promise<string | null> {
    const fbPageId = postId.split('_')[0];
    if (!fbPageId) return null;
    const { data } = await supabase.from('facebook_pages').select('access_token').eq('page_id', fbPageId).maybeSingle();
    return (data as any)?.access_token || null;
}

/** Đọc nội dung bài quảng cáo (chữ, ảnh, video) bằng token của Fanpage. */
async function fetchPostContent(supabase: SupabaseClient, postId: string) {
    const token = await pageTokenForPost(supabase, postId);
    if (!token) return null;
    try {
        const res = await fetch(`${GRAPH}/${postId}?fields=${encodeURIComponent(POST_FIELDS)}&access_token=${token}`);
        const p = await res.json();
        if (p?.error) return null;
        const att = p?.attachments?.data?.[0];
        const isVideo = typeof att?.media_type === 'string' && att.media_type.toLowerCase().includes('video');
        return {
            post_message: p?.message || att?.description || null,
            post_image_url: p?.full_picture || att?.media?.image?.src || null,
            post_video_url: isVideo ? (att?.media?.source || null) : null,
            post_url: p?.permalink_url || `https://www.facebook.com/${postId}`,
        };
    } catch {
        return null;
    }
}

async function save(supabase: SupabaseClient, rows: FbAdInfo[]) {
    if (rows.length === 0) return;
    const { error } = await supabase.from('fb_ads').upsert(rows, { onConflict: 'ad_id' });
    if (error) console.error('[fbAds] upsert failed:', error.message);
}

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
    (cached || []).forEach((r: FbAdInfo) => { result[r.ad_id] = r; });

    const token = opts.token || process.env.FB_ADS_ACCESS_TOKEN;
    const now = Date.now();
    const toFetch = ids.filter(id => opts.force || !result[id]?.ad_name ||
        now - new Date(result[id].fetched_at).getTime() > STALE_MS);

    if (!token) {
        // Không có token quảng cáo: báo lý do cho giao diện (không ghi vào DB)
        toFetch.forEach(id => {
            if (!result[id]) result[id] = { ...EMPTY, ad_id: id, fetched_at: new Date().toISOString() };
            if (!result[id].ad_name) result[id] = { ...result[id], fetch_error: 'Chưa cấu hình FB_ADS_ACCESS_TOKEN (cần quyền ads_read)' };
        });
        return result;
    }

    for (let i = 0; i < toFetch.length; i += 50) {
        const chunk = toFetch.slice(i, i + 50);
        let json: any = {};
        try {
            const res = await fetch(`${GRAPH}/?ids=${chunk.join(',')}&fields=${encodeURIComponent(AD_FIELDS)}&access_token=${token}`);
            json = await res.json();
        } catch (e: any) {
            json = { error: { message: e?.message || 'network error' } };
        }

        const rows: FbAdInfo[] = [];
        for (const id of chunk) {
            const ad = json?.[id];
            const prev = result[id] || { ...EMPTY, ad_id: id, fetched_at: '' };
            const storyId: string | null = ad?.creative?.effective_object_story_id || prev.post_id || null;
            const post = storyId && (opts.force || !prev.post_message) ? await fetchPostContent(supabase, storyId) : null;
            rows.push({
                ad_id: id,
                ad_name: ad?.name ?? prev.ad_name,
                status: ad?.status ?? prev.status,
                effective_status: ad?.effective_status ?? prev.effective_status,
                adset_id: ad?.adset?.id ?? prev.adset_id,
                adset_name: ad?.adset?.name ?? prev.adset_name,
                campaign_id: ad?.campaign?.id ?? prev.campaign_id,
                campaign_name: ad?.campaign?.name ?? prev.campaign_name,
                creative_title: ad?.creative?.title ?? prev.creative_title,
                creative_body: ad?.creative?.body ?? prev.creative_body,
                thumbnail_url: ad?.creative?.thumbnail_url || ad?.creative?.image_url || prev.thumbnail_url,
                call_to_action: ad?.creative?.call_to_action_type ?? prev.call_to_action,
                post_id: storyId,
                post_url: post?.post_url ?? prev.post_url ?? (storyId ? `https://www.facebook.com/${storyId}` : null),
                post_message: post?.post_message ?? prev.post_message,
                post_image_url: post?.post_image_url ?? prev.post_image_url,
                post_video_url: post?.post_video_url ?? prev.post_video_url,
                fetch_error: ad ? null : (json?.error?.message || 'Không đọc được quảng cáo (thiếu quyền ads_read hoặc QC đã bị xoá)'),
                fetched_at: new Date().toISOString(),
            });
        }
        await save(supabase, rows);
        rows.forEach(r => { result[r.ad_id] = r; });
    }
    return result;
}

/**
 * Lưu thông tin QC có sẵn trong webhook (referral.ads_context_data) — KHÔNG cần token
 * quảng cáo. Meta gửi kèm post_id, ảnh/video và tiêu đề QC khi khách bấm nút nhắn tin.
 */
export async function saveAdContextFromReferral(supabase: SupabaseClient, referral: any): Promise<void> {
    const adId = referral?.ad_id ? String(referral.ad_id) : null;
    const ctx = referral?.ads_context_data;
    if (!adId || !ctx) return;
    const { data: existing } = await supabase.from('fb_ads').select('*').eq('ad_id', adId).maybeSingle();
    const prev: FbAdInfo = (existing as FbAdInfo) || { ...EMPTY, ad_id: adId, fetched_at: new Date(0).toISOString() };
    if (prev.post_message) return; // đã có nội dung

    const postId: string | null = ctx.post_id || prev.post_id || null;
    const post = postId ? await fetchPostContent(supabase, postId) : null;
    await save(supabase, [{
        ...prev,
        creative_title: prev.creative_title ?? ctx.ad_title ?? null,
        thumbnail_url: prev.thumbnail_url ?? ctx.photo_url ?? null,
        post_id: postId,
        post_url: post?.post_url ?? prev.post_url ?? (postId ? `https://www.facebook.com/${postId}` : null),
        post_message: post?.post_message ?? prev.post_message,
        post_image_url: post?.post_image_url ?? ctx.photo_url ?? prev.post_image_url,
        post_video_url: post?.post_video_url ?? ctx.video_url ?? prev.post_video_url,
        // giữ fetched_at cũ để getAdsInfo vẫn lấy tên QC/chiến dịch khi có token
        fetched_at: prev.fetched_at,
    }]);
}

/** Tên hiển thị gọn để lưu vào social_conversations.ad_title. */
export function adTitleFrom(ad?: FbAdInfo | null): string | null {
    if (!ad?.ad_name) return null;
    return ad.campaign_name ? `${ad.ad_name} (${ad.campaign_name})` : ad.ad_name;
}
