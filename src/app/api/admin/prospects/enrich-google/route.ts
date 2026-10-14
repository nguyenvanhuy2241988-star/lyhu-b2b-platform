import { NextResponse } from 'next/server';
import { requireAdmin, reserveGoogleCall, refundGoogleCall, getGoogleUsage, mapLimit, runDedupe } from '@/lib/prospectFinder/server';
import { findGooglePlace } from '@/lib/prospectFinder/google';
import { pickBestPhone } from '@/lib/prospectFinder/phone';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Bước 2: lấy SĐT từ Google Places, CHỈ cho cửa hàng đã lọc:
 * chưa có SĐT, chưa trùng CRM, có tọa độ, chưa từng hỏi Google, chưa bị loại.
 * Mỗi cửa hàng = 1 lượt gọi, trừ vào hạn mức tháng (GOOGLE_PLACES_MONTHLY_LIMIT, mặc định 900).
 */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const { db } = auth;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Chưa cấu hình GOOGLE_PLACES_API_KEY' }, { status: 500 });

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string').slice(0, 50) : [];
    const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 50);

    let q = db
        .from('prospects')
        .select('id, name, lat, lng')
        .is('phone', null)
        .is('google_checked_at', null)
        .eq('dup_status', 'new')
        .neq('review_status', 'rejected')
        .not('lat', 'is', null)
        .not('lng', 'is', null);
    if (ids.length) q = q.in('id', ids);
    const { data: rows, error } = await q.order('created_at', { ascending: true }).limit(ids.length ? 50 : limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows || rows.length === 0) {
        return NextResponse.json({ success: true, processed: 0, message: 'Không có cửa hàng nào đủ điều kiện (chưa có SĐT, chưa trùng, chưa hỏi Google).' });
    }

    const stats = { processed: 0, gotPhone: 0, matchedNoPhone: 0, noMatch: 0, failed: 0, quotaExhausted: false };
    const touched: string[] = [];
    let stop = false;
    let firstError: string | null = null;

    await mapLimit(rows, 3, async (r) => {
        if (stop) return;
        // Giữ chỗ hạn mức TRƯỚC khi gọi Google
        let ok = false;
        try {
            ok = await reserveGoogleCall(db);
        } catch (e) {
            stop = true;
            stats.failed++;
            return;
        }
        if (!ok) {
            stop = true;
            stats.quotaExhausted = true;
            return;
        }

        let m: Awaited<ReturnType<typeof findGooglePlace>>;
        try {
            m = await findGooglePlace({ apiKey, name: r.name, lat: r.lat, lng: r.lng });
        } catch (e: any) {
            // Google lỗi (sai key, chưa bật API, bị chặn...): hoàn lượt, ghi lại lý do, không đánh dấu đã hỏi
            await refundGoogleCall(db).catch(() => {});
            stats.failed++;
            firstError = firstError || String(e?.message || e).slice(0, 300);
            // Lỗi cấu hình (400/401/403) sẽ lặp lại với mọi cửa hàng: dừng sớm, không gọi tiếp
            if (/Google API (400|401|403)/.test(String(e?.message))) stop = true;
            return;
        }

        try {
            const now = new Date().toISOString();
            const patch: Record<string, any> = {
                google_checked_at: now,
                google_match: m.matched ? 'matched' : 'no_match',
                updated_at: now,
            };
            if (m.matched) {
                const best = pickBestPhone(m.phoneRaw);
                if (best) {
                    patch.phone = best.phone;
                    patch.phone_raw = best.raw;
                    patch.phone_source = 'google';
                    stats.gotPhone++;
                } else {
                    stats.matchedNoPhone++;
                }
                if (m.website) patch.website = m.website;
                if (m.address) patch.address = m.address;
                patch.google_place_id = m.placeId;
            } else {
                stats.noMatch++;
            }

            let { error: upErr } = await db.from('prospects').update(patch).eq('id', r.id);
            if (upErr && (upErr as any).code === '23505') {
                // place_id đã gắn cho cửa hàng khác: bỏ place_id, vẫn lưu SĐT để chống trùng xử lý
                delete patch.google_place_id;
                ({ error: upErr } = await db.from('prospects').update(patch).eq('id', r.id));
            }
            if (upErr) throw new Error(upErr.message);
            stats.processed++;
            touched.push(r.id);
        } catch (e: any) {
            stats.failed++;
            firstError = firstError || `Lưu dữ liệu lỗi: ${String(e?.message || e).slice(0, 200)}`;
        }
    });

    // Tra trùng cho các số vừa lấy được
    const dedupe = touched.length ? await runDedupe(db, touched) : null;

    return NextResponse.json({ success: true, ...stats, firstError, dedupe, google: await getGoogleUsage(db) });
}
