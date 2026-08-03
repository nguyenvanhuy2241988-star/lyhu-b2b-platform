require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkDuplicates() {
  console.log("Fetching blog posts directly via REST API...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/blog_posts?select=title,id`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok) {
      console.error("HTTP Error:", res.status, res.statusText);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const posts = await res.json();
    console.log(`Total posts fetched: ${posts.length}`);
    
    const titleCounts = {};
    const duplicates = [];
    
    posts.forEach(post => {
      const title = post.title.trim();
      if (!titleCounts[title]) {
        titleCounts[title] = { count: 0, ids: [] };
      }
      titleCounts[title].count++;
      titleCounts[title].ids.push(post.id);
    });
    
    for (const [title, info] of Object.entries(titleCounts)) {
      if (info.count > 1) {
        duplicates.push({ title, count: info.count, ids: info.ids });
      }
    }
    
    console.log(`\nFound ${duplicates.length} unique titles that are duplicated.`);
    
    let totalDuplicatedArticles = 0;
    duplicates.sort((a, b) => b.count - a.count).forEach(dup => {
      console.log(`- "${dup.title}": ${dup.count} times`);
      totalDuplicatedArticles += (dup.count - 1);
    });
    
    console.log(`\nTotal redundant/duplicate article copies: ${totalDuplicatedArticles}`);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

checkDuplicates();
