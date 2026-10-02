export function renderWatermark(
    ctx: CanvasRenderingContext2D,
    showWatermark: boolean
) {
    if (!showWatermark) return;

    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    const badgeW = 176;
    const badgeH = 34;
    const badgeX = 18;
    const badgeY = 22;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
    ctx.fill();

    ctx.fillStyle = "#00AFA9";
    ctx.font = "900 13px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("LYHU!", badgeX + 16, badgeY + 22);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 11.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillText("• Tổng Kho Sỉ B2B", badgeX + 54, badgeY + 22);
    ctx.restore();
}
