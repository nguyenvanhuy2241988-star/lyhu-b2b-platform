import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findMaxTitleSimilarity, stripYearFromTitle } from '@/lib/titleSimilarity';
import { resolveNewsImages } from '@/lib/newsImageHelper';

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

        // Lấy danh sách các chủ đề từ Database (bạn có thể tạo một bảng riêng hoặc hardcode)
        // Danh sách 40 chủ đề Đời sống, Ẩm thực & Sức khỏe phong phú
        let focusAreas = [
            "Công thức nấu món ngon mỗi ngày cho bữa cơm gia đình đầm ấm",
            "Mẹo vặt nhà bếp thông minh giúp bảo quản rau củ quả tươi lâu",
            "Bí quyết ướp thịt nướng, sườn ram mềm ngọt đậm đà chuẩn vị nhà hàng",
            "Cách làm các món ăn vặt giòn rụm từ bánh tráng, rong biển và khô gà",
            "Dinh dưỡng khoa học: Cách tính lượng đạm và calo phù hợp cho từng thể trạng",
            "Bí quyết chọn mua thực phẩm đóng gói, đồ hộp an toàn cho gia đình",
            "Thực đơn Eat Clean giảm cân an toàn, thanh lọc cơ thể trong 7 ngày",
            "Cách làm các món tráng miệng, chè thanh nhiệt mùa hè từ nguyên liệu dễ tìm",
            "Mẹo nhận biết hạn sử dụng và bảo quản gia vị nhà bếp không bị ẩm mốc",
            "Gợi ý mâm cơm gia đình tiết kiệm dưới 100k mà vẫn đủ chất dinh dưỡng",
            "Cách nấu các món canh giải nhiệt ngày hè thanh mát, dễ ăn",
            "Bí quyết chiên rán thực phẩm giòn lâu mà không ngấy dầu mỡ",
            "Top các loại trà thảo mộc thiên nhiên giúp ngủ ngon, giải độc gan",
            "Review và gợi ý các loại bánh kẹo, snack ngon, đảm bảo vệ sinh cho trẻ nhỏ",
            "Cách tự làm sữa hạt béo thơm, giàu dinh dưỡng tại nhà cho bữa sáng",
            "Mẹo dọn dẹp vệ sinh bếp núc, khử mùi dầu mỡ nhanh chóng bằng nguyên liệu tự nhiên",
            "Chế độ dinh dưỡng tăng cường sức đề kháng cho người lớn tuổi trong gia đình",
            "Công thức pha chế các loại nước sốt chấm thần thánh cho mọi món ăn",
            "Cách chọn hải sản, thịt tươi ngon tại chợ và siêu thị không lo bị tẩm ướp",
            "Cách làm yaourt, sữa chua dẻo mịn úp ngược cực đơn giản tại nhà",
            "Gợi ý các món ăn sáng nhanh gọn lẹ dưới 15 phút cho người bận rộn",
            "Tìm hiểu về chất béo tốt và chất béo xấu trong các món ăn hàng ngày",
            "Mẹo bảo quản thực phẩm đông lạnh đúng cách tránh nhiễm khuẩn",
            "Cách tự làm khô bò, khô gà lá chanh thơm nức mũi tại nhà",
            "Bí quyết làm các món ngâm chua ngọt giòn ngon, để được cả tháng",
            "Thực đơn bồi bổ cho người vừa ốm dậy giúp phục hồi thể lực nhanh chóng",
            "Mẹo sử dụng màng bọc thực phẩm và hộp nhựa an toàn cho sức khỏe",
            "Cách làm các món salad sốt mè rang, sốt giấm táo thanh mát kích thích vị giác",
            "Những sai lầm phổ biến khi sơ chế thịt cá làm mất hết chất dinh dưỡng",
            "Cách lựa chọn các loại dầu ăn phù hợp cho từng phương pháp nấu nướng",
            "Mẹo làm sạch cặn ấm đun nước, đáy nồi chảo cháy khét trong 5 phút",
            "Thực đơn lành mạnh cho dân văn phòng giúp giảm mệt mỏi và tích mỡ bụng",
            "Bí quyết hầm xương nước trong vắt, ngọt thanh không cần mì chính",
            "Cách ngâm hoa quả lên men làm siro thanh mát giải khát cho cả nhà",
            "Phân biệt bột mì, bột bắp, bột năng và cách sử dụng chuẩn trong nấu nướng",
            "Bí quyết làm bánh mì sandwich kẹp trứng sốt mayonnaise cho bữa sáng tiện lợi",
            "Cách bảo quản trứng gà tươi lâu đến cả tháng mà không lo bị ung hỏng",
            "Mẹo khử mùi tanh của cá đồng và lòng heo cực sạch không còn mùi",
            "Thực đơn thanh đạm giải ngấy sau những dịp lễ tết, tiệc tùng",
            "Cách nấu cháo bồi bổ thơm ngon, nhuyễn mịn không bị vữa"
        ];

        // Build a date string the AI can reference for accurate year context
        const now = new Date();
        const vnFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
        const currentDateVN = vnFormatter.format(now);
        const currentYear = now.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' });

        // Lấy TOÀN BỘ tiêu đề bài viết đã xuất bản trong DB để tính toán tương đồng (Title Similarity)
        let allPublishedTitles: string[] = [];
        let pFrom = 0;
        const pSize = 1000;
        while (true) {
            const { data: pBatch } = await supabase
                .from('blog_posts')
                .select('title')
                .eq('status', 'published')
                .range(pFrom, pFrom + pSize - 1);
            if (!pBatch || pBatch.length === 0) break;
            allPublishedTitles.push(...pBatch.map(p => p.title).filter(Boolean));
            if (pBatch.length < pSize) break;
            pFrom += pSize;
        }

        // Lọc các chủ đề: Chỉ chọn chủ đề có độ tương đồng từ ngữ < 60% với TOÀN BỘ bài đã đăng
        const freshTopics = focusAreas.filter(topic => {
            const { maxSim } = findMaxTitleSimilarity(topic, allPublishedTitles);
            return maxSim < 0.60;
        });

        let randomFocus = '';
        if (freshTopics.length > 0) {
            randomFocus = freshTopics[Math.floor(Math.random() * freshTopics.length)];
        } else {
            // Đổi góc nhìn độc bản nếu các chủ đề cơ bản đã bị trùng
            const uniqueAngles = [
                `Thực đơn ăn sạch Eat Clean tiết kiệm chi phí cho gia đình 4 người năm ${currentYear}`,
                `Mẹo chọn mua và phân biệt gia vị chính hãng an toàn cho sức khỏe tại tiệm tạp hóa`,
                `Cách bảo quản ngũ cốc, hạt dinh dưỡng và đồ khô không bị mọt trong thời tiết ẩm`,
                `Công thức đồ uống thanh nhiệt giải độc gan từ nguyên liệu tự nhiên dễ tìm`,
                `Xu hướng tiêu dùng xanh: Lối sống hạn chế rác thải nhựa trong căn bếp hiện đại ${currentYear}`
            ];
            const freshAngles = uniqueAngles.filter(a => findMaxTitleSimilarity(a, allPublishedTitles).maxSim < 0.60);
            randomFocus = freshAngles.length > 0 ? freshAngles[Math.floor(Math.random() * freshAngles.length)] : `Cẩm nang dinh dưỡng và đời sống gia đình năm ${currentYear}`;
        }

        const prompt = `
Bạn là "Chuyên gia Đời sống, Dinh dưỡng và Ẩm thực", làm việc cho LYHU - Nền tảng phân phối sỉ hàng tiêu dùng nhanh (FMCG) hàng đầu Việt Nam. Khán giả của bạn là các bà nội trợ, những người quan tâm đến sức khỏe gia đình, nấu ăn ngon và các chủ tiệm tạp hóa muốn có kiến thức để tư vấn cho khách mua hàng.

⚠️ THÔNG TIN QUAN TRỌNG VỀ THỜI GIAN: Ngày hôm nay là ${currentDateVN} (năm ${currentYear}). TUYỆT ĐỐI KHÔNG viết số liệu hay bài viết hướng tới năm 2024 hoặc 2025.
⚠️ LƯU Ý VỀ TIÊU ĐỀ: KHÔNG tự động chèn thêm năm vào cuối tiêu đề một cách máy móc. Hãy đặt tiêu đề hấp dẫn, gợi sự tò mò và mang lại giá trị thực tế (VD: "Bí quyết nấu phở bò chuẩn vị truyền thống ngay tại nhà").
⚠️ CHỐNG TRÙNG LẶP: Tiêu đề và nội dung PHẢI ĐẶC SẮC, ĐỘC ĐÁO, đi thẳng vào món ăn hoặc mẹo cụ thể. TUYỆT ĐỐI KHÔNG đặt tiêu đề chung chung đã cũ (như: "Dinh dưỡng khoa học: Hiểu đúng về Calories, Vitamin, Chất xơ" hay "Bí quyết chọn mua thực phẩm đóng gói...").
⚠️ LƯU Ý VỀ VĂN PHONG: Trôi chảy, gần gũi, ấm áp, truyền cảm hứng. TUYỆT ĐỐI KHÔNG để lại các số trích dẫn nguồn dạng [1], [2], [3]. Không dùng văn phong quá học thuật.

BẮT BUỘC SỐ 1: Hãy viết một bài chia sẻ hữu ích, chi tiết (khoảng 800-1000 chữ) về chủ đề sau:
CHỦ ĐỀ TẬP TRUNG: "${randomFocus}"

Hãy tự động tìm kiếm trên Google (nếu cần thiết để cập nhật kiến thức/công thức chuẩn) và viết bài với cấu trúc 4 phần rõ ràng (hãy dùng tiêu đề cho từng phần):

1. Mở đầu hấp dẫn
(Nêu bật lý do tại sao chủ đề/món ăn/mẹo vặt này lại quan trọng hoặc hấp dẫn đối với gia đình hiện nay).

2. Nội dung chi tiết (Ví dụ: Nguyên liệu cần chuẩn bị / Các lợi ích cốt lõi)
(Mô tả chi tiết các nguyên liệu cần thiết, hoặc phân tích chi tiết các vấn đề sức khỏe/dinh dưỡng).

3. Hướng dẫn thực hiện / Cách áp dụng
(Các bước thực hiện món ăn, hoặc cách áp dụng mẹo vặt, cách chọn mua thực phẩm đúng chuẩn).

4. Mẹo hay bỏ túi & Gợi ý mua sắm
(Chia sẻ bí quyết nhỏ để thành công hơn. Khéo léo gợi ý rằng người tiêu dùng có thể dễ dàng tìm mua các nguyên liệu này tại các tiệm tạp hóa, siêu thị mini gần nhà - đây là khách hàng của LYHU).

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
  "topic": "Tiêu đề của bài báo (Ngắn gọn, hấp dẫn, chuẩn SEO)",
  "meta_title": "Tiêu đề chuẩn SEO (tối đa 60 ký tự)",
  "meta_description": "Mô tả SEO tóm tắt nội dung bài viết (rất quan trọng, hấp dẫn người click)",
  "keywords": "từ khóa SEO liên quan đến món ăn, sức khỏe",
  "category_slug": "MỘT trong 2 slug sau đây phù hợp nhất với bài viết: am-thuc-nau-an, suc-khoe-doi-song",
  "image_search_queries": [
    "2-3 từ khóa tiếng Anh NGẮN GỌN, CỤ THỂ để tìm ảnh đại diện trên Pexels (VD: 'healthy food', 'family cooking', 'fresh vegetables'). KHÔNG dùng từ chung chung.",
    "2-3 từ khóa tiếng Anh cho ảnh giữa bài (VD: 'cooking pot', 'kitchen interior')",
    "2-3 từ khóa tiếng Anh cho ảnh cuối bài (VD: 'happy family dinner', 'snack bowl')"
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
        let topic = metaData.topic || `Bản tin thị trường FMCG ${todayStr}`;
        let metaTitle = metaData.meta_title || topic;

        // 2. Fetch High-Quality Contextual Images via Brand-Safe Resolver
        const { data: existingPosts } = await supabase
            .from('blog_posts')
            .select('thumbnail_url')
            .not('thumbnail_url', 'is', null);
        const usedUrls = new Set((existingPosts || []).map(p => p.thumbnail_url));

        const imageQueries = Array.isArray(metaData.image_search_queries) ? metaData.image_search_queries : [];
        const images = await resolveNewsImages(topic, imageQueries, usedUrls);
        const thumbnailUrl = images.length > 0 ? images[0] : null;

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

        // Remove AI citation brackets like [1], [2, 3] from the text
        content = content.replace(/\[\d+(,\s*\d+)*\]/g, '');

        // 4. Gọt sạch các số năm (2026, năm 2026...) bị nhồi nhét máy móc trước khi lưu
        const cleanTopic = stripYearFromTitle(topic).trim();
        const cleanMetaTitle = stripYearFromTitle(metaTitle || cleanTopic).trim();

        // Kiểm tra độ tương đồng tiêu đề với toàn bộ bài viết trong DB (Title Similarity >= 60%)
        const { maxSim, matchedTitle } = findMaxTitleSimilarity(cleanTopic, allPublishedTitles);

        if (maxSim >= 0.60) {
            console.warn(`[Lifestyle News Cron] Bỏ qua vì tiêu đề "${cleanTopic}" có độ tương đồng ${Math.round(maxSim * 100)}% (>= 60%) với bài cũ: "${matchedTitle}"`);
            return NextResponse.json({
                success: true,
                skipped: true,
                similarity: maxSim,
                matchedWith: matchedTitle,
                message: `Tiêu đề bài viết có độ tương đồng ${Math.round(maxSim * 100)}% (>= 60%) với bài cũ "${matchedTitle}", tự động bỏ qua để bảo vệ SEO và tránh trùng lặp nội dung.`
            });
        }

        // 5. Save to Database
        const slug = generateSlug(cleanTopic) + '-' + Date.now().toString().slice(-4); // Ensure uniqueness
        
        let categoryId = null;
        if (metaData.category_slug) {
            const { data: category } = await supabase.from('blog_categories').select('id').eq('slug', metaData.category_slug).single();
            if (category) {
                categoryId = category.id;
            }
        }
        
        // Fallback to "am-thuc-nau-an" if category not found or AI failed to provide a valid slug
        if (!categoryId) {
             const { data: defaultCategory } = await supabase.from('blog_categories').select('id').eq('slug', 'am-thuc-nau-an').single();
             if (defaultCategory) categoryId = defaultCategory.id;
        }

        const { data: insertedPost, error } = await supabase.from('blog_posts').insert({
            title: cleanTopic,
            slug: slug,
            category_id: categoryId,
            content: content,
            meta_title: cleanMetaTitle,
            meta_description: metaData.meta_description || cleanTopic,
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
            message: 'Bài viết Đời Sống đã xuất bản thành công',
            post: {
                id: insertedPost.id,
                title: insertedPost.title
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
