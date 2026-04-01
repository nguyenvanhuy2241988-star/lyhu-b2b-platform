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
        // Use Vietnam timezone (UTC+7) to avoid off-by-one-day issues
        const vnDateStr = (d: Date) => {
            const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
            return vn.toISOString().split('T')[0];
        };
        const today = vnDateStr(new Date());
        const orderDate = vnDateStr(new Date(order.created_at || new Date()));

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

            // Determine Product Code (Priority: misa_code > SKU > fallback)
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
                // Note: inventory_item_category_code removed - MISA uses specific codes per product
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

        // Customer Info: Priority = customer.misa_code (matched) > phone > auto-generated
        const customerMisaCode = order.customer?.misa_code;
        const phoneCode = order.receiverPhone || order.customer?.phone || "";
        const customerCode = customerMisaCode || phoneCode.trim() || `KH-${order.customer?.id || Date.now()}`;

        const payload: any = {
            voucher_type: 20, // Đơn đặt hàng

            org_refid: `${order.id}-${Date.now()}`,
            org_refno: `DH-WEB-${order.readable_id || order.readableId || order.id.substring(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`,
            org_reftype_name: "Đơn đặt hàng website",

            refdate: orderDate,

            // Customer Info
            account_object_code: customerCode,
            account_object_name: order.customerName || order.customer?.name || "Khách lẻ",
            account_object_address: order.receiverAddress || order.address || "",
            account_object_contact: phoneCode, // Phone for reference
            account_object_tax_code: order.customer?.tax_code || "",
            // Note: Customer is pre-created in dictionary step (3b) above
            // Don't set group_code here to avoid "NPP group not found" errors

            // Employee Mapping: Only set if a REAL employee code exists in MISA
            // Don't use a hardcoded fallback like "NV000009" — it might not exist in MISA's dictionary
            // and would cause "Đối tượng không tồn tại trong danh mục" error
            ...(config?.employeeCode ? {
                employee_code: config.employeeCode,
                sale_employee_code: config.employeeCode,
                sales_employee_code: config.employeeCode,
                SaleEmployeeCode: config.employeeCode,
                EmployeeCode: config.employeeCode,
            } : {}),

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
                invoiceObj.SaleEmployeeName = mappedName;
                invoiceObj.EmployeeName = mappedName;
            }
            // 3b. Check if Customer exists in MISA, if not → use default customer code
            // CONFIRMED: MISA does NOT auto-create customers even with is_auto_create_object: true
            // CONFIRMED: save_dictionary is async and takes 20+ seconds — cannot wait in serverless function
            // Strategy: Check if customer exists → if yes, use their code
            //           If no → fire-and-forget creation + use default customer for THIS order
            try {
                const customerCode = invoiceObj.account_object_code;
                const customerName = invoiceObj.account_object_name;
                const apiUrl = (config?.apiUrl || "https://actapp.misa.vn").replace(/\/$/, "");
                const appIdForDict = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";

                // Check if customer exists in MISA
                console.log(`[MisaService] Checking if customer ${customerCode} exists in MISA...`);
                const checkRes = await fetch(`${apiUrl}/api/sync/actopen/get_dictionary`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-MISA-AccessToken": token
                    },
                    body: JSON.stringify({
                        app_id: appIdForDict,
                        org_company_code: "NB",
                        data_type: 1,
                        skip: 0,
                        take: 500
                    })
                });
                const checkText = await checkRes.text();
                const customerExists = checkText.includes(`"account_object_code":"${customerCode}"`);

                if (customerExists) {
                    console.log(`[MisaService] ✅ Customer ${customerCode} EXISTS in MISA — using directly.`);
                } else {
                    console.log(`[MisaService] ⚠️ Customer ${customerCode} NOT FOUND in MISA.`);

                    // Fire-and-forget: Queue customer creation for FUTURE orders
                    const customerPhone = orderData.receiverPhone || orderData.customer?.phone || "";
                    const customerAddress = invoiceObj.account_object_address || "";
                    fetch(`${apiUrl}/api/sync/actopen/save_dictionary`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-MISA-AccessToken": token
                        },
                        body: JSON.stringify({
                            app_id: appIdForDict,
                            org_company_code: "NB",
                            dictionary_type: 1,
                            account_objects: [{
                                account_object_code: customerCode,
                                account_object_name: customerName,
                                account_object_type: 1,
                                tel: customerPhone,
                                mobile: customerPhone,
                                address: customerAddress,
                                tax_code: orderData.customer?.tax_code || "",
                                is_customer: true,
                                is_vendor: false,
                            }]
                        })
                    }).then(r => r.text()).then(t => {
                        console.log(`[MisaService] Customer creation queued:`, t.substring(0, 200));
                    }).catch(e => {
                        console.warn(`[MisaService] Customer creation queue failed:`, e.message);
                    });

                    // For THIS order: use default customer code that EXISTS in MISA
                    // Default: "00335" (confirmed to exist from debug)
                    // Store original customer info in journal_memo
                    const defaultCustomerCode = config?.defaultCustomerCode || "00335";
                    console.log(`[MisaService] Using default customer code "${defaultCustomerCode}" for this order.`);
                    console.log(`[MisaService] Original customer: ${customerCode} (${customerName})`);

                    // Update invoice to use default customer but keep real info in description
                    const originalInfo = `[KH: ${customerName} - ${customerCode}]`;
                    invoiceObj.account_object_code = defaultCustomerCode;
                    invoiceObj.account_object_name = customerName; // Keep name for reference
                    invoiceObj.journal_memo = `${originalInfo} ${invoiceObj.journal_memo || "Đơn hàng tạo bởi Telesales"}`;
                }
            } catch (custErr: any) {
                console.warn(`[MisaService] Customer check warning:`, custErr.message);
            }

            console.log(`[MisaService] Final customer code: ${invoiceObj.account_object_code}`);

            // 4. Prepare Payload (Strict V5 Schema)
            // https://actdocs.misa.vn
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";

            const payload = {
                app_id: appId,
                // CRITICAL: org_company_code MUST be "NB" — same as auth endpoint
                // config.companyCode ("OPCXJDR4") is NOT the right value here!
                // All successful MISA calls (auth, get_dictionary, save_dictionary) use "NB"
                org_company_code: "NB",
                is_auto_create_object: true,
                voucher: [{
                    ...invoiceObj,
                    // organization_unit_code = "NB" (from MISA org units, NOT companyCode)
                    organization_unit_code: config?.orgUnitCode || "NB",
                    OrganizationUnitCode: config?.orgUnitCode || "NB",
                    // Help MISA auto-create customer object
                    account_object_type: 1, // 1 = Customer
                    is_customer: true,
                }]
            };

            // 5. Send to Misa API
            const apiUrl = config?.apiUrl || "https://actapp.misa.vn";
            // Check for trailing slash
            const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            // NOTE: Save uses /api/ (NOT /apir/) — /api/ auto-creates items, /apir/ is strict and rejects unknown items
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
                        _debug_mappedName: mappedName || "N/A",
                        _debug_finalEmployeeCode: config?.employeeCode || "N/A",
                        _debug_codeLen: config?.employeeCode ? config.employeeCode.length : 0,
                        _debug_created_by: orderData.created_by || "N/A",
                        _debug_dictResult: (invoiceObj as any)._dictDebug || "N/A",
                        _debug_empDictResult: (invoiceObj as any)._empDictDebug || "N/A",
                        _debug_customerCode: invoiceObj.account_object_code
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
                        _debug_finalEmployeeCode: config?.employeeCode || "N/A",
                        _debug_dictResult: (invoiceObj as any)._dictDebug || "N/A",
                        _debug_empDictResult: (invoiceObj as any)._empDictDebug || "N/A",
                        _debug_customerCode: invoiceObj.account_object_code
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
    fetchInventoryItems: async (supabase: any): Promise<{ success: boolean; items?: any[]; error?: string; _raw?: any }> => {
        try {
            const token = await MisaService.getAccessToken(supabase);
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const config = settings?.misa_config || {};
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
            // IMPORTANT: Must match org_company_code used in getAccessToken ("NB")
            const companyCode = "NB";

            // MISA ActOpen API: POST /apir/sync/actopen/get_dictionary
            // data_type: 1 = Đối tượng (Customers), 2 = Vật tư hàng hóa (Inventory Items)
            // NOTE: MISA uses /apir/ not /api/ for this endpoint!
            const apiUrl = "https://actapp.misa.vn";
            const endpoint = `${apiUrl}/apir/sync/actopen/get_dictionary`;

            console.log(`[MisaService] Fetching Inventory Items from: ${endpoint}`);
            console.log(`[MisaService] Request body:`, { app_id: appId, org_company_code: companyCode, data_type: 2 });

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "X-MISA-AppID": appId,
                    "User-Agent": "LYHU-B2B-Platform/1.0"
                },
                body: JSON.stringify({
                    app_id: appId,
                    org_company_code: companyCode,
                    data_type: 2,
                    last_sync_time: "2000-01-01 00:00:00" // Get all items since very old date
                })
            });

            const textRaw = await res.text();

            if (!res.ok) {
                console.error(`[MisaService] Fetch Items Failed (${res.status}):`, textRaw);
                return { success: false, error: `MISA API Error (${res.status}): ${textRaw.substring(0, 500)}` };
            }

            let data;
            try { data = JSON.parse(textRaw); } catch (e) {
                return { success: false, error: "Invalid JSON response from MISA", _raw: textRaw.substring(0, 500) };
            }

            // Debug: surface raw response structure
            const rawDebug = {
                keys: Object.keys(data || {}),
                Success: data?.Success,
                DataType: typeof data?.Data,
                DataIsArray: Array.isArray(data?.Data),
                DataLength: Array.isArray(data?.Data) ? data.Data.length : (typeof data?.Data === 'string' ? data.Data.length : 'N/A'),
                DataSample: Array.isArray(data?.Data)
                    ? JSON.stringify(data.Data[0]).substring(0, 300)
                    : (typeof data?.Data === 'string' ? data.Data.substring(0, 300) : JSON.stringify(data?.Data).substring(0, 300)),
                raw500: textRaw.substring(0, 500),
            };

            console.log(`[MisaService] Dictionary Response Debug:`, JSON.stringify(rawDebug));

            // Parse items from various MISA response formats
            let rawItems: any[] = [];

            // Format 1: { Success: true, Data: [...] }
            if (data?.Success && Array.isArray(data?.Data)) {
                rawItems = data.Data;
            }
            // Format 2: Direct array
            else if (Array.isArray(data)) {
                rawItems = data;
            }
            // Format 3: { Success: true, Data: "json_string" }
            else if (data?.Success && typeof data?.Data === 'string') {
                try {
                    const parsed = JSON.parse(data.Data);
                    if (Array.isArray(parsed)) rawItems = parsed;
                } catch (e) { }
            }

            if (rawItems.length > 0) {
                // Auto-detect field names from first item
                const sample = rawItems[0];
                const keys = Object.keys(sample);
                console.log(`[MisaService] Item keys:`, keys);

                return {
                    success: true,
                    items: rawItems.map((item: any) => ({
                        inventory_item_code: item.inventory_item_code || item.InventoryItemCode || item.code || item.Code || item.inventory_item_id || '',
                        inventory_item_name: item.inventory_item_name || item.InventoryItemName || item.name || item.Name || '',
                        unit_name: item.unit_name || item.UnitName || item.unit || item.Unit || '',
                        inventory_item_id: item.inventory_item_id || item.InventoryItemID || item.id || item.ID || '',
                    })),
                    _raw: rawDebug
                };
            }

            // No items found — return raw response for debugging
            return { success: true, items: [], _raw: rawDebug };
        } catch (err: any) {
            console.error("[MisaService] fetchInventoryItems Error:", err);
            return { success: false, error: err.message };
        }
    },

    // 5. Fetch Inventory Stock Levels from MISA for Sync
    // Returns items with quantity info for inventory sync
    fetchInventoryStock: async (supabase: any): Promise<{
        success: boolean;
        items?: {
            inventory_item_code: string;
            inventory_item_name: string;
            unit_name: string;
            quantity_on_hand: number;
        }[];
        error?: string;
        _debug?: any;
    }> => {
        try {
            const token = await MisaService.getAccessToken(supabase);
            const settings = await fetchAppSettings(supabase);
            // @ts-ignore
            const config = settings?.misa_config || {};
            const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
            const companyCode = "NB";
            const apiUrl = "https://actapp.misa.vn";

            // Use dedicated endpoint: get_list_inventory_balance (per MISA ActOpen docs #7)
            const endpoint = `${apiUrl}/apir/sync/actopen/get_list_inventory_balance`;

            console.log(`[MisaService] Fetching Inventory Balance from MISA (get_list_inventory_balance)...`);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "X-MISA-AppID": appId,
                    "User-Agent": "LYHU-B2B-Platform/1.0"
                },
                body: JSON.stringify({
                    app_id: appId,
                    org_company_code: companyCode,
                    stock_id: null,       // null = all warehouses
                    branch_id: null,      // null = all branches
                    skip: 0,
                    take: 500,            // max items per request
                    last_sync_time: null  // null = get all
                })
            });

            const textRaw = await res.text();

            if (!res.ok) {
                console.error(`[MisaService] Fetch Stock Failed (${res.status}):`, textRaw.substring(0, 500));
                return { success: false, error: `MISA API Error (${res.status}): ${textRaw.substring(0, 300)}` };
            }

            let data;
            try { data = JSON.parse(textRaw); } catch (e) {
                return { success: false, error: "Invalid JSON response from MISA" };
            }

            // Parse items from response
            let rawItems: any[] = [];
            if (data?.Success && Array.isArray(data?.Data)) {
                rawItems = data.Data;
            } else if (Array.isArray(data)) {
                rawItems = data;
            } else if (data?.Success && typeof data?.Data === 'string') {
                try {
                    const parsed = JSON.parse(data.Data);
                    if (Array.isArray(parsed)) rawItems = parsed;
                } catch (e) { }
            }

            // Log sample item keys for debugging
            const sampleKeys = rawItems.length > 0 ? Object.keys(rawItems[0]) : [];
            console.log(`[MisaService] Stock items: ${rawItems.length}, sample keys:`, sampleKeys);

            // Log first item for debugging stock fields
            if (rawItems.length > 0) {
                console.log(`[MisaService] Sample item:`, JSON.stringify(rawItems[0]).substring(0, 500));
            }

            const items = rawItems.map((item: any) => {
                const code = item.inventory_item_code || item.InventoryItemCode || item.code || '';
                const name = item.inventory_item_name || item.InventoryItemName || item.name || '';
                const unit = item.unit_name || item.UnitName || item.unit || '';

                // inventory_balance fields per MISA docs:
                // quantity_balance = Số lượng tồn của vật tư hàng hóa
                const qty = item.quantity_balance
                    ?? item.QuantityBalance
                    ?? item.quantity_on_hand
                    ?? item.QuantityOnHand
                    ?? item.stock_quantity
                    ?? item.StockQuantity
                    ?? item.quantity
                    ?? item.Quantity
                    ?? 0;

                return {
                    inventory_item_code: code,
                    inventory_item_name: name,
                    unit_name: unit,
                    quantity_on_hand: Number(qty) || 0,
                };
            });

            return {
                success: true,
                items,
                _debug: {
                    totalItems: rawItems.length,
                    sampleKeys,
                    sampleItem: rawItems.length > 0
                        ? JSON.stringify(rawItems[0]).substring(0, 500)
                        : null,
                    hasQuantityField: sampleKeys.some(k =>
                        k.toLowerCase().includes('quantity') ||
                        k.toLowerCase().includes('stock') ||
                        k.toLowerCase().includes('on_hand')
                    ),
                }
            };
        } catch (err: any) {
            console.error("[MisaService] fetchInventoryStock Error:", err);
            return { success: false, error: err.message };
        }
    },
};


