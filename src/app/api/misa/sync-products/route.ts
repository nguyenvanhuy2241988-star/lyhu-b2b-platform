import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MisaService } from '@/lib/misa/misaService';

export const dynamic = 'force-dynamic';

async function handleSync() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const result = await MisaService.fetchInventoryItems(supabase);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error,
                _raw: result._raw || null,
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            total: result.items?.length || 0,
            items: result.items || [],
            _raw: result._raw || null,
        });
    } catch (error: any) {
        console.error('[MISA Sync Products] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Support both GET (browser debug) and POST (from UI)
export async function GET() { return handleSync(); }
export async function POST() { return handleSync(); }
