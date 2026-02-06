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
        const items = order.items || [];
        const today = new Date().toISOString().split('T')[0];
        const orderDate = new Date(order.created_at || new Date()).toISOString().split('T')[0];

        // MISA Service "Save" API (5.1.4 Hóa đơn bán hàng)
        // Ref: https://actdocs.misa.vn
        return {
            voucher_type: 11, // Hóa đơn bán hàng
            // reftype: 3560 is default for domestic sales, but can be explicit if needed in wrapper?
            // Actually, reftype is usually inferred or inside. The doc says 'reftype' column exists in sa_invoice.
            // Let's include it.

            org_refid: order.id,
            org_refno: `ORD-${order.readableId || order.id.substring(0, 6)}`,
            org_reftype_name: "Đơn đặt hàng website", // Optional description

            refdate: orderDate,
            posted_date: today,
            inv_date: today,

            // Required: 3560: Hóa đơn bán hàng hóa, dịch vụ trong nước
            reftype: 3560,

            // Customer Info (snake_case)
            account_object_code: order.customer?.misa_code || "KH_LE",
            account_object_name: order.customer?.name || order.customer_name || "Khách lẻ",

            // Financial Info
            journal_memo: `Bán hàng đơn #${order.readableId}`,
            currency_id: "VND",
            exchange_rate: 1,

            // Invoice Details (snake_case)
            inv_series: "K0/001", // Example, might need config
            inv_no: `INV-${order.readableId}`, // Proposing a number

            // Item Details
            detail: items.map((item: any, index: number) => {
                const price = item.price || item.unitPrice || 0;
                const qty = item.quantity || 1;
                const amount = price * qty;

                return {
                    sort_order: index + 1,
                    inventory_item_code: item.product?.misa_code || item.sku || "SP_KHAC",
                    inventory_item_name: item.name,
                    description: item.name,

                    quantity: qty,
                    unit_price: price,
                    amount: amount,
                    amount_oc: amount, // Nguyên tệ

                    // Accounts (Standard Defaults)
                    debit_account: "131",
                    credit_account: "5111",

                    // VAT (Basic assumption)
                    vat_rate: order.vat || 0,
                    vat_amount: (amount * (order.vat || 0)) / 100,
                    vat_amount_oc: (amount * (order.vat || 0)) / 100,

                    stock_code: "KHO_TONG", // Default Stock
                    exchange_rate_operator: "*",

                    main_convert_rate: 1,
                    main_quantity: qty,
                    main_unit_price: price
                };
            })
        };
    },

    // 3. Push to Misa
    pushSalesOrder: async (orderId: string, orderData: any, supabase: any): Promise<{ success: boolean; refId?: string; error?: string }> => {
        let endpoint = "";
        try {
            console.log(`[MisaService] Pushing order ${orderId} to Misa (REAL)...`);

            // 1. Get Token (Pass supabase client)
            const token = await MisaService.getAccessToken(supabase);

            // 2. Get Config
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const config = settings?.misa_config;

            // 3. Map Data
            const invoiceObj = MisaService.mapOrderToMisaInvoice(orderData);

            // 4. Prepare Payload (Strict V5 Schema)
            // https://actdocs.misa.vn
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";

            const payload = {
                app_id: appId,
                org_company_code: config?.companyCode,
                voucher: [invoiceObj] // Critical: Key is "voucher", not "data"
            };

            // 5. Send to Misa API
            const apiUrl = config?.apiUrl || "https://actapp.misa.vn";
            // Check for trailing slash
            const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            endpoint = `${baseUrl}/api/sync/actopen/save`;

            console.log(`[MisaService] POST ${endpoint}`);
            console.log(`[MisaService] Config:`, JSON.stringify(config));
            console.log(`[MisaService] Payload:`, JSON.stringify(payload, null, 2));

            const headers = {
                "Content-Type": "application/json",
                "X-MISA-AccessToken": token,
                "X-MISA-AppID": appId, // Ensure header also has valid ID
                "User-Agent": "LYHU-B2B-Platform/1.0"
            };
            console.log(`[MisaService] Request Headers:`, headers);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload)
            });

            // Handle non-JSON responses
            const textRaw = await res.text();
            console.log(`[MisaService] Response Raw:`, textRaw);

            if (!res.ok) {
                console.error(`[MisaService] Push Failed Status ${res.status}:`, textRaw);
                let errorDetails = textRaw;
                try {
                    const errJson = JSON.parse(textRaw);
                    errorDetails = errJson?.UserMessage || errJson?.DevMessage || errJson?.Data || JSON.stringify(errJson);
                } catch (e) { }

                return { success: false, error: `Misa Error (${res.status}): ${errorDetails}` };
            }

            let resData;
            try {
                resData = JSON.parse(textRaw);
            } catch (e) {
                return { success: true, refId: "Unknown_Ref (Non-JSON)" };
            }

            // Async API response usually is just { Success: true, Data: "TrackingID..." }
            // The actual success comes later via Callback.
            if (resData?.Success) {
                console.log(`[MisaService] Push Sent! Result Pending Callback.`);
                return { success: true, refId: "PENDING_CALLBACK" };
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
