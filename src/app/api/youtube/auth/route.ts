export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getYouTubeAuthUrl, getYouTubeAppConfig } from '@/lib/youtube';

export async function GET(request: Request) {
    try {
        const config = await getYouTubeAppConfig();
        if (!config.clientId || !config.clientSecret) {
            return NextResponse.redirect(
                new URL('/admin/short-videos?youtube_error=missing_credentials', request.url)
            );
        }

        const url = await getYouTubeAuthUrl();
        return NextResponse.redirect(url);
    } catch (err: any) {
        console.error('YouTube Auth Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
