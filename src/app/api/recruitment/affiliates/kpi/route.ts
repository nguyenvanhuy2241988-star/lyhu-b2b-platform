import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
    const cookieStore = cookies();
    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
        },
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const supabase = getSupabase();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        
        const { data, error } = await supabase
            .from('affiliate_kpi_settings')
            .upsert({
                user_id: body.user_id,
                found_target: body.found_target,
                contacted_target: body.contacted_target,
                won_target: body.won_target,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
