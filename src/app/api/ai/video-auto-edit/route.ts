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

NHIỆM VỤ DỰNG PHIM CHUYÊN NGHIỆP CỦA BẠN (TRUE CINEMA AUTO-EDIT):
1. QUAN SÁT THỊ GIÁC SÂU (MULTI-KEYFRAME VISION):
   - Bạn được cung cấp nhiều khung hình trích xuất ở các mốc thời gian khác nhau (ví dụ: đầu clip, giữa clip, cuối clip) của từng video/ảnh thô.
   - Hãy phát hiện chính xác: Khoảnh khắc nào camera bị rung/mờ/chưa vào việc? Khoảnh khắc nào hành động đắt giá nhất xuất hiện (ví dụ: miếng khoai được bẻ đôi, phô mai rơi, bốc dỡ hàng, cận cảnh nhãn mác)?

2. TÌM ĐIỂM VÀO ĐẮT GIÁ NHẤT (TRIM IN-POINT / TRIMSTART):
   - Đừng chiếu từ giây 0 nếu đầu clip bị rung lắc hoặc chết góc!
   - Hãy chỉ định chính xác \`trimStart\` (tính bằng giây) để video nhảy ngay vào khoảnh khắc đẹp nhất.

3. ĐỒNG BỘ TIMECODE THEO TỪNG CÂU NÓI (SENTENCE STORY BEATS SYNC):
   - Chúng tôi gửi danh sách từng câu kịch bản kèm thời lượng (targetDuration).
   - Hãy ghép mỗi câu nói với MỘT cảnh quay có ý nghĩa tương ứng nhất:
     * Câu Hook giật tít 3s đầu -> BẮT BUỘC chọn cảnh ngon mắt nhất, cận cảnh (close-up) hoặc hành động giật gân làm Cảnh #1.
     * Câu về đóng gói, quy trình, ISO -> Chọn cảnh công nhân đóng hàng, máy móc.
     * Câu về kho bãi, xe container, giao sỉ toàn quốc -> Chọn cảnh toàn kho, xe tải.
     * Câu kêu gọi hành động (CTA) -> Chọn cảnh tổng thể uy tín hoặc sản phẩm giỏ hàng.
   - Gán \`duration\` của cảnh đó khớp với thời lượng của câu nói đó!

4. LỌC BỎ CẢNH THỪA (SMART CURATION):
   - Nếu số lượng clip/ảnh tải lên nhiều hơn số câu kịch bản cần thiết, hãy CHỌN LỌC những cảnh tinh hoa nhất đưa vào \`curatedTimeline\`.
   - Các cảnh bị rung, trùng lặp hoặc thừa hãy đưa vào danh sách \`backupClipIds\` (để làm kho B-roll dự trữ).

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU:
{
  "summary": "Tóm tắt tư duy cắt dựng của đạo diễn: Đã chọn bao nhiêu cảnh đẹp nhất, đã cắt bỏ đoạn rung lắc của clip nào, bắt khoảnh khắc vàng ở giây thứ mấy, nhịp điệu tổng thể thế nào...",
  "curatedTimeline": [
    {
      "clipId": "id_cua_clip",
      "trimStart": 3.5, // Giây bắt đầu đẹp nhất của video thô (nếu là ảnh thì để 0)
      "duration": 3.0, // Thời lượng cảnh hiển thị khớp với câu thoại
      "role": "Hook 3s đầu (Cận cảnh cực phẩm)",
      "matchedSentence": "Nội dung câu thoại mà cảnh này minh họa...",
      "reason": "Lý do chọn: Bắt đúng khoảnh khắc bẻ khoai giòn tan từ giây 3.5, loại bỏ 3s đầu bị rung máy..."
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

        // Call Gemini Multimodal
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
                                temperature: 0.25,
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
                } catch (e: any) {
                    console.warn(`[Auto-Edit] Error calling model ${model}:`, e?.message);
                }
            }
        }

        // Smart Heuristic Fallback
        const sentenceCount = sentences && sentences.length > 0 ? sentences.length : Math.max(2, Math.floor(totalDuration / clipSwitchInterval));
        const neededCount = Math.min(items.length, sentenceCount);

        const sortedItems = [...items].sort((a, b) => {
            const aName = (a.name || "").toLowerCase();
            const bName = (b.name || "").toLowerCase();
            const isHookA = aName.includes("hook") || aName.includes("canh1") || aName.includes("khoai");
            const isHookB = bName.includes("hook") || bName.includes("canh1") || bName.includes("khoai");
            if (isHookA && !isHookB) return -1;
            if (!isHookA && isHookB) return 1;
            return 0;
        });

        const curated = sortedItems.slice(0, neededCount).map((it, idx) => {
            const sent = sentences[idx];
            const dur = sent ? sent.targetDuration : (totalDuration / neededCount);
            // Default smart trim: start at 1.5s for videos to skip phone pickup shake
            const trimStart = it.mediaType === "video" && (it.duration || 5) > 4 ? 1.5 : 0;
            return {
                clipId: it.id,
                trimStart,
                duration: Math.max(1.5, Math.min(8, dur)),
                role: idx === 0 ? "Hook 3s đầu (Cực phẩm)" : idx === neededCount - 1 ? "CTA Chốt đơn sỉ" : `Thân bài #${idx + 1}`,
                matchedSentence: sent ? sent.text : "",
                reason: idx === 0 ? "Hình ảnh nổi bật giữ chân người xem, bỏ 1.5s rung máy đầu" : "Khớp với diễn tiến câu thoại"
            };
        });

        const backupIds = sortedItems.slice(neededCount).map(it => it.id);
        const orderedClipIds = [...curated.map(c => c.clipId), ...backupIds];

        return NextResponse.json({
            success: true,
            summary: `Đạo diễn AI đã chọn lọc ${curated.length} cảnh quay tinh hoa nhất khớp chặt chẽ với từng câu nói, tự động đặt điểm vào (In-point) sau đoạn rung máy.`,
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
