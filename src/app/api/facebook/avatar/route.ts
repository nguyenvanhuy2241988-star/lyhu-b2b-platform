export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Proxy Facebook avatar to avoid CORS/auth issues in browser
export async function GET(req: Request) {
    const url = new URL(req.url);
    const psid = url.searchParams.get('psid');
    const pageId = url.searchParams.get('page_id'); // Facebook page_id (not UUID)

    if (!psid || !pageId) {
        return new NextResponse('Missing psid or page_id', { status: 400 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get page access token
        const { data: page } = await supabase
            .from('facebook_pages')
            .select('access_token')
            .eq('page_id', pageId)
            .single();

        if (!page?.access_token) {
            return new NextResponse('Page not found', { status: 404 });
        }

        // Fetch avatar from Facebook
        const fbUrl = `https://graph.facebook.com/v21.0/${psid}/picture?type=large&access_token=${page.access_token}`;
        const fbRes = await fetch(fbUrl, { redirect: 'follow' });

        if (!fbRes.ok) {
            // Return default avatar
            return NextResponse.redirect(`https://ui-avatars.com/api/?name=${psid}&background=random&size=200`);
        }

        const contentType = fbRes.headers.get('content-type') || 'image/jpeg';
        const buffer = await fbRes.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache 24h
            },
        });
    } catch (e) {
        return NextResponse.redirect(`https://ui-avatars.com/api/?name=${psid}&background=random&size=200`);
    }
}

