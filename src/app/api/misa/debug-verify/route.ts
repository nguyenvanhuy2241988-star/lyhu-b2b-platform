
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

        // Config
        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = settings?.misa_config || {};
        const customAppId = config.appId;
        const defaultAppId = "84318d18-5a63-4422-b94f-40e87d60567e";
        const companyCode = config.companyCode?.trim();
        const apiUrl = (config.apiUrl || "https://actapp.misa.vn").replace(/\/$/, "");
        const readUrl = `${apiUrl}/api/sync/actopen/get_dictionary`;

        const results = [];

        // Helper
        const runTest = async (name: string, payload: any, headers: any) => {
            try {
                const res = await fetch(readUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...headers },
                    body: JSON.stringify(payload)
                });
                const text = await res.text();
                return {
                    test: name,
                    status: res.status,
                    payload_echo: payload,
                    response: text.substring(0, 500) // Increase limit to see more error details 
                };
            } catch (e: any) {
                return { test: name, error: e.message, payload_echo: payload };
            }
        };

        // FINAL PROBE: Clean, Simple, Echo Payload with Echo Payload

        const branchId = config.branchId || null;

        // Test 1: Stock (Type 2) with Configured Company Code
        results.push(await runTest("1. Stock (Type 2) [Configured CC]", {
            app_id: customAppId || defaultAppId,
            ...(companyCode ? { org_company_code: companyCode } : {}),
            dictionary_type: 2,
            skip: 0,
            take: 5
        }, { "X-MISA-AccessToken": token, "X-MISA-AppID": customAppId || defaultAppId }));

        // Test 2: Employee (Type 3) with Configured Company Code
        results.push(await runTest("2. Employee (Type 3) [Configured CC]", {
            app_id: customAppId || defaultAppId,
            ...(companyCode ? { org_company_code: companyCode } : {}),
            dictionary_type: 3,
            skip: 0,
            take: 5
        }, { "X-MISA-AccessToken": token, "X-MISA-AppID": customAppId || defaultAppId }));

        // Test 3: Employee (Type 3) with NO Company Code (Fallback check)
        results.push(await runTest("3. Employee (Type 3) [NO CC]", {
            app_id: customAppId || defaultAppId,
            dictionary_type: 3,
            skip: 0,
            take: 5
        }, { "X-MISA-AccessToken": token, "X-MISA-AppID": customAppId || defaultAppId }));

        return NextResponse.json({
            success: true,
            debug_info: {
                app_id: customAppId || defaultAppId,
                company_code: companyCode,
                branch_id: branchId
            },
            results
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
