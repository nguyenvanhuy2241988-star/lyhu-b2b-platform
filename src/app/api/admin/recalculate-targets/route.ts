import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { defaultBrands, calculateDynamicTarget } from '@/lib/nppData';
import { provinceDemographics } from '@/lib/demographics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        // Fetch existing
        const { data: existingRows, error: fetchError } = await supabase
            .from('npp_targets')
            .select('*');

        if (fetchError) throw fetchError;

        const allProvinces = Object.keys(provinceDemographics);
        let updatedCount = 0;

        for (const province of allProvinces) {
            const existingRow = existingRows?.find(r => r.province_name === province);
            let provinceData = existingRow?.data || { brands: {} };

            // Recalculate targets for all 4 brands
            defaultBrands.forEach(brand => {
                if (!provinceData.brands[brand]) {
                    provinceData.brands[brand] = { target: 0, currentSales: 0, hasNPP: false };
                }
                // Update target ONLY (preserve sales and hasNPP)
                provinceData.brands[brand].target = calculateDynamicTarget(province, brand);
            });

            // Upsert back to DB
            const { error: upsertError } = await supabase
                .from('npp_targets')
                .upsert({
                    province_name: province,
                    data: provinceData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'province_name' });

            if (upsertError) {
                console.error("Error upserting", province, upsertError);
            } else {
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
