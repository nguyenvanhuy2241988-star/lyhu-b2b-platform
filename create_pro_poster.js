const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderProPoster() {
    console.log("Starting Pro FMCG Poster Generation (Strict CVT-style Masterpiece)...");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const pack65gRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const pack1kgRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');
    const foodDishRaw = fs.readFileSync(path.join(brainDir, 'cheese_fries_dish_1789922977796.jpg')).toString('base64');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Remove background from all 3 assets (65g, 1kg, and food dish)
    console.log("Removing backgrounds for seamless 3D staging...");
    const { cut65g, cut1kg, cutDish } = await page.evaluate(async (raw65, raw1k, rawDish) => {
        function removeWhiteBg(base64, threshold = 245) {
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

                    const visited = new Uint8Array(w * h);
                    const queue = [];

                    function isBg(idx) {
                        return d[idx] >= threshold && d[idx + 1] >= threshold && d[idx + 2] >= threshold;
                    }

                    for (let x = 0; x < w; x++) {
                        queue.push(x, 0);
                        queue.push(x, h - 1);
                        visited[x] = 1;
                        visited[(h - 1) * w + x] = 1;
                    }
                    for (let y = 0; y < h; y++) {
                        queue.push(0, y);
                        queue.push(w - 1, y);
                        visited[y * w] = 1;
                        visited[y * w + (w - 1)] = 1;
                    }

                    let head = 0;
                    while (head < queue.length) {
                        const cx = queue[head++];
                        const cy = queue[head++];
                        const pIdx = (cy * w + cx) * 4;

                        if (isBg(pIdx)) {
                            d[pIdx + 3] = 0;

                            const neighbors = [
                                [cx + 1, cy],
                                [cx - 1, cy],
                                [cx, cy + 1],
                                [cx, cy - 1]
                            ];

                            for (let i = 0; i < 4; i++) {
                                const nx = neighbors[i][0];
                                const ny = neighbors[i][1];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    const nPos = ny * w + nx;
                                    if (!visited[nPos]) {
                                        visited[nPos] = 1;
                                        if (isBg(nPos * 4)) {
                                            queue.push(nx, ny);
                                        }
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
            cut65g: await removeWhiteBg(raw65, 244),
            cut1kg: await removeWhiteBg(raw1k, 244),
            cutDish: await removeWhiteBg(rawDish, 242)
        };
    }, pack65gRaw, pack1kgRaw, foodDishRaw);

    console.log("Assets processed. Building pure CVT-style editorial layout...");

    const masterHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');
    
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
    }

    /* Grid pattern in background like CVT poster (top right) */
    .bg-grid {
        position: absolute;
        top: 0;
        right: 0;
        width: 600px;
        height: 600px;
        background-size: 32px 32px;
        background-image: 
            linear-gradient(to right, rgba(0, 163, 150, 0.12) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(0, 163, 150, 0.12) 1.5px, transparent 1.5px);
        z-index: 1;
        mask-image: radial-gradient(circle at top right, black 30%, transparent 75%);
    }

    /* Large organic background shape on the right (like CVT poster's soft mint/cream shape) */
    .brand-organic-bg {
        position: absolute;
        top: 80px;
        right: 0;
        width: 720px;
        height: 1000px;
        background: linear-gradient(145deg, #F0F9F7 0%, #E8F5F2 100%);
        border-radius: 180px 0 0 120px;
        z-index: 2;
    }

    /* Subtle cheese glow inside the organic shape */
    .cheese-glow {
        position: absolute;
        top: 250px;
        right: 50px;
        width: 550px;
        height: 550px;
        background: radial-gradient(circle, rgba(255, 220, 140, 0.3) 0%, rgba(255, 245, 210, 0.1) 60%, transparent 80%);
        border-radius: 50%;
        z-index: 3;
    }

    /* Full Layout Container */
    .container {
        position: relative;
        z-index: 10;
        width: 1200px;
        height: 1200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 50px 60px 30px 60px;
    }

    /* Top Left: HUGE PROMINENT LOGO (Exact CVT layout) */
    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
    }
    .logo-img {
        height: 85px;
        object-fit: contain;
    }

    /* Main Poster Body (Split Layout: 42% Left Text, 58% Right Visual) */
    .main-section {
        display: flex;
        align-items: center;
        flex: 1;
        margin-top: 10px;
        position: relative;
    }

    /* Left Copy Column: PURE CVT EDITORIAL STYLE */
    .left-col {
        width: 440px;
        display: flex;
        flex-direction: column;
        z-index: 20;
    }

    /* Line 1: Product Code Name */
    .brand-title {
        font-size: 68px;
        font-weight: 900;
        color: #006E65;
        letter-spacing: -1px;
        line-height: 1;
        text-transform: uppercase;
    }

    /* Green line separator */
    .green-divider {
        width: 76px;
        height: 4px;
        background: #8DC63F;
        margin-top: 14px;
        margin-bottom: 22px;
        border-radius: 2px;
    }

    /* Big Punchy Slogan: Stacked, Heavy, Tight Leading */
    .headline-stacked {
        font-size: 52px;
        font-weight: 900;
        line-height: 1.08;
        color: #004D47;
        text-transform: uppercase;
        letter-spacing: -0.5px;
        margin-bottom: 28px;
    }

    /* Subline: 2 Quy Cách • Phủ Mọi Kênh Bán */
    .subline-tag {
        font-size: 22px;
        font-weight: 800;
        color: #004D47;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
    }

    /* Recommendation Text */
    .target-desc {
        font-size: 19px;
        font-weight: 600;
        line-height: 1.45;
        color: #4A6966;
        margin-bottom: 30px;
    }

    /* Bottom Divider & Wholesale Line */
    .bottom-divider {
        width: 76px;
        height: 4px;
        background: #8DC63F;
        margin-bottom: 18px;
        border-radius: 2px;
    }
    .wholesale-callout {
        font-size: 22px;
        font-weight: 900;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    /* Right Staging Column (Hero Product & Food Scene) */
    .right-col {
        flex: 1;
        height: 780px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Floor Contact Shadows */
    .floor-shadow-back {
        position: absolute;
        bottom: 110px;
        right: 40px;
        width: 380px;
        height: 35px;
        background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.28) 0%, rgba(0, 77, 71, 0.05) 50%, transparent 75%);
        z-index: 5;
    }
    .floor-shadow-front {
        position: absolute;
        bottom: 70px;
        right: 210px;
        width: 340px;
        height: 35px;
        background: radial-gradient(ellipse at center, rgba(0, 77, 71, 0.32) 0%, rgba(0, 77, 71, 0.06) 50%, transparent 75%);
        z-index: 12;
    }
    .floor-shadow-dish {
        position: absolute;
        bottom: 10px;
        right: 30px;
        width: 440px;
        height: 40px;
        background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 75%);
        z-index: 18;
    }

    /* 1kg Bag (Standing in back, slightly to the right) */
    .bag-1kg {
        position: absolute;
        right: 30px;
        bottom: 130px;
        width: 410px;
        height: 600px;
        z-index: 10;
        filter: drop-shadow(0 25px 35px rgba(0, 77, 71, 0.18));
    }
    .bag-1kg img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* 65g Bag (Standing in front, overlapping 1kg bag) */
    .bag-65g {
        position: absolute;
        right: 220px;
        bottom: 90px;
        width: 340px;
        height: 500px;
        z-index: 15;
        filter: drop-shadow(0 22px 30px rgba(0, 77, 71, 0.22));
    }
    .bag-65g img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* Appetizing Food Dish (Positioned at bottom right in front of the bags) */
    .food-dish {
        position: absolute;
        right: 20px;
        bottom: 25px;
        width: 450px;
        z-index: 25;
        filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.25));
    }
    .food-dish img {
        width: 100%;
        object-fit: contain;
    }

    /* Clean Footer Line (Exact match with CVT poster) */
    .footer-section {
        border-top: 1.5px solid #E2E8F0;
        padding-top: 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 17px;
        font-weight: 700;
        color: #004D47;
    }
    .footer-contacts {
        display: flex;
        align-items: center;
        gap: 36px;
    }
    .contact-item {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .contact-item svg {
        width: 20px;
        height: 20px;
        fill: #00A396;
    }

    /* 3x3 Dot Grid Accent on bottom-right (exact CVT detail) */
    .dot-grid {
        display: grid;
        grid-template-columns: repeat(4, 7px);
        gap: 6px;
    }
    .dot-grid div {
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
    <div class="brand-organic-bg"></div>
    <div class="cheese-glow"></div>

    <div class="container">
        <!-- Top Header: Huge LYHU Logo -->
        <div class="header-section">
            <img class="logo-img" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
        </div>

        <!-- Main Body: Split Editorial Style -->
        <div class="main-section">
            <!-- Left Editorial Text (CVT Poster Copy Style) -->
            <div class="left-col">
                <div class="brand-title">BOYO</div>
                <div class="green-divider"></div>
                
                <div class="headline-stacked">
                    RẮC LÀ MÊ<br>
                    ĐẬM VỊ BÁN
                </div>

                <div class="subline-tag">
                    2 QUY CÁCH • PHỦ MỌI KÊNH BÁN
                </div>

                <div class="target-desc">
                    Gợi ý cho tạp hóa, siêu thị mini,<br>
                    quán ăn vặt, gà rán và Horeca
                </div>

                <div class="bottom-divider"></div>

                <div class="wholesale-callout">
                    PHÂN PHỐI SỈ TOÀN QUỐC
                </div>
            </div>

            <!-- Right Visual Area: Bags + Food Dish Staging -->
            <div class="right-col">
                <!-- Contact Shadows -->
                <div class="floor-shadow-back"></div>
                <div class="floor-shadow-front"></div>
                <div class="floor-shadow-dish"></div>

                <!-- 1kg Bag -->
                <div class="bag-1kg">
                    <img src="${cut1kg}" alt="BOYO 1kg">
                </div>

                <!-- 65g Bag -->
                <div class="bag-65g">
                    <img src="${cut65g}" alt="BOYO 65g">
                </div>

                <!-- Appetizing Food Dish -->
                <div class="food-dish">
                    <img src="${cutDish}" alt="Khoai tây lắc phô mai BOYO">
                </div>
            </div>
        </div>

        <!-- Clean Editorial Footer (CVT Style) -->
        <div class="footer-section">
            <div class="footer-contacts">
                <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    0969 069 798
                </div>
                <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    lyhu.vn • lyhu.com.vn
                </div>
                <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    lyhu.vn@gmail.com
                </div>
            </div>

            <div class="dot-grid">
                <div></div><div></div><div></div><div></div>
                <div></div><div></div><div></div><div></div>
                <div></div><div></div><div></div><div></div>
            </div>
        </div>
    </div>
</body>
</html>`;

    console.log("Rendering Pro Poster at 2400x2400...");
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(masterHtml, { waitUntil: 'networkidle0' });

    const outBrain = path.join(brainDir, 'boyo_pro_poster.jpg');
    const outPublic = path.join(process.cwd(), 'public', 'boyo_pro_poster.jpg');

    await page.screenshot({ path: outBrain, type: 'jpeg', quality: 96 });
    await page.screenshot({ path: outPublic, type: 'jpeg', quality: 96 });

    await browser.close();
    console.log("Pro poster rendered successfully to:", outPublic);
}

renderProPoster().catch(console.error);
