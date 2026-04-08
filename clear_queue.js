require('dotenv').config({ path: __dirname + '/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function clean() {
    console.log("Cleaning stuck commands...");
    const { data, error } = await supabase
        .from('marketing_bot_commands')
        .update({ status: 'completed' })
        .eq('status', 'pending');
        
    console.log("Done!", data, error);
}

clean();
