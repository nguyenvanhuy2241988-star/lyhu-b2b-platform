/**
 * Level 5: Ecosystem Mining - Post Scan Strategy
 * 1. Searches for POSTS containing keywords (e.g., "Khai trương", "Cần nhập sỉ").
 * 2. Extracts the AUTHOR of the post.
 * 3. Deep Scans the Author's Profile (AI Inference).
 * 4. Adds Friend if AI Score is high.
 */

const { launchBrowser } = require('./setup_browser');
const { logAction, saveLead } = require('./supabase_logger');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executePostScan(rawCommand, maxAdds = 5) {
    const keywords = rawCommand.split(',').map(k => k.trim()).filter(k => k.length > 0);
    console.log(`[EXEC] Starting POST SCAN for: ${keywords.join(', ')}`);

    await logAction('search', 'info', `🚀 Bắt đầu QUÉT BÀI VIẾT tìm chủ shop: "${keywords.join(', ')}"`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    // Store processed URLs to avoid duplicates
    const processedProfiles = new Set();
    let totalAdded = 0;

    try {
        for (const keyword of keywords) {
            if (totalAdded >= maxAdds) break;

            console.log(`[EXEC] >>> Searching Posts for: "${keyword}"`);
            await logAction('search', 'info', `🔎 Đang tìm bài viết chứa: "${keyword}"`);

            // 1. Navigate to Post Search
            // https://www.facebook.com/search/posts/?q=keyword&filters=... (We use default "All Posts" or "Public Posts")
            // To be safe, we use simple search URL and hope for best. 
            // In a real sophisticated bot, we might filter by 'Recent' to get active users.
            // &filters=eyJzb3J0X2tleSI6In7ic29ydF9vcmRlciJ9fQ%3D%3D -> Recent (approx)
            // Let's stick to default top posts for relevance first.
            const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(keyword)}`;

            await page.goto(searchUrl, { waitUntil: 'networkidle2' });
            await sleep(3000);

            // 2. Scroll and Collect Authors
            let potentialAuthors = [];
            // Increase scroll depth to find more results
            for (let i = 0; i < 7; i++) {
                const authors = await page.evaluate(() => {
                    const found = [];
                    const links = Array.from(document.querySelectorAll('a[role="link"]'));
                    for (const link of links) {
                        const href = link.href;
                        const text = link.innerText;

                        // Heuristic: Link must be a profile, not a group/page/hashtag
                        if (href && href.includes('facebook.com') &&
                            !href.includes('/groups/') &&
                            !href.includes('/hashtag/') &&
                            !href.includes('/watch') &&
                            !href.includes('/photo') &&
                            !href.includes('/events/') &&
                            !href.includes('l.facebook.com') && // External links
                            text.length > 2) {

                            // Check if it looks like a profile
                            // Profile URLs: /profile.php?id=... or /username
                            // We filter out obvious non-profiles
                            if (href.includes('/profile.php') || (href.split('/').length === 4)) {
                                found.push({ url: href, name: text });
                            }
                        }
                    }
                    return found;
                });

                potentialAuthors = [...potentialAuthors, ...authors];
                await page.evaluate(() => window.scrollBy(0, 1000));
                await sleep(1500 + Math.random() * 1000);
            }

            console.log(`[EXEC] Found ${potentialAuthors.length} potential authors (Raw).`);

            // 3. Process Authors (Deep Scan)
            for (const author of potentialAuthors) {
                if (totalAdded >= maxAdds) break;

                // Clean URL
                let cleanUrl = author.url.split('?')[0];
                if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

                // Skip duplicates and self
                if (processedProfiles.has(cleanUrl)) continue;
                processedProfiles.add(cleanUrl);

                // --- AI DEEP SCAN LOGIC ---
                console.log(`[EXEC] Deep Scan Initiation for Author: ${cleanUrl}`);
                await logAction('search', 'info', `🕵️ AI đang thẩm định tác giả: ${author.name}`, { profile_url: cleanUrl });

                const profilePage = await browser.newPage();
                let aiScore = 0;
                let isQualified = false;

                try {
                    await profilePage.goto(cleanUrl, { waitUntil: 'networkidle2' });
                    await sleep(3000);

                    const pageText = await profilePage.evaluate(() => document.body.innerText.toLowerCase());
                    const bizKeywords = ['sỉ', 'lẻ', 'ship', 'shop', 'store', 'zalo', 'hotline', 'địa chỉ', 'kios', 'kho', 'chủ', 'owner', 'tạp hóa', 'mart'];

                    const bioMatches = bizKeywords.filter(w => pageText.includes(w));
                    if (bioMatches.length > 0) aiScore += 20 + (bioMatches.length * 5);

                    // Check for "Message" button (Active Check)
                    const hasMessageBtn = await profilePage.$('div[aria-label="Message"], div[aria-label="Nhắn tin"]');
                    if (hasMessageBtn) aiScore += 10;

                    // Lower threshold slightly to ensure we don't miss potential matches due to strict keywords
                    if (aiScore >= 15) isQualified = true;

                    console.log(`[EXEC] AI Score: ${aiScore} | Qualified: ${isQualified}`);

                    if (isQualified) {
                        // ROBUST ADD FRIEND CLICKING
                        // Try 1: ARIA Label
                        let addBtn = await profilePage.$('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]');

                        // Try 2: XPath Text Search (Most reliable)
                        if (!addBtn) {
                            const [btn] = await profilePage.$x("//div[@role='button'][contains(., 'Add friend') or contains(., 'Thêm bạn bè')]");
                            if (btn) addBtn = btn;
                        }

                        // Try 3: Span text search
                        if (!addBtn) {
                            const [span] = await profilePage.$x("//span[contains(text(), 'Add friend') or contains(text(), 'Thêm bạn bè')]");
                            if (span) addBtn = span;
                        }

                        if (addBtn) {
                            await addBtn.click();
                            totalAdded++;
                            console.log(`[EXEC] Clicked Add Friend for ${author.name}`);

                            await logAction('search', 'success', `Đã kết bạn với Chủ Shop (AI Score: ${aiScore})`, {
                                profile_url: cleanUrl,
                                ai_score: aiScore
                            });

                            await saveLead({
                                source: `post_scan: ${keyword}`,
                                name: author.name,
                                profile_url: cleanUrl,
                                ai_score: aiScore
                            });

                            await sleep(2000);
                        } else {
                            // Check if already requested or followed
                            const isRequested = await profilePage.evaluate(() => {
                                return document.body.innerText.includes('Cancel request') || document.body.innerText.includes('Hủy lời mời');
                            });

                            if (isRequested) {
                                console.log(`[EXEC] Already requested ${author.name}`);
                            } else {
                                console.log(`[EXEC] No Add Friend button for ${author.name} (Might be Follow only or blocked)`);
                                // Optional: Fallback to Follow?
                            }
                        }
                    } else {
                        // await logAction('search', 'warning', `Bỏ qua: ${author.name} (Điểm thấp: ${aiScore})`);
                    }

                } catch (e) {
                    console.log(`[EXEC] Deep Scan Error: ${e.message}`);
                } finally {
                    await profilePage.close();
                }

                await sleep(2000);
            }
        }

    } catch (e) {
        console.error(`[EXEC] Error: ${e.message}`);
        await logAction('search', 'error', `Lỗi: ${e.message}`);
    } finally {
        await sleep(60000);
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "Khai trương cửa hàng, Tìm nguồn sỉ";
    executePostScan(cmd);
}

module.exports = { executePostScan };
