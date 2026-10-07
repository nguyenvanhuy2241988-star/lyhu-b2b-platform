import { VideoClip } from "../types";
import { SerializedClipItem } from "@/lib/videoProjectStore";

/**
 * Chuyển đổi mảng VideoClip thành SerializedClipItem (lấy Blob từ File hoặc URL blob)
 * để lưu an toàn vào IndexedDB.
 */
export async function serializeClipsForStorage(clips: VideoClip[]): Promise<SerializedClipItem[]> {
    const results: SerializedClipItem[] = [];

    for (const clip of clips) {
        let blob: Blob | undefined = undefined;

        if (clip.file instanceof Blob) {
            blob = clip.file;
        } else if (typeof clip.url === "string" && clip.url.startsWith("blob:")) {
            try {
                const res = await fetch(clip.url);
                if (res.ok) {
                    blob = await res.blob();
                }
            } catch (err) {
                console.warn(`[MediaStorage] Không thể đọc blob cho clip ${clip.id}:`, err);
            }
        }

        results.push({
            id: clip.id,
            url: typeof clip.url === "string" && !clip.url.startsWith("blob:") ? clip.url : "",
            name: clip.name || "Clip",
            duration: clip.duration || 0,
            width: clip.width,
            height: clip.height,
            muted: clip.muted,
            mediaType: clip.mediaType || "video",
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            displayDuration: clip.displayDuration,
            role: clip.role,
            matchedSentence: clip.matchedSentence,
            isAiSelected: clip.isAiSelected,
            blob
        });
    }

    return results;
}

/**
 * Phục hồi mảng VideoClip từ SerializedClipItem đã lưu trong IndexedDB,
 * tạo lại Object URL sống để sử dụng trong timeline và canvas.
 */
export function restoreClipsFromStorage(items: SerializedClipItem[]): VideoClip[] {
    if (!Array.isArray(items)) return [];

    return items.map((item) => {
        let liveUrl = item.url;
        let file: File | undefined = undefined;

        if (item.blob instanceof Blob) {
            liveUrl = URL.createObjectURL(item.blob);
            try {
                const mime = item.blob.type || (item.mediaType === "image" ? "image/jpeg" : "video/mp4");
                file = new File([item.blob], item.name || `clip_${item.id}.${item.mediaType === "image" ? "jpg" : "mp4"}`, {
                    type: mime
                });
            } catch {
                // Fallback for older browsers
            }
        }

        return {
            id: item.id,
            url: liveUrl,
            file,
            name: item.name || "Clip",
            duration: item.duration || 0,
            width: item.width || 1080,
            height: item.height || 1920,
            muted: item.muted ?? true,
            mediaType: item.mediaType || "video",
            trimStart: item.trimStart,
            trimEnd: item.trimEnd,
            displayDuration: item.displayDuration,
            role: item.role,
            matchedSentence: item.matchedSentence,
            isAiSelected: item.isAiSelected
        };
    });
}

/**
 * Chuyển đổi Audio URL (blob: hoặc URL) thành Blob để lưu trữ vào IndexedDB
 */
export async function serializeAudioUrlToBlob(audioUrl: string | null): Promise<Blob | null> {
    if (!audioUrl) return null;
    try {
        const res = await fetch(audioUrl);
        if (res.ok) {
            return await res.blob();
        }
    } catch (err) {
        console.warn("[MediaStorage] Không thể đọc audio blob:", err);
    }
    return null;
}

/**
 * Phục hồi Audio URL từ Blob
 */
export function restoreAudioUrlFromBlob(blob: Blob | null | undefined): string | null {
    if (!blob || !(blob instanceof Blob)) return null;
    return URL.createObjectURL(blob);
}
