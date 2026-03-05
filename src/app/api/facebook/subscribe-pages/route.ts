import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false } }
        );

        const { data: pages, error } = await supabase
            .from('facebook_pages')
            .select('page_id, name, access_token')
            .eq('is_connected', true);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const results = [];

        for (const page of (pages || [])) {
            const url = `https://graph.facebook.com/v19.0/${page.page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,message_echoes&access_token=${page.access_token}`;

            try {
                const res = await fetch(url, { method: 'POST' });
                const data = await res.json();
                results.push({ name: page.name, page_id: page.page_id, success: !!data.success, error: data.error?.message });
            } catch (e: any) {
                results.push({ name: page.name, page_id: page.page_id, success: false, error: e.message });
            }
        }

        return NextResponse.json({ total: results.length, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
