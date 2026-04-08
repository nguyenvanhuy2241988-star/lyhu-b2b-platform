const { launchBrowser, delay, rdn } = require('./setup_browser');
const { logTask } = require('./supabase_logger');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

function spinText(text) {
    if (!text) return "";
    return text.replace(/\{([^{}]*)\}/g, function (match, group) {
        const options = group.split('|');
        return options[Math.floor(Math.random() * options.length)];
    });
}

(async () => {
    let browser = null;
    let tempImagePath = null;
    
    try {
        const args = process.argv.slice(2);
        const rawArg = args.find(a => !a.startsWith('--')) || "";
        
        // Phân tách Arg: "URL | Category" hoặc chỉ có "Category"
        let groupUrl = null;
        let category = "Mặc định";
        
        if (rawArg.includes("facebook.com/groups/")) {
            const parts = rawArg.split('|');
            groupUrl = parts[0].trim();
            if (parts.length > 1) category = parts[1].trim();
        } else if (rawArg) {
            category = rawArg.trim();
        }

        console.log(`[GROUP_POST] Mở kho: ${category}. Nhắm mục tiêu: ${groupUrl || 'Ngẫu nhiên nhóm đã tham gia'}`);

        // 1. Kéo Mồi
        const { data, error } = await supabase.from('bot_contents').select('*').eq('category', category);
        if (error || !data || data.length === 0) {
            await logTask(null, `Lỗi: Kho bài đăng "${category}" trống`);
            process.exit(1);
        }

        const randomContent = data[Math.floor(Math.random() * data.length)];
        const finalMessage = spinText(randomContent.message_text);
        const imageUrl = randomContent.image_url;

        // 2. Chuyển vị Ảnh
        if (imageUrl) {
            const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
            tempImagePath = path.join(__dirname, `../../temp_gr_upload_${Date.now()}.${ext}`);
            await downloadImage(imageUrl, tempImagePath);
        }

        // 3. Boot Trình duyệt
        const { browser: b, page } = await launchBrowser();
        browser = b;

        // 4. Tìm Group để đăng
        if (groupUrl) {
            await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });
        } else {
            // Đăng lên 1 nhóm ngẫu nhiên
            await page.goto("https://www.facebook.com/groups/joins", { waitUntil: 'domcontentloaded' });
            await delay(rdn(3000, 5000));
            const groupLinks = await page.$$eval('a[href*="/groups/"]:not([href*="category"])', links => links.map(l => l.href));
            if (groupLinks.length === 0) throw new Error("Nick chưa tham gia Hội nhóm nào!");
            // Lọc ra các Group ID gốc
            const uniqueLinks = [...new Set(groupLinks.map(l => l.split('?')[0]))];
            const randomTarget = uniqueLinks[Math.floor(Math.random() * uniqueLinks.length)];
            console.log(`[GROUP_POST] Chuyển hướng tới Nhóm rando: ${randomTarget}`);
            await page.goto(randomTarget, { waitUntil: 'domcontentloaded' });
        }
        await delay(rdn(3000, 5000));

        // 5. Cắm ô Đăng Bài
        const postBoxSelectors = [
            `div[role="button"]:has-text("Viết gì đó")`,
            `div[role="button"]:has-text("Write something")`,
            `span:has-text("Viết gì đó")`,
            `span:has-text("Write something")`
        ];

        let clicked = false;
        for (const sel of postBoxSelectors) {
            try {
                await page.waitForSelector(sel, { timeout: 3000 });
                await page.click(sel);
                clicked = true;
                break;
            } catch (e) {}
        }
        if (!clicked) throw new Error("Nhóm này có thể không cho phép thành viên tự đăng bài (Need approval/Disabled).");

        await delay(rdn(2000, 3000));

        // 6. Điền nội dung
        if (finalMessage) {
            const textBox = await page.$('div[role="textbox"][contenteditable="true"]');
            if (textBox) {
                await textBox.click();
                await delay(1000);
                await textBox.type(finalMessage, { delay: rdn(20, 60) });
                await delay(1000);
            }
        }

        // 7. Nhét Media
        if (tempImagePath) {
            const inputUploadHandle = await page.$('input[type=file]');
            if (inputUploadHandle) {
                await inputUploadHandle.uploadFile(tempImagePath);
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[GROUP_POST] File Video nặng, chờ 20-40s để upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(3000, 6000)); // Chờ FB load ảnh
                }
            }
        }

        // 8. Chốt Đăng
        const postButtonSelectors = [`div[aria-label="Đăng"][role="button"]`, `div[aria-label="Post"][role="button"]`];
        let posted = false;
        for (const btnSel of postButtonSelectors) {
            const btn = await page.$(btnSel);
            if (btn) {
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), btn);
                if (isDisabled !== 'true') {
                    await btn.click();
                    posted = true;
                    break;
                }
            }
        }

        if (posted) {
            await delay(rdn(5000, 8000));
            console.log("[GROUP_POST] Hoàn thành đi Bài vào Group!");
            await logTask(null, `Đã rải 1 bài seeding vào Group (Kho: ${category})`);
        } else {
            throw new Error("Nút Đăng Bài bị ẩn");
        }

    } catch (e) {
        console.error("[GROUP_POST_ERROR]", e);
        await logTask(null, `Lỗi đăng Group: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            try { fs.unlinkSync(tempImagePath); } catch (err) {}
        }
        process.exit(0);
    }
})();
