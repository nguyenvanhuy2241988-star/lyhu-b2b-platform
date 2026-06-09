const { createClient } = require('@supabase/supabase-js');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

let supabase = null;
let pollInterval = null;
let isWorking = false;
let currentToken = null;
let logCallback = null;

function customLog(msg) {
    console.log(msg);
    if (logCallback) logCallback(msg);
}

function startBotWorker(token, onLog) {
    if (pollInterval) clearInterval(pollInterval);
    currentToken = token ? token.trim() : null;
    logCallback = onLog;
    isWorking = false;

    // UUID basic validation check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!currentToken || !uuidRegex.test(currentToken)) {
        customLog(`❌ Lỗi: Mã Kích Hoạt (Token) không hợp lệ. Hãy kiểm tra lại!`);
        return;
    }

    // Use token directly as the API key (Anon Key) - Assumes RLS is configured or token is service role for testing
    // For production, we should authenticate the user with Supabase Auth using this token.
    // For now, if the web app uses a service key, we just use the local env key and use the token to filter by profile.
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        customLog("❌ THIẾU CẤU HÌNH: Không tìm thấy Supabase URL hoặc Key.");
        return;
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    customLog("==========================================");
    customLog("🚀 ĐÃ BẬT TRẠM KẾT NỐI: BOT WORKER DESKTOP");
    customLog(`🎧 Đang Quét tín hiệu dành riêng cho Token...`);
    customLog("==========================================");

    pollInterval = setInterval(async () => {
        if (isWorking) return;

        try {
            // Lấy lệnh dành cho User này
            const { data, error } = await supabase
                .from('marketing_bot_commands')
                .select('*, bot_profiles(folder_name)')
                .eq('status', 'pending')
                .eq('created_by', currentToken) // Filter by user token
                .order('created_at', { ascending: true })
                .limit(1);

            if (error) {
                customLog(`❌ Lỗi mạng khi quét dữ liệu: ${error.message || 'Unknown'}`);
                return;
            }

            if (data && data.length > 0) {
                const command = data[0];
                isWorking = true;
                
                const profileFolder = command.bot_profiles?.folder_name || '.bot_profile';
                customLog(`🔔 Nhận được lệnh kích hoạt: ${command.script_name}`);
                
                await supabase
                    .from('marketing_bot_commands')
                    .update({ status: 'running' })
                    .eq('id', command.id);

                // Đường dẫn tới script (chạy từ thư mục gốc của app)
                const scriptPath = path.join(__dirname, 'scripts/marketing', command.script_name);
                
                customLog(`💻 Đang bật Trình duyệt Tàng hình...`);
                
                // Chạy script ẩn danh
                const args = [];
                if (command.args) args.push(command.args);
                args.push(`--profile=${profileFolder}`);
                if (command.created_by) {
                    args.push(`--user_id=${command.created_by}`);
                }

                const botProcess = fork(scriptPath, args, {
                    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
                });

                botProcess.stdout.on('data', (data) => {
                    const msg = data.toString().trim();
                    if(msg) customLog(`[Bot] ${msg}`);
                });

                botProcess.stderr.on('data', (data) => {
                    const msg = data.toString().trim();
                    if(msg) customLog(`[Bot Error] ${msg}`);
                });

                botProcess.on('close', async (code) => {
                    customLog(`✅ Nhiệm vụ kết thúc (Mã: ${code}).`);
                    await supabase
                        .from('marketing_bot_commands')
                        .update({ status: code === 0 ? 'completed' : 'error' })
                        .eq('id', command.id);
                        
                    isWorking = false;
                    customLog(`🎧 Tiếp tục chờ lệnh mới...`);
                });
            }
        } catch (err) {
            // customLog(`❌ Lỗi hệ thống: ${err.message}`);
        }
    }, 2000);
}

function stopBotWorker() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    isWorking = false;
}

module.exports = { startBotWorker, stopBotWorker };
