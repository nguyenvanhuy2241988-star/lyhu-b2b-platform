import { NextRequest, NextResponse } from "next/server";

// Returns a short-lived access token + resumable upload URL for direct client upload
// This avoids the Vercel 4.5MB body size limit

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

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

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Token refresh failed: ${err}`);
    }

    const data = await res.json();
    return data.access_token;
}

async function getOrCreateFolder(token: string, folderName: string, parentId: string): Promise<string> {
    const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files?.length > 0) {
        return searchData.files[0].id;
    }

    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentId],
        }),
    });

    const createData = await createRes.json();
    return createData.id;
}

export async function POST(req: NextRequest) {
    try {
        const { fileName, mimeType, fileSize, userName } = await req.json();

        if (!fileName || !mimeType) {
            return NextResponse.json({ error: "Missing fileName or mimeType" }, { status: 400 });
        }

        const token = await getAccessToken();

        // Get or create subfolder for this user
        const folderId = userName
            ? await getOrCreateFolder(token, userName, GOOGLE_DRIVE_FOLDER_ID)
            : GOOGLE_DRIVE_FOLDER_ID;

        // Create resumable upload session on Google Drive
        const initRes = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Upload-Content-Type": mimeType,
                    "X-Upload-Content-Length": String(fileSize || 0),
                },
                body: JSON.stringify({
                    name: fileName,
                    parents: [folderId],
                }),
            }
        );

        if (!initRes.ok) {
            const err = await initRes.text();
            throw new Error(`Failed to create upload session: ${err}`);
        }

        // The resumable upload URL is in the Location header
        const uploadUrl = initRes.headers.get("Location");
        if (!uploadUrl) {
            throw new Error("No upload URL returned from Google Drive");
        }

        return NextResponse.json({
            uploadUrl,
            accessToken: token,
            folderId,
        });
    } catch (err: any) {
        console.error("Upload URL error:", err);
        return NextResponse.json({ error: err.message || "Failed to create upload URL" }, { status: 500 });
    }
}
