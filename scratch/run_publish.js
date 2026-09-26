const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    console.log('Connecting to Supabase...');
    
    // Call the deployed Vercel API or run directly
    const res = await fetch('https://lyhu.com.vn/api/admin/publish-boyo?token=lyhu_clean_2026');
    const json = await res.json();
    console.log('API Response:', JSON.stringify(json, null, 2));

    const { data: post } = await supabase
        .from('blog_posts')
        .select('content')
        .eq('slug', 'cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g')
        .single();

    console.log('Has boyo_65g_pack:', post?.content?.includes('boyo_65g_pack.jpg'));
    console.log('Has not-prose:', post?.content?.includes('not-prose'));
    console.log('Has inline style color white:', post?.content?.includes('color: #ffffff !important'));
}

main().catch(console.error);
