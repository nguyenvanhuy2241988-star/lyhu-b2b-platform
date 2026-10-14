import { NextResponse } from 'next/server';
import { requireAdmin, mapLimit, runDedupe } from '@/lib/prospectFinder/server';
import { enrichFromWeb } from '@/lib/prospectFinder/web';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Bước 3: bổ sung liên hệ từ website / fanpage công khai của cửa hàng
 * cho các cửa hàng còn thiếu SĐT, chưa trùng CRM, chưa quét web.
 */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const { db } = auth;

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string').slice(0, 50) : [];
    const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 50);

    let q = db
        .from('prospects')
        .select('id, website, facebook_url, zalo, email')
        .is('phone', null)
        .is('web_checked_at', null)
        .eq('dup_status', 'new')
        .neq('review_status', 'rejected')
        .or('website.not.is.null,facebook_url.not.is.null');
    if (ids.length) q = q.in('id', ids);
    const { data: rows, error } = await q.order('created_at', { ascending: true }).limit(ids.length ? 50 : limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows || rows.length === 0) {
        return NextResponse.json({ success: true, processed: 0, message: 'Không có cửa hàng nào có website/fanpage cần quét.' });
    }

    const stats = { processed: 0, gotPhone: 0, gotOther: 0, unreachable: 0 };
    const touched: string[] = [];

    await mapLimit(rows, 4, async (r) => {
        const c = await enrichFromWeb({ website: r.website, facebook: r.facebook_url });
        const now = new Date().toISOString();
        const patch: Record<string, any> = { web_checked_at: now, updated_at: now };
        if (c.phone) {
            patch.phone = c.phone;
            patch.phone_raw = c.phoneRaw;
            patch.phone_source = c.phoneSource || 'website';
            stats.gotPhone++;
            touched.push(r.id);
        }
        if (c.zalo && !r.zalo) patch.zalo = c.zalo;
        if (c.email && !r.email) patch.email = c.email;
        if (c.facebook && !r.facebook_url) patch.facebook_url = c.facebook;
        if (!c.phone && (c.zalo || c.email)) stats.gotOther++;
        if (!c.fetched) stats.unreachable++;

        const { error: upErr } = await db.from('prospects').update(patch).eq('id', r.id);
        if (!upErr) stats.processed++;
    });

    const dedupe = touched.length ? await runDedupe(db, touched) : null;
    return NextResponse.json({ success: true, ...stats, dedupe });
}
