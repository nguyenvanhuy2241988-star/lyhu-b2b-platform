import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { defaultBrands, quangNinhTargets } from '@/lib/nppData';
import { provinceDemographics } from '@/lib/demographics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function calculateDynamicTarget(provinceName: string, brand: string): number {
    const baseTarget = quangNinhTargets[brand] || 30000000;
    const demo = provinceDemographics[provinceName];
    const baseDemo = provinceDemographics["Quảng Ninh"];
    
    if (!demo || !baseDemo) return baseTarget;

    const popRatio = demo.population / baseDemo.population;
    const gdpRatio = demo.gdp / baseDemo.gdp;
    const incomeRatio = demo.perCapitaIncome / baseDemo.perCapitaIncome;
    const areaRatio = demo.area / baseDemo.area;

    const scaleFactor = (popRatio * 0.40) + (gdpRatio * 0.40) + (incomeRatio * 0.15) + (areaRatio * 0.05);

    return Math.round((baseTarget * scaleFactor) / 100000) * 100000;
}

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
