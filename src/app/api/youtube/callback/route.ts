export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getYouTubeOAuthClient, saveYouTubeAccount } from '@/lib/youtube';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        console.error('Google OAuth Error:', error);
        return NextResponse.redirect(new URL('/admin/short-videos?youtube_error=' + encodeURIComponent(error), request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/admin/short-videos?youtube_error=missing_code', request.url));
    }

    try {
        const oauth2Client = await getYouTubeOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        if (!tokens.access_token) {
            throw new Error('Google OAuth không trả về access_token');
        }

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        // Lấy thông tin kênh YouTube của tài khoản vừa đăng nhập
        const channelRes = await youtube.channels.list({
            part: ['snippet'],
            mine: true
        });

        const items = channelRes.data.items;
        if (!items || items.length === 0) {
            throw new Error('Tài khoản Google này chưa tạo kênh YouTube nào. Vui lòng tạo kênh trước khi liên kết.');
        }

        const channel = items[0];
        const snippet = channel.snippet;

        await saveYouTubeAccount({
            channel_id: channel.id || `yt_${Date.now()}`,
            title: snippet?.title || 'Kênh YouTube',
            description: snippet?.description || '',
            custom_url: snippet?.customUrl || '',
            avatar_url: snippet?.thumbnails?.default?.url || snippet?.thumbnails?.high?.url || '',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || '',
            expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
            connected_at: new Date().toISOString(),
            brand_tag: 'Tất cả'
        });

        return NextResponse.redirect(new URL('/admin/short-videos?youtube_connected=1', request.url));

    } catch (err: any) {
        console.error('YouTube Callback Exception:', err);
        return NextResponse.redirect(
            new URL('/admin/short-videos?youtube_error=' + encodeURIComponent(err.message || 'Lỗi xác thực YouTube'), request.url)
        );
    }
}
