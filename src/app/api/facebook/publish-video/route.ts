export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getConnectedFacebookPages, publishVideoToFacebookPage } from '@/lib/facebookPublisher';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, videoUrl, targetPageIds } = body;

        if (!title || !videoUrl) {
            return NextResponse.json({ error: 'Vui lòng cung cấp tiêu đề và đường dẫn video' }, { status: 400 });
        }

        const allPages = await getConnectedFacebookPages();
        if (allPages.length === 0) {
            return NextResponse.json({ error: 'Chưa có Fanpage Facebook nào được liên kết.' }, { status: 400 });
        }

        let targetPages = allPages;
        if (Array.isArray(targetPageIds) && targetPageIds.length > 0) {
            targetPages = allPages.filter(p => targetPageIds.includes(p.page_id));
        }

        if (targetPages.length === 0) {
            return NextResponse.json({ error: 'Không tìm thấy trang Facebook nào phù hợp' }, { status: 400 });
        }

        const results = [];

        for (const page of targetPages) {
            try {
                const res = await publishVideoToFacebookPage(page.page_id, {
                    title,
                    description: description || title,
                    videoUrl
                });
                results.push({
                    page_id: page.page_id,
                    name: page.name,
                    brand_tag: page.brand_tag,
                    success: res.success,
                    post_id: res.post_id,
                    error: res.error
                });
            } catch (err: any) {
                results.push({
                    page_id: page.page_id,
                    name: page.name,
                    brand_tag: page.brand_tag,
                    success: false,
                    error: err.message
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
                error: results[0]?.error || 'Không đăng được lên Fanpage nào'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            total: results.length,
            successCount,
            results,
            message: `Đã đăng video thành công lên ${successCount}/${results.length} Fanpage Facebook!`
        });

    } catch (err: any) {
        console.error('Facebook publish video route error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
