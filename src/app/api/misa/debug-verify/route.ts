
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

        // TEST A: Standard (Custom AppID if set, else Default)
        results.push(await runTest("A: Standard Config", {
            app_id: customAppId || defaultAppId,
            org_company_code: companyCode,
            dictionary_type: 2
        }, {
            "X-MISA-AccessToken": token,
            "X-MISA-AppID": customAppId || defaultAppId
        }));

        // TEST B: Force Default AppID (If user is using custom)
        if (customAppId && customAppId !== defaultAppId) {
            results.push(await runTest("B: Force Default AppID", {
                app_id: defaultAppId,
                org_company_code: companyCode,
                dictionary_type: 2
            }, {
                "X-MISA-AccessToken": token,
                "X-MISA-AppID": defaultAppId
            }));
        }

        // TEST C: No Company Code in Body
        results.push(await runTest("C: No Body CompanyCode", {
            app_id: customAppId || defaultAppId,
            dictionary_type: 2
        }, {
            "X-MISA-AccessToken": token,
            "X-MISA-AppID": customAppId || defaultAppId
        }));

        // TEST D: Authorization Header Bearer
        results.push(await runTest("D: Auth Bearer Header", {
            app_id: customAppId || defaultAppId,
            org_company_code: companyCode,
            dictionary_type: 2
        }, {
            "Authorization": `Bearer ${token}`,
            "X-MISA-AppID": customAppId || defaultAppId
        }));

        // TEST PROBE REVISITED: Type 2 (Stock) worked with take:5 before. Probe failed with take:1.
        // So we retry specific types with take:5.

        // TEST REFACTOR: Echo Payload to find the working combination
        const branchId = config.branchId || null;

        // V1: Type 2, No Company Code, No Branch
        results.push(await runTest("V1: Stock (NoCC, NoBranch)", {
            app_id: customAppId || defaultAppId,
            dictionary_type: 2,
            skip: 0,
            take: 5
        }, { "X-MISA-AccessToken": token, "X-MISA-AppID": customAppId || defaultAppId }));

        // V2: Type 2, Empty Company Code, No Branch
        results.push(await runTest("V2: Stock (EmptyCC, NoBranch)", {
            app_id: customAppId || defaultAppId,
            org_company_code: "",
            dictionary_type: 2,
            skip: 0,
            take: 5
        }, { "X-MISA-AccessToken": token, "X-MISA-AppID": customAppId || defaultAppId }));

        // V3: Type 2, With Branch (if configured), No CC
        results.push(await runTest("V3: Stock (Branch, NoCC)", {
            app_id: customAppId || defaultAppId,
            branch_id: branchId,
            dictionary_type: 2,
            skip: 0,
            take: 5
        }, { "X-MISA-AccessToken": token, "X-MISA-AppID": customAppId || defaultAppId }));

        // V4: Type 3 (Employee), No CC
        results.push(await runTest("V4: Employee (NoCC)", {
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
