import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
    
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/admin/',
                '/telesales/',
                '/warehouse/',
                '/login/',
                '/debug-role/'
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
