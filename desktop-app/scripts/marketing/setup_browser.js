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

function clearSessions() {
    try {
        const sessionsPath = path.join(USER_DATA_DIR, 'Default', 'Sessions');
        if (fs.existsSync(sessionsPath)) {
            console.log(`[Setup] Xóa phiên làm việc cũ (Sessions) để tránh treo trình duyệt...`);
            fs.rmSync(sessionsPath, { recursive: true, force: true });
        }
    } catch (e) {
        // Ignore errors if files are locked
    }
}

async function launchBrowser() {
    console.log('[Setup] Launching Stealth Browser...');
    console.log(`[Setup] Using Profile: ${profileFolder}`);
    console.log(`[Setup] Physical Path: ${USER_DATA_DIR}`);

    clearSessions();

    // Determine executablePath for packaged Electron app
    let executablePath = puppeteer.executablePath();
    const isPackaged = __dirname.includes('app.asar');
    if (isPackaged) {
        // In production, .cache is copied to resources folder
        const asarIndex = __dirname.indexOf('app.asar');
        const resourcesDir = __dirname.substring(0, asarIndex);
        const relativeChromePath = executablePath.split('.cache')[1];
        if (relativeChromePath) {
            executablePath = path.join(resourcesDir, '.cache', relativeChromePath);
            console.log(`[Setup] Bundled browser path: ${executablePath}`);
        }
    }

    const launchArgs = {
        headless: false,
        userDataDir: USER_DATA_DIR,
        executablePath: executablePath,
        args: [
            `--window-size=${SCREEN_WIDTH},${SCREEN_HEIGHT}`,
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-notifications',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--start-maximized'
        ],
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation']
    };

    let browser;
    try {
        browser = await puppeteer.launch(launchArgs);
    } catch (e) {
        throw new Error(`Lỗi khởi động trình duyệt Tàng Hình (Mã lỗi: 21): ${e.message}\nVui lòng kiểm tra lại phần mềm diệt virus hoặc quyền truy cập.`);
    }

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
    })();
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function rdn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports = { launchBrowser, delay, rdn };
