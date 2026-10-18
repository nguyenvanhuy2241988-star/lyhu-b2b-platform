export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getTikTokAuthUrl, DEFAULT_TIKTOK_CLIENT_KEY, DEFAULT_TIKTOK_REDIRECT_URI } from '@/lib/tiktok';

export async function GET(request: Request) {
    const clientKey = DEFAULT_TIKTOK_CLIENT_KEY;
    const redirectUri = DEFAULT_TIKTOK_REDIRECT_URI;

    if (!clientKey) {
        return NextResponse.json(
            { error: 'Chưa cấu hình TIKTOK_CLIENT_KEY' },
            { status: 500 }
        );
    }

    const authUrl = getTikTokAuthUrl(clientKey, redirectUri);
    return NextResponse.redirect(authUrl);
}
