import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9 -]/g, "") 
        .replace(/\s+/g, "-") 
        .replace(/-+/g, "-") 
        .replace(/^-+/, "") 
        .replace(/-+$/, ""); 
}

async function fetchPexelsImages(query: string, count: number = 3): Promise<string[]> {
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_API_KEY) return [];

    try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        });
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
            return data.photos.map((p: any) => p.src.large2x || p.src.original);
        }
    } catch (e) {
        console.error('Pexels API error:', e);
    }
    return [];
}

export async function GET(req: Request) {
    // Basic security for Cron Job (Vercel sets this header for cron requests)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.headers.get('user-agent') !== 'vercel-cron/1.0') {
        // Optional: Allow running without auth in dev mode, but strict in production
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    try {
        const todayStr = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        const prompt = `
Bạn là một TỔNG BIÊN TẬP KIÊM NHÀ BÁO kinh tế uy tín hàng đầu Việt Nam, làm việc cho một Tòa soạn Báo điện tử ĐỘC LẬP chuyên sâu về thị trường Bán lẻ và Tiêu dùng nhanh (FMCG).
Hôm nay là ngày ${todayStr}. 

BẮT BUỘC SỐ 1: HÃY TÌM KIẾM TRÊN GOOGLE ĐỂ LẤY MỘT TIN TỨC THỰC TẾ MỚI NHẤT, NÓNG NHẤT VỀ NGÀNH FMCG HOẶC BÁN LẺ TẠI VIỆT NAM TRONG VÒNG 1-2 NGÀY QUA (Ví dụ: chính sách thuế mới, biến động giá cả, các chuỗi siêu thị lớn như WinMart, Bách Hóa Xanh, CoopMart mở rộng/thu hẹp, các tập đoàn như Masan, Vinamilk, Nestle ra báo cáo tài chính, phát hành trái phiếu...). Dựa vào thông tin THỰC TẾ đó để viết thành một bài báo hoàn chỉnh.

BẮT BUỘC SỐ 2 (QUAN TRỌNG NHẤT): BÀI BÁO PHẢI HOÀN TOÀN KHÁCH QUAN, DỰA TRÊN SỰ THẬT. ĐÂY LÀ MỘT TỜ BÁO CHÍNH THỐNG CHUYÊN NGÀNH, KHÔNG PHẢI LÀ BÀI VIẾT QUẢNG CÁO HAY PR CHO BẤT KỲ NỀN TẢNG NÀO. KHÔNG THÊM BẤT KỲ LỜI KÊU GỌI MUA HÀNG HAY NHẬP SỈ NÀO VÀO CUỐI BÀI.

YÊU CẦU NỘI DUNG (GIỌNG VĂN BÁO CHÍ):
1. Chủ đề: Dựa trên 1 tin tức CÓ THẬT vừa tìm kiếm được. Tiêu đề phải giật tít chuẩn báo chí kinh tế (ví dụ: "Masan huy động thành công 500 tỷ đồng trái phiếu", "WinMart+ ồ ạt đóng cửa các điểm bán kém hiệu quả", "Bộ Tài chính đề xuất giảm thuế VAT 2% cho ngành bán lẻ").
2. Văn phong: Khách quan, sắc sảo, có tính cập nhật tin tức (Sử dụng các từ ngữ như "Ghi nhận mới nhất", "Theo báo cáo thực tế", "Sự kiện vừa diễn ra"). Trích dẫn số liệu cụ thể nếu có.

YÊU CẦU BẮT BUỘC VỀ FORMAT:
1. CHỈ TRẢ VỀ mã HTML chuẩn. KHÔNG dùng Markdown (** hay #).
2. Phân tách nội dung: Bắt buộc dùng thẻ <p>...</p> cho MỖI đoạn văn. Dùng <h2>, <h3> cho các tiêu đề phụ. Dùng <ul><li> cho danh sách. Dùng <strong> để bôi đậm từ khóa.
3. Độ dài: Ít nhất 800 chữ, hành văn thu hút.
4. CHÈN ẢNH: Chèn ĐÚNG 2 từ khóa sau vào bài viết để ngắt quãng bài viết (hệ thống sẽ thay bằng ảnh minh họa):
   - [PEXELS_IMAGE_1] ở giữa bài.
   - [PEXELS_IMAGE_2] ở gần cuối bài.
   (Chỉ cần viết đúng chữ [PEXELS_IMAGE_1] đứng một mình trên 1 dòng).
5. Kết thúc bằng một ĐOẠN JSON CHUẨN chứa metadata theo định dạng sau:

---JSON_START---
{
  "topic": "Tiêu đề của bài báo (Ví dụ: Theo dòng sự kiện: Masan vừa phát hành trái phiếu...)",
  "meta_title": "Tiêu đề chuẩn SEO (tối đa 60 ký tự)",
  "meta_description": "Mô tả SEO tóm tắt sự kiện",
  "keywords": "từ khóa SEO liên quan đến sự kiện",
  "image_search_keyword": "1 từ khóa tiếng Anh cực kỳ ngắn (1-2 chữ) để tìm ảnh minh họa trên Pexels (VD: supermarket, business, finance, tax, retail)"
}
---JSON_END---
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                tools: [{ googleSearch: {} }],
                generationConfig: {
                    temperature: 0.8, // Slightly higher for more creative brainstorming
                    maxOutputTokens: 8192,
                }
            })
        });

        const data = await response.json();
        if (data.error) {
            return NextResponse.json({ error: `Gemini API Error: ${data.error.message}` }, { status: 500 });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return NextResponse.json({ error: 'AI returned empty text' }, { status: 500 });
        }

        const jsonStartIdx = text.indexOf('---JSON_START---');
        const jsonEndIdx = text.indexOf('---JSON_END---');
        
        if (jsonStartIdx === -1 || jsonEndIdx === -1) {
            return NextResponse.json({ error: 'AI format error or output cut off' }, { status: 500 });
        }

        let content = text.substring(0, jsonStartIdx).trim();
        content = content.replace(/```html/g, '').replace(/```/g, ''); 
        
        const jsonStr = text.substring(jsonStartIdx + 16, jsonEndIdx).trim();
        const metaData = JSON.parse(jsonStr);
        const topic = metaData.topic || `Bản tin thị trường FMCG ${todayStr}`;

        // 2. Fetch High-Quality Images from Pexels
        let thumbnailUrl = null;
        let images: string[] = [];
        if (metaData.image_search_keyword) {
            images = await fetchPexelsImages(metaData.image_search_keyword, 3);
            if (images.length > 0) {
                thumbnailUrl = images[0]; 
            }
        }

        // 3. Inject Inline Images into content
        if (images.length > 1) {
            const img1 = `<figure class="my-8"><img src="${images[1]}" alt="${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, img1);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, ''); 
        }

        if (images.length > 2) {
            const img2 = `<figure class="my-8"><img src="${images[2]}" alt="${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else if (images.length > 1) {
             const img2 = `<figure class="my-8"><img src="${images[1]}" alt="${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
             content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, '');
        }

        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 4. Save to Database
        const slug = generateSlug(topic) + '-' + Date.now().toString().slice(-4); // Ensure uniqueness
        
        // Find category ID for "Tin tức - Thị trường" or use null
        const { data: category } = await supabase.from('blog_categories').select('id').ilike('name', '%Tin tức%').limit(1).single();

        const { data: insertedPost, error } = await supabase.from('blog_posts').insert({
            title: topic,
            slug: slug,
            category_id: category?.id || null, // Best effort
            content: content,
            meta_title: metaData.meta_title || topic,
            meta_description: metaData.meta_description || topic,
            keywords: metaData.keywords || '',
            thumbnail_url: thumbnailUrl,
            status: 'published',
            published_at: new Date().toISOString() // Publish immediately
        }).select().single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Bản tin FMCG đã xuất bản',
            post: {
                id: insertedPost.id,
                title: insertedPost.title
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
