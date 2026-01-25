/**
 * Level 8: Suggestion Surfing - The "Easy Win" Strategy
 * 1. Visits https://www.facebook.com/friends/suggestions
 * 2. Scrapes the "People You May Know" list.
 * 3. Deep Scans each profile (AI Verification).
 * 4. Adds Friend.
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSuggestionScan(args = "", maxAdds = 10) {
    console.log(`[EXEC] Starting SUGGESTION SCAN...`);
    await logAction('search', 'info', `🌊 Bắt đầu lướt sóng "Gợi ý kết bạn" (Suggestion Surfing)...`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    // Store processed URLs to avoid duplicates
    const processedProfiles = new Set();
    let totalAdded = 0;

    try {
        // 1. Navigate to Suggestions Page
        const targetUrl = 'https://www.facebook.com/friends/suggestions';
        console.log(`[EXEC] Navigating to: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });
        await sleep(3000);

        // 2. Continuous Loop
        while (totalAdded < maxAdds) {
            // Collect User Cards
            // Suggestions usually appear in cards. We look for anchors that look like profiles.
            // On /friends/suggestions, usually cards have "Add friend" button.

            const candidates = await page.evaluate(() => {
                const results = [];
                // Select all 'Add friend' buttons first to find context
                const buttons = Array.from(document.querySelectorAll('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]'));

                for (const btn of buttons) {
                    // Traverse up to find the card container and user link
                    let container = btn.parentElement;
                    let profileUrl = null;
                    let name = "Unknown";

                    // Look for link in proximity
                    for (let i = 0; i < 5; i++) {
                        if (!container) break;
                        const link = container.querySelector('a'); // Often the name is a link
                        if (link && link.href.includes('facebook.com') && !link.href.includes('/friends/')) {
                            profileUrl = link.href;
                            name = link.innerText || "Facebook User";
                            break;
                        }
                        container = container.parentElement;
                    }

                    if (profileUrl) {
                        results.push({ url: profileUrl, name: name });
                    }
                }
                return results;
            });

            console.log(`[EXEC] Found ${candidates.length} candidates on screen.`);

            if (candidates.length === 0) {
                console.log(`[EXEC] No candidates found. Scrolling...`);
                await page.evaluate(() => window.scrollBy(0, 1000));
                await sleep(3000);
                continue;
            }

            // Process candidates
            for (const candidate of candidates) {
                if (totalAdded >= maxAdds) break;

                let cleanUrl = candidate.url.split('?')[0];
                if (processedProfiles.has(cleanUrl)) continue;
                processedProfiles.add(cleanUrl);

                // --- AI DEEP SCAN (Reused Logic) ---
                console.log(`[EXEC] Inspecting: ${candidate.name} (${cleanUrl})`);
                await logAction('search', 'info', `🕵️ AI đang thẩm định: ${candidate.name}`, { profile_url: cleanUrl });

                const profilePage = await browser.newPage();
                let aiScore = 0;
                let isQualified = false;

                try {
                    await profilePage.goto(cleanUrl, { waitUntil: 'networkidle2' });
                    await sleep(3000);

                    const pageText = await profilePage.evaluate(() => document.body.innerText.toLowerCase());
                    const bizKeywords = ['sỉ', 'lẻ', 'ship', 'shop', 'store', 'zalo', 'hotline', 'địa chỉ', 'kios', 'kho', 'chủ', 'owner', 'tạp hóa', 'mart', 'kinh doanh', 'buôn'];

                    const bioMatches = bizKeywords.filter(w => pageText.includes(w));
                    if (bioMatches.length > 0) aiScore += 30 + (bioMatches.length * 5); // Higher base score for suggestions (FB algorithm is usually good)

                    // Mutual Friends Check (Bonus)
                    const mutualText = await profilePage.evaluate(() => {
                        const allDivs = Array.from(document.querySelectorAll('span, div'));
                        const mutualLabel = allDivs.find(el => el.innerText && el.innerText.includes('mutual friends') || el.innerText.includes('bạn chung'));
                        return mutualLabel ? mutualLabel.innerText : null;
                    });
                    if (mutualText) aiScore += 15;

                    if (aiScore >= 25) isQualified = true;

                    console.log(`[EXEC] AI Score: ${aiScore} | Qualified: ${isQualified}`);

                    if (isQualified) {
                        // ROBUST ADD FRIEND CLICKING (Same as V7)
                        let addBtn = await profilePage.$('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]');
                        if (!addBtn) {
                            const [btn] = await profilePage.$x("//div[@role='button'][contains(., 'Add friend') or contains(., 'Thêm bạn bè')]");
                            if (btn) addBtn = btn;
                        }
                        if (!addBtn) {
                            const [moreBtn] = await profilePage.$x("//div[@aria-label='More' or @aria-label='Khác' or @aria-label='See options']");
                            if (moreBtn) {
                                await moreBtn.click();
                                await sleep(1000);
                                const [hiddenAddBtn] = await profilePage.$x("//div[@role='menuitem'][contains(., 'Add friend') or contains(., 'Thêm bạn bè')]");
                                if (hiddenAddBtn) addBtn = hiddenAddBtn;
                            }
                        }

                        if (addBtn) {
                            await addBtn.click();
                            totalAdded++;

                            await logAction('search', 'success', `Đã kết bạn từ Gợi Ý (AI Score: ${aiScore})`, {
                                profile_url: cleanUrl,
                                ai_score: aiScore
                            });

                            await saveLead({
                                source: `suggestion_surf`,
                                name: candidate.name,
                                profile_url: cleanUrl,
                                ai_score: aiScore
                            });

                            await sleep(2000);
                        } else {
                            // Handle failure/follow only
                            const [followBtn] = await profilePage.$x("//div[contains(@aria-label, 'Follow') or contains(@aria-label, 'Theo dõi')]");
                            if (followBtn) {
                                await logAction('search', 'warning', `Gợi ý chỉ cho Follow: ${candidate.name}`);
                            }
                        }
                    } else {
                        // Skip silently or low log
                    }

                } catch (e) {
                    console.log(`[EXEC] Scan Error: ${e.message}`);
                } finally {
                    await profilePage.close();
                }

                await sleep(2000);
            }

            // Scroll for next batch loop
            await page.evaluate(() => window.scrollBy(0, 1000));
            await sleep(3000);
        }

    } catch (e) {
        console.error(`[EXEC] Error: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        await sleep(5000);
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    executeSuggestionScan();
}

module.exports = { executeSuggestionScan };
