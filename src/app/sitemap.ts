import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.includes('lyhu.com.vn') ? process.env.NEXT_PUBLIC_SITE_URL : 'https://lyhu.com.vn';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default static routes
    const routes: MetadataRoute.Sitemap = [
        {
            url: `${siteUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${siteUrl}/wholesale`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/tin-tuc`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
    ];

    try {
        // Fetch published blog posts
        const { data: posts } = await supabase
            .from('blog_posts')
            .select('slug, updated_at, created_at')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (posts) {
            const postRoutes: MetadataRoute.Sitemap = posts.map(post => ({
                url: `${siteUrl}/tin-tuc/${post.slug}`,
                lastModified: new Date(post.updated_at || post.created_at),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
            routes.push(...postRoutes);
        }

        // Fetch active products
        const { data: products } = await supabase
            .from('products')
            .select('id, updated_at, created_at')
            .eq('is_active', true)
            .limit(1000);

        if (products) {
            const productRoutes: MetadataRoute.Sitemap = products.map(product => ({
                url: `${siteUrl}/wholesale/product/${product.id}`,
                lastModified: new Date(product.updated_at || product.created_at || Date.now()),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));
            routes.push(...productRoutes);
        }

    } catch (error) {
        console.error('Error generating sitemap:', error);
    }

    return routes;
}
