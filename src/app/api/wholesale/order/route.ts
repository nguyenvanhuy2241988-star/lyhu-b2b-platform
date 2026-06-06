export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { payload, items } = body;

        // Use service role key to bypass RLS for guest orders
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Supabase configuration is missing or invalid' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // --- Bắt đầu xử lý Affiliate Tracking ---
        const cookieStore = cookies();
        const affiliateRef = cookieStore.get('lyhu_affiliate_ref')?.value;

        if (affiliateRef) {
            // Tìm kiếm Affiliate ID từ mã Code
            const { data: affiliate } = await supabaseAdmin
                .from('affiliate_profiles')
                .select('id, commission_rate')
                .eq('affiliate_code', affiliateRef)
                .eq('status', 'active')
                .single();

            if (affiliate) {
                payload.affiliate_id = affiliate.id;
                
                // Tính hoa hồng (commission_rate là phần trăm, vd: 10)
                const totalAmount = payload.total_amount || 0;
                payload.commission_amount = (totalAmount * affiliate.commission_rate) / 100;
                payload.affiliate_status = 'pending';
            }
        }
        // --- Kết thúc xử lý Affiliate Tracking ---

        // 1. Insert Order
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert(payload)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Insert Order Items
        const orderItemsWithIds = items.map((item: any) => ({
            ...item,
            order_id: orderData.id
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsWithIds);
            
        if (itemsError) throw itemsError;

        return NextResponse.json({ success: true, order: orderData });
        
    } catch (error: any) {
        console.error('API /wholesale/order Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

