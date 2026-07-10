import { cookies } from 'next/headers';
import { createServerClient } from "@supabase/ssr";
import WholesaleStore from '@/components/wholesale/WholesaleStore';
import WholesaleFooter from '@/components/wholesale/WholesaleFooter';
import type { Metadata, ResolvingMetadata } from 'next';

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

type Props = {
    searchParams: { [key: string]: string | string[] | undefined }
}

const getMockSocialProof = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const positiveHash = Math.abs(hash);
    const rating = 4.5 + (positiveHash % 6) / 10;
    const soldCount = 50 + (positiveHash % 3450);
    return { rating, soldCount };
};

export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const initialProductId = typeof searchParams?.p === 'string' ? searchParams.p : undefined;

    if (initialProductId) {
        const supabase = getSupabase();
        const { data: product } = await supabase
            .from('products')
            .select('name, description, image_url, price')
            .eq('id', initialProductId)
            .single();

        if (product) {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0);
            const { rating, soldCount } = getMockSocialProof(product.id || initialProductId);
            const reviewCount = Math.floor(soldCount / 10) || 1;
            const stars = '⭐'.repeat(Math.round(rating));
            
            const title = product.name;
            const description = `${formattedPrice} ${stars} (${reviewCount} Đánh giá) - ${product.description || 'Mua ngay trên LYHU App'}`;
            const images = product.image_url ? [product.image_url] : [];
            
            return {
                title,
                description,
                openGraph: {
                    title,
                    description,
                    images,
                    type: 'website',
                },
            };
        }
    }

    return {
        title: 'LYHU.COM.VN',
        description: 'Kết nối chân thành - Hợp tác bền vững',
    };
}

export default async function WholesalePage({ searchParams }: Props) {
    const supabase = getSupabase();
    const initialProductId = typeof searchParams?.p === 'string' ? searchParams.p : undefined;

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
                initialProductId={initialProductId}
            />
            <WholesaleFooter />
        </div>
    );
}
