require('dotenv').config({ path: __dirname + '/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('marketing_bot_commands').select('*').then(res => {
    console.log('--- DATABASE CHECK ---');
    console.log(res.data);
    console.log('Error:', res.error);
    process.exit(0);
});
