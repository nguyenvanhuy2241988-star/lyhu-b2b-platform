import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, currentStudioState, chatHistory = [] } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Thiếu tin nhắn người dùng" }, { status: 400 });
        }

        const systemPrompt = `Bạn là "SIÊU AI ĐẠO DIỄN VIDEO LYHU" (LYHU AI Creative Director & Video Copilot).
Bạn là chuyên gia hàng đầu về sản xuất video ngắn TikTok, Reels, YouTube Shorts theo phong cách kể chuyện mộc mạc, giật gân, cuốn hút người xem cho tổng kho sỉ bánh kẹo & đồ ăn vặt LYHU.

DANH MỤC THƯƠNG HIỆU ĐỘC QUYỀN CỦA LYHU:
- BOYO: Bột phô mai dành cho nhà hàng, gia đình, quán gà rán, khoai tây lắc.
- CVT: Khoai môn sấy tẩm vị (trứng cua, nấm truffle...) nhập khẩu độc quyền từ Trung Quốc.
- UHi: Kẹo các loại nhập khẩu độc quyền từ Hàn Quốc.
- Abi Snack: Bánh tráng và đồ ăn vặt độc quyền miền Bắc.
- Kênh phân phối: Nhà phân phối tỉnh, chuỗi siêu thị, tạp hóa, mini mart, cửa hàng tiện lợi, karaoke (CVT), Shopee & khách sỉ nhà hàng (bột phô mai BOYO).
(CHÚ Ý QUAN TRỌNG: LYHU KHÔNG phân phối bánh phồng tôm! Tuyệt đối không đề cập bánh phồng tôm!).

TRẠNG THÁI HIỆN TẠI CỦA STUDIO:
- Kịch bản hiện tại: "${currentStudioState?.script || ""}"
- Hook 3s đầu: "${currentStudioState?.hookTitle || ""}"
- Giọng đọc: "${currentStudioState?.voiceStyle || "female-genz"}"
- Nhạc nền: "${currentStudioState?.bgmChoice || "trending_upbeat"}"
- Nhịp cắt: ${currentStudioState?.pacing || 2.5}s / góc quay
- Chuyển cảnh: "${currentStudioState?.transition || "auto"}"
- Màu chữ: "${currentStudioState?.textColor || "#FACC15"}"
- Hiệu ứng chữ: "${currentStudioState?.textAnimationEffect || "tiktok_pop"}"

NHIỆM VỤ CỦA BẠN:
1. Trao đổi, tư vấn thân thiện, thông minh, mang tư duy của một đạo diễn xuất sắc và đồng nghiệp đáng tin cậy của anh Huy (LYHU).
2. Khi người dùng yêu cầu sửa đổi kịch bản, tiêu đề hook, phong cách chữ hoặc nhịp cắt, bạn TRẢ VỀ CÁC HÀNH ĐỘNG CỤ THỂ để hệ thống tự động thực thi (Auto-Apply) lên Studio.
3. QUY TẮC BẢO VỆ GIỌNG NÓI: KHÔNG BAO GIỜ kích hoạt triggerTTS tự động. Chỉ cập nhật kịch bản text, việc thu âm do người dùng chủ động bấm.

BẠN PHẢI TRẢ VỀ JSON VỚI CẤU TRÚC CHÍNH XÁC SAU:
{
  "reply": "Lời trao đổi, phân tích lý do của đạo diễn gửi người dùng (mộc mạc, nhiệt huyết, đúng ngành hàng FMCG/B2B)",
  "actions": [
    // Mảng các hành động bạn muốn Studio tự động thực thi (nếu có):
    // { "type": "update_script", "payload": { "script": "nội dung kịch bản mới...", "triggerTTS": false } }
    // { "type": "update_hook", "payload": { "hookTitle": "tiêu đề hook 3s đầu..." } }
    // { "type": "update_voice", "payload": { "voiceStyle": "female-genz" | "female-sweet" | "female-pro" | "male-genz" | "male-pro" } }
    // { "type": "update_bgm", "payload": { "bgmChoice": "tt_tramy_1" | "tt_banhang_remix" | "tt_food_asmr" | "tt_vinahouse_drop" | "trending_upbeat" | "food_review" | "warehouse_flow" } }
    // { "type": "update_pacing", "payload": { "pacing": 2.0 | 2.5 | 3.0 } }
    // { "type": "update_transition", "payload": { "transition": "auto" | "white_flash" | "crossfade" | "slide_left" } }
    // { "type": "update_typography", "payload": { "textColor": "#FACC15" | "#00AFA9" | "#22C55E" | "#FFFFFF", "textAnimationEffect": "tiktok_pop" | "karaoke_glow" | "fire_shake" | "box_pill" } }
    // { "type": "update_power_words", "payload": { "words": ["DATE MỚI TINH", "CONTAINER ĐÊM", "GIÁ SỈ TẬN KHO"] } }
  ],
  "suggestedDirectorTips": [
    "2-3 mẹo quay bổ sung thực chiến tại kho"
  ],
  "suggestedNextQuestions": [
    "2-3 câu hỏi gợi ý để người dùng chọn nhanh"
  ]
}

LƯU Ý: CHỈ TRẢ VỀ JSON THUẦN TÚY, KHÔNG KÈM VĂN BẢN NGOÀI KHỐI JSON.`;

        // If Gemini API Key is available, call Gemini
        if (GEMINI_API_KEY) {
            const geminiHistory = (chatHistory || []).slice(-8).map((item: any) => ({
                role: item.role === "ai" ? "model" : "user",
                parts: [{ text: typeof item.content === "string" ? item.content : JSON.stringify(item.content) }]
            }));

            const res = await fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        ...geminiHistory,
                        { role: "user", parts: [{ text: message }] }
                    ],
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json"
                    }
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (res.ok) {
                const data = await res.json();
                const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (rawJsonText) {
                    let parsedResponse;
                    try {
                        parsedResponse = JSON.parse(rawJsonText);
                    } catch {
                        const cleanText = rawJsonText.replace(/```json/g, "").replace(/```/g, "").trim();
                        parsedResponse = JSON.parse(cleanText);
                    }

                    return NextResponse.json({
                        success: true,
                        data: parsedResponse
                    });
                }
            }
        }

        // Fallback intelligent director assistant response when offline or key is missing
        const lowerMsg = message.toLowerCase();
        let reply = "Dạ chào anh Huy! Em là Trợ Lý Đạo Diễn AI của tổng kho LYHU. Em đã nắm được yêu cầu của anh và đang tối ưu lại phong cách video chuẩn thuật toán giữ chân người xem!";
        const actions: any[] = [];

        if (lowerMsg.includes("khoai môn") || lowerMsg.includes("cvt")) {
            reply = "Đã tối ưu video theo dòng sản phẩm Khoai Môn Sấy CVT độc quyền từ Trung Quốc! Em đã cập nhật tiêu đề Hook đập mắt và hiệu ứng chữ Cyan Neon cực kỳ nổi bật.";
            actions.push(
                { type: "update_hook", payload: { hookTitle: "🥔 KHOAI MÔN SẤY TẨM VỊ CVT: ĐỘC QUYỀN TRUNG QUỐC SIÊU CUỐN!" } },
                { type: "update_typography", payload: { textColor: "#22D3EE", textAnimationEffect: "tiktok_pop" } },
                { type: "update_bgm", payload: { bgmChoice: "food_review" } },
                { type: "update_power_words", payload: { words: ["CVT ĐỘC QUYỀN", "SẤY THĂNG HOA", "GIÒN RỤM", "LÃI GẤP ĐÔI"] } }
            );
        } else if (lowerMsg.includes("phô mai") || lowerMsg.includes("boyo")) {
            reply = "Đã cập nhật cấu hình cho Bột Phô Mai BOYO! Hook bóc giá tận xưởng và nhạc nền bán hàng Speed-up giúp kích thích tỷ lệ inbox đặt sỉ của các chủ quán gà rán và F&B.";
            actions.push(
                { type: "update_hook", payload: { hookTitle: "🧀 BỘT PHÔ MAI BOYO: GIÁ SỈ TẬN XƯỞNG CHO QUÁN ĂN & GIA ĐÌNH!" } },
                { type: "update_typography", payload: { textColor: "#FACC15", textAnimationEffect: "tiktok_pop" } },
                { type: "update_bgm", payload: { bgmChoice: "tt_banhang_remix" } },
                { type: "update_power_words", payload: { words: ["BOYO CHÍNH HÃNG", "THƠM BÉO ĐẬM ĐÀ", "SỈ TỪ 1KG", "TIẾT KIỆM CHI PHÍ"] } }
            );
        } else if (lowerMsg.includes("kẹo") || lowerMsg.includes("uhi")) {
            reply = "Đã chuyển hướng kịch bản sang Kẹo dẻo UHi Hàn Quốc phân phối độc quyền chính ngạch! Màu chữ tươi vui cùng nhãn Date Mới Tinh sẽ thu hút ngay các nhà phân phối tỉnh và mini mart.";
            actions.push(
                { type: "update_hook", payload: { hookTitle: "🍬 KẸO DẺO UHi HÀN QUỐC: PHÂN PHỐI ĐỘC QUYỀN DATE MỚI TINH!" } },
                { type: "update_typography", payload: { textColor: "#FB7185", textAnimationEffect: "bicolor_punch" } },
                { type: "update_bgm", payload: { bgmChoice: "trending_upbeat" } }
            );
        } else if (lowerMsg.includes("bánh tráng") || lowerMsg.includes("abi")) {
            reply = "Đã cấu hình bộ nhận diện cho Bánh Tráng Abi Snack độc quyền miền Bắc! Nhịp cắt 2.5s cùng chữ nổi bật giúp video thu hút đối tượng học sinh, sinh viên và tiệm tạp hóa.";
            actions.push(
                { type: "update_hook", payload: { hookTitle: "🍘 BÁNH TRÁNG ABI SNACK ĐỘC QUYỀN MIỀN BẮC: LÃI CỰC ĐỈNH!" } },
                { type: "update_typography", payload: { textColor: "#F43F5E", textAnimationEffect: "tiktok_pop" } }
            );
        } else if (lowerMsg.includes("nhanh") || lowerMsg.includes("giật nhịp") || lowerMsg.includes("viral")) {
            reply = "Em đã tăng tốc nhịp cắt lên 2.0s mỗi cảnh, đổi hiệu ứng chữ TikTok Pop nảy chữ vàng và bật nhạc nền Speed-up để kích thích dopamine thị giác người xem!";
            actions.push(
                { type: "update_pacing", payload: { pacing: 2.0 } },
                { type: "update_typography", payload: { textColor: "#FFE600", textAnimationEffect: "tiktok_pop" } },
                { type: "update_bgm", payload: { bgmChoice: "tt_banhang_remix" } }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                reply,
                actions,
                suggestedDirectorTips: [
                    "Quay cận cảnh sản phẩm cách 30-50cm và chạm lấy nét để tạo cảm giác ngon miệng.",
                    "Giữ mỗi cảnh quay từ 2.5 đến 3 giây, đổi góc máy liên tục để người xem không lướt qua."
                ],
                suggestedNextQuestions: [
                    "Tối ưu kịch bản khoai môn CVT",
                    "Đổi màu chữ nổi bật hơn",
                    "Thêm từ khóa kêu gọi inbox sỉ"
                ]
            }
        });

    } catch (err: any) {
        console.error("Director Copilot API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
