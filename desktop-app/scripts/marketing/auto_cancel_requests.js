/**
 * Level 4: Execution Module - Auto Cancel Sent Friend Requests
 * Tự động hủy các lời mời kết bạn cũ nhất để dọn dẹp chỗ trống (Giới hạn 1000).
 */

const { launchBrowser } = require('./setup_browser');
const { logAction } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoCancelRequests(rawCommand) {
    console.log(`[EXEC] Bắt đầu chiến dịch Dọn Dẹp Lời Mời Kết Bạn đã cũ...`);

    let cancelLimit = 50; // Default cancel 50 requests per run to avoid rate limit
    try {
        if (rawCommand && rawCommand.trim().startsWith('{')) {
            const config = JSON.parse(rawCommand);
            if (config.limit) cancelLimit = config.limit;
        }
    } catch (e) {
        console.log(`[EXEC] Sử dụng cấu hình Mặc Định.`);
    }

    await logAction('search', 'info', `🧹 Bắt đầu chiến dịch Dọn Dẹp: Mục tiêu hủy ${cancelLimit} lời mời cũ nhất.`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    let canceledCount = 0;
    try {
        const targetUrl = 'https://www.facebook.com/friends/requests/outgoing';
        console.log(`[EXEC] Mở trang Lời mời đã gửi: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        await sleep(5000);

        // Kích mồi cuộn trang để nạp thêm lời mời (cuộn xuống đáy để lấy các lời mời cũ nhất)
        console.log(`[EXEC] Đang cuộn xuống để lấy danh sách lời mời cũ nhất...`);
        for (let i = 0; i < 15; i++) { // Scroll 15 times (~300 requests deep)
            await page.mouse.wheel({ deltaY: 800 + Math.random() * 200 });
            await sleep(800 + Math.random() * 500);
        }

        console.log(`[EXEC] Đã nạp xong danh sách. Quét tìm nút "Hủy lời mời"...`);
        
        // Lấy tất cả các nút có label là "Hủy yêu cầu" hoặc "Cancel Request"
        const buttonHandles = await page.$$('div[role="button"]');
        let cancelButtons = [];

        for (const btnHandle of buttonHandles) {
            const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label') || el.innerText || "", btnHandle);
            if (ariaLabel.includes('Cancel Request') || ariaLabel.includes('Hủy lời mời') || ariaLabel.includes('Hủy yêu cầu')) {
                cancelButtons.push(btnHandle);
            }
        }

        console.log(`[EXEC] Tìm thấy ${cancelButtons.length} nút Hủy trên màn hình.`);

        if (cancelButtons.length === 0) {
            console.log(`[EXEC] Không tìm thấy lời mời nào có thể hủy.`);
            await logAction('search', 'warning', `Không có lời mời nào đang chờ để hủy.`);
            return;
        }

        // Đảo ngược danh sách để HỦY TỪ DƯỚI LÊN (Các lời mời cũ nhất ở dưới cùng)
        cancelButtons.reverse();

        for (const btnHandle of cancelButtons) {
            if (canceledCount >= cancelLimit) {
                console.log(`[EXEC] 🛑 Đã đạt giới hạn hủy an toàn (${cancelLimit}). Dừng chiến dịch.`);
                break;
            }

            try {
                await btnHandle.scrollIntoView();
                await sleep(500 + Math.random() * 500);
                
                // Di chuột giả lập
                const box = await btnHandle.boundingBox();
                if (box) {
                    const targetX = box.x + box.width / 2 + (Math.random() * 10 - 5);
                    const targetY = box.y + box.height / 2 + (Math.random() * 10 - 5);
                    await page.mouse.move(targetX, targetY, { steps: 5 + Math.floor(Math.random() * 5) });
                    await sleep(300 + Math.random() * 200);
                    
                    await page.mouse.down();
                    await sleep(80 + Math.random() * 100);
                    await page.mouse.up();
                } else {
                    await page.evaluate(el => el.click(), btnHandle);
                }

                canceledCount++;
                console.log(`[EXEC] 🗑️ Đã hủy thành công 1 lời mời cũ (${canceledCount}/${cancelLimit}).`);
                
                // Pacing chống Spam: Đợi 3-6 giây mỗi lần hủy
                await sleep(3000 + Math.random() * 3000);

                // Thỉnh thoảng nghỉ giải lao
                if (canceledCount % 10 === 0) {
                    console.log(`[EXEC] ☕ Đã hủy 10 lời mời. Đứng nghỉ 15s tránh Facebook nghi ngờ...`);
                    await sleep(15000 + Math.random() * 5000);
                }

            } catch (clickErr) {
                console.log(`[EXEC] Lỗi khi Click nút hủy: ${clickErr.message}`);
            }
        }

        console.log(`[EXEC] Hoàn thành Dọn Dẹp: Đã hủy ${canceledCount} lời mời.`);
        await logAction('search', 'success', `[Hoàn thành] Đã dọn dẹp (hủy) ${canceledCount} lời mời kết bạn cũ.`);

    } catch (e) {
        console.error(`[EXEC] Lỗi Chí tử: ${e.message}`);
        await logAction('search', 'error', `Lỗi Dọn Dẹp: ${e.message}`);
    } finally {
        console.log(`[EXEC] Đóng trình duyệt...`);
        await sleep(3000); 
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "{}";
    autoCancelRequests(cmd);
}

module.exports = { autoCancelRequests };
