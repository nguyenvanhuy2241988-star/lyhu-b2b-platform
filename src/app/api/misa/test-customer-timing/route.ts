
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30s for this test

/**
 * Test: Create customer via save_dictionary, then poll until it appears in MISA.
 * GET /api/misa/test-customer-timing
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

        const testCode = `POLL-${Date.now().toString().slice(-6)}`;
        const log: any[] = [];

        // Step 1: Create customer via save_dictionary
        const createRes = await fetch(`${apiUrl}/api/sync/actopen/save_dictionary`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-MISA-AccessToken": token,
            },
            body: JSON.stringify({
                app_id: appId,
                org_company_code: "NB",
                dictionary_type: 1,
                account_objects: [{
                    account_object_code: testCode,
                    account_object_name: `Test Poll Customer ${testCode}`,
                    account_object_type: 1,
                    is_customer: true,
                    is_vendor: false,
                }]
            })
        });
        const createText = await createRes.text();
        log.push({ step: "CREATE", time: new Date().toISOString(), status: createRes.status, response: createText.substring(0, 500) });

        // Step 2: Poll get_dictionary to check if customer exists
        // Check every 2 seconds for up to 20 seconds
        let found = false;
        for (let i = 1; i <= 10; i++) {
            await new Promise(r => setTimeout(r, 2000));

            const pollRes = await fetch(`${apiUrl}/api/sync/actopen/get_dictionary`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                },
                body: JSON.stringify({
                    app_id: appId,
                    org_company_code: "NB",
                    data_type: 1,
                    skip: 0,
                    take: 200 // Get all customers to search
                })
            });

            const pollText = await pollRes.text();
            const hasCustomer = pollText.includes(testCode);
            log.push({
                step: `POLL ${i} (${i * 2}s)`,
                time: new Date().toISOString(),
                found: hasCustomer,
                response_length: pollText.length,
            });

            if (hasCustomer) {
                found = true;
                break;
            }
        }

        // Step 3: If found, try pushing an order with this customer
        let orderResult = null;
        if (found) {
            const orderRes = await fetch(`${apiUrl}/api/sync/actopen/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                },
                body: JSON.stringify({
                    app_id: appId,
                    org_company_code: "NB",
                    is_auto_create_object: true,
                    voucher: [{
                        voucher_type: 20,
                        org_refid: `ORDER-${testCode}`,
                        org_refno: `TEST-POLL-${testCode}`,
                        refdate: new Date().toISOString().split('T')[0],
                        account_object_code: testCode,
                        account_object_name: `Test Poll Customer ${testCode}`,
                        currency_id: "VND",
                        exchange_rate: 1,
                        organization_unit_code: "NB",
                        order_status: 1,
                        journal_memo: "Test with polled customer",
                        total_amount: 20000,
                        total_amount_oc: 20000,
                        detail: [{
                            sort_order: 1,
                            inventory_item_code: "00001",
                            inventory_item_name: "Test",
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
                })
            });
            const orderText = await orderRes.text();
            orderResult = { status: orderRes.status, response: orderText.substring(0, 500) };
        }

        return NextResponse.json({
            success: true,
            customer_code: testCode,
            customer_found_in_misa: found,
            order_pushed: orderResult,
            log
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
