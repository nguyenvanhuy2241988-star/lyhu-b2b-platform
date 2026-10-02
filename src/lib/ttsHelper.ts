/**
 * Chuẩn hóa phát âm tiếng Việt cho AI Voice & Text-to-Speech
 * Giúp đọc chuẩn tên thương hiệu LYHU, thuật ngữ B2B, số tiền và ngắt nhịp tự nhiên
 */

/**
 * Xóa toàn bộ Emoji và biểu tượng cảm xúc để AI đọc chuẩn xác, không bị đọc tên mã icon
 */
export function removeEmojis(text: string): string {
    if (!text) return "";
    return text
        // Lọc emoji qua surrogate pairs và dải ký tự đồ họa unicode chuẩn
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]/g, "")
        // Lọc các ký tự hình khối đặc biệt thường dùng làm bullet point trên mạng xã hội
        .replace(/[★☆✦✧🔥🚛📦🍜⚡💥👉👇👆✔✅❌❤️🛒🎙️🎬🎧✨]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Đọc số điện thoại thành từng chữ số tự nhiên
 */
function normalizePhoneNumber(text: string): string {
    const digitMap: Record<string, string> = {
        "0": "không", "1": "một", "2": "hai", "3": "ba", "4": "bốn",
        "5": "năm", "6": "sáu", "7": "bảy", "8": "tám", "9": "chín"
    };
    return text.replace(/\b(0\d{8,10})\b/g, (match) => {
        return match.split("").map(d => digitMap[d] || d).join(" ");
    });
}

/**
 * Chuẩn hóa phát âm tên thương hiệu, thuật ngữ B2B và ký hiệu số học
 */
export function normalizeVietnamesePhonetics(text: string): string {
    if (!text) return "";

    let res = text
        // 1. Thương hiệu độc quyền của công ty LYHU
        .replace(/\bLYHU\b/gi, "Ly Hu")
        .replace(/\bLyHu\b/g, "Ly Hu")
        .replace(/\bLyhu\b/g, "Ly Hu")
        .replace(/\blyhu\b/g, "Ly Hu")
        .replace(/\bBOYO\b/g, "Bô Dô")
        .replace(/\bBoyo\b/g, "Bô Dô")
        .replace(/\bboyo\b/g, "Bô Dô")
        .replace(/\bCVT\b/g, "Xê Vê Tê")
        .replace(/\bCvt\b/g, "Xê Vê Tê")
        .replace(/\bcvt\b/g, "Xê Vê Tê")
        .replace(/\bUHi\b/g, "U Hi")
        .replace(/\bUhi\b/g, "U Hi")
        .replace(/\buhi\b/g, "U Hi")
        .replace(/\bAbi Snack\b/gi, "A bi Xnách")
        .replace(/\bAbi\b/g, "A bi")

        // 2. Thuật ngữ bán hàng B2B, thương mại điện tử & mạng xã hội
        .replace(/\bNPP\b/g, "Nhà phân phối")
        .replace(/\bnpp\b/g, "nhà phân phối")
        .replace(/\bĐL\b/g, "Đại lý")
        .replace(/\bđl\b/g, "đại lý")
        .replace(/\bVAT\b/gi, "Vê A Tê")
        .replace(/\bCTV\b/gi, "Cộng tác viên")
        .replace(/\bSĐT\b/gi, "Số điện thoại")
        .replace(/\bB2B\b/gi, "Bê hai Bê")
        .replace(/\bPOSM\b/gi, "vật phẩm trưng bày")
        .replace(/\bF&B\b/gi, "ngành ẩm thực ăn uống")
        .replace(/\bdate\b/gi, "hạn sử dụng") // Tránh đọc sai "dát-te"
        .replace(/\bhsd\b/gi, "hạn sử dụng")
        .replace(/\bcombo\b/gi, "com-bô")
        .replace(/\bkg\b/gi, "ki-lô-gam")
        .replace(/\bml\b/gi, "mi-li-lít")
        .replace(/\binbox\b/gi, "nhắn tin")
        .replace(/\bfreeship\b/gi, "miễn phí giao hàng")
        .replace(/\bfree ship\b/gi, "miễn phí giao hàng")
        .replace(/\bvoucher\b/gi, "phiếu giảm giá")
        .replace(/\bTikTok\b/gi, "Tích Tốc")
        .replace(/\bShopee\b/gi, "Sóp pi")
        .replace(/\bCTA\b/gi, "kêu gọi hành động")
        .replace(/\bB-Roll\b/gi, "bê rôn")
        .replace(/\bb-roll\b/gi, "bê rôn")

        // 3. Thời gian & Số lượng (12h đêm -> 12 giờ đêm, 1h -> 1 giờ)
        .replace(/(\d+)\s*h\s*(đêm|sáng|chiều|trưa|tối)/gi, "$1 giờ $2")
        .replace(/(\d+)\s*h\b/gi, "$1 giờ")

        // 4. Số tiền & Đơn vị (2tr -> 2 triệu, 50k -> 50 nghìn)
        .replace(/(\d+)\s*tr\b/gi, "$1 triệu")
        .replace(/(\d+)\s*k\b/gi, "$1 nghìn")
        .replace(/(\d+)\s*đ\b/gi, "$1 đồng")

        // 5. URL website
        .replace(/https?:\/\/[^\s]+/gi, "trang web chính thức")

        // 6. Dấu câu ngắt nghỉ tự nhiên: Chuyển dấu hai chấm ':' hoặc gạch ngang '-' thành dấu phẩy để ngắt nhịp thở
        .replace(/:\s+/g, ", ")
        .replace(/\s+-\s+/g, ", ")
        .replace(/\s+\/+\s+/g, ", ")
        // Bỏ bớt dấu chấm than liên tiếp "!!!" -> "!"
        .replace(/!{2,}/g, "!")
        .replace(/\?{2,}/g, "?");

    // Chuẩn hóa số điện thoại nếu có
    res = normalizePhoneNumber(res);

    return res;
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
        "Cụ thể là", "Ví dụ như", "Lưu ý là", "Nào là"
    ];

    for (const c of connectors) {
        const regex = new RegExp(`(^|[.!?\\n]\\s*)(${c})(?!,)`, "gi");
        res = res.replace(regex, "$1$2,");
    }

    return res;
}

/**
 * Tổng hợp toàn bộ quy trình làm sạch và chuẩn hóa văn bản trước khi đưa vào TTS engine
 */
export function prepareTextForTTS(text: string): string {
    if (!text) return "";
    // Bước 1: Xóa toàn bộ Emoji
    const clean = removeEmojis(text);
    // Bước 2: Chuẩn hóa ngữ âm & thuật ngữ
    const phonetic = normalizeVietnamesePhonetics(clean);
    // Bước 3: Thêm nhịp thở lấy hơi tự nhiên
    return optimizeBreathPauses(phonetic);
}

/**
 * Tạo tên file âm thanh thông minh dựa trên vài từ đầu của kịch bản
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
