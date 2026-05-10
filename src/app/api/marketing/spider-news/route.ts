import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const parser = new Parser();

// RSS Feeds Sources
const DOMESTIC_FEEDS = [
    { url: 'https://cafef.vn/thi-truong.rss', categorySlug: 'tin-tuc-fmcg', categoryName: 'Tin Tức FMCG', type: 'news' as const },
    { url: 'https://vneconomy.vn/thi-truong.rss', categorySlug: 'bao-cao-thi-truong', categoryName: 'Báo Cáo Thị Trường', type: 'report' as const },
    { url: 'https://vnbusiness.vn/rss/doanh-nghiep.rss', categorySlug: 'goc-nha-phan-phoi-diem-ban', categoryName: 'Góc Nhà Phân Phối & Điểm Bán', type: 'advisory' as const }
];

const FOREIGN_FEEDS = [
    { url: 'https://www.retaildive.com/feeds/news/', categorySlug: 'tin-tuc-fmcg', categoryName: 'Tin Tức FMCG', type: 'news' as const },
    { url: 'https://www.grocerydive.com/feeds/news/', categorySlug: 'bao-cao-thi-truong', categoryName: 'Báo Cáo Thị Trường', type: 'report' as const },
    { url: 'https://fmcgceo.co.uk/feed/', categorySlug: 'tin-tuc-fmcg', categoryName: 'Tin Tức FMCG', type: 'news' as const }
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

async function fetchPexelsImages(query: string, count: number = 3): Promise<string[]> {
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_API_KEY) return [];

    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${randomPage}&orientation=landscape`, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        });
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
            const { data: existingPosts } = await supabase
                .from('blog_posts')
                .select('thumbnail_url')
                .not('thumbnail_url', 'is', null);
            const usedUrls = new Set((existingPosts || []).map(p => p.thumbnail_url));

            const shuffled = data.photos.sort(() => 0.5 - Math.random());
            const fresh = shuffled.filter((p: any) => !usedUrls.has(p.src.large2x) && !usedUrls.has(p.src.original));
            const pool = fresh.length >= count ? fresh : shuffled;
            return pool.slice(0, count).map((p: any) => p.src.large2x || p.src.original);
        }
    } catch (e) {
        console.error('Pexels API error:', e);
    }
    return [];
}

async function evaluateRelevance(title: string, contentSnippet: string, apiKey: string): Promise<boolean> {
    const prompt = `
Bạn là một trợ lý AI phân tích tin tức. Nhiệm vụ của bạn là đánh giá xem bản tin này có liên quan mật thiết đến ngành FMCG (Hàng tiêu dùng nhanh), Bán lẻ (Retail), Siêu thị mini, Tạp hóa, hoặc Chuỗi cung ứng tại Việt Nam/Toàn cầu hay không.

Tiêu đề: ${title}
Tóm tắt: ${contentSnippet}

Nếu bản tin này RẤT CÓ GIÁ TRỊ cho một chủ tiệm tạp hóa hoặc nhà phân phối, hãy trả lời "YES".
Nếu nó không liên quan (ví dụ: giải trí, showbiz, thể thao, chứng khoán không liên quan bán lẻ, bất động sản...), hãy trả lời "NO".
Chỉ trả về đúng 1 chữ: YES hoặc NO.
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10,
                }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
        return text === 'YES';
    } catch (e) {
        console.error("Lỗi khi đánh giá:", e);
        return false;
    }
}

async function generateSpiderArticle(feedItem: any, type: 'advisory' | 'news' | 'report', apiKey: string) {
    let specificInstructions = '';
    
    if (type === 'advisory') {
        specificInstructions = `
3. Bố cục bài viết:
  - Hãy viết dưới dạng một bài phân tích/tư vấn chuyên môn dựa trên tin tức này.
  - Phân tích rủi ro/cơ hội cho điểm bán nhỏ (tạp hóa, siêu thị mini).
  - Có bảng Markdown tóm tắt bài học kinh nghiệm.
  - KHÔNG PR sản phẩm cụ thể.
`;
    } else if (type === 'news') {
        specificInstructions = `
3. Bố cục bài viết:
  - Viết chuẩn phong cách báo chí khách quan, sắc sảo.
  - Phân tích nguyên nhân, diễn biến của tin tức này.
  - Đánh giá tác động đến thị trường bán lẻ nói chung.
  - KHÔNG PR, KHÔNG kêu gọi mua hàng.
`;
    } else if (type === 'report') {
        specificInstructions = `
3. Bố cục bài viết:
  - Viết dưới dạng một báo cáo phân tích ngành sâu sắc.
  - Trích xuất các số liệu từ bản tin (nếu có) để phân tích bức tranh vĩ mô.
  - Dùng bảng Markdown để so sánh các số liệu nếu cần.
  - Giọng văn học thuật, chuyên gia. KHÔNG PR.
`;
    }

    // Provide current date context for accurate year references
    const vnFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
    const currentDateVN = vnFormatter.format(new Date());
    const currentYear = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' });

    const prompt = `
Bạn là một chuyên gia về phân phối FMCG và kinh doanh bán lẻ. Tòa soạn vừa giao cho bạn một bản tin gốc (có thể bằng tiếng Anh hoặc tiếng Việt). Nhiệm vụ của bạn là xào bài, phân tích và viết lại một bài báo hoàn toàn mới bằng tiếng Việt, chuẩn SEO và chuyên sâu cho chuyên mục "LYHU Chuyển động FMCG 24/7".

⚠️ THÔNG TIN QUAN TRỌNG VỀ THỜI GIAN: Ngày hôm nay là ${currentDateVN} (năm ${currentYear}). Mọi số liệu, sự kiện và phân tích trong bài PHẢI phản ánh đúng mốc thời gian hiện tại (năm ${currentYear}). TUYỆT ĐỐI KHÔNG viết số liệu hay sự kiện từ năm 2024 hoặc 2025 trừ khi là so sánh lịch sử (phải ghi rõ "so với năm trước").
⚠️ LƯU Ý VỀ TIÊU ĐỀ: TUYỆT ĐỐI KHÔNG chèn năm (ví dụ: "năm ${currentYear}", "${currentYear}") vào "new_title" hoặc "meta_title". Tiêu đề phải tự nhiên, không gắn cứng năm.

Thông tin bản gốc:
- Tiêu đề gốc: ${feedItem.title}
- Nội dung tóm tắt: ${feedItem.contentSnippet}
- Link gốc: ${feedItem.link}

YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG VÀ VĂN PHONG:
1. Đối tượng đọc: chủ tạp hóa, siêu thị mini, nhà phân phối, chuyên gia.
2. Cấu trúc bài viết: Sử dụng hoàn toàn cú pháp Markdown chuẩn. Dùng các thẻ Heading (##, ###), danh sách có gạch đầu dòng, in đậm để bài viết mạch lạc. TUYỆT ĐỐI KHÔNG dùng Heading (##) đầu tiên lặp lại tiêu đề bài viết (vì website đã tự tạo H1 rồi). KHÔNG DÙNG HTML THÔ.
${specificInstructions}
4. NGUYÊN TẮC BÁO CHÍ: Báo chí khách quan. Dịch chuẩn xác nếu là báo nước ngoài. Phân tích thêm góc nhìn Việt Nam. Tuyệt đối không nhắc đến bất kỳ tên thương hiệu hay tên sản phẩm LYHU nào.

5. CHÈN ẢNH MINH HỌA: Hãy chèn CHÍNH XÁC 2 từ khóa sau vào 2 vị trí bất kỳ để ngắt quãng bài:
   - [PEXELS_IMAGE_1]
   - [PEXELS_IMAGE_2]
   (Chỉ cần viết đúng từ khóa trên 1 dòng).

6. BẮT BUỘC trả về nội dung ĐÚNG theo cấu trúc sau:

[TOÀN BỘ NỘI DUNG BÀI VIẾT BẰNG MARKDOWN Ở ĐÂY]

---JSON_START---
{
  "new_title": "Tiêu đề bài viết mới bằng tiếng Việt (Hấp dẫn, chuẩn SEO, KHÔNG chứa năm hiện tại)",
  "sapo": "Đoạn tóm tắt mở bài khoảng 2-3 câu, nêu bật vấn đề chính...",
  "meta_title": "Tiêu đề chuẩn SEO (KHÔNG chứa năm hiện tại)",
  "meta_description": "Mô tả chuẩn SEO khoảng 150 ký tự",
  "keywords": "từ khóa 1, từ khóa 2",
  "image_search_keyword": "1 từ khóa tiếng Anh cực kỳ ngắn (1-2 chữ) để tìm ảnh minh họa trên Pexels (VD: supermarket, grocery)"
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
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const jsonStartIdx = text.indexOf('---JSON_START---');
        const jsonEndIdx = text.indexOf('---JSON_END---');
        
        if (jsonStartIdx === -1 || jsonEndIdx === -1) return null;

        let content = text.substring(0, jsonStartIdx).trim();
        const jsonStr = text.substring(jsonStartIdx + 16, jsonEndIdx).trim();
        const metaData = JSON.parse(jsonStr);

        let thumbnailUrl = null;
        let images: string[] = [];
        if (metaData.image_search_keyword) {
            images = await fetchPexelsImages(metaData.image_search_keyword, 3);
            if (images.length > 0) thumbnailUrl = images[0];
        }

        if (images.length > 1) {
            const img1 = `<figure class="my-8"><img src="${images[1]}" alt="Ảnh minh họa" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, img1);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, '');
        }

        if (images.length > 2) {
            const img2 = `<figure class="my-8"><img src="${images[2]}" alt="Ảnh minh họa" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else if (images.length > 1) {
             const img2 = `<figure class="my-8"><img src="${images[1]}" alt="Ảnh minh họa" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
             content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, '');
        }

        // Convert raw Markdown to HTML properly
        content = await marked.parse(content);

        return {
            content,
            new_title: metaData.new_title,
            sapo: metaData.sapo || '',
            meta_title: metaData.meta_title,
            meta_description: metaData.meta_description,
            keywords: metaData.keywords || '',
            thumbnail_url: thumbnailUrl
        };

    } catch (e: any) {
        console.error('Lỗi khi gọi API Spider:', e.message);
        return null;
    }
}

export async function GET() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    try {
        // Pick 1 random domestic and 1 random foreign feed to process in this cron run
        const domestic = DOMESTIC_FEEDS[Math.floor(Math.random() * DOMESTIC_FEEDS.length)];
        const foreign = FOREIGN_FEEDS[Math.floor(Math.random() * FOREIGN_FEEDS.length)];
        const feedsToProcess = [domestic, foreign];

        const results = [];

        for (const feedConfig of feedsToProcess) {
            let feed;
            try {
                feed = await parser.parseURL(feedConfig.url);
            } catch (err) {
                console.error(`Lỗi đọc RSS ${feedConfig.url}:`, err);
                continue;
            }

            // Get the 3 latest items from the feed
            const latestItems = feed.items.slice(0, 3);

            for (const item of latestItems) {
                if (!item.link) continue;

                // Check if we already processed this URL
                const { data: existingLog } = await supabase
                    .from('crawled_news_logs')
                    .select('id')
                    .eq('source_url', item.link)
                    .single();

                if (existingLog) {
                    continue; // Already processed
                }

                // AI Relevance Filter
                const isRelevant = await evaluateRelevance(item.title || '', item.contentSnippet || item.content || '', GEMINI_API_KEY);
                
                if (!isRelevant) {
                    // Mark as ignored
                    await supabase.from('crawled_news_logs').insert({
                        source_url: item.link,
                        title: item.title || 'Untitled',
                        status: 'ignored'
                    });
                    results.push({ url: item.link, status: 'ignored (not relevant)' });
                    continue;
                }

                // Relevant -> Generate Article
                const articleData = await generateSpiderArticle(item, feedConfig.type, GEMINI_API_KEY);
                
                if (!articleData) {
                    await supabase.from('crawled_news_logs').insert({
                        source_url: item.link,
                        title: item.title || 'Untitled',
                        status: 'failed'
                    });
                    results.push({ url: item.link, status: 'failed to generate' });
                    continue;
                }

                // Publish
                const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', feedConfig.categorySlug).single();
                let categoryId = cat?.id;

                if (!categoryId) {
                    const { data: newCat } = await supabase.from('blog_categories').insert({
                        name: feedConfig.categoryName,
                        slug: feedConfig.categorySlug,
                        sort_order: 1
                    }).select().single();
                    categoryId = newCat?.id;
                }

                const publishDate = new Date();
                const slug = generateSlug(articleData.new_title);

                const { error: insertError } = await supabase.from('blog_posts').insert({
                    title: articleData.new_title,
                    slug: slug,
                    category_id: categoryId,
                    content: articleData.content,
                    ai_summary: articleData.sapo,
                    meta_title: articleData.meta_title,
                    meta_description: articleData.meta_description,
                    keywords: articleData.keywords,
                    thumbnail_url: articleData.thumbnail_url,
                    status: 'published',
                    published_at: publishDate.toISOString()
                });

                if (insertError) {
                    console.error("Lỗi lưu bài viết:", insertError);
                    results.push({ url: item.link, status: 'failed_db' });
                } else {
                    await supabase.from('crawled_news_logs').insert({
                        source_url: item.link,
                        title: item.title || 'Untitled',
                        status: 'published'
                    });
                    results.push({ url: item.link, status: 'published', new_title: articleData.new_title });
                }

                // Add delay to respect API limits
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        return NextResponse.json({
            message: "Hoàn tất quét RSS",
            results
        });

    } catch (e: any) {
        console.error("Lỗi tổng cron:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
