export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

// Google Drive folder management API
// Supports: list, create, delete, rename, move folders/files
// Auto-detects root folder to avoid permission issues

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

// GET: List items + quota info
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = await getAccessToken();
        const rootId = await getRootFolder(token);
        const parentId = searchParams.get("parentId") || rootId;
        const includeQuota = searchParams.get("quota") === "1";

        // List all items in folder
        const query = `'${parentId}' in parents and trashed=false`;
        const fields = "files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink)";
        const orderBy = "folder,name";

        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${fields}&orderBy=${orderBy}&pageSize=500`,
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

        let quota = null;
        if (includeQuota) {
            const quotaRes = await fetch(
                "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (quotaRes.ok) {
                const quotaData = await quotaRes.json();
                quota = {
                    limit: parseInt(quotaData.storageQuota?.limit || "0"),
                    usage: parseInt(quotaData.storageQuota?.usage || "0"),
                    usageInDrive: parseInt(quotaData.storageQuota?.usageInDrive || "0"),
                    usageInDriveTrash: parseInt(quotaData.storageQuota?.usageInDriveTrash || "0"),
                };
            }
        }

        return NextResponse.json({ items, parentId, rootId, quota });
    } catch (err: any) {
        console.error("Folder list error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Create a new folder
export async function POST(req: NextRequest) {
    try {
        const { name, parentId } = await req.json();
        if (!name) return NextResponse.json({ error: "Folder name is required" }, { status: 400 });

        const token = await getAccessToken();
        const rootId = await getRootFolder(token);
        const targetParent = parentId || rootId;

        const res = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [targetParent] }),
        });

        if (!res.ok) throw new Error(`Create folder failed: ${await res.text()}`);
        const folderData = await res.json();
        return NextResponse.json({ id: folderData.id, name: folderData.name, isFolder: true });
    } catch (err: any) {
        console.error("Create folder error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH: Rename or Move a file/folder
export async function PATCH(req: NextRequest) {
    try {
        const { fileId, newName, newParentId, oldParentId } = await req.json();
        if (!fileId) return NextResponse.json({ error: "File ID is required" }, { status: 400 });

        const token = await getAccessToken();

        // Build update body and query params
        const body: any = {};
        let queryParams = "";

        if (newName) {
            body.name = newName;
        }

        if (newParentId && oldParentId) {
            // Move operation
            queryParams = `?addParents=${newParentId}&removeParents=${oldParentId}`;
        }

        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}${queryParams}`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) throw new Error(`Update failed: ${await res.text()}`);
        const updated = await res.json();
        return NextResponse.json({ id: updated.id, name: updated.name });
    } catch (err: any) {
        console.error("Update error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: Trash a file/folder
export async function DELETE(req: NextRequest) {
    try {
        const { folderId } = await req.json();
        if (!folderId) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const token = await getAccessToken();

        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${folderId}`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ trashed: true }),
            }
        );

        if (!res.ok) throw new Error(`Delete failed: ${await res.text()}`);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

