import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { scriptName, args, profileId } = await req.json();

        // Whitelist allowed scripts for security
        const ALLOWED_SCRIPTS = [
            'execute_search_add.js',
            'execute_profile_add.js',
            'execute_sniper_add.js',
            'group_finder.js',
            'invite_friend_page.js',
            'defense_engine.js',
            'manual_login.js',
            'execute_post_scan.js',
            'master_commander.js',
            'execute_suggestion_scan.js',
            'execute_rival_scan.js',
            'auto_post_profile.js',
            'auto_post_group.js',
            'auto_comment_group.js'
        ];

        if (!ALLOWED_SCRIPTS.includes(scriptName)) {
            return NextResponse.json({ error: 'Invalid script name' }, { status: 400 });
        }

        // Lấy client Admin (Service Role) để bỏ qua rào cản Bảo mật RLS (do chúng ta không cấu hình session rườm rà)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
        // Ưu tiên dùng Service Role Key (Admin) để bypass RLS, nếu không có thì fallback qua Anon Key 
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Cố tình ghi đè created_by null (Vì RLS sẽ được Bypass bởi Service Role)
        const { error } = await supabase
            .from('marketing_bot_commands')
            .insert({
                script_name: scriptName,
                args: args || '',
                status: 'pending',
                created_by: null,
                profile_id: profileId || null
            });

        if (error) {
            console.error("Lỗi insert lệnh bot vào Supabase:", error);
            // In error.message ra console log server để dễ debug
            console.error(error.message);
            return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Lệnh [${scriptName}] đã được chuyển vào hàng đợi thành công!` });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
