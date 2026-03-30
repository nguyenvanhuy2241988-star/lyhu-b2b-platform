import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Save metadata after direct upload to Google Drive completes
export async function POST(req: NextRequest) {
    try {
        const { fileName, fileSize, fileType, category, userId, driveFileId } = await req.json();

        if (!fileName || !userId || !driveFileId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Set file as publicly viewable
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_DRIVE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || "",
                refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "",
                grant_type: "refresh_token",
            }),
        });
        const tokenData = await tokenRes.json();
        const token = tokenData.access_token;

        // Make file public (anyone with link can view)
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${driveFileId}/permissions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role: "reader", type: "anyone" }),
            }
        );

        const isVideo = fileType?.startsWith("video/");
        const directUrl = `https://drive.google.com/uc?id=${driveFileId}&export=view`;
        const viewLink = `https://drive.google.com/file/d/${driveFileId}/view`;

        const { data, error } = await supabaseAdmin
            .from("media_assets")
            .insert({
                file_name: fileName,
                file_url: directUrl,
                file_type: isVideo ? "video" : "image",
                file_size: fileSize || 0,
                category: category || "other",
                uploaded_by: userId,
                drive_file_id: driveFileId,
                drive_view_link: viewLink,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ asset: data });
    } catch (err: any) {
        console.error("Media save error:", err);
        return NextResponse.json({ error: err.message || "Save failed" }, { status: 500 });
    }
}
