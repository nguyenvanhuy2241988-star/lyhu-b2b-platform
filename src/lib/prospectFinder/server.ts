/**
 * Helper phía server cho module Prospect Finder:
 * - requireAdmin(): chỉ cho role 'admin' đã đăng nhập
 * - dùng service role để đọc/ghi các bảng prospect_* (bảng không mở cho client)
 * - runDedupe(): chống trùng với customers, crm_deals, marketing_leads và trong chính prospects
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export type AdminCtx = { ok: true; userId: string; db: SupabaseClient };
export type AdminDenied = { ok: false; res: NextResponse };

export async function requireAdmin(): Promise<AdminCtx | AdminDenied> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !service) {
        return { ok: false, res: NextResponse.json({ error: 'Thiếu cấu hình Supabase trên server' }, { status: 500 }) };
    }

    const cookieStore = cookies();
    const userClient = createServerClient(url, anon, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll() {
                /* route handler chỉ đọc phiên */
            },
        },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

    const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { ok: false, res: NextResponse.json({ error: 'Chỉ admin được dùng chức năng này' }, { status: 403 }) };
    }

    const db = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    return { ok: true, userId: user.id, db };
}

export function currentMonth(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function googleMonthlyLimit(): number {
    const n = Number(process.env.GOOGLE_PLACES_MONTHLY_LIMIT);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 900;
}

export async function getGoogleUsage(db: SupabaseClient): Promise<{ used: number; limit: number }> {
    const { data } = await db.from('prospect_google_quota').select('calls').eq('month', currentMonth()).maybeSingle();
    return { used: data?.calls ?? 0, limit: googleMonthlyLimit() };
}

export async function reserveGoogleCall(db: SupabaseClient): Promise<boolean> {
    const { data, error } = await db.rpc('prospect_try_use_quota', {
        p_month: currentMonth(),
        p_amount: 1,
        p_limit: googleMonthlyLimit(),
    });
    if (error) throw new Error(`Không kiểm tra được hạn mức Google: ${error.message}`);
    return data === true;
}

/** Hoàn lại 1 lượt khi lời gọi Google thất bại (chưa tính phí). Chỉ gọi sau khi đã reserveGoogleCall thành công. */
export async function refundGoogleCall(db: SupabaseClient): Promise<void> {
    await db.rpc('prospect_try_use_quota', {
        p_month: currentMonth(),
        p_amount: -1,
        p_limit: googleMonthlyLimit(),
    });
}

/** Chạy hàm async trên danh sách với số luồng giới hạn. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const i = next++;
            if (i >= items.length) return;
            results[i] = await fn(items[i]);
        }
    });
    await Promise.all(workers);
    return results;
}

const CHUNK = 200;

/**
 * Chống trùng cho các prospect có SĐT.
 * Thứ tự ưu tiên nhãn: dup_deal > dup_customer > dup_lead > dup_prospect > new.
 * Chỉ trả về số lượng; kết quả ghi thẳng vào bảng prospects.
 */
export async function runDedupe(db: SupabaseClient, ids?: string[]): Promise<{ checked: number; counts: Record<string, number> }> {
    let q = db.from('prospects').select('id, phone, created_at').not('phone', 'is', null);
    if (ids && ids.length) q = q.in('id', ids);
    else q = q.is('dup_checked_at', null).limit(2000);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const list = rows || [];
    const counts: Record<string, number> = { new: 0, dup_customer: 0, dup_deal: 0, dup_lead: 0, dup_prospect: 0 };
    if (list.length === 0) return { checked: 0, counts };

    // 1) Trùng với CRM
    const phones = Array.from(new Set(list.map((r) => r.phone as string)));
    const crm = new Map<string, { kind: string; ref: string }>();
    const rank: Record<string, number> = { deal: 3, customer: 2, lead: 1 };
    for (let i = 0; i < phones.length; i += CHUNK) {
        const { data, error: rpcErr } = await db.rpc('prospect_find_phone_dups', { p_phones: phones.slice(i, i + CHUNK) });
        if (rpcErr) throw new Error(`Tra trùng lỗi: ${rpcErr.message}`);
        for (const d of data || []) {
            const cur = crm.get(d.phone);
            if (!cur || rank[d.kind] > rank[cur.kind]) crm.set(d.phone, { kind: d.kind, ref: d.ref });
        }
    }

    // 2) Trùng trong chính bảng prospects: giữ bản cũ nhất làm bản chính
    const primary = new Map<string, string>();
    for (let i = 0; i < phones.length; i += CHUNK) {
        const { data } = await db
            .from('prospects')
            .select('id, phone, created_at')
            .in('phone', phones.slice(i, i + CHUNK))
            .order('created_at', { ascending: true })
            .order('id', { ascending: true });
        for (const r of data || []) if (!primary.has(r.phone)) primary.set(r.phone, r.id);
    }

    const now = new Date().toISOString();
    await mapLimit(list, 10, async (r) => {
        const hit = crm.get(r.phone as string);
        let status = 'new';
        let ref: string | null = null;
        if (hit) {
            status = hit.kind === 'deal' ? 'dup_deal' : hit.kind === 'customer' ? 'dup_customer' : 'dup_lead';
            ref = hit.ref;
        } else if (primary.get(r.phone as string) && primary.get(r.phone as string) !== r.id) {
            status = 'dup_prospect';
            ref = primary.get(r.phone as string)!;
        }
        counts[status]++;
        await db.from('prospects').update({ dup_status: status, dup_ref: ref, dup_checked_at: now }).eq('id', r.id);
    });

    return { checked: list.length, counts };
}
