import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// POST /api/misa/batch-map — Batch update misa_code for multiple products
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mappings } = body; // Array of { product_id: string, misa_code: string }

        if (!Array.isArray(mappings) || mappings.length === 0) {
            return NextResponse.json({ success: false, error: 'No mappings provided' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        let updated = 0;
        let errors: string[] = [];

        for (const m of mappings) {
            if (!m.product_id || !m.misa_code) continue;
            const updateData: any = { misa_code: m.misa_code };
            if (m.name) updateData.name = m.name; // Sync name from MISA
            const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', m.product_id);

            if (error) {
                errors.push(`${m.product_id}: ${error.message}`);
            } else {
                updated++;
            }
        }

        return NextResponse.json({
            success: true,
            updated,
            total: mappings.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error('[MISA Batch Map] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
