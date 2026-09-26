const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderAllStandardPosters() {
    console.log("=== STARTING RENDERING STANDARD POSTER SUITE FOR BOYO ===");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const publicDir = path.join(process.cwd(), 'public');

    // Load source assets
    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const pack65Raw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const pack1kRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');
    const cheeseWedgeRaw = fs.readFileSync(path.join(brainDir, 'cheese_wedge_popcorn_1789923525630.jpg')).toString('base64');
    const cheeseDishRaw = fs.readFileSync(path.join(brainDir, 'cheese_fries_dish_1789922977796.jpg')).toString('base64');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // High quality smooth cutouts using anti-aliased flood fill
    console.log("Generating smooth transparent cutouts...");
    const cutouts = await page.evaluate(async (raw65, raw1k, rawCheese, rawDish) => {
        function smoothCutout(base64, bgThreshold = 246) {
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

                    const isBg = new Uint8Array(w * h);
                    const queue = [];

                    function isNearWhite(idx) {
                        return d[idx] >= bgThreshold && d[idx + 1] >= bgThreshold && d[idx + 2] >= bgThreshold;
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

                        if (isNearWhite(pIdx)) {
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
                                        if (isNearWhite(nPos * 4)) {
                                            queue.push(nx, ny);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Zero background alpha
                    for (let i = 0; i < w * h; i++) {
                        if (isBg[i]) {
                            d[i * 4 + 3] = 0;
                        }
                    }

                    // Smooth alpha feathering at boundary
                    for (let y = 1; y < h - 1; y++) {
                        for (let x = 1; x < w - 1; x++) {
                            const idx = y * w + x;
                            if (!isBg[idx]) {
                                const nBg = isBg[idx - 1] + isBg[idx + 1] + isBg[idx - w] + isBg[idx + w];
                                if (nBg > 0) {
                                    const pIdx = idx * 4;
                                    const avg = (d[pIdx] + d[pIdx + 1] + d[pIdx + 2]) / 3;
                                    if (avg > 230) {
                                        d[pIdx + 3] = Math.max(0, Math.min(255, Math.round((255 - avg) * 7.5)));
                                    }
                                }
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = 'data:image/jpeg;base64,' + base64;
            });
        }

        return {
            cut65: await smoothCutout(raw65, 246),
            cut1k: await smoothCutout(raw1k, 246),
            cutCheese: await smoothCutout(rawCheese, 245),
            cutDish: await smoothCutout(rawDish, 244)
        };
    }, pack65Raw, pack1kRaw, cheeseWedgeRaw, cheeseDishRaw);

    console.log("Assets ready. Now generating templates...");

    // Common CSS styles that strictly adhere to the CVT / LYHU design language
    const commonStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            width: 1000px;
            height: 1000px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #FFFFFF;
            position: relative;
            overflow: hidden;
            color: #0F172A;
            -webkit-font-smoothing: antialiased;
        }

        /* Top-Right Background Grid (Identical to CVT 35G) */
        .bg-grid {
            position: absolute;
            top: 0;
            right: 0;
            width: 580px;
            height: 580px;
            background-size: 34px 34px;
            background-image: 
                linear-gradient(to right, rgba(0, 163, 150, 0.14) 1.5px, transparent 1.5px),
                linear-gradient(to bottom, rgba(0, 163, 150, 0.14) 1.5px, transparent 1.5px);
            z-index: 1;
            mask-image: radial-gradient(circle at top right, black 35%, transparent 78%);
        }

        /* Organic Mint Curved Shape on the right */
        .organic-mint-shape {
            position: absolute;
            top: 60px;
            right: 0;
            width: 610px;
            height: 870px;
            background: linear-gradient(150deg, #F0F9F6 0%, #E3F2EE 60%, #DBECE7 100%);
            border-radius: 170px 0 0 110px;
            z-index: 2;
        }

        /* Soft Cheese Golden Glow in the staging zone */
        .cheese-warm-glow {
            position: absolute;
            top: 200px;
            right: 80px;
            width: 480px;
            height: 480px;
            background: radial-gradient(circle, rgba(255, 215, 110, 0.28) 0%, rgba(255, 240, 190, 0.08) 55%, transparent 75%);
            border-radius: 50%;
            z-index: 3;
            pointer-events: none;
        }

        /* Canvas Wrapper */
        .canvas-container {
            position: relative;
            z-index: 10;
            width: 1000px;
            height: 1000px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 42px 48px 24px 48px;
        }

        /* Header with LYHU logo */
        .header-box {
            display: flex;
            align-items: flex-start;
            width: 100%;
        }
        .header-logo {
            height: 72px;
            object-fit: contain;
        }

        /* Main Content Layout (40% Left Copy, 60% Right Visuals) */
        .main-layout {
            display: flex;
            align-items: center;
            flex: 1;
            position: relative;
            margin-top: 10px;
            margin-bottom: 10px;
        }

        /* Left Editorial Column */
        .left-editorial {
            width: 380px;
            display: flex;
            flex-direction: column;
            z-index: 25;
        }

        /* Product Code - Using OSWALD font like CVT 35G */
        .product-code {
            font-family: 'Oswald', sans-serif;
            font-size: 76px;
            font-weight: 700;
            color: #006E65;
            letter-spacing: -0.5px;
            line-height: 0.95;
            text-transform: uppercase;
        }

        /* Green Accent Bar */
        .green-bar {
            width: 72px;
            height: 4px;
            background: #8DC63F;
            margin-top: 14px;
            margin-bottom: 22px;
            border-radius: 2px;
        }

        /* Stacked Headline */
        .headline-stacked {
            font-family: 'Oswald', sans-serif;
            font-size: 54px;
            font-weight: 700;
            line-height: 1.05;
            color: #004D47;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 26px;
        }

        /* Subline Specification */
        .spec-subline {
            font-size: 19px;
            font-weight: 800;
            color: #004D47;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        /* Channel / Usage Recommendation */
        .channel-desc {
            font-size: 17px;
            font-weight: 600;
            line-height: 1.45;
            color: #4A6E6A;
            margin-bottom: 26px;
        }

        /* Bottom Green Bar */
        .bottom-green-bar {
            width: 72px;
            height: 4px;
            background: #8DC63F;
            margin-bottom: 16px;
            border-radius: 2px;
        }

        /* Wholesale Callout */
        .wholesale-title {
            font-size: 20px;
            font-weight: 900;
            color: #008075;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }

        /* Right Staging Area */
        .right-staging {
            flex: 1;
            height: 680px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Footer Section */
        .footer-bar {
            border-top: 1.5px solid #E2E8F0;
            padding-top: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 15px;
            font-weight: 700;
            color: #004D47;
        }
        .footer-links {
            display: flex;
            align-items: center;
            gap: 28px;
        }
        .contact-col {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .contact-col svg {
            width: 17px;
            height: 17px;
            fill: #00A396;
        }
        .footer-sep {
            color: #CBD5E1;
            font-weight: 300;
        }

        /* Dot Grid in bottom right */
        .dot-matrix {
            display: grid;
            grid-template-columns: repeat(4, 6px);
            gap: 5px;
        }
        .dot-matrix span {
            width: 6px;
            height: 6px;
            background: #00A396;
            opacity: 0.35;
            border-radius: 1px;
        }
    `;

    // =========================================================================
    // POSTER 1: BOYO 65G - STRICT SISTER TO CVT 35G (Retail / Supermarket / Minimart)
    // =========================================================================
    console.log("Building Poster 1: BOYO 65G (Retail & Minimart)...");
    const html65g = `<!DOCTYPE html>
    <html lang="vi">
    <head>
    <meta charset="UTF-8">
    <style>
        ${commonStyles}

        /* Realistic Floor Shadows for 65g Staging */
        .shadow-main-pack {
            position: absolute;
            bottom: 38px;
            right: 170px;
            width: 320px;
            height: 30px;
            background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.35) 0%, rgba(0, 77, 71, 0.08) 55%, transparent 75%);
            z-index: 10;
        }
        .shadow-back-pack {
            position: absolute;
            bottom: 80px;
            right: 40px;
            width: 290px;
            height: 28px;
            background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.28) 0%, rgba(0, 77, 71, 0.06) 55%, transparent 75%);
            z-index: 6;
        }
        .shadow-cheese-wedge {
            position: absolute;
            bottom: 12px;
            right: 20px;
            width: 280px;
            height: 24px;
            background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
            z-index: 21;
        }

        /* Main 65g Pack Standing Tall & Impactful */
        .pack-65-front {
            position: absolute;
            bottom: 50px;
            right: 155px;
            width: 350px;
            height: 520px;
            z-index: 15;
            transform: rotate(-3deg);
            filter: drop-shadow(0 20px 25px rgba(0, 77, 71, 0.2));
        }
        .pack-65-front img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Second 65g Pack Behind to give volume like CVT's multiple packs */
        .pack-65-back {
            position: absolute;
            bottom: 95px;
            right: 35px;
            width: 330px;
            height: 490px;
            z-index: 8;
            transform: rotate(7deg);
            filter: drop-shadow(0 15px 20px rgba(0, 77, 71, 0.16)) brightness(0.96);
        }
        .pack-65-back img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Delicious Cheese Wedge & Fries at bottom right */
        .cheese-wedge-asset {
            position: absolute;
            bottom: 18px;
            right: 15px;
            width: 280px;
            z-index: 25;
            filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.22));
        }
        .cheese-wedge-asset img {
            width: 100%;
            object-fit: contain;
        }

        /* Quality Badge like CVT's icons */
        .quality-badge {
            position: absolute;
            top: 25px;
            right: 50px;
            background: #FFFFFF;
            border: 2px solid #8DC63F;
            border-radius: 40px;
            padding: 8px 18px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 20px rgba(0, 163, 150, 0.12);
            z-index: 30;
        }
        .quality-badge span {
            font-size: 14px;
            font-weight: 800;
            color: #006E65;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
    </head>
    <body>
        <div class="bg-grid"></div>
        <div class="organic-mint-shape"></div>
        <div class="cheese-warm-glow"></div>

        <div class="canvas-container">
            <!-- Header -->
            <div class="header-box">
                <img class="header-logo" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
            </div>

            <!-- Main Layout -->
            <div class="main-layout">
                <div class="left-editorial">
                    <div class="product-code">BOYO 65G</div>
                    <div class="green-bar"></div>

                    <div class="headline-stacked">
                        NHỎ GỌN<br>
                        ĐỂ KHÁCH<br>
                        DỄ CHỌN
                    </div>

                    <div class="spec-subline">
                        HỘP 10 GÓI • THÙNG 6 HỘP
                    </div>

                    <div class="channel-desc">
                        Gợi ý cho siêu thị, minimart,<br>
                        tạp hóa và quầy ăn vặt
                    </div>

                    <div class="bottom-green-bar"></div>

                    <div class="wholesale-title">
                        PHÂN PHỐI SỈ TOÀN QUỐC
                    </div>
                </div>

                <div class="right-staging">
                    <!-- Floor shadows -->
                    <div class="shadow-back-pack"></div>
                    <div class="shadow-main-pack"></div>
                    <div class="shadow-cheese-wedge"></div>

                    <!-- Top Quality Stamp -->
                    <div class="quality-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#8DC63F"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span>100% Phô Mai Úc</span>
                    </div>

                    <!-- Products -->
                    <div class="pack-65-back">
                        <img src="${cutouts.cut65}" alt="BOYO 65g">
                    </div>
                    <div class="pack-65-front">
                        <img src="${cutouts.cut65}" alt="BOYO 65g">
                    </div>

                    <!-- Foreground real food accompaniment -->
                    <div class="cheese-wedge-asset">
                        <img src="${cutouts.cutCheese}" alt="Phô mai vàng rắc BOYO">
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer-bar">
                <div class="footer-links">
                    <div class="contact-col">
                        <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        0969 069 798
                    </div>
                    <span class="footer-sep">|</span>
                    <div class="contact-col">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        lyhu.vn • lyhu.com.vn
                    </div>
                    <span class="footer-sep">|</span>
                    <div class="contact-col">
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

    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2.4 });
    await page.setContent(html65g, { waitUntil: 'networkidle0' });
    const file65Public = path.join(publicDir, 'boyo_65g_poster.jpg');
    const file65Brain = path.join(brainDir, 'boyo_65g_poster.jpg');
    await page.screenshot({ path: file65Public, type: 'jpeg', quality: 96 });
    await page.screenshot({ path: file65Brain, type: 'jpeg', quality: 96 });
    console.log("Poster 1 rendered: boyo_65g_poster.jpg");

    // =========================================================================
    // POSTER 2: BOYO 1KG - HORECA & RESTAURANT (Foodservice & Kitchen Standard)
    // =========================================================================
    console.log("Building Poster 2: BOYO 1KG (Horeca & Fast Food)...");
    const html1kg = `<!DOCTYPE html>
    <html lang="vi">
    <head>
    <meta charset="UTF-8">
    <style>
        ${commonStyles}

        /* 1kg Staging Shadows */
        .shadow-1kg-main {
            position: absolute;
            bottom: 45px;
            right: 90px;
            width: 380px;
            height: 35px;
            background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.38) 0%, rgba(0, 77, 71, 0.08) 55%, transparent 75%);
            z-index: 10;
        }
        .shadow-dish-front {
            position: absolute;
            bottom: 8px;
            right: 170px;
            width: 340px;
            height: 28px;
            background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
            z-index: 20;
        }

        /* Main 1kg Pouch - Tall, Majestic Hero */
        .pack-1kg-hero {
            position: absolute;
            bottom: 60px;
            right: 70px;
            width: 410px;
            height: 560px;
            z-index: 15;
            filter: drop-shadow(0 25px 35px rgba(0, 77, 71, 0.22));
        }
        .pack-1kg-hero img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Crispy Fries & Chicken Popcorn Dish in front */
        .dish-horeca {
            position: absolute;
            bottom: 15px;
            right: 160px;
            width: 350px;
            z-index: 25;
            filter: drop-shadow(0 18px 25px rgba(0, 0, 0, 0.28));
        }
        .dish-horeca img {
            width: 100%;
            object-fit: contain;
        }

        /* Horeca Benefit Badges */
        .horeca-badge {
            position: absolute;
            top: 25px;
            right: 50px;
            background: #FFFFFF;
            border: 2px solid #00A396;
            border-radius: 40px;
            padding: 8px 18px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 20px rgba(0, 163, 150, 0.12);
            z-index: 30;
        }
        .horeca-badge span {
            font-size: 14px;
            font-weight: 800;
            color: #006E65;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
    </head>
    <body>
        <div class="bg-grid"></div>
        <div class="organic-mint-shape"></div>
        <div class="cheese-warm-glow"></div>

        <div class="canvas-container">
            <!-- Header -->
            <div class="header-box">
                <img class="header-logo" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
            </div>

            <!-- Main Layout -->
            <div class="main-layout">
                <div class="left-editorial">
                    <div class="product-code">BOYO 1KG</div>
                    <div class="green-bar"></div>

                    <div class="headline-stacked">
                        CHUẨN VỊ<br>
                        HORECA<br>
                        TỐI ƯU GIÁ
                    </div>

                    <div class="spec-subline">
                        TÚI ZIP TIỆN LỢI • BÁM DÍNH 360°
                    </div>

                    <div class="channel-desc">
                        Gợi ý cho gà rán, khoai tây lắc,<br>
                        quán ăn vặt, nhà hàng & bếp trung tâm
                    </div>

                    <div class="bottom-green-bar"></div>

                    <div class="wholesale-title">
                        CHIẾT KHẤU CAO • SỈ TOÀN QUỐC
                    </div>
                </div>

                <div class="right-staging">
                    <!-- Floor shadows -->
                    <div class="shadow-1kg-main"></div>
                    <div class="shadow-dish-front"></div>

                    <!-- Top Badge -->
                    <div class="horeca-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#00A396"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        <span>Chỉ ~800đ / Khẩu Phần</span>
                    </div>

                    <!-- 1kg Hero Pack -->
                    <div class="pack-1kg-hero">
                        <img src="${cutouts.cut1k}" alt="BOYO 1kg">
                    </div>

                    <!-- Delicious Dish in Front -->
                    <div class="dish-horeca">
                        <img src="${cutouts.cutDish}" alt="Gà lắc & khoai tây lắc phô mai BOYO">
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer-bar">
                <div class="footer-links">
                    <div class="contact-col">
                        <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        0969 069 798
                    </div>
                    <span class="footer-sep">|</span>
                    <div class="contact-col">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        lyhu.vn • lyhu.com.vn
                    </div>
                    <span class="footer-sep">|</span>
                    <div class="contact-col">
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

    await page.setContent(html1kg, { waitUntil: 'networkidle0' });
    const file1kPublic = path.join(publicDir, 'boyo_1kg_poster.jpg');
    const file1kBrain = path.join(brainDir, 'boyo_1kg_poster.jpg');
    await page.screenshot({ path: file1kPublic, type: 'jpeg', quality: 96 });
    await page.screenshot({ path: file1kBrain, type: 'jpeg', quality: 96 });
    console.log("Poster 2 rendered: boyo_1kg_poster.jpg");

    // =========================================================================
    // POSTER 3: BOYO MASTER (65G & 1KG MASTER SHOWCASE)
    // =========================================================================
    console.log("Building Poster 3: BOYO MASTER (65G & 1KG Duo)...");
    const htmlMaster = `<!DOCTYPE html>
    <html lang="vi">
    <head>
    <meta charset="UTF-8">
    <style>
        ${commonStyles}

        /* Staging Shadows */
        .shadow-1k {
            position: absolute;
            bottom: 75px;
            right: 40px;
            width: 370px;
            height: 32px;
            background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.32) 0%, rgba(0, 77, 71, 0.06) 55%, transparent 75%);
            z-index: 6;
        }
        .shadow-65 {
            position: absolute;
            bottom: 45px;
            right: 210px;
            width: 320px;
            height: 30px;
            background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.35) 0%, rgba(0, 77, 71, 0.08) 55%, transparent 75%);
            z-index: 12;
        }
        .shadow-cheese {
            position: absolute;
            bottom: 12px;
            right: 25px;
            width: 270px;
            height: 24px;
            background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
            z-index: 22;
        }

        /* 1kg Back */
        .pack-1k-stage {
            position: absolute;
            bottom: 95px;
            right: 35px;
            width: 385px;
            height: 540px;
            z-index: 8;
            transform: rotate(4deg);
            filter: drop-shadow(0 20px 28px rgba(0, 77, 71, 0.18));
        }
        .pack-1k-stage img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* 65g Front */
        .pack-65-stage {
            position: absolute;
            bottom: 60px;
            right: 200px;
            width: 330px;
            height: 480px;
            z-index: 15;
            transform: rotate(-4deg);
            filter: drop-shadow(0 22px 30px rgba(0, 77, 71, 0.22));
        }
        .pack-65-stage img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Cheese Wedge in foreground */
        .cheese-foreground {
            position: absolute;
            bottom: 18px;
            right: 20px;
            width: 280px;
            z-index: 25;
            filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.24));
        }
        .cheese-foreground img {
            width: 100%;
            object-fit: contain;
        }

        /* Master Tag */
        .master-badge {
            position: absolute;
            top: 25px;
            right: 50px;
            background: #FFFFFF;
            border: 2px solid #8DC63F;
            border-radius: 40px;
            padding: 8px 18px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 20px rgba(0, 163, 150, 0.12);
            z-index: 30;
        }
        .master-badge span {
            font-size: 14px;
            font-weight: 800;
            color: #006E65;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
    </head>
    <body>
        <div class="bg-grid"></div>
        <div class="organic-mint-shape"></div>
        <div class="cheese-warm-glow"></div>

        <div class="canvas-container">
            <!-- Header -->
            <div class="header-box">
                <img class="header-logo" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
            </div>

            <!-- Main Layout -->
            <div class="main-layout">
                <div class="left-editorial">
                    <div class="product-code">BOYO</div>
                    <div class="green-bar"></div>

                    <div class="headline-stacked">
                        RẮC LÀ MÊ<br>
                        ĐẬM VỊ BÁN
                    </div>

                    <div class="spec-subline">
                        2 QUY CÁCH • PHỦ MỌI KÊNH BÁN
                    </div>

                    <div class="channel-desc">
                        Gợi ý cho tạp hóa, siêu thị mini,<br>
                        quán ăn vặt, gà rán và Horeca
                    </div>

                    <div class="bottom-green-bar"></div>

                    <div class="wholesale-title">
                        PHÂN PHỐI SỈ TOÀN QUỐC
                    </div>
                </div>

                <div class="right-staging">
                    <!-- Floor shadows -->
                    <div class="shadow-1k"></div>
                    <div class="shadow-65"></div>
                    <div class="shadow-cheese"></div>

                    <!-- Top Badge -->
                    <div class="master-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#8DC63F"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span>Gia Vị Rắc Hàng Đầu</span>
                    </div>

                    <!-- Packs -->
                    <div class="pack-1k-stage">
                        <img src="${cutouts.cut1k}" alt="BOYO 1kg">
                    </div>
                    <div class="pack-65-stage">
                        <img src="${cutouts.cut65}" alt="BOYO 65g">
                    </div>

                    <!-- Foreground Cheese & Fries -->
                    <div class="cheese-foreground">
                        <img src="${cutouts.cutCheese}" alt="Phô mai vàng rắc BOYO">
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer-bar">
                <div class="footer-links">
                    <div class="contact-col">
                        <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        0969 069 798
                    </div>
                    <span class="footer-sep">|</span>
                    <div class="contact-col">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        lyhu.vn • lyhu.com.vn
                    </div>
                    <span class="footer-sep">|</span>
                    <div class="contact-col">
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

    await page.setContent(htmlMaster, { waitUntil: 'networkidle0' });
    const fileMasterPublic = path.join(publicDir, 'boyo_master_poster_v3.jpg');
    const fileMasterBrain = path.join(brainDir, 'boyo_master_poster_v3.jpg');
    await page.screenshot({ path: fileMasterPublic, type: 'jpeg', quality: 96 });
    await page.screenshot({ path: fileMasterBrain, type: 'jpeg', quality: 96 });
    console.log("Poster 3 rendered: boyo_master_poster_v3.jpg");

    await browser.close();
    console.log("=== ALL POSTERS RENDERED AT 2400x2400 RETINA QUALITY ===");
}

renderAllStandardPosters().catch(console.error);
