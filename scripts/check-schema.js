const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: p2, error: e2 } = await supabase.from('products').select('*').limit(1);
    console.log("products:", p2, "error:", e2);
}

check();
