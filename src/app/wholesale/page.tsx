import { cookies } from 'next/headers';
import { createServerClient } from "@supabase/ssr";
import WholesaleStore from '@/components/wholesale/WholesaleStore';
import WholesaleFooter from '@/components/wholesale/WholesaleFooter';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    return createServerClient(supabaseUrl, supabaseAnon, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                } catch (error) {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
}

export default async function WholesalePage() {
    const supabase = getSupabase();

    // Fetch user profile to check if they are logged in and their role
    const { data: { session } } = await supabase.auth.getSession();
    
    let isWholesaleCustomer = false;
    let customerCode = null;
    let b2bCodeData = null;

    if (session) {
        // Only grant wholesale access if they have claimed an active B2B code
        const { data: codeData } = await supabase
            .from('b2b_customer_codes')
            .select('*')
            .eq('customer_id', session.user.id)
            .eq('is_active', true)
            .single();

        if (codeData) {
            isWholesaleCustomer = true;
            b2bCodeData = codeData;
        }
        
        customerCode = session.user.id;
    }

    // Lấy danh sách sản phẩm
    // Giả định bảng products có trường brand_id hoặc brand_name và is_active
    const { data: rawProductsData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

    const productsData = (rawProductsData || []).map((p: any) => ({
        ...p,
        basePricePerUnit: p.basePricePerUnit ?? p.price ?? 0,
        basePrice: p.basePrice ?? p.price ?? 0,
        retailPrice: p.retailPrice ?? (p.price ? p.price * 1.2 : 0),
        brand: p.brand ?? 'LYHU'
    }));

    // Lấy các chương trình khuyến mãi đang active
    const { data: promotionsData } = await supabase
        .from('wholesale_promotions')
        .select(`
            *,
            conditions:wholesale_promotion_conditions(*),
            actions:wholesale_promotion_actions(*)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false });

    // Lấy chiến dịch Flash Sale đang active
    const { data: flashSalesData } = await supabase
        .from('wholesale_flash_sales')
        .select(`
            *,
            items:wholesale_flash_sale_items(*)
        `)
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString())
        .lte('start_time', new Date().toISOString())
        .limit(1)
        .single();

    // Lấy danh sách Banners
    const { data: bannersData } = await supabase
        .from('wholesale_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    // Lấy danh sách Vouchers
    const { data: vouchersData } = await supabase
        .from('wholesale_vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-gray-50">
            <WholesaleStore 
                initialProducts={productsData || []} 
                promotions={promotionsData || []}
                flashSale={flashSalesData || null}
                banners={bannersData || []}
                vouchers={vouchersData || []}
                isWholesaleCustomer={isWholesaleCustomer}
                b2bCodeData={b2bCodeData}
            />
            <WholesaleFooter />
        </div>
    );
}
