import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Revalidate every 0 seconds so this route is not cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        // Only allow execution via Cron or valid authorization
        const authHeader = req.headers.get('authorization');
        // In production, you might want to secure this with a cron secret:
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

        // 1. Lấy Fanpage ID và Token của "Chuyển động FMCG 247"
        const { data: pages, error: pageError } = await supabase
            .from('facebook_pages')
            .select('page_id, access_token, name')
            .ilike('name', '%FMCG 247%')
            .limit(1);

        if (pageError || !pages || pages.length === 0) {
            console.error('Không tìm thấy Fanpage FMCG 247 hoặc lỗi:', pageError);
            return NextResponse.json({ error: 'Không tìm thấy cấu hình Fanpage' }, { status: 500 });
        }

        const page = pages[0];

        // 2. Tìm 1 bài viết mới nhất chưa được chia sẻ
        const { data: posts, error: postError } = await supabase
            .from('blog_posts')
            .select(`
                id, title, slug, ai_summary, meta_title, keywords, thumbnail_url,
                category:blog_categories(slug)
            `)
            .eq('status', 'published')
            .eq('is_fb_shared', false)
            .order('published_at', { ascending: true }) // Ưu tiên đăng bài cũ trước nếu có tồn đọng
            .limit(1) as { data: any[] | null; error: any };

        if (postError) {
            console.error('Lỗi khi lấy bài viết:', postError);
            return NextResponse.json({ error: 'Lỗi Database' }, { status: 500 });
        }

        if (!posts || posts.length === 0) {
            return NextResponse.json({ message: 'Không có bài viết mới nào cần chia sẻ.' });
        }

        const post: any = posts[0];
        const categorySlug = Array.isArray(post.category) ? post.category[0]?.slug : post.category?.slug;

        // 3. Phân loại bài viết
        // Danh sách các danh mục thuộc loại "Tin Tức / Báo Cáo" (Sẽ đăng dạng Link Preview chuẩn báo chí)
        const newsCategories = ['tin-tuc-fmcg', 'bao-cao-thi-truong', 'doanh-nghiep-lon', 'xu-huong-tieu-dung', 'nganh-hang'];
        const isNews = newsCategories.includes(categorySlug);

        // 4. Chuẩn bị nội dung Caption
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu-b2b-platform.vercel.app';
        const postUrl = `${baseUrl}/tin-tuc/${post.slug}`;
        
        // Tạo Hashtags từ keywords
        let hashtagsStr = '#FMCG #ChuyenDongFMCG #LYHU';
        if (post.keywords) {
            const keys = post.keywords.split(',').map((k: string) => k.trim().replace(/\s+/g, ''));
            const extraHashtags = keys.filter((k: string) => k).map((k: string) => `#${k}`).join(' ');
            if (extraHashtags) {
                hashtagsStr += ` ${extraHashtags}`;
            }
        }

        const caption = isNews 
            ? `${post.title}\n\n${post.ai_summary || post.meta_title || ''}\n\n${hashtagsStr}`
            : `${post.title}\n\n${post.ai_summary || post.meta_title || ''}\n\n👉 Xem chi tiết tại: ${postUrl}\n\n${hashtagsStr}`;

        // 5. Force Facebook Scrape (Ép Facebook lấy OpenGraph mới nhất để không bị mất ảnh)
        try {
            await fetch(`https://graph.facebook.com/v20.0/?id=${encodeURIComponent(postUrl)}&scrape=true&access_token=${page.access_token}`, {
                method: 'POST'
            });
            // Đợi 2s để Facebook update cache
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.error('Lỗi khi ép Facebook scrape URL:', e);
        }

        // 6. Gọi Graph API đăng bài
        let facebookApiUrl = `https://graph.facebook.com/v20.0/${page.page_id}/feed`;
        const formData = new URLSearchParams();
        
        if (isNews) {
            // Đăng dưới dạng Link Preview (Click vào ảnh ra web, chuẩn báo chí)
            formData.append('message', caption);
            formData.append('link', postUrl);
        } else if (post.thumbnail_url) {
            // Đăng dưới dạng Photo Post (1 Ảnh kèm Link ở text, tăng tương tác cho Mẹo vặt)
            facebookApiUrl = `https://graph.facebook.com/v20.0/${page.page_id}/photos`;
            formData.append('url', post.thumbnail_url);
            formData.append('message', caption);
        } else {
            // Fallback nếu bài Mẹo vặt mà mất ảnh -> Đăng Link
            formData.append('message', caption);
            formData.append('link', postUrl);
        }

        formData.append('access_token', page.access_token);

        const fbResponse = await fetch(facebookApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });

        const fbData = await fbResponse.json();

        if (fbData.error) {
            console.error('Lỗi Facebook API:', fbData.error);
            return NextResponse.json({ error: 'Lỗi khi đăng lên Facebook', details: fbData.error }, { status: 500 });
        }

        // 5. Cập nhật trạng thái bài viết đã share
        await supabase
            .from('blog_posts')
            .update({ 
                is_fb_shared: true,
                fb_post_id: fbData.id
            })
            .eq('id', post.id);

        return NextResponse.json({ 
            message: 'Đăng bài lên Facebook thành công!',
            post_id: post.id,
            fb_post_id: fbData.id
        });

    } catch (error: any) {
        console.error('Cron Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
