import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI can take a while

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
        const { templateText } = await req.json();

        if (!templateText) {
            return NextResponse.json({ error: "Thiếu văn bản gốc (templateText)" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        const prompt = `Bạn là một chuyên gia Marketing thực chiến, chuyên gia lách thuật toán kiểm duyệt nội dung trùng lặp (Spam) của Facebook.
Tôi sẽ cung cấp cho bạn 1 hoặc nhiều bài viết mẫu (phân tách bởi dấu ---, tùy ý).

NHIỆM VỤ CỦA BẠN:
1. Viết lại các văn bản gốc này dưới dạng một cấu trúc ĐA DẠNG HÓA TỪ NGỮ (Spintax).
2. Cú pháp Spintax là: {Từ 1|Từ 2|Từ 3}. Hệ thống của tôi sẽ tự động chọn ngẫu nhiên 1 trong các tùy chọn này ở mỗi lần đăng bài.
3. Nếu văn bản gốc có NHIỀU BÀI VIẾT (đã phân tách bởi ngắt dòng hoặc ---), HÃY gộp tất cả thành một cấu trúc Spin khổng lồ: 
{ {Bài 1 đã gắn Spintax} | {Bài 2 đã gắn Spintax} | {Bài 3 đã gắn Spintax} }.
4. YÊU CẦU QUAN TRỌNG NHẤT: Giữ nguyên hoàn toàn Ý NGHĨA, LỢI ÍCH SẢN PHẨM, CHIẾT KHẤU, THÔNG TIN LIÊN HỆ, SĐT, ĐỊA CHỈ của tôi. KHÔNG tự ý bịa thêm số liệu hay thông tin liên hệ.
5. CHỈ TRẢ VỀ CẤU TRÚC SPINTAX. KHÔNG GIẢI THÍCH, KHÔNG CHÀO HỎI, KHÔNG XÓA DẤU XUỐNG DÒNG CỦA BẢN GỐC.

VĂN BẢN GỐC CẦN XỬ LÝ (SPIN):
${templateText}`;

        const parts: any[] = [{ text: prompt }];

        console.log("[Marketing AI] Calling Gemini for Spintax Generation...");
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 8192
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[Marketing AI] Gemini Error:", errorText);
            return NextResponse.json({ error: `AI Error: ${errorText}` }, { status: 500 });
        }

        const result = await res.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
            console.error("[Marketing AI] Empty text. Result was:", JSON.stringify(result, null, 2));
            return NextResponse.json({ error: `AI No Output. Result: ${JSON.stringify(result)}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            post_content: text.trim()
        });

    } catch (err: any) {
        console.error("[Marketing AI] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
