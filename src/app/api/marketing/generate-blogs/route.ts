import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface BlogConfig {
    topic: string;
    categorySlug: string;
    categoryName: string;
    type: 'advisory' | 'news' | 'report';
}

const TOPICS: BlogConfig[] = [
    {
        topic: "Tạp hóa gần trường học nên nhập gì? 5 nhóm hàng có vòng quay tốt",
        categorySlug: "goc-nha-phan-phoi-diem-ban",
        categoryName: "Góc Nhà Phân Phối & Điểm Bán",
        type: "advisory"
    },
    {
        topic: "Phân tích xu hướng tiêu dùng FMCG 2026: Tạp hóa truyền thống đang chuyển mình ra sao?",
        categorySlug: "tin-tuc-fmcg",
        categoryName: "Tin Tức FMCG",
        type: "news"
    },
    {
        topic: "Báo cáo: Tái cấu trúc chuỗi cung ứng kẹo dẻo và bánh tráng tại thị trường Việt Nam",
        categorySlug: "bao-cao-thi-truong",
        categoryName: "Báo Cáo Thị Trường",
        type: "report"
    }
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

async function generateArticle(topic: string, type: 'advisory' | 'news' | 'report', apiKey: string, activeProductsContext: string) {
    let specificInstructions = '';
    
    if (type === 'advisory') {
        specificInstructions = `
3. Bố cục bài viết bắt buộc phải đi theo luồng sau:
  - KHÔNG sử dụng thẻ <h2> đầu tiên lặp lại nguyên văn tiêu đề. Hãy dùng một câu hỏi hoặc heading dẫn dắt.
  - Mở bài: Đi thẳng vào nội dung chi tiết. (Sapo tóm tắt bài viết sẽ được xuất riêng qua trường JSON).
  - Vì sao chủ đề này lại quan trọng với điểm bán?
  - Tiêu chí chọn hàng hoặc cách giải quyết vấn đề.
  - Các nhóm hàng / chiến lược nên ưu tiên áp dụng. Khi lấy ví dụ về sản phẩm, TUYỆT ĐỐI CHỈ DÙNG các sản phẩm có trong danh sách phân phối thực tế của LYHU ở mục 5.
  - Hướng dẫn cách test thử hoặc triển khai rủi ro thấp cho điểm bán nhỏ.
  - Gợi ý cách trưng bày / vận hành.
  - Bảng tóm tắt: BẮT BUỘC có một bảng HTML (<table>, <th>, <td>) ở cuối phần nội dung để tóm tắt ý chính.
  - Đoạn cuối: Gợi ý nguồn hàng nhập sỉ (CTA mua hàng).
4. Quản lý CTA và Quảng cáo:
  - TUYỆT ĐỐI KHÔNG chèn sản phẩm quảng cáo ở 30-40% đầu bài để tránh làm đứt mạch đọc.
  - Chỉ chèn CTA ở đoạn cuối cùng của bài viết hoặc trong mục "Gợi ý nguồn hàng".
`;
    } else if (type === 'news') {
        specificInstructions = `
3. Bố cục bài viết bắt buộc phải đi theo luồng sau:
  - KHÔNG sử dụng thẻ <h2> đầu tiên lặp lại nguyên văn tiêu đề. Hãy dùng một câu hỏi hoặc heading dẫn dắt.
  - Mở bài: Nêu bật tính thời sự của xu hướng/tin tức. (Sapo tóm tắt bài viết sẽ được xuất riêng qua trường JSON).
  - Thực trạng thị trường hiện tại.
  - Phân tích nguyên nhân và động lực của xu hướng.
  - Tác động đến kênh phân phối và điểm bán lẻ (tạp hóa, siêu thị mini).
  - Kết luận và dự báo ngắn gọn.
4. Quản lý CTA và Quảng cáo:
  - Phong cách viết PHẢI KHÁCH QUAN, chuẩn báo chí. Không dùng giọng điệu bán hàng, không xưng hô "LYHU có kinh nghiệm dày dặn".
  - KHÔNG chèn các đoạn chèo kéo mua hàng. Chỉ được nhắc nhẹ đến LYHU như một nền tảng chuyển đổi số/cung cấp sỉ ở dòng cuối cùng nếu phù hợp. Không cần lập bảng tóm tắt cách nhập hàng.
`;
    } else if (type === 'report') {
        specificInstructions = `
3. Bố cục bài viết bắt buộc phải đi theo luồng sau:
  - KHÔNG sử dụng thẻ <h2> đầu tiên lặp lại nguyên văn tiêu đề.
  - Mở bài: Tóm tắt bức tranh vĩ mô. (Sapo tóm tắt bài viết sẽ được xuất riêng qua trường JSON).
  - Phân tích quy mô và tiềm năng ngách thị trường (được phép dùng số liệu giả định hợp lý hoặc dữ liệu chung để minh họa).
  - Tái cấu trúc chuỗi cung ứng: Từ nhà máy đến điểm bán.
  - Hành vi người tiêu dùng và cơ hội bứt phá.
  - Bảng số liệu: Có thể sử dụng bảng HTML (<table>) để so sánh các chỉ số vĩ mô/vi mô.
  - Kết luận và hàm ý chiến lược.
4. Quản lý CTA và Quảng cáo:
  - Giọng văn CHUYÊN GIA, học thuật, phân tích sâu sắc.
  - TUYỆT ĐỐI KHÔNG CÓ CTA bán hàng. Không quảng cáo sản phẩm. Bài viết đóng vai trò báo cáo định hướng thị trường thuần túy.
`;
    }

    const prompt = `
Bạn là một chuyên gia về phân phối FMCG và kinh doanh bán lẻ.
Hãy viết một bài báo chuyên ngành FMCG thật chi tiết, chuẩn SEO về chủ đề: "${topic}".
Bài viết dành cho chuyên mục "LYHU Chuyển động FMCG 24/7".

YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG VÀ VĂN PHONG:
1. Đối tượng đọc: chủ tạp hóa, siêu thị mini, nhà phân phối, chuyên gia trong ngành.
2. Phong cách chung: Đi thẳng vào vấn đề, tư vấn thực tế, có chuyên môn. KHÔNG dùng các từ ngữ quảng cáo, sáo rỗng hoặc chung chung.
${specificInstructions}
5. DANH SÁCH SẢN PHẨM THỰC TẾ:
${activeProductsContext}
  - Nếu bài viết cần nhắc đến ví dụ sản phẩm cụ thể, BẮT BUỘC phải lấy tên chính xác từ danh sách trên.
  - KHÔNG TỰ BỊA ra các sản phẩm không có trong danh sách (Ví dụ: KHÔNG được viết "kẹo dẻo Thái Lan" nếu trong danh sách không có chữ này).


YÊU CẦU ĐỊNH DẠNG:
1. Độ dài: Ít nhất 800 - 1000 chữ.
2. Cấu trúc HTML: CHỈ TRẢ VỀ MÃ HTML CỦA PHẦN NỘI DUNG BÀI VIẾT (từ <h2> trở đi, không dùng thẻ <h1> vì trang web đã tự tạo <h1> cho tiêu đề). KHÔNG dùng các thẻ <html> hay <body>. KHÔNG bọc trong markdown code block (như \`\`\`html).
3. Định dạng HTML chuẩn: Sử dụng các thẻ <h2>, <h3>, <p>, <ul>, <li>, <strong> để trình bày. Tuyệt đối không dùng markdown (* hay #).
4. BẮT BUỘC trả về nội dung ĐÚNG theo cấu trúc sau (KHÔNG ĐƯỢC thay đổi thứ tự):

[TOÀN BỘ NỘI DUNG BÀI VIẾT BẰNG THẺ HTML Ở ĐÂY]

---JSON_START---
{
  "sapo": "Đoạn tóm tắt mở bài khoảng 2-3 câu, nêu bật vấn đề và giải pháp...",
  "meta_title": "Tiêu đề chuẩn SEO",
  "meta_description": "Mô tả chuẩn SEO khoảng 150 ký tự",
  "keywords": "từ khóa 1, từ khóa 2"
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
        content = content.replace(/```html/g, '').replace(/```/g, '').trim(); 
        
        const jsonStr = text.substring(jsonStartIdx + 16, jsonEndIdx).trim();
        const metaData = JSON.parse(jsonStr);

        // Đảm bảo không bị lỗi truthy với chuỗi chỉ chứa khoảng trắng/xuống dòng
        if (!content && metaData.content) {
            content = metaData.content;
        }

        if (!content) {
            console.error('Bài viết không có nội dung HTML');
            return null;
        }

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

export async function GET() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY on server' }, { status: 500 });
    }

    try {
        const categoriesCache: Record<string, string> = {};

        // Pre-fetch or create categories
        for (const config of TOPICS) {
            if (!categoriesCache[config.categorySlug]) {
                const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', config.categorySlug).single();
                if (cat) {
                    categoriesCache[config.categorySlug] = cat.id;
                } else {
                    const { data: newCat } = await supabase.from('blog_categories').insert({
                        name: config.categoryName,
                        slug: config.categorySlug,
                        sort_order: 1
                    }).select().single();
                    if (newCat) categoriesCache[config.categorySlug] = newCat.id;
                }
            }
        }

        let count = 0;
        const now = new Date();

        // Lấy danh sách các bài đã tạo để không tạo trùng lặp
        const { data: existingPosts } = await supabase.from('blog_posts').select('slug');
        const existingSlugs = existingPosts?.map(p => p.slug) || [];
        
        const topicsToProcess = TOPICS.filter(t => !existingSlugs.includes(generateSlug(t.topic)));

        if (topicsToProcess.length === 0) {
             return NextResponse.json({ message: "Tất cả các chủ đề mẫu đều đã được tạo thành công!" });
        }

        // Fetch active products from Wholesale database to provide context to the AI
        const { data: activeProducts } = await supabase.from('products').select('name').eq('is_active', true).limit(30);
        let activeProductsContext = "Hiện tại không có dữ liệu sản phẩm.";
        if (activeProducts && activeProducts.length > 0) {
            activeProductsContext = "- " + activeProducts.map(p => p.name).join('\n- ');
        }

        // Dùng vòng lặp for thay vì Promise.all để tránh bị Google API chặn do gửi quá nhiều yêu cầu cùng lúc
        const completed = [];
        for (let i = 0; i < topicsToProcess.length; i++) {
            const config = topicsToProcess[i];
            const { topic, type, categorySlug } = config;
            
            const articleData = await generateArticle(topic, type, GEMINI_API_KEY, activeProductsContext);
            if (!articleData) {
                completed.push({ topic, status: 'failed (Lỗi không xác định hoặc không có JSON metadata)' });
                continue;
            }

            const publishDate = new Date(now);
            publishDate.setDate(now.getDate() + count);

            const slug = generateSlug(topic);
            const categoryId = categoriesCache[categorySlug];

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
