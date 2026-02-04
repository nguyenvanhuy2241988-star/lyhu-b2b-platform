import { supabase } from "@/lib/supabaseClient";

interface MisaConfig {
    clientId: string;
    clientSecret: string;
    companyCode: string;
    accessToken?: string;
    tokenExpiry?: string;
}

// Temporary in-memory cache for token (should be DB in production)
let tokenCache: { token: string; expiresAt: number } | null = null;

// Helper function to fetch app settings from Supabase
async function fetchAppSettings() {
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
    getAccessToken: async (): Promise<string | null> => {
        try {
            // 1. Get Settings from DB
            const settings = await fetchAppSettings();
            // @ts-ignore
            const config = settings?.misa_config;

            if (!config || !config.accessCode || !config.companyCode) {
                console.error("[MisaService] Missing Misa Config (AccessCode or CompanyCode)");
                return null;
            }

            // 2. Call Misa Auth API (Connect Endpoint)
            // Note: For Connection Code, we often use actapp.misa.vn or the helper service. 
            // Standard Open API Connect: POST /api/oauth/actopen/connect
            const connectUrl = "https://actapp.misa.vn/api/oauth/actopen/connect";

            console.log("[MisaService] Connecting to Misa...", connectUrl);
            const res = await fetch(connectUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    app_id: config.appId || "LYHU_APP", // Fallback if missing
                    access_code: config.accessCode, // The 'Connection Code'
                    org_company_code: config.companyCode
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("[MisaService] Auth Failed:", res.status, errText);
                return null;
            }

            const data = await res.json();
            if (data?.Success && data?.Data) {
                console.log("[MisaService] Auth Success! Token obtained.");
                return data.Data; // The Access Token
            } else {
                console.error("[MisaService] Auth Failed (Logic):", data);
                return null;
            }
        } catch (err) {
            console.error("[MisaService] Auth Exception:", err);
            return null;
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
            invSeries: "1C21Tky", // Example Series
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
    pushSalesOrder: async (orderId: string, orderData: any): Promise<{ success: boolean; refId?: string; error?: string }> => {
        try {
            console.log(`[MisaService] Pushing order ${orderId} to Misa (REAL)...`);

            // 1. Get Token
            const token = await MisaService.getAccessToken();
            if (!token) {
                return { success: false, error: "Không thể kết nối Misa (Lỗi xác thực)" };
            }

            // 2. Prepare Payload
            const payload = MisaService.mapOrderToMisaInvoice(orderData);

            // 3. Send to Misa API
            const settings = await fetchAppSettings();
            // @ts-ignore
            const apiUrl = settings?.misa_config?.apiUrl || "https://openservice.misa.com.vn";
            const endpoint = `${apiUrl}/api/v1/fa/sa_invoice`; // Sales Invoice Endpoint

            console.log(`[MisaService] POST ${endpoint}`);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token
                },
                body: JSON.stringify(payload)
            });

            const resData = await res.json();

            if (res.ok && resData?.Success) {
                const refId = resData.Data; // Usually the RefID or GUID
                console.log(`[MisaService] Push Success! Misa Ref: ${refId}`);
                return { success: true, refId: refId || "MISA_SYNCed" };
            } else {
                console.error("[MisaService] Push Failed:", resData);
                // Extract error message
                const errorMsg = resData?.UserMessage || resData?.DevMessage || JSON.stringify(resData);
                return { success: false, error: errorMsg };
            }

        } catch (err: any) {
            console.error("[MisaService] Exception:", err);
            return { success: false, error: err.message };
        }
    }
};
