export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAppSecret, saveAppSecret } from '@/lib/settingsStore';
import { publishVideoFromFileUpload, publishVideoFromUrl, refreshTikTokToken, getTikTokAppConfig } from '@/lib/tiktok';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, videoUrl, privacyLevel, disableComment, disableDuet, disableStitch } = body;

        if (!title || !videoUrl) {
            return NextResponse.json(
                { error: 'Vui lòng cung cấp tiêu đề (title) và đường dẫn video công khai (videoUrl)' },
                { status: 400 }
            );
        }

        // 1. Lấy thông tin xác thực TikTok đã lưu
        const creds = await getAppSecret('tiktok_credentials');
        if (!creds || !creds.access_token) {
            return NextResponse.json(
                { error: 'Chưa kết nối tài khoản TikTok. Vui lòng bấm vào nút kết nối kênh TikTok trước.' },
                { status: 401 }
            );
        }

        let accessToken = creds.access_token;
        const { clientKey, clientSecret } = await getTikTokAppConfig();

        // 2. Tự động gia hạn Access Token nếu sắp hết hạn (còn dưới 5 phút)
        if (creds.expires_at && Date.now() > creds.expires_at - 300000) {
            if (creds.refresh_token && clientKey && clientSecret) {
                try {
                    const refreshed = await refreshTikTokToken(creds.refresh_token, clientKey, clientSecret);
                    if (refreshed.access_token) {
                        accessToken = refreshed.access_token;
                        creds.access_token = refreshed.access_token;
                        creds.refresh_token = refreshed.refresh_token || creds.refresh_token;
                        creds.expires_at = Date.now() + (refreshed.expires_in || 86400) * 1000;
                        await saveAppSecret('tiktok_credentials', creds, undefined, 'TikTok Creator OAuth Credentials');
                    }
                } catch (refreshErr) {
                    console.error('Không thể tự động gia hạn token TikTok:', refreshErr);
                }
            }
        }

        // 3. Đăng video qua Direct Post API v2 (dùng binary FILE_UPLOAD để không phụ thuộc domain verification)
        const result = await publishVideoFromFileUpload(accessToken, {
            title,
            videoUrl,
            privacyLevel: privacyLevel || 'PUBLIC_TO_EVERYONE',
            disableComment: !!disableComment,
            disableDuet: !!disableDuet,
            disableStitch: !!disableStitch
        });

        if (result.error && result.error.code !== 'ok') {
            return NextResponse.json(
                { error: result.error.message || 'Lỗi khi gọi TikTok API', details: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            publish_id: result.data?.publish_id,
            message: 'Đã gửi yêu cầu đăng video lên TikTok thành công!'
        });
    } catch (err: any) {
        console.error('TikTok Publish API Error:', err);
        return NextResponse.json(
            { error: err.message || 'Lỗi máy chủ khi đăng video' },
            { status: 500 }
        );
    }
}
