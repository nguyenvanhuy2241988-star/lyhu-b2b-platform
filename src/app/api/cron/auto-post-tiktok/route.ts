export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getAppSecret, saveAppSecret } from '@/lib/settingsStore';
import { publishVideoFromFileUpload, publishVideoFromUrl, refreshTikTokToken, getTikTokAppConfig } from '@/lib/tiktok';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        // 1. Kiểm tra tài khoản TikTok đã kết nối chưa
        const creds = await getAppSecret('tiktok_credentials');
        if (!creds || !creds.access_token) {
            return NextResponse.json({ message: 'TikTok chưa được kết nối' }, { status: 400 });
        }

        let accessToken = creds.access_token;
        const { clientKey, clientSecret } = await getTikTokAppConfig();

        // Tự động refresh token nếu cần
        if (creds.expires_at && Date.now() > creds.expires_at - 300000) {
            if (creds.refresh_token && clientKey && clientSecret) {
                try {
                    const refreshed = await refreshTikTokToken(creds.refresh_token, clientKey, clientSecret);
                    if (refreshed.access_token) {
                        accessToken = refreshed.access_token;
                        creds.access_token = refreshed.access_token;
                        creds.refresh_token = refreshed.refresh_token || creds.refresh_token;
                        creds.expires_at = Date.now() + (refreshed.expires_in || 86400) * 1000;
                        await saveAppSecret('tiktok_credentials', creds, undefined, 'TikTok Auto Refreshed Credentials');
                    }
                } catch (e) {
                    console.error('Không thể tự động gia hạn token TikTok:', e);
                }
            }
        }

        // 2. Lấy 1 video đang bật (is_active) và chưa đăng TikTok (nếu có cột) hoặc theo thứ tự
        const { data: videos, error: videoError } = await supabase
            .from('wholesale_short_videos')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(1);

        if (videoError || !videos || videos.length === 0) {
            return NextResponse.json({ message: 'Không có video nào sẵn sàng để đăng.' });
        }

        const video = videos[0];
        const caption = `${video.title}\n\n#LYHU #NhaPhanPhoi #KinhDoanh #Shorts`;

        // 3. Đăng video lên TikTok (dùng binary FILE_UPLOAD)
        const result = await publishVideoFromFileUpload(accessToken, {
            title: caption,
            videoUrl: video.video_url,
            privacyLevel: 'PUBLIC_TO_EVERYONE'
        });

        if (result.error && result.error.code !== 'ok') {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            video_title: video.title,
            publish_id: result.data?.publish_id,
            message: 'Đã lên lịch đăng tự động video lên TikTok thành công!'
        });
    } catch (err: any) {
        console.error('Auto post TikTok Cron Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
