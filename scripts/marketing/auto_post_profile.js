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

        // ===== CHIẾN LƯỢC MỚI: Dùng mbasic.facebook.com =====
        // mbasic là phiên bản HTML thuần của Facebook, KHÔNG có React, 
        // KHÔNG có overlay/dialog, KHÔNG cần click phức tạp.
        // Chỉ cần fill form và submit - 100% ổn định.

        // Bước 4a: Nếu có ảnh, dùng flow upload ảnh trước
        if (tempImagePath) {
            console.log("[POST] Chế độ: Đăng bài CÓ ảnh (mbasic)...");
            
            // Bước 1: Vào trang chính mbasic để tìm link "Ảnh/Photo" 
            await page.goto("https://mbasic.facebook.com/", { waitUntil: 'networkidle2', timeout: 30000 });
            await delay(rdn(2000, 3000));

            // Bước 2: Tìm link "Ảnh" hoặc "Photo" trên composer  
            const photoLink = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const match = links.find(a => {
                    const txt = (a.textContent || '').trim().toLowerCase();
                    return txt.includes('ảnh') || txt.includes('photo') || txt.includes('hình ảnh');
                });
                return match ? match.href : null;
            });

            if (!photoLink) {
                // Fallback: Đăng text-only nếu không tìm thấy link upload ảnh
                console.log("[POST] Không tìm thấy link upload ảnh, chuyển sang đăng text-only...");
                const textArea = await page.$('textarea[name="xc_message"]');
                if (textArea && finalMessage) {
                    await textArea.click();
                    await delay(500);
                    await textArea.type(finalMessage, { delay: rdn(20, 50) });
                }
                const postBtn = await page.$('input[type="submit"][name="view_post"], input[type="submit"][value="Đăng"], input[type="submit"][value="Post"]');
                if (postBtn) {
                    await postBtn.click();
                    await delay(rdn(5000, 8000));
                    console.log("[POST] 🟢 Đã đăng bài TEXT (không upload được ảnh)!");
                    await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân, text-only (Kho: ${category})`);
                } else {
                    throw new Error("Không tìm thấy nút Đăng trên mbasic.");
                }
            } else {
                // Bước 3: Vào trang upload ảnh
                console.log(`[POST] Tìm thấy link upload: ${photoLink}`);
                await page.goto(photoLink, { waitUntil: 'networkidle2', timeout: 30000 });
                await delay(rdn(2000, 3000));

                // Bước 4: Tìm file input và upload
                const fileInput = await page.$('input[type="file"]');
                if (fileInput) {
                    console.log(`[POST] Đang upload ảnh: ${tempImagePath}`);
                    await fileInput.uploadFile(tempImagePath);
                    await delay(rdn(3000, 5000));

                    // Gõ caption/text nếu có
                    const captionBox = await page.$('textarea');
                    if (captionBox && finalMessage) {
                        await captionBox.click();
                        await delay(500);
                        await captionBox.type(finalMessage, { delay: rdn(20, 50) });
                        console.log("[POST] Đã gõ nội dung kèm ảnh.");
                    }

                    const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                    if (isVideo) {
                        console.log("[POST] Phát hiện Video! Chờ upload...");
                        await delay(rdn(20000, 40000));
                    }

                    // Submit
                    const submitBtn = await page.$('input[type="submit"]');
                    if (submitBtn) {
                        await submitBtn.click();
                        await delay(rdn(5000, 8000));
                        console.log("[POST] 🟢 Đã đăng bài CÓ ẢNH thành công!");
                        await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân có ảnh (Kho: ${category})`);
                    } else {
                        throw new Error("Không tìm thấy nút Submit trên trang upload ảnh.");
                    }
                } else {
                    throw new Error("Không tìm thấy input file trên trang upload ảnh mbasic.");
                }
            }
        } else {
            // Bước 4b: Đăng bài CHỈ có text (không ảnh)
            console.log("[POST] Chế độ: Đăng bài CHỈ TEXT (mbasic)...");
            await page.goto("https://mbasic.facebook.com/", { waitUntil: 'networkidle2', timeout: 30000 });
            await delay(rdn(2000, 3000));

            // Trên mbasic, ô đăng bài là textarea name="xc_message"
            const textArea = await page.$('textarea[name="xc_message"]');
            if (textArea && finalMessage) {
                await textArea.click();
                await delay(500);
                await textArea.type(finalMessage, { delay: rdn(20, 50) });
                console.log("[POST] Đã gõ nội dung bài viết.");
                await delay(rdn(1000, 2000));
            } else if (!textArea) {
                // Fallback: thử tìm link "Bạn đang nghĩ gì" trên mbasic rồi click vào
                console.log("[POST] Không thấy textarea trực tiếp, thử tìm link composer...");
                const composerLink = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const match = links.find(a => {
                        const txt = (a.textContent || '').trim();
                        return txt.includes("đang nghĩ gì") || txt.includes("on your mind") || txt.includes("Viết gì đó");
                    });
                    return match ? match.href : null;
                });

                if (composerLink) {
                    await page.goto(composerLink, { waitUntil: 'networkidle2', timeout: 30000 });
                    await delay(rdn(2000, 3000));
                    
                    const composerTextArea = await page.$('textarea');
                    if (composerTextArea && finalMessage) {
                        await composerTextArea.click();
                        await delay(500);
                        await composerTextArea.type(finalMessage, { delay: rdn(20, 50) });
                        console.log("[POST] Đã gõ nội dung (qua composer link).");
                    }
                } else {
                    throw new Error("Không tìm thấy ô đăng bài trên mbasic.facebook.com");
                }
            }

            // Submit form
            const postBtn = await page.$('input[type="submit"][name="view_post"], input[type="submit"][value="Đăng"], input[type="submit"][value="Post"]');
            if (postBtn) {
                await postBtn.click();
                await delay(rdn(5000, 8000));
                console.log("[POST] 🟢 Đã đăng bài TEXT thành công!");
                await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
            } else {
                // Fallback: submit bất kỳ
                const anySubmit = await page.$('input[type="submit"]');
                if (anySubmit) {
                    await anySubmit.click();
                    await delay(rdn(5000, 8000));
                    console.log("[POST] 🟢 Đã đăng bài TEXT thành công (fallback)!");
                    await logAction('post', 'success', `Thành công: Đã đăng 1 Status Cá Nhân (Kho: ${category})`);
                } else {
                    throw new Error("Không tìm thấy nút Đăng trên mbasic.");
                }
            }
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
