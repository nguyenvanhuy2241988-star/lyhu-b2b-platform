export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { campaignId, profileId } = await req.json();

        if (!campaignId || !profileId) {
            return NextResponse.json({ error: 'Thiáº¿u thÃ´ng tin Campaign hoáº·c Profile' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "key";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Láº¥y chi tiáº¿t chiáº¿n dá»‹ch
        const { data: campaign, error: fetchError } = await supabase
            .from('bot_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (fetchError || !campaign) {
            return NextResponse.json({ error: 'KhÃ´ng tÃ¬m tháº¥y chiáº¿n dá»‹ch' }, { status: 404 });
        }

        const tasks = campaign.tasks; // Máº£ng JSONB [{'script_name': '...', 'args': '...'}]
        
        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ error: 'Chiáº¿n dá»‹ch trá»‘ng, khÃ´ng cÃ³ lá»‡nh nÃ o Ä‘á»ƒ cháº¡y' }, { status: 400 });
        }

        // Táº¡o danh sÃ¡ch lá»‡nh (rows) Ä‘á»ƒ phi tháº³ng vÃ o Queue
        const payload = tasks.map((task: any) => ({
            script_name: task.script_name,
            args: task.args || '',
            status: 'pending',
            created_by: null, 
            profile_id: profileId
        }));

        const { error: insertError } = await supabase
            .from('marketing_bot_commands')
            .insert(payload);

        if (insertError) {
            console.error("Lá»—i khi xáº£ Campaign vÃ o Queue:", insertError.message);
            return NextResponse.json({ error: 'Lá»—i Database khi náº¡p HÃ ng Ä‘á»£i' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `BÆ¡m thÃ nh cÃ´ng ${tasks.length} lá»‡nh tá»« chiáº¿n dá»‹ch vÃ o HÃ ng Äá»£i!` });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

