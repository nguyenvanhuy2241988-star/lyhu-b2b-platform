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
                    org_company_code: config.companyCode?.trim()
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
    mapOrderToMisaInvoice: (order: any, branchId?: string, stockCode?: string) => {
        const items = order.items || [];
        const today = new Date().toISOString().split('T')[0];
        const orderDate = new Date(order.created_at || new Date()).toISOString().split('T')[0];

        // 1. Calculate Details & Totals
        let totalAmount = 0; // This will be total_amount (including VAT)
        let totalVat = 0;
        let totalDiscount = 0;

        const details = items.map((item: any, index: number) => {
            const price = item.price || item.unitPrice || 0;
            const qty = item.quantity || 1;
            const amount = price * qty; // Pre-tax amount for this item
            const vatRate = order.vat || 0; // simple assumption
            const vatAmount = (amount * vatRate) / 100;

            totalAmount += amount + vatAmount;
            totalVat += vatAmount;

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

                // VAT
                vat_rate: vatRate,
                vat_amount: vatAmount,
                vat_amount_oc: vatAmount,

                stock_code: stockCode || "KHO", // Default Stock or from Config
                exchange_rate_operator: "*",

                main_convert_rate: 1,
                main_quantity: qty,
                main_unit_price: price,

                // Required by some MISA setups
                inventory_item_type: 0 // Vật tư hàng hóa
            };
        });

        const totalSaleAmount = totalAmount - totalVat; // Pre-tax roughly

        // MISA Service "Save" API (5.1.4 Hóa đơn bán hàng)
        const payload: any = {
            voucher_type: 11, // Hóa đơn bán hàng
            reftype: 3560,    // Hóa đơn bán hàng trong nước

            org_refid: order.id,
            org_refno: `ORD-${order.readableId || order.id.substring(0, 6)}`,
            org_reftype_name: "Đơn đặt hàng website",
            org_reftype: 3560,

            refdate: orderDate,
            posted_date: today,
            inv_date: today,

            // Customer Info (snake_case)
            account_object_code: order.customer?.misa_code || "KH_LE",
            account_object_name: order.customer?.name || order.customer_name || "Khách lẻ",

            // Financial Info
            journal_memo: `Bán hàng đơn #${order.readableId}`,
            currency_id: "VND",
            exchange_rate: 1,
            payment_method: "Tiền mặt",

            // Defaults for Required Fields
            // inv_series: "K24T",
            // inv_no: `INV-${order.readableId}`,
            // inv_template_no: "01GTKT0/001",
            inv_type_id: 1, // GTGT

            // Totals (REQUIRED)
            total_sale_amount: totalSaleAmount,
            total_sale_amount_oc: totalSaleAmount,
            total_vat_amount: totalVat,
            total_vat_amount_oc: totalVat,
            total_amount: totalAmount,
            total_amount_oc: totalAmount,
            total_discount_amount: totalDiscount,
            total_discount_amount_oc: totalDiscount,

            // Item Details
            detail: details
        };

        // Add Branch ID if available (Required for multi-branch sync)
        if (branchId) {
            payload.branch_id = branchId;
        }

        return payload;
    },

    // 3. Push to Misa
    pushSalesOrder: async (orderId: string, orderData: any, supabase: any): Promise<{ success: boolean; refId?: string; error?: string; debugPayload?: any }> => {
        let endpoint = "";
        try {
            console.log(`[MisaService] Pushing order ${orderId} to Misa (REAL)...`);

            // 1. Get Token (Pass supabase client)
            const token = await MisaService.getAccessToken(supabase);

            // 2. Get Config
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const config = settings?.misa_config;
            const branchId = config?.branchId; // Retrieve branchId from config
            const stockCode = config?.stockCode; // Retrieve stockCode from config

            // 3. Map Data
            const invoiceObj = MisaService.mapOrderToMisaInvoice(orderData, branchId, stockCode);

            // 4. Prepare Payload (Strict V5 Schema)
            // https://actdocs.misa.vn
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";

            const payload = {
                app_id: appId,
                org_company_code: config?.companyCode?.trim(),
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
                let errorDetails = textRaw || "(EMPTY RESPONSE BODY)"; // Explicitly mark empty
                try {
                    const errJson = JSON.parse(textRaw);
                    // V5 Standard uses ErrorMessage. fallback to UserMessage/DevMessage.
                    const msg = errJson?.ErrorMessage || errJson?.UserMessage || errJson?.DevMessage || "Unknown Error";
                    const code = errJson?.ErrorCode || "";
                    const dataDetail = errJson?.Data ? JSON.stringify(errJson.Data) : "";

                    errorDetails = `${code ? `[${code}] ` : ""}${msg}${dataDetail ? ` | Detail: ${dataDetail}` : ""}`;

                    // Fallback if parsing returned nothing useful but strict JSON exists
                    if (errorDetails === "Unknown Error" && Object.keys(errJson).length > 0) {
                        errorDetails = JSON.stringify(errJson);
                    }
                } catch (e) { }

                return {
                    success: false,
                    error: `Misa Error (${res.status}): ${errorDetails}`,
                    debugPayload: payload
                };
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
                // V5 Standard: ErrorMessage, ErrorCode. V2/Other: UserMessage
                const msg = resData?.ErrorMessage || resData?.UserMessage || resData?.DevMessage || "Unknown Error";
                const code = resData?.ErrorCode || "";

                // If it is a validation error (400), sometimes Data contains the specific field errors
                const dataDetail = resData?.Data ? JSON.stringify(resData.Data) : "";

                const fullError = `${code ? `[${code}] ` : ""}${msg}${dataDetail ? ` | Detail: ${dataDetail}` : ""}`;
                return {
                    success: false,
                    error: `Misa Reject: ${fullError}`,
                    debugPayload: payload
                };
            }

        } catch (err: any) {
            console.error("[MisaService] Exception:", err);
            return { success: false, error: `Lỗi hệ thống: ${err.message}` };
        }
    },
};
