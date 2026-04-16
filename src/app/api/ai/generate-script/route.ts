import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
        const { topic, duration } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Missing topic" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        const prompt = `Bạn là một Content Creator, Đạo diễn hình ảnh kiêm Copywriter cực kỳ xuất sắc trên mạng xã hội (TikTok, Reels, Shorts).
Nhiệm vụ của bạn là dựa vào ý tưởng 1 dòng sau đây để viết một KỊCH BẢN QUAY DỰNG CHI TIẾT.

Ý tưởng: "${topic}"
Độ dài dự kiến: ${duration || 30} giây.

YÊU CẦU ĐẦU RA BẮT BUỘC (JSON):
Trình bày chặt chẽ, cuốn hút (Hook ở 3s đầu). Phải sinh ra 1 chuỗi JSON với 2 trường:
{
  "title": "Tiêu đề kịch bản đề xuất siêu thu hút",
  "html": "<table style='width: 100%; border-collapse: collapse;' border='1'><thead><tr><th style='padding: 8px;'>HÌNH ẢNH / CẢNH QUAY (Visual)</th><th style='padding: 8px;'>ÂM THANH / LỜI THOẠI (Audio/Voice)</th></tr></thead><tbody><tr><td style='padding: 8px;'>(Mô tả phân cảnh cụ thể...)</td><td style='padding: 8px;'>(Đọc thoại hoặc âm thanh hiệu ứng...)</td></tr>... (thêm nhiều dòng row cho từng cảnh)...</tbody></table>"
}

Chú ý phần html: CHỈ DÙNG thẻ table, tr, th, td. KHÔNG DÙNG markdown. Nội dung bên trong html phải được thoát chuỗi JS hợp lệ. Chỉ trả về JSON, không kèm \`\`\`json ở bên ngoài nhé!`;

        console.log("[AI Script] Calling Gemini...");
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json"
                },
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[AI Script] Gemini API Error:", errorText);
            return NextResponse.json({ error: "AI Error from server" }, { status: 500 });
        }

        const result = await res.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
             return NextResponse.json({ error: "AI No Output" }, { status: 500 });
        }

        const parsed = JSON.parse(text);

        return NextResponse.json({
            success: true,
            title: parsed.title,
            html: parsed.html
        });

    } catch (err: any) {
        console.error("[AI Script] Exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
