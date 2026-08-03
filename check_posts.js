require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cats } = await supabase.from('blog_categories').select('id, slug');
  const targetCatIds = cats.filter(c => ['am-thuc-nau-an', 'suc-khoe-doi-song'].includes(c.slug)).map(c => c.id);

  const { data, error } = await supabase
    .from('blog_posts')
    .select('title, category_id, published_at, created_at, status')
    .in('category_id', targetCatIds)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) console.error(error);
  else {
      console.log("Recent posts:");
      data.forEach(p => {
          const cat = cats.find(c => c.id === p.category_id);
          console.log(`- [${cat?.slug}] ${p.title} (Status: ${p.status}, Created: ${p.created_at}, Published: ${p.published_at})`);
      });
  }
}
check();
