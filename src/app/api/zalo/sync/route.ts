import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin to bypass RLS for writing
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle Preflight Options
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.currentAccount || !body.messages) {
            return NextResponse.json({ error: "Missing data" }, { status: 400, headers: corsHeaders });
        }

        const currentZaloUser = body.currentAccount;

        // 1. Find or Create Account
        let { data: account, error: accError } = await supabaseAdmin
            .from("zalo_sync_accounts")
            .select("id")
            .eq("zalo_id", currentZaloUser.id)
            .single();

        if (!account) {
            const { data: newAccount, error: createError } = await supabaseAdmin
                .from("zalo_sync_accounts")
                .insert({
                    zalo_id: currentZaloUser.id,
                    name: currentZaloUser.name,
                    avatar_url: currentZaloUser.avatar,
                    is_active: true
                })
                .select("id")
                .single();

            if (createError) throw createError;
            account = newAccount;
        }

        // 2. Prepare Messages
        const messagesToInsert = body.messages.map((msg: any) => ({
            account_id: account.id,
            msg_id: msg.msgId,
            sender_id: msg.senderId,
            sender_name: msg.senderName,
            sender_avatar: msg.senderAvatar,
            receiver_id: msg.receiverId,
            receiver_name: msg.receiverName,
            content: msg.content,
            attachments: msg.attachments || [],
            msg_type: msg.msgType || 'text',
            timestamp: msg.timestamp || new Date().toISOString(),
            direction: msg.senderId === currentZaloUser.id ? 'outgoing' : 'incoming',
        }));

        // 3. Upsert Messages
        if (messagesToInsert.length > 0) {
            const { error: msgError } = await supabaseAdmin
                .from("zalo_messages")
                .upsert(messagesToInsert, { onConflict: 'msg_id', ignoreDuplicates: true });

            if (msgError) throw msgError;

            // 4. Update Account Timestamp
            await supabaseAdmin
                .from("zalo_sync_accounts")
                .update({ last_synced_at: new Date().toISOString() })
                .eq("id", account.id);
        }

        return NextResponse.json({ success: true, count: messagesToInsert.length }, { headers: corsHeaders });

    } catch (err: any) {
        console.error("Zalo Sync API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
