import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { campaignId, profileId } = await req.json();

        if (!campaignId || !profileId) {
            return NextResponse.json({ error: 'Thiếu thông tin Campaign hoặc Profile' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "key";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Lấy chi tiết chiến dịch
        const { data: campaign, error: fetchError } = await supabase
            .from('bot_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (fetchError || !campaign) {
            return NextResponse.json({ error: 'Không tìm thấy chiến dịch' }, { status: 404 });
        }

        const tasks = campaign.tasks; // Mảng JSONB [{'script_name': '...', 'args': '...'}]
        
        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ error: 'Chiến dịch trống, không có lệnh nào để chạy' }, { status: 400 });
        }

        // Tạo danh sách lệnh (rows) để phi thẳng vào Queue
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
            console.error("Lỗi khi xả Campaign vào Queue:", insertError.message);
            return NextResponse.json({ error: 'Lỗi Database khi nạp Hàng đợi' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Bơm thành công ${tasks.length} lệnh từ chiến dịch vào Hàng Đợi!` });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
