import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFileToDrive, getDriveThumbnailUrl, getDriveDirectUrl } from "@/lib/googleDriveService";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const userId = formData.get("userId") as string;
        const userName = formData.get("userName") as string;
        const category = (formData.get("category") as string) || "other";

        if (!file || !userId) {
            return NextResponse.json({ error: "No file or userId" }, { status: 400 });
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine subfolder name (by user)
        const folderName = userName || userId.slice(0, 8);

        // Upload to Google Drive
        const { fileId, webViewLink, webContentLink } = await uploadFileToDrive(
            buffer,
            file.name,
            file.type,
            folderName
        );

        const isVideo = file.type.startsWith("video/");
        const thumbnailUrl = isVideo ? null : getDriveThumbnailUrl(fileId, 400);
        const directUrl = getDriveDirectUrl(fileId);

        // Save metadata to Supabase
        const { data, error } = await supabaseAdmin
            .from("media_assets")
            .insert({
                file_name: file.name,
                file_url: directUrl,
                file_type: isVideo ? "video" : "image",
                file_size: file.size,
                category,
                uploaded_by: userId,
                drive_file_id: fileId,
                drive_view_link: webViewLink,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ asset: data });
    } catch (err: any) {
        console.error("Media upload error:", err);
        return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
}

// Max file size: 500MB
export const config = {
    api: {
        bodyParser: false,
    },
};
