const { launchBrowser } = require('./setup_browser');
const { logAction } = require('./supabase_logger'); // Import Logger
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Utilities
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await sleep(delay);
}

/**
 * Humanizer Module: Makes the bot act like a bored human.
 * - Scrolls Newsfeed
 * - Pauses looking at posts
 * - Randomly expands "See more"
 */
async function warmUp(page, durationSeconds = 60) {
    console.log(`🛡️ [DEFENSE] Starting Warm-up Sequence (${durationSeconds}s)...`);
    await logAction('defense', 'info', `Bắt đầu chế độ 'Lá Chắn Ảo' (${durationSeconds}s)...`);

    // 1. Go to Newsfeed
    if (page.url() !== 'https://www.facebook.com/') {
        await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
    }

    // Check if we are stuck on Login Page
    const loginInput = await page.$('input[name="email"]');
    if (loginInput) {
        console.log("⚠️ [ALERT] Login Page detected! Please Log In manually in the browser.");
        console.log("⏳ Waiting 60s for you to login...");
        await sleep(60000); // Give user time to login

        // Refresh to get to Newsfeed
        console.log("🔄 Refreshing page...");
        await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
    }

    const endTime = Date.now() + (durationSeconds * 1000);

    while (Date.now() < endTime) {
        // Random Scroll
        const scrollAmount = Math.floor(Math.random() * 500) + 100;
        await page.evaluate((y) => window.scrollBy(0, y), scrollAmount);

        // Random Pause (Reading a post)
        if (Math.random() > 0.7) {
            console.log("   ...Reading a post...");
            await logAction('defense', 'info', "...Đang đọc bài viết...");
            await randomDelay(2000, 5000);
        } else {
            await randomDelay(500, 1500);
        }

        // Randomly move mouse (Anti-bot detection)
        if (Math.random() > 0.8) {
            const x = Math.floor(Math.random() * 500);
            const y = Math.floor(Math.random() * 500);
            await page.mouse.move(x, y, { steps: 10 });
        }
    }

    console.log("🛡️ [DEFENSE] Warm-up Complete. Account is ready.");
    await logAction('defense', 'success', "Hoàn tất 'Lá Chắn Ảo'. Tài khoản đã an toàn.");
}

async function runDefenseTest() {
    console.log("🧪 Testing Defense Engine...");
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        // Run for 15 minutes (900 seconds) as per the Warm-up Strategy
        await warmUp(page, 900);
    } catch (e) {
        console.error("Defense Error:", e);
        await logAction('defense', 'error', `Lỗi: ${e.message}`);
    } finally {
        await browser.close();
    }
}

// Export for other modules to use
module.exports = { warmUp, runDefenseTest };

// If run directly
if (require.main === module) {
    runDefenseTest();
}
