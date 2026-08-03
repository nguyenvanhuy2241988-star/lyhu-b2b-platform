require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function deleteDuplicates() {
  console.log("Fetching blog posts directly via REST API...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/blog_posts?select=title,id,created_at`, {
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
    const idsToDelete = [];
    
    posts.forEach(post => {
      const title = post.title.trim();
      if (!titleCounts[title]) {
        titleCounts[title] = [];
      }
      titleCounts[title].push(post);
    });
    
    for (const [title, postArray] of Object.entries(titleCounts)) {
      if (postArray.length > 1) {
        // Sort by created_at ascending (keep the oldest one)
        postArray.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Skip the first one, mark the rest for deletion
        for (let i = 1; i < postArray.length; i++) {
          idsToDelete.push(postArray[i].id);
        }
      }
    }
    
    if (idsToDelete.length === 0) {
      console.log("No duplicate posts found to delete.");
      return;
    }
    
    console.log(`\nFound ${idsToDelete.length} redundant posts. Proceeding to delete...`);
    
    // Delete in batches of 10 to avoid URI too long or rate limits
    const batchSize = 10;
    let deletedCount = 0;
    
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batchIds = idsToDelete.slice(i, i + batchSize);
      const deleteUrl = `${supabaseUrl}/rest/v1/blog_posts?id=in.(${batchIds.join(',')})`;
      
      const delRes = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!delRes.ok) {
        console.error(`Failed to delete batch:`, delRes.status, delRes.statusText);
        const errText = await delRes.text();
        console.error(errText);
      } else {
        deletedCount += batchIds.length;
        console.log(`Deleted batch of ${batchIds.length} posts...`);
      }
    }
    
    console.log(`\nSuccessfully deleted ${deletedCount} redundant posts.`);
  } catch (err) {
    console.error("Operation failed:", err);
  }
}

deleteDuplicates();
