export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { scriptName, args, profileId, userId } = await req.json();

        // Whitelist allowed scripts for security
        const ALLOWED_SCRIPTS = [
            'execute_search_add.js',
            'execute_profile_add.js',
            'execute_sniper_add.js',
            'execute_radar_check.js',
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

        // Láº¥y client Admin (Service Role) Ä‘á»ƒ bá» qua rÃ o cáº£n Báº£o máº­t RLS (do chÃºng ta khÃ´ng cáº¥u hÃ¬nh session rÆ°á»m rÃ )
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
        // Æ¯u tiÃªn dÃ¹ng Service Role Key (Admin) Ä‘á»ƒ bypass RLS, náº¿u khÃ´ng cÃ³ thÃ¬ fallback qua Anon Key 
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Cá»‘ tÃ¬nh ghi Ä‘Ã¨ created_by null (VÃ¬ RLS sáº½ Ä‘Æ°á»£c Bypass bá»Ÿi Service Role)
        const { error } = await supabase
            .from('marketing_bot_commands')
            .insert({
                script_name: scriptName,
                args: args || '',
                status: 'pending',
                created_by: userId || null,
                profile_id: profileId || null
            });

        if (error) {
            console.error("Lá»—i insert lá»‡nh bot vÃ o Supabase:", error);
            // In error.message ra console log server Ä‘á»ƒ dá»… debug
            console.error(error.message);
            return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Lá»‡nh [${scriptName}] Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn vÃ o hÃ ng Ä‘á»£i thÃ nh cÃ´ng!` });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

