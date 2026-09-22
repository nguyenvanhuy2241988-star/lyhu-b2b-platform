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

    // -------------------------------------------------------------------------
    // BÀI 5: BÀI TRỤ CỘT (PILLAR PAGE - ĐƯA TỪ KHÓA BỘT PHÔ MAI LÊN TOP 1 GOOGLE)
    // -------------------------------------------------------------------------
    const post5 = {
        title: 'Bột Phô Mai: Toàn Tập Tiêu Chuẩn Chọn Loại Ngon, Cách Dùng & Bảng Giá Sỉ Lẻ Mới Nhất 2026',
        slug: 'bot-pho-mai-toan-tap-tieu-chuan-cach-dung-bang-gia',
        thumbnail_url: '/boyo_master_poster_v3.jpg',
        category_id: '10db3b9f-0fc3-430c-a435-9c76a5e00c36', // Ẩm Thực & Nấu Ăn
        status: 'published',
        ai_summary: 'Cẩm nang toàn tập về bột phô mai: nguồn gốc, 4 tiêu chí chọn bột phô mai ngon bám dính 360 độ, gợi ý 6 món ăn vặt hái ra tiền và bảng báo giá sỉ lẻ mới nhất 2026 từ LYHU & Shopee.',
        meta_title: 'Bột Phô Mai: Tiêu Chuẩn Chọn Loại Ngon, Cách Dùng & Báo Giá 2026 | LYHU',
        meta_description: 'Cẩm nang toàn tập về bột phô mai: nguồn gốc, 4 tiêu chí chọn bột ngon bám dính 360 độ, gợi ý 6 món ăn vặt hái ra tiền và bảng giá sỉ lẻ mới nhất từ LYHU & Shopee!',
        keywords: 'bột phô mai, bot pho mai, bột phô mai truyền thống, bột phô mai lắc khoai, bột phô mai boyo, mua bột phô mai, bột phô mai giá sỉ, bột phô mai 1kg, bột phô mai gói nhỏ, lyhu, shopee boyo',
        content: `
<p class="lead text-lg font-medium text-gray-700 leading-relaxed mb-6">
    Từ những xe khoai tây lắc giòn rụm trước cổng trường học, những xô bắp rang bơ thơm phức tại các rạp chiếu phim CGV, cho đến những bữa ăn vặt cuối tuần tại gian bếp gia đình – <strong>bột phô mai</strong> đã trở thành "linh hồn" tạo nên sức hút khó cưỡng cho vô vàn món ăn khoái khẩu. Thế nhưng, <em>bột phô mai là gì? Tiêu chí nào phân biệt bột phô mai cao cấp chuẩn vị với các loại bột pha tạp trôi nổi? Nên mua bột phô mai loại nào vừa ngon vừa tiết kiệm?</em> Bài viết này của <strong>LYHU</strong> sẽ cung cấp cho bạn cái nhìn toàn diện từ A - Z!
</p>

<div class="my-8 text-center">
    <img src="/boyo_master_poster_v3.jpg" alt="Bột phô mai BOYO cao cấp bám dính 360 độ quy cách 65g và 1kg" class="rounded-2xl shadow-xl mx-auto w-full max-w-2xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Dòng sản phẩm Bột phô mai BOYO chính hãng do LYHU phân phối – Đầy đủ quy cách 65g cho gia đình và 1kg cho nhà hàng, quán ăn vặt.</p>
</div>

<h2>1. Bột Phô Mai Là Gì? Vì Sao Trở Thành "Cơn Sốt" Ẩm Thực Toàn Cầu?</h2>
<p>
    <strong>Bột phô mai (Cheese Seasoning Powder)</strong> là một chế phẩm gia vị thực phẩm cao cấp được sản xuất từ <strong>phô mai tự nhiên</strong> (thường là dòng Cheddar nguyên chất) kết hợp cùng sữa tươi, bơ và các gia vị điều vị tự nhiên thông qua <strong>công nghệ sấy phun ly tâm hiện đại (Spray Drying)</strong>.
</p>
<p>
    Khác với phô mai khối hay phô mai sợi tươi (cần bảo quản lạnh nghiêm ngặt và phải nấu chảy ở nhiệt độ cao), bột phô mai sở hữu những ưu điểm vượt trội:
</p>
<ul>
    <li><strong>Tiện dụng tuyệt đối:</strong> Dạng bột tơi mịn, rắc trực tiếp lên món ăn chín còn nóng mà không cần qua bất kỳ công đoạn chế biến phức tạp nào.</li>
    <li><strong>Bảo quản dễ dàng:</strong> Có thể lưu trữ ở nhiệt độ phòng trong túi zip kín tới 12 tháng mà không sợ hỏng mốc.</li>
    <li><strong>Vị giác bùng nổ:</strong> Hương thơm phô mai cô đặc kết hợp cùng vị ngọt mặn hài hòa kích thích vị giác mạnh mẽ, khiến người ăn "càng ăn càng cuốn".</li>
</ul>

<div class="p-5 bg-amber-50 rounded-2xl border border-amber-200 my-6">
    <h3 class="text-lg font-bold text-amber-900 mb-2">💡 Bạn có biết?</h3>
    <p class="text-gray-700 text-sm leading-relaxed">
        Trào lưu <em>"Rắc phô mai lên cả thế giới"</em> bắt nguồn từ các kinh đô ẩm thực đường phố như Hàn Quốc, Đài Loan và nhanh chóng tạo nên cơn sốt bùng nổ tại Việt Nam từ năm 2018 đến nay. Bột phô mai hiện diện trong hơn 70% thực đơn của các chuỗi gà rán, khoai lắc và tiệm trà sữa trên toàn quốc.
    </p>
</div>

<h2>2. 4 Tiêu Chí "Vàng" Nhận Biết Bột Phô Mai Ngon, Chất Lượng Cao</h2>
<p>
    Trên thị trường hiện nay có hàng chục nhãn hiệu bột phô mai với mức giá từ vài chục nghìn đến vài trăm nghìn đồng. Để chọn được loại bột phô mai thơm ngon chuẩn vị, không gây ngấy và an toàn cho sức khỏe, bạn cần dựa trên 4 tiêu chí cốt lõi sau:
</p>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
    <div class="p-5 bg-white rounded-2xl border-2 border-amber-300 shadow-sm">
        <div class="text-2xl mb-2">🧀</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">1. Khả Năng Bám Dính 360°</h3>
        <p class="text-sm text-gray-600 leading-relaxed">
            Hạt bột phải tơi mịn, xốp nhẹ và có độ bám dính tự nhiên khi tiếp xúc với món ăn còn ấm nóng. Bột chất lượng kém thường bị bột độn quá nhiều, khi lắc sẽ rơi tuột hết xuống đáy hộp, gây lãng phí và món ăn nhạt nhẽo.
        </p>
    </div>
    <div class="p-5 bg-white rounded-2xl border-2 border-emerald-300 shadow-sm">
        <div class="text-2xl mb-2">👅</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">2. Vị Béo Ngọt Mặn Cân Bằng</h3>
        <p class="text-sm text-gray-600 leading-relaxed">
            Bột phô mai chuẩn phải có hậu vị béo ngậy đặc trưng của sữa và phô mai, kèm vị ngọt dịu và mặn nhẹ thanh thoát. Tránh các loại bột giá rẻ bị pha nhiều muối (ăn rất chát, khé cổ) hoặc pha nhiều đường hóa học gây gắt họng.
        </p>
    </div>
    <div class="p-5 bg-white rounded-2xl border-2 border-orange-300 shadow-sm">
        <div class="text-2xl mb-2">✨</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">3. Màu Sắc Vàng Cam Tự Nhiên</h3>
        <p class="text-sm text-gray-600 leading-relaxed">
            Màu vàng cam óng ả đặc trưng của phô mai Cheddar. Khi áo đều quanh cọng khoai hay miếng gà rán sẽ tạo nên bề mặt bóng bẩy, bắt mắt tự nhiên mà không để lại vệt phẩm màu đỏ gắt trên tay người ăn.
        </p>
    </div>
    <div class="p-5 bg-white rounded-2xl border-2 border-teal-300 shadow-sm">
        <div class="text-2xl mb-2">📦</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">4. Đóng Gói Chống Ẩm Thông Minh</h3>
        <p class="text-sm text-gray-600 leading-relaxed">
            Bột phô mai rất háo nước. Do đó bao bì phải là màng nhôm tráng bạc chuyên dụng hoặc túi zip 3 lớp kín khí. Với gia đình, nên ưu tiên gói nhỏ (65g) để dùng 3-4 lần là hết, tránh mua gói quá lớn dùng dở bị vón cục.
        </p>
    </div>
</div>

<h2>3. Top 6 Món Ăn Vặt "Hái Ra Tiền" Và "Gây Nghiện" Nhất Cùng Bột Phô Mai</h2>
<p>
    Chỉ với một gói bột phô mai trong tay, bạn có thể biến tấu hàng chục món ăn từ bếp nhà đến quán kinh doanh:
</p>

<div class="space-y-8 my-8">
    <div class="p-6 bg-white rounded-2xl border-2 border-orange-200 shadow-sm">
        <h3 class="font-bold text-orange-950 text-xl mb-2">🍟 1. Khoai Tây Chiên Lắc Phô Mai (Best Seller Quốc Dân)</h3>
        <p class="text-gray-700 text-sm leading-relaxed mb-4">
            Từng cọng khoai chiên vàng giòn rụm bên ngoài, bở xốp bên trong, áo đều lớp bột phô mai vàng óng béo ngậy. Món ăn kinh điển số 1 của mọi tiệm trà sữa, xe ăn vặt và chuỗi fast-food.
        </p>
        <div class="text-center my-4">
            <img src="/boyo_dish_fries.jpg" alt="Khoai tây chiên lắc bột phô mai BOYO vàng óng giòn rụm" class="rounded-xl shadow-md mx-auto w-full max-w-xl object-cover max-h-96" />
            <p class="text-xs text-gray-500 mt-2 italic">Từng cọng khoai tây chiên giòn tan được lắc đều tay cùng bột phô mai BOYO bám phủ 360 độ.</p>
        </div>
        <p class="text-sm text-teal-800 font-medium">
            👉 <em>Xem ngay công thức chi tiết:</em> <a href="/tin-tuc/cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g" class="text-teal-700 font-bold underline hover:text-teal-900">Cách làm khoai tây lắc phô mai bằng nồi chiên không dầu chỉ 15 phút tại nhà</a>.
        </p>
    </div>

    <div class="p-6 bg-white rounded-2xl border-2 border-amber-200 shadow-sm">
        <h3 class="font-bold text-amber-950 text-xl mb-2">🍿 2. Bắp Rang Bơ Phô Mai Chuẩn Vị Rạp Phim CGV</h3>
        <p class="text-gray-700 text-sm leading-relaxed mb-4">
            Hạt bắp nổ bung cánh bướm trắng muốt, thơm lừng bơ sữa, áo trọn lớp phô mai béo mặn đậm đà. Món ăn vặt không thể thiếu trong các buổi xem phim cuối tuần cùng gia đình và bạn bè.
        </p>
        <div class="text-center my-4">
            <img src="/boyo_dish_popcorn.jpg" alt="Bắp rang bơ áo đều bột phô mai Cheddar béo ngậy chuẩn vị rạp phim" class="rounded-xl shadow-md mx-auto w-full max-w-xl object-cover max-h-96" />
            <p class="text-xs text-gray-500 mt-2 italic">Cận cảnh từng cánh bắp nổ bung áo đẫm bột phô mai cheddar vàng cam óng ả, giòn rụm khó cưỡng.</p>
        </div>
        <p class="text-sm text-teal-800 font-medium">
            👉 <em>Xem ngay công thức chi tiết:</em> <a href="/tin-tuc/cach-lam-bap-rang-bo-pho-mai-chuan-vi-rap-phim-boyo-65g" class="text-teal-700 font-bold underline hover:text-teal-900">Cách làm bắp rang bơ phô mai bằng nồi thường nổ bung 100%</a>.
        </p>
    </div>

    <div class="p-6 bg-white rounded-2xl border-2 border-yellow-200 shadow-sm">
        <h3 class="font-bold text-yellow-950 text-xl mb-2">🍗 3. Gà Viên Chiên Giòn (Popcorn Chicken) Lắc Phô Mai</h3>
        <p class="text-gray-700 text-sm leading-relaxed mb-4">
            Thịt ức gà mềm mọng cắt hạt lựu, tẩm bột chiên xù giòn tan ráo dầu, lắc đều cùng bột phô mai thơm nức mũi. Món ăn yêu thích nhất của các bạn nhỏ và học sinh sinh viên với hương vị thơm ngậy kích thích vị giác.
        </p>
        <div class="text-center my-4">
            <img src="/boyo_dish_chicken.jpg" alt="Gà viên chiên giòn rụm lắc bột phô mai chuẩn vị ăn vặt" class="rounded-xl shadow-md mx-auto w-full max-w-xl object-cover max-h-96" />
            <p class="text-xs text-gray-500 mt-2 italic">Đĩa gà viên giòn rụm vừa ra lò, lớp vỏ vàng ươm chuẩn bị được phủ đẫm bột phô mai thơm ngậy.</p>
        </div>
    </div>

    <div class="p-6 bg-white rounded-2xl border-2 border-emerald-200 shadow-sm">
        <h3 class="font-bold text-emerald-950 text-xl mb-2">🍠 4. Khoai Lang Lắc & Khoai Lang Kén Phô Mai</h3>
        <p class="text-gray-700 text-sm leading-relaxed mb-4">
            Vị ngọt bùi tự nhiên của khoai lang kết hợp hoàn hảo cùng vị béo mặn của phô mai BOYO, tạo nên sự cân bằng hương vị độc đáo, ăn hoài không ngấy và là món ăn vặt đường phố rất được chuộng vào mùa thu đông.
        </p>
        <div class="text-center my-4">
            <img src="/boyo_dish_sweet_potato.jpg" alt="Khoai lang lắc bột phô mai béo ngậy ngọt bùi" class="rounded-xl shadow-md mx-auto w-full max-w-xl object-cover max-h-96" />
            <p class="text-xs text-gray-500 mt-2 italic">Xửng khoai lang chiên vàng ruộm, kết hợp tuyệt hảo với vị mặn ngọt hài hòa của phô mai.</p>
        </div>
    </div>

    <div class="p-6 bg-white rounded-2xl border-2 border-indigo-200 shadow-sm">
        <h3 class="font-bold text-indigo-950 text-xl mb-2">🍢 5. Bánh Gạo Chiên Lắc Phô Mai (Tteokbokki Cheese Shake)</h3>
        <p class="text-gray-700 text-sm leading-relaxed mb-4">
            Thỏi bánh gạo Hàn Quốc dẻo dai bên trong, lớp vỏ ngoài chiên giòn rụm, lắc đẫm bột phô mai truyền thống tạo nên món ăn vặt đường phố chuẩn vị Seoul cực kỳ cuốn hút giới trẻ.
        </p>
        <div class="text-center my-4">
            <img src="/boyo_dish_tteokbokki.jpg" alt="Bánh gạo chiên lắc phô mai chuẩn vị Hàn Quốc" class="rounded-xl shadow-md mx-auto w-full max-w-xl object-cover max-h-96" />
            <p class="text-xs text-gray-500 mt-2 italic">Xiên bánh gạo chiên giòn vỏ, dẻo dai bên trong lắc đẫm phô mai béo mặn ngọt.</p>
        </div>
    </div>

    <div class="p-6 bg-white rounded-2xl border-2 border-teal-200 shadow-sm">
        <h3 class="font-bold text-teal-950 text-xl mb-2">🥖 6. Bánh Tráng Chiên Giòn & Nui Chiên Lắc Phô Mai</h3>
        <p class="text-gray-700 text-sm leading-relaxed">
            Món ăn vặt "cứu đói" thần tốc: Nui hoặc bánh tráng cắt nhỏ chiên ngập dầu phồng xốp giòn rụm trong 30 giây, trút ra ráo dầu rồi lắc cùng phô mai BOYO, giòn tan vui miệng và chi phí nguyên liệu cực kỳ tiết kiệm cho học sinh sinh viên.
        </p>
    </div>
</div>

<h2>4. Bảng Báo Giá Bột Phô Mai Sỉ & Lẻ Mới Nhất 2026 (Thương Hiệu BOYO)</h2>
<p>
    Nhằm đáp ứng linh hoạt mọi nhu cầu từ cá nhân tự nấu nướng đến các chuỗi quán ăn vặt và nhà phân phối toàn quốc, <strong>LYHU</strong> mang đến dòng sản phẩm <strong>Bột phô mai BOYO</strong> với 2 lựa chọn quy cách tối ưu:
</p>

<div class="overflow-x-auto my-6">
    <table class="w-full text-left border-collapse border border-gray-200 rounded-xl shadow-sm text-sm">
        <thead>
            <tr class="bg-amber-100 text-amber-950 font-bold">
                <th class="p-3.5 border border-gray-200">Đặc Điểm / Tiêu Chí</th>
                <th class="p-3.5 border border-gray-200">BOYO Gói Nhỏ 65G (Bán Lẻ)</th>
                <th class="p-3.5 border border-gray-200">BOYO Túi Lớn 1KG (Bếp Quán / Sỉ)</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 text-gray-700">
            <tr>
                <td class="p-3.5 font-semibold bg-gray-50">Đối tượng phục vụ</td>
                <td class="p-3.5">Gia đình, bạn trẻ làm món tại nhà, siêu thị mini, tạp hóa</td>
                <td class="p-3.5">Quán ăn vặt, tiệm gà rán, xe khoai lắc, bếp fast-food</td>
            </tr>
            <tr>
                <td class="p-3.5 font-semibold bg-gray-50">Quy cách đóng gói</td>
                <td class="p-3.5">Túi zip 65g (Hộp 10 gói / Thùng 60 gói)</td>
                <td class="p-3.5">Túi zip bạc chuyên dụng 1kg (Thùng 10 túi / 10kg)</td>
            </tr>
            <tr>
                <td class="p-3.5 font-semibold bg-gray-50">Số lần phục vụ (Serving)</td>
                <td class="p-3.5">Khoảng 3 - 4 lần ăn vặt gia đình (8-10 phần nhỏ)</td>
                <td class="p-3.5">Lắc được <strong>140 – 160 phần</strong> khoai tây / gà viên</td>
            </tr>
            <tr>
                <td class="p-3.5 font-semibold bg-gray-50">Chi phí gia vị / phần</td>
                <td class="p-3.5">~2.000đ / lần nấu tại nhà</td>
                <td class="p-3.5"><strong>Chỉ ~1.200đ - 1.400đ / phần lắc tại quán</strong></td>
            </tr>
            <tr>
                <td class="p-3.5 font-semibold bg-gray-50">Giá bán lẻ niêm yết</td>
                <td class="p-3.5 text-amber-700 font-bold text-base">22.000đ / gói</td>
                <td class="p-3.5 text-emerald-700 font-bold text-base">199.000đ / túi 1kg</td>
            </tr>
            <tr>
                <td class="p-3.5 font-semibold bg-gray-50">Chính sách giá sỉ B2B</td>
                <td class="p-3.5">Chiết khấu theo thùng, hỗ trợ khay trưng bày quầy kệ</td>
                <td class="p-3.5">Giá sỉ tận xưởng theo số lượng thùng, giao hàng toàn quốc</td>
            </tr>
        </tbody>
    </table>
</div>

<div class="my-8 text-center">
    <img src="/boyo_65g_poster.jpg" alt="Poster Bột phô mai BOYO 65g nhỏ gọn dễ chọn" class="rounded-2xl shadow-lg mx-auto w-full max-w-xl" />
    <p class="text-sm text-gray-500 mt-2 italic">BOYO 65g thiết kế hộp 10 gói thông minh mở nắp thành khay quầy kệ, kích thích mua sắm bốc thêm tại quầy thu ngân.</p>
</div>

<h2>5. Giải Đáp Thắc Mắc Thường Gặp (FAQ Về Bột Phô Mai)</h2>

<div class="space-y-4 my-6">
    <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h3 class="font-bold text-gray-900 text-base mb-2">❓ Bột phô mai có ăn sống (ăn trực tiếp) được không?</h3>
        <p class="text-sm text-gray-700 leading-relaxed">
            <strong>Hoàn toàn có thể!</strong> Bột phô mai BOYO được chế biến từ quy trình sấy nhiệt thanh trùng hiện đại, đạt tiêu chuẩn vệ sinh an toàn thực phẩm. Bạn có thể rắc ăn trực tiếp lên hoa quả, bánh quy, mì tôm, salad hoặc các món đã nấu chín mà không cần đun nấu lại.
        </p>
    </div>

    <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h3 class="font-bold text-gray-900 text-base mb-2">❓ Tại sao khi lắc khoai tây hay bị chảy nước hoặc vón cục?</h3>
        <p class="text-sm text-gray-700 leading-relaxed">
            Nguyên nhân là do <strong>khoai còn quá nhiều hơi nước bốc lên</strong> hoặc <strong>còn đọng nhiều dầu ăn</strong>. Bí quyết: Sau khi chiên khoai xong, bạn trút khoai ra rổ cho ráo dầu và đợi khoảng <strong>30 - 45 giây</strong> để hơi nóng bốc bớt đi. Khi khoai còn ấm nóng nhưng bề mặt khô ráo, mới cho vào túi/hộp rắc bột phô mai lắc. Bột sẽ áo đều 360 độ mà không hề bị ướt!
        </p>
    </div>

    <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h3 class="font-bold text-gray-900 text-base mb-2">❓ Cách bảo quản bột phô mai tốt nhất sau khi mở gói?</h3>
        <p class="text-sm text-gray-700 leading-relaxed">
            Sau khi mở gói, bạn chỉ cần miết chặt miệng khóa zip (với túi zip) hoặc đậy kín nắp hũ, để ở nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ cao gần bếp ga. Nếu ở khu vực độ ẩm không khí cao, bạn có thể bảo quản trong ngăn mát tủ lạnh để bột giữ độ tơi xốp suốt nhiều tháng.
        </p>
    </div>

    <div class="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h3 class="font-bold text-gray-900 text-base mb-2">❓ Mua bột phô mai BOYO chính hãng ở đâu uy tín nhất?</h3>
        <p class="text-sm text-gray-700 leading-relaxed">
            Quý khách có thể đặt mua hàng trực tiếp trên hệ sinh thái chính hãng của <strong>LYHU</strong>:
            <br />
            • Đặt hàng trực tiếp tại website: <strong>lyhu.com.vn</strong> hoặc <strong>lyhu.vn</strong>.
            <br />
            • Mua lẻ giao hàng hỏa tốc toàn quốc qua gian hàng Shopee chính thức: <a href="https://shopee.vn/boyo.vn?shopCollection=16825877#product_list" target="_blank" rel="noopener noreferrer" class="text-orange-600 font-bold underline">shopee.vn/boyo.vn</a>.
            <br />
            • Đại lý & nhà phân phối liên hệ trực tiếp hotline / Zalo: <strong>0969 069 798</strong> để nhận mẫu thử và chính sách giá sỉ tốt nhất.
        </p>
    </div>
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
        <span>💡 <em>Dành cho chủ quán ăn vặt, tiệm trà sữa, bếp fast-food:</em></span>
        <a href="/?p=649577ef-2c77-429d-8216-f0771473243a" target="_blank" class="font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1" style="color: #0f766e !important;">
            📦 Xem Bột phô mai BOYO Túi Tiết Kiệm 1kg (199.000đ) &rarr;
        </a>
    </div>
</div>

<p class="mt-8 text-gray-700">
    Hy vọng cẩm nang toàn diện trên đây đã giúp bạn hiểu rõ hơn về thế giới bột phô mai và chọn được sản phẩm ưng ý nhất cho gia đình hoặc mô hình kinh doanh của mình. Đừng quên theo dõi chuyên mục tin tức tại <strong>lyhu.com.vn</strong> để đón đọc thêm nhiều bí quyết ẩm thực và kinh doanh hữu ích!
</p>
${addressBlock}
`
    };

    // -------------------------------------------------------------------------
    // BÀI 6: CÔNG THỨC GÀ VIÊN POPCORN LẮC PHÔ MAI NỒI CHIÊN KHÔNG DẦU
    // -------------------------------------------------------------------------
    const post6 = {
        title: 'Cách Làm Gà Viên Lắc Phô Mai (Popcorn Chicken) Giòn Rụm Bằng Nồi Chiên Không Dầu Tại Nhà Với BOYO 65G',
        slug: 'cach-lam-ga-vien-lac-pho-mai-noi-chien-khong-dau-boyo-65g',
        thumbnail_url: '/boyo_chicken_banner.jpg',
        category_id: '10db3b9f-0fc3-430c-a435-9c76a5e00c36', // Ẩm Thực & Nấu Ăn
        status: 'published',
        ai_summary: 'Bí quyết làm gà viên chiên giòn (Popcorn Chicken) chuẩn vị KFC bằng nồi chiên không dầu tại nhà, không ngấy mỡ. Thịt gà bên trong mềm mọng, lớp vỏ panko vàng rụm hòa quyện cùng bột phô mai BOYO 65g béo ngậy ngọt mặn cực cuốn hút.',
        meta_title: 'Cách Làm Gà Viên Lắc Phô Mai Giòn Rụm Bằng Nồi Chiên Không Dầu | BOYO',
        meta_description: 'Hướng dẫn tự làm gà viên lắc phô mai (Popcorn Chicken) tại nhà bằng nồi chiên không dầu giòn rụm không khô thịt, phủ đẫm bột phô mai BOYO 65g béo mặn chuẩn vị gà rán KFC!',
        keywords: 'cách làm gà viên lắc phô mai, gà popcorn lắc phô mai nồi chiên không dầu, gà lắc phô mai kfc, bột phô mai boyo 65g, bột phô mai lyhu, popcorn chicken',
        content: `
<p class="lead text-lg font-medium text-gray-700 leading-relaxed mb-6">
    Từng miếng <strong>gà viên giòn tan (Popcorn Chicken)</strong> vàng ươm, bên trong thịt ức gà mềm ngọt mọng nước, bên ngoài phủ một lớp <strong>bột phô mai BOYO 65g</strong> cam óng ả thơm ngào ngạt, béo bùi ngọt mặn đê mê... Đó là món ăn vặt "gây nghiện" hàng đầu của cả trẻ nhỏ lẫn người lớn tại các chuỗi gà rán nổi tiếng như KFC, Lotteria hay Jollibee.
</p>

<div class="my-8 text-center">
    <img src="/boyo_chicken_banner.jpg" alt="Tô gà viên popcorn lắc phô mai BOYO thơm lừng giòn rụm" class="rounded-2xl shadow-lg mx-auto w-full max-w-3xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Gà viên Popcorn Chicken lắc phô mai BOYO 65g – Giòn rụm tan trong miệng, đậm đà béo ngậy chuẩn vị nhà hàng.</p>
</div>

<p>
    Nhiều bạn e ngại làm gà rán tại nhà vì sợ <strong>ngấm dầu ngấy, bắn dầu mỡ bẩn bếp</strong> hoặc <strong>thịt ức gà bị khô xác</strong>. Đừng lo! Hôm nay LYHU sẽ hướng dẫn bạn bí quyết làm gà viên lắc phô mai <strong>bằng nồi chiên không dầu</strong> cực kỳ nhanh gọn, tiết kiệm 85% lượng dầu mỡ mà lớp vỏ vẫn giòn rụm như vừa vớt từ chảo dầu chuyên dụng!
</p>

<!-- HỘP THÔNG SỐ CÔNG THỨC -->
<div class="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 rounded-r-xl my-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
            <span class="block text-xs uppercase text-gray-500 font-semibold tracking-wider">Thời gian chuẩn bị</span>
            <span class="text-lg font-bold text-gray-800">15 Phút</span>
        </div>
        <div>
            <span class="block text-xs uppercase text-gray-500 font-semibold tracking-wider">Thời gian nướng</span>
            <span class="text-lg font-bold text-gray-800">18 - 20 Phút</span>
        </div>
        <div>
            <span class="block text-xs uppercase text-gray-500 font-semibold tracking-wider">Khẩu phần</span>
            <span class="text-lg font-bold text-gray-800">3 - 4 Người</span>
        </div>
        <div>
            <span class="block text-xs uppercase text-gray-500 font-semibold tracking-wider">Độ khó</span>
            <span class="text-lg font-bold text-amber-600">Dễ (Ai cũng làm được)</span>
        </div>
    </div>
</div>

<h2>1. Chuẩn Bị Nguyên Liệu Tươi Ngon</h2>
<p>
    Để có được mẻ gà viên ngon đúng điệu, nguyên liệu tươi sạch và gia vị chuẩn là chìa khóa then chốt:
</p>

<div class="my-8 text-center">
    <img src="/boyo_chicken_ingredients.jpg" alt="Nguyên liệu làm gà viên chiên giòn lắc phô mai" class="rounded-2xl shadow-lg mx-auto w-full max-w-3xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bộ nguyên liệu đơn giản: Ức gà tươi, trứng, bột chiên giòn, bột xù panko và Bột phô mai BOYO 65g.</p>
</div>

<ul class="list-disc pl-6 space-y-2 text-gray-700">
    <li><strong>Thịt ức gà tươi:</strong> 500g (chọn phần ức gà mềm, thớ thịt hồng hào, không mùi lạ).</li>
    <li><strong>Sữa tươi không đường:</strong> 100ml (bí quyết giúp thịt gà ngậm nước, mềm tan và khử sạch mùi tanh).</li>
    <li><strong>Gia vị ướp gà:</strong> 1 thìa cà phê tỏi băm nhuyễn (hoặc bột tỏi), 1 thìa cà phê tiêu trắng xay, 1/2 thìa cà phê hạt nêm, 1 thìa cà phê dầu hào, 1 thìa dầu ăn.</li>
    <li><strong>Bột áo ngoài:</strong> 100g bột mì đa dụng (hoặc bột chiên giòn Meizan).</li>
    <li><strong>Trứng gà:</strong> 2 quả đánh tan.</li>
    <li><strong>Bột chiên xù Panko:</strong> 150g (chọn loại vụn xù hạt vừa để tạo độ xốp ròn đỉnh chóp).</li>
    <li><strong>Gia vị linh hồn:</strong> 25g - 30g <strong>Bột phô mai BOYO 65g</strong> (khoảng 3 - 4 thìa canh gạt).</li>
</ul>

<h2>2. Các Bước Làm Gà Viên Lắc Phô Mai Nồi Chiên Không Dầu Chuẩn KFC</h2>

<h3>Bước 1: Sơ chế và ướp thịt gà "ngậm sữa" mọng nước</h3>
<div class="my-6 text-center">
    <img src="/boyo_chicken_step1.jpg" alt="Thái ức gà hạt lựu và ướp sữa tươi đậm đà" class="rounded-2xl shadow-lg mx-auto w-full max-w-3xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 1: Thái ức gà thành viên vuông vừa miệng (2x2cm), ngâm ướp cùng sữa tươi và gia vị 20 phút.</p>
</div>
<ol class="list-decimal pl-6 space-y-2 text-gray-700">
    <li>Ức gà rửa sạch với chút nước muối pha loãng và gừng đập dập, dùng khăn giấy thấm thật khô ráo.</li>
    <li>Dùng dao sắc cắt thịt gà thành các khối vuông quân cờ vừa ăn (kích thước khoảng 2x2 cm). Không nên cắt quá bé gà sẽ teo tóp khi nướng, cũng không cắt quá to gà khó chín đều.</li>
    <li>Cho thịt gà vào âu, đổ 100ml sữa tươi không đường vào ngâm trong 15 phút. Sữa tươi chứa axit lactic nhẹ giúp phá vỡ các sợi cơ dai của ức gà, giữ nước tuyệt đối khi nướng nhiệt cao.</li>
    <li>Chắt bớt sữa (chừa lại khoảng 1 thìa canh), cho tiếp bột tỏi, tiêu xay, hạt nêm, dầu hào và 1 thìa dầu ăn vào trộn đều. Ướp tiếp 15 phút cho thịt ngấm đều vị.</li>
</ol>

<h3>Bước 2: Tẩm 3 lớp bột áo và nướng giòn rụm bằng nồi chiên không dầu</h3>
<div class="my-6 text-center">
    <img src="/boyo_chicken_step2.jpg" alt="Nướng gà viên chiên xù trong khay nồi chiên không dầu" class="rounded-2xl shadow-lg mx-auto w-full max-w-3xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 2: Lăn qua bột giòn - trứng - bột xù, xịt dầu nhẹ và nướng nồi chiên không dầu vàng ruộm.</p>
</div>
<ol class="list-decimal pl-6 space-y-2 text-gray-700">
    <li>Chuẩn bị 3 tô nông cạnh nhau: Tô 1 (bột mì/chiên giòn), Tô 2 (trứng gà đánh tan), Tô 3 (bột chiên xù Panko).</li>
    <li>Gắp từng viên gà lăn qua tô 1 để phủ một lớp bột mỏng (lắc nhẹ rũ bột thừa) &rarr; nhúng ngập qua tô 2 (trứng gà) &rarr; lăn đều vào tô 3 (ấn nhẹ tay để bột xù bám chắc quanh viên gà).</li>
    <li>Làm nóng nồi chiên không dầu ở nhiệt độ <strong>180°C trong 5 phút</strong> trước khi xếp gà.</li>
    <li>Xếp từng viên gà vào giỏ nướng, giữ khoảng cách nhỏ giữa các viên để luồng khí nóng đối lưu hoàn hảo. Dùng bình xịt phun một lớp mỏng dầu ăn lên bề mặt viên gà (giúp bột xù chín giòn xốp và vàng đều không bị bạc trắng).</li>
    <li><strong>Thời gian nướng chuẩn:</strong>
        <ul class="list-disc pl-5 mt-1 space-y-1">
            <li>Lần 1: Nướng ở <strong>180°C trong 10 phút</strong>.</li>
            <li>Lần 2: Mở nồi, lật mặt viên gà, xịt thêm một tia dầu mỏng và nướng tiếp ở <strong>200°C trong 5 - 7 phút</strong> cho lớp vỏ ngoài chuyển màu vàng ruộm, giòn rôm rốp.</li>
        </ul>
    </li>
</ol>

<h3>Bước 3: Lắc đẫm bột phô mai BOYO béo ngậy ngọt mặn cực đã</h3>
<div class="my-6 text-center">
    <img src="/boyo_chicken_step3.jpg" alt="Lắc gà viên chiên giòn cùng bột phô mai BOYO trong âu thủy tinh" class="rounded-2xl shadow-lg mx-auto w-full max-w-3xl" />
    <p class="text-sm text-gray-500 mt-2 italic">Bước 3: Cho gà nóng hổi vào âu, rắc 3 thìa bột phô mai BOYO 65g và xóc đều tay để phô mai bám mịn quanh từng viên thịt.</p>
</div>
<ol class="list-decimal pl-6 space-y-2 text-gray-700">
    <li>Lấy gà viên ra khỏi nồi chiên, để nghỉ trên giấy thấm dầu khoảng <strong>1 phút</strong> để hơi ẩm bay bớt và lớp vỏ cứng cáp hơn (tránh lắc ngay lúc đang ướt hơi nước sẽ làm phô mai bị bết cục).</li>
    <li>Cho gà vào âu lớn (hoặc hộp nhựa đậy nắp). Rắc đều <strong>3 - 4 thìa canh bột phô mai BOYO 65g</strong> lên trên.</li>
    <li>Đậy nắp hoặc dùng tay lắc đều liên tục trong 15 - 20 giây. Bột phô mai BOYO với độ mịn lý chuẩn sẽ phủ đều một lớp áo nhung cam tươi mịn màng quanh từng gờ nhọn của vụn xù panko, tỏa mùi thơm béo ngậy nức mũi!</li>
</ol>

<h2>3. Thành Phẩm Và Trải Nghiệm Thưởng Thức</h2>
<p>
    Gắp một viên gà Popcorn vàng ươm cho vào miệng, bạn sẽ nghe thấy tiếng <strong>rôm rốp</strong> giòn tan của lớp vỏ xù panko. Ngay sau đó là vị béo ngậy, ngọt dịu xen lẫn vị mặn thanh tinh tế của bột phô mai BOYO tan chảy trên đầu lưỡi, hòa quyện với phần thịt gà bên trong mềm ẩm, thơm phức không hề bị khô xác.
</p>
<p>
    Món này chấm kèm tương ớt, tương cà hoặc sốt mayonnaise cay, uống kèm một ly nước ngọt có gas mát lạnh thì ngon không thua kém bất kỳ nhà hàng thức ăn nhanh nào mà chi phí lại chỉ bằng 1/3!
</p>

<!-- BẢNG BÍ QUYẾT -->
<div class="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl my-6">
    <h3 class="text-blue-900 font-bold text-lg mb-2">💡 3 Mẹo Vàng Để Gà Viên Giòn Lâu & Thấm Vị</h3>
    <ul class="list-disc pl-5 space-y-2 text-blue-950 text-sm">
        <li><strong>Không bỏ qua bước ngâm sữa:</strong> Sữa tươi không đường là vũ khí bí mật giúp ức gà mềm mọng nước, không bị xơ cứng như cách chiên truyền thống.</li>
        <li><strong>Độ ẩm khi lắc:</strong> Để gà ráo bớt hơi nước nóng 1 phút trước khi rắc bột phô mai. Nếu lắc khi gà còn ướt sũng, phô mai sẽ hút ẩm tan chảy; nếu để gà nguội ngắt, phô mai lại khó bám dính.</li>
        <li><strong>Chọn đúng bột phô mai chuyên dụng BOYO:</strong> Khác với các dòng phô mai bột nấu xốt dễ vón, <strong>Bột phô mai BOYO 65g</strong> được tinh chế với độ bám dính hoàn hảo trên bề mặt chiên nướng, tạo màu vàng cam hấp dẫn và vị béo mặn ngọt hài hòa không gắt cổ.</li>
    </ul>
</div>

<h2>4. Khám Phá Thêm Các Món Lắc Bột Phô Mai BOYO Tuyệt Đỉnh</h2>
<p>
    Gói bột phô mai BOYO 65g nhỏ gọn còn có thể biến tấu muôn vàn món ăn vặt hấp dẫn khác cho gia đình bạn:
</p>
<ul class="list-disc pl-6 space-y-2 text-gray-700">
    <li>🍟 <a href="/tin-tuc/cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g" class="text-teal-600 font-semibold hover:underline">Cách Làm Khoai Tây Lắc Phô Mai Nồi Chiên Không Dầu Chuẩn Vị Giòn Tan</a></li>
    <li>🍿 <a href="/tin-tuc/cach-lam-bap-rang-bo-pho-mai-chuan-vi-rap-phim-boyo-65g" class="text-teal-600 font-semibold hover:underline">Cách Làm Bắp Rang Bơ Phô Mai Chuẩn Vị Rạp Phim Bằng Chảo Tại Nhà</a></li>
    <li>📖 <a href="/tin-tuc/bot-pho-mai-toan-tap-tieu-chuan-cach-dung-bang-gia" class="text-teal-600 font-semibold hover:underline">Bột Phô Mai Toàn Tập: Tiêu Chuẩn Chất Lượng, Cách Dùng & Bảng Giá Mới Nhất</a></li>
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
        <span>💡 <em>Dành cho chủ quán gà rán, quán ăn vặt, tiệm trà sữa:</em></span>
        <a href="/?p=649577ef-2c77-429d-8216-f0771473243a" target="_blank" class="font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1" style="color: #0f766e !important;">
            📦 Xem Bột phô mai BOYO Túi Tiết Kiệm 1kg (199.000đ) &rarr;
        </a>
    </div>
</div>

<p class="mt-8 text-gray-700">
    Hãy vào bếp thử ngay công thức gà viên lắc phô mai giòn rụm này để chiêu đãi cả nhà vào dịp cuối tuần hoặc làm món ăn xế cho các bé. Chúc bạn thực hiện thành công và có những phút giây sum vầy thật ngon miệng!
</p>
${addressBlock}
`
    };

    const postsToUpsert = [post1, post2, post3, post4, post5, post6];
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
        message: 'Processed 6 BOYO news posts successfully!',
        results
    });
}

