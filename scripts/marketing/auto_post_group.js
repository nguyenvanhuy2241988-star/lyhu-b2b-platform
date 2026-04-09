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
    
    try {
        const args = process.argv.slice(2);
        const rawArg = args.find(a => !a.startsWith('--')) || "";
        const isTestMode = args.includes('--test');
        
        // Tạo thư mục debug
        const debugDir = path.join(__dirname, '../../debug');
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
        
        if (isTestMode) {
            console.log("\n🧪 === CHẾ ĐỘ TEST === Chỉ kiểm tra, KHÔNG đăng bài! ===");
        }
        
        let groupUrl = null;
        let category = "Mặc định";
        
        if (rawArg.includes("facebook.com/groups/")) {
            // Hỗ trợ cả 2 format:
            // Format 1: "URL|Category"  
            // Format 2: "URL  Category" (space)
            if (rawArg.includes('|')) {
                const parts = rawArg.split('|');
                groupUrl = parts[0].trim();
                if (parts.length > 1) category = parts[1].trim();
            } else {
                // Tách URL khỏi category bằng regex: URL kết thúc sau groups/ID
                const urlMatch = rawArg.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    groupUrl = urlMatch[1].trim();
                    const rest = rawArg.replace(groupUrl, '').trim();
                    if (rest) category = rest;
                }
            }
        } else if (rawArg) {
            category = rawArg.trim();
        }

        console.log(`[GROUP_POST] Mở kho: ${category}. Nhắm mục tiêu: ${groupUrl || 'Ngẫu nhiên nhóm đã tham gia'}`);

        // 1. Kéo Mồi
        const { data, error } = await supabase.from('bot_contents').select('*').eq('category', category);
        if (error || !data || data.length === 0) {
            await logAction('post', 'error', `Lỗi: Kho bài đăng "${category}" trống`);
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
        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // 4. Tìm Group để đăng
        if (groupUrl) {
            await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        } else {
            await page.goto("https://www.facebook.com/groups/joins", { waitUntil: 'domcontentloaded', timeout: 60000 });
            await delay(rdn(3000, 5000));
            const groupLinks = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href*="/groups/"]'))
                    .map(l => l.href)
                    .filter(h => h.includes('/groups/') && !h.includes('category') && !h.includes('discover'));
            });
            if (groupLinks.length === 0) throw new Error("Nick chưa tham gia Hội nhóm nào!");
            const uniqueLinks = [...new Set(groupLinks.map(l => l.split('?')[0]))];
            const randomTarget = uniqueLinks[Math.floor(Math.random() * uniqueLinks.length)];
            console.log(`[GROUP_POST] Chuyển hướng tới Nhóm: ${randomTarget}`);
            await page.goto(randomTarget, { waitUntil: 'domcontentloaded', timeout: 60000 });
        }
        await delay(rdn(4000, 6000));
        await page.screenshot({ path: path.join(debugDir, 'group_step1_page.png') });
        console.log(`[GROUP_POST] Screenshot trang group đã lưu: debug/group_step1_page.png`);

        // ============================================================
        // BƯỚC 5: MỞ COMPOSER DIALOG (KHÔNG PHẢI COMMENT BOX!)
        // ============================================================
        console.log("[GROUP_POST] Bước 1: Tìm + click nút 'Viết gì đó' trên Group...");
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(2000);
        await page.keyboard.press('Escape'); // Đóng popup nếu có
        await delay(1000);
        
        // Tìm nút composer với retry
        let composerClicked = false;
        for (let retry = 0; retry < 5; retry++) {
            const composerInfo = await page.evaluate(() => {
                const allElements = Array.from(document.querySelectorAll('div[role="button"], span'));
                const el = allElements.find(b => {
                    const txt = (b.innerText || '').trim();
                    const rect = b.getBoundingClientRect();
                    return rect.width > 200 && rect.height > 10 && 
                           txt.length > 3 && txt.length < 50 && (
                        txt.includes("Viết gì đó") || txt.includes("Write something") ||
                        txt.includes("Bạn viết gì đi") || txt.includes("Có gì mới") ||
                        txt.includes("Bạn đang nghĩ gì") || txt.includes("What's on your mind")
                    );
                });
                if (el) {
                    el.scrollIntoView({ block: 'center', behavior: 'instant' });
                    const rect = el.getBoundingClientRect();
                    return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: (el.innerText || '').trim().substring(0, 30) };
                }
                return { found: false };
            });
            
            if (composerInfo.found) {
                console.log(`[GROUP_POST] Tìm thấy composer: "${composerInfo.text}" tại (${Math.round(composerInfo.x)}, ${Math.round(composerInfo.y)})`);
                await delay(500);
                await page.mouse.click(composerInfo.x, composerInfo.y);
                console.log("[GROUP_POST] Đã click vào ô compose.");
                composerClicked = true;
                break;
            }
            
            console.log(`[GROUP_POST] Chưa tìm thấy composer, chờ... (${retry + 1}/5)`);
            await delay(3000);
            await page.evaluate(() => window.scrollTo(0, 0));
        }
        
        if (!composerClicked) {
            throw new Error("Không tìm thấy nút 'Viết gì đó' trên trang Group.");
        }
        
        // ============================================================
        // BƯỚC 6: CHỜ DIALOG "TẠO BÀI VIẾT" MỞ
        // ============================================================
        console.log("[GROUP_POST] Bước 2: Chờ dialog 'Tạo bài viết'...");
        await delay(rdn(2000, 3000));
        
        let dialogOpened = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            const dialogCheck = await page.evaluate(() => {
                const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                for (const dialog of allDialogs) {
                    const text = dialog.innerText || '';
                    const isCreatePost = text.includes('Tạo bài viết') || 
                                        text.includes('Create post') || 
                                        text.includes('Create Post');
                    const hasTextbox = !!dialog.querySelector('div[role="textbox"][contenteditable="true"]');
                    if (isCreatePost || hasTextbox) {
                        return { found: true, isCreatePost, hasTextbox, dialogCount: allDialogs.length };
                    }
                }
                return { found: allDialogs.length > 0, isCreatePost: false, dialogCount: allDialogs.length };
            });
            
            console.log(`[GROUP_POST] Dialog check: ${JSON.stringify(dialogCheck)}`);
            
            if (dialogCheck.isCreatePost || dialogCheck.hasTextbox) {
                dialogOpened = true;
                console.log("[GROUP_POST] ✅ Dialog composer đã mở!");
                break;
            }
            
            // Đóng dialog sai nếu có
            if (dialogCheck.found && !dialogCheck.isCreatePost) {
                await page.keyboard.press('Escape');
                await delay(1000);
            }
            
            console.log(`[GROUP_POST] Dialog chưa mở, thử lại... (${attempt + 1}/3)`);
            await delay(2000);
        }
        
        if (!dialogOpened) {
            await page.screenshot({ path: path.join(debugDir, 'group_step2_failed.png') });
            throw new Error("Không thể mở Dialog 'Tạo bài viết' trên Group. Xem debug/group_step2_failed.png");
        }
        
        // Screenshot dialog đã mở
        await page.screenshot({ path: path.join(debugDir, 'group_step2_dialog_opened.png') });
        console.log(`[GROUP_POST] Screenshot dialog: debug/group_step2_dialog_opened.png`);
        
        // *** TEST MODE: Dừng tại đây, không gõ/đăng ***
        if (isTestMode) {
            console.log("\n🧪 === KẾT QUẢ TEST ===");
            console.log("✅ Đã vào group thành công");
            console.log("✅ Đã tìm thấy nút composer");
            console.log("✅ Đã mở dialog 'Tạo bài viết'");
            console.log("✅ Dialog đúng (không phải comment box)");
            console.log("\n📸 Xem screenshot: debug/group_step2_dialog_opened.png");
            console.log("\n🟢 MỌI THỨ OK! Bác có thể chạy lại KHÔNG có --test để đăng thật.");
            await page.keyboard.press('Escape'); // Đóng dialog
            await delay(1000);
            return; // Dừng, không đăng
        }
        
        // ============================================================
        // BƯỚC 7: GÕ NỘI DUNG (TRONG dialog, KHÔNG PHẢI comment box!)
        // ============================================================
        console.log("[GROUP_POST] Bước 3: Gõ nội dung...");
        if (finalMessage) {
            const textboxInfo = await page.evaluate(() => {
                const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                let targetDialog = null;
                for (const d of allDialogs) {
                    const text = d.innerText || '';
                    if (text.includes('Tạo bài viết') || text.includes('Create post') || 
                        d.querySelector('div[role="textbox"][contenteditable="true"]')) {
                        targetDialog = d;
                        break;
                    }
                }
                
                let textbox = null;
                if (targetDialog) {
                    textbox = targetDialog.querySelector('div[role="textbox"][contenteditable="true"]');
                }
                if (textbox) {
                    textbox.scrollIntoView({ block: 'center' });
                    const rect = textbox.getBoundingClientRect();
                    return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
                return { found: false };
            });
            
            if (textboxInfo.found) {
                await page.mouse.click(textboxInfo.x, textboxInfo.y);
                await delay(2000);
                // Warm up input
                await page.keyboard.press('Space');
                await delay(200);
                await page.keyboard.press('Backspace');
                await delay(500);
                // Gõ nội dung
                await page.keyboard.type(finalMessage, { delay: rdn(30, 60) });
                console.log("[GROUP_POST] ✅ Đã gõ nội dung bài viết.");
            } else {
                console.log("[GROUP_POST] ⚠ Không thể tìm textbox trong dialog.");
            }
            await delay(rdn(1000, 2000));
        }

        // ============================================================
        // BƯỚC 8: UPLOAD ẢNH (TRONG dialog)
        // ============================================================
        if (tempImagePath) {
            console.log("[GROUP_POST] Bước 4: Upload ảnh...");
            // Tìm file input TRONG dialog, không phải ở comment box ngoài!
            const dialogFileInput = await page.evaluate(() => {
                const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                for (const d of allDialogs) {
                    const text = d.innerText || '';
                    if (text.includes('Tạo bài viết') || text.includes('Create post') || 
                        d.querySelector('div[role="textbox"][contenteditable="true"]')) {
                        const input = d.querySelector('input[type="file"]');
                        return input ? true : false;
                    }
                }
                return false;
            });
            
            // Upload qua dialog's file input hoặc fallback
            const fileInput = dialogFileInput 
                ? await page.$('div[role="dialog"] input[type="file"]')
                : await page.$('input[type="file"]');
            
            if (fileInput) {
                await fileInput.uploadFile(tempImagePath);
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[GROUP_POST] Video nặng, chờ upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(5000, 8000));
                }
                console.log("[GROUP_POST] ✅ Đã upload ảnh.");
            } else {
                console.log("[GROUP_POST] ⚠ Không tìm thấy input file.");
            }
        }

        // ============================================================
        // BƯỚC 9: CLICK NÚT ĐĂNG (TRONG dialog)
        // ============================================================
        console.log("[GROUP_POST] Bước 5: Tìm và click nút Đăng...");
        await delay(rdn(2000, 3000));
        
        const postBtnHandle = await page.evaluateHandle(() => {
            const allDialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
            let createPostDialog = null;
            for (const d of allDialogs) {
                const text = d.innerText || '';
                if (text.includes('Tạo bài viết') || text.includes('Create post') || 
                    d.querySelector('div[role="textbox"][contenteditable="true"]')) {
                    createPostDialog = d;
                    break;
                }
            }
            
            if (createPostDialog) {
                let btn = createPostDialog.querySelector('div[aria-label="Đăng"][role="button"]') ||
                          createPostDialog.querySelector('div[aria-label="Post"][role="button"]');
                if (btn) return btn;
                
                const allBtns = Array.from(createPostDialog.querySelectorAll('div[role="button"]'));
                btn = allBtns.find(b => {
                    const txt = (b.innerText || '').trim();
                    return txt === 'Đăng' || txt === 'Post';
                });
                if (btn) return btn;
            }
            
            // Fallback toàn trang
            const allButtons = Array.from(document.querySelectorAll('div[role="button"], button'));
            let btn = allButtons.find(b => {
                const txt = (b.innerText || '').trim();
                const label = (b.getAttribute('aria-label') || '').trim();
                return (txt === 'Đăng' || txt === 'Post' || label === 'Đăng' || label === 'Post') &&
                       b.offsetParent !== null;
            });
            return btn || null;
        });
        
        const postBtnElement = postBtnHandle.asElement();
        let posted = false;
        
        if (postBtnElement) {
            for (let i = 0; i < 5; i++) {
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), postBtnElement);
                if (isDisabled !== 'true') {
                    console.log("[GROUP_POST] Nút Đăng đã active!");
                    break;
                }
                console.log(`[GROUP_POST] Nút Đăng chưa active, chờ thêm... (${i+1}/5)`);
                await delay(1500);
            }
            
            const box = await postBtnElement.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                console.log(`[GROUP_POST] Click nút Đăng tại (${Math.round(box.x + box.width/2)}, ${Math.round(box.y + box.height/2)})`);
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                posted = true;
            }
            await postBtnHandle.dispose();
        }

        if (posted) {
            await delay(rdn(6000, 10000));
            console.log("[GROUP_POST] 🟢 Hoàn thành đăng bài vào Group!");
            await logAction('post', 'success', `Đã rải 1 bài seeding vào Group (Kho: ${category})`);
        } else {
            console.log("[GROUP_POST] Không tìm thấy nút Đăng.");
            throw new Error("Nút Đăng Bài bị ẩn hoặc không tìm thấy.");
        }

    } catch (e) {
        console.error("[GROUP_POST_ERROR]", e);
        await logAction('post', 'error', `Lỗi đăng Group: ${e.message}`);
    } finally {
        if (browser) await browser.close();
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            try { fs.unlinkSync(tempImagePath); } catch (err) {}
        }
        process.exit(0);
    }
})();
