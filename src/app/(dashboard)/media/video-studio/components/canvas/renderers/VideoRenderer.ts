import { VideoClip } from "../../../types";
import { getActiveClipAtTime } from "../../../lib/clipTimingHelper";

export interface VideoRendererOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    clips: VideoClip[];
    videoElements: { [key: string]: HTMLVideoElement | HTMLImageElement | null };
    validTime: number;
    clipSwitchInterval: number;
    transitionEffect: "auto" | "crossfade" | "zoom_in" | "slide_left" | "white_flash" | "hard_cut";
    videoFilterPreset: string;
    videoFilters: { id: string; filter: string }[];
}

export function renderVideoFrame({
    canvas,
    ctx,
    clips,
    videoElements,
    validTime,
    clipSwitchInterval,
    transitionEffect,
    videoFilterPreset,
    videoFilters
}: VideoRendererOptions) {
    const cw = canvas.width;
    const ch = canvas.height;

    // Clear background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, cw, ch);

    if (clips.length === 0) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 20px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Chưa có video hoặc ảnh minh họa", cw / 2, ch / 2 - 12);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Nhấp '+ Tải video / ảnh từ máy' hoặc '+ Dùng 3 clip mẫu'", cw / 2, ch / 2 + 16);
        return;
    }

    const activeInfo = getActiveClipAtTime(clips, validTime, clipSwitchInterval);
    if (!activeInfo) return;
    const { activeClip: currentClip, clipIdx, clipDuration, progressInClip } = activeInfo;
    const nextClipIdx = clips.length > 0 ? (clipIdx + 1) % clips.length : 0;
    const nextClip = clips[nextClipIdx] || currentClip;

    const remainingInClip = clipDuration * (1 - progressInClip);
    const transitionWindow = 0.45;
    const isNearTransition = remainingInClip <= transitionWindow && clips.length > 1;
    const transitionFactor = isNearTransition ? remainingInClip / transitionWindow : 1.0;

    const currentVid = currentClip?.id ? videoElements[currentClip.id] : null;
    const nextVid = nextClip?.id ? videoElements[nextClip.id] : null;

    let activeTrans = transitionEffect;
    if (activeTrans === "auto") {
        const transPool: ("crossfade" | "zoom_in" | "slide_left" | "white_flash")[] = [
            "crossfade",
            "zoom_in",
            "slide_left",
            "crossfade"
        ];
        activeTrans = transPool[clipIdx % transPool.length];
    }

    const zoomProgress = progressInClip;

    const isElementReady = (el: HTMLVideoElement | HTMLImageElement | null): boolean => {
        if (!el) return false;
        if ((el instanceof HTMLImageElement) || (el as any).tagName === "IMG") {
            return (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0;
        }
        return (el as HTMLVideoElement).readyState >= 2;
    };

    const drawVideoCover = (
        mediaEl: HTMLVideoElement | HTMLImageElement,
        offsetX = 0,
        alpha = 1.0,
        scaleMultiplier = 1.0
    ) => {
        if (!mediaEl || !isElementReady(mediaEl)) return;

        const isImg = (mediaEl instanceof HTMLImageElement) || (mediaEl as any).tagName === "IMG";
        const vw = isImg ? (mediaEl as HTMLImageElement).naturalWidth : ((mediaEl as HTMLVideoElement).videoWidth || cw);
        const vh = isImg ? (mediaEl as HTMLImageElement).naturalHeight : ((mediaEl as HTMLVideoElement).videoHeight || ch);
        
        // Ken Burns effect for static photos: slow cinematic push (1.0 -> 1.05)
        const photoKenBurns = isImg ? (1.0 + zoomProgress * 0.05) : 1.0;
        const finalScale = scaleMultiplier * photoKenBurns;

        const baseScale = Math.max(cw / vw, ch / vh) * finalScale;
        const dw = vw * baseScale;
        const dh = vh * baseScale;
        const dx = (cw - dw) / 2 + offsetX;
        const dy = (ch - dh) / 2;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        if (videoFilterPreset !== "none") {
            const foundFilter = videoFilters.find(f => f.id === videoFilterPreset);
            if (foundFilter && foundFilter.filter !== "none") {
                ctx.filter = foundFilter.filter;
            }
        }
        try {
            ctx.drawImage(mediaEl, dx, dy, dw, dh);
        } catch {
            // Safe fallback if crossOrigin or tainted frame occurs
        }
        ctx.restore();
    };

    const dynamicScale = 1.0 + zoomProgress * 0.04;
    const isNextReady = isElementReady(nextVid);
    const progress = Math.max(0, Math.min(1, 1.0 - transitionFactor));
    const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

    if (isNearTransition && clips.length > 1) {
        if (activeTrans === "crossfade") {
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            if (isNextReady && nextVid) {
                drawVideoCover(nextVid, 0, ease, 1.0);
            }
        } else if (activeTrans === "zoom_in") {
            const curScale = dynamicScale * (1.0 + ease * 0.08);
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, curScale);
            if (isNextReady && nextVid) {
                const nxtScale = 0.94 + ease * 0.06;
                drawVideoCover(nextVid, 0, ease, nxtScale);
            }
        } else if (activeTrans === "slide_left") {
            if (isNextReady && nextVid) {
                const offsetNext = cw * (1.0 - ease);
                const offsetCur = -cw * ease;
                if (currentVid) drawVideoCover(currentVid, offsetCur, 1.0, dynamicScale);
                drawVideoCover(nextVid, offsetNext, 1.0, 1.0);
            } else {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            }
        } else if (activeTrans === "white_flash") {
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            if (progress > 0.5 && isNextReady && nextVid) {
                drawVideoCover(nextVid, 0, 1.0, 1.0);
            }
            const flashAlpha = Math.sin(progress * Math.PI) * 0.85;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, cw, ch);
        } else {
            // hard_cut
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
        }
    } else {
        if (currentVid) {
            drawVideoCover(currentVid, 0, 1.0, dynamicScale);
        }
    }
}
