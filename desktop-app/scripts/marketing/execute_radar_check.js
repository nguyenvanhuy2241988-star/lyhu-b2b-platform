/**
 * Level 5: Execution Module - Radar Checker
 * Trạm Dò Sóng: Kiểm tra URL nào đã đồng ý kết bạn
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, supabase } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeRadarCheck(rawCommand) {
    console.log(`[EXEC] Radar Received Targets: "${rawCommand.substring(0, 50)}..."`);

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
        console.error("[EXEC] Radar lỗi: Không có mục tiêu hợp lệ.");
        await logAction('search', 'error', `Radar lỗi: Danh sách URL rỗng.`);
        return;
    }

    await logAction('search', 'info', `📡 Trạm Radar bắt đầu quét kiểm tra ${targetUrls.length} đối tượng.`);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    let hitCount = 0; // Number of accepted friends found

    try {
        for (let i = 0; i < targetUrls.length; i++) {
            const url = targetUrls[i];
            console.log(`[EXEC] 📡 Radar đang soi nhà thứ ${i+1}/${targetUrls.length}: ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2' });
            await sleep(4000);

            const isPageAvailable = await page.evaluate(() => {
                return !document.body.innerText.includes("This content isn't available right now") &&
                       !document.body.innerText.includes("Nội dung này hiện không khả dụng");
            });

            if (!isPageAvailable) {
                console.log(`[EXEC] ❌ Profile tàng hình. Radar bỏ qua.`);
                continue;
            }

            // Radar DOM Check
            const status = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                for (const btn of buttons) {
                    const text = btn.innerText || btn.getAttribute('aria-label') || "";

                    if (text === 'Friends' || text === 'Bạn bè' || text.includes('Bạn bè') || text.includes('Friends')) {
                        return 'accepted';
                    }
                    if (text === 'Add friend' || text === 'Thêm bạn bè' || text.includes('Add friend') || text.includes('Thêm bạn bè')) {
                        return 'rejected';
                    }
                    if (text === 'Cancel Request' || text === 'Hủy lời mời' || text.includes('Hủy lời mời') || text.includes('Cancel Request')) {
                        return 'pending';
                    }
                }
                
                // Nếu không thấy chữ kết bạn nào, mà thấy chữ "Nhắn tin" hoặc "Chỉ follow" thì tỷ lệ cao là Khách đó giấu nút KB hoặc bị lỗi
                return 'unknown';
            });

            console.log(`[EXEC] 📊 Tín hiệu trả về từ ${url}: ${status}`);

            if (status === 'accepted') {
                hitCount++;
                console.log(`[EXEC] ✅ TRÚNG MÁNH: Khách đã gật đầu! Cập nhật CRM...`);
                await logAction('search', 'success', `[Radar] Tung hoa! Đã phát hiện 1 Bạn Bè mới.`, { profile_url: url });
                
                if (supabase) {
                    await supabase.from('marketing_leads_staging')
                        .update({ status: 'friend' })
                        .eq('profile_url', url);
                }
            } else if (status === 'rejected') {
                console.log(`[EXEC] 🚫 TOANG: Khách đã từ chối hoặc nút bị tụt. Đánh dấu CRM...`);
                // Optionally update CRM to rejected, but for safety against false positives, maybe keep it pending or mark a special status
                if (supabase) {
                    await supabase.from('marketing_leads_staging')
                        .update({ status: 'rejected' })
                        .eq('profile_url', url);
                }
            } else {
                console.log(`[EXEC] ⏳ Tình trạng: Vẫn đang cắn rứt / Trạng thái không rõ ràng.`);
            }

            // --- ANTI SPAM DELAY ---
            // Radar is just viewing, so it doesn't need to be as slow as clicking. 
            // 8-15 seconds is very safe for just viewing profiles.
            const sleepTime = 8000 + Math.random() * 7000;
            console.log(`[EXEC] ☕ Radar ngụy trang, nghỉ ngơi ${Math.round(sleepTime/1000)}s...`);
            await sleep(sleepTime);
        }
    } catch (e) {
        console.error(`[EXEC] Radar Lỗi: ${e.message}`);
        await logAction('search', 'error', `Radar sập nguồn: ${e.message}`);
    } finally {
        console.log(`[EXEC] Radar ngắt kết nối. Đã tìm ra ${hitCount}/${targetUrls.length} khách nóng.`);
        await logAction('search', 'info', `🏁 Radar tắt máy: Phát hiện thành công ${hitCount} Khách trên tổng ${targetUrls.length} mục tiêu.`);
        await sleep(3000);
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "https://www.facebook.com/zuck";
    executeRadarCheck(cmd);
}

module.exports = { executeRadarCheck };
