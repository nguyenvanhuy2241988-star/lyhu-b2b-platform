import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const mockPosts = [
    {
        title: "Bùng Nổ Xu Hướng Kẹo Dẻo UHI: Học Sinh Xếp Hàng Mua Sạch Trong 2 Giờ",
        slug: "bung-no-xu-huong-keo-deo-uhi-hoc-sinh-xep-hang-mua-sach-trong-2-gio",
        thumbnail_url: "https://images.pexels.com/photos/1906437/pexels-photo-1906437.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Kẹo dẻo chua UHI đang tạo nên cơn sốt chưa từng có tại các cổng trường học. Ghi nhận thực tế tại 500 tạp hóa ở TP.HCM.",
        category_name: "Xu hướng Ăn vặt",
        offsetDays: 0
    },
    {
        title: "Giá Nhập Sỉ Bánh Kẹo Giảm Sâu Đầu Hè: Lộ Diện 'Mỏ Vàng' Cho Tạp Hóa",
        slug: "gia-nhap-si-banh-keo-giam-sau-dau-he-lo-dien-mo-vang-cho-tap-hoa",
        thumbnail_url: "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Nhiều đại lý phân phối lớn đồng loạt tung chiết khấu lên đến 45%, mở ra cơ hội vàng để các siêu thị mini tối đa hóa lợi nhuận mùa hè.",
        category_name: "Nguồn hàng sỉ",
        offsetDays: 1
    },
    {
        title: "Kinh Nghiệm Phân Bổ Vốn 50 Triệu Mở Siêu Thị Mini: 90% Tránh Được Rủi Ro",
        slug: "kinh-nghiem-phan-bo-von-50-trieu-mo-sieu-thi-mini",
        thumbnail_url: "https://images.pexels.com/photos/35979382/pexels-photo-35979382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
        meta_description: "Phân tích chi tiết từng đồng chi phí, từ tiền thuê mặt bằng, trang thiết bị đến cách chọn lọc nguồn hàng sỉ thông minh.",
        category_name: "Kinh nghiệm Mở Quán",
        offsetDays: 2
    },
    {
        title: "Snack Giòn Tan 'Cháy Hàng': Bí Quyết Gom Đơn Của Các Chủ Tạp Hóa Sành Sỏi",
        slug: "snack-gion-tan-chay-hang-bi-quyet-gom-don-cua-cac-chu-tap-hoa-sanh-soi",
        thumbnail_url: "https://images.pexels.com/photos/4187771/pexels-photo-4187771.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Không chỉ dừng lại ở kẹo, các loại snack tẩm gia vị độc lạ đang dần chiếm lĩnh thị phần ăn vặt học đường.",
        category_name: "Xu hướng Ăn vặt",
        offsetDays: 3
    },
    {
        title: "Báo Cáo Quý 1/2026: Doanh Số Chuỗi Siêu Thị Nhỏ Tăng Vọt Nhờ FMCG",
        slug: "bao-cao-quy-1-2026-doanh-so-chuoi-sieu-thi-nho-tang-vot",
        thumbnail_url: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Số liệu mới nhất cho thấy mô hình tạp hóa tiện lợi đang hồi sinh mạnh mẽ trước sức ép của các chuỗi cửa hàng tiện lợi nước ngoài.",
        category_name: "Tin tức",
        offsetDays: 4
    },
    {
        title: "Mở Tạp Hóa Ở Nông Thôn: Cơ Hội Vàng Hay Cái Bẫy 'Chôn Vốn'?",
        slug: "mo-tap-hoa-o-nong-thon-co-hoi-vang-hay-cai-bay",
        thumbnail_url: "https://images.pexels.com/photos/1036856/pexels-photo-1036856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Bài toán dân số và sức mua đang dần dịch chuyển về khu vực ven đô. Liệu đây có phải thời điểm thích hợp để đầu tư?",
        category_name: "Kinh nghiệm Mở Quán",
        offsetDays: 5
    },
    {
        title: "Tuyệt Chiêu Bày Hàng Của Chuyên Gia Kích Thích Khách Mua Thêm 30%",
        slug: "tuyet-chieu-bay-hang-cua-chuyen-gia-kich-thich-khach",
        thumbnail_url: "https://images.pexels.com/photos/3167310/pexels-photo-3167310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Áp dụng quy tắc tam giác vàng và kệ vừa tầm mắt để biến không gian tiệm tạp hóa thành thỏi nam châm hút khách.",
        category_name: "Kinh nghiệm Mở Quán",
        offsetDays: 6
    },
    {
        title: "Đứt Gãy Nguồn Cung: Làm Sao Để Không Bị 'Hớ' Khi Nhập Hàng?",
        slug: "dut-gay-nguon-cung-lam-sao-de-khong-bi-ho",
        thumbnail_url: "https://images.pexels.com/photos/4483679/pexels-photo-4483679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Phân tích từ LYHU về cách chọn đối tác phân phối ổn định, loại bỏ hoàn toàn nỗi lo thiếu hàng trong mùa cao điểm.",
        category_name: "Nguồn hàng sỉ",
        offsetDays: 7
    },
    {
        title: "Bánh Tráng Trộn Đóng Gói Lên Ngôi: Kẻ Thách Thức Bim Bim Truyền Thống",
        slug: "banh-trang-tron-dong-goi-len-ngoi",
        thumbnail_url: "https://images.pexels.com/photos/3058826/pexels-photo-3058826.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Sự tiện lợi và hương vị đậm đà đang giúp món ăn đường phố này lọt vào top best-seller tại hàng ngàn siêu thị mini.",
        category_name: "Xu hướng Ăn vặt",
        offsetDays: 8
    },
    {
        title: "Chính Sách Thuế Mới Tác Động Ra Sao Đến Lợi Nhuận Ngành Bán Lẻ?",
        slug: "chinh-sach-thue-moi-tac-dong-ra-sao-den-nganh-ban-le",
        thumbnail_url: "https://images.pexels.com/photos/4386339/pexels-photo-4386339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        meta_description: "Những thay đổi quan trọng trong quy định hóa đơn điện tử và VAT mà mọi chủ tiệm cần nắm rõ để tránh rủi ro pháp lý.",
        category_name: "Tin tức",
        offsetDays: 9
    }
];

async function seed() {
    console.log("Seeding mock posts...");
    const { data: categories } = await supabase.from('blog_categories').select('id, name');
    
    for (const post of mockPosts) {
        let catId = categories.find(c => c.name.toLowerCase().includes(post.category_name.toLowerCase()))?.id;
        
        const publishedDate = new Date();
        publishedDate.setDate(publishedDate.getDate() - post.offsetDays);

        const contentHtml = `
            <p><strong>(FMCG News)</strong> - Đây là nội dung mẫu được tạo tự động để phục vụ cho việc thiết kế giao diện Tòa soạn báo của hệ thống LYHU.</p>
            <p>Mô hình kinh doanh siêu thị mini và tiệm tạp hóa đang trải qua nhiều biến động lớn. Việc liên tục cập nhật thông tin sẽ giúp các nhà bán lẻ nắm bắt cơ hội tốt hơn.</p>
            <h2>Phân tích thị trường</h2>
            <p>Theo báo cáo mới nhất, thị trường bán lẻ Việt Nam đang chứng kiến sự trỗi dậy mạnh mẽ của các sản phẩm nội địa chất lượng cao. Khách hàng ngày càng thông minh và yêu cầu khắt khe hơn về vệ sinh an toàn thực phẩm.</p>
            <ul>
                <li>Sức mua nhóm đồ ăn vặt tăng 30% trong quý vừa qua.</li>
                <li>Học sinh, sinh viên là nhóm khách hàng chi tiêu mạnh tay nhất.</li>
            </ul>
            <h3>Chiến lược đột phá</h3>
            <p>Để tồn tại, các cửa hàng cần phải nhập hàng tại các nền tảng phân phối sỉ tận xưởng như LYHU để tối đa hóa biên độ lợi nhuận.</p>
            <p>Liên hệ ngay LYHU để nhận báo giá sỉ với chiết khấu lên đến 45%!</p>
        `;

        await supabase.from('blog_posts').upsert({
            title: post.title,
            slug: post.slug,
            category_id: catId || null,
            content: contentHtml,
            meta_description: post.meta_description,
            thumbnail_url: post.thumbnail_url,
            status: 'published',
            published_at: publishedDate.toISOString()
        }, { onConflict: 'slug' });
    }
    console.log("Done seeding!");
}

seed();
