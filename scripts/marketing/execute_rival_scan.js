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
            // Strategy: Look for specific comment containers. 
            // V2 Selector: Generic list items or spans that contain links + text

            // Try 1: Standard accessible comments
            let commentDesignators = Array.from(document.querySelectorAll('div[role="article"], div[aria-label="Comment"], ul > li'));

            // Try 2: If few results, grab all text-containing divs with links (Broad Scan)
            if (commentDesignators.length < 5) {
                const potentialComments = document.querySelectorAll('div[dir="auto"]');
                commentDesignators = [...commentDesignators, ...Array.from(potentialComments)];
            }

            console.log(`[DEBUG] Raw Elements Examined: ${commentDesignators.length}`);

            for (const comment of commentDesignators) {
                const text = comment.innerText ? comment.innerText.toLowerCase() : "";
                if (text.length < 5) continue;

                // Keywords: Price, Inbox, Consulting, Ship, Wholesale, Phone number logic
                const buyingSignals = ['giá', 'ib', 'inbox', 'tư vấn', 'quan tâm', 'sỉ', 'ship', 'bao tiền', 'nhiêu', '09', '03', '08']; // Added phone prefixes

                // Check signal
                if (buyingSignals.some(s => text.includes(s))) {
                    // Extract Author
                    // Look for the first bold link or just any link that looks like a user
                    const links = comment.querySelectorAll('a');
                    let authorLink = null;

                    for (const link of links) {
                        const href = link.href;
                        // Avoid links to hashtags, other pages, or timestamp links
                        if (href.includes('facebook.com') &&
                            !href.includes('/hashtag/') &&
                            !href.includes('&comment_id=') && // Timestamp link
                            link.innerText && link.innerText.length > 2) {
                            authorLink = link;
                            break; // Assess first valid link as author
                        }
                    }

                    if (authorLink) {
                        results.push({
                            url: authorLink.href,
                            name: authorLink.innerText,
                            signal: text.slice(0, 50).replace(/\n/g, ' ')
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

                // ROBUST ADD FRIEND CLICKING (Ported from Post Scan V7)
                // Try 1: Main Button (ARIA)
                let addBtn = await profilePage.$('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]');

                // Try 2: Main Button (XPath Text)
                if (!addBtn) {
                    const [btn] = await profilePage.$x("//div[@role='button'][contains(., 'Add friend') or contains(., 'Thêm bạn bè')]");
                    if (btn) addBtn = btn;
                }

                // Try 3: Hidden in "..." Menu
                if (!addBtn) {
                    console.log(`[EXEC] Add button not found. Checking 'More' menu...`);
                    const [moreBtn] = await profilePage.$x("//div[@aria-label='More' or @aria-label='Khác' or @aria-label='See options']");
                    if (moreBtn) {
                        try {
                            await moreBtn.click();
                            await sleep(1000);
                            const [hiddenAddBtn] = await profilePage.$x("//div[@role='menuitem'][contains(., 'Add friend') or contains(., 'Thêm bạn bè')]");
                            if (hiddenAddBtn) {
                                console.log(`[EXEC] Found hidden Add Friend button!`);
                                addBtn = hiddenAddBtn;
                            }
                        } catch (e) {
                            // Ignore click errors on menu
                        }
                    }
                }

                if (addBtn) {
                    await addBtn.click();
                    totalAdded++;
                    await logAction('search', 'success', `Đã cướp khách thành công: ${lead.name}`, { profile_url: cleanUrl });
                    await saveLead({ source: `rival_scan: ${pageUrl}`, name: lead.name, profile_url: cleanUrl, ai_score: aiScore });
                } else {
                    // Diagnostic
                    const isRequested = await profilePage.evaluate(() => {
                        const text = document.body.innerText;
                        return text.includes('Cancel request') || text.includes('Hủy lời mời');
                    });
                    if (isRequested) {
                        await logAction('search', 'warning', `Đã gửi lời mời trước đó: ${lead.name}`);
                    } else {
                        console.log(`[EXEC] Could not add ${lead.name}`);
                    }
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
