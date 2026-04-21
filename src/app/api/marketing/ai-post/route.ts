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
            typeInstruction = `TÌM KIẾM ĐẠI LÝ, NHÀ PHÂN PHỐI (Bán sỉ / Bán buôn). 
            Giọng điệu: Tự nhiên, gần gũi, mang đậm phong cách dân buôn/sale thực chiến (sử dụng các từ lóng: nhập sỉ, cắt lô, kèo thơm, bao nét, sát ván, chốt đơn, vít số, bao ship...). 
            CẤM TUYỆT ĐỐI các từ ngữ sáo rỗng, đa cấp như: "Cơ hội vàng", "đối tác chiến lược", "phát triển thịnh vượng", "rộng mở vòng tay". Hãy viết ngắn gọn, đi thẳng vào biên độ lợi nhuận và chính sách mồi. KHÔNG ĐƯỢC viết giống tin tuyển nhân sự.`;
        } else if (postType === 'recruitment') {
            typeInstruction = `TUYỂN DỤNG NHÂN SỰ. 
            Giọng điệu: Rõ ràng, thân thiện. Liệt kê rõ công việc, môi trường và lộ trình lương/thưởng. Viết tự nhiên như một HR đang tìm đồng đội. CẤM dùng từ sáo rỗng.`;
        } else {
            typeInstruction = `BÁN HÀNG LẺ. 
            Giọng điệu: Hấp dẫn, kích thích mua hàng, tập trung vào ưu đãi và chất lượng sản phẩm.`;
        }

        const prompt = `Bạn là một Giám Đốc Kinh Doanh (Sale Manager) chuyên đi thị trường và đăng bài vào các group Facebook buôn bán tại Việt Nam. 
Mục tiêu: Viết một bài đăng ${typeInstruction} dựa trên thông tin cung cấp, sử dụng ĐỊNH DẠNG SPINTEX CHUẨN XÁC để đăng ngẫu nhiên hàng loạt. Cấu trúc Spintex mẫu: "{Xin chào|Chào anh em|Hi các bác}"

Thông tin bài đăng:
- Chủ đề chính / Kêu gọi: ${topic}
${brand ? `- Phục vụ cho Nhãn hàng / Sản phẩm: ${brand}` : ''}
${benefit ? (postType === 'recruitment' ? `- Mức lương / Đãi ngộ: ${benefit}` : `- Quyền lợi / Chiết khấu cho đại lý/khách hàng: ${benefit}`) : ''}
${address ? `- Địa chỉ: ${address}` : ''}
${phone ? `- SĐT Liên hệ: ${phone}` : ''}

YÊU CẦU QUAN TRỌNG:
1. Đan xen Spintex ở nhiều vị trí (Cảm thán, Xưng hô, Động từ). Hạn chế tạo các cụm Spintex quá dài làm mất ngữ nghĩa.
2. VĂN PHONG "NGƯỜI THẬT": Viết có nhịp điệu, ngắt đoạn rõ ràng, dùng bullet point (gạch đầu dòng có icon) để làm nổi bật quyền lợi. Không viết như một bài văn xuôi dài dòng.
3. Tích hợp từ khóa: Giữ nguyên các thông tin cứng (SĐT, Địa chỉ, Tên thương hiệu, Tỉ lệ chiết khấu, Mức lương).
4. Độ dài: Tối đa 150-250 chữ, sử dụng Emoji hợp lý (không lạm dụng).
5. CHỈ TRẢ VỀ KẾT QUẢ VĂN BẢN DUY NHẤT. Bắt đầu ngay vào nội dung, không có lời dạo đầu "Dưới đây là...". Phải có thể Copy paste dùng luôn!`;

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
