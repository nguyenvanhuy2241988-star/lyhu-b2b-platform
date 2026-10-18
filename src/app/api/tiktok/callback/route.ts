export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { exchangeCodeForTikTokToken, getTikTokUserInfo } from '@/lib/tiktok';
import { getAppSecret, saveAppSecret } from '@/lib/settingsStore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://www.lyhu.com.vn';
    let redirectUri = process.env.TIKTOK_REDIRECT_URI || `${baseUrl}/api/tiktok/callback`;
    const targetRedirect = `${baseUrl}/admin/short-videos`;

    if (error) {
        console.error('TikTok Auth Error:', error, errorDescription);
        return NextResponse.redirect(`${targetRedirect}?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code) {
        return NextResponse.redirect(`${targetRedirect}?error=Missing_Auth_Code`);
    }

    let clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    let clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';

    if (!clientKey || !clientSecret) {
        const config = await getAppSecret('tiktok_config');
        if (config?.client_key && config?.client_secret) {
            clientKey = config.client_key;
            clientSecret = config.client_secret;
            if (config.redirect_uri) redirectUri = config.redirect_uri;
        }
    }

    if (!clientKey || !clientSecret) {
        return NextResponse.json(
            { error: 'Thiếu cấu hình TIKTOK_CLIENT_KEY hoặc TIKTOK_CLIENT_SECRET' },
            { status: 500 }
        );
    }

    try {
        // 1. Đổi authorization code lấy Token
        const tokenData = await exchangeCodeForTikTokToken(code, clientKey, clientSecret, redirectUri);

        if (tokenData.error || !tokenData.access_token) {
            console.error('Lỗi khi đổi token TikTok:', tokenData);
            return NextResponse.redirect(
                `${targetRedirect}?error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Token_Exchange_Failed')}`
            );
        }

        // 2. Lấy thông tin kênh TikTok
        let userInfo: any = null;
        try {
            const userRes = await getTikTokUserInfo(tokenData.access_token);
            if (userRes?.data?.user) {
                userInfo = userRes.data.user;
            }
        } catch (e) {
            console.warn('Không lấy được profile TikTok:', e);
        }

        // 3. Lưu thông tin xác thực vào app_secrets
        const credentials = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            open_id: tokenData.open_id,
            expires_at: Date.now() + (tokenData.expires_in || 86400) * 1000,
            refresh_expires_at: Date.now() + (tokenData.refresh_expires_in || 31536000) * 1000,
            scope: tokenData.scope,
            user_info: userInfo,
            connected_at: new Date().toISOString()
        };

        await saveAppSecret('tiktok_credentials', credentials, undefined, 'TikTok Creator OAuth Credentials');

        return NextResponse.redirect(`${targetRedirect}?tiktok_connected=true`);
    } catch (err: any) {
        console.error('TikTok Callback Exception:', err);
        return NextResponse.redirect(`${targetRedirect}?error=${encodeURIComponent(err.message || 'Unknown_Error')}`);
    }
}
