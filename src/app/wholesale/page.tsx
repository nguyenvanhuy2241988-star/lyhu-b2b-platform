import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import WholesaleStore from '@/components/wholesale/WholesaleStore';

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
    const supabase = createServerComponentClient({ cookies });

    // Fetch user profile to check if they are logged in and their role
    const { data: { session } } = await supabase.auth.getSession();
    
    let isWholesaleCustomer = false;
    let customerCode = null;

    if (session) {
        // Here we could check their specific profile role, but for now we assume 
        // logged in means they get access to the dynamic pricing engine.
        // Or we check if their profile has a specific 'wholesale' / 'retail_chain' tag
        isWholesaleCustomer = true;
        customerCode = session.user.id; // Or a specific ref_code
    }

    // Lấy danh sách sản phẩm
    // Giả định bảng products có trường brand_id hoặc brand_name và is_active
    const { data: productsData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

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

    return (
        <div className="min-h-screen bg-gray-50">
            <WholesaleStore 
                initialProducts={productsData || []} 
                promotions={promotionsData || []}
                isWholesaleCustomer={isWholesaleCustomer}
            />
        </div>
    );
}
