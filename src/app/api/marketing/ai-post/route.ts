import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI can take a while

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
        const { postType, topic, benefit, address, phone, brand } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Missing required topic field" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        let typeInstruction = "bán lẻ hàng hóa";
        if (postType === 'distributor') {
            typeInstruction = "TÌM KIẾM ĐẠI LÝ, NHÀ PHÂN PHỐI. Giọng điệu hợp tác kinh doanh, đề cao lợi ích đối tác, KHÔNG ĐƯỢC viết giống tin tuyển nhân sự.";
        } else if (postType === 'recruitment') {
            typeInstruction = "TUYỂN DỤNG NHÂN SỰ. Chi tiết về công việc, môi trường và lộ trình.";
        }

        const prompt = `Bạn là một Content Creator chuyên nghiệp chạy quảng cáo và spam seeding Facebook tại Việt Nam. 
Mục tiêu: Viết một bài đăng ${typeInstruction} dựa trên thông tin được cung cấp, sử dụng ĐỊNH DẠNG SPINTEXT CHUẨN XÁC để đăng ngẫu nhiên hàng loạt không bị checkpoint. Cấu trúc Spintext mẫu: "{Xin chào|Chào mọi người|Alo anh em}"

Thông tin bài đăng cần có:
- Chủ đề chính / Kêu gọi: ${topic}
${brand ? `- Phục vụ cho Nhãn hàng / Sản phẩm: ${brand}` : ''}
${benefit ? (postType === 'recruitment' ? `- Mức lương / Đãi ngộ: ${benefit}` : `- Quyền lợi / Chiết khấu cho đại lý/khách hàng: ${benefit}`) : ''}
${address ? `- Địa chỉ: ${address}` : ''}
${phone ? `- SĐT Liên hệ: ${phone}` : ''}

YÊU CẦU QUAN TRỌNG:
1. Đan xen Spintext ở nhiều vị trí: Lời chào, Đại từ xưng hô, Cảm thán, Câu chốt gọi hành động. VD: "{Nhanh tay|Đừng bỏ lỡ|Ứng tuyển ngay}"
2. Tích hợp từ khóa: Đảm bảo giữ nguyên các từ khóa quan trọng cứng (như SĐT, Lương, Địa chỉ) để không bị sai lệch thông tin khi sinh ngẫu nhiên.
3. Độ dài: Quanh mốc 100-200 chữ, có sử dụng Emoji tự nhiên.
4. CHỈ XUẤT RA KẾT QUẢ VĂN BẢN DUY NHẤT. KHÔNG TRẢ LỜI "DƯỚI ĐÂY LÀ..." HOẶC GIẢI THÍCH! Phải có thể Copy paste dùng luôn!`;

        console.log("[Marketing AI] Calling Gemini...");
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048
                },
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[Marketing AI] Gemini Error:", errorText);
            return NextResponse.json({ error: "AI Error" }, { status: 500 });
        }

        const result = await res.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
             return NextResponse.json({ error: "AI No Output" }, { status: 500 });
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
