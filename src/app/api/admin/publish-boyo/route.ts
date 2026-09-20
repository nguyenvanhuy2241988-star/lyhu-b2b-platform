import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (token !== 'lyhu_clean_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const slug = 'bot-pho-mai-boyo-65g-do-bo-ke-hang-sieu-thi-mini';
    const title = 'Bột Phô Mai BOYO 65G: "Tân Binh" Ăn Vặt Siêu Hot Chuẩn Bị Đổ Bộ Kệ Hàng Siêu Thị & Tiệm Tiện Lợi!';
    const thumbnailUrl = '/boyo_news_banner.jpg';
    const categoryId = 'bbb06484-8d5c-4505-8ee5-6393dcdec950'; // Nhà phân phối & điểm bán

    const contentHtml = `
<p class="lead text-lg font-medium text-gray-700 leading-relaxed mb-6">
    Nếu quầy kệ ăn vặt của siêu thị hay cửa hàng tiện lợi của bạn đang cần một <strong>"cú hích" doanh số mới</strong>, thì đây chính là tin vui đáng mong chờ nhất mùa này: Dòng sản phẩm <strong>Bột phô mai BOYO 65g</strong> do <strong>LYHU</strong> phát triển đang hoàn tất những khâu đóng gói cuối cùng để sẵn sàng đổ bộ thị trường bán lẻ toàn quốc!
</p>

<div class="my-8 text-center">
    <img src="/boyo_news_banner.jpg" alt="Bột phô mai BOYO 65g siêu tiện lợi" class="rounded-2xl shadow-lg mx-auto w-full max-w-3xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bột phô mai BOYO 65g – Hương vị béo ngậy ngọt mặn cực cuốn, thiết kế hộp trưng bày quầy kệ thông minh.</p>
</div>

<h2>1. Cơn Sốt "Rắc Phô Mai Lên Cả Thế Giới" – Cơ Hội Vàng Cho Điểm Bán Lẻ</h2>
<p>
    Từ khoai tây lắc giòn rụm, gà rán giòn tan, bắp rang bơ thơm lừng đến bánh mì, nui chiên hay khoai lang lắc... giới trẻ và các gia đình hiện đại đang cực kỳ mê mẩn các món ăn vặt phủ đẫm phô mai. Việc tự tay làm các món lắc "ngon như quán" ngay tại nhà đã trở thành hoạt động giải trí yêu thích của học sinh, sinh viên và các mẹ bỉm sữa.
</p>
<p>
    Thế nhưng, tìm được một gói bột phô mai <strong>vừa tiền, bao bì xinh xắn, ăn một hai lần là hết</strong> trên kệ siêu thị hay tiệm tạp hóa hiện nay lại không hề dễ. Đa phần là các gói lớn nửa ký, một ký mua về dùng không hết rất dễ bị ẩm, hoặc các gói xách tay đắt đỏ. 
</p>
<p>
    <strong>BOYO 65g sinh ra để giải quyết đúng bài toán đó:</strong> Nhỏ gọn, vừa túi tiền, rắc đâu ngon đó và khách hàng nhìn là muốn đưa ngay vào giỏ!
</p>

<h2>2. Bột Phô Mai BOYO 65G Có Gì Khiến Khách Ăn Là "Dính"?</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
    <div class="p-5 bg-amber-50/60 rounded-xl border border-amber-200">
        <h3 class="text-lg font-bold text-amber-800 mb-2">🧀 Vị Ngon Bùng Nổ, Bám Dính 360°</h3>
        <p class="text-gray-700 text-sm leading-relaxed">
            Hạt bột vàng óng tơi xốp, bám đều quanh từng miếng khoai tây chiên và miếng gà rán nóng hổi. Vị béo ngậy đặc trưng hòa quyện cùng chút ngọt mặn dịu nhẹ, tạo nên cảm giác cuốn hút khó cưỡng mà không bị ngấy.
        </p>
    </div>
    <div class="p-5 bg-emerald-50/60 rounded-xl border border-emerald-200">
        <h3 class="text-lg font-bold text-emerald-800 mb-2">✨ Bao Bì Rực Rỡ, Cực Kỳ Bắt Mắt</h3>
        <p class="text-gray-700 text-sm leading-relaxed">
            Tone vàng chanh tươi sáng kết hợp hình ảnh linh vật đầu bếp và chú gà siêu đáng yêu, tạo hiệu ứng thị giác nổi bật giữa muôn vàn sản phẩm trên quầy kệ, kích thích sự tò mò của các bạn trẻ và trẻ nhỏ.
        </p>
    </div>
</div>

<h2>3. Đóng Gói Thông Minh – Tối Ưu Từng Centimet Quầy Kệ</h2>
<p>
    Không chỉ chiều lòng người ăn, BOYO còn được tính toán tỉ mỉ cho người bán:
</p>
<ul>
    <li><strong>Gói 65g nhỏ gọn:</strong> Điểm giá bán lẻ cực kỳ "êm ví", khách hàng đưa ra quyết định mua ngay lập tức (Impulse Buy) khi đứng trước quầy thanh toán.</li>
    <li><strong>Hộp 10 gói – Mở nắp thành khay trưng bày (Shelf-ready Box):</strong> Hộp giấy cứng cáp có đường cấn mở tiện lợi, chỉ cần xé nhẹ nắp là biến thành khay đứng gọn gàng trên kệ, tiết kiệm tối đa diện tích quầy thu ngân hay kệ gia vị.</li>
    <li><strong>Quy cách đóng thùng:</strong> 1 thùng gồm 6 hộp (tổng 60 gói), trọng lượng nhẹ, dễ kiểm đếm và luân chuyển hàng hóa.</li>
</ul>

<div class="my-8 text-center">
    <img src="/boyo_65g_poster.jpg" alt="Poster BOYO 65g phân phối toàn quốc" class="rounded-2xl shadow-lg mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Poster thương mại chuẩn nhận diện BOYO 65g – Nhỏ gọn để khách dễ chọn.</p>
</div>

<h2>4. Lời Mời Hợp Tác Sớm Dành Cho Các Điểm Bán & Nhà Phân Phối</h2>
<p>
    Hiện tại, xưởng sản xuất của <strong>LYHU</strong> đang tăng tốc hoàn thiện những khâu đóng gói cuối cùng để sản phẩm chính thức xuất xưởng trong thời gian sớm nhất.
</p>
<p>
    Để chuẩn bị cho chiến dịch ra mắt bùng nổ, LYHU chính thức mở cổng kết nối và nhận thông tin đăng ký sớm từ:
</p>
<ul class="space-y-1">
    <li>🔹 <strong>Các Nhà phân phối bánh kẹo, hàng khô & gia vị</strong> muốn đón đầu sản phẩm ăn vặt hot tại khu vực.</li>
    <li>🔹 <strong>Chuỗi siêu thị mini, cửa hàng tiện lợi, tiệm tạp hóa</strong> muốn bổ sung món ăn vặt tăng doanh thu quầy thu ngân.</li>
    <li>🔹 <strong>Quán ăn vặt, tiệm gà rán, khoai lắc</strong> muốn trải nghiệm dòng bột phô mai mới thơm ngon, bám dính tốt.</li>
</ul>

<div class="p-6 bg-teal-50 rounded-2xl border-2 border-teal-500 my-8">
    <h3 class="text-xl font-bold text-teal-900 mb-2">🎁 ĐẶC QUYỀN ĐĂNG KÝ GIỮ SUẤT PHÂN PHỐI SỚM:</h3>
    <ul class="text-teal-800 space-y-2 font-medium">
        <li>✅ Nhận trọn bộ <strong>HÀNG MẪU DÙNG THỬ (Sampling Box)</strong> hoàn toàn miễn phí ngay khi mẻ hàng đầu tiên xuất kho.</li>
        <li>✅ Ưu tiên giữ quyền phân phối khu vực với <strong>chính sách giá và chiết khấu mở màn hấp dẫn nhất</strong>.</li>
        <li>✅ Hỗ trợ hình ảnh truyền thông, poster in ấn độ nét cao và kịch bản bán hàng tại điểm bán.</li>
    </ul>
</div>

<h2>Liên Hệ Đăng Ký Nhận Mẫu Thử & Báo Giá Sớm:</h2>
<p>
    Hãy trở thành một trong những điểm bán đầu tiên đưa hương vị phô mai BOYO đến với người tiêu dùng tại khu vực của bạn!
</p>
<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-2 text-gray-800">
    <p>🏢 <strong>CÔNG TY TNHH LYHU</strong> – <em>Kết nối chân thành • Hợp tác bền vững</em></p>
    <p>📞 <strong>Hotline / Zalo:</strong> <span class="text-primary-700 font-bold text-lg">0969 069 798</span></p>
    <p>🌐 <strong>Website:</strong> <a href="https://lyhu.vn" class="text-teal-600 hover:underline">lyhu.vn</a> • <a href="https://lyhu.com.vn" class="text-teal-600 hover:underline">lyhu.com.vn</a></p>
    <p>✉️ <strong>Email:</strong> sales@lyhu.vn | lyhu.vn@gmail.com</p>
    <p>📍 <strong>Trụ sở:</strong> Số nhà 8A - Tỉnh Đội - KĐT Xa La - Phúc La - Hà Đông - Hà Nội</p>
</div>
`;

    const postData = {
        title: title,
        slug: slug,
        content: contentHtml,
        thumbnail_url: thumbnailUrl,
        category_id: categoryId,
        status: 'published',
        ai_summary: 'Bột phô mai BOYO 65g với bao bì rực rỡ, vị béo ngậy ngọt mặn cực cuốn, đóng gói hộp 10 gói mở nắp thành khay quầy kệ thông minh. LYHU mở cổng đăng ký sớm cho các đại lý, siêu thị mini và tạp hóa toàn quốc nhận mẫu thử miễn phí.',
        meta_title: 'Bột Phô Mai BOYO 65G: Tân Binh Ăn Vặt Chuẩn Bị Đổ Bộ Siêu Thị | LYHU',
        meta_description: 'Bột phô mai BOYO 65g thiết kế hộp 10 gói trưng bày quầy kệ thông minh, rắc khoai tây, gà rán, bắp rang siêu ngon. Đăng ký nhận hàng mẫu và báo giá phân phối sớm từ LYHU!',
        keywords: 'bột phô mai boyo, boyo 65g, bột phô mai lắc khoai, gia vị rắc phô mai, tìm nhà phân phối bột phô mai, lyhu',
        published_at: new Date().toISOString()
    };

    try {
        const { data: existing } = await supabase.from('blog_posts').select('id').eq('slug', slug).maybeSingle();

        let result;
        if (existing) {
            result = await supabase.from('blog_posts').update(postData).eq('slug', slug).select();
        } else {
            result = await supabase.from('blog_posts').insert([postData]).select();
        }

        if (result.error) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'BOYO 65g post published successfully!',
            post: result.data ? result.data[0] : null,
            viewUrl: `https://lyhu.com.vn/tin-tuc/${slug}`
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
