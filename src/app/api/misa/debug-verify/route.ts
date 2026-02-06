
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

        // 1. Get Config
        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = settings?.misa_config || {};
        const appId = config.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
        const companyCode = config.companyCode?.trim();
        const apiUrl = (config.apiUrl || "https://actapp.misa.vn").replace(/\/$/, "");

        const results = [];

        // TEST 1: READ Stocks (Dictionary Type 2)
        // This validates: Token, AppID, CompanyCode, and basic Gateway access.
        const readUrl = `${apiUrl}/api/sync/actopen/get_dictionary`;
        const payloadRead = {
            app_id: appId,
            org_company_code: companyCode,
            dictionary_type: 2 // 2 = MaterialGoods (Vật tư hàng hóa), 4 = Stock? check docs. 
            // Try 2 first.
        };

        try {
            const res1 = await fetch(readUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-MISA-AccessToken": token,
                    "X-MISA-AppID": appId
                },
                body: JSON.stringify(payloadRead)
            });
            const text1 = await res1.text();
            results.push({
                test: "Get Dictionary (Inventory Items)",
                status: res1.status,
                responseSample: text1.substring(0, 500)
            });
        } catch (e: any) {
            results.push({ test: "Get Dictionary", error: e.message });
        }

        // TEST 2: READ Config/Options? (If verify fails)

        return NextResponse.json({
            success: true,
            config: { appId, companyCode, apiUrl },
            results
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
