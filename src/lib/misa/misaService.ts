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

        // Handle Shipping Fee (Add as a service item)
        if (order.shipping_fee && order.shipping_fee > 0) {
            items.push({
                is_shipping: true,
                product: {
                    misa_code: config?.shippingCode || "VANCHUYEN", // Need config for this
                    name: "Phí vận chuyển",
                    unit: "Lần"
                },
                quantity: 1,
                price: order.shipping_fee,
                unitPrice: order.shipping_fee,
                vat: 0 // Usually 0 or depends on config
            });
        }

        const details = items.map((item: any, index: number) => {
            // Fix Price Logic: Ensure 0 is respected (e.g. for gifts)
            const isGift = item.is_gift || item.isGift;
            let price = (item.price !== undefined && item.price !== null)
                ? item.price
                : (item.unitPrice || 0);

            if (isGift) {
                price = 0; // Force zero price for gifts
            }

            const qty = item.quantity || 1;

            // Calculate Discount (Per Item)
            // Assuming item.discount is the TOTAL discount amount for this line item
            let discountAmount = item.discount || 0;

            if (isGift) {
                discountAmount = 0; // Force zero discount for gifts to avoid negative amount
            }

            const grossAmount = price * qty; // Gross Amount
            const discountRate = grossAmount > 0 ? (discountAmount / grossAmount) * 100 : 0;
            const netAmount = grossAmount - discountAmount; // Net amount for VAT calc

            // Calculate VAT Rate properly
            // If order.vat is an amount (e.g., 42560), we must not use it as rate.
            // Assumption: order.vat is the TOTAL VAT amount for the order.
            // We need to distribute it or calculate the rate.

            // Try to find a tax rate from the item or order if available as a percentage
            let vatRate = 0;

            // If items have specific tax rates (future proofing), use them. 
            // Otherwise, calculate from Total VAT / Total Amount (Pre-Tax)
            // Note: Total Amount in standard commerce usually includes discounts but excludes tax
            // If order.total_amount includes tax, we need to be careful.
            // Given previous logic was `totalAmount += amount + vatAmount`, let's stick to simple rate calc from totals
            if (order.vat && order.total_amount && order.total_amount > order.vat) {
                const preTaxTotal = order.total_amount - order.vat;
                if (preTaxTotal > 0) {
                    const calculatedRate = (order.vat / preTaxTotal) * 100;
                    // Round to nearest standard rate: 0, 5, 8, 10
                    if (calculatedRate > 9) vatRate = 10;
                    else if (calculatedRate > 7) vatRate = 8;
                    else if (calculatedRate > 4) vatRate = 5;
                    else vatRate = 0;
                }
            }

            // If gift, force VAT to 0 (usually)
            if (isGift) vatRate = 0;

            const vatAmount = (netAmount * vatRate) / 100;

            totalDiscount += discountAmount;
            totalAmount += netAmount + vatAmount;
            totalVat += vatAmount;

            // Determine Product Code (Priority: Product Misa Code > Product SKU > Item SKU)
            const productCode = item.product?.misa_code || item.product?.sku || item.sku || item.product_code || `SP-${index + 1}`;
            const productName = item.product?.name || item.name || item.inventory_item_name;
            const unit = item.product?.unit || item.unit || "Cái";

            // Log for debugging
            console.log(`[MisaService] Mapping Item ${index + 1}:`, {
                productCode,
                productName,
                originalSku: item.product?.sku || item.sku,
                vatRate: vatRate
            });

            return {
                sort_order: index + 1,
                inventory_item_code: productCode,
                inventory_item_name: productName,
                inventory_item_type: 1, // Loại: Hàng hóa (Goods)
                inventory_item_category_code: "HH", // Default Group: Goods
                description: productName,
                unit_code: unit,

                quantity: qty,
                unit_price: price,
                amount: grossAmount, // MISA subtracts discount from this
                amount_oc: grossAmount, // Nguyên tệ

                // Accounts (Configurable)
                debit_account: debitAccount,
                credit_account: creditAccount,

                // Discount
                discount_rate: discountRate,
                discount_amount: discountAmount,
                discount_amount_oc: discountAmount,

                // Promotion (for Gifts)
                is_promotion: isGift || false,

                // VAT
                vat_rate: vatRate,
                vat_amount: vatAmount,
                vat_amount_oc: vatAmount,

                stock_code: config?.stockCode || "KBH", // Should match user screenshot (Column 1)
                exchange_rate_operator: "*",

                main_convert_rate: 1,
                main_quantity: qty,
                main_unit_price: price
            };
        });

        const totalSaleAmount = totalAmount - totalVat; // Pre-tax roughly

        // Customer Info (Dynamic Mapping based on Phone)
        const phoneCode = order.receiverPhone || order.customer?.phone || "";
        // Auto-generate customer code if missing
        const customerCode = phoneCode.trim() || `KH-${order.customer?.id || Date.now()}`;

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

            // Customer Info
            account_object_code: customerCode,
            account_object_name: order.customerName || order.customer?.name || "Khách lẻ",
            account_object_address: order.receiverAddress || order.address || "",
            // Default Customer Group: NPP (Nhà Phân Phối) or THU (Khách thử hàng mẫu)
            // This is REQUIRED for auto-creating new customers
            account_object_group_code: config?.customerGroupCode || "NPP",

            // Employee Mapping Fix:
            // 'employee_code' usually refers to the System User. 
            // 'sale_employee_code' refers to the Sales Person (Dictionary).
            // We only want to map the Sales Person.
            // employee_code: config?.employeeCode || "NV000009",

            employee_code: config?.employeeCode || "NV000009",
            sale_employee_code: config?.employeeCode || "NV000009",
            sales_employee_code: config?.employeeCode || "NV000009", // Alias just in case
            SaleEmployeeCode: config?.employeeCode || "NV000009", // PascalCase alias
            EmployeeCode: config?.employeeCode || "NV000009", // PascalCase alias

            // Debug Employee Code
            // console.log(`[MisaService] Payload Employee Code: ${config?.employeeCode || "NV000009"}`);

            // Dates
            due_date: orderDate,
            delivery_date: orderDate,

            // Financial Info
            // Map Description/Note from Order
            journal_memo: order.note || order.description || `Đơn hàng #${order.readable_id || order.readableId}`,

            // Explicitly set Discount Type (1 = By Item / Theo mặt hàng)
            // This is CRITICAL to show the Discount Columns in MISA
            discount_type: 1,

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

            // 2b. Fetch Employee Code Mapping
            // Priority: user_id (Assignee) > telesales_user_id (Owner) > created_by (Creator)
            const userId = orderData.user_id || orderData.telesales_user_id || orderData.created_by;

            let mappedCode = null;
            let mappedName = null;
            if (userId) {
                console.log(`[MisaService] Fetching employee mapping for User ID: ${userId}`);
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('misa_employee_code, full_name, misa_branch_code')
                    .eq('id', userId)
                    .single();

                if (userProfile?.misa_employee_code) {
                    const cleanCode = userProfile.misa_employee_code.trim().toUpperCase();
                    console.log(`[MisaService] Found Mapped Employee Code: ${cleanCode}`);
                    config.employeeCode = cleanCode;
                    mappedCode = cleanCode;
                    mappedName = userProfile.full_name;

                    if (userProfile.misa_branch_code) {
                        const branchCode = userProfile.misa_branch_code.trim();
                        // Only use if not empty
                        if (branchCode) {
                            console.log(`[MisaService] Found Mapped Organization Unit: ${branchCode}`);
                            // Do NOT override config.companyCode (Branch). Use branchCode for OrganizationUnit (Dept).
                            config.orgUnitCode = branchCode;
                        }
                    }
                } else {
                    console.log(`[MisaService] User has no MISA Code. Using default: ${config.employeeCode}`);
                }
            } else {
                console.log(`[MisaService] Order has no user_id. Using default Employee Code: ${config.employeeCode || "NV000009"}`);
            }

            // 3. Map Data
            const invoiceObj = MisaService.mapOrderToMisaInvoice(orderData, config);

            // Inject Name for debugging or if MISA supports it (unlikely for V5 but harmless)
            if (mappedName) {
                invoiceObj.sale_employee_name = mappedName;
                invoiceObj.employee_name = mappedName;
                // Add redundant name fields
                invoiceObj.SaleEmployeeName = mappedName;
                invoiceObj.EmployeeName = mappedName;
            }

            // 4. Prepare Payload (Strict V5 Schema)
            // https://actdocs.misa.vn
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";

            const payload = {
                app_id: appId,
                org_company_code: config?.companyCode?.trim() || "NB", // Access Code must match Company/Branch
                voucher: [{
                    ...invoiceObj,
                    organization_unit_code: config?.orgUnitCode || config?.companyCode?.trim() || "NB",
                    OrganizationUnitCode: config?.orgUnitCode || config?.companyCode?.trim() || "NB" // PascalCase alias
                }]
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
                    debugPayload: {
                        ...payload,
                        _debug_userId: userId || "N/A",
                        _debug_mappedCode: mappedCode || "N/A",
                        // _debug_mappedCodeChars: removed for cleanliness
                        _debug_mappedName: mappedName || "N/A",
                        _debug_finalEmployeeCode: config?.employeeCode || "N/A",
                        _debug_codeLen: config?.employeeCode ? config.employeeCode.length : 0,
                        _debug_created_by: orderData.created_by || "N/A"
                    }
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
                    debugPayload: {
                        ...payload,
                        _debug_mappedCode: mappedCode || "N/A",
                        // _debug_mappedCodeChars: removed for cleanliness
                        _debug_finalEmployeeCode: config?.employeeCode || "N/A"
                    }
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

    // 4. Fetch Inventory Items from MISA (Dictionary API)
    fetchInventoryItems: async (supabase: any): Promise<{ success: boolean; items?: any[]; error?: string }> => {
        try {
            const token = await MisaService.getAccessToken(supabase);
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const config = settings?.misa_config || {};
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
            const companyCode = config?.companyCode?.trim() || "NB";

            // MISA ActOpen Dictionary API for Inventory Items
            const apiUrl = "https://actapp.misa.vn";
            const endpoint = `${apiUrl}/api/sync/actopen/dictionary/InventoryItem?app_id=${appId}&org_company_code=${companyCode}`;

            console.log(`[MisaService] Fetching Inventory Items from: ${endpoint}`);

            const res = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "X-MISA-AppID": appId,
                    "User-Agent": "LYHU-B2B-Platform/1.0"
                }
            });

            const textRaw = await res.text();

            if (!res.ok) {
                console.error(`[MisaService] Fetch Items Failed (${res.status}):`, textRaw);
                return { success: false, error: `MISA API Error (${res.status}): ${textRaw.substring(0, 200)}` };
            }

            let data;
            try { data = JSON.parse(textRaw); } catch (e) {
                return { success: false, error: "Invalid JSON response from MISA" };
            }

            // MISA response structure: { Success: true, Data: [...] }
            if (data?.Success && Array.isArray(data?.Data)) {
                console.log(`[MisaService] Fetched ${data.Data.length} inventory items from MISA`);
                return {
                    success: true,
                    items: data.Data.map((item: any) => ({
                        inventory_item_code: item.inventory_item_code || item.InventoryItemCode || '',
                        inventory_item_name: item.inventory_item_name || item.InventoryItemName || '',
                        unit_name: item.unit_name || item.UnitName || '',
                        inventory_item_id: item.inventory_item_id || item.InventoryItemID || '',
                    }))
                };
            }

            // Some MISA APIs return Data as array directly
            if (Array.isArray(data)) {
                console.log(`[MisaService] Fetched ${data.length} inventory items from MISA (array)`);
                return {
                    success: true,
                    items: data.map((item: any) => ({
                        inventory_item_code: item.inventory_item_code || item.InventoryItemCode || '',
                        inventory_item_name: item.inventory_item_name || item.InventoryItemName || '',
                        unit_name: item.unit_name || item.UnitName || '',
                        inventory_item_id: item.inventory_item_id || item.InventoryItemID || '',
                    }))
                };
            }

            return { success: false, error: `Unexpected MISA response: ${JSON.stringify(data).substring(0, 200)}` };
        } catch (err: any) {
            console.error("[MisaService] fetchInventoryItems Error:", err);
            return { success: false, error: err.message };
        }
    },
};
