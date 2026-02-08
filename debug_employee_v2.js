
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
    console.log("Checking Employee Mapping V2 for Order #151...");

    // 1. Get Order Data by Readable ID (assuming 151 is readable_id)
    // Note: The user said #151.
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

    const checkProfile = async (label, uid) => {
        if (!uid) {
            console.log(`${label}: NULL`);
            return;
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, misa_employee_code')
            .eq('id', uid)
            .single();
        console.log(`${label} [${uid}]:`, data || error);
    };

    await checkProfile("User ID (Assignee)", order.user_id);
    await checkProfile("Telesales ID (Owner)", order.telesales_user_id);
    await checkProfile("Created By", order.created_by);
}

check();
