import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

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
    // === ADVISORY: Góc Nhà Phân Phối & Điểm Bán ===
    { topic: "Tuyệt chiêu quản lý hàng tồn kho cho tạp hóa nhỏ: Làm sao để không đọng vốn?", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Cách thiết kế quầy thanh toán siêu thị mini để tăng 15% doanh thu ngẫu hứng.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "5 sai lầm chết người khi nhập hàng giá sỉ qua các hội nhóm Facebook.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Kỹ năng tư vấn chốt sale tại quầy: Biến khách mua 1 món thành mua 3 món.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Giải pháp chống thất thoát hàng hóa hiệu quả nhất cho cửa hàng tạp hóa tự chọn.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Hướng dẫn lên kế hoạch nhập hàng mùa tựu trường cho tiệm tạp hóa.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Chiến lược định giá sản phẩm: Khi nào nên bán rẻ, khi nào nên giữ giá?", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Bí quyết giữ chân khách hàng quen: Đừng chỉ cạnh tranh bằng giá.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "10 combo cross-sell hiệu quả nhất cho tiệm tạp hóa: Mì + trứng, bia + đá + đồ nhắm.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Checklist nhập hàng Tết Trung Thu cho tiệm tạp hóa: Bánh, đèn lồng, kẹo.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },

    // === NEWS: Tin Tức FMCG ===
    { topic: "Bùng nổ xu hướng ăn vặt 'healthy' của Gen Z và tác động đến ngành FMCG.", categorySlug: "tin-tuc-fmcg", categoryName: "Tin Tức FMCG", type: "news" },
    { topic: "Dự báo thị trường bánh kẹo Việt Nam nửa cuối năm 2026: Phân khúc nào sẽ lên ngôi?", categorySlug: "tin-tuc-fmcg", categoryName: "Tin Tức FMCG", type: "news" },
    { topic: "Sự bứt phá của các thương hiệu bánh kẹo nội địa so với hàng nhập khẩu.", categorySlug: "tin-tuc-fmcg", categoryName: "Tin Tức FMCG", type: "news" },
    { topic: "Vinamilk, TH True Milk, Nutifood: Cuộc đua sữa tươi organic năm 2026.", categorySlug: "tin-tuc-fmcg", categoryName: "Tin Tức FMCG", type: "news" },
    { topic: "Thị trường bia Việt Nam 2026: Bia craft, bia 0 độ có đáng nhập cho tiệm?", categorySlug: "tin-tuc-fmcg", categoryName: "Tin Tức FMCG", type: "news" },
    { topic: "Masan ra mắt sản phẩm mới: Cơ hội gì cho nhà phân phối nhỏ?", categorySlug: "tin-tuc-fmcg", categoryName: "Tin Tức FMCG", type: "news" },

    // === REPORT: Báo Cáo Thị Trường ===
    { topic: "Báo cáo: Đánh giá hiệu quả chuỗi cung ứng hàng tiêu dùng nhanh tại thành phố cấp 2.", categorySlug: "bao-cao-thi-truong", categoryName: "Báo Cáo Thị Trường", type: "report" },
    { topic: "Phân tích chuyên sâu: Hành trình mua sắm của người tiêu dùng tại siêu thị mini.", categorySlug: "bao-cao-thi-truong", categoryName: "Báo Cáo Thị Trường", type: "report" },
    { topic: "Tối ưu hóa chi phí vận hành điểm bán: Báo cáo từ các mô hình bán lẻ thành công.", categorySlug: "bao-cao-thi-truong", categoryName: "Báo Cáo Thị Trường", type: "report" },
    { topic: "Khác biệt thị hiếu Bắc-Trung-Nam: Nhập hàng sao cho đúng vùng miền?", categorySlug: "bao-cao-thi-truong", categoryName: "Báo Cáo Thị Trường", type: "report" },

    // === APP & PHẦN MỀM CHO CỬA HÀNG ===
    { topic: "So sánh chi tiết KiotViet vs Sapo POS vs Suno: Phần mềm nào phù hợp tiệm tạp hóa?", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },
    { topic: "Top 7 app quản lý bán hàng miễn phí cho tiệm tạp hóa nhỏ năm 2026.", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },
    { topic: "Hướng dẫn cài đặt máy POS và phần mềm tính tiền cho siêu thị mini từ A-Z.", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },
    { topic: "Camera an ninh cho cửa hàng: Loại nào tốt, giá bao nhiêu, lắp ở đâu?", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },

    // === THANH TOÁN ĐIỆN TỬ ===
    { topic: "MoMo vs ZaloPay vs VNPay: So sánh phí giao dịch và ưu đãi cho chủ tiệm.", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },
    { topic: "Hướng dẫn đăng ký nhận thanh toán QR code cho tiệm tạp hóa: Miễn phí, 5 phút.", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },

    // === TOP LIST ===
    { topic: "Top 10 snack bán chạy nhất mùa hè 2026 tại các tiệm tạp hóa.", categorySlug: "xu-huong-tieu-dung", categoryName: "Xu Hướng Tiêu Dùng", type: "news" },
    { topic: "Top 5 loại nước giải khát mới ra mắt đáng nhập sỉ nhất quý 2/2026.", categorySlug: "xu-huong-tieu-dung", categoryName: "Xu Hướng Tiêu Dùng", type: "news" },
    { topic: "Top 8 sản phẩm ăn vặt Hàn Quốc đang hot tại Việt Nam, giới trẻ mê mẩn.", categorySlug: "xu-huong-tieu-dung", categoryName: "Xu Hướng Tiêu Dùng", type: "news" },
    { topic: "Top 10 thương hiệu mì gói bán chạy nhất Việt Nam 2026: Hảo Hảo còn giữ ngôi?", categorySlug: "xu-huong-tieu-dung", categoryName: "Xu Hướng Tiêu Dùng", type: "news" },

    // === SẢN PHẨM MỚI FMCG ===
    { topic: "Review sản phẩm mới: Sữa chua uống Vinamilk Greek - Giá sỉ và biên lợi nhuận.", categorySlug: "nganh-hang", categoryName: "Ngành Hàng", type: "news" },
    { topic: "Pepsi ra mắt vị mới tại Việt Nam: Cơ hội nào cho điểm bán lẻ?", categorySlug: "nganh-hang", categoryName: "Ngành Hàng", type: "news" },
    { topic: "Xu hướng đồ uống không đường 2026: Coca-Cola Zero, Pepsi Zero hay TH True Tea?", categorySlug: "nganh-hang", categoryName: "Ngành Hàng", type: "news" },

    // === TÀI CHÍNH & KẾ TOÁN CHO CHỦ TIỆM ===
    { topic: "Hướng dẫn xuất hóa đơn điện tử cho cửa hàng tạp hóa nhỏ: Bắt buộc từ 2026.", categorySlug: "phap-ly-chinh-ngach", categoryName: "Pháp Lý & Chính Ngạch", type: "advisory" },
    { topic: "Cách tính lãi lỗ chính xác cho tiệm tạp hóa: Đừng nhầm doanh thu với lợi nhuận.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Thủ tục đăng ký kinh doanh siêu thị mini từ A-Z: Giấy phép, thuế, ATTP.", categorySlug: "phap-ly-chinh-ngach", categoryName: "Pháp Lý & Chính Ngạch", type: "advisory" },

    // === MARKETING CHO CỬA HÀNG ===
    { topic: "Cách chạy quảng cáo Facebook cho tiệm tạp hóa chỉ với 50.000đ/ngày.", categorySlug: "nha-phan-phoi-diem-ban", categoryName: "Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Tạo fanpage, Zalo OA cho tiệm tạp hóa: Hướng dẫn chi tiết cho người không biết IT.", categorySlug: "nha-phan-phoi-diem-ban", categoryName: "Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Bán hàng tạp hóa trên TikTok Shop: Có nên không? Hướng dẫn từ đầu.", categorySlug: "nha-phan-phoi-diem-ban", categoryName: "Nhà Phân Phối & Điểm Bán", type: "advisory" },

    // === THIẾT KẾ & BÀY TRÍ CỬA HÀNG ===
    { topic: "5 mẫu bày kệ siêu thị mini dưới 30m² đẹp, khoa học và tối ưu doanh thu.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Bảng hiệu, biển quảng cáo cho tiệm tạp hóa: Làm sao cho đẹp mà rẻ?", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Ánh sáng trong cửa hàng: Tại sao đèn LED trắng giúp bán hàng tốt hơn?", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },

    // === NHƯỢNG QUYỀN & MÔ HÌNH ===
    { topic: "Mở cửa hàng Bách Hóa Xanh, Circle K, GS25: Chi phí thật sự là bao nhiêu?", categorySlug: "ban-le-hien-dai", categoryName: "Bán Lẻ Hiện Đại", type: "report" },
    { topic: "Mô hình tạp hóa kết hợp trà sữa, cà phê: Có đáng đầu tư không?", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },

    // === GIAO HÀNG & ONLINE ===
    { topic: "Đăng ký GrabMart, ShopeeFood cho tiệm tạp hóa: Hướng dẫn từ A-Z.", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },
    { topic: "Nhận đơn online cho tiệm tạp hóa qua Zalo, Facebook: Không cần app phức tạp.", categorySlug: "cong-nghe-ban-le", categoryName: "Công Nghệ Bán Lẻ", type: "advisory" },

    // === NHÂN SỰ CỬA HÀNG ===
    { topic: "Cách tuyển và giữ chân nhân viên bán hàng ở tiệm tạp hóa vùng nông thôn.", categorySlug: "nghe-fmcg", categoryName: "Nghề FMCG", type: "advisory" },
    { topic: "Quản lý nhân viên bán hàng: Nên trả lương cứng hay phần trăm doanh thu?", categorySlug: "nghe-fmcg", categoryName: "Nghề FMCG", type: "advisory" },

    // === XU HƯỚNG HEALTHY & ORGANIC ===
    { topic: "Organic, sugar-free, plant-based lên ngôi: Tiệm tạp hóa nên nhập gì?", categorySlug: "xu-huong-tieu-dung", categoryName: "Xu Hướng Tiêu Dùng", type: "news" },
    { topic: "Khách hàng ngày càng ghét túi nilon: Giải pháp xanh nào cho tiệm tạp hóa?", categorySlug: "xu-huong-tieu-dung", categoryName: "Xu Hướng Tiêu Dùng", type: "news" },

    // === THƯƠNG HIỆU NỔI BẬT ===
    { topic: "Câu chuyện Masan: Từ nước mắm Chinsu đến đế chế FMCG - Bài học cho nhà bán lẻ.", categorySlug: "doanh-nghiep-lon", categoryName: "Doanh Nghiệp Lớn", type: "report" },
    { topic: "Acecook Việt Nam: Vì sao Hảo Hảo vẫn là vua mì gói sau 20 năm?", categorySlug: "doanh-nghiep-lon", categoryName: "Doanh Nghiệp Lớn", type: "report" },

    // === KIẾN THỨC NỀN TẢNG ===
    { topic: "FMCG là gì? Giải thích đơn giản cho người mới bắt đầu kinh doanh tạp hóa.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Kênh GT là gì? MT là gì? Hiểu rõ để chọn đúng nguồn hàng sỉ.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
    { topic: "Đọc báo cáo bán hàng: 5 con số quan trọng nhất mà chủ tiệm phải theo dõi mỗi ngày.", categorySlug: "goc-nha-phan-phoi-diem-ban", categoryName: "Góc Nhà Phân Phối & Điểm Bán", type: "advisory" },
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

async function generateArticle(topic: string, type: 'advisory' | 'news' | 'report', apiKey: string) {
    let specificInstructions = '';
    
    if (type === 'advisory') {
        specificInstructions = `
3. Bố cục bài viết bắt buộc phải đi theo luồng sau:
  - KHÔNG sử dụng thẻ <h2> đầu tiên lặp lại nguyên văn tiêu đề. Hãy dùng một câu hỏi hoặc heading dẫn dắt.
  - Mở bài: Đi thẳng vào nội dung chi tiết. (Sapo tóm tắt bài viết sẽ được xuất riêng qua trường JSON).
  - Vì sao chủ đề này lại quan trọng với điểm bán?
  - Tiêu chí chọn hàng hoặc cách giải quyết vấn đề.
  - Các nhóm hàng / chiến lược nên ưu tiên áp dụng. Khi lấy ví dụ về ngành hàng, hãy phân tích khách quan dựa trên xu hướng tiêu dùng (ví dụ: thực phẩm sấy khô, bánh kẹo nhập khẩu).
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

    // Provide current date context so AI doesn't hallucinate old years
    const vnFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
    const currentDateVN = vnFormatter.format(new Date());
    const currentYear = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' });

    const prompt = `
Bạn là một chuyên gia về phân phối FMCG và kinh doanh bán lẻ.
Hãy viết một bài báo chuyên ngành FMCG thật chi tiết, chuẩn SEO về chủ đề: "${topic}".
Bài viết dành cho chuyên mục "LYHU Chuyển động FMCG 24/7".

⚠️ THÔNG TIN QUAN TRỌNG VỀ THỜI GIAN: Ngày hôm nay là ${currentDateVN} (năm ${currentYear}). Mọi số liệu, sự kiện và phân tích trong bài PHẢI phản ánh đúng mốc thời gian hiện tại (năm ${currentYear}). TUYỆT ĐỐI KHÔNG viết số liệu hay sự kiện từ năm 2024 hoặc 2025 trừ khi là so sánh lịch sử (phải ghi rõ "so với năm trước").

YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG VÀ VĂN PHONG:
1. Đối tượng đọc: chủ tạp hóa, siêu thị mini, nhà phân phối, chuyên gia trong ngành.
2. Phong cách chung: Đi thẳng vào vấn đề, tư vấn thực tế, có chuyên môn. KHÔNG dùng các từ ngữ quảng cáo, sáo rỗng hoặc chung chung.
${specificInstructions}
5. NGUYÊN TẮC BÁO CHÍ VÀ KHÁCH QUAN:
  - QUAN TRỌNG: Bài viết mang tính chất chuyên trang phân tích ngành. TUYỆT ĐỐI KHÔNG nhắc đến bất kỳ tên thương hiệu hay tên sản phẩm cụ thể nào (Ví dụ: Không được viết "Bánh tráng Abi", "Kẹo dẻo TWITCHUI", "Kẹo dẻo Thái Lan").
  - Nếu cần lấy ví dụ, CHỈ ĐƯỢC PHÉP nói về các "ngành hàng chung" (ví dụ: "các loại đồ ăn vặt sấy", "bánh tráng trộn", "kẹo dẻo chua ngọt").
  - Không lồng ghép yếu tố quảng cáo, PR, hay bán hàng vào bài viết. Không được tạo cảm giác đang chèo kéo người đọc mua sản phẩm.

YÊU CẦU ĐỊNH DẠNG:
1. Độ dài: Ít nhất 800 - 1000 chữ.
2. Cấu trúc bài viết: Sử dụng hoàn toàn cú pháp Markdown chuẩn (không dùng thẻ HTML thô). Dùng các thẻ Heading (##, ###), danh sách có gạch đầu dòng (- hoặc 1. 2.), in đậm (**text**) để bài viết rõ ràng, mạch lạc.
3. Nếu bài viết yêu cầu bảng tóm tắt, hãy dùng bảng Markdown chuẩn (ví dụ: | Cột 1 | Cột 2 |). KHÔNG dùng markdown code block (như \`\`\`markdown hay \`\`\`html) bọc quanh bài.
4. CHÈN ẢNH MINH HỌA: Hãy chèn CHÍNH XÁC 2 từ khóa sau vào các vị trí phù hợp để ngắt quãng bài viết (hệ thống sẽ tự động thay bằng ảnh thật từ Pexels):
   - Đặt từ khóa [PEXELS_IMAGE_1] ở giữa bài.
   - Đặt từ khóa [PEXELS_IMAGE_2] ở gần đoạn kết luận.
   (Chỉ cần viết đúng chữ [PEXELS_IMAGE_1] đứng một mình trên 1 dòng, không cần bọc thẻ <img>).
5. BẮT BUỘC trả về nội dung ĐÚNG theo cấu trúc sau (KHÔNG ĐƯỢC thay đổi thứ tự):

[TOÀN BỘ NỘI DUNG BÀI VIẾT BẰNG MARKDOWN Ở ĐÂY]

---JSON_START---
{
  "sapo": "Đoạn tóm tắt mở bài khoảng 2-3 câu, nêu bật vấn đề và giải pháp...",
  "meta_title": "Tiêu đề chuẩn SEO",
  "meta_description": "Mô tả chuẩn SEO khoảng 150 ký tự",
  "keywords": "từ khóa 1, từ khóa 2",
  "image_search_keyword": "1 từ khóa tiếng Anh cực kỳ ngắn (1-2 chữ) để tìm ảnh minh họa trên Pexels (VD: supermarket, store, retail, grocery, warehouse)"
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

        if (!content || typeof content !== 'string' || content.trim() === '') {
            content = "<div class='p-4 bg-red-50 text-red-600 rounded'><b>Lỗi:</b> AI không sinh nội dung HTML hoặc sai định dạng. <br/><br/><b>Raw Data:</b><br/> " + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + "</div>";
        }

        // Fetch High-Quality Images from Pexels
        let thumbnailUrl = null;
        let images: string[] = [];
        if (metaData.image_search_keyword) {
            images = await fetchPexelsImages(metaData.image_search_keyword, 3);
            if (images.length > 0) {
                thumbnailUrl = images[0]; // Image 0 goes to thumbnail
            }
        }

        // Inject Inline Images into content
        if (images.length > 1) {
            const img1 = `<figure class="my-8"><img src="${images[1]}" alt="${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, img1);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_1\]/g, ''); // Remove if not found
        }

        if (images.length > 2) {
            const img2 = `<figure class="my-8"><img src="${images[2]}" alt="${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else if (images.length > 1) {
             // Fallback to image 1 if image 2 not available
             const img2 = `<figure class="my-8"><img src="${images[1]}" alt="${topic}" class="w-full rounded-xl shadow-sm object-cover" style="max-height: 450px;" /></figure>`;
             content = content.replace(/\[PEXELS_IMAGE_2\]/g, img2);
        } else {
            content = content.replace(/\[PEXELS_IMAGE_2\]/g, '');
        }

        // Convert raw Markdown to HTML properly
        content = await marked.parse(content);

        return {
            content,
            sapo: metaData.sapo || '',
            meta_title: metaData.meta_title || topic,
            meta_description: metaData.meta_description || topic,
            keywords: metaData.keywords || '',
            thumbnail_url: thumbnailUrl
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

        // Dùng vòng lặp for thay vì Promise.all để tránh bị Google API chặn do gửi quá nhiều yêu cầu cùng lúc
        const completed = [];
        for (let i = 0; i < topicsToProcess.length; i++) {
            const config = topicsToProcess[i];
            const { topic, type, categorySlug } = config;
            
            const articleData = await generateArticle(topic, type, GEMINI_API_KEY);
            if (!articleData) {
                completed.push({ topic, status: 'failed (Lỗi không xác định hoặc không có JSON metadata)' });
                continue;
            }

            if (articleData.error) {
                completed.push({ topic, status: 'api_error', error: articleData.error });
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
                thumbnail_url: articleData.thumbnail_url,
                status: 'published',
                published_at: publishDate.toISOString()
            });

            if (error) {
                completed.push({ topic, status: 'db_error', error: error.message });
            } else {
                completed.push({ topic, status: 'success', date: publishDate.toLocaleDateString() });
                count++;
            }
            
            // Wait 5 seconds between requests to avoid rate limits
            await new Promise(r => setTimeout(r, 5000));
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
