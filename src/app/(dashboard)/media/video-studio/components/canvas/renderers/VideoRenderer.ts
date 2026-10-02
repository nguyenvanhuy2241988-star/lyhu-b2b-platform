import { VideoClip } from "../../../types";

export interface VideoRendererOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    clips: VideoClip[];
    videoElements: { [key: string]: HTMLVideoElement | null };
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
        ctx.fillText("Chưa có video quay thô", cw / 2, ch / 2 - 12);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Nhấp '+ Tải video từ máy' hoặc '+ Dùng 3 clip mẫu'", cw / 2, ch / 2 + 16);
        return;
    }

    const switchSec = Math.max(2, clipSwitchInterval || 2.5);
    const rawIdx = Math.floor(validTime / switchSec);
    const clipIdx = (isFinite(rawIdx) && clips.length > 0) ? (Math.abs(rawIdx) % clips.length) : 0;
    const currentClip = clips[clipIdx] || clips[0];
    if (!currentClip) return;
    const nextClipIdx = clips.length > 0 ? (clipIdx + 1) % clips.length : 0;
    const nextClip = clips[nextClipIdx] || currentClip;

    const timeInInterval = validTime % switchSec;
    const transitionWindow = 0.45;
    const isNearTransition = switchSec - timeInInterval <= transitionWindow && clips.length > 1;
    const transitionFactor = isNearTransition ? (switchSec - timeInInterval) / transitionWindow : 1.0;

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

    const drawVideoCover = (
        videoEl: HTMLVideoElement,
        offsetX = 0,
        alpha = 1.0,
        scaleMultiplier = 1.0
    ) => {
        if (!videoEl || videoEl.readyState < 2) return;
        const vw = videoEl.videoWidth || cw;
        const vh = videoEl.videoHeight || ch;
        const baseScale = Math.max(cw / vw, ch / vh) * scaleMultiplier;
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
            ctx.drawImage(videoEl, dx, dy, dw, dh);
        } catch {
            // Safe fallback if crossOrigin or tainted frame occurs
        }
        ctx.restore();
    };

    const zoomProgress = (validTime % switchSec) / switchSec;
    const dynamicScale = 1.0 + zoomProgress * 0.04;

    const isNextVidReady = nextVid && nextVid.readyState >= 2;
    const progress = Math.max(0, Math.min(1, 1.0 - transitionFactor));
    const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

    if (isNearTransition && clips.length > 1) {
        if (activeTrans === "crossfade") {
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            if (isNextVidReady) {
                drawVideoCover(nextVid, 0, ease, 1.0);
            }
        } else if (activeTrans === "zoom_in") {
            const curScale = dynamicScale * (1.0 + ease * 0.08);
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, curScale);
            if (isNextVidReady) {
                const nxtScale = 0.94 + ease * 0.06;
                drawVideoCover(nextVid, 0, ease, nxtScale);
            }
        } else if (activeTrans === "slide_left") {
            if (isNextVidReady) {
                const slideOffset = ease * cw;
                if (currentVid) drawVideoCover(currentVid, -slideOffset, 1.0, dynamicScale);
                drawVideoCover(nextVid, cw - slideOffset, 1.0, 1.0);
            } else {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            }
        } else if (activeTrans === "white_flash") {
            if (progress < 0.5) {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            } else {
                if (isNextVidReady) {
                    drawVideoCover(nextVid, 0, 1.0, 1.0);
                } else if (currentVid) {
                    drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                }
            }
            const flashAlpha = Math.sin(progress * Math.PI) * 0.65;
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, cw, ch);
            ctx.restore();
        } else {
            if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
        }
    } else {
        if (currentVid) {
            drawVideoCover(currentVid, 0, 1.0, dynamicScale);
        }
    }
}
