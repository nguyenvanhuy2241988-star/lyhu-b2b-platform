import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";
import { MisaValidation } from "@/lib/misa/misaValidation";

// Allow up to 30 seconds — customer pre-creation needs 8+ seconds for MISA async processing
export const maxDuration = 30;
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
                    product:products(id, sku, name, misa_code, unit)
                ),
                customer:customers(id, name, phone, misa_code, tax_code)
            `)
            .eq("id", orderId)
            .single();

        if (fetchError || !orders) {
            console.error("Order fetch error:", fetchError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const order = orders;

        // 2. NEW: Validate Mappings BEFORE Sync
        // Helper to fetch settings
        const { data: settings } = await supabaseAdmin.from('app_settings').select('misa_config').single();
        const config = settings?.misa_config || {};

        const validation = MisaValidation.validateOrder(order, config);

        if (!validation.isValid) {
            console.error(`[MISA Sync] Validation Failed for Order ${orderId}:`, validation.errors);

            // Mark as failed in DB
            await supabaseAdmin
                .from("orders")
                .update({
                    misa_last_sync_at: new Date().toISOString(),
                    misa_sync_status: "failed",
                    misa_sync_error: validation.errors.join("\n")
                })
                .eq("id", orderId);

            return NextResponse.json({
                success: false,
                error: "Dữ liệu không hợp lệ: " + validation.errors.join(", "),
                details: validation.errors,
                warnings: validation.warnings
            }, { status: 400 });
        }

        // 3. Push to Misa (Only if valid)
        // Debug: Log what product codes we're about to send
        const productCodeDebug = order.items.map((i: any) => ({
            name: i.product?.name || i.name,
            misa_code: i.product?.misa_code || "MISSING",
            sku: i.product?.sku || i.sku
        }));
        console.log(`[Sync] Order ${orderId} Validated OK. Sending... Codes:`, JSON.stringify(productCodeDebug));

        const result = await MisaService.pushSalesOrder(orderId, order, supabaseAdmin);

        // Add debug info to result
        (result as any).debug = { productCodes: productCodeDebug };
        (result as any).warnings = validation.warnings; // Pass warnings back

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
