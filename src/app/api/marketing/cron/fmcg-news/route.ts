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

        // Lấy danh sách các chủ đề từ Database
        const { data: topicsData, error: topicsError } = await supabase
            .from('ai_news_topics')
            .select('content')
            .eq('is_active', true);

        let focusAreas = [];
        if (!topicsError && topicsData && topicsData.length > 0) {
            focusAreas = topicsData.map(t => t.content);
        }

        // Fallback trong trường hợp DB rỗng hoặc lỗi
        if (focusAreas.length === 0) {
            focusAreas = [
                "Thị trường FMCG Việt Nam",
                "Doanh nghiệp FMCG lớn",
                "Hệ thống bán lẻ hiện đại",
                "Cửa hàng tiện lợi & tiêu dùng Gen Z",
                "Kênh tạp hóa, siêu thị mini & GT truyền thống",
                "Thương mại điện tử & Social Commerce FMCG",
                "Xu hướng người tiêu dùng",
                "Ngành hàng FMCG trọng điểm",
                "Chính sách, pháp lý & tiêu chuẩn hàng hóa",
                "Chuỗi cung ứng, logistics & giá nguyên liệu",
                "Công nghệ bán lẻ & dữ liệu",
                "Góc nhà phân phối & điểm bán",
                "Nhân sự, tuyển dụng & việc làm ngành FMCG - Bán lẻ"
            ];
        }

        const randomFocus = focusAreas[Math.floor(Math.random() * focusAreas.length)];

        const prompt = `
Bạn là "Chuyên gia phân tích thị trường B2B FMCG", làm việc cho LYHU - Nền tảng phân phối sỉ hàng tiêu dùng nhanh (FMCG) hàng đầu Việt Nam. Khán giả của bạn là các nhà phân phối, chủ tạp hóa, chủ siêu thị mini và các điểm bán lẻ truyền thống (GT).

BẮT BUỘC SỐ 1: Hãy tự động tìm kiếm trên Google các tin tức NÓNG NHẤT, MỚI NHẤT trong 24-48 giờ qua tại thị trường Việt Nam về chủ đề sau:
CHỦ ĐỀ TẬP TRUNG: "${randomFocus}"

Dựa trên thông tin tìm được, hãy viết một bài phân tích chuyên sâu (khoảng 800-1000 chữ). 
TUYỆT ĐỐI tuân thủ cấu trúc 5 phần sau (hãy dùng tiêu đề cho từng phần):

1. Chuyện gì đang xảy ra?
(Tóm tắt tin tức, sự kiện hoặc xu hướng mới vừa diễn ra. Bám sát sự thật, có số liệu cụ thể).

2. Vì sao điều này quan trọng?
(Giải thích tác động đến thị trường FMCG, bán lẻ, nhà phân phối, điểm bán hoặc người tiêu dùng).

3. Ảnh hưởng đến kênh GT/MT như thế nào?
(Phân tích tác động đến tạp hóa, siêu thị mini, chuỗi bán lẻ, cửa hàng tiện lợi, nhà phân phối hoặc thương hiệu nhỏ. Ai được lợi, ai bị ép?).

4. LYHU góc nhìn thực chiến
(Đưa ra nhận định thực tế: điểm bán nên làm gì, nhà phân phối nên chuẩn bị gì, thương hiệu nhỏ có cơ hội gì).

5. Gợi ý hành động
(Kết bài bằng 2-3 gợi ý hành động ngắn gọn, dễ áp dụng cho nhà bán lẻ/NPP. Ví dụ: Ưu tiên nhóm hàng nào? Cần thay đổi cách trưng bày ra sao?).

YÊU CẦU BẮT BUỘC VỀ FORMAT:
1. CHỈ TRẢ VỀ mã HTML chuẩn. KHÔNG dùng Markdown (** hay #).
2. Phân tách nội dung: Bắt buộc dùng thẻ <p>...</p> cho MỖI đoạn văn. Dùng <h2>, <h3> cho các tiêu đề phụ. Dùng <ul><li> cho danh sách. Dùng <strong> để bôi đậm từ khóa.
3. CHÈN ẢNH: Chèn ĐÚNG 2 từ khóa sau vào bài viết để ngắt quãng bài viết (hệ thống sẽ thay bằng ảnh minh họa):
   - [PEXELS_IMAGE_1] ở giữa bài.
   - [PEXELS_IMAGE_2] ở gần cuối bài.
   (Chỉ cần viết đúng chữ [PEXELS_IMAGE_1] đứng một mình trên 1 dòng).
4. Kết thúc bằng một ĐOẠN JSON CHUẨN chứa metadata theo định dạng sau:

---JSON_START---
{
  "topic": "Tiêu đề của bài báo (Ví dụ: Theo dòng sự kiện: Bách Hóa Xanh mở rộng - cơ hội hay thách thức cho siêu thị mini?)",
  "meta_title": "Tiêu đề chuẩn SEO (tối đa 60 ký tự)",
  "meta_description": "Mô tả SEO tóm tắt sự kiện",
  "keywords": "từ khóa SEO liên quan đến sự kiện",
  "category_slug": "MỘT trong 13 slug sau đây phù hợp nhất với bài viết: tin-nganh-fmcg, doanh-nghiep-lon, ban-le-hien-dai, cua-hang-tien-loi, tap-hoa-gt, tmdt-tiktok-shop, xu-huong-tieu-dung, nganh-hang, phap-ly-chinh-ngach, chuoi-cung-ung, cong-nghe-ban-le, nha-phan-phoi-diem-ban, nghe-fmcg",
  "image_search_queries": [
    "Câu lệnh (Prompt) tiếng Anh dài khoảng 10-20 chữ để AI VẼ hình ảnh đại diện (VD: A modern Vietnamese supermarket exterior with green branding like Bach Hoa Xanh, busy customers)",
    "Câu lệnh (Prompt) tiếng Anh dài khoảng 10-20 chữ để AI VẼ hình ảnh minh họa giữa bài (VD: Close up of supermarket shelves filled with milk and snack products, bright lighting)",
    "Câu lệnh (Prompt) tiếng Anh dài khoảng 10-20 chữ để AI VẼ hình ảnh minh họa cuối bài (VD: People shopping at retail checkout counter, paying with cash, realistic)"
  ]
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

        // 2. Generate High-Quality Contextual Images via Pollinations AI
        let thumbnailUrl = null;
        let images: string[] = [];
        
        if (metaData.image_search_queries && Array.isArray(metaData.image_search_queries)) {
            images = metaData.image_search_queries.map((prompt: string) => 
                `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", photorealistic, professional photography, 8k resolution, highly detailed")}?width=1200&height=630&nologo=true`
            );
        } else if (metaData.image_search_keyword) {
            images = [
                `https://image.pollinations.ai/prompt/${encodeURIComponent(metaData.image_search_keyword + " supermarket retail photorealistic")}?width=1200&height=630&nologo=true`
            ];
        }

        if (images.length > 0) {
            thumbnailUrl = images[0]; 
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
        
        let categoryId = null;
        if (metaData.category_slug) {
            const { data: category } = await supabase.from('blog_categories').select('id').eq('slug', metaData.category_slug).single();
            if (category) {
                categoryId = category.id;
            }
        }
        
        // Fallback to "tin-nganh-fmcg" if category not found or AI failed to provide a valid slug
        if (!categoryId) {
             const { data: defaultCategory } = await supabase.from('blog_categories').select('id').eq('slug', 'tin-nganh-fmcg').single();
             if (defaultCategory) categoryId = defaultCategory.id;
        }

        const { data: insertedPost, error } = await supabase.from('blog_posts').insert({
            title: topic,
            slug: slug,
            category_id: categoryId,
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
