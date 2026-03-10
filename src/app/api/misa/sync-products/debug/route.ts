import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MisaService } from '@/lib/misa/misaService';

export const dynamic = 'force-dynamic';

// GET /api/misa/sync-products/debug — Try all data_types to find inventory items
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Get token and config
        const token = await MisaService.getAccessToken(supabase);
        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const config = (settings as any)?.misa_config || {};
        const appId = config?.appId || "84318d18-5a63-4422-b94f-40e87d60567e";
        const companyCode = config?.companyCode?.trim() || "NB";

        const endpoint = "https://actapp.misa.vn/api/sync/actopen/get_dictionary";
        const results: Record<string, any> = {};

        // Try data_type 0, 1, 2, 3, 4, 5
        for (const dt of [0, 1, 2, 3, 4, 5]) {
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-MISA-AccessToken": token,
                        "X-MISA-AppID": appId,
                    },
                    body: JSON.stringify({
                        app_id: appId,
                        org_company_code: companyCode,
                        data_type: dt,
                        last_sync_time: "2000-01-01 00:00:00"
                    })
                });
                const text = await res.text();
                let parsed: any = null;
                try { parsed = JSON.parse(text); } catch (e) { }

                // Try to extract Data
                let dataInfo = 'N/A';
                if (parsed?.Data) {
                    if (typeof parsed.Data === 'string') {
                        try {
                            const arr = JSON.parse(parsed.Data);
                            dataInfo = `string → parsed array (${Array.isArray(arr) ? arr.length : 'not array'} items)`;
                            if (Array.isArray(arr) && arr.length > 0) {
                                dataInfo += ` | keys: ${Object.keys(arr[0]).join(', ')}`;
                            }
                        } catch (e) {
                            dataInfo = `string (${parsed.Data.length} chars): ${parsed.Data.substring(0, 100)}`;
                        }
                    } else if (Array.isArray(parsed.Data)) {
                        dataInfo = `array (${parsed.Data.length} items)`;
                    } else {
                        dataInfo = `${typeof parsed.Data}: ${JSON.stringify(parsed.Data).substring(0, 100)}`;
                    }
                }

                results[`data_type_${dt}`] = {
                    status: res.status,
                    success: parsed?.Success,
                    dataInfo,
                    customDataMessage: parsed?.CustomData?.Message || null,
                };
            } catch (e: any) {
                results[`data_type_${dt}`] = { error: e.message };
            }
        }

        return NextResponse.json({
            config: { appId, companyCode },
            results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
