require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  let allPosts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, created_at')
      .range(from, from + 999)
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) break;
    allPosts.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  
  const map = {};
  allPosts.forEach(p => {
    const t = (p.title || '').trim();
    if (!t) return;
    if (!map[t]) map[t] = [];
    map[t].push(p);
  });
  
  const dups = Object.entries(map).filter(([_, list]) => list.length > 1);
  dups.sort((a, b) => b[1].length - a[1].length);

  let totalExtra = 0;
  console.log(`=== TỔNG CỘNG: ${allPosts.length} BÀI VIẾT ===`);
  console.log(`=== CÓ ${dups.length} TIÊU ĐỀ BỊ TRÙNG LẶP ===\n`);

  dups.forEach(([title, list], idx) => {
    const extra = list.length - 1;
    totalExtra += extra;
    const latest = list[0].created_at;
    const oldest = list[list.length - 1].created_at;
    console.log(`${idx + 1}. "${title}"`);
    console.log(`   - Số lần xuất hiện: ${list.length} lần (thừa ${extra} bài)`);
    console.log(`   - Gần nhất: ${latest} | Cũ nhất: ${oldest}`);
  });

  console.log(`\n=== TỔNG BÀI VIẾT DƯ THỪA CẦN XÓA: ${totalExtra} BÀI ===`);
}

run();
