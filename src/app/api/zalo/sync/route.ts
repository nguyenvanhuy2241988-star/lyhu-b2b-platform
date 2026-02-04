import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin to bypass RLS for writing (since Extension is "System")
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { accountId, messages } = body;
        /**
         * Body format expected:
         * {
         *   "accountId": "uuid-of-staff-account-in-db", (Optional, ideally we detect by zalo_id)
         *   "zaloId": "staff-zalo-id", (Better for auto-detection)
         *   "staffName": "Name from Zalo",
         *   "messages": [ { content, senderId, receiverId, timestamp... } ]
         * }
         */

        if (!body.currentAccount || !body.messages) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const currentZaloUser = body.currentAccount; // { id: '...', name: '...', avatar: '...' }

        // 1. Find or Create the Zalo Account (Staff)
        let { data: account, error: accError } = await supabaseAdmin
            .from("zalo_sync_accounts")
            .select("id")
            .eq("zalo_id", currentZaloUser.id)
            .single();

        if (!account) {
            // Create new account
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

        // 2. Insert Messages (Upsert to avoid duplicates)
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

        if (messagesToInsert.length > 0) {
            const { error: msgError } = await supabaseAdmin
                .from("zalo_messages")
                .upsert(messagesToInsert, { onConflict: 'msg_id', ignoreDuplicates: true });

            if (msgError) throw msgError;
        }

        return NextResponse.json({ success: true, count: messagesToInsert.length });

    } catch (err: any) {
        console.error("Zalo Sync API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
