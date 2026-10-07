/**
 * Video Studio Project & Scriptbook Store (IndexedDB + LocalStorage)
 * Lưu trữ lịch sử toàn bộ các dự án video, kịch bản, và bảng phân cảnh đạo diễn
 * Hỗ trợ lưu trữ Blob media (Video/Ảnh/Giọng đọc) trực tiếp vào IndexedDB
 */

export interface DirectorShot {
    shotNumber: number;
    shotType: string; // "Cận cảnh Macro", "Toàn cảnh kho", "POV Cầm tay", "Trung cảnh"
    cameraMovement: string; // "Pan ngang", "Zoom in dứt khoát", "Lia máy theo tay"
    action: string;
    duration: number; // in seconds (e.g. 2.5)
    dialogueSnippet: string;
    sfx: string; // e.g. "Giòn rụm", "Xe nâng", "Xé bao"
}

export interface DirectorGuide {
    hookVisual: string;
    spokenHook: string;
    pacingSpeed: string;
    keyPowerWords: string[];
    callToAction: string;
    shootingTips: string[];
    shots: DirectorShot[];
}

export interface SerializedClipItem {
    id: string;
    url: string;
    name: string;
    duration: number;
    width?: number;
    height?: number;
    muted?: boolean;
    mediaType?: "video" | "image";
    trimStart?: number;
    trimEnd?: number;
    displayDuration?: number;
    role?: string;
    matchedSentence?: string;
    isAiSelected?: boolean;
    blob?: Blob;
}

export interface VideoProjectItem {
    id: string;
    title: string;
    topic: string;
    hookTitle: string;
    script: string;
    directorGuide: DirectorGuide;
    aspectRatio: "9:16" | "16:9" | "1:1";
    fontFamily: string;
    fontSize: number;
    textColor: string;
    subtitleStyle: string;
    textAnimationEffect: string;
    clipSwitchInterval: number;
    transitionEffect: string;
    bgmChoice: string;
    voiceId?: string | null;
    createdAt: number;
    renderedVideoUrl?: string;
    renderedFormat?: string;
    clips?: SerializedClipItem[];
    voiceBlob?: Blob;
    voiceStyleId?: string;
}

export interface StudioDraft {
    id: "current_draft";
    topic: string;
    hookTitle: string;
    script: string;
    clips: SerializedClipItem[];
    voiceBlob?: Blob;
    voiceStyleId?: string;
    aspectRatio: "9:16" | "16:9" | "1:1";
    fontFamily: string;
    fontSize: number;
    textColor: string;
    subtitleStyle: string;
    textAnimationEffect: string;
    clipSwitchInterval: number;
    transitionEffect: string;
    bgmChoice: string;
    updatedAt: number;
}

const DB_NAME = "lyhu_video_studio_db";
const STORE_NAME = "video_projects";
const DRAFT_STORE_NAME = "studio_drafts";
const DB_VERSION = 2;
const LOCALSTORAGE_KEY = "lyhu_video_projects_backup";

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !("indexedDB" in window)) {
            reject(new Error("IndexedDB không được hỗ trợ"));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("createdAt", "createdAt", { unique: false });
            }
            if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
                db.createObjectStore(DRAFT_STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Tạo bản sao an toàn cho LocalStorage (loại bỏ Blob lớn)
 */
function sanitizeForLocalStorage(item: VideoProjectItem): VideoProjectItem {
    const { voiceBlob, clips, ...rest } = item;
    const sanitizedClips = clips?.map(c => {
        const { blob, ...clipRest } = c;
        return clipRest;
    });
    return {
        ...rest,
        clips: sanitizedClips
    };
}

/**
 * Lưu dự án video vào IndexedDB (kèm Blobs) + LocalStorage backup (text only)
 */
export async function saveVideoProject(item: VideoProjectItem): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        await new Promise<void>((resolve, reject) => {
            const req = store.put(item);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn("IndexedDB save failed, falling back to localStorage:", e);
    }

    // Always keep recent 15 in localStorage as immediate fallback (stripped of blobs)
    try {
        const sanitizedItem = sanitizeForLocalStorage(item);
        const existingRaw = localStorage.getItem(LOCALSTORAGE_KEY);
        const existingList: VideoProjectItem[] = existingRaw ? JSON.parse(existingRaw) : [];
        const filtered = existingList.filter(p => p.id !== item.id);
        const updated = [sanitizedItem, ...filtered].slice(0, 15);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
}

/**
 * Lấy danh sách toàn bộ dự án video đã tạo từ IndexedDB
 */
export async function getVideoProjects(): Promise<VideoProjectItem[]> {
    if (typeof window === "undefined") return [];

    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("createdAt");

        return new Promise((resolve) => {
            const req = index.getAll();
            req.onsuccess = () => {
                const results: VideoProjectItem[] = req.result || [];
                // Sort descending (newest first)
                results.sort((a, b) => b.createdAt - a.createdAt);
                resolve(results);
            };
            req.onerror = () => {
                resolve(getProjectsFromLocalStorage());
            };
        });
    } catch (e) {
        return getProjectsFromLocalStorage();
    }
}

function getProjectsFromLocalStorage(): VideoProjectItem[] {
    try {
        const raw = localStorage.getItem(LOCALSTORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

/**
 * Xóa một dự án khỏi lịch sử
 */
export async function deleteVideoProject(id: string): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
    } catch (e) {}

    try {
        const existing = getProjectsFromLocalStorage();
        const updated = existing.filter(p => p.id !== id);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
}

/**
 * Lưu bản nháp đang chỉnh sửa hiện tại (Auto-save draft)
 */
export async function saveActiveStudioDraft(draft: StudioDraft): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const db = await openDB();
        const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
        const store = tx.objectStore(DRAFT_STORE_NAME);
        await new Promise<void>((resolve, reject) => {
            const req = store.put(draft);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn("[Draft] Failed to save active studio draft:", e);
    }
}

/**
 * Lấy bản nháp đang chỉnh sửa gần nhất
 */
export async function getActiveStudioDraft(): Promise<StudioDraft | null> {
    if (typeof window === "undefined") return null;

    try {
        const db = await openDB();
        const tx = db.transaction(DRAFT_STORE_NAME, "readonly");
        const store = tx.objectStore(DRAFT_STORE_NAME);
        return new Promise((resolve) => {
            const req = store.get("current_draft");
            req.onsuccess = () => {
                resolve(req.result || null);
            };
            req.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

/**
 * Xóa bản nháp hiện tại khi người dùng muốn bắt đầu mới
 */
export async function clearActiveStudioDraft(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const db = await openDB();
        const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
        const store = tx.objectStore(DRAFT_STORE_NAME);
        store.delete("current_draft");
    } catch (e) {}
}
