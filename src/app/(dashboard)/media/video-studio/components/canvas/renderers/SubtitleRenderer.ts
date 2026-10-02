import { SubtitleCue } from "../../../types";

export interface SubtitleRendererOptions {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    time: number;
    enableSubtitles: boolean;
    subtitleCues: SubtitleCue[];
    textPosition: "bottom" | "center" | "top";
    keyPowerWords: string[];
    textAnimationEffect: "tiktok_pop" | "karaoke_glow" | "bicolor_punch" | "fire_shake" | "box_pill" | "clean_fade";
    subtitleStyle: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow";
    fontSize: number;
    fontFamily: string;
    textColor: string;
}

export function renderSubtitles({
    canvas,
    ctx,
    time,
    enableSubtitles,
    subtitleCues,
    textPosition,
    keyPowerWords,
    textAnimationEffect,
    subtitleStyle,
    fontSize,
    fontFamily,
    textColor
}: SubtitleRendererOptions) {
    if (!enableSubtitles) return;

    const cw = canvas.width;
    const ch = canvas.height;

    const activeSub = subtitleCues.find(cue => time >= cue.start && time <= cue.end);
    if (!activeSub) return;

    ctx.save();
    const text = activeSub.text;
    const cueDur = Math.max(0.1, activeSub.end - activeSub.start);
    const cueElapsed = time - activeSub.start;

    let subY = ch * 0.82;
    if (textPosition === "center") subY = ch * 0.52;
    if (textPosition === "top") subY = ch * 0.28;

    const uppercaseText = text.toUpperCase();
    const matchedPowerWord = keyPowerWords.find(pw => pw && uppercaseText.includes(pw.toUpperCase()));

    let phraseScale = 1.0;
    let shakeX = 0;
    let shakeY = 0;

    if (textAnimationEffect === "tiktok_pop") {
        if (cueElapsed < 0.18) {
            const t = cueElapsed / 0.18;
            phraseScale = 1.0 + Math.sin(t * Math.PI) * 0.22;
        }
    } else if (textAnimationEffect === "fire_shake") {
        if (cueElapsed < 0.12) {
            const t = cueElapsed / 0.12;
            phraseScale = 1.35 - 0.35 * Math.sin(t * Math.PI * 0.5);
        }
        if (matchedPowerWord) {
            shakeX = Math.sin(time * 36) * 3;
            shakeY = Math.cos(time * 28) * 2.5;
        }
    }

    ctx.translate(cw / 2 + shakeX, subY + shakeY);
    ctx.scale(phraseScale, phraseScale);

    const maxAllowedSubW = cw - 56;
    let activeFontSize = fontSize;
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    const rawMeasure = ctx.measureText(text).width;
    if (rawMeasure > maxAllowedSubW) {
        activeFontSize = Math.max(16, Math.floor(fontSize * (maxAllowedSubW / rawMeasure)));
        ctx.font = `900 ${activeFontSize}px ${fontFamily}`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const wordsList = activeSub.words || text.split(" ").map((w, idx, arr) => ({
        word: w,
        start: activeSub.start + (idx / arr.length) * cueDur,
        end: activeSub.start + ((idx + 1) / arr.length) * cueDur
    }));

    const spaceW = ctx.measureText(" ").width;
    const wordWidths = wordsList.map(w => ctx.measureText(w.word).width);
    const totalLineW = wordWidths.reduce((a, b) => a + b, 0) + (wordsList.length - 1) * spaceW;

    if (textAnimationEffect === "tiktok_pop") {
        let curX = -totalLineW / 2;
        wordsList.forEach((wObj, idx) => {
            const isSpeaking = time >= wObj.start && time <= wObj.end;
            const hasSpoken = time > wObj.end;
            const wWidth = wordWidths[idx];
            const wordCenter = curX + wWidth / 2;

            ctx.save();
            ctx.translate(wordCenter, 0);

            let wScale = 1.0;
            let wColor = textColor || "#FFFFFF";
            if (isSpeaking) {
                const wProgress = (time - wObj.start) / Math.max(0.05, wObj.end - wObj.start);
                wScale = 1.0 + Math.sin(Math.min(1, wProgress) * Math.PI) * 0.28;
                wColor = "#FFE600";
                ctx.shadowColor = "rgba(255, 230, 0, 0.9)";
                ctx.shadowBlur = 18;
            } else if (hasSpoken) {
                wColor = "#FFFFFF";
                ctx.shadowColor = "rgba(0,0,0,0.95)";
                ctx.shadowBlur = 10;
            } else {
                wColor = "rgba(255, 255, 255, 0.85)";
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 8;
            }

            ctx.scale(wScale, wScale);
            ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.24));
            ctx.strokeStyle = "#000000";
            ctx.lineJoin = "round";
            ctx.strokeText(wObj.word, 0, 0);

            ctx.fillStyle = wColor;
            ctx.fillText(wObj.word, 0, 0);
            ctx.restore();

            curX += wWidth + spaceW;
        });

    } else if (textAnimationEffect === "karaoke_glow") {
        let curX = -totalLineW / 2;
        wordsList.forEach((wObj, idx) => {
            const isSpeaking = time >= wObj.start && time <= wObj.end;
            const hasSpoken = time > wObj.end;
            const wWidth = wordWidths[idx];
            const wordCenter = curX + wWidth / 2;

            ctx.save();
            ctx.translate(wordCenter, 0);

            ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.22));
            ctx.strokeStyle = "#000000";
            ctx.lineJoin = "round";

            if (isSpeaking) {
                ctx.shadowColor = "#00F2FE";
                ctx.shadowBlur = 24;
                ctx.strokeText(wObj.word, 0, 0);
                ctx.fillStyle = "#00F2FE";
                ctx.fillText(wObj.word, 0, 0);

                ctx.beginPath();
                ctx.arc(0, activeFontSize * 0.65, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#00F2FE";
                ctx.fill();
            } else if (hasSpoken) {
                ctx.shadowColor = "rgba(0,0,0,0.85)";
                ctx.shadowBlur = 8;
                ctx.strokeText(wObj.word, 0, 0);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(wObj.word, 0, 0);
            } else {
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = 6;
                ctx.strokeText(wObj.word, 0, 0);
                ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
                ctx.fillText(wObj.word, 0, 0);
            }
            ctx.restore();

            curX += wWidth + spaceW;
        });

    } else if (textAnimationEffect === "bicolor_punch") {
        let curX = -totalLineW / 2;
        wordsList.forEach((wObj, idx) => {
            const wWidth = wordWidths[idx];
            const wordCenter = curX + wWidth / 2;
            const isPower = matchedPowerWord && wObj.word.toUpperCase().includes(matchedPowerWord.toUpperCase());
            const isSpeaking = time >= wObj.start && time <= wObj.end;

            ctx.save();
            ctx.translate(wordCenter, 0);
            if (isSpeaking) {
                ctx.scale(1.15, 1.15);
            }

            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 4;

            ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.22));
            ctx.strokeStyle = "#000000";
            ctx.lineJoin = "round";
            ctx.strokeText(wObj.word, 0, 0);

            ctx.fillStyle = isPower ? "#FF4500" : (idx % 2 === 0 ? "#FFE600" : "#FFFFFF");
            ctx.fillText(wObj.word, 0, 0);
            ctx.restore();

            curX += wWidth + spaceW;
        });

    } else if (subtitleStyle === "pill_dark" || textAnimationEffect === "box_pill") {
        const pillW = totalLineW + 44;
        const pillH = activeFontSize + 26;

        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 14);
        ctx.fill();

        ctx.strokeStyle = matchedPowerWord ? "#FACC15" : "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        let curX = -totalLineW / 2;
        wordsList.forEach((wObj, idx) => {
            const isSpeaking = time >= wObj.start && time <= wObj.end;
            const wWidth = wordWidths[idx];
            const wordCenter = curX + wWidth / 2;

            ctx.save();
            ctx.translate(wordCenter, 0);
            if (isSpeaking) {
                ctx.scale(1.12, 1.12);
                ctx.fillStyle = "#FFE600";
                ctx.shadowColor = "#FFE600";
                ctx.shadowBlur = 12;
            } else {
                ctx.fillStyle = "#FFFFFF";
            }
            ctx.fillText(wObj.word, 0, 0);
            ctx.restore();

            curX += wWidth + spaceW;
        });

    } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 12;
        ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.24));
        ctx.strokeStyle = "#000000";
        ctx.lineJoin = "round";
        ctx.strokeText(text, 0, 0);

        ctx.fillStyle = matchedPowerWord ? "#FFE600" : (textColor || "#FFFFFF");
        ctx.fillText(text, 0, 0);
    }

    if (matchedPowerWord && textAnimationEffect !== "box_pill") {
        ctx.save();
        ctx.font = `900 ${Math.max(10, Math.round(activeFontSize * 0.38))}px ${fontFamily}`;
        ctx.fillStyle = "#DC2626";
        ctx.shadowColor = "rgba(220, 38, 38, 0.8)";
        ctx.shadowBlur = 10;
        const tagText = `🔥 ${matchedPowerWord}`;
        const tagW = ctx.measureText(tagText).width + 16;
        const tagH = Math.max(18, Math.round(activeFontSize * 0.6));
        ctx.beginPath();
        ctx.roundRect(-tagW / 2, -activeFontSize - tagH + 2, tagW, tagH, 6);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(tagText, 0, -activeFontSize - tagH / 2 + 2);
        ctx.restore();
    }

    ctx.restore();
}
