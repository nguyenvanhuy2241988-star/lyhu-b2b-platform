import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        // Query ALL messages
        const { data: messages, error: msgError } = await supabaseAdmin
            .from("zalo_messages")
            .select("*, zalo_sync_accounts(name)")
            .order("created_at", { ascending: false })
            .limit(50);

        // Query ALL accounts
        const { data: accounts, error: accError } = await supabaseAdmin
            .from("zalo_sync_accounts")
            .select("*");

        return NextResponse.json({
            status: "Debug Dump",
            accountCount: accounts?.length,
            messageCount: messages?.length,
            accounts: accounts,
            messages: messages,
            errors: { msgError, accError }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
