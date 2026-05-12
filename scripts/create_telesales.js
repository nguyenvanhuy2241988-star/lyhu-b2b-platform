const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Đọc cấu hình từ .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
    console.error("Lỗi đọc file .env.local:", err.message);
    process.exit(1);
}

// Xử lý BOM (Byte Order Mark) và dấu xuống dòng (CRLF) trên Windows
envContent = envContent.replace(/^\uFEFF/, '').replace(/\r/g, '');

const envVars = {};
envContent.split('\n').forEach(line => {
    // Bỏ qua dòng trống hoặc comment
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        // Loại bỏ khoảng trắng và các ký tự BOM thừa
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
    }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Không tìm thấy biến môi trường Supabase trong .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAccounts() {
    console.log('Bắt đầu tạo 10 tài khoản qua API chuẩn của Supabase...');
    
    for (let i = 1; i <= 10; i++) {
        const email = `telesales${i.toString().padStart(2, '0')}@lyhu.vn`;
        const password = 'Telesales@2026';
        
        console.log(`Đang đăng ký ${email}...`);
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: `Telesales ${i.toString().padStart(2, '0')}`
                }
            }
        });
        
        if (error) {
            console.error(`  [LỖI] ${email}: ${error.message}`);
        } else {
            console.log(`  [OK] Đã tạo thành công.`);
        }
    }
    
    console.log('\n✅ Hoàn tất gọi API tạo user!');
    console.log('BƯỚC TIẾP THEO: Hãy quay lại Supabase SQL Editor và chạy đoạn lệnh UPDATE email_confirmed_at để kích hoạt tài khoản!');
}

createAccounts();
