const { createClient } = require('@supabase/supabase-js');
const { v5: uuidv5 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE = 'https://wepxcpifgxghfvdgnkeh.supabase.co';
const TARGET_DATE = '2026-10-22';
const INBOX_DIR = path.join(__dirname, '..', 'tools', 'lyhu-news', 'inbox', TARGET_DATE);

const CATEGORY_MAP = {
  'tap-hoa-gt': '7c734ca7-3d9f-4ee5-b744-815ce04d1074',
  'cua-hang-tien-loi': 'accc862c-c3d7-4f53-bda9-847bdd7c4f3a',
  'nha-phan-phoi-diem-ban': 'bbb06484-8d5c-4505-8ee5-6393dcdec950'
};

async function uploadAsset(prefix, filename, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `news/lyhu-cloud-handoff/${prefix}/${filename}`;
  
  // Try uploading (or update if already exists)
  const { data, error } = await supabase.storage
    .from('public-assets')
    .upload(storagePath, fileBuffer, {
      contentType: 'image/webp',
      upsert: true
    });

  if (error) {
    console.error(`Error uploading ${storagePath}:`, error);
    throw error;
  }
  
  const publicUrl = `${BASE}/storage/v1/object/public/public-assets/${storagePath}`;
  console.log(`Uploaded ${filename} -> ${publicUrl}`);
  return publicUrl;
}

async function run() {
  const handoffPath = path.join(INBOX_DIR, 'handoff.json');
  if (!fs.existsSync(handoffPath)) {
    console.error(`handoff.json not found at ${handoffPath}`);
    process.exit(1);
  }

  const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
  console.log(`Loaded handoff for date: ${handoff.target_date_ict}, articles: ${handoff.articles.length}`);

  for (const article of handoff.articles) {
    const slot = article.slot;
    const categoryId = CATEGORY_MAP[article.category_slug];
    if (!categoryId) {
      throw new Error(`Category slug ${article.category_slug} not recognized in map`);
    }

    const identity = uuidv5(article.request_id, uuidv5.URL);
    const prefix = `daily-${TARGET_DATE}-${slot}-${article.content_hash.slice(0, 12)}`;

    console.log(`\nProcessing slot ${slot}: "${article.title}"`);
    console.log(`ID: ${identity}, Slug: ${article.slug}`);

    // Upload assets
    const coverPath = path.join(INBOX_DIR, String(slot), 'cover.webp');
    const inlinePath = path.join(INBOX_DIR, String(slot), 'inline.webp');

    const coverUrl = await uploadAsset(prefix, 'cover.webp', coverPath);
    const inlineUrl = await uploadAsset(prefix, 'inline.webp', inlinePath);

    const fullContent = article.content.replace('__INLINE_IMAGE__', inlineUrl);

    // Slot 7 is to be published right now!
    // Slot 13 and 19 are staged as drafts (slot 13 can also be published if after 13:00, or kept draft until 13:00)
    const isPublishSlot7 = (slot === 7);
    const nowIso = new Date().toISOString();

    const postPayload = {
      id: identity,
      request_id: article.request_id,
      slug: article.slug,
      title: article.title,
      content: fullContent,
      thumbnail_url: coverUrl,
      category_id: categoryId,
      meta_title: article.title.slice(0, 65),
      meta_description: article.title,
      status: isPublishSlot7 ? 'published' : 'draft',
      published_at: isPublishSlot7 ? nowIso : null,
      updated_at: nowIso,
      is_lyhu_fb_shared: false,
      is_fb_shared: false
    };

    // Upsert into blog_posts
    const { data: upsertData, error: upsertError } = await supabase
      .from('blog_posts')
      .upsert(postPayload, { onConflict: 'id' })
      .select('id, slug, status, published_at');

    if (upsertError) {
      console.error(`Failed to upsert blog_post for slot ${slot}:`, upsertError);
      throw upsertError;
    }

    console.log(`Successfully saved slot ${slot}: status=${upsertData[0].status}, published_at=${upsertData[0].published_at}`);
  }

  console.log('\n--- ALL 3 ARTICLES PROCESSED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
