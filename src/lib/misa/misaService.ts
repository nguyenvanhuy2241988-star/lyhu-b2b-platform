// MisaService.ts - Server Side Service

interface MisaConfig {
    clientId: string;
    clientSecret: string;
    companyCode: string;
    accessToken?: string;
    tokenExpiry?: string;
}

// Temporary in-memory cache for token (should be DB in production)
let tokenCache: { token: string; expiresAt: number } | null = null;

// Helper function to fetch app settings using the passed supabase client
async function fetchAppSettings(supabase: any) {
    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single(); // Assuming there's only one row for app settings

    if (error) {
        console.error("Error fetching app settings:", error);
        return null;
    }
    return data;
}

export const MisaService = {
    // 1. Authentication
    getAccessToken: async (supabase: any): Promise<string> => {
        // 1. Get Settings from DB
        const settings = await fetchAppSettings(supabase);
        // @ts-ignore
        const config = settings?.misa_config;

        if (!config || !config.accessCode || !config.companyCode) {
            throw new Error("Chưa cấu hình Misa (Thiếu AccessCode hoặc Mã Chi nhánh)");
        }

        // 2. Determine Auth URL
        // If the user manually set the API URL to an 'actapp' domain, they likely want to use it for Auth.
        // Otherwise, default to the standard production auth URL.
        const userUrl = config.apiUrl || "";
        let baseUrl = "https://actapp.misa.vn";

        if (userUrl.includes("actapp") || userUrl.includes("misa.vn")) {
            // If user explicitly points to a misa domain, let's respect the base
            // But valid connect endpoint is always /api/oauth/actopen/connect
            // We'll strip the path and append the correct one to be safe, or just use the user's string if it looks like a base.
            try {
                const urlObj = new URL(userUrl);
                baseUrl = urlObj.origin;
            } catch (e) {
                // Invalid URL string, keep default
            }
        }

        const connectUrl = `${baseUrl}/api/oauth/actopen/connect`;

        // Use a variable to track which URL failed
        let attemptUrl = connectUrl;

        try {
            console.log("[MisaService] Connecting to Misa...", connectUrl);
            const res = await fetch(connectUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "LYHU-B2B-Platform/1.0"
                },
                body: JSON.stringify({
                    app_id: config.appId || "84318d18-5a63-4422-b94f-40e87d60567e",
                    access_code: config.accessCode,
                    org_company_code: config.companyCode
                })
            });

            const data = await res.json();

            if (!res.ok || !data?.Success) {
                console.error("[MisaService] Auth Failed:", data);
                const msg = data?.UserMessage || data?.DevMessage || data?.Data || JSON.stringify(data);
                throw new Error(`Misa Auth Refused: ${msg}`);
            }

            if (data?.Success && data?.Data) {
                console.log("[MisaService] Auth Success! Token obtained.");
                return data.Data; // The Access Token
            }

            throw new Error("Misa Auth: Không lấy được Token");

        } catch (err: any) {
            console.error(`[MisaService] Auth Network Error (${attemptUrl}):`, err);
            // Throw a clearer error for the UI
            throw new Error(`Lỗi kết nối Misa (Auth): ${err.message || "Network Error"}`);
        }
    },

    // 2. Map Order to Misa Invoice
    mapOrderToMisaInvoice: (order: any) => {
        // Ensure null safety
        const items = order.items || [];
        return {
            refId: order.id,
            refNo: `ORD-${order.readableId || order.id.substring(0, 6)}`,
            refDate: new Date(order.created_at || new Date()).toISOString(),
            postedDate: new Date().toISOString(),
            accountObjectCode: order.customer?.misa_code || "KH_LE",
            journalMemo: `Bán hàng cho đơn hàng #${order.readableId}`,
            totalAmount: order.totalAmount,
            // Mapping fields specific to Misa Invoice
            invSeries: "1C21Tky", // Example Series - Should ideally be configurable?
            invDate: new Date().toISOString(),
            currencyID: "VND",
            exchangeRate: 1,
            details: items.map((item: any) => ({
                inventoryItemCode: item.product?.misa_code || item.sku || "SP_KHAC",
                description: item.name,
                quantity: item.quantity,
                unitPrice: item.price || item.unitPrice || 0,
                amount: (item.price || item.unitPrice || 0) * item.quantity,
                vatRate: order.vat || 0,
                stockCode: "KHO_TONG" // Default Warehouse
            }))
        };
    },

    // 3. Push to Misa
    pushSalesOrder: async (orderId: string, orderData: any, supabase: any): Promise<{ success: boolean; refId?: string; error?: string }> => {
        let endpoint = "";
        try {
            console.log(`[MisaService] Pushing order ${orderId} to Misa (REAL)...`);

            // 1. Get Token (Pass supabase client)
            const token = await MisaService.getAccessToken(supabase);

            // 2. Prepare Payload
            const payload = MisaService.mapOrderToMisaInvoice(orderData);

            // 3. Send to Misa API
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const apiUrl = settings?.misa_config?.apiUrl || "https://openservice.misa.com.vn";
            endpoint = `${apiUrl}/api/v1/fa/sa_invoice`;

            console.log(`[MisaService] POST ${endpoint}`);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "User-Agent": "LYHU-B2B-Platform/1.0"
                },
                body: JSON.stringify(payload)
            });

            // Handle non-JSON responses (like 502/404 HTML)
            const textRaw = await res.text();
            let resData;
            try {
                resData = JSON.parse(textRaw);
            } catch (e) {
                throw new Error(`Misa API returned non-JSON: ${textRaw.substring(0, 100)}...`);
            }

            if (res.ok && resData?.Success) {
                const refId = resData.Data;
                console.log(`[MisaService] Push Success! Misa Ref: ${refId}`);
                return { success: true, refId: refId || "MISA_SYNCed" };
            } else {
                console.error("[MisaService] Push Failed:", resData);
                const errorMsg = resData?.UserMessage || resData?.DevMessage || JSON.stringify(resData);
                return { success: false, error: `Misa Reject: ${errorMsg}` };
            }

        } catch (err: any) {
            console.error("[MisaService] Exception:", err);
            return { success: false, error: `Lỗi kết nối Misa (Push): ${err.message}` };
        }
    }
};
