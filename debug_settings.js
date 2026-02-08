
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
    console.log("Checking App Settings...");
    const { data, error } = await supabase.from('app_settings').select('*').single();
    console.log("Settings:", data?.misa_config);

    console.log("Checking Profiles (Limit 5)...");
    const { data: profiles } = await supabase.from('profiles').select('email, misa_employee_code').limit(5);
    console.table(profiles);
}

check();
