
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            for (const line of lines) {
                if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
                    supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
                }
                if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
                    supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
                }
            }
        }
    } catch (e) { }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Items for Order #151...");
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            id, 
            readable_id, 
            items:order_items (
                id,
                product_id,
                price,
                quantity,
                discount,
                is_gift
            )
        `)
        .eq('readable_id', 151)
        .single();

    if (error) console.error(error);
    else {
        console.log("Order:", order.readable_id);
        console.table(order.items);
    }
}

check();
