import { renderVideoFrame, VideoRendererOptions } from "./VideoRenderer";
import { renderHookBanner, HookBannerOptions } from "./HookBannerRenderer";
import { renderWatermark } from "./WatermarkRenderer";
import { renderSalesSticker, StickerRendererOptions } from "./StickerRenderer";
import { renderSubtitles, SubtitleRendererOptions } from "./SubtitleRenderer";

export interface FullCanvasRenderOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    time: number;
    videoOptions: Omit<VideoRendererOptions, "canvas" | "ctx" | "validTime">;
    hookOptions: Omit<HookBannerOptions, "canvas" | "ctx" | "time">;
    showWatermark: boolean;
    stickerOptions: Omit<StickerRendererOptions, "canvas" | "ctx" | "validTime">;
    subtitleOptions: Omit<SubtitleRendererOptions, "canvas" | "ctx" | "time">;
}

export function drawFullStudioCanvas(options: FullCanvasRenderOptions) {
    const { canvas, ctx, time } = options;
    const validTime = (typeof time === "number" && isFinite(time) && time >= 0) ? time : 0;

    // 1. Draw video background & transitions
    renderVideoFrame({
        canvas,
        ctx,
        validTime,
        ...options.videoOptions
    });

    // 2. Draw viral Hook banner (first 3.5s)
    renderHookBanner({
        canvas,
        ctx,
        time: validTime,
        ...options.hookOptions
    });

    // 3. Draw Watermark badge
    renderWatermark(ctx, options.showWatermark);

    // 4. Draw Sales Sticker
    renderSalesSticker({
        canvas,
        ctx,
        validTime,
        ...options.stickerOptions
    });

    // 5. Draw Animated Subtitles
    renderSubtitles({
        canvas,
        ctx,
        time: validTime,
        ...options.subtitleOptions
    });
}
