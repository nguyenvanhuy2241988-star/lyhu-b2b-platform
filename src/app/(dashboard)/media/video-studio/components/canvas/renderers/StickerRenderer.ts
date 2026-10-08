import { STICKER_CONFIGS } from "../../../lib/constants";

export interface StickerRendererOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    validTime: number;
    activeSalesSticker: string;
    stickerPosition: "top_right" | "top_left" | "bottom_right";
    customTitle?: string;
    customSubtitle?: string;
    customIcon?: string;
    stickerStyle?: "emerald_deal" | "teal_lyhu" | "fire_sale" | "amber_gold" | "cyber_purple";
}

export function renderSalesSticker({
    canvas,
    ctx,
    validTime,
    activeSalesSticker,
    stickerPosition,
    customTitle,
    customSubtitle,
    customIcon,
    stickerStyle
}: StickerRendererOptions) {
    if (!activeSalesSticker || activeSalesSticker === "none") return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.save();

    // Subtle gentle breath animation (1.0 to 1.02)
    const pulse = 1.0 + Math.sin(validTime * 3.0) * 0.02;
    const baseCfg = STICKER_CONFIGS[activeSalesSticker] || STICKER_CONFIGS["freeship"] || {
        title: "FREESHIP TẬN QUÁN",
        subtitle: "Giao nhanh nội thành & tỉnh",
        icon: "🚚",
        bgGrad: ["#059669", "#10b981"],
        subCol: "#FEF08A"
    };

    const title = customTitle || baseCfg.title;
    const subtitle = customSubtitle || baseCfg.subtitle;
    const icon = customIcon || baseCfg.icon;

    // Determine background color based on stickerStyle or preset
    let bgGrad = baseCfg.bgGrad || ["#00AFA9", "#14B8A6"];
    let subCol = baseCfg.subCol || "#FEF08A";

    if (stickerStyle === "emerald_deal") {
        bgGrad = ["#059669", "#10B981"];
        subCol = "#FEF08A";
    } else if (stickerStyle === "teal_lyhu") {
        bgGrad = ["#00AFA9", "#14B8A6"];
        subCol = "#FFFFFF";
    } else if (stickerStyle === "fire_sale") {
        bgGrad = ["#DC2626", "#F97316"];
        subCol = "#FEF08A";
    } else if (stickerStyle === "amber_gold") {
        bgGrad = ["#D97706", "#F59E0B"];
        subCol = "#FFFFFF";
    } else if (stickerStyle === "cyber_purple") {
        bgGrad = ["#7C3AED", "#A855F7"];
        subCol = "#FDE047";
    }

    // Dynamic width measurement
    ctx.font = "800 10.5px 'Be Vietnam Pro', sans-serif";
    const titleW = ctx.measureText(title).width;
    ctx.font = "600 8.5px 'Be Vietnam Pro', sans-serif";
    const subW = ctx.measureText(subtitle).width;

    const badgeW = Math.min(cw * 0.48, Math.max(160, Math.max(titleW, subW) + 56));
    const badgeH = 38;

    let stickerX = cw - badgeW / 2 - 18;
    let stickerY = 40;
    if (stickerPosition === "top_left") {
        stickerX = badgeW / 2 + 18;
        stickerY = 40;
    } else if (stickerPosition === "bottom_right") {
        stickerX = cw - badgeW / 2 - 18;
        stickerY = ch - 148;
    }

    ctx.translate(stickerX, stickerY);
    ctx.scale(pulse, pulse);

    // Soft drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;

    // Linear gradient background
    const grad = ctx.createLinearGradient(-badgeW / 2, 0, badgeW / 2, 0);
    grad.addColorStop(0, bgGrad[0]);
    grad.addColorStop(1, bgGrad[1] || bgGrad[0]);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 19);
    ctx.fill();

    // Clean subtle border
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.3;
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
    ctx.fillText(icon, iconCx, 1);

    // Text Lines
    const textStartX = -badgeW / 2 + 39;
    ctx.textAlign = "left";

    // Title Line
    ctx.font = "800 10.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(title, textStartX, -4);

    // Subtitle Line
    ctx.font = "600 8.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = subCol;
    ctx.fillText(subtitle, textStartX, 9);

    ctx.restore();
}
