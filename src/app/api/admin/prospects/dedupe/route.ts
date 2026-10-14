import { NextResponse } from 'next/server';
import { requireAdmin, runDedupe } from '@/lib/prospectFinder/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Tra trùng lại (customers, crm_deals, marketing_leads, trong prospects). Body: { ids?: string[], all?: boolean } */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string').slice(0, 500) : [];

    try {
        if (body?.all) {
            // Đặt lại cờ để kiểm tra toàn bộ
            await auth.db.from('prospects').update({ dup_checked_at: null }).not('phone', 'is', null);
        }
        const result = await runDedupe(auth.db, ids.length ? ids : undefined);
        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Lỗi tra trùng' }, { status: 500 });
    }
}
