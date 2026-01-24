const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { launchBrowser } = require('./setup_browser');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// Config
const TARGET_PAGE_URL = 'https://www.facebook.com/profile.php?id=61555986422874'; // LYHU App Fanpage
const INVITE_LIMIT = 50; // Safety limit per run

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await sleep(delay);
}

async function runTrafficMagnet() {
    console.log("🚀 [TRAFFIC MAGNET] Starting Invite Sequence...");

    // 1. Init Browser (Stealth Mode)
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        // 2. Go to Page
        console.log(`Resource: Navigating to ${TARGET_PAGE_URL}`);
        await page.goto(TARGET_PAGE_URL, { waitUntil: 'networkidle2' });
        await randomDelay(2000, 4000);

        // 3. Find "Invite Friends" button (Usually in the ... menu or separate tab)
        // This selector is tricky as it changes often. We'll try a common approach for Page owners/admins
        // Or for normal users visiting a page.

        // Approach: Look for "Invite friends to like this Page" or similar.
        // On modern FB, it's often inside the "..." menu or "Community" tab.

        console.log("🔍 Looking for 'Invite Friends' entry point...");

        // Try clicking the "..." menu first if it exists
        const threeDotsMenu = await page.$('div[aria-label="See options"]');
        if (threeDotsMenu) {
            await threeDotsMenu.click();
            await randomDelay(1000, 2000);

            // Look for "Invite friends" in the menu
            const menuItems = await page.$$('div[role="menuitem"]');
            let inviteClicked = false;
            for (const item of menuItems) {
                const text = await page.evaluate(el => el.textContent, item);
                if (text.includes('Invite friends') || text.includes('Mời bạn bè')) {
                    console.log("Found Invite option in menu!");
                    await item.click();
                    inviteClicked = true;
                    break;
                }
            }

            if (!inviteClicked) {
                console.log("⚠️ Could not find 'Invite friends' in ... menu. Trying public view approach.");
                // Fallback logic here if needed
            }
        } else {
            console.log("⚠️ '...' menu not found. Checking for direct Invite button or Community tab.");
        }

        await randomDelay(3000, 5000);

        // 4. Handle the Invite Modal
        // Wait for modal to appear
        const modalSelector = 'div[role="dialog"]';
        try {
            await page.waitForSelector(modalSelector, { timeout: 10000 });
            console.log("✅ Invite Modal detected!");
        } catch (e) {
            console.log("❌ Invite Modal did not appear. You might not have permission or are already logged out.");
            await browser.close();
            return;
        }

        // 5. Select Friends
        // Loop through list and click invite
        console.log("🖱️ Starting to select friends...");

        let sentCount = 0;
        const buttons = await page.$$('div[role="checkbox"]'); // Often friends allow "Select all" or individual checkboxes

        // Check for "Select All" with a limit (FB usually limits to 1000, but we want to be safe)
        // Ideally we pick manually to look human, or use the Select All if confident.
        // Let's scroll and pick random people to be safe.

        // If there is a "Select All" text usually clickable
        const spanTexts = await page.$$eval('span', spans => spans.map(s => s.textContent));
        const selectAllText = spanTexts.find(t => t === 'Select all' || t === 'Chọn tất cả');

        if (selectAllText) {
            // Implementation for Select All
            console.log("Found Select All (Simulating click...)");
            // Note: Implementing exact click needs xpath or reliable selector.
        }

        // Reliable Strategy: Find unchecked checkboxes and click them one by one up to limit
        const checkboxes = await page.$$('div[role="checkbox"][aria-checked="false"]');

        for (const checkbox of checkboxes) {
            if (sentCount >= INVITE_LIMIT) break;

            await checkbox.click();
            console.log(`👉 Selected friend #${sentCount + 1}`);
            sentCount++;

            // Random micro-delay between clicks
            await randomDelay(500, 1500);

            // Occasionally pause longer
            if (Math.random() > 0.8) {
                console.log("Thinking...");
                await randomDelay(2000, 4000);
            }
        }

        if (sentCount === 0) {
            console.log("⚠️ No new friends to invite found (or selector changed).");
        } else {
            console.log(`✅ Selected ${sentCount} friends.`);

            // 6. Click "Send Invites"
            console.log("📤 Sending Invites...");
            const sendButtons = await page.$$('div[role="button"]');
            for (const btn of sendButtons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text === 'Send invites' || text === 'Gửi lời mời' || text.includes('Send invite')) {
                    await btn.click();
                    console.log("🚀 Invites Sent!");
                    break;
                }
            }
        }

        await randomDelay(3000, 5000);

    } catch (error) {
        console.error("❌ Fatal Error in Traffic Magnet:", error);
    } finally {
        await browser.close();
        console.log("👋 Browser closed.");
    }
}

runTrafficMagnet();
