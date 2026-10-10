/**
 * IndexNow Helper for LYHU
 * Giao thức gửi tín hiệu lập chỉ mục tức thì (1 giây) tới Bing, Yahoo, Yandex, Perplexity, Naver.
 * https://www.indexnow.org/
 */

export const INDEXNOW_KEY = "4cde0baa3b5dade0a53c432eb9b3f278";
export const SITE_HOST = "lyhu.com.vn";
export const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;

export async function submitToIndexNow(urls: string | string[]): Promise<{ success: boolean; status?: number; error?: string }> {
    const urlList = Array.isArray(urls) ? urls : [urls];
    if (urlList.length === 0) return { success: false, error: "Danh sách URL rỗng" };

    try {
        const payload = {
            host: SITE_HOST,
            key: INDEXNOW_KEY,
            keyLocation: KEY_LOCATION,
            urlList: urlList.slice(0, 10000) // Tối đa 10,000 URLs / request
        };

        const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        // IndexNow returns 200 (OK) or 202 (Accepted)
        if (res.status === 200 || res.status === 202) {
            console.log(`[IndexNow] Submitted ${urlList.length} URLs successfully! Status: ${res.status}`);
            return { success: true, status: res.status };
        } else {
            const errText = await res.text().catch(() => "");
            console.warn(`[IndexNow] Response ${res.status}: ${errText}`);
            return { success: false, status: res.status, error: errText };
        }
    } catch (err: any) {
        console.error("[IndexNow] Exception:", err.message);
        return { success: false, error: err.message };
    }
}
