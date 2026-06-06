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
                
                // --- Tính hoa hồng theo Rules Engine ---
                let totalCommission = 0;

                try {
                    // 1. Lấy thông tin chi tiết sản phẩm (brand, category)
                    const productIds = items.map((i: any) => i.product_id);
                    const { data: products } = await supabaseAdmin
                        .from('products')
                        .select('id, brand') // Assuming 'category' might not exist yet, we select 'brand' at least
                        .in('id', productIds);

                    // 2. Lấy các quy tắc hoa hồng (Rules) áp dụng
                    const { data: rules } = await supabaseAdmin
                        .from('affiliate_commission_rules')
                        .select('*')
                        .eq('is_active', true)
                        .or(`affiliate_id.eq.${affiliate.id},affiliate_id.is.null`)
                        .order('priority', { ascending: false });

                    const activeRules = rules || [];

                    // 3. Tính hoa hồng cho từng món hàng
                    for (const item of items) {
                        const product = products?.find(p => p.id === item.product_id);
                        let itemRate = affiliate.commission_rate; // Mặc định từ profile

                        // Duyệt qua các rules để tìm rule phù hợp nhất (do đã sort theo priority giảm dần)
                        const matchedRule = activeRules.find(rule => {
                            if (rule.product_id && rule.product_id !== item.product_id) return false;
                            if (rule.brand && product?.brand !== rule.brand) return false;
                            // if (rule.category && product?.category !== rule.category) return false;
                            
                            // Phải có ít nhất 1 điều kiện được set để gọi là rule cụ thể, 
                            // nếu không nó thành rule global (vẫn match)
                            return true;
                        });

                        if (matchedRule) {
                            itemRate = matchedRule.commission_rate;
                        }

                        const itemTotal = (item.price || 0) * (item.quantity || 0);
                        totalCommission += (itemTotal * itemRate) / 100;
                    }
                } catch (calcError) {
                    console.error("Lỗi khi tính hoa hồng Affiliate đa tầng:", calcError);
                    // Fallback to basic rate
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

