// MisaService.ts - Server Side Service - Updated 2026-02-07 01:05

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
                    org_company_code: "NB" // config.companyCode?.trim()
                })
            });

            const data = await res.json();

            if (!res.ok || !data?.Success) {
                console.error("[MisaService] Auth Failed:", data);
                const msg = data?.UserMessage || data?.DevMessage || data?.Data || JSON.stringify(data);
                throw new Error(`Misa Auth Refused: ${msg}`);
            }

            if (data?.Success && data?.Data) {
                console.log("[MisaService] Auth Success! Raw Data:", data.Data);

                // Fix: data.Data might be a JSON string containing access_token
                let token = data.Data;
                if (typeof token === 'string' && token.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(token);
                        if (parsed.access_token) {
                            token = parsed.access_token;
                        }
                    } catch (e) {
                        console.warn("[MisaService] Failed to parse Token JSON:", e);
                    }
                }

                return token;
            }

            throw new Error("Misa Auth: Không lấy được Token");

        } catch (err: any) {
            console.error(`[MisaService] Auth Network Error (${attemptUrl}):`, err);
            // Throw a clearer error for the UI
            throw new Error(`Lỗi kết nối Misa (Auth): ${err.message || "Network Error"}`);
        }
    },

    // 2. Map Order to Misa Invoice
    mapOrderToMisaInvoice: (order: any, config: any) => {
        console.log("Mapping Order to Misa V5 Payload...");
        const items = order.items || [];
        const today = new Date().toISOString().split('T')[0];
        const orderDate = new Date(order.created_at || new Date()).toISOString().split('T')[0];

        // Configurable Defaults
        const stockCode = config?.stockCode || "KBH";
        const debitAccount = config?.debitAccount || "131";
        const creditAccount = config?.creditAccount || "5111";

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
                inventory_item_code: "8938540202023", // HARDCODED DEBUG: Bánh tráng bơ Abi
                inventory_item_name: item.name,
                description: item.name,
                unit_code: "Gói", // HARDCODED DEBUG: Valid Unit

                quantity: qty,
                unit_price: price,
                amount: amount,
                amount_oc: amount, // Nguyên tệ

                // Accounts (Configurable)
                debit_account: debitAccount,
                credit_account: creditAccount,

                // VAT
                vat_rate: vatRate,
                vat_amount: vatAmount,
                vat_amount_oc: vatAmount,

                stock_code: "KBH", // HARDCODED DEBUG: Valid Stock
                exchange_rate_operator: "*",

                main_convert_rate: 1,
                main_quantity: qty,
                main_unit_price: price
            };
        });

        const totalSaleAmount = totalAmount - totalVat; // Pre-tax roughly

        // Customer Info (Dynamic Mapping based on Phone)
        const phoneCode = order.receiverPhone || order.customer?.phone || "";
        // const customerCode = phoneCode.trim() || "KH_LE";

        const payload: any = {
            voucher_type: 20, // Đơn đặt hàng
            // reftype: 3535,    // REMOVED: Let MISA infer (Might be causing silent rejection)

            org_refid: `${order.id}-${Date.now()}`,
            // Changed prefix to DH-WEB to be distinct
            org_refno: `DH-WEB-${order.readable_id || order.readableId || order.id.substring(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`,
            org_reftype_name: "Đơn đặt hàng website",

            refdate: orderDate,
            // posted_date: today, // Not needed for Order
            // inv_date: today,    // Not needed for Order

            // Customer Info (Hardcoded Debug)
            account_object_code: "0966455789", // HARDCODED DEBUG: Valid Customer
            account_object_name: order.customerName || order.customer?.name || "Khách lẻ",
            account_object_address: order.receiverAddress || order.address || "",

            // Employee (Hardcoded based on User Screenshot: NV000009 - Shoppe)
            employee_code: config?.employeeCode || "NV000009",

            // Dates
            due_date: orderDate,
            delivery_date: orderDate,

            // Financial Info
            journal_memo: `Đơn hàng #${order.readable_id || order.readableId}`,
            // Explicitly set Currency (Critical for Order)
            currency_id: "VND",
            exchange_rate: 1,

            // Totals
            total_sale_amount: totalSaleAmount,
            total_sale_amount_oc: totalSaleAmount,
            total_vat_amount: totalVat,
            total_vat_amount_oc: totalVat,
            total_amount: totalAmount,
            total_amount_oc: totalAmount,
            total_discount_amount: totalDiscount,
            total_discount_amount_oc: totalDiscount,

            // Status: 1=Chưa thực hiện (Pending)
            order_status: 1,

            // Item Details
            detail: details.map((d: any) => ({
                ...d,
                // Remove accounts for Order
                debit_account: undefined,
                credit_account: undefined,
                // Order specific fields if needed
            }))
        };

        // Add Branch ID if available (Required for multi-branch sync)
        if (config?.branchId) {
            payload.branch_id = config.branchId;
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
            const config = settings?.misa_config || {};

            // 3. Map Data
            const invoiceObj = MisaService.mapOrderToMisaInvoice(orderData, config);

            // 4. Prepare Payload (Strict V5 Schema)
            // https://actdocs.misa.vn
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";

            const payload = {
                app_id: appId,
                org_company_code: "NB", // config?.companyCode?.trim(),
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
                console.log(`[MISA SUCCESS] Push Sent! Full Response:`, JSON.stringify(resData));
                // Usually resData.Data contains the Reference ID for ActOpen
                return {
                    success: true,
                    refId: resData.Data || resData.Reference || "PENDING_CALLBACK",
                    debugPayload: payload // Add payload for debugging
                };
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
