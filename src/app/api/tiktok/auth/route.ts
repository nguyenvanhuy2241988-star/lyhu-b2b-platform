export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getTikTokAuthUrl } from '@/lib/tiktok';
import { getAppSecret } from '@/lib/settingsStore';

export async function GET(request: Request) {
    let clientKey = process.env.TIKTOK_CLIENT_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://www.lyhu.com.vn';
    let redirectUri = process.env.TIKTOK_REDIRECT_URI || `${baseUrl}/api/tiktok/callback`;

    if (!clientKey) {
        const config = await getAppSecret('tiktok_config');
        if (config?.client_key) {
            clientKey = config.client_key;
            if (config.redirect_uri) redirectUri = config.redirect_uri;
        }
    }

    if (!clientKey) {
        return NextResponse.json(
            { error: 'Chưa cấu hình TIKTOK_CLIENT_KEY' },
            { status: 500 }
        );
    }

    const authUrl = getTikTokAuthUrl(clientKey, redirectUri);
    return NextResponse.redirect(authUrl);
}
