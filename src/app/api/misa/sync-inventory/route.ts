import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function handleSync() {
    const startTime = Date.now();
    console.log("[Inventory Sync] Starting MISA → App inventory sync...");

    try {
        // 1. Fetch inventory from MISA
        const misaResult = await MisaService.fetchInventoryStock(supabaseAdmin);

        if (!misaResult.success || !misaResult.items) {
            // Log failure
            await supabaseAdmin.from("inventory_sync_log").insert({
                sync_type: "misa_pull",
                items_synced: 0,
                items_changed: 0,
                status: "failed",
                error: misaResult.error || "Failed to fetch from MISA",
                details: { _debug: misaResult._debug },
            });

            return NextResponse.json({
                success: false,
                error: misaResult.error,
                _debug: misaResult._debug,
            }, { status: 400 });
        }

        const misaItems = misaResult.items;
        console.log(`[Inventory Sync] Got ${misaItems.length} items from MISA`);

        // 2. Fetch ALL products from App (with misa_code for matching)
        const { data: products, error: prodErr } = await supabaseAdmin
            .from("products")
            .select("id, name, sku, misa_code")
            .not("misa_code", "is", null);

        if (prodErr) {
            console.error("[Inventory Sync] Failed to fetch products:", prodErr);
            return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
        }

        // 3. Get default warehouse
        const { data: warehouses } = await supabaseAdmin
            .from("warehouses")
            .select("id")
            .eq("status", "active")
            .order("created_at", { ascending: true })
            .limit(1);

        const warehouseId = warehouses?.[0]?.id;
        if (!warehouseId) {
            return NextResponse.json({ success: false, error: "No active warehouse found" }, { status: 400 });
        }

        // 4. Build MISA code → product map
        const productMap = new Map<string, { id: string; name: string; sku: string }>();
        for (const p of products || []) {
            if (p.misa_code) {
                productMap.set(p.misa_code.trim().toUpperCase(), { id: p.id, name: p.name, sku: p.sku });
            }
        }

        // 5. Fetch current inventory levels
        const { data: currentLevels } = await supabaseAdmin
            .from("inventory_levels")
            .select("product_id, quantity_on_hand")
            .eq("warehouse_id", warehouseId);

        const currentMap = new Map<string, number>();
        for (const l of currentLevels || []) {
            currentMap.set(l.product_id, l.quantity_on_hand || 0);
        }

        // 6. Compare & Update
        let itemsSynced = 0;
        let itemsChanged = 0;
        const changes: { product: string; sku: string; misaCode: string; oldQty: number; newQty: number }[] = [];
        const unmatchedMisa: string[] = [];

        for (const misaItem of misaItems) {
            const code = misaItem.inventory_item_code.trim().toUpperCase();
            const matched = productMap.get(code);

            if (!matched) {
                unmatchedMisa.push(code);
                continue;
            }

            itemsSynced++;
            const currentQty = currentMap.get(matched.id) ?? 0;
            const misaQty = misaItem.quantity_on_hand;

            // Only update if quantity differs
            if (currentQty !== misaQty) {
                // Upsert inventory_levels — only write quantity_on_hand
                // (quantity_available is a generated column, auto-calculated by DB)
                const { error: upsertErr } = await supabaseAdmin
                    .from("inventory_levels")
                    .upsert({
                        warehouse_id: warehouseId,
                        product_id: matched.id,
                        quantity_on_hand: misaQty,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: "warehouse_id,product_id",
                    });

                if (!upsertErr) {
                    itemsChanged++;
                    changes.push({
                        product: matched.name,
                        sku: matched.sku,
                        misaCode: code,
                        oldQty: currentQty,
                        newQty: misaQty,
                    });

                    // Log as inventory_transaction
                    const diff = misaQty - currentQty;
                    await supabaseAdmin.from("inventory_transactions").insert({
                        warehouse_id: warehouseId,
                        product_id: matched.id,
                        type: "adjustment",
                        quantity: diff,
                        reference_type: "misa_sync",
                        note: `Đồng bộ MISA: ${currentQty} → ${misaQty}`,
                    });
                } else {
                    console.error(`[Inventory Sync] Upsert error for ${code}:`, upsertErr);
                }
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[Inventory Sync] Done in ${elapsed}ms. Synced: ${itemsSynced}, Changed: ${itemsChanged}`);

        // 7. Log sync result
        await supabaseAdmin.from("inventory_sync_log").insert({
            sync_type: "misa_pull",
            items_synced: itemsSynced,
            items_changed: itemsChanged,
            status: "success",
            details: {
                elapsed_ms: elapsed,
                total_misa_items: misaItems.length,
                total_app_products: products?.length || 0,
                matched: itemsSynced,
                unmatched_misa: unmatchedMisa.length,
                changes: changes.slice(0, 50), // Limit log size
                has_quantity_field: misaResult._debug?.hasQuantityField,
            },
        });

        return NextResponse.json({
            success: true,
            summary: {
                misaItems: misaItems.length,
                appProducts: products?.length || 0,
                matched: itemsSynced,
                changed: itemsChanged,
                elapsed_ms: elapsed,
            },
            changes: changes.slice(0, 20),
            _debug: misaResult._debug,
        });

    } catch (err: any) {
        console.error("[Inventory Sync] Error:", err);

        try {
            await supabaseAdmin.from("inventory_sync_log").insert({
                sync_type: "misa_pull",
                items_synced: 0,
                items_changed: 0,
                status: "failed",
                error: err.message,
            });
        } catch (_) { }

        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// GET for browser debug / Vercel Cron
export async function GET() { return handleSync(); }

// POST for UI button
export async function POST() { return handleSync(); }
