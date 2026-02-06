
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const token = await MisaService.getAccessToken(supabase);

        // 1. Get Config for AppID/CompanyCode
        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = settings?.misa_config || {};
        const appId = config.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
        const companyCode = config.companyCode?.trim();
        const apiUrl = (config.apiUrl || "https://actapp.misa.vn").replace(/\/$/, "");
        const saveUrl = `${apiUrl}/api/sync/actopen/save`;

        const results = [];

        // TEST 1: V5 Standard (Snake Case, 'voucher' key)
        const payloadV5 = {
            app_id: appId,
            org_company_code: companyCode,
            voucher: [{
                voucher_type: 11,
                reftype: 3560,
                refdate: "2026-02-06",
                posted_date: "2026-02-06",
                inv_date: "2026-02-06",
                org_refid: "00000000-0000-0000-0000-000000000000",
                org_refno: "TEST-V5-001",
                org_reftype_name: "Test V5",
                detail: [{
                    stock_code: "KHO",
                    inventory_item_code: "TEST_ITEM",
                    quantity: 1,
                    amount: 10000,
                    sort_order: 1
                }]
            }]
        };

        try {
            const res1 = await fetch(saveUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "X-MISA-AppID": appId
                },
                body: JSON.stringify(payloadV5)
            });
            const text1 = await res1.text();
            results.push({
                test: "V5 Standard (SnakeCase)",
                status: res1.status,
                response: text1
            });
        } catch (e: any) {
            results.push({ test: "V5 Standard", error: e.message });
        }

        // TEST 2: V2/Legacy (Pascal Case, 'data' key as JSON String)
        const payloadV2Data = [{
            RefType: 3560,
            RefDate: "2026-02-06T00:00:00",
            PostedDate: "2026-02-06T00:00:00",
            RefNo: "TEST-V2-001",
            Detail: [{
                InventoryItemCode: "TEST_ITEM",
                StockCode: "KHO",
                Quantity: 1,
                Amount: 10000
            }]
        }];

        const payloadV2 = {
            app_id: appId,
            org_company_code: companyCode,
            data: JSON.stringify(payloadV2Data)
        };

        try {
            const res2 = await fetch(saveUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "X-MISA-AppID": appId
                },
                body: JSON.stringify(payloadV2)
            });
            const text2 = await res2.text();
            results.push({
                test: "V2 Legacy (PascalCase, data string)",
                status: res2.status,
                response: text2
            });
        } catch (e: any) {
            results.push({ test: "V2 Legacy", error: e.message });
        }

        return NextResponse.json({
            success: true,
            config: { appId, companyCode, apiUrl },
            results
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
