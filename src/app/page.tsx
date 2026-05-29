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

    // Start all non-dependent promises immediately to avoid waterfall
    const productsPromise = supabase
        .from('products')
        .select('id, name, sku, brand, price, image_url, weight, packaging_spec, items_per_carton, description, unit, origin, video_url, extra_images, certificates')
        .eq('is_active', true)
        .order('name', { ascending: true });

    const promotionsPromise = supabase
        .from('wholesale_promotions')
        .select(`
            *,
            conditions:wholesale_promotion_conditions(*),
            actions:wholesale_promotion_actions(*)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false });

    const flashSalesPromise = supabase
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

    const bannersPromise = supabase
        .from('wholesale_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    const vouchersPromise = supabase
        .from('wholesale_vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    const sessionPromise = supabase.auth.getSession();

    // Await all independent requests in parallel
    const [
        { data: rawProductsData },
        { data: promotionsData },
        { data: flashSalesData },
        { data: bannersData },
        { data: vouchersData },
        { data: { session } }
    ] = await Promise.all([
        productsPromise,
        promotionsPromise,
        flashSalesPromise,
        bannersPromise,
        vouchersPromise,
        sessionPromise
    ]);

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

    const productsData = (rawProductsData || []).map((p: any) => ({
        ...p,
        basePricePerUnit: p.basePricePerUnit ?? p.price ?? 0,
        basePrice: p.basePrice ?? p.price ?? 0,
        retailPrice: p.retailPrice ?? (p.price ? p.price * 1.2 : 0),
        brand: p.brand ?? 'LYHU'
    }));

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
