const { launchBrowser, delay, rdn } = require('./setup_browser');
const { logAction } = require('./supabase_logger');
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
    const debugDir = path.join(__dirname, '../../debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    
    try {
        const args = process.argv.slice(2);
        const categoryArg = args.find(a => !a.startsWith('--'));
        let category = categoryArg || "Mặc định";
        
        console.log(`[POST] Bắt đầu rà soát kho chứa: "${category}"...`);

        // 1. Kéo mồi từ Đám mây
        const { data, error } = await supabase.from('bot_contents').select('*').eq('category', category);
        if (error || !data || data.length === 0) {
            console.error(`[POST] Không tìm thấy bài đăng nào trong kho "${category}".`);
            await logAction('post', 'error', `Đăng Bài: Lỗi - Kho "${category}" trống`);
            process.exit(1);
        }

        const randomContent = data[Math.floor(Math.random() * data.length)];
        const finalMessage = spinText(randomContent.message_text);
        const imageUrl = randomContent.image_url;
        console.log(`[POST] Đã bốc thăm bài: "${finalMessage.substring(0, 30)}..."`);

        // 2. Tải ảnh nếu có
        if (imageUrl) {
            const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
            tempImagePath = path.join(__dirname, `../../temp_upload_${Date.now()}.${ext}`);
            console.log(`[POST] Đang tải ảnh xuống: ${tempImagePath}`);
            await downloadImage(imageUrl, tempImagePath);
            console.log(`[POST] Tải ảnh hoàn tất!`);
        }

        // 3. Khởi chạy Trình duyệt
        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();
        await logAction('post', 'info', `Tiến hành Đăng Bài lên Cá nhân...`);

        // ============================================================
        // BƯỚC 4: Vào Facebook và MỞ COMPOSER DIALOG
        // ============================================================
        console.log("[POST] Bước 1: Vào trang chủ Facebook...");
        await page.goto("https://www.facebook.com/", { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(rdn(3000, 5000));
        
        // Debug: Chụp screenshot xem trang đang hiển thị gì
        await page.screenshot({ path: path.join(debugDir, 'step1_homepage.png') });
        console.log("[POST] Screenshot step1 saved.");

        // Kiểm tra đã login chưa (nếu thấy nút login thì dừng)
        const isLoginPage = await page.evaluate(() => {
            return !!document.querySelector('input[name="email"]') || 
                   !!document.querySelector('#loginbutton');
        });
        if (isLoginPage) {
            throw new Error("Chưa đăng nhập Facebook! Chạy manual_login.js trước.");
        }

        // BƯỚC 4a: Click vào "Bạn đang nghĩ gì?" bằng MOUSE COORDINATE
        console.log("[POST] Bước 2: Tìm và click 'Bạn đang nghĩ gì?'...");
        
        // Tìm element bằng evaluateHandle (không phải evaluate)
        const composerHandle = await page.evaluateHandle(() => {
            // Tìm theo aria-placeholder (Facebook dùng cái này cho ô compose)
            let el = document.querySelector('div[aria-placeholder]');
            if (el) return el;
            
            // Tìm theo role="button" chứa text
            const buttons = Array.from(document.querySelectorAll('div[role="button"], span'));
            el = buttons.find(b => {
                const txt = (b.innerText || '').trim();
                return txt.length > 5 && txt.length < 50 && (
                    txt.includes("Bạn đang nghĩ gì") || 
                    txt.includes("What's on your mind") ||
                    txt.includes("Có gì mới")
                );
            });
            return el || null;
        });
        
        const composerElement = composerHandle.asElement();
        if (composerElement) {
            // Scroll vào view trước
            await composerElement.evaluate(el => el.scrollIntoView({ block: 'center' }));
            await delay(1000);
            
            const box = await composerElement.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                console.log(`[POST] Tìm thấy composer tại (${Math.round(box.x)}, ${Math.round(box.y)}), size ${Math.round(box.width)}x${Math.round(box.height)}`);
                // Click bằng mouse coordinate → isTrusted: true
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                console.log("[POST] Đã click vào ô compose.");
            } else {
                console.log("[POST] Composer có size 0, thử click bằng Puppeteer...");
                await composerElement.click();
            }
            await composerHandle.dispose();
        } else {
            await composerHandle.dispose();
            console.log("[POST] Không tìm thấy ô compose, thử bấm phím 'p'...");
            // Fallback: keyboard shortcut
            await page.keyboard.press('p');
        }
        
        // Chờ composer dialog xuất hiện
        console.log("[POST] Bước 3: Chờ composer dialog mở...");
        await delay(rdn(2000, 3000));
        
        // Debug screenshot
        await page.screenshot({ path: path.join(debugDir, 'step2_after_click.png') });
        console.log("[POST] Screenshot step2 saved.");
        
        // Xác nhận dialog đã mở
        let dialogOpened = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            const hasDialog = await page.$('div[role="dialog"]');
            const hasTextbox = await page.$('div[role="textbox"][contenteditable="true"]');
            if (hasDialog || hasTextbox) {
                dialogOpened = true;
                console.log("[POST] ✅ Composer dialog đã mở!");
                break;
            }
            console.log(`[POST] Dialog chưa mở, thử lại... (${attempt + 1}/3)`);
            // Thử click lại
            await page.mouse.click(683, 384); // Click giữa màn hình
            await delay(2000);
        }

        if (!dialogOpened) {
            await page.screenshot({ path: path.join(debugDir, 'step2_failed.png') });
            throw new Error("Không thể mở Composer Dialog. Xem debug/step2_failed.png");
        }

        // ============================================================
        // BƯỚC 5: GÕ NỘI DUNG
        // ============================================================
        console.log("[POST] Bước 4: Gõ nội dung...");
        if (finalMessage) {
            // Focus textbox bằng evaluate, gõ bằng keyboard
            const focused = await page.evaluate(() => {
                const textbox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                if (textbox) {
                    textbox.focus();
                    return true;
                }
                return false;
            });
            
            if (focused) {
                await delay(500);
                await page.keyboard.type(finalMessage, { delay: rdn(20, 50) });
                console.log("[POST] ✅ Đã gõ nội dung bài viết.");
            } else {
                console.log("[POST] ⚠ Không thể focus textbox.");
            }
            await delay(rdn(1000, 2000));
        }

        // ============================================================
        // BƯỚC 6: UPLOAD ẢNH (trong dialog đã mở)
        // ============================================================
        if (tempImagePath) {
            console.log("[POST] Bước 5: Upload ảnh...");
            // Tìm input file TRONG dialog (không phải ngoài trang)
            const dialogFileInput = await page.$('div[role="dialog"] input[type="file"]');
            const anyFileInput = await page.$('input[type="file"]');
            const fileInput = dialogFileInput || anyFileInput;
            
            if (fileInput) {
                await fileInput.uploadFile(tempImagePath);
                console.log("[POST] ✅ Đã upload ảnh.");
                
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[POST] Phát hiện Video! Chờ upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(4000, 7000));
                }
            } else {
                console.log("[POST] ⚠ Không tìm thấy input file trong dialog.");
            }
        }

        // ============================================================
        // BƯỚC 7: CLICK NÚT ĐĂNG
        // ============================================================
        console.log("[POST] Bước 6: Tìm và click nút Đăng...");
        await delay(rdn(1000, 2000));
        
        // Debug screenshot trước khi submit
        await page.screenshot({ path: path.join(debugDir, 'step3_before_submit.png') });
        
        
        // Tìm nút Đăng - thử nhiều cách
        const postBtnHandle = await page.evaluateHandle(() => {
            // Chiến lược 1: Tìm theo aria-label
            let btn = document.querySelector('div[aria-label="Đăng"][role="button"]') ||
                      document.querySelector('div[aria-label="Post"][role="button"]') ||
                      document.querySelector('span[aria-label="Đăng"]') ||
                      document.querySelector('span[aria-label="Post"]');
            if (btn) return btn;
            
            // Chiến lược 2: Tìm TRONG dialog bằng text content
            const dialog = document.querySelector('div[role="dialog"]');
            if (dialog) {
                const allBtns = Array.from(dialog.querySelectorAll('div[role="button"]'));
                btn = allBtns.find(b => {
                    const txt = (b.innerText || '').trim();
                    return txt === 'Đăng' || txt === 'Post';
                });
                if (btn) return btn;
            }
            
            // Chiến lược 3: Tìm toàn trang bằng text content
            const allButtons = Array.from(document.querySelectorAll('div[role="button"], button'));
            btn = allButtons.find(b => {
                const txt = (b.innerText || '').trim();
                const label = (b.getAttribute('aria-label') || '').trim();
                return (txt === 'Đăng' || txt === 'Post' || label === 'Đăng' || label === 'Post') &&
                       b.offsetParent !== null; // Phải visible
            });
            if (btn) return btn;
            
            return null;
        });
        
        // Debug: Log tất cả nút trong dialog
        const dialogBtns = await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return { hasDialog: false, buttons: [] };
            const btns = Array.from(dialog.querySelectorAll('div[role="button"]'));
            return {
                hasDialog: true,
                buttons: btns.map(b => ({
                    text: (b.innerText || '').trim().substring(0, 30),
                    ariaLabel: b.getAttribute('aria-label'),
                    ariaDisabled: b.getAttribute('aria-disabled'),
                    visible: b.offsetParent !== null
                }))
            };
        });
        console.log("[POST] Debug buttons trong dialog:", JSON.stringify(dialogBtns, null, 2));
        
        const postBtnElement = postBtnHandle.asElement();
        let posted = false;
        
        if (postBtnElement) {
            // Chờ nút enable
            for (let i = 0; i < 5; i++) {
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), postBtnElement);
                if (isDisabled !== 'true') {
                    console.log("[POST] Nút Đăng đã active!");
                    break;
                }
                console.log(`[POST] Nút Đăng chưa active, chờ... (${i+1}/5)`);
                await delay(1500);
            }
            
            const box = await postBtnElement.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                console.log(`[POST] Click nút Đăng tại (${Math.round(box.x + box.width/2)}, ${Math.round(box.y + box.height/2)})`);
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                posted = true;
            } else {
                console.log("[POST] Nút Đăng có size 0, thử .click()...");
                try { await postBtnElement.click(); posted = true; } catch(e) {}
            }
            await postBtnHandle.dispose();
        } else {
            await postBtnHandle.dispose();
            console.log("[POST] ⚠ Không tìm thấy nút Đăng. Xem debug buttons ở trên.");
        }

        if (posted) {
            await delay(rdn(6000, 10000));
            await page.screenshot({ path: path.join(debugDir, 'step4_after_submit.png') });
            console.log("[POST] 🟢 Hoàn thành đăng bài!");
            await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
        } else {
            await page.screenshot({ path: path.join(debugDir, 'step3_submit_failed.png') });
            throw new Error("Không thể bấm nút Đăng. Xem debug/ để biết chi tiết.");
        }

    } catch (e) {
        console.error("[POST_ERROR]", e);
        await logAction('post', 'error', `Lỗi đăng bài: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            try { fs.unlinkSync(tempImagePath); console.log("[POST] Đã dọn dẹp file nháp."); } catch (err) {}
        }
        process.exit(0);
    }
})();
