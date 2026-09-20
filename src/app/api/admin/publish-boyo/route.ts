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

    const addressBlock = `
<div class="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-2 text-gray-800">
    <p>🏢 <strong>CÔNG TY TNHH LYHU</strong> – <em>Kết nối chân thành • Hợp tác bền vững</em></p>
    <p>📜 <strong>Mã số thuế:</strong> 0110560692</p>
    <p>📍 <strong>Trụ sở chính:</strong> Tầng 6, V11-B09, KĐT mới An Hưng, Phường Dương Nội, Thành phố Hà Nội, Việt Nam</p>
    <p>📞 <strong>Hotline / Zalo:</strong> <span class="text-primary-700 font-bold text-lg">0969 069 798</span></p>
    <p>🌐 <strong>Website:</strong> <a href="https://lyhu.vn" class="text-teal-600 hover:underline">lyhu.vn</a> • <a href="https://lyhu.com.vn" class="text-teal-600 hover:underline">lyhu.com.vn</a></p>
    <p>✉️ <strong>Email:</strong> sales@lyhu.vn | lyhu.vn@gmail.com</p>
</div>
`;

    // -------------------------------------------------------------------------
    // BÀI 1: CẬP NHẬT ĐỊA CHỈ TRỤ SỞ MỚI
    // -------------------------------------------------------------------------
    const post1 = {
        title: 'Bột Phô Mai BOYO 65G: "Tân Binh" Ăn Vặt Siêu Hot Chuẩn Bị Đổ Bộ Kệ Hàng Siêu Thị & Tiệm Tiện Lợi!',
        slug: 'bot-pho-mai-boyo-65g-do-bo-ke-hang-sieu-thi-mini',
        thumbnail_url: '/boyo_news_banner.jpg',
        category_id: 'bbb06484-8d5c-4505-8ee5-6393dcdec950', // Nhà phân phối & điểm bán
        status: 'published',
        ai_summary: 'Bột phô mai BOYO 65g với bao bì rực rỡ, vị béo ngậy ngọt mặn cực cuốn, đóng gói hộp 10 gói mở nắp thành khay quầy kệ thông minh. LYHU mở cổng đăng ký sớm cho các đại lý, siêu thị mini và tạp hóa toàn quốc nhận mẫu thử miễn phí.',
        meta_title: 'Bột Phô Mai BOYO 65G: Tân Binh Ăn Vặt Chuẩn Bị Đổ Bộ Siêu Thị | LYHU',
        meta_description: 'Bột phô mai BOYO 65g thiết kế hộp 10 gói trưng bày quầy kệ thông minh, rắc khoai tây, gà rán, bắp rang siêu ngon. Đăng ký nhận hàng mẫu và báo giá phân phối sớm từ LYHU!',
        keywords: 'bột phô mai boyo, boyo 65g, bột phô mai lắc khoai, gia vị rắc phô mai, tìm nhà phân phối bột phô mai, lyhu',
        content: `
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

<div class="not-prose my-6 p-4 bg-orange-50 rounded-xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
        <p class="text-sm font-bold text-gray-800">🛍️ Quý khách muốn mua lẻ trải nghiệm sản phẩm?</p>
        <p class="text-xs text-gray-600">Ghé ngay gian hàng Shopee chính hãng của BOYO để nhận ưu đãi giao hàng toàn quốc.</p>
    </div>
    <a href="https://shopee.vn/boyo.vn?shopCollection=16825877#product_list" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 bg-[#EE4D2D] hover:bg-[#d43f20] text-xs font-bold px-4 py-2 rounded-lg shadow whitespace-nowrap transition-colors" style="color: #ffffff !important; text-decoration: none !important;">
        <span style="color: #ffffff !important; font-weight: 700;">🧡 Shopee: shopee.vn/boyo.vn</span>
    </a>
</div>
${addressBlock}
`
    };

    // -------------------------------------------------------------------------
    // BÀI 2: GÓC KINH DOANH QUÁN & ĐIỂM BÁN (VỐN NHỎ, LỜI NHANH VỚI MÓN LẮC)
    // -------------------------------------------------------------------------
    const post2 = {
        title: 'Bí Quyết Tăng Gấp Đôi Doanh Số Đồ Ăn Vặt Với Bột Phô Mai BOYO: Vốn Nhỏ, Lời Nhanh, Hút Khách Trẻ!',
        slug: 'bi-quyet-tang-doanh-so-do-an-vat-voi-bot-pho-mai-boyo',
        thumbnail_url: '/boyo_master_poster_v3.jpg',
        category_id: 'bbb06484-8d5c-4505-8ee5-6393dcdec950', // Nhà phân phối & điểm bán
        status: 'published',
        ai_summary: 'Bí quyết bùng nổ doanh thu cho quán ăn vặt, tiệm gà rán, xe khoai lắc và tiệm tạp hóa nhờ bột phô mai BOYO. Công thức tỷ lệ vàng bám dính 360 độ, chi phí cost cực thấp chỉ vài trăm đồng một phần.',
        meta_title: 'Bí Quyết Tăng Doanh Số Ăn Vặt Với Bột Phô Mai BOYO | LYHU',
        meta_description: 'Mách các chủ quán ăn vặt, tiệm trà sữa và tạp hóa bí kíp tăng doanh thu nhờ bột phô mai BOYO: bám dính 360 độ, lên màu vàng đẹp mắt, cost thấp lời nhanh!',
        keywords: 'kinh doanh đồ ăn vặt, khoai tây lắc phô mai, bột phô mai boyo, bí quyết bán đồ ăn vặt, lyhu',
        content: `
<p class="lead text-lg font-medium text-gray-700 leading-relaxed mb-6">
    Bạn đang kinh doanh quán ăn vặt, tiệm gà rán, xe đẩy khoai lắc hay một tiệm tạp hóa gần trường học? Bạn muốn menu của mình có một món <strong>"gây nghiện"</strong>, làm cực nhanh mà tỷ suất lợi nhuận lại cao ngất ngưởng? Hãy cùng khám phá vì sao dòng <strong>Bột phô mai BOYO</strong> đang được xem là bí kíp tăng doanh thu không thể thiếu của các điểm bán ăn vặt năng động!
</p>

<div class="my-8 text-center">
    <img src="/boyo_master_poster_v3.jpg" alt="Bột phô mai BOYO tăng doanh số quán ăn vặt" class="rounded-2xl shadow-lg mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">BOYO mang đến giải pháp gia vị toàn diện cho cả khách mua lẻ mang về lẫn bếp chế biến tại quán.</p>
</div>

<h2>1. Vì Sao Món "Lắc Phô Mai" Luôn Là Cỗ Máy Đẻ Tiền?</h2>
<p>
    Nếu quan sát các nhóm bạn trẻ đi ăn vặt, bạn sẽ thấy đĩa <strong>khoai tây lắc phô mai</strong> hay <strong>gà viên lắc</strong> luôn là món đầu tiên được gọi và hết sạch đầu tiên trên bàn.
</p>
<p>
    Lý do rất đơn giản: Vị phô mai béo ngậy, ngọt mặn kích thích vị giác cực mạnh. Người ăn một miếng sẽ muốn ăn miếng thứ hai, ăn hết một đĩa lại gọi thêm đĩa nữa. Đặc biệt:
</p>
<ul>
    <li><strong>Thời gian ra món siêu tốc:</strong> Chiên khoai/gà chín vàng, vớt ra ráo dầu 30 giây, cho vào hộp rắc 1 muỗng phô mai rồi lắc đều là giao khách. Cả quy trình chưa đầy 3 phút!</li>
    <li><strong>Chi phí nguyên liệu (Cost) cực mềm:</strong> Một phần khoai lắc thông thường chỉ cần <strong>5g – 7g bột phô mai BOYO</strong>. Chi phí gia vị chỉ tốn vài trăm đồng, nhưng một đĩa khoai lắc phô mai bạn có thể bán với giá cao hơn khoai chiên thường từ 5.000đ – 10.000đ!</li>
</ul>

<h2>2. Menu 5 Món "Best-Seller" Dễ Làm, Hái Ra Tiền Cùng BOYO</h2>
<div class="space-y-4 my-6">
    <div class="p-4 bg-orange-50 rounded-xl border-l-4 border-orange-500">
        <h3 class="font-bold text-orange-900 text-lg">🍟 1. Khoai Tây Lắc Phô Mai Kinh Điển</h3>
        <p class="text-gray-700 text-sm">Khoai tây chiên giòn rụm bên ngoài, xốp mềm bên trong. Bột BOYO bám đều quanh từng cọng khoai, tỏa mùi thơm nức mũi cả góc phố.</p>
    </div>
    <div class="p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500">
        <h3 class="font-bold text-amber-900 text-lg">🍗 2. Gà Popcorn (Gà Viên) Lắc Phô Mai</h3>
        <p class="text-gray-700 text-sm">Từng viên thịt gà chiên xù vàng óng, cắn ngập miệng thịt ngọt mềm quyện lớp phô mai béo mặn, học sinh sinh viên mê tít.</p>
    </div>
    <div class="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
        <h3 class="font-bold text-yellow-900 text-lg">🍿 3. Bắp Rang Bơ Phô Mai Rạp Phim</h3>
        <p class="text-gray-700 text-sm">Hạt bắp nổ bung cánh tròn xoe, thơm mùi bơ hòa cùng vị phô mai đậm đà. Món này đóng túi zip bán mang đi xem phim cực kỳ đắt hàng.</p>
    </div>
    <div class="p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-500">
        <h3 class="font-bold text-emerald-900 text-lg">🍠 4. Khoai Lang Lắc & Bánh Tráng Phô Mai</h3>
        <p class="text-gray-700 text-sm">Khoai lang kén giòn ngọt hoặc bánh tráng chiên giòn lắc phô mai, món ăn vặt quốc dân với mức vốn cực thấp.</p>
    </div>
</div>

<h2>3. BOYO Có Gì Khiến Các Chủ Quán Tin Dùng?</h2>
<ul>
    <li><strong>Bám dính 360 độ:</strong> Hạt bột tơi mịn, bám chặt quanh món ăn nóng, không bị rơi rớt xuống đáy hộp gây lãng phí.</li>
    <li><strong>Lên màu vàng ruộm hấp dẫn:</strong> Món ăn nhìn bóng bẩy, bắt mắt, khách hàng chụp ảnh check-in sống ảo cực đẹp.</li>
    <li><strong>Hai lựa chọn quy cách linh hoạt:</strong>
        <ul>
            <li><strong>Túi zip 1kg chuyên dụng:</strong> Đóng mở tiện lợi, tiết kiệm tối đa chi phí cho bếp quán ăn vặt và chuỗi fast-food.</li>
            <li><strong>Gói 65g nhỏ gọn:</strong> Bày ngay tại quầy thu ngân để bán kèm cho khách mang về tự làm món tại nhà.</li>
        </ul>
    </li>
</ul>

<h2>4. Đồng Hành Cùng LYHU – Đón Đầu Mẻ Hàng Mới Nhất</h2>
<p>
    Hiện tại dòng sản phẩm BOYO đang trong giai đoạn hoàn tất đóng gói để chuẩn bị phân phối rộng rãi. Nếu bạn là chủ quán hoặc đại lý đang muốn tìm một nguồn bột phô mai thơm ngon, bám dính tốt với mức giá sỉ tận xưởng:
</p>
<p class="font-semibold text-teal-800">
    👉 Hãy để lại thông tin hoặc nhắn tin qua Zalo Hotline <strong>0969 069 798</strong> để được gửi mẫu thử trải nghiệm và giữ mức giá ưu đãi tốt nhất ngay khi mẻ hàng đầu tiên xuất xưởng!
</p>

<div class="not-prose my-6 p-4 bg-orange-50 rounded-xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
        <p class="text-sm font-bold text-gray-800">🛍️ Mua lẻ trải nghiệm tại Shopee Chính Hãng</p>
        <p class="text-xs text-gray-600">Đặt mua gói nhỏ BOYO 65g hoặc túi 1kg trực tiếp trên Shopee giao hàng hỏa tốc.</p>
    </div>
    <div class="flex items-center gap-2">
        <a href="/?p=649577ef-2c77-429d-8216-f0771473243a" class="inline-flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-xs font-bold px-3 py-2 rounded-lg shadow whitespace-nowrap transition-colors" target="_blank" style="color: #ffffff !important; text-decoration: none !important;">
            <span style="color: #ffffff !important; font-weight: 700;">🛒 Xem BOYO 1kg</span>
        </a>
        <a href="https://shopee.vn/boyo.vn?shopCollection=16825877#product_list" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 bg-[#EE4D2D] hover:bg-[#d43f20] text-xs font-bold px-4 py-2 rounded-lg shadow whitespace-nowrap transition-colors" style="color: #ffffff !important; text-decoration: none !important;">
            <span style="color: #ffffff !important; font-weight: 700;">🧡 Shopee: shopee.vn/boyo.vn</span>
        </a>
    </div>
</div>
${addressBlock}
`
    };

    // -------------------------------------------------------------------------
    // BÀI 3: GÓC BẾP GIA ĐÌNH & NGƯỜI TIÊU DÙNG (MẸ BỈM / GIỚI TRẺ LÀM TẠI NHÀ)
    // -------------------------------------------------------------------------
    const post3 = {
        title: 'Cách Làm Khoai Tây Lắc Phô Mai Bằng Nồi Chiên Không Dầu Chuẩn Vị Quán Với BOYO 65G',
        slug: 'cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g',
        thumbnail_url: '/boyo_recipe_banner.jpg',
        category_id: '10db3b9f-0fc3-430c-a435-9c76a5e00c36', // Ẩm Thực & Nấu Ăn
        status: 'published',
        ai_summary: 'Hướng dẫn làm khoai tây lắc phô mai giòn rụm bằng nồi chiên không dầu chỉ trong 15 phút. Bí quyết dùng gói nhỏ BOYO 65g rắc đều bám dính, thơm ngon béo ngậy không lo ẩm mốc.',
        meta_title: 'Cách Làm Khoai Tây Lắc Phô Mai Bằng Nồi Chiên Không Dầu | BOYO 65G',
        meta_description: 'Học ngay công thức làm khoai tây lắc phô mai bằng nồi chiên không dầu giòn rụm, vàng ươm, thơm lừng cùng bột phô mai BOYO 65g tiện lợi cho gia đình!',
        keywords: 'bột phô mai, bột phô mai boyo, cách làm khoai tây lắc phô mai, khoai tây lắc phô mai nồi chiên không dầu, bột phô mai lắc, mua bột phô mai, lyhu',
        content: `
<p class="lead text-lg font-medium text-gray-700 leading-relaxed mb-6">
    Những buổi tối cuối tuần quây quần xem phim cùng gia đình hay tụ tập hội bạn thân mà có một đĩa <strong>khoai tây chiên lắc phô mai nóng hổi, giòn rụm</strong> thì còn gì tuyệt vời hơn! Thay vì phải ra quán hay đặt ship tốn kém, bạn hoàn toàn có thể tự tay làm món ăn vặt thần thánh này bằng nồi chiên không dầu chỉ trong 15 phút với <strong>gói nhỏ tiện lợi BOYO 65g</strong>!
</p>

<div class="my-8 text-center">
    <img src="/boyo_recipe_banner.jpg" alt="Món khoai tây lắc phô mai giòn rụm thơm ngon tại nhà cùng BOYO 65g" class="rounded-2xl shadow-lg mx-auto w-full max-w-2xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Đĩa khoai tây lắc phô mai vàng ươm, thơm nức mũi hoàn thành chỉ sau 15 phút với nồi chiên không dầu.</p>
</div>

<h2>Nguyên Liệu Cực Đơn Giản:</h2>
<ul>
    <li>🥔 <strong>Khoai tây:</strong> 3 – 4 củ tươi (hoặc 1 túi khoai tây cắt sẵn đông lạnh chuyên dụng).</li>
    <li>🧀 <strong>Bột phô mai BOYO:</strong> 2 – 3 thìa cà phê (khoảng 15g).</li>
    <li>🫒 <strong>Dầu ăn:</strong> 1 thìa canh (hoặc bình xịt dầu).</li>
    <li>🧂 <strong>Gia vị:</strong> 1/2 thìa cà phê muối tinh, nước đá lạnh.</li>
</ul>

<div class="my-6 text-center">
    <img src="/boyo_recipe_ingredients.jpg" alt="Toàn bộ nguyên liệu làm khoai tây lắc phô mai giòn rụm tại nhà" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Nguyên liệu chuẩn bị cực kỳ tinh gọn: Khoai tây, dầu ăn, muối tinh và bí quyết vị ngon từ Bột phô mai BOYO 65g.</p>
</div>

<h2>Công Thức 3 Bước Làm Giòn Rụm, Vàng Ruộm:</h2>

<h3>Bước 1: Sơ Chế Khoai Giòn Lâu & Không Thâm</h3>
<p>
    Khoai tây gọt vỏ, cắt thành từng thanh con chì dài dày khoảng 1cm. Ngâm khoai ngay vào âu nước muối pha loãng khoảng 15 phút để loại bỏ hết tinh bột thừa (giúp khoai không bị thâm và khi chiên sẽ giòn xốp hơn). Sau đó vớt ra, chần qua nước sôi 2 phút rồi ngâm ngay vào âu nước đá lạnh 5 phút. Vớt khoai ra thấm thật khô bằng khăn sạch hoặc giấy ăn.
</p>

<div class="my-6 text-center">
    <img src="/boyo_recipe_step1.jpg" alt="Bước 1: Sơ chế và ngâm khoai tây thanh trong nước lạnh" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 1: Ngâm khoai tây cắt thanh trong âu nước lạnh để loại bỏ tinh bột, giúp từng cọng khoai giòn xốp.</p>
</div>

<h3>Bước 2: Nướng Bằng Nồi Chiên Không Dầu</h3>
<ul>
    <li>Trộn đều khoai với 1 thìa canh dầu ăn để khoai bóng bẩy và không bị khô mặt.</li>
    <li>Làm nóng nồi chiên không dầu ở 180°C trong 5 phút.</li>
    <li>Rải đều khoai vào khay nướng (không xếp chồng quá dày). Nướng lần 1 ở <strong>180°C trong 12 phút</strong>.</li>
    <li>Mở nồi xóc đều khay khoai, nướng tiếp lần 2 ở <strong>200°C trong 5 – 7 phút</strong> cho đến khi cọng khoai chuyển sang màu vàng ruộm, vỏ ngoài giòn tan.</li>
</ul>

<div class="my-6 text-center">
    <img src="/boyo_recipe_step2.jpg" alt="Bước 2: Nướng khoai tây bằng nồi chiên không dầu giòn rụm" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 2: Khoai nướng trong nồi chiên không dầu đạt màu vàng óng và độ giòn tan lý tưởng.</p>
</div>

<h3>Bước 3: Rắc Phô Mai BOYO & Lắc Đều Tay</h3>
<p>
    Đổ khoai nóng ra một tô lớn hoặc túi giấy sạch. Đợi khoảng 30 giây cho khoai ráo bớt hơi nóng, sau đó rắc đều 2 - 3 thìa <strong>Bột phô mai BOYO 65g</strong> lên trên.
</p>
<p>
    Đậy nắp tô hoặc gấp miệng túi giấy, lắc đều tay trong 10 giây. Hạt bột BOYO mịn màng sẽ bám phủ 360 độ quanh từng miếng khoai, tỏa hương thơm ngậy ngây ngất!
</p>

<div class="my-6 text-center">
    <img src="/boyo_recipe_step3.jpg" alt="Bước 3: Lắc đều bột phô mai BOYO bám đều quanh khoai nóng" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 3: Lắc đều bột phô mai BOYO ngay khi khoai còn ấm nóng để hạt bột phủ đều 360 độ quanh từng cọng khoai.</p>
</div>

<h2>Vì Sao Gói BOYO 65G Là "Chân Ái" Của Các Căn Bếp?</h2>
<ul>
    <li><strong>Không lo lãng phí:</strong> Các gói bột phô mai nửa ký hay một ký mua về làm 1-2 lần không hết rất dễ bị vón cục và chảy nước. Gói BOYO 65g vừa vặn cho 3-4 lần ăn vặt gia đình, dùng đến đâu thơm ngon đến đó!</li>
    <li><strong>Vị ngon chuẩn vị:</strong> Béo ngậy, ngọt mặn hài hòa, vị phô mai đậm đà rất tự nhiên, cả người lớn lẫn trẻ nhỏ đều mê tít.</li>
    <li><strong>Dễ dàng mua sắm:</strong> Sản phẩm sắp có mặt trên các quầy kệ siêu thị mini và tiệm tạp hóa gần nhà bạn với mức giá cực kỳ phải chăng.</li>
</ul>

<!-- KHỐI MUA HÀNG TRỰC TIẾP TẠI WEB LYHU & SHOPEE CHÍNH HÃNG -->
<div class="not-prose my-10 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-sm">
    <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="w-36 h-36 flex-shrink-0 bg-white rounded-2xl p-2 border border-amber-200 shadow-sm flex items-center justify-center overflow-hidden">
            <img src="/boyo_65g_pack.jpg" alt="Bột phô mai BOYO 65g chính hãng" class="max-h-full w-auto object-contain" />
        </div>
        <div class="flex-1 text-center sm:text-left">
            <span class="inline-block bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">⭐ Gia Vị Ăn Vặt Khuyên Dùng</span>
            <h4 class="text-xl font-bold text-gray-900 mb-1">Bột Phô Mai BOYO 65g – Hương Vị Béo Ngậy Chuẩn Vị Quán</h4>
            <p class="text-sm text-gray-600 mb-3">Túi zip nhỏ tiện dụng, hạt bột mịn bám dính 360 độ, lên màu vàng cam bắt mắt. Vừa vặn cho 3-4 bữa ăn vặt gia đình!</p>
            <div class="flex items-baseline gap-2 justify-center sm:justify-start mb-4">
                <span class="text-2xl font-black text-amber-600">22.000đ</span>
                <span class="text-xs text-gray-500 font-medium">/ gói 65g</span>
            </div>
            <div class="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <a href="/?p=b2f6a52f-ea58-470c-8014-b49600298e11" target="_blank" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm px-5 py-2.5 rounded-xl shadow transition-all hover:scale-105" style="color: #ffffff !important; text-decoration: none !important;">
                    <span style="color: #ffffff !important; font-weight: 700;">🛒 Đặt Mua Tại LYHU.com.vn</span>
                </a>
                <a href="https://shopee.vn/boyo.vn?shopCollection=16825877#product_list" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-[#EE4D2D] hover:bg-[#d43f20] font-bold text-sm px-5 py-2.5 rounded-xl shadow transition-all hover:scale-105" style="color: #ffffff !important; text-decoration: none !important;">
                    <span style="color: #ffffff !important; font-weight: 700;">🧡 Mua Shopee: shopee.vn/boyo.vn</span>
                </a>
            </div>
        </div>
    </div>
    <div class="mt-4 pt-3 border-t border-amber-200 text-sm text-gray-700 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>💡 <em>Dành cho chủ quán ăn vặt, xe khoai lắc:</em></span>
        <a href="/?p=649577ef-2c77-429d-8216-f0771473243a" target="_blank" class="font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1" style="color: #0f766e !important;">
            📦 Xem Bột phô mai BOYO Túi Tiết Kiệm 1kg (199.000đ) &rarr;
        </a>
    </div>
</div>

<p class="mt-8 text-gray-700">
    Chúc bạn và gia đình thực hiện thành công món khoai tây lắc phô mai thơm ngon tuyệt đỉnh này nhé! Hãy theo dõi website <strong>lyhu.com.vn</strong> để cập nhật thêm nhiều công thức món ăn vặt hấp dẫn khác!
</p>
${addressBlock}
`
    };

    // -------------------------------------------------------------------------
    // BÀI 4: GÓC BẾP GIA ĐÌNH & GIỚI TRẺ (BẮP RANG BƠ PHÔ MAI RẠP PHIM)
    // -------------------------------------------------------------------------
    const post4 = {
        title: 'Cách Làm Bắp Rang Bơ Phô Mai Chuẩn Vị Rạp Phim Bằng Nồi Thường Với BOYO 65G',
        slug: 'cach-lam-bap-rang-bo-pho-mai-chuan-vi-rap-phim-boyo-65g',
        thumbnail_url: '/boyo_popcorn_banner.jpg',
        category_id: '10db3b9f-0fc3-430c-a435-9c76a5e00c36', // Ẩm Thực & Nấu Ăn
        status: 'published',
        ai_summary: 'Bí quyết làm bắp rang bơ phô mai thơm nức mũi chuẩn vị rạp chiếu phim CGV bằng nồi thường hoặc chảo chống dính chỉ trong 10 phút. Hạt nổ bung 100%, bọc lớp bơ vàng béo ngậy và áo đều bột phô mai BOYO 65g đậm đà.',
        meta_title: 'Cách Làm Bắp Rang Bơ Phô Mai Chuẩn Vị Rạp Phim CGV | BOYO 65G',
        meta_description: 'Học ngay bí quyết làm bắp rang bơ phô mai giòn tan, thơm nức mũi chuẩn vị rạp chiếu phim CGV bằng nồi thường tại nhà chỉ 10 phút với bột phô mai BOYO 65g tiện lợi!',
        keywords: 'bắp rang bơ phô mai, cách làm bắp rang bơ phô mai, bắp rang bơ lắc phô mai, bột phô mai làm bắp rang bơ, bột phô mai boyo, lyhu, shopee boyo',
        content: `
<p class="lead text-lg font-medium text-gray-700 leading-relaxed mb-6">
    Những buổi tối xem phim Netflix hay tụ tập bạn bè cuối tuần, một tô <strong>bắp rang bơ phô mai nóng hổi, vàng ươm và thơm nức mũi</strong> chắc chắn là món ăn vặt "quốc dân" khiến cả người lớn lẫn trẻ nhỏ đều mê mẩn. Không cần máy nổ bắp chuyên dụng đắt tiền, bạn hoàn toàn có thể tự tay làm món bắp rang bơ phô mai giòn rụm, thơm ngậy chuẩn vị rạp chiếu phim CGV ngay tại nhà chỉ với một chiếc nồi thường và <strong>gói Bột phô mai BOYO 65g</strong>!
</p>

<div class="my-8 text-center">
    <img src="/boyo_popcorn_banner.jpg" alt="Món bắp rang bơ phô mai chuẩn vị rạp phim làm tại nhà cùng BOYO 65g" class="rounded-2xl shadow-lg mx-auto w-full max-w-2xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Tô bắp rang bơ phô mai vàng óng, bung cánh đều tăm tắp hoàn thành chỉ sau 10 phút với nồi thường tại nhà.</p>
</div>

<h2>Nguyên Liệu Chuẩn Bị (Cho 3 - 4 Người Ăn):</h2>
<ul>
    <li>🌽 <strong>Hạt bắp khô chuyên dụng làm bắp rang (Corn Kernels):</strong> 100g (dễ dàng mua tại siêu thị, tiệm tạp hóa hoặc tiệm đồ làm bánh).</li>
    <li>🧈 <strong>Bơ lạt hoặc bơ thực vật (Tường An, Meizan):</strong> 30g – 40g (tạo mùi thơm béo đặc trưng).</li>
    <li>🫒 <strong>Dầu ăn:</strong> 2 thìa canh (dùng dầu ăn giúp bắp nở đều mà không bị cháy bơ).</li>
    <li>🧀 <strong>Bột phô mai BOYO 65g:</strong> 2 – 3 thìa cà phê (khoảng 15g – 20g).</li>
    <li>🍚 <strong>Đường cát trắng:</strong> 1 – 2 thìa cà phê (tùy khẩu vị thích ngọt mặn hài hòa).</li>
</ul>

<div class="my-6 text-center">
    <img src="/boyo_popcorn_ingredients.jpg" alt="Bộ nguyên liệu làm bắp rang bơ phô mai tại nhà" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Trọn bộ nguyên liệu đơn giản: bắp hạt khô, bơ thơm béo và Bột phô mai BOYO 65g.</p>
</div>

<h2>Công Thức 3 Bước Làm Bắp Nổ Bung Cánh 100%:</h2>

<h3>Bước 1: Nổ Bắp Bung Đều Bằng Nồi Thường</h3>
<p>
    Đặt một chiếc nồi sâu lòng hoặc chảo chống dính có nắp vung (ưu tiên nắp kính trong suốt) lên bếp. Cho 2 thìa canh dầu ăn vào đun nóng ở lửa vừa.
</p>
<p>
    <strong>Bí quyết thử nhiệt độ:</strong> Thả trước 2 - 3 hạt bắp vào nồi, đậy nắp lại. Khi thấy 2 hạt bắp này nổ bung cánh thì dầu đã đạt độ nóng lý tưởng. Lúc này trút toàn bộ 100g bắp còn lại vào, đảo nhanh tay để dầu bao đều các hạt bắp rồi đậy vung lại.
</p>
<p>
    Khi tiếng nổ "bốp, bốp" bắt đầu vang lên dồn dập, bạn giữ nhẹ tay lên quai nồi và lắc nhẹ qua lại trên mặt bếp mỗi 5 - 10 giây. Động tác lắc này giúp các hạt bắp chưa nổ rơi xuống đáy tiếp xúc nhiệt, còn các hạt bắp đã nở nổi lên trên, tránh bị cháy khét. Khi tiếng nổ thưa dần (cách nhau khoảng 2-3 giây) thì tắt bếp ngay, giữ nguyên nắp 30 giây để các hạt cuối cùng nổ hết.
</p>

<div class="my-6 text-center">
    <img src="/boyo_popcorn_step1.jpg" alt="Bước 1: Nổ bắp bung cánh trắng muốt giòn xốp bằng nồi thường" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 1: Từng cánh bắp bung nở trắng muốt, giòn xốp 100% không lo cháy khét.</p>
</div>

<h3>Bước 2: Áo Lớp Bơ Thơm Lừng & Giòn Lâu</h3>
<p>
    Mở nắp vung nồi, cho ngay 30g bơ lạt và 1-2 thìa đường cát vào lúc bắp còn đang nóng rực. Dùng đũa hoặc muôi gỗ đảo nhanh tay trong 30 giây. Hơi nóng của bắp sẽ làm bơ tan chảy ngay lập tức, phủ một lớp bóng bẩy và thơm phức quanh từng cánh bắp.
</p>

<div class="my-6 text-center">
    <img src="/boyo_popcorn_step2.jpg" alt="Bước 2: Áo lớp bơ vàng ruộm óng ả quanh từng hạt bắp" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 2: Bắp được áo lớp bơ vàng bóng bẩy, thơm lừng và giữ độ giòn tan bền bỉ.</p>
</div>

<h3>Bước 3: Rắc Phô Mai BOYO 65G & Lắc Đều Tay</h3>
<p>
    Đổ toàn bộ bắp ra một chiếc âu lớn, tô inox hoặc một túi giấy sạch. Đợi khoảng 30 giây cho hơi nước thoát bớt (giúp bắp giữ độ giòn tan lâu hơn).
</p>
<p>
    Rắc đều 2 - 3 thìa <strong>Bột phô mai BOYO 65g</strong> lên khắp mặt bắp. Dùng nắp đậy âu lại hoặc gấp miệng túi giấy, lắc đều tay theo hình tròn trong 10-15 giây.
</p>
<p>
    Hạt bột phô mai BOYO mịn tơi, có độ bám dính vượt trội sẽ bao bọc 360 độ quanh từng rãnh nhỏ của cánh bắp. Màu cam vàng bắt mắt cùng hương vị béo mặn ngọt hài hòa sẽ khiến bạn ăn mãi không ngừng được!
</p>

<div class="my-6 text-center">
    <img src="/boyo_popcorn_step3.jpg" alt="Bước 3: Bắp rang bơ áo đều bột phô mai BOYO chuẩn vị rạp chiếu phim" class="rounded-2xl shadow-md mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 3: Từng cánh bắp thấm đẫm bột phô mai BOYO vàng cam, thơm ngậy chuẩn vị rạp CGV!</p>
</div>

<!-- KHỐI MUA HÀNG TRỰC TIẾP TẠI WEB LYHU & SHOPEE CHÍNH HÃNG -->
<div class="not-prose my-10 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-sm">
    <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="w-36 h-36 flex-shrink-0 bg-white rounded-2xl p-2 border border-amber-200 shadow-sm flex items-center justify-center overflow-hidden">
            <img src="/boyo_65g_pack.jpg" alt="Bột phô mai BOYO 65g chính hãng" class="max-h-full w-auto object-contain" />
        </div>
        <div class="flex-1 text-center sm:text-left">
            <span class="inline-block bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">⭐ Gia Vị Ăn Vặt Khuyên Dùng</span>
            <h4 class="text-xl font-bold text-gray-900 mb-1">Bột Phô Mai BOYO 65g – Hương Vị Béo Ngậy Chuẩn Vị Quán</h4>
            <p class="text-sm text-gray-600 mb-3">Túi zip nhỏ tiện dụng, hạt bột mịn bám dính 360 độ, lên màu vàng cam bắt mắt. Vừa vặn cho 3-4 bữa ăn vặt gia đình!</p>
            <div class="flex items-baseline gap-2 justify-center sm:justify-start mb-4">
                <span class="text-2xl font-black text-amber-600">22.000đ</span>
                <span class="text-xs text-gray-500 font-medium">/ gói 65g</span>
            </div>
            <div class="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <a href="/?p=b2f6a52f-ea58-470c-8014-b49600298e11" target="_blank" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm px-5 py-2.5 rounded-xl shadow transition-all hover:scale-105" style="color: #ffffff !important; text-decoration: none !important;">
                    <span style="color: #ffffff !important; font-weight: 700;">🛒 Đặt Mua Tại LYHU.com.vn</span>
                </a>
                <a href="https://shopee.vn/boyo.vn?shopCollection=16825877#product_list" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-[#EE4D2D] hover:bg-[#d43f20] font-bold text-sm px-5 py-2.5 rounded-xl shadow transition-all hover:scale-105" style="color: #ffffff !important; text-decoration: none !important;">
                    <span style="color: #ffffff !important; font-weight: 700;">🧡 Mua Shopee: shopee.vn/boyo.vn</span>
                </a>
            </div>
        </div>
    </div>
    <div class="mt-4 pt-3 border-t border-amber-200 text-sm text-gray-700 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>💡 <em>Dành cho tiệm trà sữa, rạp chiếu phim mini, quán ăn vặt:</em></span>
        <a href="/?p=649577ef-2c77-429d-8216-f0771473243a" target="_blank" class="font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1" style="color: #0f766e !important;">
            📦 Xem Bột phô mai BOYO Túi Tiết Kiệm 1kg (199.000đ) &rarr;
        </a>
    </div>
</div>

<h2>Mẹo Nhỏ Để Bắp Rang Bơ Phô Mai Giòn Tan 2-3 Ngày:</h2>
<ul>
    <li><strong>Để bắp thật nguội trước khi đóng hộp:</strong> Nếu bạn làm nhiều ăn không hết, hãy để bắp nguội hoàn toàn ở nhiệt độ phòng rồi mới cho vào túi zip hoặc hũ thủy tinh đậy kín nắp.</li>
    <li><strong>Không để bột phô mai vào nồi lúc đang đun:</strong> Bột phô mai chứa đường và sữa, nếu cho trực tiếp vào nồi đang đun lửa lớn sẽ bị caramel hóa và cháy đen. Luôn luôn nổ bắp xong, áo bơ rồi mới trút ra âu rắc bột phô mai BOYO.</li>
</ul>

<div class="p-5 bg-teal-50 rounded-xl border-l-4 border-teal-600 my-6">
    <p class="text-teal-900 font-medium mb-1">🍟 <strong>Khám phá thêm công thức hot:</strong></p>
    <p class="text-sm text-teal-800">
        Bạn thích các món lắc phô mai? Đừng bỏ lỡ bài viết: <a href="/tin-tuc/cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g" class="font-bold underline text-teal-900 hover:text-teal-950">Cách làm khoai tây lắc phô mai bằng nồi chiên không dầu giòn rụm chỉ 15 phút</a>!
    </p>
</div>

<p class="mt-8 text-gray-700">
    Chúc bạn thực hiện thành công mẻ bắp rang bơ phô mai thơm ngon tuyệt đỉnh này cho cả gia đình! Hãy theo dõi chuyên mục <strong>Ẩm Thực & Nấu Ăn</strong> tại website <strong>lyhu.com.vn</strong> để cập nhật thêm nhiều công thức món ngon độc đáo nhé!
</p>
${addressBlock}
`
    };

    const postsToUpsert = [post1, post2, post3, post4];
    const results = [];

    for (const p of postsToUpsert) {
        const { data: existing } = await supabase.from('blog_posts').select('id').eq('slug', p.slug).maybeSingle();

        const postPayload = {
            ...p,
            published_at: new Date().toISOString()
        };

        let res;
        if (existing) {
            res = await supabase.from('blog_posts').update(postPayload).eq('slug', p.slug).select();
        } else {
            res = await supabase.from('blog_posts').insert([postPayload]).select();
        }

        results.push({
            slug: p.slug,
            success: !res.error,
            id: res.data ? res.data[0]?.id : null,
            error: res.error ? res.error.message : null,
            url: `https://lyhu.com.vn/tin-tuc/${p.slug}`
        });
    }

    return NextResponse.json({
        success: true,
        message: 'Processed 4 BOYO news posts successfully!',
        results
    });
}
