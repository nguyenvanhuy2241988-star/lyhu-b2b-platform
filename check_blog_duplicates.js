require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkDuplicates() {
  console.log("Fetching all blog posts directly via REST API...");
  try {
    let allPosts = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const res = await fetch(`${supabaseUrl}/rest/v1/blog_posts?select=title,id,created_at,published_at,slug&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Range': `${from}-${to}`
        }
      });
      
      if (!res.ok) {
        console.error("HTTP Error:", res.status, res.statusText);
        const text = await res.text();
        console.error(text);
        return;
      }
      
      const posts = await res.json();
      allPosts.push(...posts);
      console.log(`Fetched batch ${page + 1}: ${posts.length} posts (Total so far: ${allPosts.length})`);
      if (posts.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`\nTotal posts evaluated: ${allPosts.length}`);
    
    const titleCounts = {};
    const duplicates = [];
    
    allPosts.forEach(post => {
      const title = (post.title || '').trim();
      if (!title) return;
      if (!titleCounts[title]) {
        titleCounts[title] = { count: 0, posts: [] };
      }
      titleCounts[title].count++;
      titleCounts[title].posts.push(post);
    });
    
    for (const [title, info] of Object.entries(titleCounts)) {
      if (info.count > 1) {
        duplicates.push({ title, count: info.count, posts: info.posts });
      }
    }
    
    console.log(`\nFound ${duplicates.length} unique titles that are duplicated.`);
    
    let totalDuplicatedArticles = 0;
    duplicates.sort((a, b) => b.count - a.count).forEach(dup => {
      console.log(`- "${dup.title}": ${dup.count} times`);
      totalDuplicatedArticles += (dup.count - 1);
    });
    
    console.log(`\nTotal redundant/duplicate article copies: ${totalDuplicatedArticles}`);

    // Also check for very similar / near-duplicate titles (e.g. slight variations or identical slugs)
    const slugCounts = {};
    const slugDups = [];
    allPosts.forEach(post => {
      const slug = (post.slug || '').trim();
      if (!slug) return;
      if (!slugCounts[slug]) slugCounts[slug] = [];
      slugCounts[slug].push(post);
    });
    for (const [slug, list] of Object.entries(slugCounts)) {
      if (list.length > 1) {
        slugDups.push({ slug, count: list.length });
      }
    }
    console.log(`\nExact slug duplicates: ${slugDups.length}`);

    // Check duplicates created recently (e.g. in last 30 or 60 days)
    const recentDups = duplicates.filter(dup => {
      return dup.posts.some(p => new Date(p.created_at) > new Date('2026-07-17'));
    });
    console.log(`\nDuplicate groups containing posts created after 2026-07-17: ${recentDups.length}`);
    recentDups.forEach(d => {
      console.log(`  * "${d.title}" (${d.count} copies)`);
      d.posts.forEach(p => console.log(`      Created: ${p.created_at} | ID: ${p.id}`));
    });

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

checkDuplicates();
