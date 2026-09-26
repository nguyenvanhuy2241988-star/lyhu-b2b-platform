const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderV2() {
    console.log("Starting Master Poster V2 (Pro FMCG Trade Design)...");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const pack65gRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const pack1kgRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Precise background removal for crisp transparent cutouts
    console.log("Processing transparent product cutouts...");
    const { cut65g, cut1kg } = await page.evaluate(async (raw65, raw1k) => {
        function removeWhiteBg(base64) {
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
                        return d[idx] >= 244 && d[idx + 1] >= 244 && d[idx + 2] >= 244;
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
            cut65g: await removeWhiteBg(raw65),
            cut1kg: await removeWhiteBg(raw1k)
        };
    }, pack65gRaw, pack1kgRaw);

    // 2. High-Impact FMCG Trade Poster Layout (Bold, Huge Typography, Big Logo)
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

    /* Mint Grid Pattern (from CVT Poster) */
    .bg-grid {
        position: absolute;
        top: 0;
        right: 0;
        width: 650px;
        height: 650px;
        background-size: 36px 36px;
        background-image: 
            linear-gradient(to right, rgba(0, 163, 150, 0.12) 2px, transparent 2px),
            linear-gradient(to bottom, rgba(0, 163, 150, 0.12) 2px, transparent 2px);
        z-index: 1;
        mask-image: radial-gradient(circle at top right, black 40%, transparent 80%);
    }

    /* Giant Vibrant Cheese Warm Sunburst Background */
    .sunburst-glow {
        position: absolute;
        top: 100px;
        right: -60px;
        width: 820px;
        height: 860px;
        background: radial-gradient(circle at 60% 45%, #FFE9B3 0%, #FFF3D6 45%, rgba(255, 255, 255, 0) 75%);
        border-radius: 50%;
        z-index: 2;
    }

    .brand-diagonal-bar {
        position: absolute;
        bottom: 86px;
        right: 0;
        width: 680px;
        height: 480px;
        background: linear-gradient(135deg, rgba(0, 163, 150, 0.05) 0%, rgba(141, 198, 63, 0.08) 100%);
        border-radius: 160px 0 0 0;
        z-index: 2;
    }

    /* Main Container */
    .container {
        position: relative;
        z-index: 10;
        width: 1200px;
        height: 1200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    /* Header Bar: GIANT LOGO */
    .header-bar {
        padding: 44px 50px 0 50px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .logo-img {
        height: 100px; /* GIANT LOGO as requested */
        object-fit: contain;
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.05));
    }
    .badge-iso {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #FFFFFF;
        border: 2px solid #00A396;
        color: #008075;
        padding: 12px 26px;
        border-radius: 50px;
        font-weight: 800;
        font-size: 18px; /* Bigger font */
        box-shadow: 0 6px 20px rgba(0, 163, 150, 0.12);
    }

    /* Content Area */
    .content-area {
        padding: 0 50px;
        display: flex;
        flex: 1;
        align-items: center;
        position: relative;
    }

    /* Left Copy Column: BIG PUNCHY IMPACT */
    .left-col {
        width: 530px;
        display: flex;
        flex-direction: column;
        z-index: 20;
    }

    .brand-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 800;
        color: #008075;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 10px;
    }
    .brand-eyebrow::before {
        content: '';
        width: 32px;
        height: 4px;
        background: #00A396;
        border-radius: 4px;
    }

    /* HUGE TITLE */
    .hero-title {
        font-size: 88px; /* GIGANTIC TITLE */
        font-weight: 900;
        line-height: 0.98;
        color: #008075;
        letter-spacing: -2px;
        text-transform: uppercase;
    }
    .hero-category {
        font-size: 42px;
        font-weight: 900;
        line-height: 1.1;
        color: #7CB518;
        text-transform: uppercase;
        margin-top: 6px;
        letter-spacing: -0.5px;
    }

    /* Slogan Banner Pill */
    .slogan-banner {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #FF6B00 0%, #FF8800 100%);
        color: #FFFFFF;
        font-size: 26px;
        font-weight: 900;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 10px 24px;
        border-radius: 40px;
        margin-top: 14px;
        margin-bottom: 30px;
        box-shadow: 0 8px 22px rgba(255, 107, 0, 0.3);
        align-self: flex-start;
    }

    /* BOLD SPECIFICATION CARDS (Clean, High Contrast, Large Text) */
    .spec-cards {
        display: flex;
        flex-direction: column;
        gap: 18px;
        margin-bottom: 28px;
    }

    .spec-card {
        background: #FFFFFF;
        border-radius: 18px;
        padding: 18px 22px;
        border: 2px solid #E2E8F0;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .spec-card.retail {
        border-left: 8px solid #FF9800;
        background: linear-gradient(90deg, #FFFDF8 0%, #FFFFFF 100%);
    }
    .spec-card.horeca {
        border-left: 8px solid #00A396;
        background: linear-gradient(90deg, #F8FCFB 0%, #FFFFFF 100%);
    }

    .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .card-badge {
        font-size: 15px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 4px 12px;
        border-radius: 6px;
    }
    .badge-retail-tag {
        background: #FFEED9;
        color: #C2410C;
    }
    .badge-horeca-tag {
        background: #DDF4F1;
        color: #00766B;
    }

    .card-title {
        font-size: 26px; /* BIG & CLEAR */
        font-weight: 900;
        color: #0F172A;
        margin-top: 4px;
    }
    .card-spec {
        font-size: 20px; /* HIGHLY READABLE */
        font-weight: 800;
        color: #008075;
        margin-top: 2px;
    }
    .spec-card.retail .card-spec {
        color: #D97706;
    }
    .card-note {
        font-size: 16px;
        font-weight: 600;
        color: #64748B;
        margin-top: 2px;
    }

    /* BIG HOTLINE CALLOUT */
    .b2b-action-row {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .cta-text-bold {
        font-size: 26px;
        font-weight: 900;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Right Column: GIANT 3D PACKAGES */
    .right-col {
        flex: 1;
        height: 750px;
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }

    /* Giant 1kg Bag (Standing proud in background) */
    .bag-1kg-wrap {
        position: absolute;
        right: 20px;
        bottom: 30px;
        width: 440px; /* ENLARGED */
        height: 650px;
        z-index: 10;
        filter: drop-shadow(0 35px 50px rgba(0, 0, 0, 0.22));
        transform: rotate(2deg);
    }
    .bag-1kg-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* Giant 65g Bag (Standing dynamic in foreground) */
    .bag-65g-wrap {
        position: absolute;
        right: 260px;
        bottom: 10px;
        width: 380px; /* ENLARGED */
        height: 550px;
        z-index: 15;
        filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.28));
        transform: rotate(-5deg);
    }
    .bag-65g-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* Floating Giant Tags */
    .float-tag {
        position: absolute;
        background: #FFFFFF;
        padding: 10px 22px;
        border-radius: 14px;
        font-weight: 900;
        font-size: 18px;
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
        z-index: 25;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 2.5px solid transparent;
    }
    .float-tag.tag-65g {
        left: -30px;
        top: 60px;
        border-color: #FF9800;
        color: #C2410C;
        transform: rotate(5deg);
    }
    .float-tag.tag-1kg {
        right: -10px;
        top: 40px;
        border-color: #00A396;
        color: #008075;
        transform: rotate(-3deg);
    }

    /* Floor Contact Shadow */
    .floor-shadow {
        position: absolute;
        bottom: 5px;
        right: 40px;
        width: 620px;
        height: 50px;
        background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.08) 55%, transparent 75%);
        z-index: 5;
    }

    /* Footer Bar: BIG, BOLD, HIGH CONTRAST */
    .footer-bar {
        height: 88px; /* TALLER FOOTER */
        background: #00A396;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 50px;
        color: #FFFFFF;
        z-index: 30;
    }
    .footer-truck {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 22px; /* BIGGER */
        font-weight: 900;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    .footer-links {
        display: flex;
        align-items: center;
        gap: 36px;
    }
    .footer-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 19px;
        font-weight: 700;
    }
    .footer-item strong {
        font-size: 26px; /* MASSIVE PHONE NUMBER */
        font-weight: 900;
        letter-spacing: 0.5px;
    }
</style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="sunburst-glow"></div>
    <div class="brand-diagonal-bar"></div>

    <div class="container">
        <!-- Header -->
        <div class="header-bar">
            <img class="logo-img" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
            <div class="badge-iso">
                ★ 100% NGUYÊN LIỆU ÚC • ISO 22000
            </div>
        </div>

        <!-- Content Area -->
        <div class="content-area">
            <!-- Left Info Column -->
            <div class="left-col">
                <div class="brand-eyebrow">DÒNG GIA VỊ BỘT LẮC CAO CẤP</div>
                <h1 class="hero-title">BOYO</h1>
                <div class="hero-category">BỘT PHÔ MAI TRUYỀN THỐNG</div>
                
                <div class="slogan-banner">
                    RẮC CẢ THẾ GIỚI ✨
                </div>

                <div class="spec-cards">
                    <!-- 65g Card -->
                    <div class="spec-card retail">
                        <div class="card-top">
                            <span class="card-title">GÓI 65G TIỆN LỢI</span>
                            <span class="card-badge badge-retail-tag">SIÊU THỊ • TẠP HÓA</span>
                        </div>
                        <div class="card-spec">HỘP 10 GÓI • THÙNG 6 HỘP (60 GÓI)</div>
                        <div class="card-note">Túi zip nổi bật, vốn nhẹ, bán cực chạy tại quầy thu ngân</div>
                    </div>

                    <!-- 1kg Card -->
                    <div class="spec-card horeca">
                        <div class="card-top">
                            <span class="card-title">TÚI 1KG CHUYÊN DỤNG</span>
                            <span class="card-badge badge-horeca-tag">NHÀ HÀNG • HORECA</span>
                        </div>
                        <div class="card-spec">TỐI ƯU COST 800Đ/SUẤT • BÁM DÍNH 360°</div>
                        <div class="card-note">Bao bạc chống ẩm, hạt mịn tơi không hao, chuẩn vị quán lớn</div>
                    </div>
                </div>

                <div class="b2b-action-row">
                    <span class="cta-text-bold">🚀 ĐỒNG HÀNH & PHÁT TRIỂN CÙNG ĐIỂM BÁN</span>
                </div>
            </div>

            <!-- Right Staging Column -->
            <div class="right-col">
                <div class="floor-shadow"></div>

                <!-- 1kg Bag -->
                <div class="bag-1kg-wrap">
                    <div class="float-tag tag-1kg">
                        🏷️ GÓI 1KG HORECA
                    </div>
                    <img class="bag-1kg-img" src="${cut1kg}" alt="BOYO 1kg">
                </div>

                <!-- 65g Bag -->
                <div class="bag-65g-wrap">
                    <div class="float-tag tag-65g">
                        ⭐ GÓI 65G BÁN LẺ
                    </div>
                    <img class="bag-65g-img" src="${cut65g}" alt="BOYO 65g">
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-bar">
            <div class="footer-truck">
                🚚 PHÂN PHỐI SỈ TOÀN QUỐC
            </div>
            <div class="footer-links">
                <div class="footer-item">
                    📞 Hotline: <strong>0969 069 798</strong>
                </div>
                <div class="footer-item">
                    🌐 <strong>lyhu.vn • lyhu.com.vn</strong>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    console.log("Rendering V2 Master Poster at 2400x2400...");
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(masterHtml, { waitUntil: 'networkidle0' });

    const outBrain = path.join(brainDir, 'boyo_master_poster_v2.jpg');
    const outPublic = path.join(process.cwd(), 'public', 'boyo_master_poster_v2.jpg');

    await page.screenshot({ path: outBrain, type: 'jpeg', quality: 96 });
    await page.screenshot({ path: outPublic, type: 'jpeg', quality: 96 });

    await browser.close();
    console.log("V2 Master poster rendered successfully to:", outPublic);
}

renderV2().catch(console.error);
