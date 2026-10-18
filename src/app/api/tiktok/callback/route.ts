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
        const tokenRes: any = await exchangeCodeForTikTokToken(code, clientKey, clientSecret, redirectUri);

        const accessToken = tokenRes?.data?.access_token || tokenRes?.access_token;
        const refreshToken = tokenRes?.data?.refresh_token || tokenRes?.refresh_token;
        const openId = tokenRes?.data?.open_id || tokenRes?.open_id;
        const expiresIn = tokenRes?.data?.expires_in || tokenRes?.expires_in || 86400;
        const refreshExpiresIn = tokenRes?.data?.refresh_expires_in || tokenRes?.refresh_expires_in || 31536000;
        const scope = tokenRes?.data?.scope || tokenRes?.scope || '';

        if (!accessToken || tokenRes.error) {
            console.error('Lỗi khi đổi token TikTok:', tokenRes);
            const errMsg = tokenRes.error_description || tokenRes.error || tokenRes.message || 'Token_Exchange_Failed';
            return NextResponse.redirect(`${targetRedirect}?error=${encodeURIComponent(errMsg)}&from_callback=1`);
        }

        // 2. Lấy thông tin kênh TikTok
        let userInfo: any = null;
        try {
            const userRes = await getTikTokUserInfo(accessToken);
            if (userRes?.data?.user) {
                userInfo = userRes.data.user;
            }
        } catch (e) {
            console.warn('Không lấy được profile TikTok:', e);
        }

        // 3. Lưu thông tin xác thực vào app_secrets
        const credentials = {
            access_token: accessToken,
            refresh_token: refreshToken,
            open_id: openId,
            expires_at: Date.now() + expiresIn * 1000,
            refresh_expires_at: Date.now() + refreshExpiresIn * 1000,
            scope: scope,
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
