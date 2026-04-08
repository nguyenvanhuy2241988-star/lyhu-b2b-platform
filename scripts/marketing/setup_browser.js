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

// Extract dynamic profile folder from process arguments
let profileFolder = '.bot_profile'; // fallback default
const profileArg = process.argv.find(a => a.startsWith('--profile='));
if (profileArg) {
    profileFolder = profileArg.split('=')[1];
}

// Config
const USER_DATA_DIR = path.join(__dirname, '../../', profileFolder); // Dynamic profile
const SCREEN_WIDTH = 1366;
const SCREEN_HEIGHT = 768;

async function launchBrowser() {
    console.log('[Setup] Launching Stealth Browser...');

    console.log(`[Setup] Using Profile: ${profileFolder}`);
    console.log(`[Setup] Physical Path: ${USER_DATA_DIR}`);

    const browser = await puppeteer.launch({
        headless: false, // Run visible for testing/visual verification
        userDataDir: USER_DATA_DIR, // Explicitly set user data dir
        args: [
            `--window-size=${SCREEN_WIDTH},${SCREEN_HEIGHT}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--disable-blink-features=AutomationControlled', // Critical for stealth
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
