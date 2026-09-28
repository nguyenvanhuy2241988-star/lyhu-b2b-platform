export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";

const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        // Just try to get the access token. 
        // If this works, Auth is configured correctly.
        const token = await MisaService.getAccessToken(supabaseAdmin);

        return NextResponse.json({
            success: true,
            message: "Kết nối thành công! Token đã được lấy.",
            token_preview: token.substring(0, 10) + "..."
        });

    } catch (err: any) {
        console.error("Test Connection Error:", err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}
