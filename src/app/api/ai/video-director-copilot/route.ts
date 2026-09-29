import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface CopilotAction {
    type: "update_script" | "update_hook" | "update_voice" | "update_bgm" | "update_pacing" | "update_transition" | "update_typography" | "update_power_words" | "trigger_tts";
    payload: any;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, currentStudioState, chatHistory = [] } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Thiếu tin nhắn người dùng" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
        }

        const systemPrompt = `Bạn là "SIÊU AI ĐẠO DIỄN VIDEO LYHU" (LYHU AI Creative Director & Video Copilot).
Bạn là chuyên gia hàng đầu về sản xuất video ngắn TikTok, Reels, YouTube Shorts theo phong cách kể chuyện mộc mạc, giật gân, cuốn hút người xem giống kênh Trà My 24Zone và tổng kho sỉ FMCG LYHU.

DANH MỤC SẢN PHẨM CỐT LÕI CỦA LYHU (ĐỘC QUYỀN):
- Thanh khoai môn sấy CVT (ngon giòn, container về đêm, date mới tinh, bao test từng kiện)
- Bột phô mai BOYO cao cấp (túi 1kg cho các quán khoai tây lắc, gà rán, xưởng F&B)
- Bánh tráng Abi Snack (bánh tráng bơ, phô mai, sa tế cay nồng sỉ số lượng lớn)
- Da cá trứng muối hoàng kim & snack ăn vặt đặc sản
- Nguồn hàng ăn vặt sỉ giá tận gốc, tuyển sỉ toàn quốc, giao hàng nhanh trong ngày.
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
2. TỰ ĐỘNG SUY NGHĨ VÀ XỬ LÝ VIDEO THEO Ý TRAO ĐỔI. Khi người dùng yêu cầu sửa đổi hoặc bạn đề xuất ý tưởng hay, bạn HÃY TRẢ VỀ CÁC HÀNH ĐỘNG CỤ THỂ ĐỂ HỆ THỐNG TỰ ĐỘNG THỰC THI (Auto-Apply) lên Studio của người dùng!

BẠN PHẢI TRẢ VỀ JSON VỚI CẤU TRÚC CHÍNH XÁC SAU:
{
  "reply": "Lời trao đổi, phân tích lý do của đạo diễn gửi người dùng (giọng điệu mộc mạc, nhiệt huyết, chuyên môn cao, có emoji phù hợp)",
  "actions": [
    // Mảng các hành động bạn muốn Studio tự động thực thi (nếu có):
    // Ví dụ:
    // { "type": "update_script", "payload": { "script": "nội dung kịch bản mới...", "triggerTTS": true } }
    // { "type": "update_hook", "payload": { "hookTitle": "tiêu đề hook 3s đầu..." } }
    // { "type": "update_voice", "payload": { "voiceStyle": "female-genz" | "female-sweet" | "female-pro" | "male-genz" | "male-pro" } }
    // { "type": "update_bgm", "payload": { "bgmChoice": "tt_tramy_1" | "tt_banhang_remix" | "tt_food_asmr" | "tt_vinahouse_drop" | "trending_upbeat" | "food_review" | "warehouse_flow" } }
    // { "type": "update_pacing", "payload": { "pacing": 2.0 | 2.5 | 3.0 } }
    // { "type": "update_transition", "payload": { "transition": "auto" | "white_flash" | "crossfade" | "slide_left" } }
    // { "type": "update_typography", "payload": { "textColor": "#FACC15" | "#00AFA9" | "#22C55E" | "#FFFFFF", "textAnimationEffect": "tiktok_pop" | "karaoke_glow" | "fire_shake" | "box_pill" } }
    // { "type": "update_power_words", "payload": { "words": ["DATE MỚI TINH", "CONTAINER ĐÊM", "GIÁ SỈ TẬN KHO"] } }
  ],
  "suggestedDirectorTips": [
    // 2-3 mẹo quay bổ sung cho cảnh này
  ],
  "suggestedNextQuestions": [
    // 2-3 câu hỏi gợi ý để người dùng chọn nhanh tiếp tục trao đổi
  ]
}

LƯU Ý: CHỈ TRẢ VỀ JSON THUẦN TÚY, KHÔNG KÈM VĂN BẢN NGOÀI KHỐI JSON.`;

        // Format history for Gemini
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
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Gemini Copilot Error:", errText);
            return NextResponse.json({ error: "Không thể kết nối Siêu AI Đạo Diễn: " + errText }, { status: 500 });
        }

        const data = await res.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawJsonText) {
            return NextResponse.json({ error: "AI không phản hồi nội dung" }, { status: 500 });
        }

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(rawJsonText);
        } catch (parseErr) {
            // Clean markdown code fence if present
            const cleanText = rawJsonText.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedResponse = JSON.parse(cleanText);
        }

        return NextResponse.json({
            success: true,
            data: parsedResponse
        });

    } catch (err: any) {
        console.error("Director Copilot API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
