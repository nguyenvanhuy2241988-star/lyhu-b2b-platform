/**
 * Level 8: Rival Mining - The "Sniper" Strategy
 * 1. Visits a Target Page (Competitor/Supplier).
 * 2. Scans Comments on recent posts.
 * 3. Identifies Buying Signals ("Giá", "Ib", "Tư vấn").
 * 4. Adds Friend.
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeRivalScan(pageUrl, maxAdds = 10) {
    console.log(`[EXEC] Starting RIVAL SCAN on: ${pageUrl}`);
    await logAction('search', 'info', `🎯 Bắt đầu Săn khách trên Page đối thủ: ${pageUrl}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    const processedProfiles = new Set();
    let totalAdded = 0;

    try {
        await page.goto(pageUrl, { waitUntil: 'networkidle2' });
        await sleep(3000);

        // Scroll to load posts
        await page.evaluate(() => window.scrollBy(0, 1000));
        await sleep(2000);

        // Find "Comments" buttons/links to expand
        // Heuristic: Look for "View more comments" or generic comment counting links
        // However, usually detailed comments are visible or require clicking "Most Relevant".
        // Strategy: Scrape currently visible comments first. 

        // Find user links in comments
        // Facebook comments usually have a profile link with strict structure

        // COLLECT LEADS FROM COMMENTS
        console.log(`[EXEC] Harvesting comments...`);
        const leads = await page.evaluate(() => {
            const results = [];
            // Select all links in comment section
            // Comments are usually in 'div[role="article"]' or lists
            const commentDesignators = document.querySelectorAll('div[role="article"]'); // Each comment is often an article

            for (const comment of commentDesignators) {
                const text = comment.innerText.toLowerCase();
                const buyingSignals = ['giá', 'ib', 'inbox', 'tư vấn', 'quan tâm', 'sỉ', 'ship'];

                // Check signal
                if (buyingSignals.some(s => text.includes(s))) {
                    // Extract Author
                    const authorLink = comment.querySelector('a[role="link"]'); // Usually the name is a link
                    if (authorLink && authorLink.href.includes('facebook.com')) {
                        results.push({
                            url: authorLink.href,
                            name: authorLink.innerText,
                            signal: text.slice(0, 50) // Capture snippet
                        });
                    }
                }
            }
            return results;
        });

        console.log(`[EXEC] Found ${leads.length} high-intent leads.`);

        for (const lead of leads) {
            if (totalAdded >= maxAdds) break;

            let cleanUrl = lead.url.split('?')[0];
            if (processedProfiles.has(cleanUrl)) continue;
            processedProfiles.add(cleanUrl);

            console.log(`[EXEC] Target Found: ${lead.name} (Signal: "${lead.signal}...")`);
            await logAction('search', 'info', `🔥 Phát hiện khách nóng: ${lead.name} (Hỏi: ${lead.signal})`);

            // --- DEEP SCAN & ADD ---
            const profilePage = await browser.newPage();
            // ... (Same Add Logic, but we skip Score check because signal is so strong, or we keep it loose)
            let aiScore = 50; // Base score high because they are asking for price

            try {
                await profilePage.goto(cleanUrl, { waitUntil: 'networkidle2' });
                await sleep(3000);

                // Quick Add Check
                let addBtn = await profilePage.$('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]');
                if (!addBtn) {
                    // Check More
                    const [moreBtn] = await profilePage.$x("//div[@aria-label='More' or @aria-label='Khác']");
                    if (moreBtn) {
                        await moreBtn.click();
                        await sleep(500);
                        const [hiddenAddBtn] = await profilePage.$x("//div[@role='menuitem'][contains(., 'Add friend')]");
                        if (hiddenAddBtn) addBtn = hiddenAddBtn;
                    }
                }

                if (addBtn) {
                    await addBtn.click();
                    totalAdded++;
                    await logAction('search', 'success', `Đã cướp khách thành công: ${lead.name}`, { profile_url: cleanUrl });
                    await saveLead({ source: `rival_scan: ${pageUrl}`, name: lead.name, profile_url: cleanUrl, ai_score: aiScore });
                } else {
                    console.log(`[EXEC] Could not add ${lead.name}`);
                }

            } catch (err) {
                console.log(`[EXEC] Error processing lead: ${err.message}`);
            } finally {
                await profilePage.close();
            }
        }

    } catch (e) {
        console.error(`[EXEC] Error: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const target = process.argv[2] || "https://www.facebook.com/KiotViet";
    executeRivalScan(target);
}

module.exports = { executeRivalScan };
