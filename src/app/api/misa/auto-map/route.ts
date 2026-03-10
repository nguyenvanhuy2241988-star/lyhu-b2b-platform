import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MisaService } from '@/lib/misa/misaService';

export const dynamic = 'force-dynamic';

// POST /api/misa/auto-map — Auto-match products by SKU
export async function POST(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Get all products without misa_code from Supabase
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, sku, name, misa_code')
            .is('misa_code', null)
            .order('name');

        if (prodError) {
            return NextResponse.json({ success: false, error: `DB Error: ${prodError.message}` }, { status: 500 });
        }

        if (!products || products.length === 0) {
            return NextResponse.json({ success: true, matched: 0, unmatched: 0, message: 'Tất cả sản phẩm đã được map!' });
        }

        // 2. Fetch inventory items from MISA
        const misaResult = await MisaService.fetchInventoryItems(supabase);
        if (!misaResult.success || !misaResult.items) {
            return NextResponse.json({ success: false, error: `MISA Error: ${misaResult.error}` }, { status: 400 });
        }

        // 3. Build lookup map: inventory_item_code -> misa item (case-insensitive)
        const misaMap = new Map<string, any>();
        for (const item of misaResult.items) {
            if (item.inventory_item_code) {
                misaMap.set(item.inventory_item_code.trim().toUpperCase(), item);
            }
        }

        // 4. Match and update
        let matched = 0;
        let unmatched = 0;
        const matchedDetails: any[] = [];
        const unmatchedDetails: any[] = [];

        for (const product of products) {
            const sku = (product.sku || '').trim().toUpperCase();
            if (!sku) {
                unmatched++;
                unmatchedDetails.push({ id: product.id, name: product.name, sku: product.sku, reason: 'No SKU' });
                continue;
            }

            const misaItem = misaMap.get(sku);
            if (misaItem) {
                // Match found — update product.misa_code
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ misa_code: misaItem.inventory_item_code })
                    .eq('id', product.id);

                if (!updateError) {
                    matched++;
                    matchedDetails.push({
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        misa_code: misaItem.inventory_item_code,
                        misa_name: misaItem.inventory_item_name,
                    });
                } else {
                    unmatched++;
                    unmatchedDetails.push({ id: product.id, name: product.name, sku: product.sku, reason: `DB update failed: ${updateError.message}` });
                }
            } else {
                unmatched++;
                unmatchedDetails.push({ id: product.id, name: product.name, sku: product.sku, reason: 'SKU not found in MISA' });
            }
        }

        console.log(`[MISA Auto-Map] Done. Matched: ${matched}, Unmatched: ${unmatched}`);
        return NextResponse.json({
            success: true,
            matched,
            unmatched,
            total_products: products.length,
            total_misa_items: misaResult.items.length,
            matched_details: matchedDetails,
            unmatched_details: unmatchedDetails.slice(0, 20), // Limit for response size
        });
    } catch (error: any) {
        console.error('[MISA Auto-Map] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
