import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDates() {
    console.log("Đang sửa lỗi ngày xuất bản (published_at) ở tương lai...");
    
    // Get all posts
    const { data: posts } = await supabase.from('blog_posts').select('id, title, published_at');
    
    let count = 0;
    const now = new Date();
    
    for (const post of posts) {
        const pubDate = new Date(post.published_at);
        // If date is in the future (more than 1 hour ahead)
        if (pubDate > new Date(now.getTime() + 3600000)) {
            // Set it to a week ago
            const pastDate = new Date(now);
            pastDate.setDate(now.getDate() - 7 - count);
            await supabase.from('blog_posts').update({ published_at: pastDate.toISOString() }).eq('id', post.id);
            console.log(`Đã lùi ngày bài: ${post.title} (từ ${post.published_at} về ${pastDate.toISOString()})`);
            count++;
        }
    }
    console.log(`Hoàn tất. Đã sửa ${count} bài viết có ngày xuất bản ở tương lai.`);
}

fixDates();
