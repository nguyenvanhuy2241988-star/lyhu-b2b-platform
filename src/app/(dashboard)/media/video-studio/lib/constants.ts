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

// ── TIKTOK TRENDING SOUNDS ──
export const TIKTOK_TRENDING_SOUNDS: TikTokTrendingSound[] = [
    {
        id: "tt_tramy_1",
        title: "âm thanh gốc - Trà My 24Zone (Kể chuyện kho đêm)",
        author: "Trà My 24Zone",
        tag: "🔥 Đang Hot",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:51",
        useCase: "Video kể chuyện kho hàng đêm, đóng hàng sỉ, tự sự chân thật",
        isHot: true
    },
    {
        id: "tt_banhang_remix",
        title: "Beat Chốt Đơn Sôi Động (Speed-up TikTok 2026)",
        author: "TikTok Viral Sounds",
        tag: "⚡ Bán Hàng Mạnh",
        url: "/audio/bgm/trending.mp3",
        duration: "0:45",
        useCase: "Khuyến mãi, xả kho, thông báo hàng mới về cần đẩy số lượng lớn",
        isHot: true
    },
    {
        id: "tt_food_asmr",
        title: "Vui Tươi Ăn Vặt & Review Ẩm Thực (Ngon miệng)",
        author: "Foodie Daily Sound",
        tag: "🍜 Review Đồ Ăn",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:42",
        useCase: "Review thanh khoai môn trứng cua, da cá hoàng kim, bánh tráng bơ",
        isHot: true
    },
    {
        id: "tt_lofi_pack",
        title: "Lofi Nhẹ Nhàng Thư Giãn (Đóng Gói Đơn Hàng)",
        author: "Chill Packing BGM",
        tag: "📦 Đóng Hàng / Logistics",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:48",
        useCase: "Quay công nhân đóng thùng hàng, kiểm tem nhãn, in hóa đơn giao khách"
    },
    {
        id: "tt_vinahouse_drop",
        title: "Vinahouse Bass Căng (Nhạc Nền TikTok Hot)",
        author: "Hot TikTok Vietnam",
        tag: "🎧 Năng Lượng / Chốt Đơn",
        url: "/audio/bgm/trending.mp3",
        duration: "0:38",
        useCase: "Video ngắn dưới 20 giây giật tít giảm giá sâu hoặc khai trương chi nhánh"
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
        subtitle: "GIAO NHANH NỘI THÀNH & TỈNH",
        icon: "🚚",
        bgGrad: ["#D97706", "#B45309"],
        border: "#FDE68A",
        subCol: "#FEF08A"
    },
    si_1_thung: {
        title: "SỈ TỪ 1 THÙNG",
        subtitle: "GIÁ TẬN XƯỞNG BAO LỜI X2",
        icon: "🏷️",
        bgGrad: ["#E11D48", "#BE123C"],
        border: "#FECDD3",
        subCol: "#FFE4E6"
    },
    san_kho: {
        title: "SẴN KHO 1.000 THÙNG",
        subtitle: "DATE MỚI TINH XUẤT NGAY",
        icon: "📦",
        bgGrad: ["#2563EB", "#1D4ED8"],
        border: "#BFDBFE",
        subCol: "#DBEAFE"
    },
    lai_x2: {
        title: "LÃI GẤP ĐÔI TẬN GỐC",
        subtitle: "CHIẾT KHẤU TỐI ĐA CHO ĐẠI LÝ",
        icon: "💰",
        bgGrad: ["#059669", "#047857"],
        border: "#A7F3D0",
        subCol: "#D1FAE5"
    },
    inbox_cta: {
        title: "INBOX NHẬN MẪU THỬ",
        subtitle: "GỬI MẪU ĂN THỬ MIỄN PHÍ",
        icon: "📲",
        bgGrad: ["#7C3AED", "#6D28D9"],
        border: "#DDD6FE",
        subCol: "#EDE9FE"
    }
};
