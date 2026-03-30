import { NextRequest, NextResponse } from "next/server";

// Google Drive folder management API
// Supports: list, create, delete folders - all synced with Google Drive

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
    if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
    return (await res.json()).access_token;
}

// GET: List folders and files inside a folder
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get("parentId") || GOOGLE_DRIVE_FOLDER_ID;

        const token = await getAccessToken();

        // List all items in folder (folders first, then files)
        const query = `'${parentId}' in parents and trashed=false`;
        const fields = "files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink)";
        const orderBy = "folder,name";

        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${fields}&orderBy=${orderBy}&pageSize=200`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error(`List failed: ${await res.text()}`);

        const data = await res.json();
        const items = (data.files || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            isFolder: f.mimeType === "application/vnd.google-apps.folder",
            mimeType: f.mimeType,
            size: parseInt(f.size) || 0,
            createdTime: f.createdTime,
            thumbnailLink: f.thumbnailLink,
            webViewLink: f.webViewLink,
        }));

        return NextResponse.json({ items, parentId });
    } catch (err: any) {
        console.error("Folder list error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Create a new folder
export async function POST(req: NextRequest) {
    try {
        const { name, parentId } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
        }

        const token = await getAccessToken();
        const targetParent = parentId || GOOGLE_DRIVE_FOLDER_ID;

        const res = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                mimeType: "application/vnd.google-apps.folder",
                parents: [targetParent],
            }),
        });

        if (!res.ok) throw new Error(`Create folder failed: ${await res.text()}`);

        const folderData = await res.json();
        return NextResponse.json({
            id: folderData.id,
            name: folderData.name,
            isFolder: true,
        });
    } catch (err: any) {
        console.error("Create folder error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: Delete a folder (moves to trash on Drive)
export async function DELETE(req: NextRequest) {
    try {
        const { folderId } = await req.json();

        if (!folderId) {
            return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
        }

        // Safety: don't allow deleting the root folder
        if (folderId === GOOGLE_DRIVE_FOLDER_ID) {
            return NextResponse.json({ error: "Cannot delete root folder" }, { status: 400 });
        }

        const token = await getAccessToken();

        // Move to trash instead of permanent delete for safety
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${folderId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ trashed: true }),
            }
        );

        if (!res.ok) throw new Error(`Delete folder failed: ${await res.text()}`);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete folder error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
