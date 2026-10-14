import { NextResponse } from 'next/server';
import { requireAdmin, getGoogleUsage } from '@/lib/prospectFinder/server';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** Danh sách + thống kê. Query: job_id, dup, phone (has|none), review, category, q, page */
export async function GET(request: Request) {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const { db } = auth;

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Number(sp.get('page')) || 1);
    const exportAll = sp.get('export') === '1';

    let q = db.from('prospects').select('*', { count: 'exact' });
    const jobId = sp.get('job_id');
    if (jobId) q = q.eq('job_id', jobId);
    const dup = sp.get('dup');
    if (dup) q = q.eq('dup_status', dup);
    const phone = sp.get('phone');
    if (phone === 'has') q = q.not('phone', 'is', null);
    if (phone === 'none') q = q.is('phone', null);
    const review = sp.get('review');
    if (review) q = q.eq('review_status', review);
    const category = sp.get('category');
    if (category) q = q.eq('category', category);
    const text = (sp.get('q') || '').trim().replace(/[%,()]/g, ' ');
    if (text) q = q.or(`name.ilike.%${text}%,address.ilike.%${text}%,phone.ilike.%${text}%`);

    const { data, count, error } = await q
        .order('created_at', { ascending: false })
        .order('id')
        .range(exportAll ? 0 : (page - 1) * PAGE_SIZE, exportAll ? 4999 : page * PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Thống kê toàn bảng (đếm theo từng điều kiện)
    const count1 = async (f: (b: any) => any) => {
        const { count: c } = await f(db.from('prospects').select('id', { count: 'exact', head: true }));
        return c ?? 0;
    };
    const [total, withPhone, clean, dupCrm, dupProspect] = await Promise.all([
        count1((b) => b),
        count1((b) => b.not('phone', 'is', null)),
        count1((b) => b.not('phone', 'is', null).eq('dup_status', 'new')),
        count1((b) => b.in('dup_status', ['dup_customer', 'dup_deal', 'dup_lead'])),
        count1((b) => b.eq('dup_status', 'dup_prospect')),
    ]);

    const { data: jobs } = await db
        .from('prospect_jobs')
        .select('id, province, district, categories, status, found_count, inserted_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    return NextResponse.json({
        items: data || [],
        total: count ?? 0,
        page,
        pageSize: PAGE_SIZE,
        stats: { total, withPhone, clean, dupCrm, dupProspect },
        google: await getGoogleUsage(db),
        googleConfigured: !!process.env.GOOGLE_PLACES_API_KEY,
        jobs: jobs || [],
    });
}

/** Duyệt / loại thủ công. Body: { ids: string[], review_status: 'new'|'approved'|'rejected', note? } */
export async function PATCH(request: Request) {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await request.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : [];
    const status = body?.review_status;
    if (!ids.length || ids.length > 500 || !['new', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    const patch: Record<string, any> = { review_status: status, updated_at: new Date().toISOString() };
    if (typeof body.note === 'string') patch.note = body.note.slice(0, 500);

    const { error } = await auth.db.from('prospects').update(patch).in('id', ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, updated: ids.length });
}
