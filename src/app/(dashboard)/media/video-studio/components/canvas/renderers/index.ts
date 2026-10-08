import { renderVideoFrame, VideoRendererOptions } from "./VideoRenderer";
import { renderHookBanner, HookBannerOptions } from "./HookBannerRenderer";
import { renderWatermark, WatermarkRendererOptions } from "./WatermarkRenderer";
import { renderSalesSticker, StickerRendererOptions } from "./StickerRenderer";
import { renderSubtitles, SubtitleRendererOptions } from "./SubtitleRenderer";

export interface FullCanvasRenderOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    time: number;
    videoOptions: Omit<VideoRendererOptions, "canvas" | "ctx" | "validTime">;
    hookOptions: Omit<HookBannerOptions, "canvas" | "ctx" | "time">;
    showWatermark: boolean;
    watermarkOptions?: Omit<WatermarkRendererOptions, "ctx" | "showWatermark">;
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

    // If there are no clips, do not overlay subtitles, hooks, watermark or stickers
    if (!options.videoOptions.clips || options.videoOptions.clips.length === 0) {
        return;
    }

    // 2. Draw viral Hook banner (first 3.5s)
    renderHookBanner({
        canvas,
        ctx,
        time: validTime,
        ...options.hookOptions
    });

    // 3. Draw Watermark badge
    renderWatermark({
        ctx,
        showWatermark: options.showWatermark,
        ...options.watermarkOptions
    });

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
