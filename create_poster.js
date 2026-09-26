const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderPoster() {
    console.log("Reading assets...");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const pack65gBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const pack1kgBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');

    const html = `<!DOCTYPE html>
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
        background: #F8FAFB;
        position: relative;
        overflow: hidden;
        color: #1E293B;
    }

    /* Grid pattern background like CVT poster */
    .bg-grid {
        position: absolute;
        top: 0;
        right: 0;
        width: 600px;
        height: 600px;
        background-size: 32px 32px;
        background-image: 
            linear-gradient(to right, rgba(0, 163, 150, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 163, 150, 0.08) 1px, transparent 1px);
        z-index: 1;
        mask-image: radial-gradient(circle at top right, black 40%, transparent 80%);
    }

    /* Decorative diagonal brand shape */
    .brand-accent-top {
        position: absolute;
        top: -120px;
        right: -120px;
        width: 350px;
        height: 350px;
        background: linear-gradient(135deg, rgba(141, 198, 63, 0.15), rgba(0, 163, 150, 0.1));
        border-radius: 50%;
        z-index: 1;
    }

    .brand-accent-left {
        position: absolute;
        bottom: 80px;
        left: -100px;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(0, 163, 150, 0.07), transparent 70%);
        border-radius: 50%;
        z-index: 1;
    }

    /* Container */
    .container {
        position: relative;
        z-index: 10;
        width: 1200px;
        height: 1200px;
        padding: 44px 50px 0 50px;
        display: flex;
        flex-direction: column;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    .logo-img {
        height: 62px;
        object-fit: contain;
    }
    .hotline-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #FFFFFF;
        border: 1.5px solid #00A396;
        color: #00A396;
        padding: 8px 18px;
        border-radius: 50px;
        font-weight: 700;
        font-size: 15px;
        box-shadow: 0 4px 12px rgba(0, 163, 150, 0.08);
    }
    .hotline-badge svg {
        width: 18px;
        height: 18px;
        fill: #00A396;
    }

    /* Main Title Section */
    .title-section {
        margin-bottom: 28px;
    }
    .badge-top {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #E6F6F4;
        color: #008075;
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        padding: 6px 14px;
        border-radius: 6px;
        margin-bottom: 12px;
    }
    .main-title {
        font-size: 50px;
        font-weight: 900;
        line-height: 1.15;
        color: #008075;
        text-transform: uppercase;
        letter-spacing: -0.5px;
    }
    .sub-title {
        font-size: 32px;
        font-weight: 800;
        color: #7CB518;
        text-transform: uppercase;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .sub-title .pill {
        background: #FF9800;
        color: white;
        font-size: 14px;
        padding: 4px 12px;
        border-radius: 20px;
        vertical-align: middle;
        font-weight: 700;
    }

    /* Products Grid */
    .products-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        flex: 1;
        margin-bottom: 24px;
    }

    .product-card {
        background: #FFFFFF;
        border-radius: 22px;
        padding: 24px 26px;
        border: 1.5px solid #E2E8F0;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        display: flex;
        flex-direction: column;
        position: relative;
    }
    .product-card.highlight {
        border-color: #00A396;
        background: linear-gradient(180deg, #FFFFFF 0%, #F5FBFA 100%);
        box-shadow: 0 12px 35px rgba(0, 163, 150, 0.09);
    }

    .card-header-badge {
        align-self: flex-start;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 14px;
    }
    .badge-retail {
        background: #FFF4E5;
        color: #D97706;
    }
    .badge-horeca {
        background: #E6F6F4;
        color: #008075;
    }

    .card-body {
        display: flex;
        gap: 20px;
        align-items: center;
        flex: 1;
    }

    .product-img-wrap {
        width: 195px;
        height: 255px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .product-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.12));
    }

    .product-info {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .pack-name {
        font-size: 26px;
        font-weight: 900;
        color: #0F172A;
    }
    .pack-desc {
        font-size: 14px;
        color: #64748B;
        font-weight: 500;
        line-height: 1.4;
    }

    .features-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 4px;
    }
    .features-list li {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        line-height: 1.35;
    }
    .check-icon {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00A396;
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        flex-shrink: 0;
        margin-top: 2px;
    }
    .check-icon.orange {
        background: #F59E0B;
    }

    .specs-box {
        margin-top: 14px;
        padding: 10px 14px;
        background: #F1F5F9;
        border-radius: 10px;
        font-size: 13.5px;
        font-weight: 700;
        color: #0F172A;
        border-left: 4px solid #00A396;
    }
    .product-card.retail .specs-box {
        border-left-color: #F59E0B;
        background: #FFF9F0;
        color: #B45309;
    }

    /* Trust bar */
    .trust-bar {
        display: flex;
        justify-content: space-around;
        align-items: center;
        background: #FFFFFF;
        border: 1px dashed #CBD5E1;
        border-radius: 14px;
        padding: 12px 24px;
        margin-bottom: 24px;
    }
    .trust-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        color: #475569;
    }
    .trust-item .icon {
        color: #00A396;
        font-size: 18px;
    }

    /* Footer Banner */
    .footer {
        height: 72px;
        background: #00A396;
        margin-left: -50px;
        margin-right: -50px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 44px;
        color: #FFFFFF;
        font-weight: 600;
        font-size: 14px;
    }
    .footer-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .footer-right {
        display: flex;
        align-items: center;
        gap: 28px;
    }
    .footer-contact {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .footer-contact strong {
        font-weight: 800;
        font-size: 16px;
    }
</style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="brand-accent-top"></div>
    <div class="brand-accent-left"></div>

    <div class="container">
        <!-- Header -->
        <div class="header">
            <img class="logo-img" src="data:image/png;base64,${logoBase64}" alt="LYHU Logo">
            <div class="hotline-badge">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                TƯ VẤN NHẬP SỈ: 0969 069 798
            </div>
        </div>

        <!-- Title -->
        <div class="title-section">
            <div class="badge-top">⭐ BỘT LẮC GIA VỊ CAO CẤP • NGUYÊN LIỆU ÚC</div>
            <h1 class="main-title">BỘT PHÔ MAI BOYO</h1>
            <div class="sub-title">
                RẮC CẢ THẾ GIỚI • PHỦ SÓNG MỌI KÊNH BÁN
                <span class="pill">CHUẨN VỊ CHEDDAR</span>
            </div>
        </div>

        <!-- 2 Products Grid -->
        <div class="products-grid">
            <!-- 65g Retail -->
            <div class="product-card retail">
                <div class="card-header-badge badge-retail">
                    🏪 KÊNH SIÊU THỊ, TẠP HÓA, MINIMART
                </div>
                <div class="card-body">
                    <div class="product-img-wrap">
                        <img class="product-img" src="data:image/jpeg;base64,${pack65gBase64}" alt="Gói 65g">
                    </div>
                    <div class="product-info">
                        <div class="pack-name">GÓI 65G TIỆN LỢI</div>
                        <div class="pack-desc">Thiết kế rực rỡ, túi zip nhỏ gọn cho người tiêu dùng & gia đình mua lẻ.</div>
                        <ul class="features-list">
                            <li><span class="check-icon orange">✓</span> Hút mắt khi đặt tại quầy thu ngân</li>
                            <li><span class="check-icon orange">✓</span> Bán kèm cực tốt với khoai tây & snack</li>
                            <li><span class="check-icon orange">✓</span> Vốn nhẹ, quay vòng cực nhanh</li>
                        </ul>
                        <div class="specs-box">
                            📦 QUY CÁCH: HỘP 10 GÓI • THÙNG 6 HỘP (60 GÓI)
                        </div>
                    </div>
                </div>
            </div>

            <!-- 1kg Horeca -->
            <div class="product-card highlight">
                <div class="card-header-badge badge-horeca">
                    👨‍🍳 KÊNH HORECA: NHÀ HÀNG, QUÁN ĂN, BẾP
                </div>
                <div class="card-body">
                    <div class="product-img-wrap">
                        <img class="product-img" src="data:image/jpeg;base64,${pack1kgBase64}" alt="Túi 1kg">
                    </div>
                    <div class="product-info">
                        <div class="pack-name">TÚI 1KG CHUYÊN DỤNG</div>
                        <div class="pack-desc">Dành riêng cho quán ăn vặt, quán gà rán, khoai lắc, xưởng sản xuất.</div>
                        <ul class="features-list">
                            <li><span class="check-icon">✓</span> Tiết kiệm 35% chi phí giá Cost món ăn</li>
                            <li><span class="check-icon">✓</span> Hạt siêu mịn, bám dính 360°, không hao</li>
                            <li><span class="check-icon">✓</span> Hương vị ổn định khi chiên & ship xa</li>
                        </ul>
                        <div class="specs-box">
                            🎯 COST CHỈ TỪ 800Đ - 1.200Đ / SUẤT KHOAI LẮC
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Trust bar -->
        <div class="trust-bar">
            <div class="trust-item"><span class="icon">🛡️</span> Đạt chuẩn ATTP & ISO 22000</div>
            <div class="trust-item"><span class="icon">🇦🇺</span> Nguyên liệu nhập khẩu Australia</div>
            <div class="trust-item"><span class="icon">🧾</span> Đầy đủ hóa đơn VAT đỏ chính ngạch</div>
            <div class="trust-item"><span class="icon">🎁</span> Tặng mẫu thử (Sample) tận quán</div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-left">
                🚚 PHÂN PHỐI SỈ TOÀN QUỐC
            </div>
            <div class="footer-right">
                <div class="footer-contact">
                    📞 Hotline: <strong>0969 069 798</strong>
                </div>
                <div class="footer-contact">
                    🌐 Website: <strong>lyhu.vn • lyhu.com.vn</strong>
                </div>
                <div class="footer-contact">
                    ✉️ <strong>sales@lyhu.vn</strong>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    console.log("Launching Puppeteer browser...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Render at 2x scale factor (2400x2400) for razor sharp 4K output!
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const outputPathBrain = path.join(brainDir, 'boyo_official_poster.jpg');
    const outputPathPublic = path.join(process.cwd(), 'public', 'boyo_official_poster.jpg');

    console.log("Capturing screenshot at 2400x2400...");
    await page.screenshot({ path: outputPathBrain, type: 'jpeg', quality: 95 });
    await page.screenshot({ path: outputPathPublic, type: 'jpeg', quality: 95 });

    await browser.close();
    console.log("Successfully created official poster at:", outputPathPublic);
}

renderPoster().catch(console.error);
