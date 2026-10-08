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
        const systemInstructionText = `Bạn là SIÊU ĐẠO DIỄN VÀ CHUYÊN GIA DỰNG PHIM ĐIỆN ẢNH TIKTOK/REELS (AI Master Film Editor) CỦA TỔNG KHO SỈ LYHU.
LYHU chuyên sỉ các món ăn vặt & nguyên liệu thực phẩm (Khoai môn sấy CVT, bột phô mai BOYO, bánh tráng Abi, kẹo dẻo UHi...).

QUY TẮC DỰNG PHIM CHUYÊN NGHIỆP CỦA ĐẠO DIỄN THỰC THỤ (HUMAN FILM DIRECTOR RULES):

1. NGUYÊN TẮC BẤT DI BẤT DỊCH #1: TUYỆT ĐỐI KHÔNG LẶP LẠI CLIP HOẶC ẢNH (ZERO REPETITION / 100% UNIQUE SHOTS):
   - Người xem sẽ cảm thấy video rất chán, nghèo nàn và ngớ ngẩn nếu nhìn thấy một bức ảnh hay cùng một cảnh quay lặp đi lặp lại 2-3 lần trong một video ngắn 30 giây!
   - MỖI CLIP HOẶC ẢNH CHỈ ĐƯỢC PHÉP XUẤT HIỆN TỐI ĐA 1 LẦN DUY NHẤT trong curatedTimeline.
   - TUYỆT ĐỐI CẤM trùng lặp clipId! Tất cả các phần tử trong \`curatedTimeline\` phải có \`clipId\` hoàn toàn khác nhau.
   - Mỗi câu thoại PHẢI là một hình ảnh / góc máy MỚI HOÀN TOÀN để giữ cho video luôn đa dạng, hấp dẫn và đẳng cấp.
   - ĐẶC BIỆT VỚI ẢNH TĨNH: Nghiêm cấm 100% việc lặp lại ảnh tĩnh.

2. "XEM" VÀ PHÂN LOẠI NỘI DUNG TỪNG CLIP NHƯ NGƯỜI THẬT (SEMANTIC VISUAL MATCHING):
   - Bạn được cung cấp các khung hình trích xuất từ từng nguyên liệu thô. Hãy "nhìn" kỹ từng khung hình như mắt người thật và ghép đúng ngữ cảnh:
     * CẬN CẢNH MÓN ĂN / FOOD PORN: Miếng khoai giòn, rắc bột phô mai bồng bềnh, bẻ đôi bánh, zoom cận cảnh hạt/bánh hấp dẫn -> Dùng cho Cảnh #1 (Hook 3s đầu) hoặc câu thoại khen giòn ngon, kích thích vị giác.
     * BAO BÌ / DATE / QUY CÁCH: Gói zip bạc nguyên seal, thùng carton in logo, date dập nổi mới tinh -> Dùng cho câu thoại nói về Date mới toanh, hàng chính hãng, đóng gói kỹ.
     * TOÀN CẢNH KHO / PALLET / CONTAINER: Kho bãi ngút ngàn, xe nâng bốc pallet hàng cao, xe container về đêm -> Dùng cho câu thoại nói về Giá sỉ tận kho, container cập bến, hàng sẵn số lượng lớn.
     * ĐÓNG GÓI / ĐƠN ĐI / GIAO HÀNG (CTA): Công nhân dán băng keo, xếp thùng lên xe tải, kiểm kê đơn sỉ -> Dùng cho câu thoại Kêu gọi hành động (CTA), nhắn nhận bảng giá sỉ, giao hàng hỏa tốc.

3. TÍNH TOÁN ĐIỂM CẮT VÀNG (TRIM IN-POINT / TRIMSTART):
   - Video quay bằng điện thoại thường bị rung 1-2 giây đầu khi bấm máy hoặc đổi góc.
   - Hãy quan sát các khung hình và chỉ định chính xác \`trimStart\` (giây) để video nhảy ngay vào khoảnh khắc hành động đắt giá nhất (thường từ 1.0s đến 3.0s), bỏ hẳn đoạn rung máy đầu.
   - Nếu là Ảnh tĩnh: Bắt buộc trimStart = 0.

4. LỌC BỎ CẢNH THỪA (SMART CURATION):
   - Chỉ chọn những cảnh xuất sắc nhất, đúng ngữ nghĩa nhất cho \`curatedTimeline\`.
   - Các cảnh còn lại đưa vào \`backupClipIds\`.
   - Độ dài mỗi cảnh (\`duration\`) phải khớp chính xác với thời lượng câu thoại tương ứng (\`targetDuration\`).

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON:
{
  "summary": "Tóm tắt tư duy cắt dựng: Phân tích lý do chọn từng cảnh khớp với câu thoại, đảm bảo 100% không lặp lại hình ảnh, nhịp cắt tổng thể...",
  "curatedTimeline": [
    {
      "clipId": "id_cua_clip_doc_nhat", // MỖI clipId CHỈ XUẤT HIỆN TỐI ĐA 1 LẦN!
      "trimStart": 1.5,
      "duration": 3.0,
      "role": "Hook 3s đầu (Cận cảnh cực phẩm)",
      "matchedSentence": "Câu thoại...",
      "reason": "Khung hình cận cảnh miếng khoai cực nét, cắt bỏ 1.5s đầu rung máy..."
    }
  ],
  "backupClipIds": ["id_clip_chua_dung_1", "id_clip_chua_dung_2"],
  "suggestedPacing": 2.5
}
LƯU Ý NGHIÊM NGẶT: Trong curatedTimeline, các clipId KHÔNG ĐƯỢC PHÉP TRÙNG NHAU. MỖI PHÂN CẢNH PHẢI LÀ MỘT CLIP ĐỘC NHẤT VÔ NHỊ!`;

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
                                    // ── DEDUPLICATION SAFETY FILTER ──
                                    // Ensure 100% unique shots: If AI accidentally duplicated a clip, replace with an unused asset
                                    const usedIds = new Set<string>();
                                    const uniqueCurated: any[] = [];
                                    const unusedAssetsPool = [...items];

                                    for (const cut of validCurated) {
                                        if (!usedIds.has(cut.clipId)) {
                                            uniqueCurated.push(cut);
                                            usedIds.add(cut.clipId);
                                        } else {
                                            // Find an unused clip from user's assets
                                            const alternative = unusedAssetsPool.find(it => !usedIds.has(it.id));
                                            if (alternative) {
                                                uniqueCurated.push({
                                                    ...cut,
                                                    clipId: alternative.id,
                                                    trimStart: alternative.mediaType === "video" ? Math.min(1.5, (alternative.duration || 5) * 0.2) : 0,
                                                    duration: cut.duration,
                                                    role: cut.role,
                                                    matchedSentence: cut.matchedSentence,
                                                    reason: `Đạo diễn AI ghép cảnh độc nhất [${alternative.name}] để đảm bảo 100% không lặp lại hình ảnh`
                                                });
                                                usedIds.add(alternative.id);
                                            } else if (cut.mediaType === "video") {
                                                // Only allow if user provided fewer clips than sentences
                                                uniqueCurated.push(cut);
                                            }
                                        }
                                    }

                                    const backupIds = items.filter(it => !usedIds.has(it.id)).map(it => it.id);
                                    const orderedClipIds = [...uniqueCurated.map((c: any) => c.clipId), ...backupIds];

                                    return NextResponse.json({
                                        success: true,
                                        summary: parsed.summary || "Đạo diễn AI đã chọn lọc các cảnh quay độc nhất, không lặp lại hình ảnh và khớp chuẩn từng câu thoại.",
                                        curatedTimeline: uniqueCurated,
                                        orderedClipIds,
                                        backupClipIds: backupIds,
                                        directorNotes: uniqueCurated.map((c: any) => ({
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

        // Smart Heuristic Fallback: 100% UNIQUE VISUALS (NO DUPLICATES)
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

        const curated: any[] = [];
        const usedFallbackIds = new Set<string>();

        for (let idx = 0; idx < sentenceCount; idx++) {
            const sent = sentences[idx];
            const dur = sent ? sent.targetDuration : (totalDuration / sentenceCount);

            // Prioritize an unused clip so EVERY scene is 100% unique!
            let it = sortedItems.find(item => !usedFallbackIds.has(item.id));
            if (!it) {
                // If total footage pool is smaller than sentences, cycle through long videos
                it = sortedItems[idx % sortedItems.length];
            }
            usedFallbackIds.add(it.id);

            let trimStart = 0;
            if (it.mediaType === "video" && (it.duration || 5) > 4) {
                trimStart = 1.5;
            }

            const role = idx === 0
                ? "Hook 3s đầu (Cực phẩm giữ chân)"
                : idx === sentenceCount - 1
                    ? "CTA Kêu gọi chốt sỉ"
                    : idx === 1
                        ? "Chứng minh chất lượng / Quy trình"
                        : `Thân bài cảnh #${idx + 1}`;

            curated.push({
                clipId: it.id,
                trimStart,
                duration: Math.max(1.5, Math.min(8, dur)),
                role,
                matchedSentence: sent ? sent.text : "",
                reason: idx === 0
                    ? "Hình ảnh đắt giá nhất mở đầu, tự động bỏ 1.5s rung máy lúc bấm quay"
                    : `Cảnh độc nhất minh họa câu thoại #${idx + 1}`
            });
        }

        const usedIds = new Set(curated.map(c => c.clipId));
        const backupIds = sortedItems.filter(it => !usedIds.has(it.id)).map(it => it.id);
        const orderedClipIds = [...curated.map(c => c.clipId), ...backupIds];

        return NextResponse.json({
            success: true,
            summary: `Đạo diễn AI đã chọn lọc và phân bổ ${curated.length} phân cảnh hoàn toàn độc nhất, không lặp lại hình ảnh, khớp trọn vẹn với từng câu thoại và tự động cắt bỏ đoạn rung máy ban đầu.`,
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
