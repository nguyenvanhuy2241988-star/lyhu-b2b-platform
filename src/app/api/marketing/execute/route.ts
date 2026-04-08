import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { scriptName, args } = await req.json();

        // Whitelist allowed scripts for security
        const ALLOWED_SCRIPTS = [
            'execute_search_add.js',
            'group_finder.js',
            'invite_friend_page.js',
            'defense_engine.js',
            'manual_login.js',
            'execute_post_scan.js',
            'master_commander.js',
            'execute_suggestion_scan.js',
            'execute_rival_scan.js'
        ];

        if (!ALLOWED_SCRIPTS.includes(scriptName)) {
            return NextResponse.json({ error: 'Invalid script name' }, { status: 400 });
        }

        // Lấy client chuẩn để bỏ qua lỗi Proxy trên Vercel SSR
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
        );
        
        // Bỏ qua bước lấy session vì RLS đã cho phép public insert
        // Insert lệnh vào database để Bot Worker ở Local nghe lén và chạy
        const { error } = await supabase
            .from('marketing_bot_commands')
            .insert({
                script_name: scriptName,
                args: args || '',
                status: 'pending',
                created_by: null
            });

        if (error) {
            console.error("Lỗi insert lệnh bot vào Supabase:", error);
            return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Lệnh [${scriptName}] đã được chuyển vào hàng đợi thành công!` });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
