export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const token = await MisaService.getAccessToken(supabaseAdmin);
        return NextResponse.json({ success: true, message: "Káº¿t ná»‘i MISA thÃ nh cÃ´ng!", tokenPreview: token.substring(0, 10) + "..." });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

