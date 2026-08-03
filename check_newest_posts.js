require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('title, created_at, status')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) console.error(error);
  else {
      console.log("Newest posts in DB:");
      data.forEach(p => console.log(`- ${p.title} (${p.created_at})`));
  }
}
check();
