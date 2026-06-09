/**
 * Level 41: Master Commander (Mission Orchestrator)
 * Receives Natural Language Command -> Parses Intent -> Executes Best Strategy.
 */

const { interpretCommand } = require('./targeting_interpreter');
const { executePostScan } = require('./execute_post_scan');
const { logAction } = require('./supabase_logger');

async function executeMission(rawCommand) {
    console.log(`[COMMANDER] Received Mission: "${rawCommand}"`);
    await logAction('info', 'info', `🗣️ Nhận lệnh tổng: "${rawCommand}"`);

    // 1. Parse Intent
    const intent = interpretCommand(rawCommand);
    console.log(`[COMMANDER] Parsed Intent:`, intent.parsed);
    console.log(`[COMMANDER] Generated Strategies:`, intent.strategies);

    await logAction('info', 'info', `🧠 Phân tích lệnh: Tìm "${intent.parsed.target}" tại "${intent.parsed.location || 'Toàn quốc'}"`);

    // 2. Select & Execute Strategy
    // Priority: Post Scan (Ecosystem Mining) > People Search
    const primaryStrategy = intent.strategies.post_scan;

    if (primaryStrategy && primaryStrategy.length > 0) {
        const keywords = primaryStrategy.join(',');
        console.log(`[COMMANDER] Activitating Strategy: POST SCAN`);
        console.log(`[COMMANDER] Payload: ${keywords}`);

        await logAction('search', 'info', `🚀 Kích hoạt Chiến thuật 1: Quét Bài Viết (Post Scan) với từ khóa tự động.`);

        // Execute Post Scan with Generated Keywords
        await executePostScan(keywords);
    } else {
        console.log(`[COMMANDER] No strategy generated. Fallback.`);
    }

    // Future: Chain Group Scan here
}

// CLI usage
if (require.main === module) {
    const cmd = process.argv[2] || "Tìm chủ tiệm tạp hóa ở Hà Nội";
    executeMission(cmd);
}

module.exports = { executeMission };
