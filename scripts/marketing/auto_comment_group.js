const { launchBrowser, delay, rdn } = require('./setup_browser');
const { logTask } = require('./supabase_logger');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function spinText(text) {
    if (!text) return "";
    return text.replace(/\{([^{}]*)\}/g, function (match, group) {
        const options = group.split('|');
        return options[Math.floor(Math.random() * options.length)];
    });
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(dest); });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
    });
}


(async () => {
    let browser = null;
    let tempImagePath = null;
    
    try {
        const args = process.argv.slice(2);
        const rawArg = args.find(a => !a.startsWith('--')) || "";
        
        let groupUrl = null;
        let category = "Mặc định";
        if (rawArg.includes("facebook.com/groups/")) {
            const parts = rawArg.split('|');
            groupUrl = parts[0].trim();
            if (parts.length > 1) category = parts[1].trim();
        } else if (rawArg) {
            category = rawArg.trim();
        }

        // 1. Kéo Mồi
        const { data, error } = await supabase.from('bot_contents').select('*').eq('category', category);
        if (error || !data || data.length === 0) {
            await logTask(null, `Lỗi: Kho Comment "${category}" trống`);
            process.exit(1);
        }

        // 2. Boot
        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // 3. Navigate
        if (groupUrl) {
            await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });
        } else {
            await page.goto("https://www.facebook.com/groups/joins", { waitUntil: 'domcontentloaded' });
            await delay(rdn(2000, 4000));
            const groupLinks = await page.$$eval('a[href*="/groups/"]:not([href*="category"])', links => links.map(l => l.href));
            if (groupLinks.length === 0) throw new Error("Thất bại: Chưa tham gia group nào để thả cmt");
            const uniqueLinks = [...new Set(groupLinks.map(l => l.split('?')[0]))];
            const target = uniqueLinks[Math.floor(Math.random() * uniqueLinks.length)];
            await page.goto(target, { waitUntil: 'domcontentloaded' });
        }
        await delay(rdn(4000, 7000));

        // Cuộn trang lấy top 2-3 bài
        await page.mouse.wheel({ deltaY: rdn(1000, 2000) });
        await delay(rdn(2000, 3000));
        await page.mouse.wheel({ deltaY: rdn(1000, 2000) });
        await delay(rdn(2000, 3000));

        // 4. Tìm kiếm các Ô Bình luận (Comment boxes)
        const commentBoxes = await page.$$('div[role="textbox"][contenteditable="true"][aria-label*="Bình luận"], div[role="textbox"][contenteditable="true"][aria-label*="comment"]');
        
        if (commentBoxes.length === 0) {
            throw new Error("Không tìm thấy ô nhập bình luận nào (Có thể bị FB khóa hoặc group tắt tính năng cmnt).");
        }

        // Quyết định số lượng bài sẽ rải bom (1 đến 2 bài top)
        const limit = Math.min(commentBoxes.length, rdn(1, 2));
        
        for (let i = 0; i < limit; i++) {
            const box = commentBoxes[i];
            
            // Xào mồi (Mỗi lần cmt spin lại 1 nội dung khác nhau cho an toàn)
            const randomContent = data[Math.floor(Math.random() * data.length)];
            const finalMessage = spinText(randomContent.message_text);
            const imageUrl = randomContent.image_url;
            
            // Xử lý tải ảnh nếu có (tải riêng cho từng cmt nếu đổi mồi)
            if (imageUrl) {
                const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
                tempImagePath = path.join(__dirname, `../../temp_cmt_${Date.now()}_${i}.${ext}`);
                await downloadImage(imageUrl, tempImagePath);
            }

            try {
                // Focus vào ô Chat
                await box.scrollIntoViewIfNeeded();
                await delay(1000);
                await box.click();
                await delay(500);
                
                // Gõ chữ cực kỳ từ từ chống Spam
                if (finalMessage) {
                    await box.type(finalMessage, { delay: rdn(20, 50) });
                }

                await delay(500);

                // Attack Image
                if (tempImagePath) {
                    // Cmt box thường nằm chung parent với nút upload ảnh
                    // Thử tìm nút Tải ảnh lên gần ô comment đang focus nhất
                    const fileInput = await box.evaluateHandle((el) => {
                        // Trèo lên vài node cha rồi tìm input file
                        let parent = el;
                        for(let i=0; i<5; i++) {
                            if(!parent) break;
                            parent = parent.parentElement;
                            const input = parent.querySelector('input[type="file"]');
                            if(input) return input;
                        }
                        return null;
                    });
                    
                    if (fileInput.asElement()) {
                        await fileInput.asElement().uploadFile(tempImagePath);
                        const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                        if (isVideo) {
                            await delay(rdn(20000, 30000));
                        } else {
                            await delay(rdn(3000, 5000)); // Đợi kéo ảnh lên
                        }
                    }
                }

                // Chốt Hạ: Nhấn Enter để Bình luận
                await box.press('Enter');
                console.log(`[CMT_DAO] Đã thả 1 quả bom cmt dạo!`);
                await delay(rdn(3000, 6000)); // Nhịp nghỉ thở để chuyển qua bài thứ 2

            } catch (err) {
                console.log(`[CMT_DAO] Bỏ qua 1 bài do box bị lỗi che khuất.`);
            } finally {
                if (tempImagePath && fs.existsSync(tempImagePath)) {
                    try { fs.unlinkSync(tempImagePath); } catch (e) {}
                    tempImagePath = null; 
                }
            }
        }

        await logTask(null, `[Seeding] Đã rải xong ${limit} bình luận ngẫu nhiên (Kho: ${category})`);

    } catch (e) {
        console.error("[CMT_DAO_ERROR]", e);
        await logTask(null, `Lỗi Comment dạo: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            try { fs.unlinkSync(tempImagePath); } catch (err) {}
        }
        process.exit(0);
    }
})();
