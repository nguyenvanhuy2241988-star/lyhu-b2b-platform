require('dotenv').config({ path: __dirname + '/../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const path = require('path');

// Khởi tạo Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ THIẾU CẤU HÌNH: Hãy đảm bảo file .env.local đã có đủ NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("==========================================");
console.log("🚀 KHỞI ĐỘNG CỖ MÁY: BOT WORKER (HYBRID)");
console.log("🎧 Đang lắng nghe kênh Vệ tinh (marketing_bot_commands)...");
console.log("==========================================");

// Lắng nghe realtime từ bảng marketing_bot_commands
const channel = supabase.channel('bot-worker-room')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'marketing_bot_commands',
            filter: "status=eq.pending"
        },
        async (payload) => {
            const command = payload.new;
            console.log(`\n🔔 [TÍN HIỆU MỚI] Nhận được lệnh kích hoạt: ${command.script_name}`);
            
            // Đổi trạng thái thành running
            await supabase
                .from('marketing_bot_commands')
                .update({ status: 'running' })
                .eq('id', command.id);

            // Chạy lệnh CMD y như cũ
            const scriptPath = path.join(__dirname, 'marketing', command.script_name);
            const safeArgs = command.args ? `"${command.args.replace(/[&|<>^%]/g, '')}"` : '';
            
            // Gọi màn hình CMD ảo y như cách cũ
            console.log(`💻 Đang gọi Terminal cho Bot...`);
            let execCommand = `start cmd /k "node ${scriptPath} ${safeArgs}"`;
            
            exec(execCommand, async (error) => {
                if (error) {
                    console.error(`❌ Lỗi khởi chạy Bot: ${error.message}`);
                    await supabase
                        .from('marketing_bot_commands')
                        .update({ status: 'error' })
                        .eq('id', command.id);
                    return;
                }
                
                console.log(`✅ Đã đẩy lệnh thành công! Đang chờ tín hiệu tiếp theo...`);
                // Note: Trạng thái complete nên do chính bản thân script (ví dụ defense_engine.js) cập nhật 
                // sau khi chạy xong. Tuy nhiên ở đây tạm coi như mở bảng cmd lên là success.
                await supabase
                    .from('marketing_bot_commands')
                    .update({ status: 'completed' })
                    .eq('id', command.id);
            });
        }
    )
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log("📡 Đã kết nối Mạng lưới Vệ tinh Supabase Realtime thành công!");
        } else if (status === 'CHANNEL_ERROR') {
            console.error("❌ Mất kết nối Realtime...");
        }
    });

// Chặn tắt app đột xuất
process.on('SIGINT', () => {
    console.log("\n🛑 Đang ngắt kết nối Worker...");
    supabase.removeChannel(channel);
    process.exit(0);
});
