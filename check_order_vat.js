
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
    console.log("Checking Order #151...");
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('readable_id', 151)
        .single();

    if (error) console.error(error);
    else {
        console.log("Order ID:", order.id);
        console.log("VAT Column Value:", order.vat); // vital
        console.log("Total Amount:", order.total_amount); // vital
        console.log("Items:", order.items); // check if items have separate tax info
    }
}

check();
