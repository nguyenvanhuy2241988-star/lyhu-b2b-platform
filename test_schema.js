require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('marketing_bot_commands').select('*').limit(1);
  console.log('marketing_bot_commands:', data, error);
  
  const { data: d2, error: e2 } = await supabase.from('bot_profiles').select('*').limit(1);
  console.log('bot_profiles:', d2, e2);
}

run();
