
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test MISA dictionary save operations.
 * Call: GET /api/misa/debug-dict
 * This will attempt to save a test customer, employee, and inventory item
 * to MISA's dictionary and return the raw responses.
 */
export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const token = await MisaService.getAccessToken(supabase);
        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = (settings as any)?.misa_config || {};
        const appId = config.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
        const apiUrl = (config.apiUrl || "https://actapp.misa.vn").replace(/\/$/, "");

        const results: any[] = [];

        // Helper to test a save_dictionary call
        const testSaveDict = async (name: string, endpoint: string, payload: any) => {
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-MISA-AccessToken": token,
                        "X-MISA-AppID": appId,
                    },
                    body: JSON.stringify(payload)
                });
                const text = await res.text();
                return { test: name, status: res.status, response: text.substring(0, 1000), payload_sent: payload };
            } catch (e: any) {
                return { test: name, error: e.message, payload_sent: payload };
            }
        };

        // Helper to test get_dictionary
        const testGetDict = async (name: string, dictType: number) => {
            try {
                const res = await fetch(`${apiUrl}/api/sync/actopen/get_dictionary`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-MISA-AccessToken": token,
                        "X-MISA-AppID": appId,
                    },
                    body: JSON.stringify({
                        app_id: appId,
                        org_company_code: "NB",
                        data_type: dictType,
                        skip: 0,
                        take: 3
                    })
                });
                const text = await res.text();
                return { test: name, status: res.status, response: text.substring(0, 1500) };
            } catch (e: any) {
                return { test: name, error: e.message };
            }
        };

        // ====== STEP 1: Query existing dictionaries to understand structure ======

        // 1a. Get Account Objects (customers) - data_type 1
        results.push(await testGetDict("GET Account Objects (data_type=1)", 1));

        // 1b. Get Inventory Items - data_type 2
        results.push(await testGetDict("GET Inventory Items (data_type=2)", 2));

        // 1c. Get Employees - data_type 3
        results.push(await testGetDict("GET Employees (data_type=3)", 3));

        // 1d. Get Stocks/Warehouses - data_type 4
        results.push(await testGetDict("GET Stocks (data_type=4)", 4));

        // 1e. Try data_type 5, 6 to discover what's available
        results.push(await testGetDict("GET Type 5", 5));
        results.push(await testGetDict("GET Type 6", 6));

        // ====== STEP 2: Test save_dictionary with /api/ ======

        // 2a. Save customer via /api/
        results.push(await testSaveDict("SAVE Customer (/api/) dict_type=1", `${apiUrl}/api/sync/actopen/save_dictionary`, {
            app_id: appId,
            org_company_code: "NB",
            dictionary_type: 1,
            account_objects: [{
                account_object_code: "TEST-DEBUG-001",
                account_object_name: "Test Debug Customer",
                account_object_type: 1,
                is_customer: true,
                is_vendor: false,
            }]
        }));

        // 2b. Save employee via /api/
        results.push(await testSaveDict("SAVE Employee (/api/) dict_type=3", `${apiUrl}/api/sync/actopen/save_dictionary`, {
            app_id: appId,
            org_company_code: "NB",
            dictionary_type: 3,
            employees: [{
                employee_code: "TEST-EMP-001",
                employee_name: "Test Debug Employee",
                is_active: true,
            }]
        }));

        // 2c. Save inventory item via /api/
        results.push(await testSaveDict("SAVE Inventory (/api/) dict_type=2", `${apiUrl}/api/sync/actopen/save_dictionary`, {
            app_id: appId,
            org_company_code: "NB",
            dictionary_type: 2,
            inventory_items: [{
                inventory_item_code: "TEST-INV-001",
                inventory_item_name: "Test Debug Item",
                inventory_item_type: 1,
                unit_name: "Cái",
                is_active: true,
            }]
        }));

        // ====== STEP 3: Test with /apir/ for comparison ======
        results.push(await testSaveDict("SAVE Customer (/apir/) dict_type=1", `${apiUrl}/apir/sync/actopen/save_dictionary`, {
            app_id: appId,
            org_company_code: "NB",
            dictionary_type: 1,
            account_objects: [{
                account_object_code: "TEST-DEBUG-002",
                account_object_name: "Test Debug Customer 2",
                account_object_type: 1,
                is_customer: true,
            }]
        }));

        // ====== STEP 4: Check what the order push endpoint expects ======
        // Also test with specific field variations for save_dictionary
        results.push(await testSaveDict("SAVE Customer (data_type instead of dictionary_type)", `${apiUrl}/api/sync/actopen/save_dictionary`, {
            app_id: appId,
            org_company_code: "NB",
            data_type: 1,
            account_objects: [{
                account_object_code: "TEST-DEBUG-003",
                account_object_name: "Test Debug Customer 3",
                account_object_type: 1,
                is_customer: true,
            }]
        }));

        return NextResponse.json({
            success: true,
            token_preview: token ? `${token.substring(0, 15)}...` : "null",
            config_preview: {
                apiUrl: config.apiUrl || "default",
                appId: appId,
                companyCode: config.companyCode,
                stockCode: config.stockCode || "KBH (default)",
                employeeCode: config.employeeCode || "NV000009 (default)",
            },
            results
        }, { status: 200 });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
