/**
 * Level 4: Execution Module - Search & Add
 * 1. Receives interpreted query.
 * 2. Navigates to Facebook Search.
 * 3. Filters by People.
 * 4. Checks Bio for relevance (Double Verify).
 * 5. Clicks "Add Friend" safely.
 */

const { interpretCommand } = require('./targeting_interpreter');
const { launchBrowser } = require('./setup_browser');
const { logAction } = require('./supabase_logger');

async function executeSearchAndAdd(command, maxAdds = 5) {
    console.log(`[EXEC] Received Command: "${command}"`);
    await logAction('search', 'info', `Nhận lệnh: "${command}"`);

    // 1. Interpret
    const strategy = interpretCommand(command);
    console.log(`[EXEC] Strategy Generated:`, strategy.generatedQueries);

    // 2. Launch Browser (Mock for now, normally would use existing profile)
    // const browser = await launchBrowser();
    // const page = await browser.newPage();

    console.log(`[EXEC] ---------------------------------------------------`);
    console.log(`[EXEC] SIMULATION: Connecting to Facebook Graph Search...`);

    for (const query of strategy.generatedQueries) {
        console.log(`[EXEC] >>> Searching for query: "${query}"`);
        await logAction('search', 'info', `🔍 Đang tìm kiếm: ${query}`);

        // Construct FB Search URL (Reverse engineered)
        // https://www.facebook.com/search/people/?q=...
        const searchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(query)}`;
        console.log(`[EXEC]     Navigating to: ${searchUrl}`);

        // Mock Page Scan
        console.log(`[EXEC]     Scanning results...`);

        // Filter Logic (Human Simulator)
        // Check 1: Does name/bio contain relevant keywords?
        // Check 2: Skip if button says "Message" (already friend) or "Follow" (limit reached)

        console.log(`[EXEC]     ✅ Found Target: [Mock User ID: 1000${Math.floor(Math.random() * 9999)}] matching criteria.`);

        if (maxAdds > 0) {
            console.log(`[EXEC]     🖱️ CLICKING "Add Friend"... (Random delay 3245ms)`);
            maxAdds--;
            console.log(`[EXEC]     ✨ Request Sent! Remaining quota: ${maxAdds}`);
            await logAction('search', 'success', `Đã gửi kết bạn (Mock User). Còn lại: ${maxAdds}`);
        } else {
            console.log(`[EXEC]     🛑 Daily Quota Reached. Stopping.`);
            break;
        }

        console.log(`[EXEC]     zzz Sleeping 10s before next scan...`);
    }

    console.log(`[EXEC] ---------------------------------------------------`);
    console.log(`[EXEC] Mission Complete.`);
    await logAction('search', 'success', `Hoàn thành nhiệm vụ tìm kiếm.`);
    // await browser.close();
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "Tìm chủ tạp hóa bán sỉ";
    executeSearchAndAdd(cmd);
}

module.exports = { executeSearchAndAdd };
