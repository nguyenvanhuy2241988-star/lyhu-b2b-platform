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
        // Use random page offset to get different images each time
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${randomPage}&orientation=landscape`, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        });
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
            // Get existing thumbnail URLs to avoid duplicates
            const { data: existingPosts } = await supabase
                .from('blog_posts')
                .select('thumbnail_url')
                .not('thumbnail_url', 'is', null);
            const usedUrls = new Set((existingPosts || []).map(p => p.thumbnail_url));

            // Shuffle and filter out already-used images
            const shuffled = data.photos.sort(() => 0.5 - Math.random());
            const fresh = shuffled.filter((p: any) => !usedUrls.has(p.src.large2x) && !usedUrls.has(p.src.original));
            const pool = fresh.length >= count ? fresh : shuffled; // Fallback to all if not enough fresh
            return pool.slice(0, count).map((p: any) => p.src.large2x || p.src.original);
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

        // Lấy 50 bài viết gần nhất để đảm bảo không trùng lặp chủ đề
        const { data: recentPosts } = await supabase
            .from('blog_posts')
            .select('title, meta_title')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(50);
        const recentTitles = (recentPosts || []).map(p => (p.title || p.meta_title || '').toLowerCase());
        
        // Lọc các chủ đề chưa từng xuất hiện gần đây
        const freshTopics = focusAreas.filter(topic => {
            const topicLower = topic.toLowerCase();
            return !recentTitles.some(title => 
                title.includes(topicLower.slice(0, 15)) || topicLower.includes(title.slice(0, 15))
            );
        });
        const pool = freshTopics.length > 0 ? freshTopics : focusAreas;
        const randomFocus = pool[Math.floor(Math.random() * pool.length)];

        // Build a date string the AI can reference for accurate year context
        const now = new Date();
        const vnFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
        const currentDateVN = vnFormatter.format(now);
        const currentYear = now.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' });

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

        // 2. Fetch High-Quality Contextual Images via Pexels API
        let thumbnailUrl = null;
        let images: string[] = [];
        
        // Use the first image search query provided by AI, or fallback to the topic
        const pexelsQuery = (metaData.image_search_queries && metaData.image_search_queries.length > 0) 
            ? metaData.image_search_queries[0] 
            : topic;
            
        images = await fetchPexelsImages(pexelsQuery, 3);

        // If Pexels fails or returns no images, use fallback static Pexels images related to FMCG/Retail
        if (images.length === 0) {
            images = [
                'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1200', // Supermarket aisle
                'https://images.pexels.com/photos/1000633/pexels-photo-1000633.jpeg?auto=compress&cs=tinysrgb&w=1200', // Groceries
                'https://images.pexels.com/photos/3962283/pexels-photo-3962283.jpeg?auto=compress&cs=tinysrgb&w=1200'  // Payment/Retail
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

        // Remove AI citation brackets like [1], [2, 3] from the text
        content = content.replace(/\[\d+(,\s*\d+)*\]/g, '');

        // 4. Check duplicate title before saving
        const trimmedTopic = topic.trim();
        const { data: existingPost } = await supabase
            .from('blog_posts')
            .select('id, title')
            .ilike('title', trimmedTopic)
            .maybeSingle();

        if (existingPost) {
            console.warn(`[Lifestyle News Cron] Bỏ qua vì bài viết "${trimmedTopic}" đã tồn tại.`);
            return NextResponse.json({
                success: true,
                skipped: true,
                message: `Bài viết đã tồn tại trên website, tự động bỏ qua để tránh trùng lặp: ${trimmedTopic}`,
                existingId: existingPost.id
            });
        }

        // 5. Save to Database
        const slug = generateSlug(topic) + '-' + Date.now().toString().slice(-4); // Ensure uniqueness
        
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
            title: trimmedTopic,
            slug: slug,
            category_id: categoryId,
            content: content,
            meta_title: metaTitle,
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
