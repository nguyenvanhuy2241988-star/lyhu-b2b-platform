import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.includes('lyhu.com.vn') ? process.env.NEXT_PUBLIC_SITE_URL : 'https://lyhu.com.vn';
    
    return {
        rules: [
            // ── 1. CHO PHÉP TẤT CẢ CÁC NỀN TẢNG AI SEARCH LỚN (TRUNG QUỐC & QUỐC TẾ) ──
            // Giúp AI trích xuất link, sản phẩm và tin tức của LYHU để giới thiệu cho khách hàng
            {
                userAgent: [
                    // AI Phương Tây & Toàn Cầu
                    'OAI-SearchBot',
                    'ChatGPT-User',
                    'GPTBot',
                    'PerplexityBot',
                    'Claude-Web',
                    'ClaudeBot',
                    'Google-Extended',
                    'GoogleOther',
                    'Applebot-Extended',
                    // AI Trung Quốc & Châu Á
                    'DeepSeekBot',
                    'DeepSeek',
                    'Baiduspider',
                    'Baiduspider-render',
                    'AliSpider',
                    'Alibaba',
                    'QwenBot',
                    'KimiBot',
                    'MoonshotBot',
                    'HunyuanBot',
                    'YisouSpider',
                    'Sogou web spider'
                ],
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/telesales/',
                    '/warehouse/',
                    '/login/',
                    '/debug-role/'
                ]
            },
            // ── 2. QUY TẮC MẶC ĐỊNH CHO TẤT CẢ NGƯỜI DÙNG & CÔNG CỤ TÌM KIẾM HỢP LỆ (Google, Bing...) ──
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/telesales/',
                    '/warehouse/',
                    '/login/',
                    '/debug-role/'
                ]
            },
            // ── 3. CHẶN ĐỨNG CÁC BOT CÀO DỮ LIỆU THÔ VÔ DANH (Không mang lại khách hàng, chỉ cào trộm) ──
            {
                userAgent: [
                    'CCBot',         // Common Crawl (Cào dữ liệu thô không trích nguồn)
                    'Bytespider',    // Scraper cào ngầm tần suất cao
                    'Diffbot',
                    'ImagesiftBot',
                    'DataForSeoBot'
                ],
                disallow: '/'
            }
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
