require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  console.log("Fetching all blog posts...");
  let allPosts = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const to = from + pageSize - 1;
    const res = await fetch(`${supabaseUrl}/rest/v1/blog_posts?select=id,title,created_at&order=created_at.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Range': `${from}-${to}`
      }
    });

    if (!res.ok) {
      console.error("HTTP error:", res.status, await res.text());
      return;
    }

    const posts = await res.json();
    allPosts.push(...posts);
    if (posts.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Total posts fetched: ${allPosts.length}`);

  const titleMap = {};
  allPosts.forEach(p => {
    const t = (p.title || '').trim();
    if (!t) return;
    if (!titleMap[t]) titleMap[t] = [];
    titleMap[t].push(p);
  });

  const idsToDelete = [];
  let totalDups = 0;

  for (const [title, list] of Object.entries(titleMap)) {
    if (list.length > 1) {
      totalDups++;
      // list is sorted by created_at ascending
      // Keep the first (oldest) post: list[0]
      const toDelete = list.slice(1);
      toDelete.forEach(item => idsToDelete.push(item.id));
    }
  }

  console.log(`Found ${totalDups} duplicate groups. Total redundant posts to delete: ${idsToDelete.length}`);

  if (idsToDelete.length === 0) {
    console.log("No duplicates found to delete!");
    return;
  }

  // Delete in batches of 20
  const batchSize = 20;
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const deleteUrl = `${supabaseUrl}/rest/v1/blog_posts?id=in.(${batch.join(',')})`;
    const delRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!delRes.ok) {
      console.error(`Failed to delete batch ${i}:`, delRes.status, await delRes.text());
    } else {
      deletedCount += batch.length;
      console.log(`Deleted batch ${i / batchSize + 1}: ${batch.length} posts (Total deleted: ${deletedCount}/${idsToDelete.length})`);
    }
  }

  console.log(`\nCOMPLETED: Successfully deleted ${deletedCount} redundant posts.`);
}

run();
