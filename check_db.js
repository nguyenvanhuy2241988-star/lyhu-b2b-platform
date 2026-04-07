const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing env vars!");
    const fs = require('fs');
    fs.writeFileSync('db_check.json', JSON.stringify({ error: "missing env" }));
    process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('culture_settings').select('*').eq('slug', 'main_content').single();
    if (error) {
        console.log("Error querying culture:", error);
    } else {
        const fs = require('fs');
        fs.writeFileSync('db_check.json', JSON.stringify(data, null, 2));
        console.log("Wrote to db_check.json");
    }
}
check();
