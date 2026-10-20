import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishVideoToFacebookPage } from '@/lib/facebookPublisher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Ánh xạ thương hiệu / category sang tên Fanpage tương ứng
const CATEGORY_TO_PAGE_MAP: Record<string, string> = {
    'lyhu': 'LYHU',
    'boyo': 'BOYO Comics',
    'cvt': 'CVT - Tuyệt Phẩm Khoai Môn',
    'fmcg': 'Chuyển động FMCG 247',
    'uhi': 'UHi Việt Nam'
};

export async function GET(req: Request) {
    try {
        // 1. Tìm 1 video mới nhất chưa được đăng lên Facebook
        const { data: videos, error: videoError } = await supabase
            .from('wholesale_short_videos')
            .select('*')
            .eq('is_active', true)
            .is('youtube_posted_at', null)
            .order('created_at', { ascending: true }) // Đăng tuần tự video cũ trước
            .limit(1);

        if (videoError) {
            console.error('[AutoPostVideo] Lỗi truy vấn video:', videoError);
            return NextResponse.json({ error: 'Lỗi truy vấn video từ Database' }, { status: 500 });
        }

        if (!videos || videos.length === 0) {
            return NextResponse.json({ message: 'Không còn video nào chưa đăng trong kho.' });
        }

        const video = videos[0];
        const category = (video.category || 'lyhu').toLowerCase();
        const targetPageName = CATEGORY_TO_PAGE_MAP[category] || 'LYHU';

        // 2. Lấy thông tin Fanpage đích
        const { data: pages, error: pageError } = await supabase
            .from('facebook_pages')
            .select('page_id, name, access_token')
            .ilike('name', `%${targetPageName}%`)
            .eq('is_connected', true)
            .limit(1);

        if (pageError || !pages || pages.length === 0) {
            console.error(`[AutoPostVideo] Không tìm thấy Fanpage ${targetPageName}:`, pageError);
            return NextResponse.json({ error: `Không tìm thấy Fanpage ${targetPageName}` }, { status: 500 });
        }

        const page = pages[0];

        // 3. Chuẩn bị nội dung Caption
        const title = video.title || 'Video chia sẻ từ LYHU';
        const description = video.caption || title;

        // 4. Tiến hành phát sóng video lên Fanpage qua Meta Graph API
        console.log(`[AutoPostVideo] Đang đăng video: "${title}" lên Fanpage: ${page.name}...`);
        const result = await publishVideoToFacebookPage(page.page_id, {
            title,
            description,
            videoUrl: video.video_url
        });

        if (!result.success) {
            console.error('[AutoPostVideo] Đăng video thất bại:', result.error);
            return NextResponse.json({ 
                error: 'Đăng video lên Facebook thất bại', 
                details: result.error,
                video_id: video.id 
            }, { status: 500 });
        }

        // 5. Cập nhật trạng thái video đã được xuất bản
        const now = new Date().toISOString();
        await supabase
            .from('wholesale_short_videos')
            .update({
                youtube_posted_at: now,
                youtube_video_id: `fb_${result.post_id || 'success'}`
            })
            .eq('id', video.id);

        console.log(`[AutoPostVideo] Đăng video thành công! Post ID: ${result.post_id}`);

        return NextResponse.json({
            message: 'Đăng video lên Fanpage thành công!',
            video_id: video.id,
            video_title: title,
            page_name: page.name,
            facebook_post_id: result.post_id,
            posted_at: now
        });

    } catch (error: any) {
        console.error('[AutoPostVideo] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
