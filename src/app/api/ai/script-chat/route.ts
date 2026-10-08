import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, currentScript, currentHookTitle } = body as {
            messages: ChatMessage[];
            currentScript?: string;
            currentHookTitle?: string;
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Vui lòng nhập tin nhắn trao đổi với AI." }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." }, { status: 500 });
        }

        const systemInstruction = `Bạn là Đạo diễn Sáng tạo kiêm Chuyên gia Biên kịch Video ngắn (TikTok, Reels, Shorts) hàng đầu cho công ty LYHU (sản xuất, nhập khẩu và phân phối sỉ bánh kẹo, đồ ăn vặt & nguyên liệu đồ uống B2B).

DANH MỤC THƯƠNG HIỆU ĐỘC QUYỀN CỦA LYHU:
1. Bột phô mai BOYO 1kg: Vị phô mai truyền thống béo mặn, vị cay nhẹ, hương thơm nồng nàn. Dành cho các quán khoai lắc, gà rán, bắp rang bơ, bánh gạo lắc.
2. Thanh khoai môn sấy CVT: Độc quyền nhập khẩu. Vị sốt trứng cua béo ngậy, nấm truffle thơm lừng, giòn rụm tan trong miệng. Rất chuộng ở quán karaoke, beer club, rạp phim, siêu thị.
3. Kẹo dẻo UHi Hàn Quốc: Nhập khẩu chính ngạch, nước ép hoa quả đào, nho mẫu đơn, xoài chín đậm đặc.
4. Bánh tráng Abi Snack & Da cá hoàng kim: Sốt bơ béo ngậy, sa tế cay nồng, giòn xốp.
5. Lợi thế B2B: Giá sỉ tận kho xưởng, date mới toanh, hóa đơn VAT đầy đủ, chính sách đổi trả 100%, gửi mẫu thử miễn phí cho chủ quán.

PHONG CÁCH LÀM VIỆC CỦA BẠN:
- Bạn trao đổi 2 chiều tự nhiên, thông minh và thấu hiểu như ChatGPT / Gemini.
- Khi người dùng đưa ý tưởng, bạn gợi ý kịch bản sắc bén, đúng nhịp video ngắn 15s - 35s.
- Cấu trúc kịch bản video ngắn triệu view:
  + Hook 3s đầu: Đánh trúng nỗi đau hoặc kích thích lòng tham/sự tò mò của chủ quán/đại lý sỉ (VD: "Chủ quán nào đang tìm món ăn vặt 1 vốn 4 lời...", "Cảnh báo cháy hàng: Khoai môn trứng cua vừa cập bến!").
  + Thân bài (15-20s): Đi thẳng vào ưu điểm: vị ngon, date mới toanh, đóng thùng xịn, giao hàng nhanh.
  + Kêu gọi hành động CTA (3-5s): Kêu gọi chốt sỉ, nhắn Zalo nhận báo giá sỉ tận gốc hoặc gửi mẫu thử.
- Khi người dùng muốn chỉnh sửa (ngắn lại, thêm giá, đổi phong cách hài hước...), bạn lắng nghe, giải thích ngắn gọn rồi cập nhật ngay bản nháp mới.

QUY ĐỊNH ĐẦU RA BẮT BUỘC:
Bạn PHẢI trả về đúng định dạng JSON sau:
{
  "reply": "Lời trò chuyện, tư vấn, giải thích của bạn gửi tới người dùng (thân thiện, chuyên nghiệp, gợi mở)",
  "scriptDraft": {
    "hookTitle": "TIÊU ĐỀ HOOK 3S ĐẦU IN HOA (DƯỚI 12 TỪ)",
    "script": "Toàn văn lời thoại kịch bản video được viết liền mạch hoặc từng câu rõ ràng, tự nhiên, không kèm ký hiệu lạ.",
    "estimatedSeconds": 25,
    "pacing": 2.5,
    "scenes": [
      { "visual": "Mô tả hình ảnh phân cảnh 1", "audio": "Câu thoại phân cảnh 1" },
      { "visual": "Mô tả hình ảnh phân cảnh 2", "audio": "Câu thoại phân cảnh 2" }
    ]
  }
}
Lưu ý: Nếu người dùng chỉ đang hỏi thăm hoặc chào hỏi đơn thuần chưa cần kịch bản, trường "scriptDraft" có thể là null. Nhưng khi người dùng yêu cầu viết kịch bản hoặc chỉnh sửa, BẮT BUỘC phải có "scriptDraft" đầy đủ!`;

        // Format Gemini contents history
        const contents = [
            {
                role: "user",
                parts: [{ text: systemInstruction }]
            },
            {
                role: "model",
                parts: [{ text: "Tôi đã hiểu rõ vai trò Đạo diễn Biên kịch video ngắn LYHU B2B. Tôi sẵn sàng trao đổi, sáng tạo và tinh chỉnh kịch bản theo từng yêu cầu của bạn!" }]
            }
        ];

        if (currentScript) {
            contents.push({
                role: "user",
                parts: [{ text: `Kịch bản hiện tại trên màn hình Video Studio:\n- Tiêu đề Hook: "${currentHookTitle || ""}"\n- Lời thoại: "${currentScript}"` }]
            });
            contents.push({
                role: "model",
                parts: [{ text: "Tôi đã nắm kịch bản hiện tại. Hãy cho tôi biết bạn muốn điều chỉnh hoặc đổi mới theo hướng nào!" }]
            });
        }

        // Add user & model chat history
        for (const msg of messages) {
            contents.push({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            });
        }

        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("[Script Chat API] Gemini error:", errText);
            return NextResponse.json({ error: "Lỗi kết nối AI Gemini Biên Kịch." }, { status: 500 });
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            return NextResponse.json({ error: "Không nhận được phản hồi từ AI." }, { status: 500 });
        }

        try {
            const parsed = JSON.parse(rawText);
            return NextResponse.json({
                success: true,
                reply: parsed.reply || "Dưới đây là phương án kịch bản tối ưu dành cho bạn:",
                scriptDraft: parsed.scriptDraft || null
            });
        } catch {
            return NextResponse.json({
                success: true,
                reply: rawText,
                scriptDraft: null
            });
        }
    } catch (err: any) {
        console.error("[Script Chat API Error]:", err);
        return NextResponse.json({ error: err.message || "Lỗi máy chủ khi trao đổi kịch bản." }, { status: 500 });
    }
}
