export const dynamic = 'force-dynamic';
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

        // Log incoming data for debugging
        console.log("=== ZALO SYNC API ===");
        console.log("Received body:", JSON.stringify(body, null, 2));

        if (!body.currentAccount || !body.messages) {
            console.log("ERROR: Missing currentAccount or messages");
            return NextResponse.json({ error: "Missing data" }, { status: 400, headers: corsHeaders });
        }

        const currentZaloUser = body.currentAccount;
        console.log("Current Zalo User:", currentZaloUser);
        console.log("Messages count:", body.messages?.length);

        // 1. Find or Create Account
        let { data: account, error: accError } = await supabaseAdmin
            .from("zalo_sync_accounts")
            .select("id")
            .eq("zalo_id", currentZaloUser.id)
            .single();

        console.log("Account lookup result:", account, "Error:", accError);

        if (!account) {
            console.log("Creating new account...");
            const { data: newAccount, error: createError } = await supabaseAdmin
                .from("zalo_sync_accounts")
                .insert({
                    zalo_id: currentZaloUser.id,
                    name: currentZaloUser.name,
                    avatar_url: currentZaloUser.avatar || "",
                    is_active: true
                })
                .select("id")
                .single();

            console.log("New account created:", newAccount, "Error:", createError);
            if (createError) throw createError;
            account = newAccount;
        }

        // 2. Prepare Messages - with safe defaults for required fields
        const messagesToInsert = body.messages.map((msg: any, index: number) => {
            const prepared = {
                account_id: account.id,
                msg_id: msg.msgId || `auto_${Date.now()}_${index}`,
                sender_id: msg.senderId || "unknown_sender",
                sender_name: msg.senderName || "Unknown",
                sender_avatar: msg.senderAvatar || "",
                receiver_id: msg.receiverId || "unknown_receiver",
                receiver_name: msg.receiverName || "Unknown",
                content: msg.content || "",
                attachments: msg.attachments || [],
                msg_type: msg.msgType || 'text',
                timestamp: msg.timestamp || new Date().toISOString(),
                direction: msg.isMe ? 'outgoing' : 'incoming',
            };
            console.log(`Message ${index}:`, prepared);
            return prepared;
        });

        console.log("Total messages to insert:", messagesToInsert.length);

        // 3. Insert Messages (not upsert to ensure they get added)
        if (messagesToInsert.length > 0) {
            const { data: insertedData, error: msgError } = await supabaseAdmin
                .from("zalo_messages")
                .insert(messagesToInsert)
                .select();

            console.log("Insert result:", insertedData?.length, "rows inserted");
            console.log("Insert error:", msgError);

            if (msgError) {
                console.error("MESSAGE INSERT ERROR:", msgError);
                return NextResponse.json({
                    error: msgError.message,
                    details: msgError
                }, { status: 500, headers: corsHeaders });
            }

            // 4. Update Account Timestamp AND Info (Name/Avatar) if changed
            // This fixes the issue where an account created as "Unknown" stays "Unknown" forever
            await supabaseAdmin
                .from("zalo_sync_accounts")
                .update({
                    last_synced_at: new Date().toISOString(),
                    name: currentZaloUser.name !== "Unknown" ? currentZaloUser.name : undefined, // Only update if we have a real name
                    avatar_url: currentZaloUser.avatar || undefined
                })
                .eq("id", account.id);
        }

        console.log("=== SYNC COMPLETE ===");
        return NextResponse.json({
            success: true,
            count: messagesToInsert.length,
            accountId: account.id
        }, { headers: corsHeaders });

    } catch (err: any) {
        console.error("Zalo Sync API CATCH Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}

