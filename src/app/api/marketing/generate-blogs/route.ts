import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
    "Kinh nghiệm mở siêu thị mini ở nông thôn với số vốn nhỏ",
    "Bí quyết nhập sỉ bánh kẹo giá tận xưởng không qua trung gian",
    "Tại sao kẹo chua UHI lại được học sinh sinh viên săn lùng?",
    "Tạp hóa gần trường học nên nhập gì? 5 nhóm hàng có vòng quay tốt",
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
Bạn là một chuyên gia về phân phối FMCG và kinh doanh bán lẻ, đang tư vấn cho chủ tạp hóa và siêu thị mini tại Việt Nam.
Hãy viết một bài báo chuyên ngành FMCG thật chi tiết, chuẩn SEO về chủ đề: "${topic}".
Bài viết dành cho chuyên mục "LYHU Chuyển động FMCG 24/7" - Nền tảng phân phối sỉ bánh kẹo, đồ ăn vặt (có sản phẩm nổi bật là Kẹo chua UHI, kẹo dẻo Thái Lan, bánh tráng Abi, snack).

YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG VÀ VĂN PHONG:
1. Đối tượng đọc: chủ tạp hóa, siêu thị mini, nhà phân phối.
2. Phong cách: Đi thẳng vào vấn đề, tư vấn thực tế, có chuyên môn. KHÔNG dùng các từ ngữ quảng cáo, sáo rỗng hoặc chung chung (TUYỆT ĐỐI KHÔNG dùng các cụm từ như "thị trường sôi động", "mỏ vàng tiềm năng", "kinh nghiệm dày dặn", "làm mưa làm gió", "bán chạy nhất").
3. Bố cục bài viết bắt buộc phải đi theo luồng sau:
  - KHÔNG sử dụng thẻ <h2> đầu tiên lặp lại nguyên văn tiêu đề. Hãy dùng một câu hỏi hoặc heading dẫn dắt (ví dụ: "Vì sao tạp hóa gần trường học cần chọn hàng theo vòng quay?").
  - Mở bài: Đi thẳng vào nội dung chi tiết. (Sapo tóm tắt bài viết sẽ được xuất riêng qua trường JSON).
  - Vì sao tạp hóa gần trường học có lợi thế bán hàng?
  - Tiêu chí chọn hàng (giá hợp lý, an toàn thực phẩm, bao bì bắt mắt, vòng quay nhanh, biên lợi nhuận tốt).
  - 5 nhóm hàng nên ưu tiên nhập (Gợi ý nếu tiêu đề không chỉ định rõ: Kẹo chua/kẹo dẻo; Snack/bim bim; Bánh tráng/đồ ăn vặt cay; Đồ uống/sữa; và Văn phòng phẩm cơ bản/khăn giấy).
  - Hướng dẫn cách nhập thử cho điểm bán (ví dụ: không nhập sâu ngay từ đầu, test 3-5 mã, ưu tiên gói nhỏ, theo dõi mã nào bán nhanh trong 7-14 ngày, kiểm tra hạn sử dụng định kỳ).
  - Gợi ý cách trưng bày.
  - Bảng tóm tắt: BẮT BUỘC có một bảng HTML (<table>, <th>, <td>) ở cuối phần nội dung để tóm tắt 5 nhóm hàng, lý do nên nhập và lưu ý.
  - Đoạn cuối: Gợi ý nguồn hàng nhập sỉ.
4. Nguyên tắc khác:
  - Không bịa số liệu nếu không có nguồn.
  - Không lặp lại tiêu đề bài viết nhiều lần.
5. Quản lý CTA và Quảng cáo:
  - TUYỆT ĐỐI KHÔNG chèn sản phẩm quảng cáo ở 30-40% đầu bài để tránh làm đứt mạch đọc.
  - Chỉ chèn Call to Action (CTA) và giới thiệu sản phẩm bán sỉ (LYHU, UHI, Abi) ở đoạn cuối cùng của bài viết hoặc trong mục "Gợi ý nguồn hàng".

YÊU CẦU ĐỊNH DẠNG:
1. Độ dài: Ít nhất 800 - 1000 chữ.
2. Cấu trúc HTML: CHỈ TRẢ VỀ MÃ HTML CỦA PHẦN NỘI DUNG BÀI VIẾT (từ <h2> trở đi, không dùng thẻ <h1> vì trang web đã tự tạo <h1> cho tiêu đề). KHÔNG dùng các thẻ <html> hay <body>. KHÔNG bọc trong markdown code block (như \`\`\`html).
3. Sử dụng các thẻ: <h2>, <h3>, <p>, <ul>, <li>, <strong> để chia bố cục rõ ràng.
4. Cuối cùng, tạo một đoạn JSON chứa meta data (Bắt buộc định dạng chuẩn JSON) ở ngay sau HTML. 
Trong JSON này BẮT BUỘC phải có trường "sapo" là một đoạn văn ngắn 2-3 dòng tóm tắt giá trị cốt lõi của bài.

Ví dụ Format trả về:
<h2>Vì sao tạp hóa gần trường học cần chọn hàng theo vòng quay?</h2>
<p>Nội dung phần 1...</p>
...
<h2>Gợi ý sản phẩm phù hợp</h2>
<p>LYHU cung cấp các nhóm hàng ăn vặt phù hợp cho tạp hóa, siêu thị mini và điểm bán gần trường học, bao gồm kẹo chua UHI, bánh tráng Abi, snack và các sản phẩm tiêu dùng nhanh có nguồn gốc rõ ràng.</p>

---JSON_START---
{
  "sapo": "Với tạp hóa gần trường học, lợi thế không nằm ở đơn hàng lớn mà ở tần suất mua lặp lại hằng ngày. Chủ điểm bán nên ưu tiên các nhóm hàng giá dễ mua, dễ trưng bày, vòng quay nhanh và ít rủi ro tồn kho.",
  "meta_title": "Tiêu đề SEO (khoảng 60 ký tự)",
  "meta_description": "Mô tả ngắn gọn chuẩn SEO (khoảng 150 ký tự)",
  "keywords": "từ khóa 1, từ khóa 2, từ khóa 3"
}
---JSON_END---
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
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
            console.error('Lỗi từ Gemini API:', data.error.message);
            return { error: data.error.message };
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) return null;

        const jsonStartIdx = text.indexOf('---JSON_START---');
        const jsonEndIdx = text.indexOf('---JSON_END---');
        
        // Nếu không tìm thấy JSON tức là bài viết bị cắt ngang do giới hạn độ dài hoặc lỗi AI
        if (jsonStartIdx === -1 || jsonEndIdx === -1) {
            console.error('Bài viết bị cắt ngang hoặc không có JSON metadata');
            return null;
        }

        let content = text.substring(0, jsonStartIdx).trim();
        content = content.replace(/```html/g, '').replace(/```/g, ''); 
        
        const jsonStr = text.substring(jsonStartIdx + 16, jsonEndIdx).trim();
        const metaData = JSON.parse(jsonStr);

        return {
            content,
            sapo: metaData.sapo || '',
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
        const { data: categories } = await supabase.from('blog_categories').select('*').eq('slug', 'goc-nha-phan-phoi-diem-ban').limit(1);
        
        if (!categories || categories.length === 0) {
            const { data: newCat } = await supabase.from('blog_categories').insert({
                name: 'Góc Nhà Phân Phối & Điểm Bán',
                slug: 'goc-nha-phan-phoi-diem-ban',
                sort_order: 1
            }).select().single();
            categoryId = newCat?.id;
        } else {
            categoryId = categories[0].id;
        }

        let count = 0;
        const now = new Date();
        const results = [];

        // Lấy danh sách các bài đã tạo để không tạo trùng lặp
        const { data: existingPosts } = await supabase.from('blog_posts').select('slug');
        const existingSlugs = existingPosts?.map(p => p.slug) || [];
        
        const topicsToProcess = TOPICS.filter(t => !existingSlugs.includes(generateSlug(t)));

        if (topicsToProcess.length === 0) {
             return NextResponse.json({ message: "Tất cả các chủ đề mẫu đều đã được tạo thành công!" });
        }

        // Dùng vòng lặp for thay vì Promise.all để tránh bị Google API chặn do gửi quá nhiều yêu cầu cùng lúc
        const completed = [];
        for (let i = 0; i < topicsToProcess.length; i++) {
            const topic = topicsToProcess[i];
            const articleData = await generateArticle(topic, GEMINI_API_KEY);
            if (!articleData) {
                completed.push({ topic, status: 'failed (Lỗi không xác định hoặc không có JSON metadata)' });
                continue;
            }
            if (articleData.error) {
                completed.push({ topic, status: `failed (Lỗi API: ${articleData.error})` });
                continue;
            }

            const publishDate = new Date(now);
            publishDate.setDate(now.getDate() + count);

            const slug = generateSlug(topic);
            const { error } = await supabase.from('blog_posts').insert({
                title: topic,
                slug: slug,
                category_id: categoryId,
                content: articleData.content,
                ai_summary: articleData.sapo,
                meta_title: articleData.meta_title,
                meta_description: articleData.meta_description,
                keywords: articleData.keywords,
                status: 'published',
                published_at: publishDate.toISOString()
            });

            if (error) {
                completed.push({ topic, status: 'db_error', error: error.message });
            } else {
                completed.push({ topic, status: 'success', date: publishDate.toLocaleDateString() });
                count++;
            }
            
            // Wait 2 seconds between requests to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        }

        return NextResponse.json({
            message: `Quá trình sinh bài viết hoàn tất`,
            total_generated: count,
            details: completed
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
