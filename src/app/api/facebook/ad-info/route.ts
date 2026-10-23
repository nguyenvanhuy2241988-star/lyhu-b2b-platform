export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdsInfo } from '@/lib/fbAdsServer';

/** POST { ad_ids: string[], force?: boolean } → { ads: Record<ad_id, FbAdInfo> } */
export async function POST(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Chỉ người dùng đã đăng nhập LYHU mới được gọi (tránh bị dùng làm proxy Graph API)
        const jwt = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { data: { user } } = await supabase.auth.getUser(jwt);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const adIds: string[] = Array.isArray(body.ad_ids) ? body.ad_ids.slice(0, 200).map(String) : [];
        const ads = await getAdsInfo(supabase, adIds, { force: Boolean(body.force) });
        return NextResponse.json({ ads, has_token: Boolean(process.env.FB_ADS_ACCESS_TOKEN) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
