
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load env manually
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
    } catch (e) {
        console.error("Error reading env:", e);
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Could not find Supabase credentials.");
    process.exit(1);
}

console.log("Connecting to:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking Order BH1053 (readable_id: 1053)...");
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, readable_id, telesales_user_id, user_id')
        .eq('readable_id', 1053)
        .maybeSingle(); // Use maybeSingle to avoid 406 if not found

    if (orderError) {
        console.error("Order Error:", orderError);
    } else if (!order) {
        console.error("Order 1053 not found.");
    } else {
        console.log("Order Data:", order);
        if (order.telesales_user_id) {
            console.log("Checking Profile for Telesales User:", order.telesales_user_id);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, full_name, misa_employee_code')
                .eq('id', order.telesales_user_id)
                .single();
            console.log("Profile Data:", profile);
            if (profileError) console.error("Profile Error:", profileError);
        } else {
            console.log("Order has NO telesales_user_id");
        }
    }
}

checkData();
