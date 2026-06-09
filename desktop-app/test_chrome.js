const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        console.log("Launching system chrome...");
        const browser = await puppeteer.launch({
            channel: 'chrome',
            headless: true
        });
        console.log("Success! Version:", await browser.version());
        await browser.close();
    } catch(e) {
        console.error("Error:", e);
    }
})();
