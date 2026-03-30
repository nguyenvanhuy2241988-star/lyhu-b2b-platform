// Google Drive Service — uses OAuth2 refresh token to upload/delete files
// Uses the Google Drive REST API directly (no googleapis package needed)

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
    if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
        return cachedAccessToken;
    }

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
        throw new Error(`Failed to refresh access token: ${err}`);
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return data.access_token;
}

/**
 * Get or create a subfolder inside the root LYHU Media folder
 */
export async function getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
    const token = await getAccessToken();
    const parent = parentId || GOOGLE_DRIVE_FOLDER_ID;

    // Search for existing folder
    const query = `name='${folderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
    }

    // Create folder
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parent],
        }),
    });

    const createData = await createRes.json();
    return createData.id;
}

/**
 * Upload a file to Google Drive
 * Returns { fileId, webViewLink, webContentLink }
 */
export async function uploadFileToDrive(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    subfolder?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const token = await getAccessToken();

    let parentId = GOOGLE_DRIVE_FOLDER_ID;
    if (subfolder) {
        parentId = await getOrCreateFolder(subfolder);
    }

    // Use multipart upload for files
    const metadata = JSON.stringify({
        name: fileName,
        parents: [parentId],
    });

    const boundary = "lyhu_media_boundary_" + Date.now();
    const multipartBody = Buffer.concat([
        Buffer.from(
            `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
        ),
        buffer,
        Buffer.from(`\r\n--${boundary}--`),
    ]);

    const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
        }
    );

    if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Drive upload failed: ${err}`);
    }

    const data = await uploadRes.json();

    // Make file accessible via link (anyone with link can view)
    await fetch(
        `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                role: "reader",
                type: "anyone",
            }),
        }
    );

    return {
        fileId: data.id,
        webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
        webContentLink: data.webContentLink || `https://drive.google.com/uc?id=${data.id}&export=download`,
    };
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
    const token = await getAccessToken();

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 404) {
        const err = await res.text();
        throw new Error(`Drive delete failed: ${err}`);
    }
}

/**
 * Get a thumbnail/preview URL for a Drive file
 */
export function getDriveThumbnailUrl(fileId: string, size = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

export function getDriveDirectUrl(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=view`;
}
