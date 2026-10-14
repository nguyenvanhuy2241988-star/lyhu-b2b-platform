import { NextResponse } from 'next/server';
import { requireAdmin, runDedupe } from '@/lib/prospectFinder/server';
import { CATEGORY_PRESETS, fetchOsmProspects } from '@/lib/prospectFinder/osm';
import { stripAdminPrefix } from '@/lib/prospectFinder/osm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Bước 1: lập danh sách cửa hàng từ OpenStreetMap theo khu vực. */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const { db, userId } = auth;

    const body = await request.json().catch(() => null);
    const province = String(body?.province || '').trim();
    const district = String(body?.district || '').trim();
    const categories: string[] = (Array.isArray(body?.categories) ? body.categories : []).filter(
        (c: any) => typeof c === 'string' && CATEGORY_PRESETS[c]
    );
    const limit = Math.min(Math.max(Number(body?.limit) || 500, 1), 3000);

    if (!province) return NextResponse.json({ error: 'Nhập tỉnh/thành phố' }, { status: 400 });
    if (province.length > 80 || district.length > 80) return NextResponse.json({ error: 'Tên khu vực quá dài' }, { status: 400 });
    if (!categories.length) return NextResponse.json({ error: 'Chọn ít nhất một nhóm cửa hàng' }, { status: 400 });

    const { data: job, error: jobErr } = await db
        .from('prospect_jobs')
        .insert({ created_by: userId, province, district: district || null, categories, status: 'running' })
        .select('id')
        .single();
    if (jobErr || !job) return NextResponse.json({ error: jobErr?.message || 'Không tạo được job' }, { status: 500 });

    try {
        const found = await fetchOsmProspects({ province, district, categories, limit });

        // Loại các cửa hàng đã có trong bảng (cùng osm_type + osm_id) trước khi chèn
        const existing = new Set<string>();
        const osmIds = found.map((f) => f.osm_id);
        for (let i = 0; i < osmIds.length; i += 300) {
            const { data } = await db.from('prospects').select('osm_type, osm_id').in('osm_id', osmIds.slice(i, i + 300));
            for (const r of data || []) existing.add(`${r.osm_type}:${r.osm_id}`);
        }
        const fresh = found.filter((f) => !existing.has(`${f.osm_type}:${f.osm_id}`));

        const provinceName = stripAdminPrefix(province);
        const rows = fresh.map((f) => ({
            job_id: job.id,
            osm_type: f.osm_type,
            osm_id: f.osm_id,
            name: f.name,
            category: f.category,
            address: f.address,
            province: provinceName,
            district: district ? stripAdminPrefix(district) : null,
            lat: f.lat,
            lng: f.lng,
            phone: f.phone,
            phone_raw: f.phone_raw,
            phone_source: f.phone ? 'osm' : null,
            website: f.website,
            facebook_url: f.facebook_url,
            email: f.email,
        }));

        let inserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
            const { error } = await db.from('prospects').insert(rows.slice(i, i + 500));
            if (error) throw new Error(error.message);
            inserted += Math.min(500, rows.length - i);
        }

        await db
            .from('prospect_jobs')
            .update({ status: 'completed', found_count: found.length, inserted_count: inserted })
            .eq('id', job.id);

        // Tra trùng ngay cho những cửa hàng OSM đã có SĐT
        const dedupe = rows.some((r) => r.phone) ? await runDedupe(db) : null;

        return NextResponse.json({
            success: true,
            jobId: job.id,
            found: found.length,
            inserted,
            alreadyKnown: found.length - fresh.length,
            withPhone: rows.filter((r) => r.phone).length,
            dedupe,
            hint: found.length === 0 ? 'Không có kết quả: kiểm tra lại tên khu vực (đúng như trên OpenStreetMap) hoặc chọn thêm nhóm cửa hàng.' : undefined,
        });
    } catch (e: any) {
        await db.from('prospect_jobs').update({ status: 'failed', error_message: String(e?.message || e).slice(0, 500) }).eq('id', job.id);
        return NextResponse.json({ error: e?.message || 'Lỗi khi quét OpenStreetMap' }, { status: 502 });
    }
}
