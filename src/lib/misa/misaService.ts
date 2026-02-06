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
        // connection endpoint is ALWAYS actapp.misa.vn for MISA AMIS ACT
        // The config.apiUrl is purely for the Service Endpoint (openservice)
        const baseUrl = "https://actapp.misa.vn";
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

        // MISA AMIS Open API (actopen) usually expects snake_case for fields
        // Ref: sa_invoice
        return {
            voucher_type: "sa_invoice",
            voucher_data: {
                ref_type: 155, // 155: Bán hàng chưa thu tiền (Credit Sales)
                ref_no: `ORD-${order.readableId || order.id.substring(0, 6)}`,
                ref_date: new Date(order.created_at || new Date()).toISOString().split('T')[0],
                posted_date: new Date().toISOString().split('T')[0],

                account_object_code: order.customer?.misa_code || "KH_LE",
                journal_memo: `Bán hàng cho đơn hàng #${order.readableId}`,
                total_amount: order.totalAmount,

                currency_id: "VND",
                exchange_rate: 1,

                // MISA usually expects 'sa_invoice_detail' for this voucher type
                sa_invoice_detail: items.map((item: any) => ({
                    inventory_item_code: item.product?.misa_code || item.sku || "SP_KHAC",
                    description: item.name,
                    quantity: item.quantity,
                    unit_price: item.price || item.unitPrice || 0,
                    amount: (item.price || item.unitPrice || 0) * item.quantity,
                    vat_rate: order.vat || 0,
                    debit_account: "131", // Phải thu
                    credit_account: "5111", // Doanh thu
                    stock_code: "KHO_TONG"
                }))
            }
        };
    },

    // 3. Push to Misa
    pushSalesOrder: async (orderId: string, orderData: any, supabase: any): Promise<{ success: boolean; refId?: string; error?: string }> => {
        let endpoint = "";
        try {
            console.log(`[MisaService] Pushing order ${orderId} to Misa (REAL)...`);

            // 1. Get Token (Pass supabase client)
            const token = await MisaService.getAccessToken(supabase);

            // 2. Map Data
            const invoiceObj = MisaService.mapOrderToMisaInvoice(orderData);

            // 3. Prepare Payload
            // The /api/sync/actopen/save usually expects a list of objects with app_id etc? 
            // Or just the voucher data? 
            // Let's try sending the mapped object directly in a list as "data"

            const payload = [invoiceObj];

            // 4. Send to Misa API
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const config = settings?.misa_config;
            const apiUrl = config?.apiUrl || "https://actapp.misa.vn";

            endpoint = `${apiUrl}/api/sync/actopen/save`;

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

            const textRaw = await res.text();

            if (!res.ok) {
                console.error(`[MisaService] Push Failed Status ${res.status}:`, textRaw);
                let errorDetails = textRaw;
                try {
                    const errJson = JSON.parse(textRaw);
                    // Extract user message if available
                    errorDetails = errJson?.UserMessage || errJson?.DevMessage || errJson?.Data || JSON.stringify(errJson);
                } catch (e) { }

                return { success: false, error: `Misa Error (${res.status}): ${errorDetails}` };
            }

            // Success Case
            let resData;
            try {
                resData = JSON.parse(textRaw);
            } catch (e) {
                return { success: true, refId: "Unknown_Ref (Non-JSON)" };
            }

            if (resData?.Success) {
                const resultData = resData.Data;
                const refId = Array.isArray(resultData) ? resultData[0]?.RefID : resultData;
                console.log(`[MisaService] Push Success! Misa Ref: ${refId}`);
                return { success: true, refId: refId || "MISA_SYNCed" };
            } else {
                const errorMsg = resData?.UserMessage || resData?.DevMessage || JSON.stringify(resData);
                return { success: false, error: `Misa Reject: ${errorMsg}` };
            }

        } catch (err: any) {
            console.error("[MisaService] Exception:", err);
            return { success: false, error: `Lỗi hệ thống: ${err.message}` };
        }
    }
};
