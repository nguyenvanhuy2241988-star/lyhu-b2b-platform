import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); 
supabase.from('blog_posts').select('title, thumbnail_url, published_at').order('created_at', {ascending: false}).limit(5).then(res => console.log(res.data));
