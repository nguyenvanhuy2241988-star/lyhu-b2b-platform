import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Revalidate every 0 seconds so this route is not cached
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ref, url, userAgent } = body;

        if (!ref) {
            return NextResponse.json({ error: 'Missing ref code' }, { status: 400 });
        }

        // Tìm kiếm Affiliate ID từ mã Code
        const { data: affiliate, error: fetchError } = await supabase
            .from('affiliate_profiles')
            .select('id, status')
            .eq('affiliate_code', ref)
            .single();

        if (fetchError || !affiliate) {
            return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
        }

        if (affiliate.status !== 'active') {
            return NextResponse.json({ message: 'Affiliate is not active' }, { status: 200 });
        }

        // Lấy IP
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

        // Ghi log click
        await supabase
            .from('affiliate_clicks')
            .insert([{
                affiliate_id: affiliate.id,
                url_clicked: url || 'Unknown',
                ip_address: ip,
                user_agent: userAgent || 'Unknown'
            }]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Track Click Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
