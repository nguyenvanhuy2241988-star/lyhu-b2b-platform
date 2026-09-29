/**
 * Video Studio Project & Scriptbook Store (IndexedDB + LocalStorage)
 * Lưu trữ lịch sử toàn bộ các dự án video, kịch bản, và bảng phân cảnh đạo diễn
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
}

const DB_NAME = "lyhu_video_studio_db";
const STORE_NAME = "video_projects";
const DB_VERSION = 1;
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
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Lưu dự án video vào IndexedDB + LocalStorage backup
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

    // Always keep recent 15 in localStorage as immediate fallback
    try {
        const existingRaw = localStorage.getItem(LOCALSTORAGE_KEY);
        const existingList: VideoProjectItem[] = existingRaw ? JSON.parse(existingRaw) : [];
        const filtered = existingList.filter(p => p.id !== item.id);
        const updated = [item, ...filtered].slice(0, 15);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
}

/**
 * Lấy danh sách toàn bộ dự án video đã tạo
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
