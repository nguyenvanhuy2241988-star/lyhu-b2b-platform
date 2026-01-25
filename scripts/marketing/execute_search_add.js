/**
 * Level 4: Execution Module - Search & Add (REAL MODE + MULTI-KEYWORD)
 * 1. Receives comma-separated keywords (e.g. "Chủ spa, tạp hóa").
 * 2. Splits and iterates through each keyword.
 * 3. Navigates to Facebook Search (People Tab).
 * 4. Scrapes "Add Friend" buttons and Profile URLs.
 * 5. Clicks "Add Friend" and reports back to Dashboard.
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSearchAndAdd(rawCommand, maxAddsPerKeyword = 5) {
    console.log(`[EXEC] Received Command: "${rawCommand}"`);

    // 1. Split Keywords
    const keywords = rawCommand.split(',').map(k => k.trim()).filter(k => k.length > 0);
    console.log(`[EXEC] Parsed Keywords (${keywords.length}):`, keywords);

    await logAction('search', 'info', `Nhận lệnh tìm kiếm: ${keywords.join(', ')}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        // Loop through each keyword
        for (const keyword of keywords) {
            console.log(`[EXEC] >>> Processing Keyword: "${keyword}"`);
            await logAction('search', 'info', `🔍 Đang tìm nhóm đối tượng: "${keyword}"`);

            // 2. Navigate to Search Page (People Tab)
            const searchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(keyword)}`;
            console.log(`[EXEC] Navigating to: ${searchUrl}`);
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });

            await sleep(3000);

            // 3. Scroll to load results
            console.log(`[EXEC] Scrolling...`);
            await page.evaluate(() => window.scrollBy(0, 1000));
            await sleep(2000);
            await page.evaluate(() => window.scrollBy(0, 1000));
            await sleep(2000);

            // 4. Scan & Click
            const buttonHandles = await page.$$('div[role="button"]');
            let addedCount = 0;

            console.log(`[EXEC] Scanning ${buttonHandles.length} elements for 'Add Friend' buttons...`);

            for (const btnHandle of buttonHandles) {
                if (addedCount >= maxAddsPerKeyword) break;

                const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || "", btnHandle);

                if (text.includes('Add friend') || text.includes('Thêm bạn bè')) {

                    // Extract URL
                    const profileUrl = await page.evaluate(btn => {
                        let container = btn.parentElement;
                        let url = 'Unknown';
                        let safeGuard = 0;
                        while (container && safeGuard < 5) {
                            const links = container.querySelectorAll('a');
                            for (const link of links) {
                                if (link.href && !link.href.includes('/friends/') && !link.href.includes('search') && link.href.includes('facebook.com')) {
                                    url = link.href;
                                    break;
                                }
                            }
                            if (url !== 'Unknown') break;
                            container = container.parentElement;
                            safeGuard++;
                        }
                        return url;
                    }, btnHandle);

                    if (profileUrl !== 'Unknown') {
                        console.log(`[EXEC] Found Target: ${profileUrl}`);

                        // --- IMPLICIT DEEP SCAN PLACEHOLDER ---
                        // (We keep this simplified to ensure the Loop works first, 
                        // but normally we would insert the verification logic here)
                        // -------------------------------------

                        try {
                            await btnHandle.click();
                            addedCount++;

                            await logAction('search', 'success', `Đã kết bạn với: ${keyword}`, {
                                profile_url: profileUrl
                            });

                            await saveLead({
                                source: `fb_search: ${keyword}`,
                                name: 'Facebook User',
                                profile_url: profileUrl
                            });

                            await sleep(3000 + Math.random() * 2000);
                        } catch (e) {
                            console.log(`[EXEC] Click Failed: ${e.message}`);
                        }
                    }
                }
            }

            if (addedCount === 0) {
                console.log(`[EXEC] No new friends added for "${keyword}".`);
                await logAction('search', 'warning', `Không tìm thấy người mới cho từ khóa: "${keyword}"`);
            }

            // Gap between keywords
            await sleep(3000);
        }

    } catch (e) {
        console.error(`[EXEC] Error: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        console.log(`[EXEC] All keywords processed. Closing...`);
        await sleep(60000);
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "Chủ spa, Bất động sản";
    executeSearchAndAdd(cmd);
}

module.exports = { executeSearchAndAdd };
