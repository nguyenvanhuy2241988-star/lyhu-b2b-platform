import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MisaService } from "@/lib/misa/misaService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
            await supabaseAdmin.from("inventory_sync_log").insert({
                sync_type: "misa_pull", items_synced: 0, items_changed: 0,
                status: "failed", error: misaResult.error || "Failed to fetch from MISA",
                details: { _debug: misaResult._debug },
            });
            return NextResponse.json({ success: false, error: misaResult.error, _debug: misaResult._debug }, { status: 400 });
        }

        const misaItems = misaResult.items;
        console.log(`[Inventory Sync] Got ${misaItems.length} items from MISA`);

        // 2. Aggregate MISA items by code (sum quantity across warehouses)
        const misaAggregated = new Map<string, { name: string; totalQty: number }>();
        for (const item of misaItems) {
            const code = item.inventory_item_code.trim().toUpperCase();
            if (!code) continue;
            const existing = misaAggregated.get(code);
            if (existing) {
                existing.totalQty += item.quantity_on_hand;
            } else {
                misaAggregated.set(code, {
                    name: item.inventory_item_name,
                    totalQty: item.quantity_on_hand,
                });
            }
        }
        console.log(`[Inventory Sync] Aggregated to ${misaAggregated.size} unique products`);

        // 3. Fetch products + warehouse + current levels in parallel
        const [productsRes, warehousesRes, levelsRes] = await Promise.all([
            supabaseAdmin.from("products").select("id, name, sku, misa_code").not("misa_code", "is", null),
            supabaseAdmin.from("warehouses").select("id").eq("status", "active").order("created_at", { ascending: true }).limit(1),
            supabaseAdmin.from("inventory_levels").select("product_id, quantity_on_hand, warehouse_id"),
        ]);

        const products = productsRes.data || [];
        const warehouseId = warehousesRes.data?.[0]?.id;
        if (!warehouseId) {
            return NextResponse.json({ success: false, error: "No active warehouse found" }, { status: 400 });
        }

        // 4. Build maps
        const productMap = new Map<string, { id: string; name: string; sku: string }>();
        for (const p of products) {
            if (p.misa_code) productMap.set(p.misa_code.trim().toUpperCase(), { id: p.id, name: p.name, sku: p.sku });
        }

        const currentMap = new Map<string, number>();
        for (const l of levelsRes.data || []) {
            if (l.warehouse_id === warehouseId) {
                currentMap.set(l.product_id, l.quantity_on_hand || 0);
            }
        }

        // 5. Find changes needed
        let itemsSynced = 0;
        let itemsChanged = 0;
        const changes: { product: string; sku: string; misaCode: string; oldQty: number; newQty: number }[] = [];
        const unmatchedMisa: string[] = [];
        const upsertBatch: any[] = [];
        const transactionBatch: any[] = [];

        for (const [code, misaData] of misaAggregated) {
            const matched = productMap.get(code);
            if (!matched) {
                unmatchedMisa.push(code);
                continue;
            }

            itemsSynced++;
            const currentQty = currentMap.get(matched.id) ?? 0;
            const misaQty = Math.max(0, misaData.totalQty); // Clamp negative to 0

            if (currentQty !== misaQty) {
                upsertBatch.push({
                    warehouse_id: warehouseId,
                    product_id: matched.id,
                    quantity_on_hand: misaQty,
                    updated_at: new Date().toISOString(),
                });
                transactionBatch.push({
                    warehouse_id: warehouseId,
                    product_id: matched.id,
                    type: "adjustment",
                    quantity: misaQty - currentQty,
                    reference_type: "misa_sync",
                    note: `Đồng bộ MISA: ${currentQty} → ${misaQty}`,
                });
                changes.push({
                    product: matched.name,
                    sku: matched.sku,
                    misaCode: code,
                    oldQty: currentQty,
                    newQty: misaQty,
                });
                itemsChanged++;
            }
        }

        // 6. Batch upsert (chunked to avoid too-large requests)
        const CHUNK_SIZE = 50;
        for (let i = 0; i < upsertBatch.length; i += CHUNK_SIZE) {
            const chunk = upsertBatch.slice(i, i + CHUNK_SIZE);
            const { error } = await supabaseAdmin
                .from("inventory_levels")
                .upsert(chunk, { onConflict: "warehouse_id,product_id" });
            if (error) {
                console.error(`[Inventory Sync] Batch upsert error (chunk ${i}):`, error);
            }
        }

        // 7. Batch insert transactions
        if (transactionBatch.length > 0) {
            for (let i = 0; i < transactionBatch.length; i += CHUNK_SIZE) {
                const chunk = transactionBatch.slice(i, i + CHUNK_SIZE);
                await supabaseAdmin.from("inventory_transactions").insert(chunk);
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[Inventory Sync] Done in ${elapsed}ms. Synced: ${itemsSynced}, Changed: ${itemsChanged}`);

        // 8. Log sync result
        await supabaseAdmin.from("inventory_sync_log").insert({
            sync_type: "misa_pull",
            items_synced: itemsSynced,
            items_changed: itemsChanged,
            status: "success",
            details: {
                elapsed_ms: elapsed,
                total_misa_items: misaItems.length,
                aggregated_items: misaAggregated.size,
                total_app_products: products.length,
                matched: itemsSynced,
                unmatched_misa: unmatchedMisa.length,
                unmatched_codes: unmatchedMisa.slice(0, 20),
                changes: changes.slice(0, 50),
            },
        });

        return NextResponse.json({
            success: true,
            summary: {
                misaItems: misaItems.length,
                aggregatedItems: misaAggregated.size,
                appProducts: products.length,
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
                sync_type: "misa_pull", items_synced: 0, items_changed: 0,
                status: "failed", error: err.message,
            });
        } catch (_) { }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// GET for browser debug / Vercel Cron
export async function GET() { return handleSync(); }

// POST for UI button
export async function POST() { return handleSync(); }
