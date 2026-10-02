export interface HookBannerOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    time: number;
    showHookTitle: boolean;
    hookDuration: number;
    customHookTitle: string;
    hookBannerTheme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu";
    fontFamily: string;
}

export function renderHookBanner({
    canvas,
    ctx,
    time,
    showHookTitle,
    hookDuration,
    customHookTitle,
    hookBannerTheme,
    fontFamily
}: HookBannerOptions) {
    if (!showHookTitle || time > hookDuration || !customHookTitle.trim()) return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.save();

    let hookScale = 1.0;
    if (time < 0.28) {
        const t = time / 0.28;
        hookScale = 0.82 + 0.18 * Math.sin(t * Math.PI * 0.5);
    }

    const hookCenterY = ch * 0.17;
    const maxBadgeW = Math.min(cw * 0.94, cw - 24);
    const maxContentW = maxBadgeW - 32;

    const textRaw = customHookTitle.trim();
    let baseFontSize = 24;
    if (textRaw.length > 55) baseFontSize = 18;
    else if (textRaw.length > 36) baseFontSize = 21;

    ctx.font = `900 ${baseFontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = textRaw.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const testW = ctx.measureText(testLine).width;
        if (testW > maxContentW && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);

    let maxLineW = 0;
    lines.forEach((l) => {
        const lw = ctx.measureText(l).width;
        if (lw > maxLineW) maxLineW = lw;
    });

    const lineHeight = baseFontSize * 1.36;
    const topTagH = 20;
    const badgeW = Math.min(maxBadgeW, Math.max(220, maxLineW + 48));
    const badgeH = Math.max(56, lines.length * lineHeight + topTagH + 18);
    const badgeX = (cw - badgeW) / 2;
    const badgeY = hookCenterY - badgeH / 2;

    ctx.translate(cw / 2, hookCenterY);
    ctx.scale(hookScale, hookScale);
    if (hookBannerTheme === "tiktok_sticker") {
        ctx.rotate(-0.02);
    }
    ctx.translate(-cw / 2, -hookCenterY);

    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;

    const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    if (hookBannerTheme === "tiktok_sticker") {
        grad.addColorStop(0, "#FFE600");
        grad.addColorStop(0.35, "#FF9900");
        grad.addColorStop(1, "#DC2626");
    } else if (hookBannerTheme === "black_gold") {
        grad.addColorStop(0, "#09090B");
        grad.addColorStop(0.5, "#18181B");
        grad.addColorStop(1, "#27272A");
    } else if (hookBannerTheme === "teal_lyhu") {
        grad.addColorStop(0, "#0F766E");
        grad.addColorStop(1, "#00AFA9");
    } else {
        grad.addColorStop(0, "#DC2626");
        grad.addColorStop(0.5, "#E11D48");
        grad.addColorStop(1, "#EA580C");
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = hookBannerTheme === "tiktok_sticker"
        ? "#000000"
        : (hookBannerTheme === "black_gold" ? "#FACC15" : "rgba(255, 255, 255, 0.65)");
    ctx.lineWidth = hookBannerTheme === "tiktok_sticker" ? 3.5 : 2;
    ctx.stroke();

    const tagText = hookBannerTheme === "black_gold"
        ? "✦ BÍ QUYẾT BÁN BUÔN"
        : (hookBannerTheme === "teal_lyhu" ? "📦 LYHU WHOLESALE" : "🔥 XU HƯỚNG KHO SỈ");
    ctx.font = `900 11px ${fontFamily}`;
    const tagW = ctx.measureText(tagText).width + 18;
    const tagX = cw / 2 - tagW / 2;
    const tagY = badgeY + 8;
    ctx.fillStyle = hookBannerTheme === "tiktok_sticker" ? "#000000" : "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, 18, 9);
    ctx.fill();
    ctx.fillStyle = hookBannerTheme === "tiktok_sticker" ? "#FFE600" : "#FFFFFF";
    ctx.fillText(tagText, cw / 2, tagY + 9);

    const startTextY = badgeY + topTagH + 8 + ((badgeH - topTagH - 18) - (lines.length - 1) * lineHeight) / 2;
    lines.forEach((lineText, idx) => {
        const lineY = startTextY + idx * lineHeight;
        ctx.font = `900 ${baseFontSize}px ${fontFamily}`;

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8.5;
        ctx.lineJoin = "round";
        ctx.strokeText(lineText, cw / 2, lineY);

        if (hookBannerTheme === "tiktok_sticker") {
            ctx.fillStyle = idx === 0 ? "#FFFFFF" : "#FFE600";
        } else if (hookBannerTheme === "black_gold") {
            ctx.fillStyle = idx === 0 ? "#FFFFFF" : "#FEF08A";
        } else {
            ctx.fillStyle = idx === 0 ? "#FFE600" : "#FFFFFF";
        }
        ctx.fillText(lineText, cw / 2, lineY);
    });

    ctx.restore();
}
