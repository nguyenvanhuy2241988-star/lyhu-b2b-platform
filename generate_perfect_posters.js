const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function buildMasterPosters() {
    console.log("=== BUILDING STANDARD AGENCY-GRADE POSTER SUITE ===");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const publicDir = path.join(process.cwd(), 'public');

    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const raw65 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const raw1k = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');
    const rawCheese = fs.readFileSync(path.join(brainDir, 'cheese_wedge_popcorn_1789923525630.jpg')).toString('base64');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // High precision alpha cutouts with tight bounding box cropping
    console.log("Processing assets with high precision alpha cutouts...");
    const cutouts = await page.evaluate(async (b65, b1k, bCheese) => {
        function processAsset(base64, bgThresholdDist = 24, featherDist = 16) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const d = imgData.data;
                    const w = canvas.width;
                    const h = canvas.height;

                    const bgR = d[0], bgG = d[1], bgB = d[2];
                    const isBg = new Uint8Array(w * h);
                    const queue = [];

                    function isBgMatch(idx) {
                        const dr = d[idx] - bgR;
                        const dg = d[idx + 1] - bgG;
                        const db = d[idx + 2] - bgB;
                        return Math.sqrt(dr * dr + dg * dg + db * db) <= bgThresholdDist;
                    }

                    for (let x = 0; x < w; x++) {
                        queue.push(x, 0);
                        queue.push(x, h - 1);
                        isBg[x] = 1;
                        isBg[(h - 1) * w + x] = 1;
                    }
                    for (let y = 0; y < h; y++) {
                        queue.push(0, y);
                        queue.push(w - 1, y);
                        isBg[y * w] = 1;
                        isBg[y * w + (w - 1)] = 1;
                    }

                    let head = 0;
                    while (head < queue.length) {
                        const cx = queue[head++];
                        const cy = queue[head++];
                        const pIdx = (cy * w + cx) * 4;

                        if (isBgMatch(pIdx)) {
                            const neighbors = [
                                [cx + 1, cy], [cx - 1, cy],
                                [cx, cy + 1], [cx, cy - 1]
                            ];
                            for (let i = 0; i < 4; i++) {
                                const nx = neighbors[i][0];
                                const ny = neighbors[i][1];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    const nPos = ny * w + nx;
                                    if (!isBg[nPos]) {
                                        isBg[nPos] = 1;
                                        if (isBgMatch(nPos * 4)) {
                                            queue.push(nx, ny);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let minX = w, maxX = 0, minY = h, maxY = 0;
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const idx = y * w + x;
                            const pIdx = idx * 4;
                            if (isBg[idx]) {
                                d[pIdx + 3] = 0;
                            } else {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }

                    // Feather boundary
                    for (let y = 1; y < h - 1; y++) {
                        for (let x = 1; x < w - 1; x++) {
                            const idx = y * w + x;
                            if (!isBg[idx]) {
                                const nBg = isBg[idx - 1] + isBg[idx + 1] + isBg[idx - w] + isBg[idx + w];
                                if (nBg > 0) {
                                    const pIdx = idx * 4;
                                    const dr = d[pIdx] - bgR;
                                    const dg = d[pIdx + 1] - bgG;
                                    const db = d[pIdx + 2] - bgB;
                                    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
                                    if (dist < bgThresholdDist + featherDist) {
                                        const alphaFrac = Math.max(0, Math.min(1, (dist - bgThresholdDist) / featherDist));
                                        d[pIdx + 3] = Math.round(alphaFrac * 255);
                                    }
                                }
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);

                    const cropCanvas = document.createElement('canvas');
                    const cropW = Math.max(1, maxX - minX + 1);
                    const cropH = Math.max(1, maxY - minY + 1);
                    cropCanvas.width = cropW;
                    cropCanvas.height = cropH;
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

                    resolve({
                        dataUrl: cropCanvas.toDataURL('image/png'),
                        w: cropW,
                        h: cropH
                    });
                };
                img.src = 'data:image/jpeg;base64,' + base64;
            });
        }

        return {
            cut65: await processAsset(b65, 20, 15),
            cut1k: await processAsset(b1k, 20, 15),
            cutCheese: await processAsset(bCheese, 28, 22)
        };
    }, raw65, raw1k, rawCheese);

    console.log("Assets processed with tight crops.");

    function generateHtml(options) {
        return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        width: 1200px;
        height: 1200px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: #FFFFFF;
        position: relative;
        overflow: hidden;
        color: #0F172A;
        -webkit-font-smoothing: antialiased;
    }

    /* Subtle Grid on top-right (Exact CVT 35G signature) */
    .bg-grid {
        position: absolute;
        top: 0;
        right: 0;
        width: 680px;
        height: 680px;
        background-size: 38px 38px;
        background-image: 
            linear-gradient(to right, rgba(0, 163, 150, 0.15) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(0, 163, 150, 0.15) 1.5px, transparent 1.5px);
        z-index: 1;
        mask-image: radial-gradient(circle at top right, black 40%, transparent 80%);
    }

    /* Soft organic mint-cream shape on right side */
    .organic-mint-shape {
        position: absolute;
        top: 70px;
        right: 0;
        width: 730px;
        height: 1040px;
        background: linear-gradient(145deg, #F0F9F6 0%, #E2F2EE 60%, #DAEDE7 100%);
        border-radius: 210px 0 0 130px;
        z-index: 2;
    }

    /* Warm golden cheese glow behind products */
    .cheese-glow {
        position: absolute;
        top: 240px;
        right: 80px;
        width: 580px;
        height: 580px;
        background: radial-gradient(circle, rgba(255, 215, 100, 0.32) 0%, rgba(255, 240, 180, 0.08) 58%, transparent 76%);
        border-radius: 50%;
        z-index: 3;
        pointer-events: none;
    }

    /* Full Container */
    .container {
        position: relative;
        z-index: 10;
        width: 1200px;
        height: 1200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 50px 56px 30px 56px;
    }

    /* Top Left LYHU Logo */
    .header-box {
        display: flex;
        align-items: flex-start;
        width: 100%;
    }
    .header-logo {
        height: 86px;
        object-fit: contain;
    }

    /* Main Area Split: 38% Left Text, 62% Right Staging */
    .main-layout {
        display: flex;
        align-items: center;
        flex: 1;
        position: relative;
        margin-top: 15px;
        margin-bottom: 15px;
    }

    /* Left Copy Column */
    .left-col {
        width: 450px;
        display: flex;
        flex-direction: column;
        z-index: 25;
        padding-bottom: 20px;
    }

    /* Product Code: OSWALD CONDENSED BOLD */
    .product-code {
        font-family: 'Oswald', sans-serif;
        font-size: 88px;
        font-weight: 700;
        color: #006E65;
        letter-spacing: -0.5px;
        line-height: 0.92;
        text-transform: uppercase;
    }

    /* Accent Bar */
    .green-bar {
        width: 84px;
        height: 4.5px;
        background: #8DC63F;
        margin-top: 16px;
        margin-bottom: 24px;
        border-radius: 2px;
    }

    /* Stacked Headline */
    .headline-stacked {
        font-family: 'Oswald', sans-serif;
        font-size: 64px;
        font-weight: 700;
        line-height: 1.04;
        color: #004D47;
        text-transform: uppercase;
        letter-spacing: -0.5px;
        margin-bottom: 28px;
    }

    /* Subline */
    .spec-subline {
        font-size: 22px;
        font-weight: 800;
        color: #004D47;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 14px;
    }

    /* Channel / Usage Recommendation */
    .channel-desc {
        font-size: 20px;
        font-weight: 600;
        line-height: 1.45;
        color: #4A6E6A;
        margin-bottom: 30px;
    }

    /* Bottom Green Bar */
    .bottom-green-bar {
        width: 84px;
        height: 4.5px;
        background: #8DC63F;
        margin-bottom: 18px;
        border-radius: 2px;
    }

    /* Wholesale Line */
    .wholesale-title {
        font-size: 24px;
        font-weight: 900;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: 0.6px;
    }

    /* Right Staging Area */
    .right-col {
        flex: 1;
        height: 820px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Top Quality Pill Badge */
    .top-badge {
        position: absolute;
        top: 20px;
        right: 40px;
        background: #FFFFFF;
        border: 2px solid ${options.badgeBorder || '#8DC63F'};
        border-radius: 40px;
        padding: 9px 22px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 25px rgba(0, 163, 150, 0.14);
        z-index: 30;
    }
    .top-badge span {
        font-size: 16px;
        font-weight: 800;
        color: #006E65;
        text-transform: uppercase;
        letter-spacing: 0.6px;
    }

    /* Staging Elements & Shadows */
    ${options.stagingCss}

    /* Footer */
    .footer-bar {
        border-top: 1.5px solid #E2E8F0;
        padding-top: 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 17px;
        font-weight: 700;
        color: #004D47;
    }
    .footer-links {
        display: flex;
        align-items: center;
        gap: 32px;
    }
    .contact-item {
        display: flex;
        align-items: center;
        gap: 9px;
    }
    .contact-item svg {
        width: 20px;
        height: 20px;
        fill: #00A396;
    }
    .footer-sep {
        color: #CBD5E1;
        font-weight: 300;
    }

    /* Dot Grid (CVT 35G signature) */
    .dot-matrix {
        display: grid;
        grid-template-columns: repeat(4, 7px);
        gap: 6px;
    }
    .dot-matrix span {
        width: 7px;
        height: 7px;
        background: #00A396;
        opacity: 0.35;
        border-radius: 1px;
    }
</style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="organic-mint-shape"></div>
    <div class="cheese-glow"></div>

    <div class="container">
        <!-- Top Left LYHU Logo -->
        <div class="header-box">
            <img class="header-logo" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
        </div>

        <!-- Main Body -->
        <div class="main-layout">
            <div class="left-col">
                <div class="product-code">${options.productCode}</div>
                <div class="green-bar"></div>

                <div class="headline-stacked">
                    ${options.headlineHtml}
                </div>

                <div class="spec-subline">
                    ${options.specSubline}
                </div>

                <div class="channel-desc">
                    ${options.channelDesc}
                </div>

                <div class="bottom-green-bar"></div>

                <div class="wholesale-title">
                    ${options.wholesaleTitle}
                </div>
            </div>

            <div class="right-col">
                <!-- Top Badge -->
                <div class="top-badge">
                    ${options.badgeSvg}
                    <span>${options.badgeText}</span>
                </div>

                ${options.stagingHtml}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-bar">
            <div class="footer-links">
                <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    0969 069 798
                </div>
                <span class="footer-sep">|</span>
                <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    lyhu.vn • lyhu.com.vn
                </div>
                <span class="footer-sep">|</span>
                <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    lyhu.vn@gmail.com
                </div>
            </div>

            <div class="dot-matrix">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    // =========================================================================
    // POSTER 1: BOYO 65G (SIÊU THỊ, TẠP HÓA, MINIMART)
    // =========================================================================
    console.log("Rendering Poster 1: BOYO 65G...");
    const html1 = generateHtml({
        productCode: "BOYO 65G",
        headlineHtml: `NHỎ GỌN<br>ĐỂ KHÁCH<br>DỄ CHỌN`,
        specSubline: "HỘP 10 GÓI • THÙNG 6 HỘP",
        channelDesc: "Gợi ý cho siêu thị, minimart,<br>tạp hóa và quầy ăn vặt",
        wholesaleTitle: "PHÂN PHỐI SỈ TOÀN QUỐC",
        badgeBorder: "#8DC63F",
        badgeSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#8DC63F"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        badgeText: "100% Phô Mai Úc Nhập Khẩu",
        stagingCss: `
            /* Shadows */
            .sh-front {
                position: absolute;
                bottom: 40px;
                right: 190px;
                width: 380px;
                height: 35px;
                background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.4) 0%, rgba(0, 77, 71, 0.08) 55%, transparent 75%);
                z-index: 10;
            }
            .sh-back {
                position: absolute;
                bottom: 90px;
                right: 35px;
                width: 350px;
                height: 32px;
                background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.3) 0%, rgba(0, 77, 71, 0.06) 55%, transparent 75%);
                z-index: 6;
            }
            .sh-cheese {
                position: absolute;
                bottom: 10px;
                right: 15px;
                width: 320px;
                height: 28px;
                background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
                z-index: 20;
            }

            /* Front 65g Pouch - Dominant Hero */
            .pack-front {
                position: absolute;
                bottom: 55px;
                right: 175px;
                width: 440px;
                height: 594px;
                z-index: 15;
                transform: rotate(-3deg);
                filter: drop-shadow(0 22px 30px rgba(0, 77, 71, 0.22));
            }
            .pack-front img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Back 65g Pouch */
            .pack-back {
                position: absolute;
                bottom: 110px;
                right: 30px;
                width: 410px;
                height: 554px;
                z-index: 8;
                transform: rotate(7deg);
                filter: drop-shadow(0 18px 24px rgba(0, 77, 71, 0.16)) brightness(0.96);
            }
            .pack-back img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Foreground Cheese Wedge & Fries */
            .cheese-fg {
                position: absolute;
                bottom: 15px;
                right: 10px;
                width: 330px;
                z-index: 25;
                filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.22));
            }
            .cheese-fg img {
                width: 100%;
                object-fit: contain;
            }
        `,
        stagingHtml: `
            <div class="sh-back"></div>
            <div class="sh-front"></div>
            <div class="sh-cheese"></div>

            <div class="pack-back">
                <img src="${cutouts.cut65.dataUrl}" alt="BOYO 65g">
            </div>
            <div class="pack-front">
                <img src="${cutouts.cut65.dataUrl}" alt="BOYO 65g">
            </div>

            <div class="cheese-fg">
                <img src="${cutouts.cutCheese.dataUrl}" alt="Phô mai vàng rắc BOYO">
            </div>
        `
    });

    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(html1, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(publicDir, 'boyo_65g_poster.jpg'), type: 'jpeg', quality: 96 });
    await page.screenshot({ path: path.join(brainDir, 'boyo_65g_poster.jpg'), type: 'jpeg', quality: 96 });
    console.log("-> Saved boyo_65g_poster.jpg (2400x2400)");

    // =========================================================================
    // POSTER 2: BOYO 1KG (HORECA, NHÀ HÀNG, QUÁN ĂN, FAST FOOD)
    // =========================================================================
    console.log("Rendering Poster 2: BOYO 1KG...");
    const html2 = generateHtml({
        productCode: "BOYO 1KG",
        headlineHtml: `CHUẨN VỊ<br>HORECA<br>TỐI ƯU GIÁ`,
        specSubline: "TÚI ZIP TIỆN LỢI • BÁM DÍNH 360°",
        channelDesc: "Gợi ý cho gà rán, khoai tây lắc,<br>quán ăn vặt, nhà hàng & bếp trung tâm",
        wholesaleTitle: "CHIẾT KHẤU CAO • SỈ TOÀN QUỐC",
        badgeBorder: "#00A396",
        badgeSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#00A396"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
        badgeText: "Tiết Kiệm ~800đ / Khẩu Phần",
        stagingCss: `
            /* Shadows */
            .sh-1k {
                position: absolute;
                bottom: 45px;
                right: 90px;
                width: 440px;
                height: 38px;
                background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.42) 0%, rgba(0, 77, 71, 0.08) 55%, transparent 75%);
                z-index: 10;
            }
            .sh-cheese-1k {
                position: absolute;
                bottom: 10px;
                right: 30px;
                width: 320px;
                height: 28px;
                background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
                z-index: 20;
            }

            /* Main 1kg Pouch - Huge, Majestic */
            .pack-1k-hero {
                position: absolute;
                bottom: 60px;
                right: 75px;
                width: 490px;
                height: 704px;
                z-index: 15;
                filter: drop-shadow(0 26px 36px rgba(0, 77, 71, 0.22));
            }
            .pack-1k-hero img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Foreground Cheese Wedge & Fries */
            .cheese-1k-fg {
                position: absolute;
                bottom: 15px;
                right: 20px;
                width: 340px;
                z-index: 25;
                filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.22));
            }
            .cheese-1k-fg img {
                width: 100%;
                object-fit: contain;
            }
        `,
        stagingHtml: `
            <div class="sh-1k"></div>
            <div class="sh-cheese-1k"></div>

            <div class="pack-1k-hero">
                <img src="${cutouts.cut1k.dataUrl}" alt="BOYO 1kg">
            </div>

            <div class="cheese-1k-fg">
                <img src="${cutouts.cutCheese.dataUrl}" alt="Phô mai vàng rắc BOYO">
            </div>
        `
    });

    await page.setContent(html2, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(publicDir, 'boyo_1kg_poster.jpg'), type: 'jpeg', quality: 96 });
    await page.screenshot({ path: path.join(brainDir, 'boyo_1kg_poster.jpg'), type: 'jpeg', quality: 96 });
    console.log("-> Saved boyo_1kg_poster.jpg (2400x2400)");

    // =========================================================================
    // POSTER 3: BOYO MASTER (DUO 65G & 1KG TRADE MARKETING)
    // =========================================================================
    console.log("Rendering Poster 3: BOYO MASTER...");
    const html3 = generateHtml({
        productCode: "BOYO",
        headlineHtml: `RẮC LÀ MÊ<br>ĐẬM VỊ BÁN`,
        specSubline: "2 QUY CÁCH • PHỦ MỌI KÊNH BÁN",
        channelDesc: "Gói 65g cho bán lẻ, tạp hóa & minimart<br>Gói 1kg cho nhà hàng, quán ăn & Horeca",
        wholesaleTitle: "PHÂN PHỐI SỈ TOÀN QUỐC",
        badgeBorder: "#8DC63F",
        badgeSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#8DC63F"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        badgeText: "Gia Vị Rắc Bán Chạy Hàng Đầu",
        stagingCss: `
            /* Shadows */
            .sh-combo-1k {
                position: absolute;
                bottom: 85px;
                right: 35px;
                width: 420px;
                height: 36px;
                background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.35) 0%, rgba(0, 77, 71, 0.07) 55%, transparent 75%);
                z-index: 6;
            }
            .sh-combo-65 {
                position: absolute;
                bottom: 45px;
                right: 225px;
                width: 360px;
                height: 34px;
                background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.4) 0%, rgba(0, 77, 71, 0.08) 55%, transparent 75%);
                z-index: 12;
            }
            .sh-combo-cheese {
                position: absolute;
                bottom: 10px;
                right: 15px;
                width: 320px;
                height: 28px;
                background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
                z-index: 20;
            }

            /* 1kg Back Standing Proudly */
            .pack-combo-1k {
                position: absolute;
                bottom: 125px;
                right: 25px;
                width: 465px;
                height: 668px;
                z-index: 8;
                transform: rotate(3.5deg);
                filter: drop-shadow(0 24px 32px rgba(0, 77, 71, 0.2));
            }
            .pack-combo-1k img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* 65g Front Standing in front */
            .pack-combo-65 {
                position: absolute;
                bottom: 50px;
                right: 220px;
                width: 395px;
                height: 533px;
                z-index: 15;
                transform: rotate(-3.5deg);
                filter: drop-shadow(0 25px 34px rgba(0, 77, 71, 0.25));
            }
            .pack-combo-65 img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Foreground Cheese */
            .cheese-combo-fg {
                position: absolute;
                bottom: 15px;
                right: 10px;
                width: 320px;
                z-index: 25;
                filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.22));
            }
            .cheese-combo-fg img {
                width: 100%;
                object-fit: contain;
            }
        `,
        stagingHtml: `
            <div class="sh-combo-1k"></div>
            <div class="sh-combo-65"></div>
            <div class="sh-combo-cheese"></div>

            <div class="pack-combo-1k">
                <img src="${cutouts.cut1k.dataUrl}" alt="BOYO 1kg">
            </div>
            <div class="pack-combo-65">
                <img src="${cutouts.cut65.dataUrl}" alt="BOYO 65g">
            </div>

            <div class="cheese-combo-fg">
                <img src="${cutouts.cutCheese.dataUrl}" alt="Phô mai vàng rắc BOYO">
            </div>
        `
    });

    await page.setContent(html3, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(publicDir, 'boyo_master_poster_v3.jpg'), type: 'jpeg', quality: 96 });
    await page.screenshot({ path: path.join(brainDir, 'boyo_master_poster_v3.jpg'), type: 'jpeg', quality: 96 });
    console.log("-> Saved boyo_master_poster_v3.jpg (2400x2400)");

    await browser.close();
    console.log("=== ALL 3 POSTERS COMPLETED SUCCESSFULLY! ===");
}

buildMasterPosters().catch(console.error);
