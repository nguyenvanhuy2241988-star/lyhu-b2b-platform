export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Chunked upload: handles init, chunk forwarding, and completion
// Each chunk is < 4MB to stay under Vercel's body limit

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAccessToken(): Promise<string> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
    });
    if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
    return (await res.json()).access_token;
}

// Auto-detect or create root "LYHU Media" folder
async function getRootFolder(token: string): Promise<string> {
    if (GOOGLE_DRIVE_FOLDER_ID) {
        try {
            const checkRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${GOOGLE_DRIVE_FOLDER_ID}?fields=id,trashed`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (checkRes.ok) {
                const f = await checkRes.json();
                if (!f.trashed) return GOOGLE_DRIVE_FOLDER_ID;
            }
        } catch {}
    }

    const query = `name='LYHU Media' and 'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.files?.length > 0) return data.files[0].id;
    }

    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "LYHU Media", mimeType: "application/vnd.google-apps.folder" }),
    });
    if (!createRes.ok) throw new Error(`Failed to create root folder: ${await createRes.text()}`);
    return (await createRes.json()).id;
}

async function getOrCreateSubfolder(token: string, parentId: string, folderName: string): Promise<string> {
    const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();
    if (searchData.files?.length > 0) return searchData.files[0].id;

    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentId],
        }),
    });
    return (await createRes.json()).id;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const action = formData.get("action") as string;

        if (action === "init") {
            const fileName = formData.get("fileName") as string;
            const mimeType = formData.get("mimeType") as string;
            const fileSize = formData.get("fileSize") as string;
            const userName = formData.get("userName") as string;
            const targetFolderId = formData.get("targetFolderId") as string;

            const token = await getAccessToken();
            const rootId = await getRootFolder(token);

            // Use targetFolderId if provided, otherwise create/use user subfolder
            let folderId = rootId;
            if (targetFolderId) {
                folderId = targetFolderId;
            } else if (userName) {
                folderId = await getOrCreateSubfolder(token, rootId, userName);
            }

            const initRes = await fetch(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "X-Upload-Content-Type": mimeType,
                        "X-Upload-Content-Length": fileSize,
                    },
                    body: JSON.stringify({ name: fileName, parents: [folderId] }),
                }
            );

            if (!initRes.ok) throw new Error(`Init failed: ${await initRes.text()}`);

            const uploadUrl = initRes.headers.get("Location");
            return NextResponse.json({ uploadUrl, token });

        } else if (action === "chunk") {
            const uploadUrl = formData.get("uploadUrl") as string;
            const token = formData.get("token") as string;
            const chunk = formData.get("chunk") as File;
            const rangeStart = formData.get("rangeStart") as string;
            const rangeEnd = formData.get("rangeEnd") as string;
            const totalSize = formData.get("totalSize") as string;

            const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

            const putRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Length": String(chunkBuffer.length),
                    "Content-Range": `bytes ${rangeStart}-${rangeEnd}/${totalSize}`,
                },
                body: chunkBuffer,
            });

            if (putRes.status === 308) {
                return NextResponse.json({ status: "continue" });
            } else if (putRes.ok) {
                const driveData = await putRes.json();
                return NextResponse.json({ status: "complete", driveFileId: driveData.id });
            } else {
                throw new Error(`Chunk upload failed: ${putRes.status} ${await putRes.text()}`);
            }

        } else if (action === "complete") {
            const driveFileId = formData.get("driveFileId") as string;
            const fileName = formData.get("fileName") as string;
            const fileSize = formData.get("fileSize") as string;
            const fileType = formData.get("fileType") as string;
            const userId = formData.get("userId") as string;

            const token = await getAccessToken();

            // Make file publicly viewable
            await fetch(
                `https://www.googleapis.com/drive/v3/files/${driveFileId}/permissions`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ role: "reader", type: "anyone" }),
                }
            );

            const isVideo = fileType?.startsWith("video/");
            const { data, error } = await supabaseAdmin
                .from("media_assets")
                .insert({
                    file_name: fileName,
                    file_url: `https://drive.google.com/uc?id=${driveFileId}&export=view`,
                    file_type: isVideo ? "video" : "image",
                    file_size: parseInt(fileSize) || 0,
                    category: "other",
                    uploaded_by: userId,
                    drive_file_id: driveFileId,
                    drive_view_link: `https://drive.google.com/file/d/${driveFileId}/view`,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return NextResponse.json({ asset: data });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
}

