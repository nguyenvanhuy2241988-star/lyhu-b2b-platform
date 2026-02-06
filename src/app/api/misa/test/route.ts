import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
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
