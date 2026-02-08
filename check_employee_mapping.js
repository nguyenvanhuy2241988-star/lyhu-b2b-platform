
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
    console.log("Checking Employee Mapping for Order #151...");

    // 1. Get Order Data
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            id, 
            readable_id, 
            user_id,
            telesales_user_id,
            created_by
        `)
        .eq('readable_id', 151)
        .single();

    if (orderError) {
        console.error("Order Error:", orderError);
        return;
    }

    console.log("Order Data:", order);

    // 2. Check Profile for user_id
    if (order.user_id) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, misa_employee_code')
            .eq('id', order.user_id)
            .single();

        console.log("Profile (user_id):", profile || profileError);
    }

    // 3. Check Profile for telesales_user_id
    if (order.telesales_user_id && order.telesales_user_id !== order.user_id) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, misa_employee_code')
            .eq('id', order.telesales_user_id)
            .single();

        console.log("Profile (telesales_user_id):", profile || profileError);
    }
}

check();
