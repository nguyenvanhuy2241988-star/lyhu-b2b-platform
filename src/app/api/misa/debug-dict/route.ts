
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to query MISA dictionaries and find employees.
 * GET /api/misa/debug-dict
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

        const results: any[] = [];

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
                        take: 5
                    })
                });
                const text = await res.text();
                return { test: name, status: res.status, response: text.substring(0, 2000) };
            } catch (e: any) {
                return { test: name, error: e.message };
            }
        };

        // Query ALL dictionary types 1-10 to find where Employees are
        for (let i = 1; i <= 10; i++) {
            results.push(await testGetDict(`GET data_type=${i}`, i));
        }

        return NextResponse.json({
            success: true,
            token_preview: token ? `${token.substring(0, 15)}...` : "null",
            config_preview: {
                appId,
                companyCode: config.companyCode,
                employeeCode: config.employeeCode || "NOT SET (no default)",
            },
            results
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
