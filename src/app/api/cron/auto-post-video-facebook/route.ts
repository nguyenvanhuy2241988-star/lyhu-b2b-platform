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

/**
 * Tự động tạo Caption & Tiêu đề chuẩn viral bằng AI nếu video chưa có hoặc caption thô
 */
async function ensureRichAICaption(video: any, brandName: string): Promise<{ title: string; caption: string; isAiGenerated: boolean }> {
    let title = (video.title || '').trim();
    let caption = (video.caption || '').trim();

    // Kiểm tra xem caption có bị rỗng, quá ngắn hoặc là tên file thô không
    const isRawOrEmpty = !caption || 
        caption.length < 30 || 
        /^tvc-|^video_|\.mp4$|bản sao của|untitled|dreamina/i.test(caption) ||
        !/[a-zA-Z0-9]/.test(caption);

    // Chuẩn hóa tiêu đề nếu tiêu đề cũng là tên file thô
    if (/^tvc-|^video_|\.mp4$|bản sao của|dreamina/i.test(title) || !title) {
        title = title
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/tvc/i, '')
            .replace(/video/i, '')
            .replace(/\d{6,}/g, '')
            .trim();
        if (title.length < 5) {
            title = `${brandName.toUpperCase()} - Tuyệt Phẩm Ăn Vặt Giòn Ngon Đậm Vị`;
        } else {
            title = title.charAt(0).toUpperCase() + title.slice(1);
        }
    }

    if (!isRawOrEmpty) {
        return { title, caption, isAiGenerated: false };
    }

    // Nếu caption thô hoặc rỗng -> GỌI AI ĐỂ VIẾT CAPTION VIRAL
    let aiCaption = '';
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        try {
            const prompt = `Bạn là chuyên gia sáng tạo nội dung mạng xã hội (Facebook Reels / Video) cho thương hiệu ${brandName} (thuộc hệ thống phân phối LYHU - www.lyhu.com.vn).
Hãy viết một đoạn Caption cực kỳ cuốn hút, tự nhiên, đúng chất Facebook cho video sau:
- Tiêu đề/Chủ đề video: "${title}"
- Thương hiệu: "${brandName}"

Yêu cầu cấu trúc caption:
1. Dòng 1: Câu Hook giật tít, tò mò hoặc đánh trúng cảm giác thèm ăn / sự chú ý (kèm emoji bắt mắt).
2. Đoạn 2-3 câu: Mô tả ngắn gọn sức hấp dẫn, độ ngon, tính tiện lợi hoặc giá trị của sản phẩm / mẹo bán lẻ.
3. Lời kêu gọi hành động (CTA): "👉 Đặt mua/nhập sỉ ngay tại www.lyhu.com.vn | Hotline: 0969.83.4568".
4. Dòng cuối: 5 - 8 hashtags hot chuẩn SEO Facebook (gồm: #${brandName.toLowerCase().replace(/\s+/g, '')} #lyhu #anvat #xuhuong #reelsvn #hangtieudung).

Chỉ trả về trực tiếp nội dung caption, không kèm giải thích thừa hay dấu ngoặc kép.`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const res = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (text && text.length > 50) {
                    aiCaption = text;
                }
            }
        } catch (e) {
            console.warn('[AutoPostVideo] Lỗi gọi Gemini, chuyển sang Smart Template:', e);
        }
    }

    // Fallback Smart Template chuyên biệt cho từng thương hiệu nếu AI không khả dụng
    if (!aiCaption) {
        const tag = brandName.toLowerCase().replace(/\s+/g, '');
        if (tag.includes('cvt') || tag.includes('khoaimon')) {
            aiCaption = `🍠 ${title} – Giòn rụm bùi béo, ăn là ghiền!\n\n✨ Được làm từ những củ khoai môn tuyển chọn, sấy giòn đậm vị thơm ngon khó cưỡng. Món ăn vặt lý tưởng cho dân văn phòng, học sinh sinh viên hay tiệc tùng tụ tập cuối tuần!\n👉 Đặt mua ngay tại www.lyhu.com.vn | Hotline sỉ: 0969.83.4568\n\n#khoaimoncvt #khoaimonsay #anvat #cvt #lyhu #xuhuong #anvatngon`;
        } else if (tag.includes('boyo')) {
            aiCaption = `🧀 ${title} – Rắc là ngon, đậm vị phô mai!\n\n🔥 Món ngon bùng nổ hương vị cùng bột phô mai BOYO thơm béo ngậy. Thử ngay công thức siêu cuốn này cho bữa xế hôm nay nhé!\n👉 Đặt hàng sỉ & lẻ tại: www.lyhu.com.vn | Hotline: 0969.83.4568\n\n#boyo #botphomai #banhtrangboyo #lyhu #anvat #xuhuong #reelsvn`;
        } else if (tag.includes('uhi')) {
            aiCaption = `🍬 ${title} – Chua chua ngọt ngọt, bùng nổ sảng khoái!\n\n⚡ Kẹo dẻo UHi hương vị trái cây thơm lừng, ăn vui miệng cả ngày. Sản phẩm hot được yêu thích tại mọi kệ hàng tạp hóa!\n👉 Mua ngay tại www.lyhu.com.vn | Hotline sỉ: 0969.83.4568\n\n#uhi #keodeouhi #anvat #lyhu #taphoa #bansihangtieudung`;
        } else {
            aiCaption = `💡 ${title} – Mẹo hay kinh doanh & tiêu dùng thông thái từ LYHU!\n\n📦 Đồng hành cùng hàng ngàn đại lý và tiệm tạp hóa trên toàn quốc với nguồn hàng sỉ uy tín, giá tận gốc.\n👉 Xem thêm chính sách phân phối tại: www.lyhu.com.vn | Hotline: 0969.83.4568\n\n#lyhu #kinhdoanh #taphoa #bansihangtieudung #fmcg #nhaphanphoi`;
        }
    }

    return { title, caption: aiCaption, isAiGenerated: true };
}

export async function GET(req: Request) {
    try {
        // 1. Tìm 1 video mới nhất chưa được đăng lên Facebook
        // LỌC CHẶT CHẼ:
        // - is_active = true
        // - youtube_posted_at is null
        // - Chỉ lấy video từ tháng 10/2026 trở lại (Bỏ qua hoàn toàn các video cũ từ tháng 6 đã đăng)
        // - Ưu tiên video mới nhất
        const { data: videos, error: videoError } = await supabase
            .from('wholesale_short_videos')
            .select('*')
            .eq('is_active', true)
            .is('youtube_posted_at', null)
            .gte('created_at', '2026-10-01T00:00:00Z')
            .order('created_at', { ascending: false })
            .limit(1);

        if (videoError) {
            console.error('[AutoPostVideo] Lỗi truy vấn video:', videoError);
            return NextResponse.json({ error: 'Lỗi truy vấn video từ Database' }, { status: 500 });
        }

        if (!videos || videos.length === 0) {
            return NextResponse.json({ message: 'Không còn video mới nào chưa đăng trong kho.' });
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

        // 3. ĐẢM BẢO CAPTION & TIÊU ĐỀ ĐẠT CHUẨN XỊN (Tự động gọi AI nếu thiếu)
        const { title, caption, isAiGenerated } = await ensureRichAICaption(video, targetPageName);

        // Nếu AI vừa tạo caption mới hoặc làm sạch title, cập nhật ngay vào Database để lưu trữ
        if (isAiGenerated || title !== video.title) {
            await supabase
                .from('wholesale_short_videos')
                .update({ title, caption })
                .eq('id', video.id);
        }

        // 4. Tiến hành phát sóng video lên Fanpage qua Meta Graph API
        console.log(`[AutoPostVideo] Đang đăng video: "${title}" lên Fanpage: ${page.name}...`);
        const result = await publishVideoToFacebookPage(page.page_id, {
            title,
            description: caption,
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
            message: 'Đăng video lên Fanpage thành công với Caption hoàn chỉnh!',
            video_id: video.id,
            video_title: title,
            caption_preview: caption.slice(0, 100) + '...',
            page_name: page.name,
            facebook_post_id: result.post_id,
            posted_at: now
        });

    } catch (error: any) {
        console.error('[AutoPostVideo] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
