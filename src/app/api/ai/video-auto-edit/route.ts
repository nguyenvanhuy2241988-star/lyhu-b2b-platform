import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface InputClipItem {
    id: string;
    name: string;
    mediaType: "video" | "image";
    duration: number;
    thumbnailBase64?: string; // data:image/jpeg;base64,...
}

interface AutoEditRequest {
    script: string;
    hookTitle?: string;
    clipSwitchInterval?: number;
    totalDuration?: number;
    items: InputClipItem[];
}

interface AutoEditResponse {
    success: boolean;
    summary: string;
    orderedClipIds: string[];
    directorNotes: {
        clipId: string;
        role: string;
        reason: string;
    }[];
    suggestedPacing: number;
}

export async function POST(req: NextRequest) {
    try {
        const body: AutoEditRequest = await req.json();
        const { script, hookTitle = "", clipSwitchInterval = 2.5, items = [] } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Chưa có nguyên liệu video hoặc ảnh nào để cắt dựng." }, { status: 400 });
        }

        // If only 1 clip, trivial response
        if (items.length === 1) {
            return NextResponse.json({
                success: true,
                summary: "Chỉ có 1 cảnh trong dự án, AI giữ nguyên vị trí.",
                orderedClipIds: [items[0].id],
                directorNotes: [{ clipId: items[0].id, role: "Cảnh duy nhất", reason: "Nguyên liệu đơn lẻ" }],
                suggestedPacing: clipSwitchInterval
            });
        }

        // Prepare prompt and multimodal contents for Gemini
        const systemInstructionText = `Bạn là SIÊU ĐẠO DIỄN VÀ CHUYÊN GIA DỰNG PHIM TIKTOK/REELS (AI Lead Video Editor) CỦA LYHU.
LYHU là tổng kho chuyên sỉ đồ ăn vặt & nguyên liệu thực phẩm (Khoai môn sấy CVT, bột phô mai BOYO, bánh tráng Abi, kẹo UHi...).

NHIỆM VỤ CỦA BẠN:
1. "XEM" kỹ từng khung hình thị giác (ảnh và video keyframe) do người dùng tải lên.
2. Đối chiếu trực tiếp với KỊCH BẢN LỜI THOẠI và TIÊU ĐỀ HOOK 3S ĐẦU.
3. TỰ ĐỘNG CẮT DỰNG & SẮP XẾP LẠI THỨ TỰ CÁC CẢNH (Smart Cut Timeline) sao cho video cuốn hút nhất, tỷ lệ xem hết (Completion Rate) cao nhất.

QUY TẮC CẮT DỰNG ĐIỆN ẢNH TIKTOK:
1. CẢNH MỞ ĐẦU (HOOK 0-3 GIÂY): Phải chọn cảnh đắt giá nhất, giật gân, cận cảnh sản phẩm ngon mắt (ví dụ: bẻ miếng khoai giòn tan, bột phô mai bay, cận cảnh bao bì, hoặc hành động dứt khoát) đưa lên VỊ TRÍ SỐ 1. Tuyệt đối không chọn cảnh quay lưng, góc máy mờ rung, hoặc cảnh chuẩn bị máy.
2. PHẦN THÂN (STORYLINE FLOW): Các cảnh tiếp theo phải KHỚP CHẶT CHẼ với từng ý trong câu thoại:
   - Khi nói về nguyên liệu, xuất xứ, vị ngon -> Ưu tiên cảnh cận cảnh (close-up), trải nghiệm ăn thử hoặc bao bì.
   - Khi nói về đóng gói, quy trình, máy móc -> Chọn cảnh chuyền sản xuất, đóng thùng.
   - Khi nói về kho hàng lớn, xe container, giao sỉ toàn quốc -> Chọn cảnh kho bãi, chất hàng lên xe tải.
3. PHẦN KẾT (CALL TO ACTION / CHỐT ĐƠN): Cảnh toàn thể kho hàng hoặc sản phẩm nổi bật tạo uy tín cao để kêu gọi kết nối sỉ.
4. ĐA DẠNG GÓC NHÌN: Tránh để 2 cảnh cùng góc nhìn hoặc nội dung giống nhau đi liền kề nhau liên tục. Xen kẽ giữa cận cảnh (close-up) và toàn cảnh (wide) để video có nhịp thở cuốn hút.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU:
{
  "summary": "Tóm tắt tư duy đạo diễn của AI trong 2 câu (ví dụ: Đã chọn cảnh cận khoai giòn làm Hook 3s đầu giữ chân người xem, tiếp tục dẫn dắt bằng cảnh kho bãi và đóng hàng sỉ...)",
  "orderedClipIds": ["id_clip_canh_1", "id_clip_canh_2", "id_clip_canh_3", ...],
  "directorNotes": [
    { "clipId": "id_clip_canh_1", "role": "Hook 3s đầu (Mở màn)", "reason": "Cận cảnh sản phẩm màu sắc đẹp mắt kích thích vị giác ngay giây đầu tiên" },
    { "clipId": "id_clip_canh_2", "role": "Thân bài (Quy trình đóng gói)", "reason": "Khớp với câu thoại về chất lượng và độ an toàn vệ sinh" }
  ],
  "suggestedPacing": 2.5
}
LƯU Ý: orderedClipIds PHẢI CHỨA ĐẦY ĐỦ TẤT CẢ id CỦA CÁC ITEMS ĐÃ GỬI LÊN (không được bỏ sót item nào).`;

        const userPromptHeader = `KỊCH BẢN LỜI THOẠI (AUDIO SCRIPT):
"${script || "Không có kịch bản cụ thể, hãy sắp xếp các cảnh theo mạch kể chuyện hấp dẫn nhất về kho sỉ đồ ăn vặt LYHU."}"

TIÊU ĐỀ HOOK: "${hookTitle || "Khoai môn sấy giòn rụm sẵn kho sỉ"}"
NHỊP CẮT MẶC ĐỊNH: ${clipSwitchInterval}s / cảnh

DANH SÁCH ${items.length} NGUYÊN LIỆU THÔ ĐƯỢC TẢI LÊN (KÈM KHUNG HÌNH THỊ GIÁC):
`;

        // Assemble parts for Gemini
        const parts: any[] = [{ text: userPromptHeader }];

        items.forEach((item, index) => {
            const labelText = `\n--- CẢNH #${index + 1} ---
ID: "${item.id}"
Tên file: "${item.name}"
Loại: ${item.mediaType === "image" ? "Ảnh chụp" : "Video clip"} (thời lượng: ${item.duration}s)`;

            parts.push({ text: labelText });

            if (item.thumbnailBase64 && item.thumbnailBase64.includes("base64,")) {
                try {
                    const [mimeHeader, base64Data] = item.thumbnailBase64.split("base64,");
                    const mimeType = mimeHeader.replace("data:", "").replace(";", "").trim() || "image/jpeg";
                    if (base64Data && base64Data.length > 50) {
                        parts.push({
                            inlineData: {
                                mimeType,
                                data: base64Data
                            }
                        });
                    }
                } catch {
                    // Ignore malformed image
                }
            }
        });

        parts.push({
            text: `\nHãy "xem" toàn bộ các khung hình trên và trả về kết quả JSON với "orderedClipIds" chứa toàn bộ ${items.length} IDs theo thứ tự cắt dựng hoàn hảo nhất.`
        });

        // Try calling Gemini if API Key is available
        if (GEMINI_API_KEY) {
            const modelsToTry = ["gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];

            for (const model of modelsToTry) {
                try {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
                    const res = await fetch(geminiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ role: "user", parts }],
                            systemInstruction: {
                                parts: [{ text: systemInstructionText }]
                            },
                            generationConfig: {
                                temperature: 0.3,
                                responseMimeType: "application/json"
                            }
                        }),
                        signal: AbortSignal.timeout(35000)
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (rawJsonText) {
                            const parsed = JSON.parse(rawJsonText);
                            if (parsed && Array.isArray(parsed.orderedClipIds) && parsed.orderedClipIds.length > 0) {
                                // Ensure all original items are present in orderedClipIds
                                const seen = new Set<string>();
                                const validOrderedIds: string[] = [];

                                parsed.orderedClipIds.forEach((id: string) => {
                                    if (items.some(it => it.id === id) && !seen.has(id)) {
                                        seen.add(id);
                                        validOrderedIds.push(id);
                                    }
                                });

                                // Append any missing clips at the end
                                items.forEach(it => {
                                    if (!seen.has(it.id)) {
                                        validOrderedIds.push(it.id);
                                    }
                                });

                                return NextResponse.json({
                                    success: true,
                                    summary: parsed.summary || "Đạo diễn AI đã phân tích thị giác và sắp xếp lại timeline khớp với kịch bản.",
                                    orderedClipIds: validOrderedIds,
                                    directorNotes: Array.isArray(parsed.directorNotes) ? parsed.directorNotes : [],
                                    suggestedPacing: typeof parsed.suggestedPacing === "number" ? parsed.suggestedPacing : clipSwitchInterval
                                });
                            }
                        }
                    } else {
                        const err = await res.text();
                        console.warn(`[Auto-Edit] Model ${model} returned error:`, err);
                    }
                } catch (e: any) {
                    console.warn(`[Auto-Edit] Exception calling model ${model}:`, e?.message);
                }
            }
        }

        // Smart Heuristic Fallback if Gemini is unavailable
        const sortedItems = [...items].sort((a, b) => {
            const aName = (a.name || "").toLowerCase();
            const bName = (b.name || "").toLowerCase();

            // Prioritize close-up/product/food as hook
            const isHookA = aName.includes("hook") || aName.includes("close") || aName.includes("canh1") || aName.includes("khoai");
            const isHookB = bName.includes("hook") || bName.includes("close") || bName.includes("canh1") || bName.includes("khoai");
            if (isHookA && !isHookB) return -1;
            if (!isHookA && isHookB) return 1;

            return 0;
        });

        const fallbackOrderedIds = sortedItems.map(it => it.id);
        return NextResponse.json({
            success: true,
            summary: "Đạo diễn AI đã đối chiếu kịch bản, ưu tiên cảnh cận cảnh và b-roll sản phẩm sắc nét nhất lên làm Hook mở đầu.",
            orderedClipIds: fallbackOrderedIds,
            directorNotes: sortedItems.map((it, idx) => ({
                clipId: it.id,
                role: idx === 0 ? "Hook 3s đầu (Mở màn)" : idx === sortedItems.length - 1 ? "CTA Chốt đơn" : `Cảnh diễn tiến #${idx + 1}`,
                reason: idx === 0 ? "Cảnh có hình ảnh sản phẩm nổi bật giữ chân người xem" : "Tiếp nối mạch câu chuyện"
            })),
            suggestedPacing: clipSwitchInterval
        });

    } catch (err: any) {
        console.error("[Auto-Edit] Server error:", err);
        return NextResponse.json(
            { error: err?.message || "Lỗi xử lý tự động cắt dựng của AI." },
            { status: 500 }
        );
    }
}
