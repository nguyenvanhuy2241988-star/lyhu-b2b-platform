const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderNewsBanner() {
    console.log("Rendering young, vibrant 1200x630 News Banner for BOYO 65g...");
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const publicDir = path.join(process.cwd(), 'public');

    const logoBase64 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789919985018.png')).toString('base64');
    const pack65Raw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const cheeseWedgeRaw = fs.readFileSync(path.join(brainDir, 'cheese_wedge_popcorn_1789923525630.jpg')).toString('base64');

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Fast precise cutout
    const cutouts = await page.evaluate(async (b65, bCheese) => {
        function process(base64, bgThresh = 24) {
            return new Promise((res) => {
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
                    const q = [];

                    for (let x = 0; x < w; x++) { q.push(x, 0); q.push(x, h - 1); isBg[x] = 1; isBg[(h-1)*w + x] = 1; }
                    for (let y = 0; y < h; y++) { q.push(0, y); q.push(w - 1, y); isBg[y * w] = 1; isBg[y * w + (w - 1)] = 1; }

                    let head = 0;
                    while (head < q.length) {
                        const cx = q[head++];
                        const cy = q[head++];
                        const pIdx = (cy * w + cx) * 4;
                        const dist = Math.sqrt((d[pIdx]-bgR)**2 + (d[pIdx+1]-bgG)**2 + (d[pIdx+2]-bgB)**2);
                        if (dist <= bgThresh) {
                            const nbs = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
                            for (let i = 0; i < 4; i++) {
                                const nx = nbs[i][0], ny = nbs[i][1];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    const nPos = ny * w + nx;
                                    if (!isBg[nPos]) {
                                        isBg[nPos] = 1;
                                        const nDist = Math.sqrt((d[nPos*4]-bgR)**2 + (d[nPos*4+1]-bgG)**2 + (d[nPos*4+2]-bgB)**2);
                                        if (nDist <= bgThresh) q.push(nx, ny);
                                    }
                                }
                            }
                        }
                    }

                    let minX = w, maxX = 0, minY = h, maxY = 0;
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const idx = y * w + x;
                            if (isBg[idx]) {
                                d[idx * 4 + 3] = 0;
                            } else {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                    const crop = document.createElement('canvas');
                    const cw = Math.max(1, maxX - minX + 1);
                    const ch = Math.max(1, maxY - minY + 1);
                    crop.width = cw; crop.height = ch;
                    crop.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
                    res({ data: crop.toDataURL('image/png'), w: cw, h: ch });
                };
                img.src = 'data:image/jpeg;base64,' + base64;
            });
        }
        return {
            pack65: await process(b65, 20),
            cheese: await process(bCheese, 26)
        };
    }, pack65Raw, cheeseWedgeRaw);

    const bannerHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        width: 1200px;
        height: 630px;
        background: #FFFFFF;
        font-family: 'Plus Jakarta Sans', sans-serif;
        position: relative;
        overflow: hidden;
    }
    .bg-shape {
        position: absolute;
        top: 0;
        right: 0;
        width: 660px;
        height: 630px;
        background: linear-gradient(135deg, #F0F9F6 0%, #DCF0EB 100%);
        border-radius: 260px 0 0 0;
        z-index: 1;
    }
    .cheese-glow {
        position: absolute;
        top: 80px;
        right: 80px;
        width: 480px;
        height: 480px;
        background: radial-gradient(circle, rgba(255, 215, 100, 0.35) 0%, transparent 70%);
        border-radius: 50%;
        z-index: 2;
    }
    .container {
        position: relative;
        z-index: 10;
        width: 1200px;
        height: 630px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 40px 60px;
    }
    .left-text {
        width: 540px;
        display: flex;
        flex-direction: column;
    }
    .logo {
        height: 60px;
        object-fit: contain;
        align-self: flex-start;
        margin-bottom: 24px;
    }
    .tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #E8F7F3;
        border: 1.5px solid #00A396;
        color: #006E65;
        font-weight: 800;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 6px 14px;
        border-radius: 20px;
        width: fit-content;
        margin-bottom: 14px;
    }
    .title {
        font-family: 'Oswald', sans-serif;
        font-size: 50px;
        font-weight: 700;
        line-height: 1.05;
        color: #004D47;
        text-transform: uppercase;
        margin-bottom: 16px;
    }
    .title span {
        color: #E65100;
    }
    .desc {
        font-size: 18px;
        font-weight: 600;
        color: #4A6E6A;
        line-height: 1.45;
        margin-bottom: 22px;
    }
    .action-badge {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .btn-contact {
        background: #8DC63F;
        color: #004D47;
        font-weight: 900;
        font-size: 16px;
        text-transform: uppercase;
        padding: 12px 24px;
        border-radius: 30px;
        letter-spacing: 0.5px;
        box-shadow: 0 6px 16px rgba(141, 198, 63, 0.35);
    }
    .spec-note {
        font-size: 15px;
        font-weight: 800;
        color: #006E65;
    }
    .right-visual {
        flex: 1;
        height: 550px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .pack-hero {
        position: absolute;
        bottom: 25px;
        right: 120px;
        width: 320px;
        height: 432px;
        transform: rotate(-3deg);
        filter: drop-shadow(0 18px 25px rgba(0, 77, 71, 0.24));
        z-index: 10;
    }
    .pack-hero img { width: 100%; height: 100%; object-fit: contain; }
    .pack-back {
        position: absolute;
        bottom: 70px;
        right: 15px;
        width: 300px;
        height: 405px;
        transform: rotate(6deg);
        filter: drop-shadow(0 14px 20px rgba(0, 77, 71, 0.18)) brightness(0.96);
        z-index: 6;
    }
    .pack-back img { width: 100%; height: 100%; object-fit: contain; }
    .cheese-front {
        position: absolute;
        bottom: 10px;
        right: 0px;
        width: 250px;
        filter: drop-shadow(0 12px 18px rgba(0,0,0,0.22));
        z-index: 15;
    }
    .cheese-front img { width: 100%; object-fit: contain; }
</style>
</head>
<body>
    <div class="bg-shape"></div>
    <div class="cheese-glow"></div>
    <div class="container">
        <div class="left-text">
            <img class="logo" src="data:image/png;base64,${logoBase64}" alt="LYHU">
            <div class="tag">🔥 Đón Đầu Xu Hướng Ăn Vặt Mới</div>
            <div class="title">BỘT PHÔ MAI <span>BOYO 65G</span><br>RẮC LÀ MÊ - BẬT DOANH SỐ</div>
            <div class="desc">Gói nhỏ 65g siêu tiện lợi • Hộp 10 gói mở nắp quầy kệ • Vị béo ngậy ngọt mặn cực cuốn!</div>
            <div class="action-badge">
                <div class="btn-contact">Đăng Ký Nhận Mẫu Thử</div>
                <div class="spec-note">Hộp 10 gói • Thùng 6 hộp</div>
            </div>
        </div>
        <div class="right-visual">
            <div class="pack-back"><img src="${cutouts.pack65.data}" alt="BOYO"></div>
            <div class="pack-hero"><img src="${cutouts.pack65.data}" alt="BOYO 65g"></div>
            <div class="cheese-front"><img src="${cutouts.cheese.data}" alt="Cheese"></div>
        </div>
    </div>
</body>
</html>`;

    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
    await page.setContent(bannerHtml, { waitUntil: 'domcontentloaded' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 500));

    const outPublic = path.join(publicDir, 'boyo_news_banner.jpg');
    const outBrain = path.join(brainDir, 'boyo_news_banner.jpg');
    await page.screenshot({ path: outPublic, type: 'jpeg', quality: 95 });
    await page.screenshot({ path: outBrain, type: 'jpeg', quality: 95 });

    await browser.close();
    console.log("-> Saved 1200x630 News Banner:", outPublic);
}

renderNewsBanner().catch(console.error);
