require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: pages } = await supabase.from('facebook_pages').select('page_id, access_token').ilike('name', '%FMCG 247%').limit(1);
  const page = pages[0];

  const newsCategoryIds = [
    '73100aca-c4f9-4edd-8d1b-74eeb4690261', // tin-tuc-fmcg
    '89966800-b427-4d00-ae84-f2af5e38f66f', // bao-cao-thi-truong
  ];

  const { data: newsPosts } = await supabase.from('blog_posts')
    .select('id, title, slug, ai_summary, meta_title, keywords, thumbnail_url, category_id')
    .in('category_id', newsCategoryIds)
    .eq('status', 'published')
    .order('published_at', { ascending: false }).limit(1);

  const { data: advisoryPosts } = await supabase.from('blog_posts')
    .select('id, title, slug, ai_summary, meta_title, keywords, thumbnail_url, category_id')
    .eq('category_id', 'a2eb7bb7-aa81-4461-8608-ae2ef84251d5') // goc-nha-phan-phoi-diem-ban
    .eq('status', 'published')
    .order('published_at', { ascending: false }).limit(1);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu-b2b-platform.vercel.app';

  async function postToFacebook(post, isNews) {
    if (!post) { console.log('No post found'); return; }
    const postUrl = baseUrl + '/tin-tuc/' + post.slug;
    
    let hashtagsStr = '#FMCG #ChuyenDongFMCG #LYHU';
    if (post.keywords) {
      const extraHashtags = post.keywords.split(',').map(k => '#' + k.trim().replace(/\s+/g, '')).join(' ');
      hashtagsStr += ' ' + extraHashtags;
    }
    
    const caption = post.title + '\n\n' + (post.ai_summary || post.meta_title || '') + '\n\n👉 Xem chi tiết tại: ' + postUrl + '\n\n' + hashtagsStr;

    try {
        await fetch('https://graph.facebook.com/v20.0/?id=' + encodeURIComponent(postUrl) + '&scrape=true&access_token=' + page.access_token, { method: 'POST' });
        await new Promise(r => setTimeout(r, 2000));
    } catch(e) {}

    let fbUrl = 'https://graph.facebook.com/v20.0/' + page.page_id + '/feed';
    const form = new URLSearchParams();
    
    if (isNews) {
        form.append('message', caption);
        form.append('link', postUrl);
    } else if (post.thumbnail_url) {
        fbUrl = 'https://graph.facebook.com/v20.0/' + page.page_id + '/photos';
        form.append('url', post.thumbnail_url);
        form.append('message', caption);
    }
    form.append('access_token', page.access_token);

    const res = await fetch(fbUrl, { method: 'POST', body: form.toString(), headers: {'Content-Type': 'application/x-www-form-urlencoded'} });
    console.log(isNews ? 'News Post:' : 'Advisory Post:', await res.json());
  }

  await postToFacebook(newsPosts[0], true);
  await postToFacebook(advisoryPosts[0], false);
}
run();
