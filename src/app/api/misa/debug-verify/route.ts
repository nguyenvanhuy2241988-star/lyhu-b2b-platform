
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
                return { test: name, status: res.status, response: text.substring(0, 100) };
            } catch (e: any) {
                return { test: name, error: e.message };
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

        // TEST PROBE: Brute Force Types 1-9
        for (let typeId = 1; typeId <= 9; typeId++) {
            results.push(await runTest(`Probe Type ${typeId}`, {
                app_id: customAppId || defaultAppId,
                org_company_code: companyCode,
                dictionary_type: typeId,
                skip: 0,
                take: 1
            }, {
                "X-MISA-AccessToken": token,
                "X-MISA-AppID": customAppId || defaultAppId
            }));
        }

        return NextResponse.json({
            success: true,
            usedAppId: customAppId || defaultAppId,
            token_preview: {
                type: typeof token,
                is_string: typeof token === 'string',
                sample: typeof token === 'string' ? token.substring(0, 20) + "..." : JSON.stringify(token)
            },
            results
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
