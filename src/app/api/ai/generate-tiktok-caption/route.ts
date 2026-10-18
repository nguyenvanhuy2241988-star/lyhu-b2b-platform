import { NextRequest, NextResponse } from "next/server";
import { getAppSecret } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { videoTitle } = await req.json();

        const title = (videoTitle || "Hàng tiêu dùng sỉ chất lượng").trim();

        // 1. Kiểm tra API Key (từ env hoặc app_secrets)
        let apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            const secret = await getAppSecret('gemini_config');
            apiKey = secret?.api_key || secret?.gemini_api_key;
        }

        if (apiKey) {
            try {
                const prompt = `Bạn là một chuyên gia sáng tạo nội dung TikTok hàng đầu tại Việt Nam, chuyên về ngành Hàng Tiêu Dùng (FMCG), kinh doanh sỉ & lẻ, đại lý, tạp hóa cho thương hiệu LYHU (Nền tảng phân phối sỉ hàng tiêu dùng uy tín).
Hãy viết 1 đoạn Caption đăng TikTok cực kỳ hấp dẫn, viral và thu hút dựa trên chủ đề/tiêu đề video sau:
Tiêu đề video: "${title}"

Yêu cầu cấu trúc:
1. Dòng 1: Một câu Hook giật tít, tò mò hoặc đánh trúng tim đen người xem (kèm icon bắt mắt).
2. Dòng 2-3: Thông điệp giá trị ngắn gọn, đánh trúng tâm lý người kinh doanh tạp hóa, đại lý hoặc người tiêu dùng thông thái.
3. Dòng 4: Kêu gọi hành động (CTA) rõ ràng: "👉 Nhập sỉ giá tốt tại www.lyhu.com.vn | Hotline: 0969.83.4568" hoặc "Thả tim & Follow LYHU để nhận thêm bí quyết kinh doanh!".
4. Dòng cuối: 5 - 8 hashtags hot & chuẩn SEO TikTok (bắt buộc có #lyhu #hangtieudung #kinhdoanh #taphoa #bansihangtieudung).

Chỉ trả về trực tiếp nội dung caption, không kèm giải thích thừa hay dấu ngoặc kép.`;

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
                const res = await fetch(geminiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                        },
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                    if (text) {
                        return NextResponse.json({ caption: text });
                    }
                }
            } catch (aiErr) {
                console.warn("[AI Caption] Gemini error, falling back to smart template:", aiErr);
            }
        }

        // Fallback: Smart Template Engine nếu chưa cấu hình GEMINI_API_KEY
        const cleanTitle = title.replace(/\.[^/.]+$/, "");
        const fallbackCaptions = [
            `🔥 ${cleanTitle} - Bí quyết kinh doanh sinh lời bền vững!\n\n💡 Nhập hàng giá gốc, nguồn hàng ổn định cho đại lý & tiệm tạp hóa trên toàn quốc.\n👉 Xem chi tiết và đặt hàng tại: www.lyhu.com.vn\n\n#lyhu #hangtieudung #kinhdoanh #taphoa #bansihangtieudung #fmcg #xuhuongtiktok`,
            `⚡ CẬP NHẬT MỚI: ${cleanTitle}!\n\n📦 Nguồn hàng sỉ tận gốc cho mọi chủ tiệm tạp hóa và siêu thị mini.\n👉 Đặt hàng ngay hôm nay tại www.lyhu.com.vn | Hotline 0969.83.4568\n\n#lyhu #kinhdoanh #daily #taphoa #bansihangtieudung #xuhuong`,
            `🎯 Bạn đã biết điều này chưa: ${cleanTitle}?\n\n✨ Giải pháp tối ưu chi phí & tăng lợi nhuận cho điểm bán hàng tiêu dùng.\n👉 Ghé ngay www.lyhu.com.vn để cập nhật bảng giá sỉ mới nhất!\n\n#lyhu #kinhdoanhtaphoa #fmcg #bansihangtieudung #meokinhdoanh`
        ];

        const chosen = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
        return NextResponse.json({ caption: chosen });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Lỗi tạo caption" }, { status: 500 });
    }
}
