/**
 * Chuẩn hóa phát âm tiếng Việt cho AI Voice & Text-to-Speech
 * Giúp đọc chuẩn tên thương hiệu LYHU, thuật ngữ B2B và ngày tháng, số tiền
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

        // 3. Số tiền & Đơn vị (2tr -> 2 triệu, 50k -> 50 nghìn)
        .replace(/(\d+)\s*tr\b/gi, "$1 triệu")
        .replace(/(\d+)\s*k\b/gi, "$1 nghìn")
        .replace(/(\d+)\s*đ\b/gi, "$1 đồng")

        // 4. Dấu câu ngắt nghỉ tự nhiên: Chuyển dấu hai chấm ':' hoặc gạch ngang '-' thành dấu phẩy để ngắt nhịp thở
        .replace(/:\s+/g, ", ")
        .replace(/\s+-\s+/g, ", ");
}
