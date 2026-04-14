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

async function executeSearchAndAdd(rawCommand) {
    console.log(`[EXEC] Received Command: "${rawCommand}"`);

    let rawString = rawCommand;
    let maxAddsPerKeyword = 5; // Default is lower for search to distribute across keywords
    let botAction = 'auto_add';
    let botSpeed = 'normal';

    try {
        if (rawString.startsWith('{')) {
            const config = JSON.parse(rawString);
            rawString = config.url || ""; // For search, `url` field contains the keywords
            if (config.limit) maxAddsPerKeyword = config.limit;
            if (config.action) botAction = config.action;
            if (config.speed) botSpeed = config.speed;
        }
    } catch (e) {
        console.log(`[EXEC] Parse lỗi, chạy chế độ Mặc Định.`);
    }

    // 1. Split Keywords
    const keywords = rawString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    console.log(`[EXEC] Parsed Keywords (${keywords.length}):`, keywords);

    await logAction('search', 'info', `Nhận lệnh tìm kiếm: ${keywords.join(', ')}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    let totalAdded = 0; // For global coffee break tracking

    try {
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
            const scrollTimes = Math.max(2, Math.ceil(maxAddsPerKeyword / 5));
            for(let i=0; i<scrollTimes; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await sleep(2000);
            }

            // 4. Scan & Click
            const buttonHandles = await page.$$('div[role="button"]');
            let addedCount = 0;

            console.log(`[EXEC] Scanning ${buttonHandles.length} elements for 'Add Friend' buttons...`);

            for (const btnHandle of buttonHandles) {
                if (addedCount >= maxAddsPerKeyword) break;

                const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || "", btnHandle);

                if (text.includes('Add friend') || text.includes('Thêm bạn bè')) {

                    // Nâng cấp: Tách Tên Khách Hàng và Link với thuật toán leo cây 12 bậc
                    const profileData = await page.evaluate(btn => {
                        let url = 'Unknown';
                        let name = 'Facebook User';
                        
                        // 1. Lên thử Tên từ aria-label
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
                            addedCount++;
                            totalAdded++;

                            if (botAction === 'scrape_only') {
                                await saveLead({
                                    source: `fb_search: ${keyword}`,
                                    name: profileData.name,
                                    profile_url: profileData.url
                                });
                                console.log(`[EXEC] 🕵️ Đã Vơ vét (Không Click): ${profileData.name}`);
                            } else {
                                // JS Cưỡng bách click
                                await page.evaluate(el => el.click(), btnHandle);

                                await logAction('search', 'success', `Đã gửi lời mời: ${profileData.name}`, {
                                    profile_url: profileData.url
                                });

                                await saveLead({
                                    source: `fb_search: ${keyword}`,
                                    name: profileData.name,
                                    profile_url: profileData.url
                                });
                                
                                console.log(`[EXEC] 🎯 Đã Click Add: ${profileData.name}`);

                                // Speed Control
                                if (botSpeed === 'fast') {
                                    await sleep(3000 + Math.random() * 2000);
                                } else if (botSpeed === 'slow') {
                                    const safeWait = 35000 + Math.random() * 20000;
                                    await sleep(safeWait);
                                } else {
                                    if (totalAdded % 3 === 0) {
                                        const longWait = 45000 + Math.random() * 30000; 
                                        console.log(`[EXEC] ☕ Tạm nghỉ giải lao ${Math.round(longWait/1000)}s...`);
                                        await sleep(longWait);
                                    } else {
                                        const shortWait = 15000 + Math.random() * 10000; 
                                        await sleep(shortWait);
                                    }
                                }
                            }

                        } catch (e) {
                            console.log(`[EXEC] ❌ Click Failed: ${e.message}`);
                        }
                    }
                }
            }

            if (addedCount === 0) {
                console.log(`[EXEC] No new friends added for "${keyword}".`);
                await logAction('search', 'warning', `Không tìm thấy người mới cho từ khóa: "${keyword}"`);
            } else if (botAction === 'scrape_only') {
                await logAction('search', 'info', `[Thành công] Đã Vơ Vét ${addedCount} khách từ khóa ${keyword}.`);
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
