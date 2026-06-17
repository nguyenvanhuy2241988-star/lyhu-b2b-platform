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

export async function GET(req: Request) {
    try {
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from('affiliate_partners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const supabase = getSupabase();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        
        const insertData = { ...body, hr_in_charge: user.id };

        const { data, error } = await supabase
            .from('affiliate_partners')
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        
        if (!id) {
            return NextResponse.json({ error: 'Missing partner ID' }, { status: 400 });
        }

        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from('affiliate_partners')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
