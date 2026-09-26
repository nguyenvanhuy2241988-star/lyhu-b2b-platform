const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function directUpdate() {
    console.log('Directly updating Supabase from local route definition...');
    const routeCode = fs.readFileSync('src/app/api/admin/publish-boyo/route.ts', 'utf8');

    // Extract addressBlock
    const addressBlockMatch = routeCode.match(/const addressBlock = `([\s\S]*?)`;/);
    const addressBlock = addressBlockMatch ? addressBlockMatch[1] : '';

    // Extract post1, post2, post3 content
    const getPost = (num) => {
        const regex = new RegExp(`const post${num} = \\{([\\s\\S]*?)\\n\\s*\\};`);
        const match = routeCode.match(regex);
        if (!match) return null;
        
        const body = match[1];
        const titleMatch = body.match(/title:\s*['"](.*?)['"]/);
        const slugMatch = body.match(/slug:\s*['"](.*?)['"]/);
        const thumbMatch = body.match(/thumbnail_url:\s*['"](.*?)['"]/);
        const catMatch = body.match(/category_id:\s*['"](.*?)['"]/);
        const summaryMatch = body.match(/ai_summary:\s*['"](.*?)['"]/);
        const metaTitleMatch = body.match(/meta_title:\s*['"](.*?)['"]/);
        const metaDescMatch = body.match(/meta_description:\s*['"](.*?)['"]/);
        const keywordsMatch = body.match(/keywords:\s*['"](.*?)['"]/);
        const contentMatch = body.match(/content:\s*`([\s\S]*?)`/);

        const rawContent = contentMatch ? contentMatch[1].replace('${addressBlock}', addressBlock) : '';

        return {
            title: titleMatch ? titleMatch[1] : '',
            slug: slugMatch ? slugMatch[1] : '',
            thumbnail_url: thumbMatch ? thumbMatch[1] : '',
            category_id: catMatch ? catMatch[1] : '',
            status: 'published',
            ai_summary: summaryMatch ? summaryMatch[1] : '',
            meta_title: metaTitleMatch ? metaTitleMatch[1] : '',
            meta_description: metaDescMatch ? metaDescMatch[1] : '',
            keywords: keywordsMatch ? keywordsMatch[1] : '',
            content: rawContent,
            published_at: new Date().toISOString()
        };
    };

    for (let i = 1; i <= 6; i++) {
        const p = getPost(i);
        if (!p) {
            console.error(`Could not parse post ${i}`);
            continue;
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update(p)
            .eq('slug', p.slug)
            .select('id, slug');

        if (error) {
            console.error(`Error updating post ${i}:`, error.message);
        } else {
            console.log(`Updated post ${i} (${p.slug}): SUCCESS`, data);
        }
    }

    // Verify post 3
    const { data: post3 } = await supabase
        .from('blog_posts')
        .select('content')
        .eq('slug', 'cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g')
        .single();

    console.log('Post 3 in DB has boyo_65g_pack:', post3?.content?.includes('boyo_65g_pack.jpg'));
    console.log('Post 3 in DB has not-prose:', post3?.content?.includes('not-prose'));
    console.log('Post 3 in DB has inline style color white:', post3?.content?.includes('color: #ffffff !important'));
}

directUpdate().catch(console.error);
