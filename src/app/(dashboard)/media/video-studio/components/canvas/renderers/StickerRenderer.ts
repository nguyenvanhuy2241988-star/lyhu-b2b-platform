import { STICKER_CONFIGS } from "../../../lib/constants";

export interface StickerRendererOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    validTime: number;
    activeSalesSticker: string;
    stickerPosition: "top_right" | "top_left" | "bottom_right";
}

export function renderSalesSticker({
    canvas,
    ctx,
    validTime,
    activeSalesSticker,
    stickerPosition
}: StickerRendererOptions) {
    if (!activeSalesSticker || activeSalesSticker === "none") return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.save();

    // Subtle gentle breath animation (1.0 to 1.02)
    const pulse = 1.0 + Math.sin(validTime * 3.0) * 0.02;
    const cfg = STICKER_CONFIGS[activeSalesSticker] || STICKER_CONFIGS["freeship"];

    // Sleek, compact creator pill
    const badgeW = Math.min(cw * 0.44, 205);
    const badgeH = 38;

    let stickerX = cw - badgeW / 2 - 14;
    let stickerY = 44;
    if (stickerPosition === "top_left") {
        stickerX = badgeW / 2 + 14;
        stickerY = 44;
    } else if (stickerPosition === "bottom_right") {
        stickerX = cw - badgeW / 2 - 14;
        stickerY = ch - 148;
    }

    ctx.translate(stickerX, stickerY);
    ctx.scale(pulse, pulse);

    // Soft drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;

    // Flat sleek pill background
    ctx.fillStyle = cfg.bgGrad ? cfg.bgGrad[0] : "#00AFA9";
    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 19);
    ctx.fill();

    // Clean subtle border
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon Circle
    const iconR = 13;
    const iconCx = -badgeW / 2 + 20;
    ctx.beginPath();
    ctx.arc(iconCx, 0, iconR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fill();

    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.icon, iconCx, 1);

    // Text Lines
    const textStartX = -badgeW / 2 + 39;
    ctx.textAlign = "left";

    // Title Line
    ctx.font = "800 10.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(cfg.title, textStartX, -4);

    // Subtitle Line
    ctx.font = "600 8.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = cfg.subCol || "#FEF08A";
    ctx.fillText(cfg.subtitle, textStartX, 9);

    ctx.restore();
}
