import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, TrendingUp, Sparkles } from 'lucide-react';

const MENU_GROUPS = [
    { key: 'tin-tuc', name: 'Tin tức', icon: '📰', slugs: ['tin-nganh-fmcg', 'tin-tuc-fmcg', 'doanh-nghiep-lon'] },
    { key: 'kinh-doanh', name: 'Kinh doanh', icon: '🏪', slugs: ['goc-nha-phan-phoi-diem-ban', 'tap-hoa-gt', 'nha-phan-phoi-diem-ban', 'nghe-fmcg'] },
    { key: 'phan-tich', name: 'Phân tích', icon: '📊', slugs: ['bao-cao-thi-truong', 'ban-le-hien-dai', 'cua-hang-tien-loi', 'chuoi-cung-ung'] },
    { key: 'kien-thuc', name: 'Kiến thức', icon: '💡', slugs: ['cong-nghe-ban-le', 'phap-ly-chinh-ngach', 'tmdt-tiktok-shop'] },
    { key: 'san-pham', name: 'Sản phẩm', icon: '🛒', slugs: ['nganh-hang', 'xu-huong-tieu-dung'] },
    { key: 'doi-song', name: 'Đời sống', icon: '🌿', slugs: ['am-thuc-nau-an', 'suc-khoe-doi-song'] },
];
import { BlogPost, BlogCategory } from '@/lib/blogStore';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';
import TrendingWidget from '@/components/blog/TrendingWidget';

export const dynamic = 'force-dynamic';
const POSTS_PER_PAGE = 12;

async function getBlogData(page: number, categorySlug: string, groupKey: string, searchQuery: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
    });

    // 1. Fetch Categories
    const { data: categories } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });

    // 2. Build Posts Query
    let query = supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug)
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false });

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

    // Apply Search Filter (Search in title or content or ai_summary)
    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,ai_summary.ilike.%${searchQuery}%`);
    }

    // Apply Pagination
    const from = (page - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data: posts, count } = await query;

    // 3. Fetch Trending (Placeholder for right sidebar)
    // In a real app, this would be based on views. For now, get 5 random/latest
    const { data: trending } = await supabase
        .from('blog_posts')
        .select('id, title, slug, published_at, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

    // 4. Fetch Featured Blocks for Magazine Layout (Only on homepage)
    let featuredBlocks = { block1: [] as BlogPost[], block2: [] as BlogPost[] };
    if (categorySlug === 'all' && page === 1 && !searchQuery) {
        // Block 1: Tạp hóa & Phân phối (tap-hoa-gt, nha-phan-phoi-diem-ban)
        const block1CatIds = (categories || []).filter(c => ['tap-hoa-gt', 'nha-phan-phoi-diem-ban'].includes(c.slug)).map(c => c.id);
        if (block1CatIds.length > 0) {
            const { data: b1 } = await supabase
                .from('blog_posts')
                .select('*, category:blog_categories(id, name, slug)')
                .eq('status', 'published')
                .in('category_id', block1CatIds)
                .order('created_at', { ascending: false })
                .limit(4);
            featuredBlocks.block1 = (b1 || []) as BlogPost[];
        }

        // Block 2: Xu hướng & TMĐT (tmdt-tiktok-shop, xu-huong-tieu-dung)
        const block2CatIds = (categories || []).filter(c => ['tmdt-tiktok-shop', 'xu-huong-tieu-dung'].includes(c.slug)).map(c => c.id);
        if (block2CatIds.length > 0) {
            const { data: b2 } = await supabase
                .from('blog_posts')
                .select('*, category:blog_categories(id, name, slug)')
                .eq('status', 'published')
                .in('category_id', block2CatIds)
                .order('created_at', { ascending: false })
                .limit(4);
            featuredBlocks.block2 = (b2 || []) as BlogPost[];
        }
    }

    // 5. Fetch Mega Banner
    const { data: megaBanner } = await supabase
        .from('wholesale_banners')
        .select('*')
        .eq('position', 'news_mega')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

    // 6. Fetch Side Banners
    const { data: sideBanners } = await supabase
        .from('wholesale_banners')
        .select('*')
        .in('position', ['side_top', 'side_bottom'])
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

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

    return {
        posts: (posts || []) as BlogPost[],
        categories: (categories || []) as BlogCategory[],
        trendingPosts: (trending || []) as Partial<BlogPost>[],
        totalCount: count || 0,
        featuredBlocks,
        megaBanner,
        sideTopBanners,
        sideBottomBanners
    };
}

export default async function BlogIndexPage({
    searchParams
}: {
    searchParams: { category?: string; group?: string; page?: string; q?: string }
}) {
    const activeCategory = searchParams.category || 'all';
    const activeGroup = searchParams.group || '';
    const currentPage = parseInt(searchParams.page || '1', 10);
    const searchQuery = searchParams.q || '';

    const { posts, categories, trendingPosts, totalCount, featuredBlocks, megaBanner, sideTopBanners, sideBottomBanners } = await getBlogData(
        currentPage,
        activeCategory,
        activeGroup,
        searchQuery
    );

    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

    return (
        <div className="space-y-8">
            
            {/* Top Toolbar: Categories */}
            <div className="bg-white border-y border-gray-200 relative z-40" style={{ overflow: 'visible' }}>
                
                {/* Mobile Navigation (Horizontal Scroll with Pills) */}
                <div className="flex md:hidden flex-row items-center gap-x-2 px-4 py-3 overflow-x-auto scrollbar-hide w-full">
                    <Link 
                        href={`/tin-tuc${searchQuery ? `?q=${searchQuery}` : ''}`}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap ${
                            !activeGroup && activeCategory === 'all' 
                            ? 'bg-primary-600 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                    >
                        Tất cả
                    </Link>
                    {categories.map(cat => (
                        <Link 
                            key={cat.id}
                            href={`/tin-tuc?category=${cat.slug}${searchQuery ? `&q=${searchQuery}` : ''}`}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap ${
                                activeCategory === cat.slug 
                                ? 'bg-primary-600 text-white shadow-sm' 
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
                                    !activeGroup && activeCategory === 'all' 
                                    ? 'text-primary-700 border-b-[3px] border-primary-600' 
                                    : 'text-gray-800 hover:text-primary-600 border-b-[3px] border-transparent'
                                }`}
                            >
                                Tất cả
                            </Link>
                            {/* Full Width Mega Menu */}
                            <div className="absolute top-full left-0 w-full bg-white border-t-2 border-primary-600 shadow-2xl opacity-0 invisible group-hover/all:opacity-100 group-hover/all:visible transition-all duration-300 z-[60]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                                    {MENU_GROUPS.map(group => (
                                        <div key={group.key} className="flex flex-col">
                                            <Link href={`/tin-tuc?group=${group.key}`} className="text-[14px] font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200 flex items-center gap-2 hover:text-primary-600 transition-colors">
                                                <span className="text-xl">{group.icon}</span> {group.name}
                                            </Link>
                                            <div className="flex flex-col space-y-3">
                                                {group.slugs.map(slug => {
                                                    const cat = categories.find(c => c.slug === slug);
                                                    if (!cat) return null;
                                                    return (
                                                        <Link key={cat.id} href={`/tin-tuc?category=${cat.slug}`} className={`text-[13px] transition-colors flex items-center group/link ${activeCategory === cat.slug ? 'text-primary-600 font-bold' : 'text-gray-600 hover:text-primary-600'}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover/link:bg-primary-500 transition-colors"></span>
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

                        {/* Individual Categories - Opens Small Dropdown */}
                        {MENU_GROUPS.map(group => {
                            const isActive = activeGroup === group.key || (!activeGroup && group.slugs.includes(activeCategory));
                            return (
                                <div key={group.key} className="group/menu shrink-0 relative" style={{ overflow: 'visible' }}>
                                    <Link 
                                        href={`/tin-tuc?group=${group.key}${searchQuery ? `&q=${searchQuery}` : ''}`}
                                        className={`block py-3.5 pb-4 text-[14px] font-bold uppercase transition-colors duration-300 whitespace-nowrap ${
                                            isActive 
                                            ? 'text-primary-700 border-b-[3px] border-primary-600' 
                                            : 'text-gray-800 hover:text-primary-600 border-b-[3px] border-transparent'
                                        }`}
                                    >
                                        {group.name}
                                    </Link>
                                    {/* Small Hover Dropdown */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[220px] bg-white border-t-2 border-primary-600 shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 py-2">
                                        {group.slugs.map(slug => {
                                            const cat = categories.find(c => c.slug === slug);
                                            if (!cat) return null;
                                            return (
                                                <Link 
                                                    key={cat.id}
                                                    href={`/tin-tuc?category=${cat.slug}${searchQuery ? `&q=${searchQuery}` : ''}`}
                                                    className={`block px-5 py-2.5 text-[13px] transition-colors whitespace-nowrap ${
                                                        activeCategory === cat.slug 
                                                        ? 'text-primary-700 bg-primary-50 font-bold' 
                                                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium'
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
                            <div className="flex items-center cursor-pointer py-3.5 pb-4 text-gray-800 hover:text-primary-600 transition-colors">
                                <span className="text-[14px] font-bold uppercase mr-2">Danh Mục</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </div>
                            {/* Full Width Mega Menu */}
                            <div className="absolute top-full left-0 w-full bg-white border-t-2 border-primary-600 shadow-2xl opacity-0 invisible group-hover/hamburger:opacity-100 group-hover/hamburger:visible transition-all duration-300 z-[60]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                                    {MENU_GROUPS.map(group => (
                                        <div key={group.key} className="flex flex-col">
                                            <Link href={`/tin-tuc?group=${group.key}`} className="text-[14px] font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200 flex items-center gap-2 hover:text-primary-600 transition-colors">
                                                <span className="text-xl">{group.icon}</span> {group.name}
                                            </Link>
                                            <div className="flex flex-col space-y-3">
                                                {group.slugs.map(slug => {
                                                    const cat = categories.find(c => c.slug === slug);
                                                    if (!cat) return null;
                                                    return (
                                                        <Link key={cat.id} href={`/tin-tuc?category=${cat.slug}`} className={`text-[13px] transition-colors flex items-center group/link ${activeCategory === cat.slug ? 'text-primary-600 font-bold' : 'text-gray-600 hover:text-primary-600'}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover/link:bg-primary-500 transition-colors"></span>
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
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/60 to-transparent flex flex-col justify-center px-6 md:px-12">
                        <h2 className="text-white text-2xl md:text-4xl font-black mb-3 drop-shadow-lg max-w-2xl leading-tight">
                            CẦN NGUỒN SỈ TẠP HÓA?<br/>TỚI NGAY LYHU WHOLESALE
                        </h2>
                        <p className="text-primary-100 text-sm md:text-base font-medium mb-5 max-w-xl">Hệ thống phân phối hàng tiêu dùng B2B chiết khấu lên tới 45% dành riêng cho các điểm bán lẻ và siêu thị mini.</p>
                        <div>
                            <Link href="/" className="inline-block px-6 py-2.5 bg-white text-primary-700 font-bold rounded-lg hover:bg-primary-50 hover:shadow-lg transition-all text-sm">
                                Đăng Ký Báo Giá
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex flex-col lg:flex-row gap-10">
                
                {/* Left: Article Grid */}
                <div className="flex-1">
                    
                    {/* Header info (Total results) */}
                    <div className="mb-6 flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-2">
                        {searchQuery ? (
                            <p>Kết quả tìm kiếm cho: <strong className="text-gray-900">"{searchQuery}"</strong></p>
                        ) : (
                            <p className="font-semibold text-gray-800 flex items-center gap-2">
                                {activeGroup 
                                    ? (MENU_GROUPS.find(g => g.key === activeGroup)?.icon || '') + ' ' + (MENU_GROUPS.find(g => g.key === activeGroup)?.name || '')
                                    : activeCategory === 'all' ? 'Tin mới cập nhật' : categories.find(c => c.slug === activeCategory)?.name
                                }
                            </p>
                        )}
                        <p>{totalCount} bài viết</p>
                    </div>

                    {posts.length === 0 ? (
                        <div className="bg-white p-16 text-center rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết nào</h3>
                            <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
                            {(searchQuery || activeCategory !== 'all') && (
                                <Link href="/tin-tuc" className="mt-4 text-primary-600 font-semibold hover:underline">
                                    Xóa bộ lọc
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Top News (Hero) & Timeline */}
                            <div className="space-y-8">
                                {/* Only show Hero on the first page of "All Categories" without search */}
                                {currentPage === 1 && activeCategory === 'all' && !searchQuery && posts.length >= 3 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-200">
                                        {/* Main Featured Article (Col 1 & 2) */}
                                        <div className="md:col-span-2">
                                            <Link href={`/tin-tuc/${posts[0].slug}`} className="group block">
                                                <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden relative mb-4">
                                                    {posts[0].thumbnail_url ? (
                                                        <img 
                                                            src={posts[0].thumbnail_url} 
                                                            alt={posts[0].title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                                            <span className="font-bold text-3xl">LYHU</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {posts[0].category && (
                                                    <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2 block">
                                                        {posts[0].category.name}
                                                    </span>
                                                )}
                                                <h2 className="text-3xl font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors mb-3 leading-tight">
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
                                                    <div className="aspect-[16/10] w-full bg-gray-100 overflow-hidden relative mb-3">
                                                        {post.thumbnail_url ? (
                                                            <img 
                                                                src={post.thumbnail_url} 
                                                                alt={post.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                                                <span className="font-bold text-xl">LYHU</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-3 mb-2 leading-snug">
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
                                {currentPage === 1 && activeCategory === 'all' && !searchQuery && featuredBlocks?.block1?.length > 0 && (
                                    <div className="mb-10 pb-10 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-primary-600 pl-3">Góc Nhà Phân Phối & Tạp Hóa</h3>
                                            <Link href="/tin-tuc?category=tap-hoa-gt" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center">
                                                Xem thêm <TrendingUp className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {featuredBlocks.block1.map(post => (
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-4 bg-gray-50 p-4 hover:bg-primary-50 transition-colors border border-gray-100">
                                                    <div className="w-28 h-28 shrink-0 bg-white overflow-hidden relative">
                                                        {post.thumbnail_url ? (
                                                            <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-primary-200 font-bold text-xs">LYHU</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        {post.category && (
                                                            <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1 block">
                                                                {post.category.name}
                                                            </span>
                                                        )}
                                                        <h4 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-700 leading-snug">{post.title}</h4>
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
                                {currentPage === 1 && activeCategory === 'all' && !searchQuery && featuredBlocks?.block2?.length > 0 && (
                                    <div className="mb-10 pb-10 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-primary-600 pl-3">Thương mại điện tử & Xu hướng</h3>
                                            <Link href="/tin-tuc?category=tmdt-tiktok-shop" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center">
                                                Xem thêm <TrendingUp className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                            {featuredBlocks.block2.map(post => (
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex flex-col">
                                                    <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden relative mb-3">
                                                        {post.thumbnail_url ? (
                                                            <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-primary-200 font-bold">LYHU</div>
                                                        )}
                                                    </div>
                                                    {post.category && (
                                                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1 block">
                                                            {post.category.name}
                                                        </span>
                                                    )}
                                                    <h4 className="font-bold text-gray-900 line-clamp-3 mb-2 group-hover:text-primary-700 text-sm leading-snug">{post.title}</h4>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline List View */}
                                <div className="space-y-8">
                                    {currentPage === 1 && activeCategory === 'all' && !searchQuery && (
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2 border-l-4 border-primary-600 pl-3">Dòng sự kiện mới nhất</h3>
                                    )}
                                    {(currentPage === 1 && activeCategory === 'all' && !searchQuery && posts.length >= 3 
                                        ? posts.slice(3) 
                                        : posts).map((post, index) => (
                                        <Link 
                                            key={post.id} 
                                            href={`/tin-tuc/${post.slug}`} 
                                            className="group flex flex-col sm:flex-row gap-6 pb-8 border-b border-gray-100 last:border-0"
                                        >
                                            {/* Thumbnail Left */}
                                            <div className="w-full sm:w-[280px] shrink-0 aspect-[16/10] bg-gray-100 overflow-hidden relative">
                                                {post.thumbnail_url ? (
                                                    <img 
                                                        src={post.thumbnail_url} 
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                                        <span className="font-bold text-xl">LYHU</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Content Right */}
                                            <div className="flex-1 flex flex-col justify-center">
                                                {post.category && (
                                                    <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2 block">
                                                        {post.category.name}
                                                    </span>
                                                )}
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2 sm:mb-3 leading-snug">
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
                                    ))}
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
                                <img src={banner.image_url} alt={`Side Top Banner ${idx + 1}`} className="w-full h-auto object-cover border border-gray-100" />
                            </Link>
                        </div>
                    ))}
                    
                    {/* Trending Widget (Client Component with Day/Week/Month) */}
                    <TrendingWidget />

                    {/* Side Bottom Banners */}
                    {sideBottomBanners.map((banner, idx) => (
                        <div key={banner.id || idx} className="w-full relative overflow-hidden">
                            <Link href={banner.link_url || "/"} target={banner.link_url?.startsWith('http') ? "_blank" : "_self"}>
                                <img src={banner.image_url} alt={`Side Bottom Banner ${idx + 1}`} className="w-full h-auto object-cover border border-gray-100" />
                            </Link>
                        </div>
                    ))}

                    {/* B2B Promo Widget */}
                    <div className="bg-primary-50 p-6 border border-primary-100 text-center">
                        <h3 className="text-lg font-bold text-primary-900 mb-2">Nhập sỉ tận xưởng?</h3>
                        <p className="text-primary-700 text-sm mb-5 leading-relaxed">
                            Tham gia hệ thống phân phối LYHU với mức chiết khấu lên tới 45%.
                        </p>
                        <Link 
                            href="/" 
                            className="block w-full bg-primary-600 text-white py-2.5 text-sm font-bold hover:bg-primary-700 transition-colors"
                        >
                            Đăng ký Báo Giá
                        </Link>
                    </div>
                </aside>
                
            </div>
        </div>
    );
}
