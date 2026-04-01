import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Debug: Try ALL data_types (1-10) to find which ones return inventory data
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
        const companyCode = "NB";

        // Step 1: Auth
        const authRes = await fetch("https://actapp.misa.vn/api/oauth/actopen/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ app_id: appId, access_code: accessCode, org_company_code: companyCode })
        });
        const authData = await authRes.json();

        if (!authData?.Success || !authData?.Data) {
            return NextResponse.json({ error: "Auth failed", authData });
        }

        let token = authData.Data;
        if (typeof token === 'string' && token.trim().startsWith('{')) {
            try { const p = JSON.parse(token); if (p.access_token) token = p.access_token; } catch (e) { }
        }

        // Step 2: Try data_types 1-10
        const results: Record<string, any> = {};

        for (let dt = 1; dt <= 10; dt++) {
            try {
                const res = await fetch("https://actapp.misa.vn/apir/sync/actopen/get_dictionary", {
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

                let itemInfo = 'N/A';
                let sampleKeys: string[] = [];
                let sampleItem: any = null;

                if (parsed?.Data) {
                    let items: any[] = [];
                    if (typeof parsed.Data === 'string') {
                        try { items = JSON.parse(parsed.Data); } catch (e) { }
                    } else if (Array.isArray(parsed.Data)) {
                        items = parsed.Data;
                    }

                    if (Array.isArray(items)) {
                        itemInfo = `${items.length} items`;
                        if (items.length > 0) {
                            sampleKeys = Object.keys(items[0]);
                            sampleItem = items[0];
                        }
                    }
                }

                results[`data_type_${dt}`] = {
                    status: res.status,
                    success: parsed?.Success,
                    items: itemInfo,
                    sampleKeys,
                    sampleItem: sampleItem ? JSON.stringify(sampleItem).substring(0, 500) : null,
                };
            } catch (e: any) {
                results[`data_type_${dt}`] = { error: e.message };
            }
        }

        // Step 3: Also try get_voucher endpoints for stock data
        const voucherTypes = [
            { type: 20, name: "Đơn đặt hàng" },
            { type: 30, name: "Hóa đơn bán hàng" },
            { type: 40, name: "Phiếu nhập kho" },
            { type: 50, name: "Phiếu xuất kho" },
        ];

        for (const vt of voucherTypes) {
            try {
                const res = await fetch("https://actapp.misa.vn/apir/sync/actopen/get_voucher", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-MISA-AccessToken": token,
                        "X-MISA-AppID": appId,
                    },
                    body: JSON.stringify({
                        app_id: appId,
                        org_company_code: companyCode,
                        voucher_type: vt.type,
                        last_sync_time: "2000-01-01 00:00:00"
                    })
                });
                const text = await res.text();
                let parsed: any = null;
                try { parsed = JSON.parse(text); } catch (e) { }

                let count = 'N/A';
                if (parsed?.Data) {
                    let items: any[] = [];
                    if (typeof parsed.Data === 'string') {
                        try { items = JSON.parse(parsed.Data); } catch (e) { }
                    } else if (Array.isArray(parsed.Data)) {
                        items = parsed.Data;
                    }
                    count = Array.isArray(items) ? `${items.length} vouchers` : typeof parsed.Data;
                }

                results[`voucher_${vt.type}_${vt.name}`] = {
                    status: res.status,
                    success: parsed?.Success,
                    items: count,
                };
            } catch (e: any) {
                results[`voucher_${vt.type}`] = { error: e.message };
            }
        }

        return NextResponse.json({
            config: { appId, companyCode, hasAccessCode: !!accessCode },
            results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
