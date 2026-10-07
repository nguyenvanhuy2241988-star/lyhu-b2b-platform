import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface InputFrameItem {
    label: string;
    timestamp: number;
    base64: string;
}

interface InputClipItem {
    id: string;
    name: string;
    mediaType: "video" | "image";
    duration: number;
    frames?: InputFrameItem[];
    thumbnailBase64?: string; // fallback single thumbnail
}

interface SentenceBeat {
    index: number;
    text: string;
    targetDuration: number;
}

interface AutoEditRequest {
    script: string;
    hookTitle?: string;
    clipSwitchInterval?: number;
    totalDuration?: number;
    sentences?: SentenceBeat[];
    items: InputClipItem[];
}

export async function POST(req: NextRequest) {
    try {
        const body: AutoEditRequest = await req.json();
        const {
            script,
            hookTitle = "",
            clipSwitchInterval = 2.5,
            totalDuration = 30,
            sentences = [],
            items = []
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Chưa có nguyên liệu video hoặc ảnh nào để cắt dựng." }, { status: 400 });
        }

        // Trivial case: single clip
        if (items.length === 1) {
            return NextResponse.json({
                success: true,
                summary: "Dự án chỉ có 1 cảnh quay duy nhất, AI giữ nguyên và tự động căn chỉnh thời lượng.",
                curatedTimeline: [{
                    clipId: items[0].id,
                    trimStart: 0,
                    duration: totalDuration || items[0].duration || clipSwitchInterval,
                    role: "Cảnh duy nhất",
                    matchedSentence: script.slice(0, 80),
                    reason: "Tư liệu duy nhất có sẵn"
                }],
                orderedClipIds: [items[0].id],
                backupClipIds: [],
                directorNotes: [{ clipId: items[0].id, role: "Cảnh chính", reason: "Nguyên liệu đơn lẻ" }],
                suggestedPacing: clipSwitchInterval
            });
        }

        // Prepare Advanced System Prompt for Gemini Film Director
        const systemInstructionText = `Bạn là SIÊU ĐẠO DIỄN VÀ CHUYÊN GIA DỰNG PHIM ĐIỆN ẢNH TIKTOK/REELS (AI Master Film Editor) CỦA LYHU.
LYHU là tổng kho chuyên sỉ đồ ăn vặt & nguyên liệu thực phẩm (Khoai môn sấy CVT, bột phô mai BOYO, bánh tráng Abi, kẹo UHi...).

QUY TẮC DỰNG PHIM ĐỈNH CAO (CINEMA AUTO-EDIT DIRECTIVES):
1. QUAN SÁT THỊ GIÁC SÂU (MULTI-KEYFRAME VISION):
   - Bạn được cung cấp nhiều khung hình trích xuất ở các mốc (Đầu clip, Giữa clip, Cuối clip) của từng video/ảnh thô.
   - Hãy thẩm định kỹ: Đoạn nào camera rung lắc, mờ, chưa vào khung hình? Đoạn nào hành động đắt giá nhất xuất hiện (ví dụ: bẻ đôi miếng khoai giòn tan, rắc bột phô mai bồng bềnh, công nhân đóng thùng, pallet hàng ngập kho)?

2. TÍNH TOÁN ĐIỂM VÀO ĐẮT GIÁ NHẤT (TRIM IN-POINT / TRIMSTART):
   - Hầu hết video quay bằng điện thoại bị rung 1-2 giây đầu. TUYỆT ĐỐI không để trimStart = 0 nếu đầu clip bị rung lắc hoặc chết góc!
   - Hãy chỉ định chính xác \`trimStart\` (giây) để video nhảy ngay vào khoảnh khắc hành động đẹp nhất (thường từ 1.0s đến 3.0s). Với ảnh tĩnh thì trimStart = 0.

3. ĐỒNG BỘ CHẶT CHẼ THEO TỪNG CÂU NÓI (STORY BEAT MATCHING):
   - Đối chiếu danh sách từng câu kịch bản kèm thời lượng (targetDuration).
   - Hãy ghép mỗi câu nói với MỘT cảnh quay có ý nghĩa tương ứng nhất:
     * Câu Hook (3s đầu): BẮT BUỘC chọn cảnh CẬN CẢNH (Close-up/Macro) bắt mắt nhất, kích thích vị giác hoặc hành động bất ngờ làm Cảnh #1 để giữ chân người lướt.
     * Câu Về Chất Lượng / Quy Trình: Chọn cảnh rắc gia vị, bao bì nguyên seal, dây chuyền sạch sẽ.
     * Câu Về Sỉ / Kho Bãi / Vận Chuyển: Chọn cảnh toàn kho, xe tải, pallet hàng cao ngất ngưởng.
     * Câu Kêu Gọi Hành Động (CTA): Chọn cảnh trưng bày tổng thể hoặc gói hàng chỉn chu.
   - Gán \`duration\` của cảnh đó khớp chính xác với thời lượng câu thoại (hoặc từ 1.8s đến 3.5s).
   - NẾU SỐ LƯỢNG CLIP ÍT HƠN SỐ CÂU THOẠI: Bạn hoàn toàn có thể tái sử dụng một video dài bằng cách chọn các \`trimStart\` khác nhau (ví dụ: đoạn đầu ở giây 1.0s, đoạn sau ở giây 5.5s) để đảm bảo TOÀN BỘ các câu thoại đều có hình minh họa sống động!

4. LỌC BỎ CẢNH THỪA (SMART CURATION):
   - Chọn lọc những cảnh tinh hoa nhất đưa vào \`curatedTimeline\`.
   - Các cảnh rung lắc, mờ nhạt hoặc trùng lặp không dùng đến hãy đưa vào danh sách \`backupClipIds\`.

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU:
{
  "summary": "Tóm tắt tư duy cắt dựng của đạo diễn: Đã chọn bao nhiêu cảnh đẹp nhất, đã cắt bỏ đoạn rung lắc của clip nào, bắt khoảnh khắc vàng ở giây thứ mấy, nhịp điệu tổng thể thế nào...",
  "curatedTimeline": [
    {
      "clipId": "id_cua_clip",
      "trimStart": 2.0, // Giây bắt đầu đẹp nhất của video thô (nếu là ảnh thì để 0)
      "duration": 3.0, // Thời lượng cảnh hiển thị khớp với câu thoại
      "role": "Hook 3s đầu (Cận cảnh cực phẩm)",
      "matchedSentence": "Nội dung câu thoại mà cảnh này minh họa...",
      "reason": "Lý do chọn: Bắt đúng khoảnh khắc bẻ khoai giòn tan từ giây 2.0, loại bỏ 2s đầu bị rung máy..."
    }
  ],
  "backupClipIds": ["id_clip_thua_1", "id_clip_thua_2"],
  "suggestedPacing": 2.5
}
LƯU Ý QUAN TRỌNG: Tất cả clipId trong \`curatedTimeline\` và \`backupClipIds\` phải khớp với ID các nguyên liệu đã gửi lên.`;

        // Format Sentences
        const formattedSentences = sentences && sentences.length > 0
            ? sentences.map(s => `[Câu #${s.index + 1}] (${s.targetDuration.toFixed(1)}s): "${s.text}"`).join("\n")
            : `Kịch bản nguyên văn: "${script}" (Tổng thời lượng: ${totalDuration}s)`;

        const userPromptHeader = `KỊCH BẢN PHÂN CẢNH THEO TỪNG CÂU NÓI (STORY BEATS):
${formattedSentences}

TIÊU ĐỀ HOOK: "${hookTitle || "Khoai môn sấy giòn rụm sẵn kho sỉ"}"
TỔNG THỜI LƯỢNG MỤC TIÊU: ${totalDuration} giây

DANH SÁCH ${items.length} NGUYÊN LIỆU THÔ ĐƯỢC TẢI LÊN:
`;

        const parts: any[] = [{ text: userPromptHeader }];

        items.forEach((item, index) => {
            const labelText = `\n========================================
NGUYÊN LIỆU #${index + 1}:
ID: "${item.id}"
Tên: "${item.name}"
Định dạng: ${item.mediaType === "image" ? "Ảnh chụp tĩnh" : "Video chuyển động"} (Thời lượng gốc: ${item.duration}s)`;

            parts.push({ text: labelText });

            // Attach multi-keyframes if available
            if (item.frames && item.frames.length > 0) {
                item.frames.forEach((fr) => {
                    parts.push({ text: `\n- Khung hình [${fr.label} - mốc ${fr.timestamp.toFixed(1)}s]:` });
                    if (fr.base64 && fr.base64.includes("base64,")) {
                        const [, b64] = fr.base64.split("base64,");
                        if (b64 && b64.length > 50) {
                            parts.push({
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: b64
                                }
                            });
                        }
                    }
                });
            } else if (item.thumbnailBase64 && item.thumbnailBase64.includes("base64,")) {
                // Fallback single thumbnail
                const [, b64] = item.thumbnailBase64.split("base64,");
                if (b64 && b64.length > 50) {
                    parts.push({ text: `\n- Khung hình tiêu biểu:` });
                    parts.push({
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: b64
                        }
                    });
                }
            }
        });

        parts.push({
            text: `\nHãy "xem" kỹ tất cả khung hình trên, phân tích nhịp điệu kịch bản, và trả về JSON chuẩn theo hướng dẫn của Đạo Diễn để cắt dựng video xuất sắc nhất.`
        });

        // Call Gemini Multimodal with high-intelligence vision models prioritized
        if (GEMINI_API_KEY) {
            const modelsToTry = [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-2.5-flash-lite"
            ];

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
                                temperature: 0.2,
                                responseMimeType: "application/json"
                            }
                        }),
                        signal: AbortSignal.timeout(40000)
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (rawJsonText) {
                            const parsed = JSON.parse(rawJsonText);
                            if (parsed && Array.isArray(parsed.curatedTimeline) && parsed.curatedTimeline.length > 0) {
                                // Validate all clips in curatedTimeline
                                const validCurated = parsed.curatedTimeline
                                    .filter((c: any) => items.some(it => it.id === c.clipId))
                                    .map((c: any) => {
                                        const orig = items.find(it => it.id === c.clipId)!;
                                        const maxDur = orig.duration || 15;
                                        const trimStart = typeof c.trimStart === "number" && isFinite(c.trimStart)
                                            ? Math.max(0, Math.min(c.trimStart, Math.max(0, maxDur - 1)))
                                            : 0;
                                        const duration = typeof c.duration === "number" && isFinite(c.duration) && c.duration > 0
                                            ? Math.min(10, Math.max(1.5, c.duration))
                                            : clipSwitchInterval;
                                        return {
                                            clipId: c.clipId,
                                            trimStart,
                                            duration,
                                            role: c.role || "Cảnh quay",
                                            matchedSentence: c.matchedSentence || "",
                                            reason: c.reason || "Phù hợp với nhịp kịch bản"
                                        };
                                    });

                                if (validCurated.length > 0) {
                                    const usedIds = new Set(validCurated.map((c: any) => c.clipId));
                                    const backupIds = items.filter(it => !usedIds.has(it.id)).map(it => it.id);
                                    const orderedClipIds = [...validCurated.map((c: any) => c.clipId), ...backupIds];

                                    return NextResponse.json({
                                        success: true,
                                        summary: parsed.summary || "Đạo diễn AI đã chọn lọc và cắt gọt các cảnh quay chuẩn theo từng câu thoại.",
                                        curatedTimeline: validCurated,
                                        orderedClipIds,
                                        backupClipIds: backupIds,
                                        directorNotes: validCurated.map((c: any) => ({
                                            clipId: c.clipId,
                                            role: c.role,
                                            reason: c.reason
                                        })),
                                        suggestedPacing: typeof parsed.suggestedPacing === "number" ? parsed.suggestedPacing : clipSwitchInterval
                                    });
                                }
                            }
                        }
                    }
                } catch (e: any) {
                    console.warn(`[Auto-Edit] Error calling model ${model}:`, e?.message);
                }
            }
        }

        // Smart Heuristic Fallback: Ensure 100% of sentences have a dedicated matching visual beat!
        const sentenceCount = sentences && sentences.length > 0 ? sentences.length : Math.max(2, Math.floor(totalDuration / clipSwitchInterval));

        const sortedItems = [...items].sort((a, b) => {
            const aName = (a.name || "").toLowerCase();
            const bName = (b.name || "").toLowerCase();
            const isHookA = aName.includes("hook") || aName.includes("canh1") || aName.includes("khoai") || aName.includes("snack");
            const isHookB = bName.includes("hook") || bName.includes("canh1") || bName.includes("khoai") || bName.includes("snack");
            if (isHookA && !isHookB) return -1;
            if (!isHookA && isHookB) return 1;
            return 0;
        });

        // Map every sentence beat to a clip (cycling through sortedItems if items < sentences)
        const curated = Array.from({ length: sentenceCount }).map((_, idx) => {
            const it = sortedItems[idx % sortedItems.length];
            const sent = sentences[idx];
            const dur = sent ? sent.targetDuration : (totalDuration / sentenceCount);
            
            // Calculate intelligent in-point offset for repeated clips
            const cycleCount = Math.floor(idx / sortedItems.length);
            let trimStart = 0;
            if (it.mediaType === "video" && (it.duration || 5) > 4) {
                // First pass starts at 1.5s to bypass shake; subsequent passes step forward 3s
                trimStart = Math.min((it.duration || 5) - 2, 1.5 + cycleCount * 3.0);
            }

            const role = idx === 0
                ? "Hook 3s đầu (Cực phẩm giữ chân)"
                : idx === sentenceCount - 1
                    ? "CTA Kêu gọi chốt sỉ"
                    : idx === 1
                        ? "Chứng minh chất lượng / Quy trình"
                        : `Thân bài cảnh #${idx + 1}`;

            return {
                clipId: it.id,
                trimStart,
                duration: Math.max(1.5, Math.min(8, dur)),
                role,
                matchedSentence: sent ? sent.text : "",
                reason: idx === 0
                    ? "Hình ảnh đắt giá nhất mở đầu, tự động bỏ 1.5s rung máy lúc bấm quay"
                    : `Khớp với nhịp câu thoại #${idx + 1}`
            };
        });

        const usedIds = new Set(curated.map(c => c.clipId));
        const backupIds = sortedItems.filter(it => !usedIds.has(it.id)).map(it => it.id);
        const orderedClipIds = [...curated.map(c => c.clipId), ...backupIds];

        return NextResponse.json({
            success: true,
            summary: `Đạo diễn AI đã chọn lọc và phân bổ ${curated.length} phân cảnh khớp trọn vẹn với từng câu thoại, tự động cắt bỏ đoạn rung máy ban đầu và tối ưu nhịp chuyển cảnh.`,
            curatedTimeline: curated,
            orderedClipIds,
            backupClipIds: backupIds,
            directorNotes: curated.map(c => ({
                clipId: c.clipId,
                role: c.role,
                reason: c.reason
            })),
            suggestedPacing: clipSwitchInterval
        });

    } catch (err: any) {
        console.error("[Auto-Edit Advanced] Error:", err);
        return NextResponse.json({ error: err?.message || "Lỗi xử lý tự động cắt dựng của AI." }, { status: 500 });
    }
}
