import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('npp_targets')
            .select('province_name, data');

        if (error) {
            console.error('Error fetching NPP targets:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform array to Record<string, any>
        const result: Record<string, any> = {};
        if (data) {
            data.forEach((row) => {
                result[row.province_name] = row.data;
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Ensure body is an object representing Record<string, ProvinceData>
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const upsertPromises = Object.entries(body).map(([province_name, province_data]) => {
            return supabase
                .from('npp_targets')
                .upsert(
                    { 
                        province_name, 
                        data: province_data,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'province_name' }
                );
        });

        const results = await Promise.all(upsertPromises);
        
        // Check if any upsert failed
        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
            console.error('Errors saving NPP targets:', errors);
            return NextResponse.json({ error: 'Some records failed to save', details: errors }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Lưu dữ liệu thành công!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
