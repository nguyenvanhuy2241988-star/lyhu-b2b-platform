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
            await logAction('post', 'error', `Đăng Bài: Lỗi - Kho "${category}" trống`);
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
        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        await logAction('post', 'info', `Tiến hành Đăng Bài lên Cá nhân...`);

        // ===== CHIẾN LƯỢC: Upload file trước để tự mở Composer =====
        // Trên www.facebook.com, input[type="file"] tồn tại ẩn trên trang.
        // Khi upload file vào đó, Facebook tự mở composer dialog.
        // Sau đó dùng evaluate+keyboard để gõ text và submit - KHÔNG dùng .click()

        await page.goto("https://www.facebook.com/", { waitUntil: 'domcontentloaded', timeout: 30000 });
        await delay(rdn(4000, 6000));

        if (tempImagePath) {
            // === FLOW CÓ ẢNH: Upload file trước → composer tự mở ===
            console.log("[POST] Chế độ: Đăng bài CÓ ảnh...");
            
            // Tìm input file ẩn trên trang (Facebook luôn có sẵn)
            const fileInputs = await page.$$('input[type="file"]');
            let uploadInput = null;
            for (const fi of fileInputs) {
                const accept = await page.evaluate(el => el.getAttribute('accept'), fi);
                // Tìm input nhận ảnh/video (không phải input khác)
                if (!accept || accept.includes('image') || accept.includes('video') || accept.includes('*')) {
                    uploadInput = fi;
                    break;
                }
            }
            
            if (!uploadInput && fileInputs.length > 0) {
                uploadInput = fileInputs[0]; // Fallback: dùng input đầu tiên
            }
            
            if (uploadInput) {
                console.log(`[POST] Đang upload ảnh trực tiếp: ${tempImagePath}`);
                await uploadInput.uploadFile(tempImagePath);
                
                // Chờ composer dialog mở sau khi upload
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[POST] Phát hiện Video! Chờ upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(5000, 8000));
                }
                console.log("[POST] Upload hoàn tất, đang gõ text...");
            } else {
                console.log("[POST] Không tìm thấy input file, thử mở composer thủ công...");
            }
            
            // Gõ text vào textbox (dùng evaluate để focus, keyboard để gõ)
            if (finalMessage) {
                await page.evaluate(() => {
                    const textbox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                    if (textbox) {
                        textbox.focus();
                        // Đặt cursor vào cuối text hiện có
                        const range = document.createRange();
                        range.selectNodeContents(textbox);
                        range.collapse(false);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                });
                await delay(500);
                await page.keyboard.type(finalMessage, { delay: rdn(20, 50) });
                console.log("[POST] Đã gõ nội dung bài viết.");
                await delay(rdn(1000, 2000));
            }
        } else {
            // === FLOW CHỈ TEXT: Mở composer bằng cách click "Bạn đang nghĩ gì" ===
            console.log("[POST] Chế độ: Đăng bài CHỈ TEXT...");
            
            // Thử focus trực tiếp vào ô compose (không cần click)
            const opened = await page.evaluate(() => {
                // Tìm và click element chứa "Bạn đang nghĩ gì" bằng native click
                const elements = Array.from(document.querySelectorAll('div[role="button"], span'));
                const target = elements.find(el => {
                    const txt = (el.innerText || '').trim();
                    return txt.length < 50 && (
                        txt.includes("Bạn đang nghĩ gì") || 
                        txt.includes("What's on your") ||
                        txt.includes("Có gì mới")
                    );
                });
                if (target) {
                    target.click();
                    return true;
                }
                return false;
            });
            
            await delay(rdn(2000, 3000));
            
            // Gõ text
            if (finalMessage) {
                await page.evaluate(() => {
                    const textbox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                    if (textbox) textbox.focus();
                });
                await delay(500);
                await page.keyboard.type(finalMessage, { delay: rdn(20, 50) });
                console.log("[POST] Đã gõ nội dung bài viết.");
                await delay(rdn(1000, 2000));
            }
        }

        // === SUBMIT: Tìm nút Đăng bằng evaluateHandle rồi click bằng mouse coordinate ===
        console.log("[POST] Sẵn sàng đăng bài...");
        await delay(rdn(2000, 3000)); // Chờ lâu hơn để nút "Đăng" enable
        
        // Tìm nút Đăng/Post bằng evaluateHandle (trả về element reference)
        const postBtnHandle = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
            const postBtn = buttons.find(btn => {
                const label = btn.getAttribute('aria-label') || '';
                const txt = (btn.innerText || '').trim();
                return (label === 'Đăng' || label === 'Post' || txt === 'Đăng' || txt === 'Post');
            });
            return postBtn || null;
        });
        
        const postBtnElement = postBtnHandle.asElement();
        let posted = false;
        
        if (postBtnElement) {
            // Chờ nút enable (Facebook cần 1-2s sau khi gõ xong)
            for (let i = 0; i < 5; i++) {
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), postBtnElement);
                if (isDisabled !== 'true') break;
                console.log(`[POST] Nút Đăng chưa active, chờ thêm... (${i+1}/5)`);
                await delay(1500);
            }
            
            const box = await postBtnElement.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                // Click bằng mouse coordinate → isTrusted: true → React accepts
                console.log(`[POST] Click nút Đăng tại tọa độ (${Math.round(box.x + box.width/2)}, ${Math.round(box.y + box.height/2)})`);
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                posted = true;
            }
            await postBtnHandle.dispose();
        }

        if (posted) {
            await delay(rdn(6000, 10000));
            console.log("[POST] 🟢 Hoàn thành đăng bài!");
            await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
        } else {
            // Fallback: thử Enter
            console.log("[POST] Không tìm thấy nút Đăng, thử Ctrl+Enter...");
            await page.keyboard.down('Control');
            await page.keyboard.press('Enter');
            await page.keyboard.up('Control');
            await delay(rdn(6000, 10000));
            console.log("[POST] 🟢 Đã gửi bài bằng Ctrl+Enter!");
            await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
        }

    } catch (e) {
        console.error("[POST_ERROR]", e);
        await logAction('post', 'error', `Lỗi đăng bài: ${e.message}`);
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
