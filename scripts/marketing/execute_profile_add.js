/**
 * Level 4: Execution Module - Profile Friends Scanner
 * Mở danh sách bạn bè của 1 người cụ thể và tự động kết bạn
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeProfileAdd(rawCommand, maxAdds = 15) {
    console.log(`[EXEC] Received Command (Profile URL): "${rawCommand}"`);

    // 1. Chuẩn hóa URL mục tiêu
    let targetUrl = rawCommand.trim();
    if (!targetUrl.includes('facebook.com')) {
        console.error("[EXEC] Lỗi: Đường dẫn không trỏ tới Facebook.");
        await logAction('search', 'error', `Đường dẫn FB không hợp lệ: ${targetUrl}`);
        return;
    }

    // Tự động append `/friends` nếu URL chưa có
    if (!targetUrl.includes('sk=friends') && !/\/friends\/?$/.test(targetUrl)) {
        if (targetUrl.includes('profile.php?id=')) {
            targetUrl += '&sk=friends';
        } else {
            if (!targetUrl.endsWith('/')) targetUrl += '/';
            targetUrl += 'friends';
        }
    }

    console.log(`[EXEC] Auto-formated Target URL: ${targetUrl}`);
    await logAction('search', 'info', `🚀 Đột nhập danh sách bạn bè của: ${targetUrl.split('facebook.com/')[1] || 'Profile'}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        console.log(`[EXEC] Navigating to: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        await sleep(4000);

        // Kiểm tra xem có bị Facebook chặn xem bạn bè không (báo trống hoặc lỗi hiển thị)
        const isPageAvailable = await page.evaluate(() => {
            return !document.body.innerText.includes("This content isn't available right now") &&
                   !document.body.innerText.includes("Nội dung này hiện không khả dụng");
        });

        if (!isPageAvailable) {
            console.log(`[EXEC] Trang bị lỗi hoặc Không khả dụng.`);
            await logAction('search', 'warning', `Profile bị khoá hoặc FB chặn hiển thị.`);
            return;
        }

        // 3. Scroll to load results
        console.log(`[EXEC] Scrolling để kích mồi hiển thị danh sách...`);
        for (let i = 0; i < 4; i++) {
            await page.evaluate(() => window.scrollBy(0, 800));
            await sleep(2000);
        }

        // 4. Scan & Click - Chỉ ưu tiên các nút có thuộc tính của Add Friend
        const buttonHandles = await page.$$('div[role="button"]');
        let addedCount = 0;

        console.log(`[EXEC] Quét ${buttonHandles.length} phần tử rác kiếm nút "Thêm bạn bè"...`);

        for (const btnHandle of buttonHandles) {
            if (addedCount >= maxAdds) break;

            const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || "", btnHandle);

            if (text.includes('Add friend') || text.includes('Thêm bạn bè')) {

                // Thuật toán leo 12 bậc trích xuất Tên và Link
                const profileData = await page.evaluate(btn => {
                    let url = 'Unknown';
                    let name = 'Facebook User';
                    
                    // Lên thử Tên từ aria-label
                    const btnAria = btn.getAttribute('aria-label') || '';
                    const nameMatch = btnAria.match(/(?:Thêm|Add) (.+?) (?:làm bạn bè|as a friend)/i);
                    if (nameMatch && nameMatch[1]) {
                        name = nameMatch[1].trim();
                    }
                    
                    let container = btn.parentElement;
                    let safeGuard = 0;
                    
                    while (container && safeGuard < 12) {
                        const links = container.querySelectorAll('a');
                        for (const link of links) {
                            if (link.href && !link.href.includes('/friends/') && !link.href.includes('search') && link.href.includes('facebook.com')) {
                                url = link.href.split('?')[0]; 
                                if (name === 'Facebook User' && link.innerText && link.innerText.trim().length > 1) {
                                    name = link.innerText.trim();
                                }
                                break;
                            }
                        }
                        if (url !== 'Unknown') break;
                        container = container.parentElement;
                        safeGuard++;
                    }
                    
                    return { url, name };
                }, btnHandle);

                if (profileData.url !== 'Unknown') {
                    console.log(`[EXEC] 🎯 Đã khóa rà mục tiêu: ${profileData.name} | ${profileData.url}`);

                    try {
                        await page.evaluate(el => el.click(), btnHandle);
                        addedCount++;

                        await logAction('search', 'success', `[Tự động] Đã gửi lời mời: ${profileData.name}`, {
                            profile_url: profileData.url
                        });

                        await saveLead({
                            source: `fb_profile_friends`,
                            name: profileData.name,
                            profile_url: profileData.url
                        });

                        // Coffee Break
                        if (addedCount % 3 === 0) {
                            const longWait = 45000 + Math.random() * 30000; 
                            console.log(`[EXEC] ☕ Đã cướp ${addedCount} người. Tạm nghỉ giải lao ${Math.round(longWait/1000)}s chống Spam...`);
                            await sleep(longWait);
                        } else {
                            const shortWait = 15000 + Math.random() * 10000; 
                            console.log(`[EXEC] ⏳ Chờ ${Math.round(shortWait/1000)}s ngụy trang hành vi người dùng...`);
                            await sleep(shortWait);
                        }
                    } catch (e) {
                        console.log(`[EXEC] ❌ Lỗi khi Click: ${e.message}`);
                    }
                }
            }
        }

        if (addedCount === 0) {
            console.log(`[EXEC] Không mót được ai. Có thể Facebook của họ đã ẩn bạn bè chung.`);
            await logAction('search', 'warning', `Danh sách bạn bè bị khóa hoặc không tìm thấy người lạ.`);
        }

    } catch (e) {
        console.error(`[EXEC] Lỗi Chí tử: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        console.log(`[EXEC] Hoàn thành đi săn. Đóng trình duyệt...`);
        await sleep(3000); // 3 seconds grace period
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "https://www.facebook.com/zuck";
    executeProfileAdd(cmd);
}

module.exports = { executeProfileAdd };
