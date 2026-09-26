const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function testPerfectCutouts() {
    const brainDir = 'C:/Users/Huy/.gemini/antigravity/brain/47cc0558-788a-4147-98af-3b1d3ba6faf6';
    const raw65 = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920486625.jpg')).toString('base64');
    const raw1k = fs.readFileSync(path.join(brainDir, '.user_uploaded/media_1789920499201.jpg')).toString('base64');
    const rawCheese = fs.readFileSync(path.join(brainDir, 'cheese_wedge_popcorn_1789923525630.jpg')).toString('base64');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    const results = await page.evaluate(async (b65, b1k, bCheese) => {
        function processAsset(base64, bgThresholdDist = 32, featherDist = 18) {
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

                    // Sample corner color
                    const bgR = d[0], bgG = d[1], bgB = d[2];

                    // BFS flood fill from outer boundaries
                    const isBg = new Uint8Array(w * h);
                    const queue = [];

                    function isBgMatch(idx) {
                        const dr = d[idx] - bgR;
                        const dg = d[idx + 1] - bgG;
                        const db = d[idx + 2] - bgB;
                        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
                        return dist <= bgThresholdDist;
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

                    // Calculate bounding box of non-background content
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

                    // Crop to tight bounding box
                    const cropCanvas = document.createElement('canvas');
                    const cropW = Math.max(1, maxX - minX + 1);
                    const cropH = Math.max(1, maxY - minY + 1);
                    cropCanvas.width = cropW;
                    cropCanvas.height = cropH;
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

                    resolve({
                        dataUrl: cropCanvas.toDataURL('image/png'),
                        width: cropW,
                        height: cropH,
                        aspectRatio: cropW / cropH
                    });
                };
                img.src = 'data:image/jpeg;base64,' + base64;
            });
        }

        return {
            pack65: await processAsset(b65, 18, 14),
            pack1k: await processAsset(b1k, 18, 14),
            cheese: await processAsset(bCheese, 28, 22)
        };
    }, raw65, raw1k, rawCheese);

    console.log("Cutout specs:", {
        pack65: { w: results.pack65.width, h: results.pack65.height, ar: results.pack65.aspectRatio },
        pack1k: { w: results.pack1k.width, h: results.pack1k.height, ar: results.pack1k.aspectRatio },
        cheese: { w: results.cheese.width, h: results.cheese.height, ar: results.cheese.aspectRatio }
    });

    // Save cheese cutout test to see if white boundary is 100% gone
    const cheeseBuffer = Buffer.from(results.cheese.dataUrl.replace(/^data:image\/png;base64,/, ""), 'base64');
    fs.writeFileSync(path.join(brainDir, 'cheese_cutout_test.png'), cheeseBuffer);

    await browser.close();
}

testPerfectCutouts().catch(console.error);
