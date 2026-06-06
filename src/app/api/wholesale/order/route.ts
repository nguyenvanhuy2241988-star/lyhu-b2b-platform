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
                
                // --- Tính hoa hồng theo Sản phẩm ---
                let totalCommission = 0;

                try {
                    // Lấy thông tin affiliate_commission_rate của sản phẩm
                    const productIds = items.map((i: any) => i.product_id);
                    const { data: products } = await supabaseAdmin
                        .from('products')
                        .select('id, affiliate_commission_rate')
                        .in('id', productIds);

                    // Tính hoa hồng cho từng món hàng
                    for (const item of items) {
                        const product = products?.find(p => p.id === item.product_id);
                        
                        // Mặc định lấy theo hồ sơ KOL
                        let itemRate = affiliate.commission_rate || 0; 

                        // Nếu sản phẩm có cài đặt mức rate riêng (>0) thì dùng mức đó
                        if (product && product.affiliate_commission_rate && product.affiliate_commission_rate > 0) {
                            itemRate = product.affiliate_commission_rate;
                        }

                        const itemTotal = (item.price || 0) * (item.quantity || 0);
                        totalCommission += (itemTotal * itemRate) / 100;
                    }
                } catch (calcError) {
                    console.error("Lỗi khi tính hoa hồng Affiliate:", calcError);
                    const totalAmount = payload.total_amount || 0;
                    totalCommission = (totalAmount * affiliate.commission_rate) / 100;
                }

                payload.commission_amount = totalCommission;
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

