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
        browser = await launchBrowser();
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // 4. Tìm Group để đăng
        // Chuyển đổi URL sang mbasic format
        let mbasicGroupUrl = null;
        
        if (groupUrl) {
            // Extract group ID/slug from URL
            const groupMatch = groupUrl.match(/groups\/([^\/\?]+)/);
            if (groupMatch) {
                mbasicGroupUrl = `https://mbasic.facebook.com/groups/${groupMatch[1]}`;
            } else {
                mbasicGroupUrl = groupUrl.replace('www.facebook.com', 'mbasic.facebook.com');
            }
        } else {
            // Đăng lên 1 nhóm ngẫu nhiên - cần tìm danh sách nhóm trước
            await page.goto("https://mbasic.facebook.com/groups/?category=membership", { waitUntil: 'networkidle2', timeout: 30000 });
            await delay(rdn(2000, 3000));
            
            const groupLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
                return links
                    .map(l => l.href)
                    .filter(h => h.includes('/groups/') && !h.includes('category') && !h.includes('discover'));
            });
            
            if (groupLinks.length === 0) throw new Error("Nick chưa tham gia Hội nhóm nào!");
            const uniqueLinks = [...new Set(groupLinks.map(l => l.split('?')[0]))];
            const randomTarget = uniqueLinks[Math.floor(Math.random() * uniqueLinks.length)];
            console.log(`[GROUP_POST] Chuyển hướng tới Nhóm rando: ${randomTarget}`);
            mbasicGroupUrl = randomTarget;
        }
        
        console.log(`[GROUP_POST] Mở mbasic group: ${mbasicGroupUrl}`);
        await page.goto(mbasicGroupUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(rdn(2000, 3000));

        // ===== CHIẾN LƯỢC MBASIC: Không có React, chỉ HTML form thuần =====
        
        // Bước 5: Tìm textarea trên mbasic group page
        // mbasic group page có textarea hoặc link "Write Post"/"Viết gì đó"
        let textArea = await page.$('textarea[name="xc_message"]');
        
        if (!textArea) {
            // Thử tìm link composer (mbasic có thể dùng link để mở form viết bài)
            console.log("[GROUP_POST] Tìm link composer trên mbasic...");
            const composerLink = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const match = links.find(a => {
                    const txt = (a.textContent || '').trim().toLowerCase();
                    return txt.includes("viết gì đó") || txt.includes("write something") || 
                           txt.includes("write post") || txt.includes("đăng bài") ||
                           txt.includes("bạn đang nghĩ") || txt.includes("what's on your");
                });
                return match ? match.href : null;
            });

            if (composerLink) {
                await page.goto(composerLink, { waitUntil: 'networkidle2', timeout: 30000 });
                await delay(rdn(2000, 3000));
                textArea = await page.$('textarea');
            }
        }

        if (!textArea) {
            throw new Error("Nhóm này có thể không cho phép thành viên tự đăng bài (Need approval/Disabled).");
        }
        
        // Bước 6: Gõ nội dung
        if (finalMessage) {
            await textArea.click();
            await delay(500);
            await textArea.type(finalMessage, { delay: rdn(20, 50) });
            console.log("[GROUP_POST] Đã gõ nội dung bài viết.");
            await delay(rdn(1000, 2000));
        }

        // Bước 7: Upload ảnh nếu có
        if (tempImagePath) {
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                console.log(`[GROUP_POST] Đang upload ảnh: ${tempImagePath}`);
                await fileInput.uploadFile(tempImagePath);
                const isVideo = tempImagePath.match(/\.(mp4|mov|avi|wmv)$/i);
                if (isVideo) {
                    console.log("[GROUP_POST] File Video nặng, chờ 20-40s để upload...");
                    await delay(rdn(20000, 40000));
                } else {
                    await delay(rdn(3000, 6000));
                }
            }
        }

        // Bước 8: Submit form đăng bài
        const postBtn = await page.$('input[type="submit"][name="view_post"], input[type="submit"][value="Đăng"], input[type="submit"][value="Post"]');
        if (postBtn) {
            await postBtn.click();
            await delay(rdn(5000, 8000));
            console.log("[GROUP_POST] 🟢 Hoàn thành đăng bài vào Group (mbasic)!");
            await logAction('post', 'success', `Đã rải 1 bài seeding vào Group (Kho: ${category})`);
        } else {
            // Fallback: tìm bất kỳ nút submit nào
            const anySubmit = await page.$('input[type="submit"]');
            if (anySubmit) {
                await anySubmit.click();
                await delay(rdn(5000, 8000));
                console.log("[GROUP_POST] 🟢 Hoàn thành đăng bài vào Group (mbasic, fallback)!");
                await logAction('post', 'success', `Đã rải 1 bài seeding vào Group (Kho: ${category})`);
            } else {
                throw new Error("Nút Đăng Bài bị ẩn trên mbasic.");
            }
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
