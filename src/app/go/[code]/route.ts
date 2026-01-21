import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this runs on every request

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
    const code = params.code;

    if (!code) {
        return new NextResponse('Missing code', { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase env vars');
        return new NextResponse('Configuration Error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Call the secure RPC function to track click and get URL
        const { data: originalUrl, error } = await supabase
            .rpc('track_click_and_get_url', { p_code: code });

        if (error) {
            console.error('Tracking Error:', error);
            return NextResponse.redirect(new URL('/', request.url)); // Fail safe
        }

        if (!originalUrl) {
            return new NextResponse('Link not found', { status: 404 });
        }

        // Redirect to original URL
        return NextResponse.redirect(originalUrl, 307);

    } catch (err) {
        console.error('Redirect Exception:', err);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
