export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getTikTokAuthUrl } from '@/lib/tiktok';

export async function GET(request: Request) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://lyhu.com.vn';
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${baseUrl}/api/tiktok/callback`;

    if (!clientKey) {
        return NextResponse.json(
            { error: 'Chưa cấu hình TIKTOK_CLIENT_KEY trong biến môi trường (.env.local)' },
            { status: 500 }
        );
    }

    const authUrl = getTikTokAuthUrl(clientKey, redirectUri);
    return NextResponse.redirect(authUrl);
}
