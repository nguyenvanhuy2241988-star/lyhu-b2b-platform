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
        // 1. Lấy Fanpage ID và Token của "LYHU"
        const { data: pages, error: pageError } = await supabase
            .from('facebook_pages')
            .select('page_id, access_token, name')
            .eq('name', 'LYHU')
            .limit(1);

        if (pageError || !pages || pages.length === 0) {
            console.error('Không tìm thấy Fanpage LYHU hoặc lỗi:', pageError);
            return NextResponse.json({ error: 'Không tìm thấy cấu hình Fanpage LYHU' }, { status: 500 });
        }

        const page = pages[0];

        // 2. Lấy các danh mục B2B
        const b2bCategories = ['goc-nha-phan-phoi', 'tap-hoa-gt', 'cong-nghe-ban-le', 'nghe-fmcg'];

        // 3. Tìm 1 bài viết mới nhất chưa được chia sẻ lên LYHU Fanpage và thuộc danh mục B2B
        const { data: posts, error: postError } = await supabase
            .from('blog_posts')
            .select(`
                id, title, slug, ai_summary, meta_title, keywords, thumbnail_url,
                blog_categories!inner(slug)
            `)
            .eq('status', 'published')
            .eq('is_lyhu_fb_shared', false)
            .in('blog_categories.slug', b2bCategories)
            .order('published_at', { ascending: true }) // Ưu tiên đăng bài cũ trước
            .limit(1) as { data: any[] | null; error: any };

        if (postError) {
            console.error('Lỗi khi lấy bài viết:', postError);
            return NextResponse.json({ error: 'Lỗi Database' }, { status: 500 });
        }

        if (!posts || posts.length === 0) {
            return NextResponse.json({ message: 'Không có bài viết B2B mới nào cần chia sẻ.' });
        }

        const post: any = posts[0];

        // 4. Chuẩn bị nội dung Caption theo format chung
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
        const postUrl = `${baseUrl}/tin-tuc/${post.slug}`;
        
        // Format chung: [Tiêu đề] + [Tóm tắt] + 👉 Xem chính sách sỉ: lyhu.com.vn + #Hashtags
        let hashtagsStr = '#KinhDoanhBanLe #NhaPhanPhoi #LYHU';
        if (post.keywords) {
            const keys = post.keywords.split(',').map((k: string) => k.trim().replace(/\s+/g, ''));
            const extraHashtags = keys.filter((k: string) => k).map((k: string) => `#${k}`).join(' ');
            if (extraHashtags) {
                hashtagsStr += ` ${extraHashtags}`;
            }
        }

        const summary = post.ai_summary || post.meta_title || '';
        const caption = `${post.title}\n\n${summary}\n\n👉 Nhập sỉ giá tốt, chiết khấu cao tại: https://lyhu.com.vn\n👉 Xem chi tiết bài viết: ${postUrl}\n\n${hashtagsStr}`;

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
        
        if (post.thumbnail_url) {
            // Sử dụng Photo Post để đảm bảo 100% hiển thị hình ảnh
            facebookApiUrl = `https://graph.facebook.com/v20.0/${page.page_id}/photos`;
            formData.append('url', post.thumbnail_url);
            formData.append('message', caption);
        } else {
            // Fallback nếu không có ảnh
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

        // 7. Cập nhật trạng thái bài viết đã share lên LYHU FB
        await supabase
            .from('blog_posts')
            .update({ 
                is_lyhu_fb_shared: true,
                lyhu_fb_post_id: fbData.id
            })
            .eq('id', post.id);

        return NextResponse.json({ 
            message: 'Đăng bài lên Facebook LYHU thành công!',
            post_id: post.id,
            fb_post_id: fbData.id
        });

    } catch (error: any) {
        console.error('Cron Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
