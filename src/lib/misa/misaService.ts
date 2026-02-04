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

        // 2. Call Misa Auth API (Connect Endpoint)
        const connectUrl = "https://actapp.misa.vn/api/oauth/actopen/connect";

        console.log("[MisaService] Connecting to Misa...", connectUrl);
        const res = await fetch(connectUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                app_id: config.appId || "84318d18-5a63-4422-b94f-40e87d60567e", // Use a generic/valid looking GUID if possible, or the user input
                access_code: config.accessCode,
                org_company_code: config.companyCode
            })
        });

        const data = await res.json();

        if (!res.ok || !data?.Success) {
            console.error("[MisaService] Auth Failed:", data);
            const msg = data?.UserMessage || data?.DevMessage || data?.Data || JSON.stringify(data);
            throw new Error(`Lỗi kết nối Misa: ${msg}`);
        }

        if (data?.Success && data?.Data) {
            console.log("[MisaService] Auth Success! Token obtained.");
            return data.Data; // The Access Token
        }

        throw new Error("Lỗi không xác định khi lấy Token Misa");
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
    pushSalesOrder: async (orderId: string, orderData: any, supabase: any): Promise<{ success: boolean; refId?: string; error?: string }> => {
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
            const endpoint = `${apiUrl}/api/v1/fa/sa_invoice`;

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
            return { success: false, error: err.message };
        }
    }
};
