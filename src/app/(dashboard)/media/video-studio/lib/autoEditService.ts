import { VideoClip, SubtitleCue } from "../types";

export interface InputKeyframe {
    label: string;
    timestamp: number;
    base64: string;
}

export interface CuratedClipItem {
    clipId: string;
    trimStart: number;
    duration: number;
    role: string;
    matchedSentence: string;
    reason: string;
}

export interface AutoEditDirectorNote {
    clipId: string;
    role: string;
    reason: string;
}

export interface AutoEditResult {
    curatedClips: VideoClip[];
    backupClips: VideoClip[];
    orderedClips: VideoClip[]; // All clips with curated first, then backup
    summary: string;
    directorNotes: AutoEditDirectorNote[];
    suggestedPacing: number;
}

/**
 * Capture a lightweight base64 frame from an image or video at a given timestamp
 */
async function captureVideoFrameAtTime(
    videoUrl: string,
    targetTime: number
): Promise<string | null> {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        const canvas = document.createElement("canvas");
        const maxDim = 400;

        let timer: any = null;
        const cleanup = () => {
            if (timer) clearTimeout(timer);
            video.pause();
            video.removeAttribute("src");
            video.load();
        };

        timer = setTimeout(() => {
            cleanup();
            resolve(null);
        }, 3500);

        video.onloadedmetadata = () => {
            const safeTime = Math.min(Math.max(0.1, targetTime), Math.max(0.1, (video.duration || 5) - 0.2));
            video.currentTime = safeTime;
        };

        video.onseeked = () => {
            const vw = video.videoWidth || 360;
            const vh = video.videoHeight || 640;
            const scale = Math.min(maxDim / vw, maxDim / vh, 1);
            canvas.width = Math.round(vw * scale);
            canvas.height = Math.round(vh * scale);
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                cleanup();
                resolve(dataUrl);
            } else {
                cleanup();
                resolve(null);
            }
        };

        video.onerror = () => {
            cleanup();
            resolve(null);
        };

        video.src = videoUrl;
    });
}

/**
 * Capture multi-keyframes for a single clip
 */
export async function captureMultiKeyframesForClip(
    clip: VideoClip,
    existingMediaEl?: HTMLVideoElement | HTMLImageElement | null,
    isLargeBatch = false
): Promise<InputKeyframe[]> {
    const frames: InputKeyframe[] = [];
    const maxDim = isLargeBatch ? 320 : 400;

    // CASE 1: Image clip -> 1 frame
    if (clip.mediaType === "image") {
        const canvas = document.createElement("canvas");
        const img = new Image();
        img.crossOrigin = "anonymous";

        const b64: string | null = await new Promise((resolve) => {
            if (existingMediaEl && existingMediaEl instanceof HTMLImageElement && existingMediaEl.naturalWidth > 0) {
                const nw = existingMediaEl.naturalWidth || 360;
                const nh = existingMediaEl.naturalHeight || 360;
                const scale = Math.min(maxDim / nw, maxDim / nh, 1);
                canvas.width = Math.round(nw * scale);
                canvas.height = Math.round(nh * scale);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(existingMediaEl, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                    return;
                }
            }

            img.onload = () => {
                const nw = img.naturalWidth || 360;
                const nh = img.naturalHeight || 360;
                const scale = Math.min(maxDim / nw, maxDim / nh, 1);
                canvas.width = Math.round(nw * scale);
                canvas.height = Math.round(nh * scale);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                } else {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = clip.url;
            setTimeout(() => resolve(null), 3000);
        });

        if (b64) {
            frames.push({
                label: "Ảnh chụp tĩnh",
                timestamp: 0,
                base64: b64
            });
        }
        return frames;
    }

    // CASE 2: Video clip -> Adaptive sampling (1 frame for large batch >8 clips, 3 frames for small projects)
    const dur = Math.max(2, clip.duration || 8);
    const samplePoints = isLargeBatch
        ? [{ label: "Hành động chính", time: dur * 0.45 }]
        : [
            { label: "Đầu clip", time: Math.min(1.2, dur * 0.15) },
            { label: "Giữa clip (Hành động)", time: dur * 0.5 },
            { label: "Cuối clip", time: Math.max(1.5, dur * 0.85) }
        ];

    for (const pt of samplePoints) {
        try {
            const b64 = await captureVideoFrameAtTime(clip.url, pt.time);
            if (b64) {
                frames.push({
                    label: pt.label,
                    timestamp: pt.time,
                    base64: b64
                });
            }
        } catch {
            // Ignore single frame error
        }
    }

    return frames;
}

/**
 * Splits script text or subtitle cues into clean sentence beats with allocated durations
 */
export function buildSentenceBeats(
    script: string,
    totalDuration: number,
    subtitleCues?: SubtitleCue[]
): { index: number; text: string; targetDuration: number }[] {
    // If cues are already timed
    if (subtitleCues && subtitleCues.length > 0) {
        return subtitleCues.map((cue, idx) => ({
            index: idx,
            text: cue.text.trim(),
            targetDuration: Math.max(1.5, cue.end - cue.start)
        }));
    }

    // Split text by punctuation marks: . ! ? ; \n
    const rawSentences = (script || "")
        .split(/(?<=[.!?;\n])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 5);

    if (rawSentences.length === 0) {
        return [{
            index: 0,
            text: (script || "Video tổng kho sỉ LYHU").trim(),
            targetDuration: totalDuration || 25
        }];
    }

    const totalChars = rawSentences.reduce((sum, s) => sum + s.length, 0);
    const validTotalDur = Math.max(10, totalDuration || 25);

    return rawSentences.map((sentence, idx) => {
        const ratio = sentence.length / (totalChars || 1);
        const allocated = Math.max(2.0, Math.min(6.5, ratio * validTotalDur));
        return {
            index: idx,
            text: sentence,
            targetDuration: Math.round(allocated * 10) / 10
        };
    });
}

/**
 * Execute Full Cinematic Smart Auto-Edit
 */
export async function runSmartAutoEdit({
    clips,
    script,
    hookTitle,
    clipSwitchInterval,
    totalDuration,
    subtitleCues,
    existingMediaElements,
    onProgress
}: {
    clips: VideoClip[];
    script: string;
    hookTitle: string;
    clipSwitchInterval: number;
    totalDuration: number;
    subtitleCues?: SubtitleCue[];
    existingMediaElements?: { [key: string]: any };
    onProgress?: (step: string, percent: number) => void;
}): Promise<AutoEditResult> {
    if (!clips || clips.length === 0) {
        throw new Error("Không có clip hoặc ảnh nào để cắt dựng.");
    }

    onProgress?.("Đang quét phân tích đa khung hình (Multi-Keyframe Vision)...", 10);

    const sentenceBeats = buildSentenceBeats(script, totalDuration, subtitleCues);

    // Extract keyframes with adaptive batch concurrency
    const itemsWithFrames: {
        id: string;
        name: string;
        mediaType: "video" | "image";
        duration: number;
        frames: InputKeyframe[];
    }[] = [];

    const total = clips.length;
    const isLargeBatch = total > 8;
    const batchSize = isLargeBatch ? 3 : 2;

    for (let i = 0; i < total; i += batchSize) {
        const batch = clips.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (c) => {
                const existingEl = existingMediaElements ? existingMediaElements[c.id] : null;
                const frames = await captureMultiKeyframesForClip(c, existingEl, isLargeBatch);
                return {
                    id: c.id,
                    name: c.name,
                    mediaType: (c.mediaType || "video") as "video" | "image",
                    duration: c.duration || 10,
                    frames
                };
            })
        );
        itemsWithFrames.push(...batchResults);

        const processed = Math.min(total, i + batch.length);
        const progressPercent = Math.round(10 + (processed / total) * 50);
        onProgress?.(`Đã quét thị giác (${processed}/${total}): ${batch[0].name.slice(0, 22)}...`, progressPercent);
    }

    onProgress?.("Đạo diễn AI đang đối chiếu kịch bản, tìm khoảnh khắc vàng (Trim) & lọc cảnh tinh hoa...", 65);

    const res = await fetch("/api/ai/video-auto-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            script,
            hookTitle,
            clipSwitchInterval,
            totalDuration,
            sentences: sentenceBeats,
            items: itemsWithFrames
        })
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Không thể kết nối đến AI Đạo Diễn Cắt Dựng.");
    }

    const data = await res.json();
    onProgress?.("Hoàn tất cắt gọt In-point và đồng bộ timeline!", 100);

    const curatedTimeline: CuratedClipItem[] = data.curatedTimeline || [];
    const originalClipMap = new Map<string, VideoClip>(clips.map(c => [c.id, { ...c }]));

    const curatedClips: VideoClip[] = [];
    const usedOriginalIds = new Set<string>();

    curatedTimeline.forEach((item, idx) => {
        const base = originalClipMap.get(item.clipId);
        if (base) {
            const isDuplicate = usedOriginalIds.has(item.clipId);
            // Give duplicate cuts a distinct ID so each has its own independent timeline node
            const uniqueId = isDuplicate ? `${base.id}_cut${idx + 1}` : base.id;
            curatedClips.push({
                ...base,
                id: uniqueId,
                trimStart: item.trimStart || 0,
                displayDuration: item.duration || clipSwitchInterval,
                role: item.role,
                matchedSentence: item.matchedSentence,
                isAiSelected: true
            });
            usedOriginalIds.add(item.clipId);
        }
    });

    // Backup clips (surplus raw clips not used in curated timeline)
    const backupClips: VideoClip[] = [];
    clips.forEach(c => {
        if (!usedOriginalIds.has(c.id)) {
            backupClips.push({
                ...c,
                isAiSelected: false
            });
        }
    });

    const orderedClips = [...curatedClips, ...backupClips];

    return {
        curatedClips,
        backupClips,
        orderedClips,
        summary: data.summary || "Đạo diễn AI đã hoàn thành cắt dựng.",
        directorNotes: data.directorNotes || [],
        suggestedPacing: data.suggestedPacing || clipSwitchInterval
    };
}
