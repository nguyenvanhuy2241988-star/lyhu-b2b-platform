export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { exchangeCodeForTikTokToken, getTikTokUserInfo, DEFAULT_TIKTOK_CLIENT_KEY, DEFAULT_TIKTOK_CLIENT_SECRET, DEFAULT_TIKTOK_REDIRECT_URI } from '@/lib/tiktok';
import { saveAppSecret } from '@/lib/settingsStore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const baseUrl = 'https://www.lyhu.com.vn';
    const redirectUri = DEFAULT_TIKTOK_REDIRECT_URI;
    const targetRedirect = `${baseUrl}/admin/short-videos`;

    if (error) {
        console.error('TikTok Auth Error:', error, errorDescription);
        return NextResponse.redirect(`${targetRedirect}?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code) {
        return NextResponse.redirect(`${targetRedirect}?error=Missing_Auth_Code`);
    }

    const clientKey = DEFAULT_TIKTOK_CLIENT_KEY;
    const clientSecret = DEFAULT_TIKTOK_CLIENT_SECRET;

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
