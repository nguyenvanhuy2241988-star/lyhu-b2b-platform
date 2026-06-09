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

    const commonPaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "CocCoc\\Browser\\Application\\browser.exe") : "",
        "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
    ];

    let executablePath = null;
    for (const p of commonPaths) {
        if (p && fs.existsSync(p)) {
            executablePath = p;
            console.log(`[Setup] Found browser executable at: ${p}`);
            break;
        }
    }

    const launchArgs = {
        headless: false,
        userDataDir: USER_DATA_DIR,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-notifications',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized'
        ],
        defaultViewport: null
    };

    if (executablePath) {
        launchArgs.executablePath = executablePath;
    } else {
        launchArgs.channel = 'chrome'; 
    }

    let browser;
    try {
        browser = await puppeteer.launch(launchArgs);
    } catch (e) {
        console.warn(`[Setup] Failed to launch with primary strategy: ${e.message}`);
        if (launchArgs.channel === 'chrome') {
            console.log(`[Setup] Fallback to msedge channel...`);
            launchArgs.channel = 'msedge';
            try {
                browser = await puppeteer.launch(launchArgs);
            } catch (e2) {
                throw new Error(`Không tìm thấy trình duyệt Chromium (Chrome/Edge/CocCoc/Brave) trên máy tính! Vui lòng cài đặt Google Chrome. (Lỗi: ${e.message})`);
            }
        } else {
            throw new Error(`Lỗi khởi động trình duyệt: ${e.message}`);
        }
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
        // await browser.close(); 
    })();
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function rdn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports = { launchBrowser, delay, rdn };
