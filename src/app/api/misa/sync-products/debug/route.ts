import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Comprehensive debug: try all combinations of company codes, API paths, and auth
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = (settings as any)?.misa_config || {};
        const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
        const accessCode = config?.accessCode;
        const configCompanyCode = config?.companyCode?.trim() || "UNKNOWN";

        const results: Record<string, any> = {};

        // Step 1: Try auth with different company codes
        const companyCodes = ["NB", configCompanyCode];
        const authTokens: Record<string, string> = {};

        for (const cc of companyCodes) {
            try {
                const authRes = await fetch("https://actapp.misa.vn/api/oauth/actopen/connect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        app_id: appId,
                        access_code: accessCode,
                        org_company_code: cc
                    })
                });
                const authData = await authRes.json();
                if (authData?.Success && authData?.Data) {
                    let token = authData.Data;
                    if (typeof token === 'string' && token.trim().startsWith('{')) {
                        try { const p = JSON.parse(token); if (p.access_token) token = p.access_token; } catch (e) { }
                    }
                    authTokens[cc] = token;
                    results[`auth_${cc}`] = { success: true, tokenLength: token.length };
                } else {
                    results[`auth_${cc}`] = { success: false, response: JSON.stringify(authData).substring(0, 200) };
                }
            } catch (e: any) {
                results[`auth_${cc}`] = { error: e.message };
            }
        }

        // Step 2: Try dictionary with each token + each company code + both API paths
        const apiPaths = ["/api/sync/actopen/get_dictionary", "/apir/sync/actopen/get_dictionary"];

        for (const [authCC, token] of Object.entries(authTokens)) {
            for (const path of apiPaths) {
                for (const dictCC of companyCodes) {
                    const key = `auth:${authCC}_path:${path.includes('apir') ? 'apir' : 'api'}_dict:${dictCC}`;
                    try {
                        const res = await fetch(`https://actapp.misa.vn${path}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-MISA-AccessToken": token,
                                "X-MISA-AppID": appId,
                            },
                            body: JSON.stringify({
                                app_id: appId,
                                org_company_code: dictCC,
                                data_type: 2,
                                last_sync_time: "2000-01-01 00:00:00"
                            })
                        });
                        const text = await res.text();
                        let parsed: any = null;
                        try { parsed = JSON.parse(text); } catch (e) { }

                        let itemCount = 'N/A';
                        if (parsed?.Data) {
                            if (typeof parsed.Data === 'string') {
                                try {
                                    const arr = JSON.parse(parsed.Data);
                                    itemCount = Array.isArray(arr) ? `${arr.length} items` : 'not array';
                                    if (Array.isArray(arr) && arr.length > 0) {
                                        itemCount += ` | sample keys: ${Object.keys(arr[0]).slice(0, 5).join(',')}`;
                                    }
                                } catch (e) {
                                    itemCount = `string(${parsed.Data.length}): ${parsed.Data.substring(0, 50)}`;
                                }
                            } else if (Array.isArray(parsed.Data)) {
                                itemCount = `${parsed.Data.length} items (direct array)`;
                            }
                        }

                        results[key] = {
                            status: res.status,
                            success: parsed?.Success,
                            items: itemCount,
                            message: parsed?.CustomData?.Message || null,
                        };
                    } catch (e: any) {
                        results[key] = { error: e.message };
                    }
                }
            }
        }

        return NextResponse.json({
            config: { appId, configCompanyCode, hasAccessCode: !!accessCode },
            results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
