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

    // Smooth subtle pop-in animation (0 - 0.25s)
    let hookScale = 1.0;
    if (time < 0.25) {
        const t = time / 0.25;
        hookScale = 0.88 + 0.12 * Math.sin(t * Math.PI * 0.5);
    }

    // Position: upper safe area, safely above the speaker's eyes & forehead
    const hookCenterY = ch * 0.115;
    const maxBadgeW = Math.min(cw * 0.92, cw - 28);
    const maxContentW = maxBadgeW - 32;

    const textRaw = customHookTitle.trim();
    let baseFontSize = 21;
    if (textRaw.length > 55) baseFontSize = 16;
    else if (textRaw.length > 36) baseFontSize = 18.5;

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

    const lineHeight = baseFontSize * 1.34;
    const topTagH = 18;
    const badgeW = Math.min(maxBadgeW, Math.max(220, maxLineW + 40));
    const badgeH = Math.max(50, lines.length * lineHeight + topTagH + 16);
    const badgeX = (cw - badgeW) / 2;
    const badgeY = hookCenterY - badgeH / 2;

    ctx.translate(cw / 2, hookCenterY);
    ctx.scale(hookScale, hookScale);
    ctx.translate(-cw / 2, -hookCenterY);

    // Subtle elegant shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    // Theme backgrounds & borders
    let bgFill = "#00AFA9";
    let strokeCol = "rgba(255, 255, 255, 0.35)";
    let tagText = "📦 TỔNG KHO LYHU";
    let tagBg = "rgba(0, 0, 0, 0.25)";
    let tagTextCol = "#FFFFFF";
    let line1Col = "#FFFFFF";
    let line2Col = "#FEF08A";

    if (hookBannerTheme === "tiktok_sticker") {
        // Modern TikTok Creator Dark Slate Glass
        bgFill = "rgba(15, 23, 42, 0.92)";
        strokeCol = "rgba(255, 255, 255, 0.2)";
        tagText = "🔥 VIRAL TREND";
        tagBg = "rgba(250, 204, 21, 0.2)";
        tagTextCol = "#FACC15";
        line1Col = "#FFFFFF";
        line2Col = "#FACC15";
    } else if (hookBannerTheme === "red_orange") {
        // Vibrant Deal Red
        bgFill = "#DC2626";
        strokeCol = "rgba(255, 255, 255, 0.4)";
        tagText = "⚡ GIÁ SỈ TẬN KHO";
        tagBg = "rgba(0, 0, 0, 0.25)";
        tagTextCol = "#FFFFFF";
        line1Col = "#FFFFFF";
        line2Col = "#FEF08A";
    } else if (hookBannerTheme === "black_gold") {
        // Clean Minimalist Editorial White
        bgFill = "#FFFFFF";
        strokeCol = "rgba(15, 23, 42, 0.15)";
        tagText = "✦ BÍ QUYẾT BÁN BUÔN";
        tagBg = "rgba(0, 175, 169, 0.12)";
        tagTextCol = "#008F8A";
        line1Col = "#0F172A";
        line2Col = "#008F8A";
    }

    // Draw main capsule background
    ctx.fillStyle = bgFill;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Micro-badge tag pill
    ctx.font = `800 10px ${fontFamily}`;
    const tagW = ctx.measureText(tagText).width + 16;
    const tagX = cw / 2 - tagW / 2;
    const tagY = badgeY + 7;
    ctx.fillStyle = tagBg;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, 16, 8);
    ctx.fill();
    ctx.fillStyle = tagTextCol;
    ctx.fillText(tagText, cw / 2, tagY + 8);

    // Headline Lines
    const startTextY = badgeY + topTagH + 8 + ((badgeH - topTagH - 16) - (lines.length - 1) * lineHeight) / 2;
    lines.forEach((lineText, idx) => {
        const lineY = startTextY + idx * lineHeight;
        ctx.font = `900 ${baseFontSize}px ${fontFamily}`;

        // Subtle dark outline for razor-sharp readability on all video backgrounds
        if (hookBannerTheme !== "black_gold") {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
            ctx.lineWidth = 3.0;
            ctx.lineJoin = "round";
            ctx.strokeText(lineText, cw / 2, lineY);
        }

        ctx.fillStyle = idx === 0 ? line1Col : line2Col;
        ctx.fillText(lineText, cw / 2, lineY);
    });

    ctx.restore();
}
