const { launchBrowser } = require('./setup_browser');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function runManualLogin() {
    console.log("🔑 [SETUP] Opening Browser for Manual Login...");
    console.log("👉 Please log in to Facebook manually in the opened window.");
    console.log("👉 Once logged in, you can close the browser. The session will be saved.");

    // Launch browser (will use the persistent .bot_profile)
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

        // Keep it open indefinitely until user closes it
        // We do this by waiting for a browser disconnected event or just a very long timeout
        console.log("⏳ Browser is open. Waiting for you to close it...");

        await new Promise((resolve) => {
            browser.on('disconnected', resolve);
        });

    } catch (e) {
        console.error("Login Setup Error:", e);
    }

    console.log("👋 Browser closed. Session saved.");
}

module.exports = { runManualLogin };

if (require.main === module) {
    runManualLogin();
}
