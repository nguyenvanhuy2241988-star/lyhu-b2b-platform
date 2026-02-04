import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin - EXACTLY like debug endpoint
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        // Query ALL messages with higher limit
        const { data: messages, error } = await supabaseAdmin
            .from("zalo_messages")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(1000);

        if (error) {
            console.error("Messages API Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return directly as array
        return NextResponse.json(messages || []);

    } catch (err: any) {
        console.error("Fetch Messages API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
