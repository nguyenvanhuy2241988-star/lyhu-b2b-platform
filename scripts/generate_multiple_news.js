import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Delete bad posts
    console.log("Xóa các bài báo cũ bị lỗi nội dung quảng cáo...");
    await supabase.from('blog_posts').delete().in('id', [
        'a62e2a1c-1122-494b-850c-caf2a4c84342',
        '266d41fc-a174-4178-8809-edefa7708d44'
    ]);

    // 2. Trigger new posts 3 times
    console.log("Đang gọi AI sinh 3 bài báo mới...");
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`\nĐang sinh bài báo số ${i + 1}...`);
            const res = await fetch('https://lyhu-b2b-platform.vercel.app/api/marketing/cron/fmcg-news', {
                method: 'GET',
                headers: { 'User-Agent': 'vercel-cron/1.0' }
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                console.log('Thành công:', data.post?.title);
            } catch (e) {
                console.log('Lỗi API trả về HTML:', text.substring(0, 200));
            }
            // Wait 5 seconds between requests to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (e) {
            console.error('Lỗi fetch:', e);
        }
    }
}

run();
