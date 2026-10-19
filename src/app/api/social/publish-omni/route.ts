export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { 
    getConnectedTikTokAccounts, 
    publishVideoFromFileUpload, 
    refreshTikTokToken, 
    getTikTokAppConfig, 
    saveTikTokAccount 
} from '@/lib/tiktok';
import { 
    getConnectedFacebookPages, 
    publishVideoToFacebookPage 
} from '@/lib/facebookPublisher';
import { 
    getConnectedYouTubeAccounts, 
    publishVideoToYouTube 
} from '@/lib/youtube';

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
            tiktokOpenIds = [],
            facebookPageIds = [],
            youtubeChannelIds = []
        } = body;

        if (!title || !videoUrl) {
            return NextResponse.json({ error: 'Thiếu tiêu đề hoặc đường dẫn video' }, { status: 400 });
        }

        const totalSelected = tiktokOpenIds.length + facebookPageIds.length + youtubeChannelIds.length;
        if (totalSelected === 0) {
            return NextResponse.json({ error: 'Vui lòng chọn ít nhất 1 kênh mạng xã hội để phát sóng' }, { status: 400 });
        }

        // 1. Tải video binary 1 lần duy nhất vào RAM
        let videoBuffer: Buffer;
        try {
            const dlRes = await fetch(videoUrl);
            if (!dlRes.ok) throw new Error(`Lỗi tải video từ CDN: ${dlRes.status}`);
            videoBuffer = Buffer.from(await dlRes.arrayBuffer());
        } catch (fetchErr: any) {
            return NextResponse.json({ error: `Không thể tải file video: ${fetchErr.message}` }, { status: 400 });
        }

        const overallResults: {
            tiktok: any[];
            facebook: any[];
            youtube: any[];
        } = {
            tiktok: [],
            facebook: [],
            youtube: []
        };

        // 2. PHÁT SÓNG LÊN TIKTOK
        if (tiktokOpenIds.length > 0) {
            const allTiktok = await getConnectedTikTokAccounts();
            const targetTiktok = allTiktok.filter(a => tiktokOpenIds.includes(a.open_id));
            const { clientKey, clientSecret } = await getTikTokAppConfig();

            for (const acc of targetTiktok) {
                let token = acc.access_token;
                if (acc.expires_at && Date.now() > acc.expires_at - 300000 && acc.refresh_token) {
                    try {
                        const refreshed = await refreshTikTokToken(acc.refresh_token, clientKey, clientSecret);
                        if (refreshed.access_token) {
                            token = refreshed.access_token;
                            acc.access_token = refreshed.access_token;
                            if (refreshed.refresh_token) acc.refresh_token = refreshed.refresh_token;
                            acc.expires_at = Date.now() + (refreshed.expires_in || 86400) * 1000;
                            await saveTikTokAccount(acc);
                        }
                    } catch (e) {
                        console.error('TikTok refresh token error:', e);
                    }
                }

                try {
                    const res = await publishVideoFromFileUpload(token, {
                        title,
                        videoBuffer,
                        privacyLevel: privacyLevel || 'SELF_ONLY',
                        disableComment: !!disableComment,
                        disableDuet: !!disableDuet,
                        disableStitch: !!disableStitch
                    });

                    if (res.error && res.error.code !== 'ok') {
                        overallResults.tiktok.push({
                            platform: 'tiktok',
                            channel_id: acc.open_id,
                            name: acc.display_name,
                            avatar_url: acc.avatar_url,
                            brand_tag: acc.brand_tag,
                            success: false,
                            error: res.error.message || 'Lỗi khi gọi TikTok API'
                        });
                    } else {
                        overallResults.tiktok.push({
                            platform: 'tiktok',
                            channel_id: acc.open_id,
                            name: acc.display_name,
                            avatar_url: acc.avatar_url,
                            brand_tag: acc.brand_tag,
                            success: true,
                            publish_id: res.data?.publish_id
                        });
                    }
                } catch (err: any) {
                    overallResults.tiktok.push({
                        platform: 'tiktok',
                        channel_id: acc.open_id,
                        name: acc.display_name,
                        avatar_url: acc.avatar_url,
                        brand_tag: acc.brand_tag,
                        success: false,
                        error: err.message
                    });
                }
            }
        }

        // 3. PHÁT SÓNG LÊN FACEBOOK PAGES
        if (facebookPageIds.length > 0) {
            const allFb = await getConnectedFacebookPages();
            const targetFb = allFb.filter(p => facebookPageIds.includes(p.page_id));

            for (const fbPage of targetFb) {
                try {
                    const res = await publishVideoToFacebookPage(fbPage.page_id, {
                        title,
                        description: title,
                        videoUrl,
                        videoBuffer
                    });
                    overallResults.facebook.push({
                        platform: 'facebook',
                        channel_id: fbPage.page_id,
                        name: fbPage.name,
                        avatar_url: fbPage.avatar_url,
                        brand_tag: fbPage.brand_tag,
                        success: res.success,
                        post_id: res.post_id,
                        error: res.error
                    });
                } catch (err: any) {
                    overallResults.facebook.push({
                        platform: 'facebook',
                        channel_id: fbPage.page_id,
                        name: fbPage.name,
                        avatar_url: fbPage.avatar_url,
                        brand_tag: fbPage.brand_tag,
                        success: false,
                        error: err.message
                    });
                }
            }
        }

        // 4. PHÁT SÓNG LÊN YOUTUBE SHORTS
        if (youtubeChannelIds.length > 0) {
            const allYt = await getConnectedYouTubeAccounts();
            const targetYt = allYt.filter(a => youtubeChannelIds.includes(a.channel_id));

            for (const ytAcc of targetYt) {
                try {
                    const res = await publishVideoToYouTube(ytAcc, {
                        title,
                        videoUrl,
                        videoBuffer,
                        privacyStatus: 'public'
                    });
                    overallResults.youtube.push({
                        platform: 'youtube',
                        channel_id: ytAcc.channel_id,
                        name: ytAcc.title,
                        avatar_url: ytAcc.avatar_url,
                        brand_tag: ytAcc.brand_tag,
                        success: true,
                        video_id: res.video_id,
                        url: res.url
                    });
                } catch (err: any) {
                    overallResults.youtube.push({
                        platform: 'youtube',
                        channel_id: ytAcc.channel_id,
                        name: ytAcc.title,
                        avatar_url: ytAcc.avatar_url,
                        brand_tag: ytAcc.brand_tag,
                        success: false,
                        error: err.message
                    });
                }
            }
        }

        // 5. Tổng kết kết quả phát sóng
        const allFlat = [
            ...overallResults.tiktok,
            ...overallResults.facebook,
            ...overallResults.youtube
        ];
        const successCount = allFlat.filter(r => r.success).length;
        const total = allFlat.length;

        if (successCount === 0) {
            return NextResponse.json({
                success: false,
                total,
                successCount: 0,
                results: overallResults,
                error: allFlat[0]?.error || 'Không đăng được lên kênh nào'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            total,
            successCount,
            results: overallResults,
            message: `🎉 Đã phát sóng thành công lên ${successCount}/${total} kênh (TikTok • Facebook • YouTube)!`
        });

    } catch (err: any) {
        console.error('Omni Publish API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
