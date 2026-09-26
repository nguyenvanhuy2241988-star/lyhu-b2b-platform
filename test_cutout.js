const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function testSmoothCutout() {
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const pack65gRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const pack1kgRaw = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const result = await page.evaluate(async (raw65, raw1k) => {
        function smoothCutout(base64, bgThreshold = 248, feather = 4) {
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

                    // BFS flood fill from outer borders to identify true outer background
                    const isBgPixel = new Uint8Array(w * h);
                    const queue = [];

                    function isNearWhite(idx) {
                        return d[idx] >= bgThreshold && d[idx + 1] >= bgThreshold && d[idx + 2] >= bgThreshold;
                    }

                    for (let x = 0; x < w; x++) {
                        queue.push(x, 0);
                        queue.push(x, h - 1);
                        isBgPixel[x] = 1;
                        isBgPixel[(h - 1) * w + x] = 1;
                    }
                    for (let y = 0; y < h; y++) {
                        queue.push(0, y);
                        queue.push(w - 1, y);
                        isBgPixel[y * w] = 1;
                        isBgPixel[y * w + (w - 1)] = 1;
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
                                    if (!isBgPixel[nPos]) {
                                        isBgPixel[nPos] = 1;
                                        if (isNearWhite(nPos * 4)) {
                                            queue.push(nx, ny);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // For pixels marked as background, set alpha to 0
                    // For transition border pixels, calculate distance or smooth alpha
                    for (let i = 0; i < w * h; i++) {
                        if (isBgPixel[i]) {
                            d[i * 4 + 3] = 0;
                        }
                    }

                    // Anti-aliasing pass: feather edge pixels that border transparent ones
                    for (let y = 1; y < h - 1; y++) {
                        for (let x = 1; x < w - 1; x++) {
                            const idx = (y * w + x);
                            if (!isBgPixel[idx]) {
                                // check if next to background
                                const nBg = isBgPixel[idx - 1] + isBgPixel[idx + 1] + isBgPixel[idx - w] + isBgPixel[idx + w];
                                if (nBg > 0) {
                                    const pIdx = idx * 4;
                                    const avg = (d[pIdx] + d[pIdx + 1] + d[pIdx + 2]) / 3;
                                    if (avg > 230) {
                                        d[pIdx + 3] = Math.max(0, Math.min(255, Math.round((255 - avg) * 8)));
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
            cut1k: await smoothCutout(raw1k, 246)
        };
    }, pack65gRaw, pack1kgRaw);

    await browser.close();
    console.log("Smooth cutouts generated successfully! Base64 lengths:", result.cut65.length, result.cut1k.length);
}

testSmoothCutout().catch(console.error);
