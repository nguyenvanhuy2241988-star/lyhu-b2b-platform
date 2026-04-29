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
            // Use large2x or original for high quality
            return data.photos.map((p: any) => p.src.large2x || p.src.original);
        }
    } catch (e) {
        console.error('Pexels API error:', e);
    }
    return [];
}

export async function POST(req: Request) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { topic, categoryId, publishDate } = body;

        if (!topic) {
            return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
        }

        // 1. Generate Content via Gemini
        const prompt = `
Bạn là một chuyên gia content SEO về mảng kinh doanh tạp hóa, siêu thị mini, và bán lẻ tại Việt Nam.
Hãy viết một bài blog thật chi tiết, chuyên nghiệp về chủ đề: "${topic}".

THÔNG TIN VỀ THƯƠNG HIỆU LYHU (Bắt buộc chèn khéo léo vào bài viết):
- LYHU là nền tảng phân phối sỉ bánh kẹo, đồ ăn vặt B2B hàng đầu Việt Nam dành cho tạp hóa, siêu thị mini.
- Sản phẩm nổi bật: Kẹo dẻo chua UHI (Mặt hàng độc quyền đang làm mưa làm gió giới học sinh, sinh viên), bánh tráng trộn, snack giòn tan.
- Ưu điểm cạnh tranh: Nhập sỉ tận gốc xưởng không qua trung gian, vốn khởi điểm thấp, mức chiết khấu cực cao lên tới 45%, mang lại biên độ lợi nhuận lớn cho chủ tiệm.

YÊU CẦU BẮT BUỘC VỀ FORMAT:
1. CHỈ TRẢ VỀ mã HTML chuẩn của nội dung bài viết. Không trả về mã Markdown (Tuyệt đối KHÔNG DÙNG dấu ** hoặc #).
2. Phân tách nội dung thật rõ ràng: Bắt buộc dùng thẻ <p>...</p> cho MỖI đoạn văn. Dùng <h2>, <h3> cho các tiêu đề phụ. Dùng <ul><li> cho danh sách. Dùng <strong> để bôi đậm từ khóa.
3. Độ dài: 800 - 1000 chữ, hành văn thu hút, thực tế, nhắm đúng nỗi đau của chủ tiệm tạp hóa.
4. CHÈN ẢNH MINH HỌA: Hãy chèn CHÍNH XÁC 2 từ khóa sau vào các vị trí phù hợp để ngắt quãng bài viết (hệ thống sẽ tự động thay bằng ảnh thật):
   - Đặt từ khóa [PEXELS_IMAGE_1] ở giữa bài.
   - Đặt từ khóa [PEXELS_IMAGE_2] ở gần đoạn kết luận.
   (Chỉ cần viết đúng chữ [PEXELS_IMAGE_1] đứng một mình trên 1 dòng, không cần bọc thẻ <img>).
5. Cuối bài luôn có 1 đoạn Call-to-action kêu gọi chủ tiệm nhập sỉ Kẹo chua UHI và bánh kẹo tại nền tảng LYHU.
6. Kết thúc bằng một ĐOẠN JSON CHUẨN chứa metadata theo định dạng sau:

---JSON_START---
{
  "meta_title": "Tiêu đề chuẩn SEO",
  "meta_description": "Mô tả SEO",
  "keywords": "từ khóa SEO",
  "image_search_keyword": "1 từ khóa tiếng Anh cực kỳ ngắn (1-2 chữ) để tìm ảnh minh họa trên Pexels (VD: supermarket, candy, snack, grocery, retail)"
}
---JSON_END---
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
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

        // 2. Fetch High-Quality Images from Pexels
        let thumbnailUrl = null;
        let images: string[] = [];
        if (metaData.image_search_keyword) {
            images = await fetchPexelsImages(metaData.image_search_keyword, 3);
            if (images.length > 0) {
                thumbnailUrl = images[0]; // Image 0 goes to thumbnail
            }
        }

        // 3. Inject Inline Images into content
        if (images.length > 1) {
            const img1 = \`<figure class="my-8"><img src="\${images[1]}" alt="\${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>\`;
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, img1);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, ''); // Remove if not found
        }

        if (images.length > 2) {
            const img2 = \`<figure class="my-8"><img src="\${images[2]}" alt="\${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>\`;
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else if (images.length > 1) {
             // Fallback to image 1 if image 2 not available
             const img2 = \`<figure class="my-8"><img src="\${images[1]}" alt="\${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>\`;
             content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, '');
        }

        // Clean up markdown bold asterisks if Gemini still sneaks them in
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 4. Save to Database
        const slug = generateSlug(topic);
        const { data: insertedPost, error } = await supabase.from('blog_posts').insert({
            title: topic,
            slug: slug,
            category_id: categoryId || null,
            content: content,
            meta_title: metaData.meta_title || topic,
            meta_description: metaData.meta_description || topic,
            keywords: metaData.keywords || '',
            thumbnail_url: thumbnailUrl,
            status: 'published',
            published_at: publishDate || new Date().toISOString()
        }).select().single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            post: insertedPost 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
