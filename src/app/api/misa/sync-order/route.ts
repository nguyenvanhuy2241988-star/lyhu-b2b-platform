import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";

// Initialize Supabase Admin Client to bypass RLS for system operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        // 1. Fetch Full Order Details from DB
        const { data: orders, error: fetchError } = await supabaseAdmin
            .from("orders")
            .select(`
                *,
                items:order_items (
                    *,
                    product:products(id, sku, name, misa_code)
                ),
                customer:customers(id, name, misa_code)
            `)
            .eq("id", orderId)
            .single();

        if (fetchError || !orders) {
            console.error("Order fetch error:", fetchError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const order = orders;

        // 2. Validate Mappings
        const missingProductMaps = order.items.filter((i: any) => !i.product?.misa_code);
        // We warn but don't hard block, or maybe we block? Let's log for now.
        if (missingProductMaps.length > 0) {
            console.warn(`Order ${orderId} has items without Misa Code:`, missingProductMaps.map((i: any) => i.product?.sku));
        }

        // Debug: Log what product codes we're about to send
        const productCodeDebug = order.items.map((i: any) => ({
            name: i.product?.name || i.name,
            misa_code: i.product?.misa_code || "MISSING",
            sku: i.product?.sku || i.sku
        }));
        console.log(`[Sync] Order ${orderId} Product Codes:`, JSON.stringify(productCodeDebug));

        // 3. Push to Misa
        const result = await MisaService.pushSalesOrder(orderId, order, supabaseAdmin);

        // Add debug info to result
        (result as any).debug = { productCodes: productCodeDebug };

        // 4. Update Status in DB
        const updateData: any = {
            misa_last_sync_at: new Date().toISOString(),
            misa_sync_status: result.success ? "synced" : "failed",
            misa_sync_error: result.error || null,
        };

        if (result.success && result.refId) {
            updateData.misa_ref_id = result.refId;
        }

        await supabaseAdmin
            .from("orders")
            .update(updateData)
            .eq("id", orderId);

        return NextResponse.json(result);

    } catch (err: any) {
        console.error("API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
