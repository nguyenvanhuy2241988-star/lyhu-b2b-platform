
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = 'force-dynamic';

/**
 * Test endpoint: Push a minimal order to MISA using KNOWN EXISTING objects.
 * GET /api/misa/test-push
 * 
 * Uses objects confirmed to exist from debug:
 * - Customer: "00335" (Dly mart) 
 * - Inventory: "00001" (Hàng xá bánh phồng tôm)
 * - Stock: "KBH" (Kho bán hàng)
 * - Org Unit: "NB"
 */
export async function GET(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const token = await MisaService.getAccessToken(supabase);
        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = (settings as any)?.misa_config || {};
        const appId = config.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
        const apiUrl = (config.apiUrl || "https://actapp.misa.vn").replace(/\/$/, "");

        const today = new Date().toISOString().split('T')[0];
        const testRef = `TEST-${Date.now()}`;

        // ============ TEST 1: Minimal order with ALL EXISTING objects ============
        const minimalPayload = {
            app_id: appId,
            org_company_code: "NB",
            is_auto_create_object: true,
            voucher: [{
                voucher_type: 20,
                org_refid: testRef,
                org_refno: `TEST-MINI-${Math.floor(1000 + Math.random() * 9000)}`,
                refdate: today,
                // Use EXISTING customer from MISA
                account_object_code: "00335",
                account_object_name: "Dly mart",
                currency_id: "VND",
                exchange_rate: 1,
                organization_unit_code: "NB",
                order_status: 1,
                journal_memo: "Test order from debug",
                total_amount: 110000,
                total_amount_oc: 110000,
                total_sale_amount: 110000,
                total_sale_amount_oc: 110000,
                detail: [{
                    sort_order: 1,
                    // Use EXISTING inventory item
                    inventory_item_code: "00001",
                    inventory_item_name: "Hàng xá bánh phồng tôm",
                    description: "Test item",
                    quantity: 1,
                    unit_price: 110000,
                    amount: 110000,
                    amount_oc: 110000,
                    stock_code: "KBH",
                    exchange_rate_operator: "*",
                    main_convert_rate: 1,
                    main_quantity: 1,
                    main_unit_price: 110000,
                }]
            }]
        };

        const res1 = await fetch(`${apiUrl}/api/sync/actopen/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-MISA-AccessToken": token,
                "X-MISA-AppID": appId,
            },
            body: JSON.stringify(minimalPayload)
        });
        const text1 = await res1.text();

        // ============ TEST 2: Same but with NEW customer (auto-create test) ============
        const autoCreatePayload = {
            app_id: appId,
            org_company_code: "NB",
            is_auto_create_object: true,
            voucher: [{
                voucher_type: 20,
                org_refid: `${testRef}-AUTO`,
                org_refno: `TEST-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
                refdate: today,
                // NEW customer - should be auto-created
                account_object_code: "TEST-NEW-001",
                account_object_name: "Test New Customer",
                account_object_type: 1,
                is_customer: true,
                currency_id: "VND",
                exchange_rate: 1,
                organization_unit_code: "NB",
                order_status: 1,
                journal_memo: "Test auto-create customer",
                total_amount: 110000,
                total_amount_oc: 110000,
                total_sale_amount: 110000,
                total_sale_amount_oc: 110000,
                detail: [{
                    sort_order: 1,
                    // EXISTING item
                    inventory_item_code: "00001",
                    inventory_item_name: "Hàng xá bánh phồng tôm",
                    description: "Test item",
                    quantity: 1,
                    unit_price: 110000,
                    amount: 110000,
                    amount_oc: 110000,
                    stock_code: "KBH",
                    exchange_rate_operator: "*",
                    main_convert_rate: 1,
                    main_quantity: 1,
                    main_unit_price: 110000,
                }]
            }]
        };

        const res2 = await fetch(`${apiUrl}/api/sync/actopen/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-MISA-AccessToken": token,
                "X-MISA-AppID": appId,
            },
            body: JSON.stringify(autoCreatePayload)
        });
        const text2 = await res2.text();

        // ============ TEST 3: With NEW inventory item (auto-create test) ============
        const newItemPayload = {
            app_id: appId,
            org_company_code: "NB",
            is_auto_create_object: true,
            voucher: [{
                voucher_type: 20,
                org_refid: `${testRef}-NEWITEM`,
                org_refno: `TEST-NEWI-${Math.floor(1000 + Math.random() * 9000)}`,
                refdate: today,
                account_object_code: "00335",
                account_object_name: "Dly mart",
                currency_id: "VND",
                exchange_rate: 1,
                organization_unit_code: "NB",
                order_status: 1,
                journal_memo: "Test new inventory item",
                total_amount: 20000,
                total_amount_oc: 20000,
                total_sale_amount: 20000,
                total_sale_amount_oc: 20000,
                detail: [{
                    sort_order: 1,
                    // NEW inventory item - barcode like the real order
                    inventory_item_code: "8938540202023",
                    inventory_item_name: "Bánh tráng bơ Abi",
                    description: "Bánh tráng bơ Abi",
                    quantity: 1,
                    unit_price: 20000,
                    amount: 20000,
                    amount_oc: 20000,
                    stock_code: "KBH",
                    exchange_rate_operator: "*",
                    main_convert_rate: 1,
                    main_quantity: 1,
                    main_unit_price: 20000,
                }]
            }]
        };

        const res3 = await fetch(`${apiUrl}/api/sync/actopen/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-MISA-AccessToken": token,
                "X-MISA-AppID": appId,
            },
            body: JSON.stringify(newItemPayload)
        });
        const text3 = await res3.text();

        return NextResponse.json({
            success: true,
            tests: [
                {
                    name: "TEST 1: ALL EXISTING objects (customer=00335, item=00001, stock=KBH)",
                    status: res1.status,
                    response: text1.substring(0, 1000),
                },
                {
                    name: "TEST 2: NEW customer (auto-create) + existing item",
                    status: res2.status,
                    response: text2.substring(0, 1000),
                },
                {
                    name: "TEST 3: Existing customer + NEW inventory item (barcode 8938540202023)",
                    status: res3.status,
                    response: text3.substring(0, 1000),
                }
            ]
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
