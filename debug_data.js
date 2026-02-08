
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking Order BH1053...");
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, readable_id, telesales_user_id, user_id')
        .eq('readable_id', 1053)
        .single();

    if (orderError) {
        console.error("Order Error:", orderError);
    } else {
        console.log("Order Data:", order);
        if (order.telesales_user_id) {
            console.log("Checking Profile for Telesales User:", order.telesales_user_id);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, full_name, misa_employee_code')
                .eq('id', order.telesales_user_id)
                .single();
            console.log("Profile Data:", profile, profileError);
        }
    }
}

checkData();
