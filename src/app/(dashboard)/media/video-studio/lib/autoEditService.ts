import { VideoClip } from "../types";

export interface AutoEditDirectorNote {
    clipId: string;
    role: string;
    reason: string;
}

export interface AutoEditResult {
    orderedClips: VideoClip[];
    summary: string;
    directorNotes: AutoEditDirectorNote[];
    suggestedPacing: number;
}

/**
 * Capture a lightweight JPEG base64 thumbnail from an Image or Video clip
 */
export async function captureClipThumbnail(clip: VideoClip, existingMediaEl?: HTMLVideoElement | HTMLImageElement | null): Promise<string | null> {
    try {
        const canvas = document.createElement("canvas");
        const maxDim = 480;

        // CASE 1: Image clip
        if (clip.mediaType === "image") {
            return new Promise((resolve) => {
                if (existingMediaEl && existingMediaEl instanceof HTMLImageElement && existingMediaEl.naturalWidth > 0) {
                    const nw = existingMediaEl.naturalWidth || 480;
                    const nh = existingMediaEl.naturalHeight || 480;
                    const scale = Math.min(maxDim / nw, maxDim / nh, 1);
                    canvas.width = Math.round(nw * scale);
                    canvas.height = Math.round(nh * scale);
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(existingMediaEl, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL("image/jpeg", 0.75));
                        return;
                    }
                }

                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    const nw = img.naturalWidth || 480;
                    const nh = img.naturalHeight || 480;
                    const scale = Math.min(maxDim / nw, maxDim / nh, 1);
                    canvas.width = Math.round(nw * scale);
                    canvas.height = Math.round(nh * scale);
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL("image/jpeg", 0.75));
                    } else {
                        resolve(null);
                    }
                };
                img.onerror = () => resolve(null);
                img.src = clip.url;
                setTimeout(() => resolve(null), 3000);
            });
        }

        // CASE 2: Video clip
        return new Promise((resolve) => {
            // Check if existing element is already loaded and playable
            if (existingMediaEl && existingMediaEl instanceof HTMLVideoElement && existingMediaEl.videoWidth > 0 && existingMediaEl.readyState >= 2) {
                const vw = existingMediaEl.videoWidth || 480;
                const vh = existingMediaEl.videoHeight || 480;
                const scale = Math.min(maxDim / vw, maxDim / vh, 1);
                canvas.width = Math.round(vw * scale);
                canvas.height = Math.round(vh * scale);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(existingMediaEl, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.75));
                    return;
                }
            }

            const video = document.createElement("video");
            video.crossOrigin = "anonymous";
            video.muted = true;
            video.playsInline = true;
            video.preload = "auto";

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
            }, 4000);

            video.onloadeddata = () => {
                const targetTime = Math.min(1.0, Math.max(0.2, (clip.duration || 5) * 0.15));
                video.currentTime = targetTime;
            };

            video.onseeked = () => {
                const vw = video.videoWidth || 480;
                const vh = video.videoHeight || 480;
                const scale = Math.min(maxDim / vw, maxDim / vh, 1);
                canvas.width = Math.round(vw * scale);
                canvas.height = Math.round(vh * scale);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
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

            video.src = clip.url;
        });
    } catch {
        return null;
    }
}

/**
 * Execute Full AI Smart Auto-Edit:
 * 1. Capture visual keyframes from all clips/photos
 * 2. Send to Gemini Multimodal
 * 3. Receive re-ordered timeline and director insights
 */
export async function runSmartAutoEdit({
    clips,
    script,
    hookTitle,
    clipSwitchInterval,
    totalDuration,
    existingMediaElements,
    onProgress
}: {
    clips: VideoClip[];
    script: string;
    hookTitle: string;
    clipSwitchInterval: number;
    totalDuration: number;
    existingMediaElements?: { [key: string]: any };
    onProgress?: (step: string, percent: number) => void;
}): Promise<AutoEditResult> {
    if (!clips || clips.length === 0) {
        throw new Error("Không có clip hoặc ảnh nào để cắt dựng.");
    }

    onProgress?.("Đang trích xuất khung hình thị giác từ các cảnh quay...", 15);

    // Extract keyframes concurrently with concurrency limit 4
    const itemsWithThumbnails: {
        id: string;
        name: string;
        mediaType: "video" | "image";
        duration: number;
        thumbnailBase64?: string;
    }[] = [];

    const total = clips.length;
    for (let i = 0; i < total; i++) {
        const c = clips[i];
        const existingEl = existingMediaElements ? existingMediaElements[c.id] : null;
        const thumb = await captureClipThumbnail(c, existingEl);
        itemsWithThumbnails.push({
            id: c.id,
            name: c.name,
            mediaType: c.mediaType || "video",
            duration: c.duration || clipSwitchInterval,
            thumbnailBase64: thumb || undefined
        });

        const progressPercent = Math.round(15 + ((i + 1) / total) * 45);
        onProgress?.(`Đã quét thị giác (${i + 1}/${total}): ${c.name.slice(0, 20)}...`, progressPercent);
    }

    onProgress?.("AI Đạo Diễn đang xem xét kịch bản và phân bổ cảnh quay...", 70);

    const res = await fetch("/api/ai/video-auto-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            script,
            hookTitle,
            clipSwitchInterval,
            totalDuration,
            items: itemsWithThumbnails
        })
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Không thể kết nối đến AI Đạo Diễn Cắt Dựng.");
    }

    const data = await res.json();
    onProgress?.("Hoàn tất cắt dựng và đồng bộ timeline!", 100);

    const orderedIds: string[] = data.orderedClipIds || [];
    const clipMap = new Map<string, VideoClip>(clips.map(c => [c.id, c]));

    const reorderedClips: VideoClip[] = [];
    orderedIds.forEach(id => {
        const found = clipMap.get(id);
        if (found) {
            reorderedClips.push(found);
            clipMap.delete(id);
        }
    });

    // Add any remaining clips that were not in orderedIds
    clipMap.forEach(c => reorderedClips.push(c));

    return {
        orderedClips: reorderedClips,
        summary: data.summary || "Đạo diễn AI đã tự động sắp xếp lại các cảnh quay.",
        directorNotes: data.directorNotes || [],
        suggestedPacing: data.suggestedPacing || clipSwitchInterval
    };
}
