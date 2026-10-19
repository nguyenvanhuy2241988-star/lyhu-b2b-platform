export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { saveAppSecret } from '@/lib/settingsStore';
import { 
    publishVideoFromFileUpload, 
    refreshTikTokToken, 
    getTikTokAppConfig,
    getConnectedTikTokAccounts 
} from '@/lib/tiktok';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            title, 
            videoUrl, 
            privacyLevel, 
            disableComment, 
            disableDuet, 
            disableStitch,
            targetOpenIds 
        } = body;

        if (!title || !videoUrl) {
            return NextResponse.json(
                { error: 'Vui lòng cung cấp tiêu đề/caption (title) và đường dẫn video (videoUrl)' },
                { status: 400 }
            );
        }

        // 1. Lấy danh sách các tài khoản TikTok đã kết nối
        const allAccounts = await getConnectedTikTokAccounts();
        if (!allAccounts || allAccounts.length === 0) {
            return NextResponse.json(
                { error: 'Chưa có tài khoản TikTok nào được kết nối. Vui lòng kết nối kênh TikTok trước.' },
                { status: 401 }
            );
        }

        // 2. Lọc các kênh được chỉ định đăng (hoặc mặc định đăng toàn bộ nếu không lọc)
        let targetAccounts = allAccounts;
        if (Array.isArray(targetOpenIds) && targetOpenIds.length > 0) {
            targetAccounts = allAccounts.filter(acc => targetOpenIds.includes(acc.open_id));
            if (targetAccounts.length === 0) {
                return NextResponse.json(
                    { error: 'Không tìm thấy kênh TikTok nào phù hợp trong danh sách đã chọn.' },
                    { status: 400 }
                );
            }
        }

        const { clientKey, clientSecret } = await getTikTokAppConfig();

        // 3. Tải video binary 1 lần duy nhất vào bộ nhớ để phát đa kênh tiết kiệm tài nguyên
        let videoBuffer: Buffer;
        try {
            const videoRes = await fetch(videoUrl);
            if (!videoRes.ok) {
                throw new Error(`Tải video lỗi: ${videoRes.statusText} (${videoRes.status})`);
            }
            const arrayBuffer = await videoRes.arrayBuffer();
            videoBuffer = Buffer.from(arrayBuffer);
        } catch (fetchErr: any) {
            return NextResponse.json(
                { error: `Không thể tải file video từ URL: ${fetchErr.message}` },
                { status: 400 }
            );
        }

        // 4. Đăng song song hoặc tuần tự lên từng kênh
        let accountsChanged = false;
        const results = [];

        for (const account of targetAccounts) {
            let accessToken = account.access_token;

            // Tự động gia hạn Access Token nếu sắp hết hạn (còn dưới 5 phút)
            if (account.expires_at && Date.now() > account.expires_at - 300000) {
                if (account.refresh_token && clientKey && clientSecret) {
                    try {
                        const refreshed = await refreshTikTokToken(account.refresh_token, clientKey, clientSecret);
                        if (refreshed.access_token) {
                            accessToken = refreshed.access_token;
                            account.access_token = refreshed.access_token;
                            account.refresh_token = refreshed.refresh_token || account.refresh_token;
                            account.expires_at = Date.now() + (refreshed.expires_in || 86400) * 1000;
                            accountsChanged = true;
                        }
                    } catch (refreshErr) {
                        console.error(`Không thể gia hạn token cho kênh ${account.display_name}:`, refreshErr);
                    }
                }
            }

            try {
                const res = await publishVideoFromFileUpload(accessToken, {
                    title,
                    videoBuffer,
                    privacyLevel: privacyLevel || 'SELF_ONLY',
                    disableComment: !!disableComment,
                    disableDuet: !!disableDuet,
                    disableStitch: !!disableStitch
                });

                if (res.error && res.error.code !== 'ok') {
                    results.push({
                        open_id: account.open_id,
                        display_name: account.display_name,
                        avatar_url: account.avatar_url,
                        brand_tag: account.brand_tag,
                        success: false,
                        error: res.error.message || 'Lỗi khi gọi TikTok API',
                        details: res.error
                    });
                } else {
                    results.push({
                        open_id: account.open_id,
                        display_name: account.display_name,
                        avatar_url: account.avatar_url,
                        brand_tag: account.brand_tag,
                        success: true,
                        publish_id: res.data?.publish_id
                    });
                }
            } catch (err: any) {
                results.push({
                    open_id: account.open_id,
                    display_name: account.display_name,
                    avatar_url: account.avatar_url,
                    brand_tag: account.brand_tag,
                    success: false,
                    error: err.message || 'Lỗi gửi yêu cầu đăng video'
                });
            }
        }

        // Lưu lại token mới nếu có tài khoản vừa được làm mới
        if (accountsChanged) {
            await saveAppSecret('tiktok_accounts', allAccounts, undefined, 'Connected TikTok Multi-Channels List');
        }

        const successList = results.filter(r => r.success);
        const failList = results.filter(r => !r.success);

        if (successList.length === 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    total: results.length,
                    successCount: 0,
                    failCount: failList.length,
                    results,
                    error: failList[0]?.error || 'Đăng video thất bại lên tất cả kênh TikTok đã chọn.' 
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            total: results.length,
            successCount: successList.length,
            failCount: failList.length,
            results,
            message: `Đã gửi đăng thành công lên ${successList.length}/${results.length} kênh TikTok!`
        });

    } catch (err: any) {
        console.error('TikTok Publish API Error:', err);
        return NextResponse.json(
            { error: err.message || 'Lỗi máy chủ khi xử lý đăng video TikTok' },
            { status: 500 }
        );
    }
}
