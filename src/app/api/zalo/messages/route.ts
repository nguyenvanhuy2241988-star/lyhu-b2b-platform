import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin (Bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');

        if (!accountId) {
            return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
        }

        // Fetch messages directly using Admin Client
        const { data: messages, error } = await supabaseAdmin
            .from("zalo_messages")
            .select("*")
            .eq("account_id", accountId)
            .order("timestamp", { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json(messages);

    } catch (err: any) {
        console.error("Fetch Messages API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
