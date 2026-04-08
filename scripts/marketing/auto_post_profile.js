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

// Hàm tải file từ URL Cloud xuống máy
function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(dest);
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

// Xử lý nội dung Spintax {Chào|Hi}
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
        const categoryArg = args.find(a => !a.startsWith('--')); // Thể loại bộ mồi (vd: "Kho Bán Hàng")
        
        let category = categoryArg || "Mặc định";
        
        console.log(`[POST] Bắt đầu rà soát kho chứa: "${category}"...`);

        // 1. Kéo mồi từ Đám mây
        const { data, error } = await supabase
            .from('bot_contents')
            .select('*')
            .eq('category', category);

        if (error || !data || data.length === 0) {
            console.error(`[POST] Không tìm thấy bài đăng nào trong kho "${category}". Dừng lệnh.`);
            await logTask(null, `Đăng Bài: Lỗi - Kho "${category}" trống`);
            process.exit(1);
        }

        // Bốc thăm ngẫu nhiên 1 nội dung
        const randomContent = data[Math.floor(Math.random() * data.length)];
        const finalMessage = spinText(randomContent.message_text);
        const imageUrl = randomContent.image_url;

        console.log(`[POST] Đã bốc thăm bài: "${finalMessage.substring(0, 30)}..."`);

        // 2. Tải ảnh nếu có
        if (imageUrl) {
            const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
            tempImagePath = path.join(__dirname, `../../temp_upload_${Date.now()}.${ext}`);
            console.log(`[POST] Đang tải ảnh xuống máy chủ cục bộ: ${tempImagePath}`);
            await downloadImage(imageUrl, tempImagePath);
            console.log(`[POST] Tải ảnh hoàn tất!`);
        }

        // 3. Khởi chạy Trình duyệt
        const { browser: b, page } = await launchBrowser();
        browser = b;

        await logTask(null, `Tiến hành Đăng Bài lên Cá nhân...`);
        
        await page.goto("https://www.facebook.com/", { waitUntil: 'domcontentloaded' });
        await delay(rdn(3000, 5000));

        // 4. Click ô Bạn đang nghĩ gì
        console.log("[POST] Đang tìm ô cảm nghĩ...");
        const postBoxSelectors = [
            `div[role="button"]:has-text("Bạn đang nghĩ gì")`,
            `div[role="button"]:has-text("What's on your mind")`,
            `span:has-text("Bạn đang nghĩ gì")`,
            `span:has-text("What's on your mind")`
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

        if (!clicked) {
            // Fallback: Click profile -> click post
            await page.goto("https://www.facebook.com/me");
            await delay(4000);
            const box = await page.$('div[role="button"]:has-text("Bạn đang nghĩ gì"), div[role="button"]:has-text("What\'s on your mind")');
            if (box) await box.click();
            else throw new Error("Không thể tìm thấy Ô Đăng Bài");
        }

        await delay(rdn(2000, 3000));

        // 5. Gõ nội dung (Bắt buộc phải chờ popup)
        const activeDialog = await page.$('div[role="dialog"]');
        if (!activeDialog) throw new Error("Chưa mở được giao diện nhập chữ");

        if (finalMessage) {
            const textBox = await page.$('div[role="textbox"][contenteditable="true"]');
            if (textBox) {
                await textBox.click();
                await delay(1000);
                await textBox.type(finalMessage, { delay: rdn(30, 80) }); // Gõ như người thật
                console.log("[POST] Đã gõ chữ xong.");
                await delay(rdn(1000, 2000));
            }
        }

        // 6. Tải media lên (Móc nối thần tốc)
        if (tempImagePath) {
            const inputUploadHandle = await page.$('input[type=file]');
            if (inputUploadHandle) {
                console.log(`[POST] Móc file vào Trình duyệt: ${tempImagePath}`);
                await inputUploadHandle.uploadFile(tempImagePath);
                
                // Nếu là Video thì cần thời gian đẩy File to hơn
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[POST] Phát hiện Đính kèm Video! Chờ 20 - 40 giây để upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(4000, 7000)); // Chờ FB load ảnh lên cache
                }
            } else {
                console.log("[POST] Cảnh báo: Không tìm thấy nút Upload file.");
            }
        }

        // 7. Ấn Nút Đăng (Post)
        console.log("[POST] Sẵn sàng đẩy nòng... Đăng bài!");
        const postButtonSelectors = [
            `div[aria-label="Đăng"][role="button"]`,
            `div[aria-label="Post"][role="button"]`
        ];
        
        let posted = false;
        for (const btnSel of postButtonSelectors) {
            const btn = await page.$(btnSel);
            if (btn) {
                // Kiểm tra xem nút có bị vô hiệu hóa (aria-disabled) không
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), btn);
                if (isDisabled !== 'true') {
                    await btn.click();
                    posted = true;
                    break;
                }
            }
        }

        if (posted) {
            await delay(rdn(6000, 10000)); // Chờ FB nhả bài lên newsfeed
            console.log("[POST] 🟢 Hoàn thành lệnh Đăng Bài Hành Động!");
            await logTask(null, `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
        } else {
            throw new Error("Nút Đăng Bài bị ẩn hoặc bị khóa.");
        }

    } catch (e) {
        console.error("[POST_ERROR]", e);
        await logTask(null, `Lỗi đăng bài: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            // Xóa rác
            try {
                fs.unlinkSync(tempImagePath);
                console.log("[POST] Đã dọn dẹp file nháp.");
            } catch (err) {}
        }
        process.exit(0);
    }
})();
