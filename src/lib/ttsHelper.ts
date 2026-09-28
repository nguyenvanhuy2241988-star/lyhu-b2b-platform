/**
 * Chuẩn hóa phát âm tiếng Việt cho AI Voice & Text-to-Speech
 * Giúp đọc chuẩn tên thương hiệu LYHU, thuật ngữ B2B, số tiền và ngắt nhịp tự nhiên
 */

export function normalizeVietnamesePhonetics(text: string): string {
    if (!text) return "";

    return text
        // 1. Chuẩn hóa tên thương hiệu LYHU -> "Ly Hu" (để máy đọc tự nhiên, không đánh vần từng chữ L-Y-H-U)
        .replace(/\bLYHU\b/gi, "Ly Hu")
        .replace(/\bLyHu\b/g, "Ly Hu")
        .replace(/\bLyhu\b/g, "Ly Hu")
        .replace(/\blyhu\b/g, "Ly Hu")

        // 2. Thuật ngữ bán hàng B2B, siêu thị
        .replace(/\bNPP\b/g, "Nhà phân phối")
        .replace(/\bnpp\b/g, "nhà phân phối")
        .replace(/\bĐL\b/g, "Đại lý")
        .replace(/\bđl\b/g, "đại lý")
        .replace(/\bVAT\b/gi, "Vê A Tê")
        .replace(/\bCTV\b/gi, "Cộng tác viên")
        .replace(/\bSĐT\b/gi, "Số điện thoại")
        .replace(/\bB2B\b/gi, "Bê hai Bê")
        .replace(/\bPOSM\b/gi, "vật phẩm trưng bày")
        .replace(/\bdate\b/gi, "hạn sử dụng") // Tránh đọc sai "dát-te"
        .replace(/\bhsd\b/gi, "hạn sử dụng")
        .replace(/\bcombo\b/gi, "com-bô")
        .replace(/\bkg\b/gi, "ki-lô-gam")
        .replace(/\bml\b/gi, "mi-li-lít")

        // 3. Số tiền & Đơn vị (2tr -> 2 triệu, 50k -> 50 nghìn)
        .replace(/(\d+)\s*tr\b/gi, "$1 triệu")
        .replace(/(\d+)\s*k\b/gi, "$1 nghìn")
        .replace(/(\d+)\s*đ\b/gi, "$1 đồng")

        // 4. Dấu câu ngắt nghỉ tự nhiên: Chuyển dấu hai chấm ':' hoặc gạch ngang '-' thành dấu phẩy để ngắt nhịp thở
        .replace(/:\s+/g, ", ")
        .replace(/\s+-\s+/g, ", ")
        .replace(/\s+\/+\s+/g, ", ")
        // Bỏ bớt dấu chấm than liên tiếp "!!!" -> "!"
        .replace(/!{2,}/g, "!")
        .replace(/\?{2,}/g, "?");
}

/**
 * Xóa toàn bộ Emoji và biểu tượng cảm xúc để AI đọc chuẩn xác, không bị đọc tên mã icon
 */
export function removeEmojis(text: string): string {
    if (!text) return "";
    return text
        // Lọc emoji qua surrogate pairs và dải ký tự đồ họa unicode chuẩn
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Tối ưu hóa ngắt nhịp: thêm dấu phẩy sau các liên từ để AI có khoảng dừng lấy hơi tự nhiên
 */
export function optimizeBreathPauses(text: string): string {
    if (!text) return "";
    let res = text;
    const connectors = [
        "Đặc biệt là", "Ngoài ra", "Hơn nữa", "Chính vì vậy",
        "Tuy nhiên", "Thế nhưng", "Không những thế", "Đồng thời",
        "Cụ thể là", "Ví dụ như", "Lưu ý là"
    ];

    for (const c of connectors) {
        const regex = new RegExp(`(^|[.!?\\n]\\s*)(${c})(?!,)`, "gi");
        res = res.replace(regex, "$1$2,");
    }

    return res;
}

/**
 * Tạo tên file âm thanh thông minh dựa trên vài từ đầu của kịch bản
 * Ví dụ: "Mở gói bánh phồng tôm Sa Giang..." -> "LYHU_mo_goi_banh_phong_tom_1.15x_2026-09-28.mp3"
 */
export function generateSmartFileName(text: string, styleId: string, speedRate: number): string {
    const clean = removeEmojis(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .trim();
    
    const words = clean.split(/\s+/).filter(Boolean).slice(0, 5);
    const slug = words.join("_").toLowerCase() || "voiceover";
    const dateStr = new Date().toISOString().slice(0, 10);
    return `LYHU_${slug}_${styleId}_${speedRate}x_${dateStr}.mp3`;
}
