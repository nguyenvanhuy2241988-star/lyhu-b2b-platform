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

        // === Chiến lược: Upload file trước → composer tự mở → evaluate+keyboard ===
        
        if (tempImagePath) {
            console.log("[GROUP_POST] Chế độ CÓ ẢNH: Upload file trước...");
            const fileInputs = await page.$$('input[type="file"]');
            let uploadInput = fileInputs.length > 0 ? fileInputs[0] : null;
            
            if (uploadInput) {
                await uploadInput.uploadFile(tempImagePath);
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[GROUP_POST] File Video nặng, chờ upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(5000, 8000));
                }
                console.log("[GROUP_POST] Upload hoàn tất.");
            }
        } else {
            console.log("[GROUP_POST] Chế độ CHỈ TEXT...");
            await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('div[role="button"], span'));
                const target = elements.find(el => {
                    const txt = (el.innerText || '').trim();
                    return txt.length < 50 && (
                        txt.includes("Viết gì đó") || txt.includes("Write something") ||
                        txt.includes("Bạn viết gì đi") || txt.includes("Có gì mới") ||
                        txt.includes("Thảo luận") || txt.includes("Thêm bài viết")
                    );
                });
                if (target) target.click();
            });
            await delay(rdn(2000, 3000));
        }

        // Gõ text bằng evaluate + keyboard (KHÔNG dùng .click())
        if (finalMessage) {
            await page.evaluate(() => {
                const textbox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                if (textbox) {
                    textbox.focus();
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
            console.log("[GROUP_POST] Đã gõ nội dung bài viết.");
            await delay(rdn(1000, 2000));
        }

        // Submit bằng evaluateHandle + mouse coordinate
        console.log("[GROUP_POST] Sẵn sàng đăng bài...");
        await delay(rdn(2000, 3000));
        
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
            for (let i = 0; i < 5; i++) {
                const isDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), postBtnElement);
                if (isDisabled !== 'true') break;
                console.log(`[GROUP_POST] Nút Đăng chưa active, chờ thêm... (${i+1}/5)`);
                await delay(1500);
            }
            
            const box = await postBtnElement.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                console.log(`[GROUP_POST] Click nút Đăng tại tọa độ (${Math.round(box.x + box.width/2)}, ${Math.round(box.y + box.height/2)})`);
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
