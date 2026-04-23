const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const { data: promotions } = await supabase.from('wholesale_promotions').select('*').limit(1);
    console.log("Promotions table structure:", promotions);
    
    const { data: products } = await supabase.from('master_products').select('id, name, unit_price, images, category').limit(1);
    console.log("Products table structure:", products);
}

checkSchema();
