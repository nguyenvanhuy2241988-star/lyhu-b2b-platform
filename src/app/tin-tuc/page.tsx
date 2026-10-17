import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, TrendingUp, Sparkles, Play } from 'lucide-react';

const MENU_GROUPS = [
    { key: 'tin-tuc', name: 'Tin tức', icon: '📰', slugs: ['tin-nganh-fmcg', 'tin-tuc-fmcg', 'doanh-nghiep-lon'] },
    { key: 'kinh-doanh', name: 'Kinh doanh', icon: '🏪', slugs: ['goc-nha-phan-phoi-diem-ban', 'tap-hoa-gt', 'nha-phan-phoi-diem-ban', 'nghe-fmcg'] },
    { key: 'phan-tich', name: 'Phân tích', icon: '📊', slugs: ['bao-cao-thi-truong', 'ban-le-hien-dai', 'cua-hang-tien-loi', 'chuoi-cung-ung'] },
    { key: 'kien-thuc', name: 'Kiến thức', icon: '💡', slugs: ['cong-nghe-ban-le', 'phap-ly-chinh-ngach', 'tmdt-tiktok-shop'] },
    { key: 'san-pham', name: 'Sản phẩm', icon: '🛒', slugs: ['nganh-hang', 'xu-huong-tieu-dung'] },
    { key: 'doi-song', name: 'Đời sống', icon: '🌿', slugs: ['am-thuc-nau-an', 'suc-khoe-doi-song'] },
];
import { BlogPost, BlogCategory } from '@/lib/blogStore';
import { STATIC_EMAGAZINE_POSTS } from '@/lib/emagazinePosts';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';
import TrendingWidget from '@/components/blog/TrendingWidget';
import PostThumb from '@/components/blog/PostThumb';
import VideoStoryCarousel from '@/components/blog/VideoStoryCarousel';

export const dynamic = 'force-dynamic';
const POSTS_PER_PAGE = 12;

async function getBlogData(page: number, categorySlug: string, groupKey: string, searchQuery: string, typeFilter: string = 'all') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
    });

    // 1. Parallel Fetch: Categories, Trending, Banners, Video Stories
    const [categoriesRes, trendingRes, megaBannerRes, sideBannersRes, videoStoriesRes] = await Promise.all([
        supabase.from('blog_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('blog_posts').select('id, title, slug, published_at, created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(5),
        supabase.from('wholesale_banners').select('*').eq('position', 'news_mega').eq('is_active', true).order('sort_order', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('wholesale_banners').select('*').in('position', ['side_top', 'side_bottom']).eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('blog_posts').select('id, title, slug, thumbnail_url, video_url, is_video_vertical, published_at, created_at, ai_summary').eq('status', 'published').or('is_video_vertical.eq.true,video_url.not.is.null').order('created_at', { ascending: false }).limit(8)
    ]);

    const categories = categoriesRes.data;
    const trending = trendingRes.data;
    const megaBanner = megaBannerRes.data;
    const sideBanners = sideBannersRes.data;

    // 2. Build Posts Query
    let query = supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug)
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    // Apply Type Filter (article vs video)
    if (typeFilter === 'video') {
        query = query.or('is_video_vertical.eq.true,video_url.not.is.null');
    } else if (typeFilter === 'article') {
        query = query.or('is_video_vertical.is.null,is_video_vertical.eq.false');
    }

    // Apply Category Filter (single category or group)
    if (groupKey && groupKey !== 'all') {
        const group = MENU_GROUPS.find(g => g.key === groupKey);
        if (group) {
            const groupCatIds = (categories || []).filter(c => group.slugs.includes(c.slug)).map(c => c.id);
            if (groupCatIds.length > 0) {
                query = query.in('category_id', groupCatIds);
            }
        }
    } else if (categorySlug && categorySlug !== 'all') {
        const selectedCat = categories?.find(c => c.slug === categorySlug);
        if (selectedCat) {
            query = query.eq('category_id', selectedCat.id);
        }
    }

    // Tab VIDEO: chỉ bài có video
    if (onlyVideo) {
        query = query.not('video_url', 'is', null);
    }

    // Apply Search Filter (Search in title or content or ai_summary)
    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,ai_summary.ilike.%${searchQuery}%`);
    }

    // Apply Pagination
    const from = (page - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;
    query = query.range(from, to);

    // 4. Fetch Featured Blocks for Magazine Layout (Only on homepage and when typeFilter === 'all')
    let b1Promise: any = Promise.resolve({ data: null });
    let b2Promise: any = Promise.resolve({ data: null });

    if (categorySlug === 'all' && page === 1 && !searchQuery && typeFilter === 'all') {
        // Block 1: Tạp hóa & Phân phối (tap-hoa-gt, nha-phan-phoi-diem-ban)
        const block1CatIds = (categories || []).filter(c => ['tap-hoa-gt', 'nha-phan-phoi-diem-ban'].includes(c.slug)).map(c => c.id);
        if (block1CatIds.length > 0) {
            b1Promise = supabase
                .from('blog_posts')
                .select('*, category:blog_categories(id, name, slug)')
                .eq('status', 'published')
                .in('category_id', block1CatIds)
                .order('created_at', { ascending: false })
                .limit(4);
        }

        // Block 2: Xu hướng & TMĐT (tmdt-tiktok-shop, xu-huong-tieu-dung)
        const block2CatIds = (categories || []).filter(c => ['tmdt-tiktok-shop', 'xu-huong-tieu-dung'].includes(c.slug)).map(c => c.id);
        if (block2CatIds.length > 0) {
            b2Promise = supabase
                .from('blog_posts')
                .select('*, category:blog_categories(id, name, slug)')
                .eq('status', 'published')
                .in('category_id', block2CatIds)
                .order('created_at', { ascending: false })
                .limit(4);
        }
    }

    // Parallel Fetch 2: Posts & Featured Blocks
    const [postsRes, b1Res, b2Res] = await Promise.all([query, b1Promise, b2Promise]);

    const posts = postsRes.data;
    const count = postsRes.count;

    let featuredBlocks = { block1: [] as BlogPost[], block2: [] as BlogPost[] };
    if (b1Res.data) featuredBlocks.block1 = b1Res.data as BlogPost[];
    if (b2Res.data) featuredBlocks.block2 = b2Res.data as BlogPost[];

    // Process Video Stories for Carousel
    const rawVideoStories = (videoStoriesRes?.data || []) as any[];
    let videoStories = rawVideoStories.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        thumbnail_url: item.thumbnail_url || (item.slug?.includes('boyo') ? '/boyo_news_banner.jpg' : null),
        video_url: item.video_url,
        published_at: item.published_at || item.created_at,
        brand_tag: item.title.includes('CVT') ? 'CVT' : item.title.includes('BOYO') ? 'LYHU' : item.title.includes('UHi') ? 'UHi' : item.title.includes('ABI') ? 'ABI' : 'LYHU',
        duration: '0:45',
        headline: item.ai_summary ? item.ai_summary.slice(0, 48) + '...' : item.title
    }));

    // Fallback demo stories if DB has fewer than 4 vertical videos so the carousel looks rich & professional
    if (videoStories.length < 4) {
        const demoFallbacks = [
            {
                id: 'demo-cvt-1',
                title: 'Gia vị sấy thăng hoa CVT - Công nghệ đột phá',
                slug: 'khoai-mon-say-cvt-giai-phap-an-vat-lanh-manh-xu-huong-moi',
                thumbnail_url: 'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775408989723_ybzt28.png',
                brand_tag: 'CVT',
                duration: '0:38',
                headline: 'Bảo toàn 98% dinh dưỡng tự nhiên'
            },
            {
                id: 'demo-boyo-2',
                title: 'Bột phô mai lắc bắp rang bơ BOYO bùng nổ doanh số',
                slug: 'bot-pho-mai-boyo-vi-ngot-diu-beo-ngay-chinh-phuc-gioi-tre',
                thumbnail_url: '/boyo_news_banner.jpg',
                brand_tag: 'LYHU',
                duration: '0:45',
                headline: 'Hương vị béo ngậy ngọt dịu chuẩn gu trẻ'
            },
            {
                id: 'demo-uhi-3',
                title: 'Khăn ướt không mùi UHi đạt chuẩn tinh khiết',
                slug: 'tieu-chuan-khan-uot-cao-cap-u-hi-an-toan-cho-moi-lan-da',
                thumbnail_url: 'https://images.pexels.com/photos/3987142/pexels-photo-3987142.jpeg?auto=compress&cs=tinysrgb&w=600',
                brand_tag: 'UHi',
                duration: '0:30',
                headline: 'An toàn cho mẹ và bé, tinh khiết 99.9%'
            },
            {
                id: 'demo-cvt-4',
                title: 'Khoai môn sấy giòn CVT mở rộng mạng lưới NPP',
                slug: 'khoai-mon-say-cvt-giai-phap-an-vat-lanh-manh-xu-huong-moi',
                thumbnail_url: 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=600',
                brand_tag: 'CVT',
                duration: '0:50',
                headline: 'Chính sách chiết khấu tới 42% cho đại lý'
            }
        ];
        demoFallbacks.forEach(fb => {
            if (!videoStories.some(v => v.slug === fb.slug)) {
                videoStories.push(fb);
            }
        });
    }

    // Hàm trộn mảng ngẫu nhiên (Giả lập AI phân phối ngẫu nhiên)
    const shuffleArray = (array: any[]) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    const sideTopBanners = shuffleArray(sideBanners?.filter(b => b.position === 'side_top') || []);
    const sideBottomBanners = shuffleArray(sideBanners?.filter(b => b.position === 'side_bottom') || []);
    const staticPosts = (Object.values(STATIC_EMAGAZINE_POSTS) as BlogPost[]).filter(p => p.status === 'published');
    const dbPosts = (posts || []) as BlogPost[];
    
    // Nếu trang 1 và không có filter danh mục / tìm kiếm, ghim bài eMagazine lên đầu nếu chưa có trong DB (chỉ áp dụng cho All hoặc Article)
    if (page === 1 && (!categorySlug || categorySlug === 'all') && (!groupKey || groupKey === 'all') && !searchQuery && typeFilter !== 'video') {
        staticPosts.forEach(sp => {
            if (!combinedPosts.some(p => p.slug === sp.slug)) {
                combinedPosts.unshift(sp);
            }
        });
    }

    const sanitizeThumbnail = (p: BlogPost) => {
        if (!p) return p;
        if (p.slug?.includes('bot-pho-mai-boyo')) {
            p.thumbnail_url = '/boyo_news_banner.jpg';
        } else if (p.slug?.includes('khoai-mon-say-cvt')) {
            if (!p.thumbnail_url || p.thumbnail_url.includes('pexels')) {
                p.thumbnail_url = 'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775408989723_ybzt28.png';
            }
        }
        return p;
    };

    return {
        posts: combinedPosts.map(sanitizeThumbnail),
        categories: (categories || []) as BlogCategory[],
        trendingPosts: (trending || []) as Partial<BlogPost>[],
        videoStories,
        totalCount: (count || 0) + (page === 1 && typeFilter !== 'video' ? staticPosts.length : 0),
        featuredBlocks,
        megaBanner,
        sideTopBanners,
        sideBottomBanners
    };
}

export default async function BlogIndexPage({
    searchParams
}: {
    searchParams: { category?: string; group?: string; page?: string; q?: string; type?: string }
}) {
    const activeCategory = searchParams.category || 'all';
    const activeGroup = searchParams.group || '';
    const currentPage = parseInt(searchParams.page || '1', 10);
    const searchQuery = searchParams.q || '';
    const activeType = searchParams.type || 'all';
    const isHome = currentPage === 1 && activeCategory === 'all' && !activeGroup && !searchQuery && activeType === 'all';

    const { posts, categories, trendingPosts, videoStories, totalCount, featuredBlocks, megaBanner, sideTopBanners, sideBottomBanners } = await getBlogData(
        currentPage,
        activeCategory,
        activeGroup,
        searchQuery,
        activeType
    );

    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

    const buildTypeUrl = (newType: string) => {
        const params = new URLSearchParams();
        if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
        if (activeGroup) params.set('group', activeGroup);
        if (searchQuery) params.set('q', searchQuery);
        if (newType !== 'all') params.set('type', newType);
        const qs = params.toString();
        return `/tin-tuc${qs ? `?${qs}` : ''}`;
    };

    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8 overflow-hidden">
            
            {/* Top Toolbar: Categories */}
            <div className="bg-white border-y border-gray-200 relative z-40" style={{ overflow: 'visible' }}>
                
                {/* Mobile Navigation (Horizontal Scroll with Pills) */}
                <div className="flex md:hidden flex-row items-center gap-x-2 px-4 py-3 overflow-x-auto scrollbar-hide w-full">
                    <Link 
                        href={`/tin-tuc${searchQuery ? `?q=${searchQuery}` : ''}`}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap ${
                            !activeGroup && activeCategory === 'all' && !onlyVideo 
                            ? 'bg-[#00AFA9] text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                    >
                        Tất cả
                    </Link>
                    <Link
                        href="/bao-hinh"
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap inline-flex items-center gap-1 ${
                            onlyVideo ? 'bg-[#00AFA9] text-white shadow-sm' : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                    >
                        <Play className="w-3 h-3 fill-current" /> Video
                    </Link>
                    {categories.map(cat => (
                        <Link 
                            key={cat.id}
                            href={`/tin-tuc?category=${cat.slug}${searchQuery ? `&q=${searchQuery}` : ''}`}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap ${
                                activeCategory === cat.slug 
                                ? 'bg-[#00AFA9] text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>

                {/* Desktop Navigation (GenK Style Hybrid Menu) */}
                <div className="hidden md:flex flex-row items-center justify-between max-w-[1200px] mx-auto relative" style={{ overflow: 'visible' }}>
                    <div className="flex flex-row items-center gap-x-6 w-full px-4">
                        
                        {/* Tất cả - Opens Full Mega Menu */}
                        <div className="group/all static">
                            <Link 
                                href={`/tin-tuc${searchQuery ? `?q=${searchQuery}` : ''}`}
                                className={`block py-3.5 pb-4 text-[14px] font-bold uppercase transition-colors duration-300 whitespace-nowrap ${
                                    !activeGroup && activeCategory === 'all' && !onlyVideo 
                                    ? 'text-[#00AFA9] border-b-[3px] border-[#00AFA9]' 
                                    : 'text-gray-800 hover:text-[#00AFA9] border-b-[3px] border-transparent'
                                }`}
                            >
                                Tất cả
                            </Link>
                            {/* Full Width Mega Menu */}
                            <div className="absolute top-full left-0 w-full bg-white border-t-2 border-[#00AFA9] border border-slate-200 opacity-0 invisible group-hover/all:opacity-100 group-hover/all:visible transition-all duration-300 z-[60]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                                    {MENU_GROUPS.map(group => (
                                        <div key={group.key} className="flex flex-col">
                                            <Link href={`/tin-tuc?group=${group.key}`} className="text-[14px] font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200 flex items-center gap-2 hover:text-[#00AFA9] transition-colors">
                                                <span className="text-xl">{group.icon}</span> {group.name}
                                            </Link>
                                            <div className="flex flex-col space-y-3">
                                                {group.slugs.map(slug => {
                                                    const cat = categories.find(c => c.slug === slug);
                                                    if (!cat) return null;
                                                    return (
                                                        <Link key={cat.id} href={`/tin-tuc?category=${cat.slug}`} className={`text-[13px] transition-colors flex items-center group/link ${activeCategory === cat.slug ? 'text-[#00AFA9] font-bold' : 'text-gray-600 hover:text-[#00AFA9]'}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover/link:bg-[#00AFA9] transition-colors"></span>
                                                            {cat.name}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tab VIDEO */}
                        <Link
                            href="/bao-hinh"
                            className={`shrink-0 py-3.5 pb-4 text-[14px] font-bold uppercase transition-colors duration-300 whitespace-nowrap inline-flex items-center gap-1.5 ${
                                onlyVideo
                                ? 'text-[#00AFA9] border-b-[3px] border-[#00AFA9]'
                                : 'text-gray-800 hover:text-[#00AFA9] border-b-[3px] border-transparent'
                            }`}
                        >
                            <Play className="w-3.5 h-3.5 fill-current" /> Video
                        </Link>

                        {/* Individual Categories - Opens Small Dropdown */}
                        {MENU_GROUPS.map(group => {
                            const isActive = activeGroup === group.key || (!activeGroup && group.slugs.includes(activeCategory));
                            return (
                                <div key={group.key} className="group/menu shrink-0 relative" style={{ overflow: 'visible' }}>
                                    <Link 
                                        href={`/tin-tuc?group=${group.key}${searchQuery ? `&q=${searchQuery}` : ''}`}
                                        className={`block py-3.5 pb-4 text-[14px] font-bold uppercase transition-colors duration-300 whitespace-nowrap ${
                                            isActive 
                                            ? 'text-[#00AFA9] border-b-[3px] border-[#00AFA9]' 
                                            : 'text-gray-800 hover:text-[#00AFA9] border-b-[3px] border-transparent'
                                        }`}
                                    >
                                        {group.name}
                                    </Link>
                                    {/* Small Hover Dropdown */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[220px] bg-white border-t-2 border-[#00AFA9] border border-slate-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 py-2">
                                        {group.slugs.map(slug => {
                                            const cat = categories.find(c => c.slug === slug);
                                            if (!cat) return null;
                                            return (
                                                <Link 
                                                    key={cat.id}
                                                    href={`/tin-tuc?category=${cat.slug}${searchQuery ? `&q=${searchQuery}` : ''}`}
                                                    className={`block px-5 py-2.5 text-[13px] transition-colors whitespace-nowrap ${
                                                        activeCategory === cat.slug 
                                                        ? 'text-[#00AFA9] bg-teal-50 font-bold' 
                                                        : 'text-gray-700 hover:text-[#00AFA9] hover:bg-gray-50 font-medium'
                                                    }`}
                                                >
                                                    {cat.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Hamburger Trigger - Opens Full Mega Menu */}
                        <div className="ml-auto group/hamburger static">
                            <div className="flex items-center cursor-pointer py-3.5 pb-4 text-gray-800 hover:text-[#00AFA9] transition-colors">
                                <span className="text-[14px] font-bold uppercase mr-2">Danh Mục</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </div>
                            {/* Full Width Mega Menu */}
                            <div className="absolute top-full left-0 w-full bg-white border-t-2 border-[#00AFA9] border border-slate-200 opacity-0 invisible group-hover/hamburger:opacity-100 group-hover/hamburger:visible transition-all duration-300 z-[60]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                                    {MENU_GROUPS.map(group => (
                                        <div key={group.key} className="flex flex-col">
                                            <Link href={`/tin-tuc?group=${group.key}`} className="text-[14px] font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200 flex items-center gap-2 hover:text-[#00AFA9] transition-colors">
                                                <span className="text-xl">{group.icon}</span> {group.name}
                                            </Link>
                                            <div className="flex flex-col space-y-3">
                                                {group.slugs.map(slug => {
                                                    const cat = categories.find(c => c.slug === slug);
                                                    if (!cat) return null;
                                                    return (
                                                        <Link key={cat.id} href={`/tin-tuc?category=${cat.slug}`} className={`text-[13px] transition-colors flex items-center group/link ${activeCategory === cat.slug ? 'text-[#00AFA9] font-bold' : 'text-gray-600 hover:text-[#00AFA9]'}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover/link:bg-[#00AFA9] transition-colors"></span>
                                                            {cat.name}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Mega Banner Space (Dynamic or Placeholder) */}
            {megaBanner ? (
                <div className="w-full relative overflow-hidden">
                    <Link href={megaBanner.link_url || "/"} target={megaBanner.link_url?.startsWith('http') ? "_blank" : "_self"}>
                        <img 
                            src={megaBanner.image_url} 
                            alt="Mega Banner" 
                            className="w-full aspect-[21/9] object-cover"
                        />
                    </Link>
                </div>
            ) : (
                <div className="w-full relative overflow-hidden">
                    <img 
                        src="https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                        alt="Mega Banner" 
                        className="w-full aspect-[21/9] object-cover"
                    />
                    <div className="absolute inset-0 bg-[#00AFA9]/90 flex flex-col justify-center px-6 md:px-12">
                        <h2 className="text-white text-2xl md:text-4xl font-black mb-3 max-w-2xl leading-tight">
                            CẦN NGUỒN SỈ TẠP HÓA?<br/>TỚI NGAY LYHU WHOLESALE
                        </h2>
                        <p className="text-white/90 text-sm md:text-base font-medium mb-5 max-w-xl">Hệ thống phân phối hàng tiêu dùng B2B chiết khấu lên tới 45% dành riêng cho các điểm bán lẻ và siêu thị mini.</p>
                        <div>
                            <Link href="/" className="inline-block px-6 py-2.5 bg-white text-[#00AFA9] font-bold rounded-lg hover:bg-slate-50 transition-all text-sm border border-slate-200">
                                Đăng Ký Báo Giá
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Báo hình LYHU Carousel (Horizontal Reel Stories) */}
            <VideoStoryCarousel items={videoStories} />

            {/* Content Area */}
            <div className="flex flex-col lg:flex-row gap-10 overflow-hidden">
                
                {/* Left: Article Grid */}
                <div className="flex-1 min-w-0">
                    
                    {/* Sub-filter tabs & Section title */}
                    <div className="mb-6 pb-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href={buildTypeUrl('all')}
                                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                                    activeType === 'all'
                                        ? 'bg-[#00ABA9] text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Tất cả
                            </Link>
                            <Link
                                href={buildTypeUrl('article')}
                                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                                    activeType === 'article'
                                        ? 'bg-[#00ABA9] text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span>Bài viết</span>
                                <span className="text-xs">📰</span>
                            </Link>
                            <Link
                                href={buildTypeUrl('video')}
                                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                                    activeType === 'video'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span>Báo hình</span>
                                <span className="text-xs">🎬</span>
                            </Link>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-gray-500">
                            {searchQuery ? (
                                <p>Tìm kiếm: <strong className="text-gray-900">"{searchQuery}"</strong></p>
                            ) : (
                                <p className="font-semibold text-gray-700">
                                    {activeGroup 
                                        ? (MENU_GROUPS.find(g => g.key === activeGroup)?.icon || '') + ' ' + (MENU_GROUPS.find(g => g.key === activeGroup)?.name || '')
                                        : activeCategory === 'all' 
                                            ? (activeType === 'video' ? '🎬 Báo hình dưới 1 phút' : 'Tin mới cập nhật') 
                                            : categories.find(c => c.slug === activeCategory)?.name
                                    }
                                </p>
                            )}
                            <span className="text-gray-300">•</span>
                            <p className="font-medium text-gray-600">{totalCount} {activeType === 'video' ? 'video' : 'bài'}</p>
                        </div>
                    </div>

                    {posts.length === 0 ? (
                        <div className="bg-white p-16 text-center rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết nào</h3>
                            <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
                            {(searchQuery || activeCategory !== 'all') && (
                                <Link href="/tin-tuc" className="mt-4 text-[#00AFA9] font-semibold hover:underline">
                                    Xóa bộ lọc
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Top News (Hero) & Timeline */}
                            <div className="space-y-8">
                                {/* Only show Hero on the first page of "All Categories" without search and when viewing all types */}
                                {isHome && posts.length >= 3 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-200">
                                        {/* Main Featured Article (Col 1 & 2) */}
                                        <div className="md:col-span-2">
                                            <Link href={`/tin-tuc/${posts[0].slug}`} className="group block">
                                                <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden relative mb-4">
                                                    {posts[0].thumbnail_url ? (
                                                        <PostThumb post={posts[0]} size="lg" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-teal-50 text-[#00AFA9]/40">
                                                            <span className="font-bold text-3xl">LYHU</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {posts[0].category && (
                                                    <span className="text-xs font-bold text-[#00AFA9] uppercase tracking-wider mb-2 block">
                                                        {posts[0].category.name}
                                                    </span>
                                                )}
                                                <h2 className="text-3xl font-extrabold text-gray-900 group-hover:text-[#00AFA9] transition-colors mb-3 leading-tight">
                                                    {posts[0].title}
                                                </h2>
                                                <p className="text-gray-600 text-base line-clamp-3 mb-4">
                                                    {posts[0].meta_description || posts[0].ai_summary}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 font-medium">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                    {new Date(posts[0].published_at || posts[0].created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </div>
                                            </Link>
                                        </div>

                                        {/* 2 Sub Featured Articles (Col 3) */}
                                        <div className="flex flex-col gap-6 md:pl-6 md:border-l md:border-gray-200">
                                            {[posts[1], posts[2]].map(post => (
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex flex-col flex-1">
                                                    <div className="aspect-video w-full bg-gray-100 overflow-hidden relative mb-3">
                                                        {post.thumbnail_url ? (
                                                            <PostThumb post={post} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-teal-50 text-[#00AFA9]/40">
                                                                <span className="font-bold text-xl">LYHU</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#00AFA9] transition-colors line-clamp-3 mb-2 leading-snug">
                                                        {post.title}
                                                    </h3>
                                                    <div className="mt-auto flex items-center text-xs text-gray-400 font-medium">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                        {new Date(post.published_at || post.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Featured Block 1: Tạp hóa & Phân phối */}
                                {isHome && featuredBlocks?.block1?.length > 0 && (
                                    <div className="mb-10 pb-10 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-[#00AFA9] pl-3">Góc Nhà Phân Phối & Tạp Hóa</h3>
                                            <Link href="/tin-tuc?category=tap-hoa-gt" className="text-sm font-semibold text-[#00AFA9] hover:text-[#009690] flex items-center">
                                                Xem thêm <TrendingUp className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {featuredBlocks.block1.map(post => (
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-4 bg-gray-50 p-4 hover:bg-teal-50 transition-colors border border-gray-100">
                                                    <div className="w-32 sm:w-40 aspect-video self-center shrink-0 bg-white overflow-hidden relative">
                                                        {post.thumbnail_url ? (
                                                            <PostThumb post={post} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#00AFA9]/40 font-bold text-xs">LYHU</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        {post.category && (
                                                            <span className="text-[10px] font-bold text-[#00AFA9] uppercase tracking-wider mb-1 block">
                                                                {post.category.name}
                                                            </span>
                                                        )}
                                                        <h4 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#009690] leading-snug">{post.title}</h4>
                                                        <div className="text-xs text-gray-500 font-medium flex items-center mt-auto">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Featured Block 2: Xu hướng & TMĐT */}
                                {isHome && featuredBlocks?.block2?.length > 0 && (
                                    <div className="mb-10 pb-10 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-[#00AFA9] pl-3">Thương mại điện tử & Xu hướng</h3>
                                            <Link href="/tin-tuc?category=tmdt-tiktok-shop" className="text-sm font-semibold text-[#00AFA9] hover:text-[#009690] flex items-center">
                                                Xem thêm <TrendingUp className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                            {featuredBlocks.block2.map(post => (
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex flex-col">
                                                    <div className="w-full aspect-video bg-gray-100 overflow-hidden relative mb-3">
                                                        {post.thumbnail_url ? (
                                                            <PostThumb post={post} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#00AFA9]/40 font-bold">LYHU</div>
                                                        )}
                                                    </div>
                                                    {post.category && (
                                                        <span className="text-[10px] font-bold text-[#00AFA9] uppercase tracking-wider mb-1 block">
                                                            {post.category.name}
                                                        </span>
                                                    )}
                                                    <h4 className="font-bold text-gray-900 line-clamp-3 mb-2 group-hover:text-[#009690] text-sm leading-snug">{post.title}</h4>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline List View */}
                                <div className="space-y-8">
                                    {isHome && (
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2 border-l-4 border-[#00AFA9] pl-3">
                                            {activeType === 'video' ? 'Bản tin video FMCG' : activeType === 'article' ? 'Dòng bài viết mới nhất' : 'Dòng sự kiện mới nhất'}
                                        </h3>
                                    )}
                                    {(isHome && posts.length >= 3 
                                        ? posts.slice(3) 
                                        : posts).map((post) => {
                                        const isVideo = Boolean(post.is_video_vertical || (post.video_url && post.video_url.includes('.mp4')));
                                        return (
                                        <Link 
                                            key={post.id} 
                                            href={`/tin-tuc/${post.slug}`} 
                                            className="group flex flex-col sm:flex-row gap-6 pb-8 border-b border-gray-100 last:border-0"
                                        >
                                            {/* Thumbnail Left */}
                                            <div className="w-full sm:w-[280px] shrink-0 aspect-video self-start bg-gray-100 overflow-hidden relative rounded-lg">
                                                {post.thumbnail_url ? (
                                                    <PostThumb post={post} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-teal-50 text-[#00AFA9]/40">
                                                        <span className="font-bold text-xl">LYHU</span>
                                                    </div>
                                                )}
                                                {isVideo && (
                                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                                                        <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                            <Play className="w-5 h-5 fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Content Right */}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {post.category && (
                                                        <span className="text-xs font-bold text-[#00AFA9] uppercase tracking-wider block">
                                                            {post.category.name}
                                                        </span>
                                                    )}
                                                    {isVideo && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                                            Báo hình 🎬
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#00AFA9] transition-colors line-clamp-2 mb-2 sm:mb-3 leading-snug">
                                                    {post.title}
                                                </h3>
                                                <p className="text-gray-500 text-sm sm:text-base line-clamp-2 mb-3">
                                                    {post.meta_description || post.ai_summary}
                                                </p>
                                                <div className="mt-auto flex items-center text-xs text-gray-400 font-medium">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                    {new Date(post.published_at || post.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </Link>
                                    );})}
                                </div>
                            </div>

                            {/* Pagination Component */}
                            <Pagination currentPage={currentPage} totalPages={totalPages} />
                        </>
                    )}
                </div>

                {/* Right Sidebar */}
                <aside className="w-full lg:w-[320px] shrink-0 space-y-8">
                    
                    {/* Side Top Banners */}
                    {sideTopBanners.map((banner, idx) => (
                        <div key={banner.id || idx} className="w-full relative overflow-hidden">
                            <Link href={banner.link_url || "/"} target={banner.link_url?.startsWith('http') ? "_blank" : "_self"}>
                                <img src={banner.image_url} alt={`Side Top Banner ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-auto object-cover border border-gray-100" />
                            </Link>
                        </div>
                    ))}
                    
                    {/* Trending Widget (Client Component with Day/Week/Month) */}
                    <TrendingWidget />

                    {/* Side Bottom Banners */}
                    {sideBottomBanners.map((banner: any, idx: number) => (
                        <div key={banner.id || idx} className="w-full relative overflow-hidden">
                            <Link href={banner.link_url || "/"} target={banner.link_url?.startsWith('http') ? "_blank" : "_self"}>
                                <img src={banner.image_url} alt={`Side Bottom Banner ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-auto object-cover border border-gray-100" />
                            </Link>
                        </div>
                    ))}

                    {/* B2B Promo Widget */}
                    <div className="bg-teal-50 p-6 border border-teal-100 text-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Nhập sỉ tận xưởng?</h3>
                        <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                            Tham gia hệ thống phân phối LYHU với mức chiết khấu lên tới 45%.
                        </p>
                        <Link 
                            href="/" 
                            className="block w-full bg-[#00AFA9] text-white py-2.5 text-sm font-bold hover:bg-[#009690] transition-colors"
                        >
                            Đăng ký Báo Giá
                        </Link>
                    </div>
                </aside>
                
            </div>
        </div>
    );
}
