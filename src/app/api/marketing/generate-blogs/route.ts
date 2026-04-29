import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const TOPICS = [
    "Kinh nghiệm mở siêu thị mini ở nông thôn với số vốn nhỏ",
    "Bí quyết nhập sỉ bánh kẹo giá tận xưởng không qua trung gian",
    "Tại sao kẹo chua UHI lại được học sinh sinh viên săn lùng?",
    "Top 5 mặt hàng ăn vặt bán chạy nhất cho tạp hóa gần trường học",
    "Cách trưng bày hàng hóa siêu thị mini giúp tăng gấp đôi doanh thu"
];

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
        .replace(/\s+/g, "-") // collapse whitespace and replace by -
        .replace(/-+/g, "-") // collapse dashes
        .replace(/^-+/, "") // trim
        .replace(/-+$/, ""); // trim
}

async function generateArticle(topic: string, apiKey: string) {
    const prompt = `
Bạn là một chuyên gia về kinh doanh bán lẻ, tạp hóa, và siêu thị mini tại Việt Nam.
Hãy viết một bài blog thật chi tiết, chuẩn SEO về chủ đề: "${topic}".
Bài viết dành cho LYHU - Nền tảng phân phối sỉ bánh kẹo, đồ ăn vặt (có sản phẩm nổi bật là Kẹo chua UHI, kẹo dẻo Thái Lan, snack).

YÊU CẦU:
1. Độ dài: Ít nhất 800 - 1000 chữ.
2. Cấu trúc HTML: CHỈ TRẢ VỀ MÃ HTML CỦA PHẦN NỘI DUNG BÀI VIẾT (từ <h2> trở đi, không dùng thẻ <h1> vì trang web đã tự tạo <h1> cho tiêu đề). KHÔNG dùng các thẻ <html> hay <body>. KHÔNG bọc trong markdown code block (như \`\`\`html).
3. Sử dụng các thẻ: <h2>, <h3>, <p>, <ul>, <li>, <strong> để chia bố cục rõ ràng.
4. Call to Action: Ở cuối bài, hãy chèn một đoạn ngắn mời mọi người nhập sỉ bánh kẹo, kẹo UHI giá tốt tại LYHU.
5. Cuối cùng, tạo một đoạn JSON chứa meta data (Bắt buộc định dạng chuẩn JSON) ở ngay sau HTML. 

Ví dụ Format trả về:
<h2>Tiêu đề phần 1</h2>
<p>Nội dung phần 1...</p>
<h3>Mục con 1</h3>
<p>Chi tiết...</p>
...
<h2>Nhập sỉ bánh kẹo ở đâu?</h2>
<p>Hãy liên hệ ngay LYHU để nhập sỉ kẹo chua UHI và các mặt hàng ăn vặt giá tốt nhất nhé!</p>

---JSON_START---
{
  "meta_title": "Tiêu đề SEO (khoảng 60 ký tự)",
  "meta_description": "Mô tả ngắn gọn chuẩn SEO (khoảng 150 ký tự)",
  "keywords": "từ khóa 1, từ khóa 2, từ khóa 3"
}
---JSON_END---
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Lỗi từ Gemini API:', data.error.message);
            return null;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) return null;

        const jsonStartIdx = text.indexOf('---JSON_START---');
        const jsonEndIdx = text.indexOf('---JSON_END---');
        
        if (jsonStartIdx === -1 || jsonEndIdx === -1) {
            return {
                content: text.replace(/```html/g, '').replace(/```/g, ''),
                meta_title: topic,
                meta_description: topic,
                keywords: 'kinh doanh tạp hóa, bánh kẹo sỉ',
            };
        }

        let content = text.substring(0, jsonStartIdx).trim();
        content = content.replace(/```html/g, '').replace(/```/g, ''); 
        
        const jsonStr = text.substring(jsonStartIdx + 16, jsonEndIdx).trim();
        const metaData = JSON.parse(jsonStr);

        return {
            content,
            meta_title: metaData.meta_title || topic,
            meta_description: metaData.meta_description || topic,
            keywords: metaData.keywords || '',
        };

    } catch (e: any) {
        console.error('Lỗi khi gọi API:', e.message);
        return null;
    }
}

// Timeout handler to bypass Vercel limits partially or just stream response,
// but for 5 posts, it might exceed Vercel 10s-60s limit depending on plan.
// Pro plan has longer timeouts, but it's better to limit generating to 1-2 per request if needed.
// However, since we are doing 5, let's try generating all.
export async function GET() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY on server' }, { status: 500 });
    }

    try {
        let categoryId = null;
        const { data: categories } = await supabase.from('blog_categories').select('*').limit(1);
        
        if (!categories || categories.length === 0) {
            const { data: newCat } = await supabase.from('blog_categories').insert({
                name: 'Góc Kiến Thức',
                slug: 'goc-kien-thuc',
                sort_order: 1
            }).select().single();
            categoryId = newCat?.id;
        } else {
            categoryId = categories[0].id;
        }

        let count = 0;
        const now = new Date();
        const results = [];

        // Note: For Vercel Serverless, running 5 requests sequentially might timeout (max 60s for Pro).
        // Using Promise.all to generate them concurrently.
        const articlePromises = TOPICS.map(async (topic, index) => {
            const articleData = await generateArticle(topic, GEMINI_API_KEY);
            if (!articleData) return { topic, status: 'failed' };

            const publishDate = new Date(now);
            publishDate.setDate(now.getDate() + index);

            const slug = generateSlug(topic);
            const { error } = await supabase.from('blog_posts').insert({
                title: topic,
                slug: slug,
                category_id: categoryId,
                content: articleData.content,
                meta_title: articleData.meta_title,
                meta_description: articleData.meta_description,
                keywords: articleData.keywords,
                status: 'published',
                published_at: publishDate.toISOString()
            });

            if (error) {
                return { topic, status: 'db_error', error: error.message };
            }

            count++;
            return { topic, status: 'success', date: publishDate.toLocaleDateString() };
        });

        const completed = await Promise.all(articlePromises);

        return NextResponse.json({
            message: `Quá trình sinh bài viết hoàn tất`,
            total_generated: count,
            details: completed
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
