import { LyhuTemplate, TikTokTrendingSound, BgmPreset, BRollItem } from "../types";

// ── COLOR LUT PRESETS FOR VIDEO GRADING ──
export const VIDEO_FILTERS = [
    { id: "none", name: "Gốc", filter: "none" },
    { id: "vibrant", name: "🔥 Rực Rỡ TikTok", filter: "saturate(1.3) contrast(1.08) brightness(1.03)" },
    { id: "crispy", name: "✨ Bánh Giòn Rụm", filter: "sepia(0.18) saturate(1.25) contrast(1.12) brightness(1.04)" },
    { id: "cinematic", name: "🎬 Điện Ảnh Sâu", filter: "contrast(1.18) brightness(0.96) saturate(1.08)" },
    { id: "cool_storage", name: "❄️ Sáng Kho Hàng", filter: "brightness(1.06) contrast(1.1) saturate(0.95)" }
];

// ── 1-CLICK VIRAL HOOK PRESETS FOR SNACKS ──
export const VIRAL_HOOK_PRESETS = [
    { label: "🔥 Bóc giá sỉ tận kho", text: "🔥 BÓC GIÁ SỈ TẬN KHO LYHU: LÃI GẤP ĐÔI CHO CHỦ QUÁN!" },
    { label: "⚠️ Cảnh báo cháy hàng", text: "⚠️ CẢNH BÁO CHỦ QUÁN: MÓN ĂN VẶT NÀY VỪA VỀ ĐÃ CHÁY HÀNG!" },
    { label: "💸 1 vốn 4 lời", text: "💸 1 VỐN 4 LỜI: TOP MÓN ĂN VẶT CỨU DOANH THU QUÁN MÙA NÀY!" },
    { label: "📦 Đập hộp 100kg sỉ", text: "📦 ĐẬP HỘP KIỆN HÀNG 100KG ĂN VẶT GIÁ SỈ TẬN XƯỞNG!" },
    { label: "🚀 Bí quyết đông khách", text: "🚀 BÍ QUYẾT QUÁN TRÀ SỮA ĐÔNG KHÁCH NHỜ MÓN ĂN VẶT NÀY!" },
    { label: "✨ Xả kho giá gốc", text: "✨ XẢ KHO GIÁ GỐC: CHỈ DÀNH CHO 50 ĐỐI TÁC SỈ ĐẦU TIÊN!" }
];

// ── TIKTOK TRENDING SOUNDS (KHO NHẠC TĨNH 0Đ - PHÁT 0.05S) ──
export const TIKTOK_TRENDING_SOUNDS: TikTokTrendingSound[] = [
    // ── 🔥 NHÓM 1: TREND TIKTOK / BÁN HÀNG SÔI ĐỘNG ──
    {
        id: "tt_banhang_remix",
        title: "Beat Chốt Đơn Sôi Động (Speed-up TikTok Viral)",
        author: "TikTok Viral Sounds",
        tag: "⚡ Bán Hàng Mạnh",
        url: "/audio/bgm/trending.mp3",
        duration: "0:45",
        useCase: "Khuyến mãi, xả kho, thông báo hàng mới về cần đẩy số lượng lớn",
        isHot: true,
        category: "trending"
    },
    {
        id: "tt_vinahouse_drop",
        title: "Vinahouse Bass Căng (Năng Lượng Chốt Đơn)",
        author: "Hot TikTok Vietnam",
        tag: "🎧 Bass Căng",
        url: "/audio/bgm/trending.mp3",
        duration: "0:38",
        useCase: "Video ngắn dưới 20 giây giật tít giảm giá sâu hoặc xả kho sập giá",
        isHot: true,
        category: "trending"
    },
    {
        id: "tt_upbeat_sales",
        title: "Upbeat Electro Swing (Vui Tươi Nhập Hàng)",
        author: "Commercial Energy",
        tag: "🔥 Hot Trend",
        url: "/audio/bgm/trending.mp3",
        duration: "0:50",
        useCase: "Giới thiệu mẫu bánh kẹo mới, tạo không khí mua sắm tấp nập",
        category: "trending"
    },
    {
        id: "tt_viral_hook_beat",
        title: "Dopamine Hook Beat (Giữ Chân 3s Đầu)",
        author: "Reels Viral Beat",
        tag: "⚡ Tăng View",
        url: "/audio/bgm/trending.mp3",
        duration: "0:42",
        useCase: "Phù hợp các video mở đầu bằng câu hỏi giật gân, bóc giá sỉ",
        category: "trending"
    },
    {
        id: "tt_modern_pop",
        title: "Modern Summer Funk (Rộn Ràng Mở Thùng)",
        author: "TikTok Groove",
        tag: "✨ Rộn Ràng",
        url: "/audio/bgm/trending.mp3",
        duration: "0:46",
        useCase: "Đập hộp thùng hàng, unboxing kiện bánh tráng bơ mỡ hành",
        category: "trending"
    },

    // ── 🍟 NHÓM 2: REVIEW ĐỒ ĂN VẶT / MUKBANG / ASMR ──
    {
        id: "tt_food_asmr",
        title: "Vui Tươi Ăn Vặt & Review Ẩm Thực (Ngon miệng)",
        author: "Foodie Daily Sound",
        tag: "🍜 Review Đồ Ăn",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:42",
        useCase: "Review thanh khoai môn trứng cua, da cá hoàng kim, bánh tráng bơ",
        isHot: true,
        category: "food"
    },
    {
        id: "tt_snack_acoustic",
        title: "Acoustic Ukulele Món Ngon (Ấm Áp Vị Béo)",
        author: "Snack Kitchen",
        tag: "🍟 Bánh Kẹo",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:48",
        useCase: "Quay bột phô mai lắc khoai tây, kẹo UHi mềm dẻo cho trẻ em",
        category: "food"
    },
    {
        id: "tt_asmr_crisp",
        title: "Beat Nhẹ ASMR Giòn Rụm (Làm Nổi Bật Tiếng Nhai)",
        author: "Crispy Sound Lab",
        tag: "✨ ASMR Crunch",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:40",
        useCase: "Tập trung tôn tiếng bẻ đôi khoai sấy thăng hoa, tiếng lắc phô mai",
        isHot: true,
        category: "food"
    },
    {
        id: "tt_sweet_snack",
        title: "Sweet Kitchen Whistle (Dễ Thương Bắt Tai)",
        author: "Sweet Tooth Media",
        tag: "🍬 Ngọt Ngào",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:36",
        useCase: "Quảng bá kẹo hoa quả Hàn Quốc, thạch rau câu, đồ ăn vặt tuổi thơ",
        category: "food"
    },
    {
        id: "tt_spicy_snack",
        title: "Snack Party Beats (Hấp Dẫn Cay Nồng)",
        author: "Food BGM Beats",
        tag: "🔥 Đậm Đà",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:44",
        useCase: "Bánh tráng me cay, khô gà bơ tỏi, bim bim cay tê lưỡi",
        category: "food"
    },

    // ── 📦 NHÓM 3: TỔNG KHO SỈ / LOGISTICS / DOANH NGHIỆP B2B ──
    {
        id: "tt_tramy_1",
        title: "Âm thanh gốc - Kể chuyện kho đêm (Trà My 24Zone Flow)",
        author: "Trà My 24Zone",
        tag: "🔥 Đang Hot",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:51",
        useCase: "Video kể chuyện kho hàng đêm, đóng hàng sỉ, tự sự chân thật",
        isHot: true,
        category: "warehouse"
    },
    {
        id: "tt_lofi_pack",
        title: "Lofi Đóng Gói Đơn Hàng & Logistics Sỉ",
        author: "Chill Packing BGM",
        tag: "📦 Đóng Hàng / Sỉ",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:48",
        useCase: "Quay công nhân đóng thùng hàng, kiểm tem nhãn, in hóa đơn giao khách",
        category: "warehouse"
    },
    {
        id: "tt_warehouse_trust",
        title: "Corporate Trust B2B (Uy Tín Doanh Nghiệp)",
        author: "B2B Production",
        tag: "🏢 Doanh Nghiệp",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:55",
        useCase: "Video giới thiệu nhà máy sản xuất, giấy kiểm định an toàn VSTP",
        category: "warehouse"
    },
    {
        id: "tt_container_flow",
        title: "Container Hàng Về Đêm (Nhịp Điệu Hối Hả)",
        author: "Logistics Flow",
        tag: "🚚 Xe Tải / Cập Cảng",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:49",
        useCase: "Quay xe nâng hàng pallet, container cập kho lúc 2h sáng",
        category: "warehouse"
    },
    {
        id: "tt_wholesale_b2b",
        title: "Wholesale Partner Beat (Chuyên Nghiệp Hợp Tác)",
        author: "Partner Connect",
        tag: "🤝 Hợp Tác Sỉ",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:52",
        useCase: "Kêu gọi chủ quán trà sữa, karaoke, đại lý tạp hóa liên hệ lấy sỉ",
        category: "warehouse"
    },

    // ── ☕ NHÓM 4: LOFI CHILL / TÂM SỰ KHỞI NGHIỆP ──
    {
        id: "tt_lofi_night",
        title: "Lofi Đếm Tiền Lãi Quán Ăn Vặt (Thư Thái)",
        author: "Lofi Snack Beats",
        tag: "☕ Lofi Chill",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:53",
        useCase: "Kể câu chuyện khởi nghiệp quán ăn vặt, thu hồi vốn sau 2 tháng",
        isHot: true,
        category: "lofi"
    },
    {
        id: "tt_rainy_packing",
        title: "Đóng Hàng Chiều Mưa (Tự Sự Lofi)",
        author: "Rainy Day BGM",
        tag: "🌧️ Nhẹ Nhàng",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:47",
        useCase: "Tâm sự về nghề phân phối đồ ăn vặt, cam kết date mới",
        category: "lofi"
    },
    {
        id: "tt_cozy_morning",
        title: "Cozy Morning Coffee (Thư Giãn Mở Quán)",
        author: "Cafe Lounge",
        tag: "☕ Quán Cafe",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:50",
        useCase: "Video mở cửa quán trà sữa buổi sáng, chuẩn bị nguyên liệu khoai lắc",
        category: "lofi"
    },
    {
        id: "tt_chill_piano",
        title: "Piano Tự Sự (Hành Trình Khách Hàng)",
        author: "Emotional Story",
        tag: "🎹 Truyền Cảm",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:54",
        useCase: "Chia sẻ câu chuyện từ 1 quán nhỏ lên chuỗi 5 quán đồ ăn vặt",
        category: "lofi"
    },

    // ── ⚡ NHÓM 5: FLASH SALE / KỊCH TÍNH / ĐẾM NGƯỢC ──
    {
        id: "tt_countdown_3s",
        title: "Countdown 3 Giây Xả Kho (Kịch Tính Đếm Ngược)",
        author: "Hype Sale Beats",
        tag: "⚡ Flash Sale",
        url: "/audio/bgm/trending.mp3",
        duration: "0:35",
        useCase: "Xả kho 50 thùng cuối cùng giá sỉ sập sàn, chỉ trong hôm nay",
        isHot: true,
        category: "hype"
    },
    {
        id: "tt_alert_hype",
        title: "Cảnh Báo Cháy Hàng (Nhịp Nhanh Hối Hả)",
        author: "Urgent TikTok",
        tag: "🚨 Cháy Hàng",
        url: "/audio/bgm/trending.mp3",
        duration: "0:32",
        useCase: "Video thông báo khoai môn trứng cua chỉ còn vài chục thùng",
        category: "hype"
    },
    {
        id: "tt_trailer_epic",
        title: "Epic Unboxing Container 20 Tấn (Hoành Tráng)",
        author: "Epic Commercial",
        tag: "🎬 Hoành Tráng",
        url: "/audio/bgm/trending.mp3",
        duration: "0:40",
        useCase: "Video công bố container bánh kẹo nhập khẩu cập bến",
        category: "hype"
    },
    {
        id: "tt_deal_drop",
        title: "Deal Sốc Giờ Vàng (Bass Drop Mạnh Mẽ)",
        author: "Flash Deal Beat",
        tag: "💥 Giảm Sâu",
        url: "/audio/bgm/trending.mp3",
        duration: "0:36",
        useCase: "Giảm 15% cho đơn sỉ đầu tiên của đại lý mới",
        category: "hype"
    }
];

// ── BGM PRESETS ──
export const BGM_PRESETS: BgmPreset[] = [
    {
        id: "trending_upbeat",
        name: "🔥 TikTok Trend Bán Hàng (Sôi động, kích thích chốt đơn)",
        url: "/audio/bgm/trending.mp3"
    },
    {
        id: "food_review",
        name: "🍜 Review Đồ Ăn & Ẩm Thực (Vui tươi, nhẹ nhàng, ngon miệng)",
        url: "/audio/bgm/food_review.mp3"
    },
    {
        id: "warehouse_flow",
        name: "📦 Kho Hàng & Đóng Gói Sỉ B2B (Hiện đại, uy tín doanh nghiệp)",
        url: "/audio/bgm/warehouse_flow.mp3"
    },
    {
        id: "tt_tramy_1",
        name: "🎧 Âm thanh gốc - Trà My 24Zone (Kể chuyện kho đêm)",
        url: "/audio/bgm/warehouse_flow.mp3"
    },
    {
        id: "tt_banhang_remix",
        name: "⚡ Beat Chốt Đơn Sôi Động (Speed-up TikTok 2026)",
        url: "/audio/bgm/trending.mp3"
    },
    {
        id: "tt_food_asmr",
        name: "🥢 Beat Review Ẩm Thực Vui Tươi (Ngon miệng)",
        url: "/audio/bgm/food_review.mp3"
    },
    {
        id: "custom",
        name: "📁 Tự tải file nhạc nền MP3 riêng từ máy tính...",
        url: ""
    },
    {
        id: "none",
        name: "🔇 Không dùng nhạc nền (Chỉ giữ giọng đọc - Chuẩn đăng TikTok)",
        url: ""
    }
];

// ── LYHU TEMPLATES ──
export const LYHU_TEMPLATES: LyhuTemplate[] = [
    {
        id: "kho_dem",
        badge: "🌙 Chuyện Kho Đêm",
        title: "Kể chuyện đóng hàng sỉ xuyên đêm (Chuẩn phong cách 24Zone)",
        hookTitle: "🌙 11H ĐÊM KHO SỈ LYHU VẪN ĐÓNG HÀNG!",
        script: "Nhiều người bảo giờ này chỉ có đi ngủ, nhưng ở tổng kho sỉ LYHU thì bọn mình vẫn đang kiểm từng kiện hàng để sáng mai kịp giao cho các chủ quán. Nào là thanh khoai môn sấy trứng cua, da cá hoàng kim, bánh tráng Abi với bột phô mai Boyo. Khách đặt cả trăm thùng thì dù khuya mấy bọn mình cũng đóng gói cẩn thận. Cần mẫu thử hay bảng giá sỉ cứ nhắn bọn mình nha!",
        pacing: 2.5,
        transition: "auto",
        bgm: "trending_upbeat",
        textColor: "#FACC15",
        subtitleStyle: "tiktok_stroke"
    },
    {
        id: "khoai_mon_trung_cua",
        badge: "🦀 Review Món Hot",
        title: "Thanh khoai môn sấy trứng cua & Truffle (Kén khách nhưng siêu ngon)",
        hookTitle: "🦀 THANH KHOAI MÔN TRỨNG CUA CÓ GÌ MÀ HOT?",
        script: "Nhiều người bảo snack khoai môn sấy trên thị trường thiếu gì, sao LYHU lại mang dòng trứng cua với nấm truffle này về bán sỉ? Nói thật là vì vị nó quá cuốn! Sấy thăng hoa giòn rụm, phủ lớp trứng cua béo ngậy mằn mặn, ăn là dính. Quán cafe hay quán trà sữa để món này lên quầy là khách gọi lai rai suốt buổi. Ai muốn lấy thử thùng sỉ trải nghiệm nhắn LYHU gửi liền nha!",
        pacing: 2.5,
        transition: "crossfade",
        bgm: "food_review",
        textColor: "#22D3EE",
        subtitleStyle: "neon_glow"
    },
    {
        id: "bot_pho_mai_boyo",
        badge: "🧀 Bột Phô Mai BOYO",
        title: "Bột phô mai BOYO tận xưởng cho quán F&B (Mở bán rộn ràng)",
        hookTitle: "🧀 BỘT PHÔ MAI BOYO GIÁ SỈ TẬN XƯỞNG!",
        script: "500 anh em chủ quán ăn vặt và F&B ơi! Lô bột phô mai Boyo chính hãng mới về ngập kho LYHU rồi nè! Hạt mịn màng, thơm nức mũi, vị mặn ngọt béo ngậy chuẩn công thức cho quán gà rán, khoai tây lắc. Lấy bao 1kg tiết kiệm chi phí tối đa, bao đổi trả nếu không chuẩn vị. Cần bảng giá sỉ sập sàn để lại bình luận cho bọn mình nhé!",
        pacing: 2.5,
        transition: "slide_left",
        bgm: "trending_upbeat",
        textColor: "#FACC15",
        subtitleStyle: "tiktok_stroke"
    },
    {
        id: "abi_snack_uhi",
        badge: "🍘 Abi Snack & UHi",
        title: "Bánh tráng Abi Snack & Kẹo UHi Hàn Quốc độc quyền cho đại lý & mini mart",
        hookTitle: "🍘 TỔNG KHO BÁNH TRÁNG ABI & KẸO UHi GIÁ SỈ!",
        script: "Chủ quán ăn vặt, tiệm tạp hóa và mini mart đang tìm nguồn bánh tráng chuẩn vị cùng kẹo nhập khẩu Hàn Quốc thì xem hết video này nha! LYHU phân phối độc quyền dòng bánh tráng Abi Snack đậm vị giòn rụm và các dòng kẹo dẻo UHi thơm ngon chính ngạch. Date mới tinh vừa về kho, chính sách chiết khấu đại lý tốt nhất thị trường. Nhắn liền cho LYHU để nhận mẫu thử và bảng giá sỉ sập sàn nhé!",
        pacing: 2.5,
        transition: "auto",
        bgm: "trending_upbeat",
        textColor: "#F43F5E",
        subtitleStyle: "tiktok_stroke"
    }
];

// ── AI B-ROLL CINEMATIC FOOTAGE LIBRARY ──
export const AI_BROLL_LIBRARY: BRollItem[] = [
    {
        id: "broll_warehouse",
        name: "📦 Kho hàng LYHU & Đóng gói kiện sỉ",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        tag: "Kho Hàng B2B",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_snack",
        name: "🍟 Cận cảnh thanh khoai môn sấy giòn rụm",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        tag: "Sản Phẩm Hot",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_delivery",
        name: "🚚 Xe container xuất hàng & Giao sỉ tận quán",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        tag: "Logistics",
        duration: 12,
        width: 1280,
        height: 720
    },
    {
        id: "broll_joy",
        name: "😋 Khách hàng thưởng thức & Đánh giá 5 sao",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
        tag: "Review Ẩm Thực",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_meltdown",
        name: "🧀 Bột phô mai Boyo rắc phủ vàng ươm",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        tag: "Nguyên Liệu Sỉ",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_container",
        name: "🌙 Đêm container bốc hàng tại tổng kho",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        tag: "Chuyện Kho Đêm",
        duration: 15,
        width: 1280,
        height: 720
    }
];

export const DEMO_CLIPS = AI_BROLL_LIBRARY.slice(0, 3);

// ── SALES STICKER BADGES CONFIG ──
export const STICKER_CONFIGS: Record<string, { title: string; subtitle: string; icon: string; bgGrad: [string, string]; border: string; subCol: string }> = {
    freeship: {
        title: "FREESHIP TẬN QUÁN",
        subtitle: "Giao nhanh nội thành & tỉnh",
        icon: "🚚",
        bgGrad: ["#059669", "#047857"],
        border: "rgba(255, 255, 255, 0.4)",
        subCol: "#A7F3D0"
    },
    si_1_thung: {
        title: "SỈ TỪ 1 THÙNG",
        subtitle: "Giá tận xưởng bao lời x2",
        icon: "🏷️",
        bgGrad: ["#00AFA9", "#008F8A"],
        border: "rgba(255, 255, 255, 0.4)",
        subCol: "#CCFBF1"
    },
    san_kho: {
        title: "SẴN KHO SỐ LƯỢNG LỚN",
        subtitle: "Date mới tinh xuất ngay",
        icon: "📦",
        bgGrad: ["#D97706", "#B45309"],
        border: "rgba(255, 255, 255, 0.4)",
        subCol: "#FEF3C7"
    },
    lai_x2: {
        title: "LÃI GẤP ĐÔI TẬN GỐC",
        subtitle: "Chiết khấu cao cho đại lý",
        icon: "💰",
        bgGrad: ["#E11D48", "#BE123C"],
        border: "rgba(255, 255, 255, 0.4)",
        subCol: "#FFE4E6"
    },
    inbox_cta: {
        title: "NHẬN MẪU THỬ MIỄN PHÍ",
        subtitle: "Gửi mẫu ăn thử tận quán",
        icon: "🎁",
        bgGrad: ["#4F46E5", "#4338CA"],
        border: "rgba(255, 255, 255, 0.4)",
        subCol: "#E0E7FF"
    }
};
