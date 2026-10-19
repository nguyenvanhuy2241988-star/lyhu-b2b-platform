export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getConnectedYouTubeAccounts, publishVideoToYouTube } from '@/lib/youtube';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, videoUrl, targetChannelIds, privacyStatus } = body;

        if (!title || !videoUrl) {
            return NextResponse.json({ error: 'Vui lòng cung cấp tiêu đề và đường dẫn video' }, { status: 400 });
        }

        const allAccounts = await getConnectedYouTubeAccounts();
        if (allAccounts.length === 0) {
            return NextResponse.json({ error: 'Chưa có kênh YouTube nào được kết nối' }, { status: 400 });
        }

        let targetAccounts = allAccounts;
        if (Array.isArray(targetChannelIds) && targetChannelIds.length > 0) {
            targetAccounts = allAccounts.filter(a => targetChannelIds.includes(a.channel_id));
        }

        if (targetAccounts.length === 0) {
            return NextResponse.json({ error: 'Không tìm thấy kênh YouTube phù hợp trong danh sách chọn' }, { status: 400 });
        }

        // Tải video binary 1 lần duy nhất cho toàn bộ các kênh
        let videoBuffer: Buffer;
        try {
            const dlRes = await fetch(videoUrl);
            if (!dlRes.ok) throw new Error(`Tải video lỗi: ${dlRes.status}`);
            videoBuffer = Buffer.from(await dlRes.arrayBuffer());
        } catch (fetchErr: any) {
            return NextResponse.json({ error: `Không thể tải video từ URL: ${fetchErr.message}` }, { status: 400 });
        }

        const results = [];

        for (const account of targetAccounts) {
            try {
                const res = await publishVideoToYouTube(account, {
                    title,
                    description,
                    videoUrl,
                    videoBuffer,
                    privacyStatus: privacyStatus || 'public'
                });
                results.push({
                    channel_id: account.channel_id,
                    title: account.title,
                    brand_tag: account.brand_tag,
                    success: true,
                    video_id: res.video_id,
                    url: res.url
                });
            } catch (err: any) {
                results.push({
                    channel_id: account.channel_id,
                    title: account.title,
                    brand_tag: account.brand_tag,
                    success: false,
                    error: err.message || 'Lỗi khi upload lên YouTube'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        if (successCount === 0) {
            return NextResponse.json({
                success: false,
                total: results.length,
                successCount: 0,
                results,
                error: results[0]?.error || 'Không đăng được lên kênh YouTube nào'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            total: results.length,
            successCount,
            results,
            message: `Đã đăng video thành công lên ${successCount}/${results.length} kênh YouTube Shorts!`
        });

    } catch (err: any) {
        console.error('YouTube publish route error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
