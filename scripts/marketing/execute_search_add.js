/**
 * Level 4: Execution Module - Search & Add (REAL MODE)
 * 1. Receives keyword.
 * 2. Navigates to Facebook Search (People Tab).
 * 3. Scrapes "Add Friend" buttons and Profile URLs.
 * 4. Clicks "Add Friend" and reports back to Dashboard.
 */

const { launchBrowser } = require('./setup_browser');
const { logAction } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSearchAndAdd(keyword, maxAdds = 5) {
    console.log(`[EXEC] Starting Search for: "${keyword}"`);
    await logAction('search', 'info', `Bắt đầu tìm kiếm: "${keyword}"`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        // 1. Navigate to Search Page (People Tab)
        // URL Pattern: https://www.facebook.com/search/people/?q=key+word
        const searchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(keyword)}`;
        console.log(`[EXEC] Navigating to: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        await sleep(3000);

        // 2. Scroll to load results
        console.log(`[EXEC] Scrolling to load results...`);
        await page.evaluate(() => window.scrollBy(0, 1000));
        await sleep(2000);
        await page.evaluate(() => window.scrollBy(0, 1000));
        await sleep(2000);

        // 3. Scan for "Add Friend" buttons
        // Strategy: Look for aria-label="Add friend" or role="button" with text "Add Friend"/"Thêm bạn bè"
        console.log(`[EXEC] Scanning for targets...`);

        // Evaluated function to find targets and return their Index and Profile URL
        // We can't click elements inside evaluate, so we find indices/selectors first.
        const targets = await page.evaluate(() => {
            const results = [];
            const allButtons = Array.from(document.querySelectorAll('div[role="button"]'));

            for (const btn of allButtons) {
                const text = btn.innerText || btn.getAttribute('aria-label') || "";

                // Check if it's an Add Friend button
                if (text.includes('Add friend') || text.includes('Thêm bạn bè')) {
                    // Try to find the Profile Link (usually in a parent or sibling anchor tag)
                    // We traverse up to find a container, then look for an 'a' tag with 'href' that looks like a profile
                    let container = btn.parentElement;
                    let profileUrl = null;
                    let safeGuard = 0;

                    // Traverse up up to 5 levels to find the user card container
                    while (container && safeGuard < 5) {
                        const links = container.querySelectorAll('a');
                        for (const link of links) {
                            const href = link.href;
                            // Filter out garbage links, keep potential profile links
                            if (href && !href.includes('/friends/') && !href.includes('search') && href.includes('facebook.com')) {
                                profileUrl = href;
                                break;
                            }
                        }
                        if (profileUrl) break;
                        container = container.parentElement;
                        safeGuard++;
                    }

                    results.push({
                        // We can't return the element itself, so we mark it or just count it. 
                        // Actually, for Puppeteer click, we need the element handle.
                        // So here we just return metadata to log, and we'll re-query or use ElementHandles in Node context.
                        text: text,
                        url: profileUrl || 'Unknown'
                    });
                }
            }
            return results;
        });

        console.log(`[EXEC] Found ${targets.length} potential targets.`);
        await logAction('search', 'info', `Tìm thấy ${targets.length} người phù hợp.`);

        // 4. Perform Actions (Clicking)
        // We need to re-query ElementHandles to click them
        const buttonHandles = await page.$$('div[role="button"]');
        let addedCount = 0;

        for (const btnHandle of buttonHandles) {
            if (addedCount >= maxAdds) break;

            const text = await page.evaluate(el => el.innerText || el.getAttribute('aria-label') || "", btnHandle);

            if (text.includes('Add friend') || text.includes('Thêm bạn bè')) {

                // Re-extract URL for this specific handle to log it
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

                console.log(`[EXEC] Clicking Add Friend for: ${profileUrl}`);

                try {
                    await btnHandle.click();
                    addedCount++;

                    // Log to Dashboard with Profile Link
                    await logAction('search', 'success', `Đã gửi lời mời kết bạn (Click để xem)`, {
                        profile_url: profileUrl
                    });

                    await sleep(3000 + Math.random() * 2000); // Random delay
                } catch (e) {
                    console.log(`[EXEC] Click Failed: ${e.message}`);
                }
            }
        }

        if (addedCount === 0 && targets.length === 0) {
            console.log(`[EXEC] No targets found. Maybe filtered or already friended.`);
            await logAction('search', 'warning', `Không tìm thấy nút 'Thêm bạn bè' nào (Có thể đã kết bạn hết).`);
        }

    } catch (e) {
        console.error(`[EXEC] Error: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        console.log(`[EXEC] Mission Complete. Closing in 60s...`);
        await sleep(60000); // Keep open for manual review
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "Bất động sản";
    executeSearchAndAdd(cmd);
}

module.exports = { executeSearchAndAdd };
