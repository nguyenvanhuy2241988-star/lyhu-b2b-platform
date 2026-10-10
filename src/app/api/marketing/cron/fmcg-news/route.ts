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

        // Lấy danh sách các chủ đề từ Database
        const { data: topicsData, error: topicsError } = await supabase
            .from('ai_news_topics')
            .select('content')
            .eq('is_active', true);

        let focusAreas = [];
        if (!topicsError && topicsData && topicsData.length > 0) {
            focusAreas = topicsData.map(t => t.content);
        }

        // Nhóm chủ đề CÓ LƯỢNG TÌM KIẾM THẬT CAO trên Google (High Search Volume & Nhu cầu sỉ thực tế)
        const highIntentTopics = [
            "Nguồn sỉ kẹo dẻo siêu chua UHi: Báo giá thùng, các vị hot trend và chính sách đại lý",
            "Đại lý phân phối khoai môn sấy tẩm vị CVT: Vị trứng cua, trứng muối, cay giòn cho tiệm tạp hóa",
            "Tổng kho sỉ bánh tráng Abi Snack giá xưởng: Bánh tráng bơ, sa tế cay, da cá lắc cho cổng trường",
            "Bột phô mai BOYO sỉ thùng: Báo giá chiết khấu, công thức lắc khoai tây, bắp rang bơ hút khách",
            "Mở tiệm tạp hóa cần bao nhiêu vốn? Danh mục hàng hóa bán chạy quay vòng vốn nhanh nhất",
            "Top mặt hàng ăn vặt cổng trường và tiệm tạp hóa bán chạy nhất có tỷ suất lợi nhuận cao",
            "Cách tính lợi nhuận bán hàng tạp hóa và quản lý hạn sử dụng date bánh kẹo hiệu quả",
            "Thủ tục xuất hóa đơn điện tử VAT và quy định quản lý thị trường cho tiệm tạp hóa bán lẻ",
            "Kinh nghiệm chọn nhà phân phối bánh kẹo sỉ uy tín, vốn ít, hỗ trợ đổi trả cận date"
        ];

        // Bổ sung những chủ đề chưa có vào focusAreas
        for (const topic of highIntentTopics) {
            if (!focusAreas.includes(topic)) {
                focusAreas.push(topic);
            }
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
                "Nhân sự, tuyển dụng & việc làm ngành FMCG - Bán lẻ",
                ...highIntentTopics
            ];
        }

        // Avoid picking same topic as recent posts: check last 50 posts
        const { data: recentPosts } = await supabase
            .from('blog_posts')
            .select('title, meta_title')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(50);
        const recentTitles = (recentPosts || []).map(p => (p.title || p.meta_title || '').toLowerCase());
        
        // Filter out topics that match recent post titles (fuzzy match)
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
Bạn là "Chuyên gia phân tích thị trường B2B FMCG & Cố vấn kinh doanh bán lẻ", làm việc cho LYHU (lyhu.com.vn) - Nhà phân phối và nhập khẩu sỉ bánh kẹo, đồ ăn vặt và nguyên liệu hàng đầu Việt Nam. Khán giả của bạn là các chủ tiệm tạp hóa, chủ siêu thị mini, đại lý bán sỉ và các điểm bán lẻ truyền thống (GT).

⚠️ THÔNG TIN QUAN TRỌNG VỀ THỜI GIAN: Ngày hôm nay là ${currentDateVN} (năm ${currentYear}). Mọi số liệu và bối cảnh PHẢI phản ánh đúng mốc thời gian hiện tại (năm ${currentYear}).

🔥 NGHỆ THUẬT GIẬT TÍT KINH TẾ BẬC THẦY (BẮT BUỘC ÁP DỤNG 1 TRONG 5 CÔNG THỨC CAFEF):
Tiêu đề bài viết ("topic") và tiêu đề SEO ("meta_title") PHẢI áp dụng linh hoạt 1 trong 5 công thức giật tít kinh điển của báo kinh tế CafeF để đạt tỷ lệ click (CTR) cao nhất, trong khi vẫn giữ vững 100% tính chính thống, số liệu nghiêm túc và chuyên môn:

1. CÔNG THỨC 1 - CẤU TRÚC 2 VẾ VỚI DẤU HAI CHẤM ":" (Đặc sản CafeF):
   [Cú móc câu gây tò mò / Nghịch lý] : [Bối cảnh cụ thể hoặc con số chấn động]
   Ví dụ: "Bán tấp nập cả ngày nhưng cuối tháng không thấy tiền: Cái bẫy dòng tiền 80% chủ tiệm tạp hóa mới mở đều dính"
   Ví dụ: "Bịch bột phô mai 65g tạo ra 30 phần khoai lắc: Bài toán 1 vốn 4 lời của các xe đẩy ăn vặt cổng trường"
   Ví dụ: "Vốn khởi điểm chỉ từ 500.000đ: Cách một tiệm tạp hóa nhỏ xoay vòng tạo doanh thu chục triệu từ 4 món ăn vặt hot trend"

2. CÔNG THỨC 2 - CON SỐ TƯƠNG PHẢN GÂY SỐC:
   Đặt cạnh nhau giữa vốn nhỏ vs lãi lớn, chi phí thấp vs giá trị cao, thời gian ngắn vs kết quả vượt bậc.
   Ví dụ: "Nhập đơn đầu chỉ từ 10 thùng: Bí quyết một tiệm tạp hóa nông thôn nhận về 1 thùng miễn phí và lãi ngay 25%"
   Ví dụ: "Bỏ ra 1 vốn thu về 3 lời: So sánh biên lợi nhuận thực tế giữa bánh kẹo truyền thống và đồ ăn vặt đóng gói"
   Ví dụ: "Chi 2 triệu nhập hàng sỉ: Thu về gần 5 triệu sau đúng 1 tuần bán trước cổng trường cấp 2"

3. CÔNG THỨC 3 - "KHÔNG PHẢI A, ĐÂY MỚI LÀ B" (PHÁ VỠ ĐỊNH KIẾN):
   Phá vỡ suy nghĩ thông thường để kích thích trí tò mò bắt buộc phải bấm vào xem.
   Ví dụ: "Không phải nước ngọt hay mì tôm: Đây mới là mặt hàng ăn vặt giúp chủ tiệm tạp hóa thu hồi vốn nhanh nhất mùa này"
   Ví dụ: "Không cần vốn chục triệu: Đây mới là 4 mặt hàng bỏ sỉ dễ bán và vòng quay nhanh nhất cổng trường học năm 2026"
   Ví dụ: "Không phải đại siêu thị: Đây mới là kênh bán lẻ đang âm thầm chiếm 70% doanh số snack và bánh kẹo"

4. CÔNG THỨC 4 - "TỪ NAY..." / "ĐỘNG THÁI MỚI..." (TÁC ĐỘNG TRỰC TIẾP VÀO TÚI TIỀN):
   Tạo cảm giác cấp bách, cảnh báo kiểm tra thị trường, thuế hoặc quy định mới bắt buộc phải biết để không bị phạt.
   Ví dụ: "Từ tháng này, quy định hóa đơn điện tử cho tiệm tạp hóa có thay đổi quan trọng: Đừng để bị phạt oan tiền triệu"
   Ví dụ: "Kiểm tra đột xuất nguồn gốc hàng hóa: 3 loại giấy tờ tiệm tạp hóa bắt buộc phải có khi nhập bánh kẹo sỉ"
   Ví dụ: "Động thái mới từ các nhà sản xuất bánh kẹo: Chiết khấu đại lý thay đổi ra sao trong quý này?"

5. CÔNG THỨC 5 - ĐẶT CÂU HỎI MỞ THÁCH THỨC Ở CUỐI TIÊU ĐỀ:
   Kích thích tranh luận, phản biện và tò mò về nước đi đúng đắn.
   Ví dụ: "Nhập sỉ đồ ăn vặt tự làm hay nhập bánh kẹo có hóa đơn VAT: Nước đi nào an toàn và bền vững hơn cho tiệm tạp hóa?"
   Ví dụ: "Siêu thị mini mọc lên khắp ngõ ngách: Tiệm tạp hóa truyền thống làm gì để giữ chân khách hàng - 'Game' khó hay dễ?"
   Ví dụ: "Bán đồ ăn vặt cổng trường với vốn dưới 2 triệu: Nên chọn bánh tráng, kẹo chua hay snack tẩm vị?"

⚠️ CHỐNG TRÙNG LẶP NỘI DUNG: Tiêu đề và nội dung PHẢI HOÀN TOÀN MỚI, ĐỘC ĐÁO, đào sâu vào góc nhìn thực chiến, số liệu và giải pháp cụ thể.
⚠️ LƯU Ý VỀ VĂN PHONG: TUYỆT ĐỐI KHÔNG để lại các số trích dẫn nguồn dạng [1], [2], [3] trong bài viết. Bài viết phải trôi chảy, chuyên nghiệp, cấu trúc rõ ràng.

CHỦ ĐỀ BÀI VIẾT: "${randomFocus}"

HƯỚNG DẪN VIẾT BÀI THEO ĐÚNG LOẠI CHỦ ĐỀ:
- NẾU CHỦ ĐỀ LÀ TIN TỨC THỊ TRƯỜNG: Hãy dùng Google Search tìm kiếm tin tức mới nhất trong ngành và viết bài phân tích 5 phần (1. Chuyện gì đang xảy ra? - 2. Vì sao quan trọng? - 3. Ảnh hưởng kênh GT/MT - 4. LYHU góc nhìn thực chiến - 5. Gợi ý hành động).
- NẾU CHỦ ĐỀ LÀ HƯỚNG DẪN NGUỒN SỈ / KINH NGHIỆM BÁN LẺ / BÁO GIÁ: Hãy viết như một Cẩm nang thực chiến chuyên sâu dài 900-1200 chữ:
  1. Tổng quan nhu cầu thị trường & sức hút của sản phẩm/mô hình đối với người mua.
  2. Phân tích chi tiết danh mục, đặc điểm sản phẩm, các hương vị bán chạy nhất.
  3. Chính sách nhập sỉ, chiết khấu, bài toán vốn & tỷ suất lợi nhuận thực tế cho chủ tiệm.
  4. Các lưu ý quan trọng về pháp lý, xuất hóa đơn VAT điện tử, kiểm tra date và bảo quản hàng hóa.
  5. Lời khuyên tối ưu bán lẻ và cách liên hệ nhập sỉ hàng chính hãng giá tốt.

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
  "topic": "Tiêu đề bài viết áp dụng CHUẨN 1 trong 5 công thức giật tít CafeF ở trên (có dấu hai chấm, con số tương phản hoặc câu hỏi thách thức, dài từ 14-22 từ)",
  "meta_title": "Tiêu đề chuẩn SEO (tối đa 65 ký tự, hấp dẫn kích thích click chuột cao)",
  "meta_description": "Mô tả SEO tóm tắt nội dung hấp dẫn chuẩn CafeF (tối đa 155 ký tự)",
  "keywords": "từ khóa SEO liên quan đến sự kiện",
  "category_slug": "MỘT trong 15 slug sau đây phù hợp nhất với bài viết: tin-nganh-fmcg, doanh-nghiep-lon, ban-le-hien-dai, cua-hang-tien-loi, tap-hoa-gt, tmdt-tiktok-shop, xu-huong-tieu-dung, nganh-hang, phap-ly-chinh-ngach, chuoi-cung-ung, cong-nghe-ban-le, nha-phan-phoi-diem-ban, nghe-fmcg, am-thuc-nau-an, suc-khoe-doi-song",
  "image_search_queries": [
    "2-3 từ khóa tiếng Anh NGẮN GỌN, CỤ THỂ để tìm ảnh đại diện trên Pexels (VD: 'grocery store aisle', 'snack shelf display', 'cashier counter'). KHÔNG dùng câu dài hay từ chung như 'business'.",
    "2-3 từ khóa tiếng Anh cho ảnh giữa bài (VD: 'warehouse inventory boxes', 'convenience store interior')",
    "2-3 từ khóa tiếng Anh cho ảnh cuối bài (VD: 'delivery truck loading', 'small shop owner')"
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
            console.warn(`[FMCG News Cron] Bỏ qua vì bài viết "${trimmedTopic}" đã tồn tại.`);
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
        
        // Fallback to "tin-nganh-fmcg" if category not found or AI failed to provide a valid slug
        if (!categoryId) {
             const { data: defaultCategory } = await supabase.from('blog_categories').select('id').eq('slug', 'tin-nganh-fmcg').single();
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

        // Bắn tín hiệu IndexNow tức thì (< 1s) tới Bing, Yahoo, Perplexity
        try {
            const { submitToIndexNow, SITE_HOST } = await import('@/lib/indexnow');
            await submitToIndexNow(`https://${SITE_HOST}/tin-tuc/${slug}`);
        } catch (idxErr) {
            console.warn('[IndexNow Auto-Ping Warning]:', idxErr);
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
