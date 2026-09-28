/**
 * Voice Studio History Store using Native IndexedDB
 * Giúp lưu trữ lịch sử kịch bản và dữ liệu âm thanh (Blob) trực tiếp trên trình duyệt,
 * không bị giới hạn 5MB của localStorage và không mất khi refresh hoặc đổi kịch bản.
 */

export interface VoiceHistoryItem {
    id: string;
    text: string;
    title: string;
    styleId: string;
    styleName: string;
    styleAvatar: string;
    speedRate: number;
    wordCount: number;
    estimatedSeconds: number;
    createdAt: number; // timestamp
    audioBlob: Blob;
    audioUrl?: string; // transient Object URL
}

const DB_NAME = "lyhu_voice_studio_db";
const STORE_NAME = "voice_history";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !("indexedDB" in window)) {
            reject(new Error("IndexedDB không được hỗ trợ trên trình duyệt này"));
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
 * Lưu 1 bản thu âm vào IndexedDB (tối đa 50 bản thu gần nhất để giải phóng bộ nhớ)
 */
export async function saveVoiceHistory(
    item: Omit<VoiceHistoryItem, "audioUrl">
): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        // Chuẩn hóa lưu trữ blob
        await new Promise<void>((resolve, reject) => {
            const putReq = store.put({
                id: item.id,
                text: item.text,
                title: item.title,
                styleId: item.styleId,
                styleName: item.styleName,
                styleAvatar: item.styleAvatar,
                speedRate: item.speedRate,
                wordCount: item.wordCount,
                estimatedSeconds: item.estimatedSeconds,
                createdAt: item.createdAt,
                audioBlob: item.audioBlob
            });
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
        });

        // Dọn dẹp nếu danh sách vượt quá 50 mục
        const countReq = store.count();
        countReq.onsuccess = async () => {
            if (countReq.result > 50) {
                const allReq = store.index("createdAt").openCursor(null, "next");
                let toDelete = countReq.result - 50;
                allReq.onsuccess = (e) => {
                    const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                    if (cursor && toDelete > 0) {
                        cursor.delete();
                        toDelete--;
                        cursor.continue();
                    }
                };
            }
        };
    } catch (e) {
        console.warn("[VoiceHistory] Không thể lưu lịch sử vào IndexedDB:", e);
    }
}

/**
 * Lấy danh sách lịch sử sắp xếp từ mới nhất đến cũ nhất
 */
export async function getVoiceHistory(): Promise<VoiceHistoryItem[]> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("createdAt");

        return new Promise((resolve) => {
            const request = index.openCursor(null, "prev"); // newest first
            const results: VoiceHistoryItem[] = [];

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    const val = cursor.value;
                    let audioUrl: string | undefined = undefined;
                    let audioBlob = val.audioBlob;

                    if (audioBlob instanceof Blob) {
                        try {
                            audioUrl = URL.createObjectURL(audioBlob);
                        } catch (e) {
                            console.warn("[VoiceHistory] createObjectURL failed:", e);
                        }
                    } else if (audioBlob) {
                        try {
                            const reconstructed = new Blob([audioBlob], { type: "audio/mpeg" });
                            audioUrl = URL.createObjectURL(reconstructed);
                            audioBlob = reconstructed;
                        } catch (e) {
                            console.warn("[VoiceHistory] Blob reconstruction failed:", e);
                        }
                    }

                    results.push({
                        ...val,
                        audioBlob,
                        audioUrl
                    });
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => {
                console.warn("[VoiceHistory] Lỗi khi đọc danh sách:", request.error);
                resolve([]);
            };
        });
    } catch (e) {
        console.warn("[VoiceHistory] Không thể mở IndexedDB:", e);
        return [];
    }
}

/**
 * Xóa 1 bản ghi lịch sử
 */
export async function deleteVoiceHistoryItem(id: string): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        await new Promise<void>((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn("[VoiceHistory] Lỗi xóa bản ghi:", e);
    }
}

/**
 * Xóa toàn bộ lịch sử
 */
export async function clearVoiceHistory(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        await new Promise<void>((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn("[VoiceHistory] Lỗi xóa toàn bộ lịch sử:", e);
    }
}
