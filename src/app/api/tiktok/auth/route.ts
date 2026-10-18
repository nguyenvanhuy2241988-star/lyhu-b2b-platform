export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getTikTokAuthUrl, getTikTokAppConfig } from '@/lib/tiktok';

export async function GET(request: Request) {
    const { clientKey, redirectUri } = await getTikTokAppConfig();

    if (!clientKey) {
        return NextResponse.json(
            { error: 'Chưa cấu hình TIKTOK_CLIENT_KEY' },
            { status: 500 }
        );
    }

    const authUrl = getTikTokAuthUrl(clientKey, redirectUri);
    return NextResponse.redirect(authUrl);
}
