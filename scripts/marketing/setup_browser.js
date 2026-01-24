/**
 * Level 1: Stealth Browser Environment Setup
 * This script initializes a stealthy browser instance using Puppeteer.
 * It is designed to be imported by other marketing modules.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to evade detection
puppeteer.use(StealthPlugin());

// Config
const USER_DATA_DIR = path.join(__dirname, '../../.bot_profile'); // Persistent profile
const SCREEN_WIDTH = 1366;
const SCREEN_HEIGHT = 768;

async function launchBrowser() {
    console.log('[Setup] Launching Stealth Browser...');

    const browser = await puppeteer.launch({
        headless: false, // Run visible for testing/visual verification
        args: [
            `--window-size=${SCREEN_WIDTH},${SCREEN_HEIGHT}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--disable-blink-features=AutomationControlled', // Critical for stealth
            `--user-data-dir=${USER_DATA_DIR}` // Save cookies/session
        ],
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'] // Hide "Chrome is being controlled by automated software"
    });

    console.log('[Setup] Browser Launched Successfully.');
    return browser;
}

// Test function
if (require.main === module) {
    (async () => {
        const browser = await launchBrowser();
        const page = await browser.newPage();
        await page.goto('https://bot.sannysoft.com'); // Test stealth
        console.log('[Test] Please verify stealth score manually.');
        // await browser.close(); 
    })();
}

module.exports = { launchBrowser };
