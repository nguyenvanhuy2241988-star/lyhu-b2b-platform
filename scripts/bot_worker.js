require('dotenv').config({ path: __dirname + '/../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ THIẾU CẤU HÌNH: Hãy đảm bảo file .env.local có đủ biến của Supabase.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("==========================================");
console.log("🚀 KHỞI ĐỘNG CỖ MÁY: BOT WORKER (HYBRID - LITE V2)");
console.log("🎧 Đang Quét tín hiệu từ trạm Supabase mỗi 2 giây...");
console.log("==========================================");

let isWorking = false;

// Dùng kỹ thuật Polling (Quét liên tục) thay vì WebSocket để đảm bảo 100% không bị miss mạng
setInterval(async () => {
    if (isWorking) return; // Đang chạy Bot thì không nhận thêm

    try {
        // Tìm 1 lệnh đang ở trạng thái pending cũ nhất kèm thông tin Profile
        const { data, error } = await supabase
            .from('marketing_bot_commands')
            .select('*, bot_profiles(folder_name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) {
            console.error("Lỗi khi quét database:", error.message);
            return;
        }

        if (data && data.length > 0) {
            const command = data[0];
            isWorking = true;
            
            // Lấy folder name từ Profile được cài đặt, mặc định là .bot_profile
            const profileFolder = command.bot_profiles?.folder_name || '.bot_profile';
            
            console.log(`\n🔔 [TÍN HIỆU MỚI] Nhận được lệnh kích hoạt: ${command.script_name} - [Profile: ${profileFolder}]`);
            
            // Đánh dấu là đang chạy
            await supabase
                .from('marketing_bot_commands')
                .update({ status: 'running' })
                .eq('id', command.id);

            const scriptPath = path.join(__dirname, 'marketing', command.script_name);
            const safeArgs = command.args ? `"${command.args.replace(/[&|<>^%]/g, '')}"` : '';
            
            console.log(`💻 Đang gọi Terminal cho Bot...`);
            let execCommand = `start "BotTerminal" cmd /k "node \\"${scriptPath}\\" ${safeArgs} --profile=${profileFolder}"`;
            
            exec(execCommand, async (err) => {
                isWorking = false; // Xong việc, sẵn sàng nhận ca mới
                if (err) {
                    console.error(`❌ Lỗi khởi chạy Bot: ${err.message}`);
                    await supabase
                        .from('marketing_bot_commands')
                        .update({ status: 'error' })
                        .eq('id', command.id);
                    return;
                }
                
                console.log(`✅ Đã đẩy lệnh thành công! Đang chờ tín hiệu tiếp theo...`);
                await supabase
                    .from('marketing_bot_commands')
                    .update({ status: 'completed' })
                    .eq('id', command.id);
            });
        }
    } catch (e) {
        console.error("Lỗi:", e);
    }
}, 2000); // 2 giây quét 1 lần

process.on('SIGINT', () => {
    console.log("\n🛑 Đang tắt Worker...");
    process.exit(0);
});
