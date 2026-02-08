
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Credentials not found");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
    console.log("Fetching profiles...");
    const { data, error } = await supabase
        .from('profiles')
        .select('email, full_name, misa_employee_code, role')
        .order('email');

    if (error) console.error(error);
    else console.table(data);
}

dump();
