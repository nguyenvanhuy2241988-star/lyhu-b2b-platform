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
            for (let i = 0; i < 3; i++) { // Scroll a few times
                const authors = await page.evaluate(() => {
                    const found = [];
                    // Strategy: Look for standard Post Headers. 
                    // Usually <a> tags with specific roles or structure inside feed units.
                    // This is heuristic. We look for links that look like profile Links near the top of a card.
                    // A safer bet: Look for 'h2' or 'h3' or 'strong' tags containing links.

                    // Let's try to query links that *don't* look like hashtags or page links if possible.
                    // But easiest is to grab ALL links, filter for profile patterns.
                    const links = Array.from(document.querySelectorAll('a[role="link"]'));
                    for (const link of links) {
                        const href = link.href;
                        const text = link.innerText;

                        if (href && href.includes('facebook.com') &&
                            !href.includes('/groups/') &&
                            !href.includes('/hashtag/') &&
                            !href.includes('/watch') &&
                            !href.includes('/photo') &&
                            text.length > 2) {

                            // Naive check: Does it look like a user profile?
                            if (href.includes('/profile.php') || (href.split('/').length === 4)) {
                                found.push({ url: href, name: text });
                            }
                        }
                    }
                    return found;
                });

                potentialAuthors = [...potentialAuthors, ...authors];
                await page.evaluate(() => window.scrollBy(0, 800));
                await sleep(2000);
            }

            console.log(`[EXEC] Found ${potentialAuthors.length} potential authors.`);

            // 3. Process Authors (Deep Scan)
            for (const author of potentialAuthors) {
                if (totalAdded >= maxAdds) break;

                // Clean URL (remove params)
                let cleanUrl = author.url.split('?')[0];
                if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

                if (processedProfiles.has(cleanUrl)) continue;
                processedProfiles.add(cleanUrl);

                // --- AI DEEP SCAN LOGIC (Reused/Inline) ---
                console.log(`[EXEC] Deep Scan Initiation for Author: ${cleanUrl}`);
                await logAction('search', 'info', `🕵️ AI đang thẩm định tác giả: ${author.name}`, { profile_url: cleanUrl });

                const profilePage = await browser.newPage();
                let aiScore = 0;
                let isQualified = false;

                try {
                    await profilePage.goto(cleanUrl, { waitUntil: 'networkidle2' });
                    await sleep(3000);

                    // Check Bio Keywords
                    const pageText = await profilePage.evaluate(() => document.body.innerText.toLowerCase());
                    const bizKeywords = ['sỉ', 'lẻ', 'ship', 'shop', 'store', 'zalo', 'hotline', 'địa chỉ', 'kios', 'kho', 'chủ', 'owner'];
                    const interactionSignals = ['giá', 'ib', 'inbox', 'nhiêu']; // From Interaction Mining V4

                    // Score Calculation
                    const bioMatches = bizKeywords.filter(w => pageText.includes(w));
                    if (bioMatches.length > 0) aiScore += 20 + (bioMatches.length * 5);

                    // Check for "Message" button (Active Check)
                    const hasMessageBtn = await profilePage.$('div[aria-label="Message"], div[aria-label="Nhắn tin"]');
                    if (hasMessageBtn) aiScore += 10;

                    // High Score Threshold or "Ecosystem Match"
                    // Since we found them via a RELEVANT POST (Context Mining), base reliability is high.
                    // We just need to check if they are "Alive" and "Active".

                    if (aiScore >= 20) isQualified = true;

                    console.log(`[EXEC] AI Score: ${aiScore} | Qualified: ${isQualified}`);

                    if (isQualified) {
                        // Try to Add Friend
                        // Look for Add Friend button on Profile Page
                        const addBtn = await profilePage.$('div[aria-label="Add friend"], div[aria-label="Thêm bạn bè"]');
                        if (addBtn) {
                            await addBtn.click();
                            totalAdded++;

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
                            console.log(`[EXEC] No Add Friend button for ${author.name}`);
                            // Maybe Log as "Followed" or "Found" but couldn't add
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
