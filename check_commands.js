require('dotenv').config({ path: __dirname + '/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('marketing_bot_commands').select('*, bot_profiles(folder_name)').order('created_at', { ascending: false }).limit(2);
    console.log("COMMANDS:", data);
}

check();
