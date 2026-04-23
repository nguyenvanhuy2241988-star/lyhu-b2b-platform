import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteFileFromDrive } from "@/lib/googleDriveService";

// Delay initialization to avoid Next.js build crash when env var is missing
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
};

export async function DELETE(req: NextRequest) {
    try {
        const { assetId } = await req.json();

        if (!assetId) {
            return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: asset, error: fetchErr } = await supabaseAdmin
            .from("media_assets")
            .select("id, drive_file_id")
            .eq("id", assetId)
            .single();

        if (fetchErr || !asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        // Delete from Google Drive
        if (asset.drive_file_id) {
            try {
                await deleteFileFromDrive(asset.drive_file_id);
            } catch (driveErr) {
                console.error("Drive delete error (continuing):", driveErr);
            }
        }

        // Delete from Supabase
        const { error: delErr } = await supabaseAdmin
            .from("media_assets")
            .delete()
            .eq("id", assetId);

        if (delErr) {
            return NextResponse.json({ error: delErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Media delete error:", err);
        return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
    }
}
