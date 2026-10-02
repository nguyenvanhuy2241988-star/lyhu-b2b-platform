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
    const pulse = 1.0 + Math.sin(validTime * 4.5) * 0.04;
    const cfg = STICKER_CONFIGS[activeSalesSticker] || STICKER_CONFIGS["freeship"];
    const badgeW = Math.min(cw * 0.54, 255);
    const badgeH = 54;

    let stickerX = cw - badgeW / 2 - 16;
    let stickerY = 64;
    if (stickerPosition === "top_left") {
        stickerX = badgeW / 2 + 16;
        stickerY = 64;
    } else if (stickerPosition === "bottom_right") {
        stickerX = cw - badgeW / 2 - 16;
        stickerY = ch - 190;
    }

    ctx.translate(stickerX, stickerY);
    ctx.scale(pulse, pulse);

    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;

    const sGrad = ctx.createLinearGradient(-badgeW / 2, -badgeH / 2, badgeW / 2, badgeH / 2);
    sGrad.addColorStop(0, cfg.bgGrad[0]);
    sGrad.addColorStop(1, cfg.bgGrad[1]);
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 14);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = cfg.border;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // LIVE DEAL tag
    const liveTagW = 76;
    const liveTagH = 15;
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.roundRect(badgeW / 2 - liveTagW - 8, -badgeH / 2 - 7, liveTagW, liveTagH, 7);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();

    const liveDotAlpha = 0.5 + Math.sin(validTime * 8) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${liveDotAlpha})`;
    ctx.beginPath();
    ctx.arc(badgeW / 2 - liveTagW + 8, -badgeH / 2 + 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "900 8.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("LIVE DEAL", badgeW / 2 - liveTagW / 2 + 6, -badgeH / 2 + 0.5);

    // Icon circle
    const iconR = 17;
    const iconCx = -badgeW / 2 + 26;
    ctx.beginPath();
    ctx.arc(iconCx, 0, iconR, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = cfg.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.icon, iconCx, 1);

    // Text
    const textStartX = -badgeW / 2 + 50;
    ctx.textAlign = "left";

    ctx.font = "900 13px 'Be Vietnam Pro', sans-serif";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
    ctx.lineWidth = 4;
    ctx.strokeText(cfg.title, textStartX, -5);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(cfg.title, textStartX, -5);

    ctx.font = "800 9px 'Be Vietnam Pro', sans-serif";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 3;
    ctx.strokeText(cfg.subtitle, textStartX, 13);
    ctx.fillStyle = cfg.subCol;
    ctx.fillText(cfg.subtitle, textStartX, 13);

    ctx.restore();
}
