const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function createMasterPoster() {
    console.log("Starting Master Poster creation...");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const pack65gRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const pack1kgRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Convert both raw JPGs into transparent PNGs using flood-fill from edges
    console.log("Removing background from product photos to make transparent PNGs...");
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

                    // BFS Flood fill from corners
                    const visited = new Uint8Array(w * h);
                    const queue = [];

                    function isBg(idx) {
                        return d[idx] >= 245 && d[idx + 1] >= 245 && d[idx + 2] >= 245;
                    }

                    // Add all edge pixels
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
                            d[pIdx + 3] = 0; // Make transparent

                            // Check 4 neighbors
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

    console.log("Background removed successfully!");

    // 2. Build the high-end editorial FMCG layout (matching CVT/UHI style)
    const masterHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
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

    /* Grid pattern in background like CVT poster */
    .bg-grid {
        position: absolute;
        top: 0;
        right: 0;
        width: 550px;
        height: 550px;
        background-size: 30px 30px;
        background-image: 
            linear-gradient(to right, rgba(0, 163, 150, 0.1) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(0, 163, 150, 0.1) 1.5px, transparent 1.5px);
        z-index: 1;
        mask-image: radial-gradient(circle at top right, black 35%, transparent 75%);
    }

    /* Elegant organic backdrop curve on the right for products (warm cream / soft cheese gold) */
    .product-backdrop-glow {
        position: absolute;
        top: 140px;
        right: -80px;
        width: 760px;
        height: 880px;
        background: radial-gradient(ellipse at center, #FFF5DE 0%, #FFF9EC 55%, rgba(255, 255, 255, 0) 80%);
        border-radius: 50% 40% 50% 40%;
        z-index: 2;
        transform: rotate(-8deg);
    }

    /* Soft curved organic shape like CVT poster */
    .brand-curve {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 700px;
        height: 550px;
        background: linear-gradient(135deg, rgba(0, 163, 150, 0.04) 0%, rgba(141, 198, 63, 0.06) 100%);
        border-radius: 120px 0 0 0;
        z-index: 2;
    }

    /* Full Layout Container */
    .poster-container {
        position: relative;
        z-index: 10;
        width: 1200px;
        height: 1200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    /* Top Header */
    .header-bar {
        padding: 44px 50px 0 50px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .logo-box {
        display: flex;
        align-items: center;
    }
    .logo-img {
        height: 66px;
        object-fit: contain;
    }

    .header-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #FFFFFF;
        border: 1.5px solid #00A396;
        color: #008075;
        padding: 9px 20px;
        border-radius: 40px;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 15px rgba(0, 163, 150, 0.08);
    }

    /* Middle Main Content */
    .main-body {
        padding: 0 50px;
        display: flex;
        flex: 1;
        align-items: center;
        position: relative;
    }

    /* Left Info Column (CVT Layout Style) */
    .left-col {
        width: 480px;
        display: flex;
        flex-direction: column;
        z-index: 20;
    }

    .brand-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 800;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 8px;
    }
    .brand-tag::before {
        content: '';
        width: 24px;
        height: 3px;
        background: #00A396;
        border-radius: 2px;
    }

    .hero-title {
        font-size: 68px;
        font-weight: 900;
        line-height: 1.05;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: -1px;
    }
    .hero-subtitle {
        font-size: 34px;
        font-weight: 900;
        line-height: 1.15;
        color: #0F172A;
        text-transform: uppercase;
        margin-top: 6px;
        margin-bottom: 22px;
    }
    .hero-subtitle span {
        color: #7CB518;
    }

    /* Key Spec Badges */
    .spec-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 30px;
    }

    .spec-item {
        display: flex;
        align-items: flex-start;
        gap: 14px;
    }
    .spec-bullet {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #00A396;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 900;
        flex-shrink: 0;
        margin-top: 2px;
        box-shadow: 0 4px 8px rgba(0, 163, 150, 0.25);
    }
    .spec-bullet.orange {
        background: #F59E0B;
        box-shadow: 0 4px 8px rgba(245, 158, 11, 0.25);
    }
    .spec-text {
        display: flex;
        flex-direction: column;
    }
    .spec-title {
        font-size: 17px;
        font-weight: 800;
        color: #0F172A;
        line-height: 1.3;
    }
    .spec-detail {
        font-size: 14px;
        font-weight: 600;
        color: #64748B;
        margin-top: 2px;
        line-height: 1.4;
    }

    /* Highlight Feature Pills */
    .features-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 26px;
    }
    .pill-item {
        background: #F1F5F9;
        border: 1px solid #E2E8F0;
        padding: 6px 14px;
        border-radius: 30px;
        font-size: 13px;
        font-weight: 700;
        color: #334155;
    }

    .cta-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 900;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        position: relative;
        padding-top: 14px;
    }
    .cta-banner::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 140px;
        height: 3px;
        background: #00A396;
    }

    /* Right Staging Column (Floating Real Products) */
    .right-col {
        flex: 1;
        height: 720px;
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }

    /* 1kg Bag (Standing in background, slightly turned) */
    .bag-1kg-wrap {
        position: absolute;
        right: 40px;
        bottom: 40px;
        width: 380px;
        height: 570px;
        z-index: 10;
        filter: drop-shadow(0 30px 45px rgba(0, 0, 0, 0.16));
        transform: rotate(2deg);
    }
    .bag-1kg-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* 65g Bag (Standing in foreground, hero position) */
    .bag-65g-wrap {
        position: absolute;
        right: 240px;
        bottom: 20px;
        width: 330px;
        height: 480px;
        z-index: 15;
        filter: drop-shadow(0 25px 35px rgba(0, 0, 0, 0.22));
        transform: rotate(-5deg);
    }
    .bag-65g-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* Product callout tags attached to bags */
    .tag-callout {
        position: absolute;
        background: #FFFFFF;
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 13.5px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        z-index: 25;
        border: 1.5px solid transparent;
    }
    .tag-callout.for-65g {
        left: -30px;
        top: 40px;
        border-color: #F59E0B;
        color: #B45309;
        transform: rotate(4deg);
    }
    .tag-callout.for-1kg {
        right: -10px;
        top: 30px;
        border-color: #00A396;
        color: #008075;
        transform: rotate(-3deg);
    }

    /* Realistic Contact Shadow on floor */
    .ground-shadow {
        position: absolute;
        bottom: 10px;
        right: 60px;
        width: 580px;
        height: 40px;
        background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.05) 50%, transparent 75%);
        z-index: 5;
    }

    /* Footer Bar (Exact match with CVT/UHI) */
    .footer-bar {
        height: 72px;
        background: #00A396;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 50px;
        color: #FFFFFF;
        font-weight: 600;
        font-size: 14.5px;
        z-index: 30;
    }
    .footer-col-left {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .footer-col-right {
        display: flex;
        align-items: center;
        gap: 28px;
    }
    .contact-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .contact-item strong {
        font-weight: 800;
        font-size: 16px;
        letter-spacing: 0.5px;
    }
</style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="product-backdrop-glow"></div>
    <div class="brand-curve"></div>

    <div class="poster-container">
        <!-- Header -->
        <div class="header-bar">
            <div class="logo-box">
                <img class="logo-img" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
            </div>
            <div class="header-badge">
                ★ 100% NGUYÊN LIỆU NHẬP KHẨU ÚC • ISO 22000
            </div>
        </div>

        <!-- Main Body -->
        <div class="main-body">
            <!-- Left Info Column -->
            <div class="left-col">
                <div class="brand-tag">DÒNG BỘT LẮC GIA VỊ CAO CẤP</div>
                <h1 class="hero-title">BOYO</h1>
                <div class="hero-subtitle">BỘT PHÔ MAI <span>RẮC CẢ THẾ GIỚI</span></div>

                <div class="spec-group">
                    <!-- 65g Spec -->
                    <div class="spec-item">
                        <div class="spec-bullet orange">1</div>
                        <div class="spec-text">
                            <div class="spec-title">GÓI 65G - KÊNH SIÊU THỊ & TẠP HÓA</div>
                            <div class="spec-detail">Quy cách: <strong>Hộp 10 gói • Thùng 6 hộp (60 gói)</strong>. Túi zip tiện lợi, vốn nhẹ, bán cực chạy cạnh quầy thu ngân & snack.</div>
                        </div>
                    </div>

                    <!-- 1kg Spec -->
                    <div class="spec-item">
                        <div class="spec-bullet">2</div>
                        <div class="spec-text">
                            <div class="spec-title">TÚI 1KG - KÊNH HORECA & NHÀ HÀNG</div>
                            <div class="spec-detail">Dành riêng cho quán ăn vặt, gà rán, khoai lắc. <strong>Hạt siêu mịn bám dính 360°</strong>, tối ưu chi phí cost chỉ từ 800đ/suất.</div>
                        </div>
                    </div>
                </div>

                <!-- Pills -->
                <div class="features-pills">
                    <span class="pill-item">✓ Vị phô mai Cheddar ngậy béo</span>
                    <span class="pill-item">✓ Không vón cục</span>
                    <span class="pill-item">✓ Đầy đủ hóa đơn VAT</span>
                    <span class="pill-item">✓ Tặng mẫu thử tận quán</span>
                </div>

                <!-- Bottom CTA text -->
                <div class="cta-banner">
                    PHÂN PHỐI SỈ TOÀN QUỐC
                </div>
            </div>

            <!-- Right Staging Column -->
            <div class="right-col">
                <div class="ground-shadow"></div>

                <!-- 1kg Product -->
                <div class="bag-1kg-wrap">
                    <div class="tag-callout for-1kg">
                        🏷️ GÓI 1KG HORECA
                    </div>
                    <img class="bag-1kg-img" src="${cut1kg}" alt="BOYO 1kg">
                </div>

                <!-- 65g Product -->
                <div class="bag-65g-wrap">
                    <div class="tag-callout for-65g">
                        ⭐ GÓI 65G RETAIL
                    </div>
                    <img class="bag-65g-img" src="${cut65g}" alt="BOYO 65g">
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-bar">
            <div class="footer-col-left">
                🚚 PHÂN PHỐI SỈ TOÀN QUỐC
            </div>
            <div class="footer-col-right">
                <div class="contact-item">
                    📞 Hotline: <strong>0969 069 798</strong>
                </div>
                <div class="contact-item">
                    🌐 Website: <strong>lyhu.vn • lyhu.com.vn</strong>
                </div>
                <div class="contact-item">
                    ✉️ <strong>sales@lyhu.vn</strong>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    console.log("Rendering master poster at 2400x2400 (2x retina)...");
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(masterHtml, { waitUntil: 'networkidle0' });

    const outBrain = path.join(brainDir, 'boyo_master_poster.jpg');
    const outPublic = path.join(process.cwd(), 'public', 'boyo_master_poster.jpg');

    await page.screenshot({ path: outBrain, type: 'jpeg', quality: 96 });
    await page.screenshot({ path: outPublic, type: 'jpeg', quality: 96 });

    await browser.close();
    console.log("Master poster rendered successfully to:", outPublic);
}

createMasterPoster().catch(console.error);
