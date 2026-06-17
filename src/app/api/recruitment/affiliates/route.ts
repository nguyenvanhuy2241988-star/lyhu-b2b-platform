import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: Request) {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
            .from('affiliate_partners')
            .select(`
                *,
                hr_in_charge:profiles(id, full_name, email)
            `)
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
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
            .from('affiliate_partners')
            .insert([body])
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

        const supabase = createClient(supabaseUrl, supabaseKey);
        
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
