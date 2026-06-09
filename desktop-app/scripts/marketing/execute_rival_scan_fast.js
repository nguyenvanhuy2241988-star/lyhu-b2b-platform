/**
 * Level 8: Rival Mining - The "Stealth" Strategy (Mbasic Edition)
 * Uses mbasic.facebook.com to scan without heavy scrolling.
 * - Lighter, Faster.
 * - Uses Pagination (Next Page) instead of Infinite Scroll.
 * - Scrapes standardized HTML structures.
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeRivalScanFast(pageUrl, maxLeads = 20) {
    // Convert URL to mbasic
    let targetUrl = pageUrl.replace('www.facebook.com', 'mbasic.facebook.com');
    if (!targetUrl.includes('mbasic.facebook.com')) {
        targetUrl = targetUrl.replace('facebook.com', 'mbasic.facebook.com');
    }

    console.log(`[EXEC] Starting STEALTH SCAN on: ${targetUrl}`);
    await logAction('search', 'info', `🥷 Chế độ Quét Ẩn (Mbasic) trên: ${targetUrl}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    const processedProfiles = new Set();
    let totalLeads = 0;

    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });
        await sleep(2000);

        // Loop through standard Pagination
        let pagesScanned = 0;
        const maxPages = 5;

        while (pagesScanned < maxPages && totalLeads < maxLeads) {
            console.log(`[EXEC] Scanning Page ${pagesScanned + 1}...`);

            // 1. Find all "Full Story" or "Comment" links to identify posts
            // In mbasic, posts are usually usually delineated, but easier to just find the "Comment" links
            // which take us directly to the comment section.
            const commentLinks = await page.$x("//a[contains(text(), 'Comment') or contains(text(), 'Bình luận') or contains(text(), 'Full Story') or contains(text(), 'Tin đầy đủ')]");

            console.log(`[DEBUG] Found ${commentLinks.length} post links on this page.`);

            // Extract Hrefs first to avoid detachment issues
            const postUrls = [];
            for (const link of commentLinks) {
                const href = await page.evaluate(el => el.href, link);
                postUrls.push(href);
            }

            // 2. Visit each post deeply
            for (const postUrl of postUrls) {
                if (totalLeads >= maxLeads) break;

                const postPage = await browser.newPage();
                try {
                    await postPage.goto(postUrl, { waitUntil: 'networkidle2' });

                    // Harvest Comments
                    const leads = await postPage.evaluate(() => {
                        const results = [];
                        // Generic scan for profile links in comment sections
                        // mbasic usually lists comments as divs with links.
                        // We look for links that are NOT the "Reply", "Like", "React" buttons.

                        // All links
                        const links = document.querySelectorAll('a');
                        for (const link of links) {
                            const href = link.href;
                            const text = link.innerText;

                            // Heuristic: Profile links usually are clean /username or /profile.php?id=
                            // And exclude standard action links
                            if ((href.includes('/profile.php') || (href.includes('facebook.com') && !href.includes('/story.php'))) &&
                                !href.includes('&refid=') && // internal nav
                                !text.includes('Like') && !text.includes('Thích') &&
                                !text.includes('Reply') && !text.includes('Phản hồi') &&
                                !text.includes('More') && !text.includes('Khác') &&
                                !text.includes('Report') &&
                                text.length > 3) {

                                // Look for context (buying signal) near the link? 
                                // In mbasic, structure is localized. 
                                // Let's just grab the parent text.
                                const parentText = link.parentElement ? link.parentElement.innerText.toLowerCase() : "";

                                const buyingSignals = ['giá', 'ib', 'inbox', 'tư vấn', 'quan tâm', 'sỉ', 'ship', 'bao tiền', 'nhiêu'];
                                if (buyingSignals.some(s => parentText.includes(s))) {
                                    results.push({
                                        url: href,
                                        name: text,
                                        signal: parentText.slice(0, 50).replace(/\n/g, ' ')
                                    });
                                }
                            }
                        }
                        return results;
                    });

                    console.log(`[EXEC] Found ${leads.length} leads on post.`);

                    for (const lead of leads) {
                        let cleanUrl = lead.url.split('?')[0].split('&')[0];
                        if (processedProfiles.has(cleanUrl)) continue;
                        processedProfiles.add(cleanUrl);

                        console.log(`[EXEC] 🎯 TARGET: ${lead.name} | Signal: ${lead.signal}`);
                        await logAction('search', 'info', `🎯 Phát hiện (Mode Ẩn): ${lead.name}`);

                        // Add to friend logic would go here (or save to DB)
                        // For Mbasic, adding friend is just clicking the "Add Friend" button on their profile
                        // We will just SAVE for now to keep it fast, or minimal add.
                        await saveLead({ source: `rival_scan_fast: ${targetUrl}`, name: lead.name, profile_url: cleanUrl, ai_score: 80 });
                        totalLeads++;
                    }

                } catch (err) {
                    console.log(`[EXEC] Error reading post: ${err.message}`);
                } finally {
                    await postPage.close();
                    await sleep(1000); // polite delay
                }
            }

            // 3. Next Page
            if (totalLeads < maxLeads) {
                const [nextBtn] = await page.$x("//a[contains(text(), 'See more posts') or contains(text(), 'Xem thêm tin') or contains(text(), 'Xem thêm bài viết')]");
                if (nextBtn) {
                    console.log(`[EXEC] Navigating to Next Page...`);
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'networkidle2' }),
                        nextBtn.click()
                    ]);
                    pagesScanned++;
                } else {
                    console.log(`[EXEC] End of feed reached.`);
                    break;
                }
            }
        }

    } catch (e) {
        console.error(`[EXEC] Error: ${e.message}`);
        await logAction('search', 'error', `Lỗi Mode Ẩn: ${e.message}`);
    } finally {
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const target = process.argv[2] || "https://www.facebook.com/KiotViet";
    executeRivalScanFast(target);
}

module.exports = { executeRivalScanFast };
