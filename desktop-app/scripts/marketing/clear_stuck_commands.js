import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearQueue() {
    console.log("Đang chờ xóa toàn bộ lệnh kẹt...");
    
    // Xóa tất cả lệnh pending và running
    const { data: d1, error: e1 } = await supabase.from('marketing_bot_commands').delete().neq('status', 'completed');
    
    if (e1) {
         console.error("Lỗi:", e1.message);
    } else {
         console.log("✅ ĐÃ XÓA SẠCH HÀNG ĐỢI LỆNH CŨ TRONG CƠ SỞ DỮ LIỆU!");
    }
}

clearQueue();
