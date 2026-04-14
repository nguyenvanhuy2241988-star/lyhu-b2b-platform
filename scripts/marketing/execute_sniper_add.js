/**
 * Level 4: Execution Module - Profile Sniper
 * Bắn tỉa: Đi thẳng vào tường nhà của danh sách Khách (từ chế độ Vơ Vét) và click kết bạn
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSniperAdd(rawCommand) {
    console.log(`[EXEC] Sniper Received Targets: "${rawCommand.substring(0, 50)}..."`);

    let targetUrls = [];
    try {
        if (rawCommand.startsWith('[')) {
            targetUrls = JSON.parse(rawCommand);
        } else {
            targetUrls = rawCommand.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.includes('facebook'));
        }
    } catch (e) {
        targetUrls = rawCommand.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.includes('facebook'));
    }

    if (targetUrls.length === 0) {
        console.error("[EXEC] Sniper lỗi: Không có mục tiêu hợp lệ.");
        await logAction('search', 'error', `Sniper lỗi: Danh sách URL rỗng.`);
        return;
    }

    await logAction('search', 'info', `🎯 Đội Bắn Tỉa Nhận Lệnh tiêu diệt ${targetUrls.length} mục tiêu.`);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    let hitCount = 0;

    try {
        for (let i = 0; i < targetUrls.length; i++) {
            const url = targetUrls[i];
            console.log(`[EXEC] 🎯 Đang ngắm bắn mục tiêu ${i+1}/${targetUrls.length}: ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2' });
            await sleep(4000);

            // Kiểm tra khả dụng
            const isPageAvailable = await page.evaluate(() => {
                return !document.body.innerText.includes("This content isn't available right now") &&
                       !document.body.innerText.includes("Nội dung này hiện không khả dụng");
            });

            if (!isPageAvailable) {
                console.log(`[EXEC] Mục tiêu tàng hình (Profile bị lỗi hoặc chặn). Bỏ qua.`);
                continue;
            }

            // Tìm nút "Thêm bạn bè" trên tường nhà
            const clicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                for (const btn of buttons) {
                    const text = btn.innerText || btn.getAttribute('aria-label') || "";
                    if (text === 'Add friend' || text === 'Thêm bạn bè' || text.includes('Add friend') || text.includes('Thêm bạn bè')) {
                        // Tránh bấm nhầm "Add friend to a list" v.v, chỉ ưu tiên nút Add chính
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (clicked) {
                hitCount++;
                console.log(`[EXEC] 💥 HEADSHOT! Đã bấm Add đối tượng.`);
                
                await logAction('search', 'success', `[Sniper] Đã gửi lời mời tới: ${url}`, {
                    profile_url: url
                });

                // Tốc độ chuẩn an toàn
                if (hitCount % 3 === 0) {
                    const wait = 40000 + Math.random() * 20000;
                    console.log(`[EXEC] ☕ Rút đạn nghỉ ${Math.round(wait/1000)}s...`);
                    await sleep(wait);
                } else {
                    await sleep(15000 + Math.random() * 10000);
                }
            } else {
                console.log(`[EXEC] Đối tượng khóa khiên (Không có nút Add Friend hoặc đã gửi trước đó). Bỏ qua.`);
                await sleep(5000);
            }
        }
        
    } catch (e) {
        console.error(`[EXEC] Sniper Lỗi: ${e.message}`);
        await logAction('search', 'error', `Sniper Lỗi: ${e.message}`);
    } finally {
        console.log(`[EXEC] Sniper rút quân. Hoàn thành ${hitCount}/${targetUrls.length} mục tiêu.`);
        await logAction('search', 'info', `🏁 Sniper hoàn tất nhiệm vụ: Add thành công ${hitCount}/${targetUrls.length} mục tiêu.`);
        await sleep(3000); 
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "https://www.facebook.com/zuck";
    executeSniperAdd(cmd);
}

module.exports = { executeSniperAdd };
