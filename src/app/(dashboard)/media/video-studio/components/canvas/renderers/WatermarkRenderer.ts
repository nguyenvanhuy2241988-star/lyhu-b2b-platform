export interface WatermarkRendererOptions {
    ctx: CanvasRenderingContext2D;
    showWatermark: boolean;
    brandText?: string;
    brandSubtitle?: string;
    brandStyle?: "glass_dark" | "teal_brand" | "gold_luxury" | "white_clean";
    position?: "top_left" | "top_right" | "bottom_left";
    fontFamily?: string;
}

export function renderWatermark(
    ctxOrOptions: CanvasRenderingContext2D | WatermarkRendererOptions,
    maybeShowWatermark?: boolean
) {
    let ctx: CanvasRenderingContext2D;
    let showWatermark: boolean;
    let brandText = "LYHU!";
    let brandSubtitle = "• Tổng Kho Sỉ B2B";
    let brandStyle: "glass_dark" | "teal_brand" | "gold_luxury" | "white_clean" = "glass_dark";
    let position: "top_left" | "top_right" | "bottom_left" = "top_left";
    let fontFamily = "'Be Vietnam Pro', sans-serif";

    if ("ctx" in (ctxOrOptions as any)) {
        const opts = ctxOrOptions as WatermarkRendererOptions;
        ctx = opts.ctx;
        showWatermark = opts.showWatermark;
        brandText = opts.brandText || brandText;
        brandSubtitle = opts.brandSubtitle !== undefined ? opts.brandSubtitle : brandSubtitle;
        brandStyle = opts.brandStyle || brandStyle;
        position = opts.position || position;
        fontFamily = opts.fontFamily || fontFamily;
    } else {
        ctx = ctxOrOptions as CanvasRenderingContext2D;
        showWatermark = Boolean(maybeShowWatermark);
    }

    if (!showWatermark) return;

    ctx.save();

    const canvasW = ctx.canvas?.width || 1080;
    const canvasH = ctx.canvas?.height || 1920;

    // Measure text dimensions dynamically
    ctx.font = `900 13px ${fontFamily}`;
    const brandTextW = ctx.measureText(brandText).width;

    ctx.font = `600 11.5px ${fontFamily}`;
    const subTextW = brandSubtitle ? ctx.measureText(` ${brandSubtitle}`).width : 0;

    const badgeW = Math.max(140, brandTextW + subTextW + 36);
    const badgeH = 34;

    let badgeX = 18;
    let badgeY = 22;

    if (position === "top_right") {
        badgeX = canvasW - badgeW - 18;
        badgeY = 22;
    } else if (position === "bottom_left") {
        badgeX = 18;
        badgeY = canvasH - badgeH - 40;
    }

    // Styles
    let bgFill = "rgba(15, 23, 42, 0.85)";
    let strokeCol = "rgba(255, 255, 255, 0.2)";
    let brandColor = "#00AFA9";
    let subColor = "#FFFFFF";

    if (brandStyle === "teal_brand") {
        bgFill = "rgba(0, 175, 169, 0.92)";
        strokeCol = "rgba(255, 255, 255, 0.5)";
        brandColor = "#FFFFFF";
        subColor = "#FEF08A";
    } else if (brandStyle === "gold_luxury") {
        bgFill = "rgba(10, 10, 10, 0.92)";
        strokeCol = "rgba(234, 179, 8, 0.6)";
        brandColor = "#FACC15";
        subColor = "#FFFFFF";
    } else if (brandStyle === "white_clean") {
        bgFill = "rgba(255, 255, 255, 0.95)";
        strokeCol = "rgba(15, 23, 42, 0.15)";
        brandColor = "#00AFA9";
        subColor = "#0F172A";
    }

    // Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    // Draw Capsule
    ctx.fillStyle = bgFill;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Draw Brand Text
    ctx.fillStyle = brandColor;
    ctx.font = `900 13px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(brandText, badgeX + 16, badgeY + badgeH / 2 + 0.5);

    // Draw Subtitle Text
    if (brandSubtitle) {
        ctx.fillStyle = subColor;
        ctx.font = `600 11.5px ${fontFamily}`;
        ctx.fillText(brandSubtitle.startsWith("•") || brandSubtitle.startsWith("-") ? ` ${brandSubtitle}` : ` • ${brandSubtitle}`, badgeX + 16 + brandTextW, badgeY + badgeH / 2 + 0.5);
    }

    ctx.restore();
}
