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

async function fetchPexelsImage(query: string): Promise<string | null> {
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_API_KEY) return null;

    try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        });
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.large || data.photos[0].src.medium;
        }
    } catch (e) {
        console.error('Pexels API error:', e);
    }
    return null;
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
Hãy viết một bài blog thật dài, chi tiết, chuyên nghiệp về chủ đề: "${topic}".
Bài viết dành cho LYHU - Nền tảng phân phối sỉ bánh kẹo, ăn vặt hàng đầu (Sản phẩm nổi bật: Kẹo chua UHI, bánh tráng, snack).

YÊU CẦU:
1. Độ dài: 800 - 1000 chữ.
2. Format: CHỈ TRẢ VỀ HTML của bài viết (bắt đầu bằng <h2>, không dùng <h1>, <html>, <body>). Dùng các thẻ <h2>, <h3>, <ul>, <li>, <strong>. KHÔNG dùng markdown code block như \`\`\`html.
3. Kêu gọi mua hàng (Call to action): Cuối bài luôn phải có đoạn mời nhập sỉ bánh kẹo tại LYHU.
4. Cuối cùng, trả về ĐÚNG MỘT ĐOẠN JSON chứa metadata theo định dạng sau:

---JSON_START---
{
  "meta_title": "Tiêu đề chuẩn SEO",
  "meta_description": "Mô tả SEO",
  "keywords": "từ khóa SEO",
  "image_search_keyword": "1 từ khóa tiếng Anh ngắn để tìm ảnh minh họa trên Pexels (VD: supermarket, candy, snack, retail)"
}
---JSON_END---
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`, {
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

        // 2. Fetch Image from Pexels
        let thumbnailUrl = null;
        if (metaData.image_search_keyword) {
            thumbnailUrl = await fetchPexelsImage(metaData.image_search_keyword);
        }

        // 3. Save to Database
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
