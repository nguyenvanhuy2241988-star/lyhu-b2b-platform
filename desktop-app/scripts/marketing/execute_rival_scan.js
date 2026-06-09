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
    const isSinglePost = pageUrl.includes('/posts/') ||
        pageUrl.includes('/videos/') ||
        pageUrl.includes('/reel/') ||
        pageUrl.includes('/photo') ||
        pageUrl.includes('/watch') ||
        pageUrl.includes('story.php');

    if (isSinglePost) {
        console.log(`[EXEC] Detected SINGLE POST/AD URL. Switching to DEEP COMMENT MINING mode.`);
        await logAction('search', 'info', `🔍 Chế độ Quét Bài Viết/Quảng Cáo (Deep Comment): ${pageUrl}`);
    } else {
        console.log(`[EXEC] Starting RIVAL PAGE SCAN on: ${pageUrl}`);
        await logAction('search', 'info', `🎯 Bắt đầu Săn khách trên Page đối thủ: ${pageUrl}`);
    }

    const browser = await launchBrowser();
    const page = await browser.newPage();

    const processedProfiles = new Set();
    let totalAdded = 0;

    try {
        await page.goto(pageUrl, { waitUntil: 'networkidle2' });
        await sleep(3000);

        // DEEP SCROLLING or SINGLE POST EXPANSION
        if (isSinglePost) {
            // SINGLE POST MODE: Focus entirely on exhausting comments
            console.log(`[EXEC] Single Post Mode: Maximizing Comment Expansion...`);

            // Loop to click "View more comments" or "View previous comments" until exhausted or limit reached
            let expansionCount = 0;
            const maxExpansions = 1000; // Full Data Extraction

            while (expansionCount < maxExpansions) {
                const expanded = await page.evaluate(async () => {
                    // Selectors for "View more comments", "View previous comments", "Most relevant"
                    const triggers = Array.from(document.querySelectorAll('span, div, a')).filter(el => {
                        const text = el.innerText ? el.innerText.toLowerCase() : '';
                        return (text.includes('xem thêm bình luận') ||
                            text.includes('view more comments') ||
                            text.includes('view previous comments') ||
                            text.includes('xem các bình luận trước') ||
                            text.includes('phù hợp nhất')) && el.offsetParent !== null; // Visible
                    });

                    if (triggers.length > 0) {
                        triggers[0].click();
                        return true;
                    }
                    return false;
                });

                if (expanded) {
                    process.stdout.write(`.`); // Visual progress
                    await sleep(2000); // Wait for load
                    expansionCount++;
                } else {
                    break; // No more comments to load
                }
            }
            console.log(`\n[EXEC] Finished expanding comments. Total expansions: ${expansionCount}`);

        } else {
            // PAGE MODE: Deep Scroll to find posts
            console.log(`[EXEC] Scrolling deeply to load ALL posts (Limit: 1000)...`);
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    let distance = 100;
                    let scrolls = 0;
                    let maxScrolls = 1000; // Scan practically everything

                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        scrolls++;

                        // Stop if reached bottom or max scrolls
                        if (totalHeight >= scrollHeight || scrolls >= maxScrolls) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100); // Fast smooth scroll
                });
            });
            await sleep(3000); // Wait for final lazy loads

            // EXPAND COMMENTS (Light version for Page)
            console.log(`[EXEC] Expanding comment sections (Page Mode)...`);
            await page.evaluate(async () => {
                const commentTriggers = Array.from(document.querySelectorAll('span, div')).filter(el => {
                    const text = el.innerText ? el.innerText.toLowerCase() : '';
                    return (text.includes('bình luận') || text.includes('comments')) && text.length < 20;
                });

                // Click up to 20 comment sections to reveal more leads
                for (let i = 0; i < Math.min(commentTriggers.length, 20); i++) {
                    commentTriggers[i].click();
                    await new Promise(r => setTimeout(r, 800));
                }
            });
            await sleep(3000);
        }

        // JOB: HARVEST COMMENTS
        console.log(`[EXEC] Harvesting comments...`);
        const leads = await page.evaluate(() => {
            const results = [];

            // DEBUG: Count potential containers
            const articles = document.querySelectorAll('div[role="article"]');
            console.log(`[DEBUG] Found ${articles.length} posts (articles).`);

            // Strategy: Look for specific comment containers. 
            // V2 Selector: Generic list items or spans that contain links + text

            // Try 1: Standard accessible comments
            let commentDesignators = Array.from(document.querySelectorAll('div[role="article"], div[aria-label="Comment"], ul > li, div[data-ad-preview="message"]'));

            // Try 2: If few results, grab all text-containing divs with links (Broad Scan)
            if (commentDesignators.length < 5) {
                console.log('[DEBUG] Strict selectors found few items. Trying broad scan...');
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
                            !href.includes('/watch/') && // Video link
                            !href.includes('/groups/') && // Group link
                            !href.includes('l.facebook.com') && // External link redirect (NOT a profile)
                            link.innerText && link.innerText.length > 2) {
                            authorLink = link;
                            break; // Assess first valid link as author
                        }
                    }

                    if (authorLink) {
                        // Double check: Author name shouldn't be "Like" or "Reply"
                        const name = authorLink.innerText;
                        if (name !== 'Thích' && name !== 'Phản hồi' && name !== 'Like' && name !== 'Reply' && name !== 'Share') {
                            results.push({
                                url: authorLink.href,
                                name: name,
                                signal: text.slice(0, 50).replace(/\n/g, ' ')
                            });
                        }
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

                // ROBUST ADD FRIEND CLICKING (Fixed for Puppeteer Compatibility)
                const added = await profilePage.evaluate(async () => {
                    function clickByText(tag, textPatterns) {
                        const xpath = `//${tag}[${textPatterns.map(t => `contains(., '${t}')`).join(' or ')}]`;
                        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (element) {
                            element.click();
                            return true;
                        }
                        return false;
                    }

                    // Try 1: Main Button (ARIA)
                    const ariaBtn = document.querySelector('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]');
                    if (ariaBtn) {
                        ariaBtn.click();
                        return true;
                    }

                    // Try 2: Main Button (XPath Text via JS)
                    if (clickByText('div[@role="button"]', ['Add friend', 'Thêm bạn bè'])) return true;

                    // Try 3: Hidden in "..." Menu
                    // Find menu button
                    const menuBtnXPath = "//div[@aria-label='More' or @aria-label='Khác' or @aria-label='See options']";
                    const menuBtn = document.evaluate(menuBtnXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                    if (menuBtn) {
                        menuBtn.click();
                        await new Promise(r => setTimeout(r, 1000));
                        // Click hidden add button
                        if (clickByText('div[@role="menuitem"]', ['Add friend', 'Thêm bạn bè'])) return true;
                    }

                    return false;
                });

                if (added) {
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
