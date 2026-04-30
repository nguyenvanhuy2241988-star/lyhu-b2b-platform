import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, TrendingUp, Sparkles } from 'lucide-react';
import { BlogPost, BlogCategory } from '@/lib/blogStore';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';

export const dynamic = 'force-dynamic';
const POSTS_PER_PAGE = 12;

async function getBlogData(page: number, categorySlug: string, searchQuery: string) {
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
        .order('published_at', { ascending: false });

    // Apply Category Filter
    if (categorySlug && categorySlug !== 'all') {
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
        .order('published_at', { ascending: false })
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
                .order('published_at', { ascending: false })
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
                .order('published_at', { ascending: false })
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

    return {
        posts: (posts || []) as BlogPost[],
        categories: (categories || []) as BlogCategory[],
        trendingPosts: (trending || []) as Partial<BlogPost>[],
        totalCount: count || 0,
        featuredBlocks,
        megaBanner
    };
}

export default async function BlogIndexPage({
    searchParams
}: {
    searchParams: { category?: string; page?: string; q?: string }
}) {
    const activeCategory = searchParams.category || 'all';
    const currentPage = parseInt(searchParams.page || '1', 10);
    const searchQuery = searchParams.q || '';

    const { posts, categories, trendingPosts, totalCount, featuredBlocks, megaBanner } = await getBlogData(
        currentPage,
        activeCategory,
        searchQuery
    );

    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

    return (
        <div className="space-y-8">
            
            {/* Top Toolbar: Categories & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Category Pills Navigation */}
                <div className="flex flex-wrap gap-2">
                    <Link 
                        href={`/tin-tuc?category=all${searchQuery ? `&q=${searchQuery}` : ''}`}
                        className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                            activeCategory === 'all' 
                            ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                        }`}
                    >
                        Tất cả
                    </Link>
                    {categories.map(cat => (
                        <Link 
                            key={cat.id}
                            href={`/tin-tuc?category=${cat.slug}${searchQuery ? `&q=${searchQuery}` : ''}`}
                            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                activeCategory === cat.slug 
                                ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                            }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-auto min-w-[280px]">
                    <SearchBar />
                </div>
            </div>

            {/* Mega Banner Space (Dynamic or Placeholder) */}
            {megaBanner ? (
                <div className="w-full relative rounded-xl overflow-hidden shadow-sm group border border-gray-100">
                    <Link href={megaBanner.link_url || "/wholesale"} target={megaBanner.link_url?.startsWith('http') ? "_blank" : "_self"}>
                        <img 
                            src={megaBanner.image_url} 
                            alt="Mega Banner" 
                            className="w-full aspect-[21/9] object-cover group-hover:scale-[1.02] transition-transform duration-700"
                        />
                    </Link>
                </div>
            ) : (
                <div className="w-full relative rounded-xl overflow-hidden shadow-sm group border border-gray-100">
                    <img 
                        src="https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                        alt="Mega Banner" 
                        className="w-full aspect-[21/9] object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/60 to-transparent flex flex-col justify-center px-6 md:px-12">
                        <h2 className="text-white text-2xl md:text-4xl font-black mb-3 drop-shadow-lg max-w-2xl leading-tight">
                            CẦN NGUỒN SỈ TẠP HÓA?<br/>TỚI NGAY LYHU WHOLESALE
                        </h2>
                        <p className="text-primary-100 text-sm md:text-base font-medium mb-5 max-w-xl">Hệ thống phân phối hàng tiêu dùng B2B chiết khấu lên tới 45% dành riêng cho các điểm bán lẻ và siêu thị mini.</p>
                        <div>
                            <Link href="/wholesale" className="inline-block px-6 py-2.5 bg-white text-primary-700 font-bold rounded-lg hover:bg-primary-50 hover:shadow-lg transition-all text-sm">
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
                            <p className="font-semibold text-gray-800">
                                {activeCategory === 'all' ? 'Tin mới cập nhật' : categories.find(c => c.slug === activeCategory)?.name}
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
                                                <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden relative mb-4 rounded-xl">
                                                    {posts[0].thumbnail_url ? (
                                                        <img 
                                                            src={posts[0].thumbnail_url} 
                                                            alt={posts[0].title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                                                    {new Date(posts[0].published_at || posts[0].created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </div>
                                            </Link>
                                        </div>

                                        {/* 2 Sub Featured Articles (Col 3) */}
                                        <div className="flex flex-col gap-6 md:pl-6 md:border-l md:border-gray-200">
                                            {[posts[1], posts[2]].map(post => (
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex flex-col flex-1">
                                                    <div className="aspect-[16/10] w-full bg-gray-100 overflow-hidden relative mb-3 rounded-lg">
                                                        {post.thumbnail_url ? (
                                                            <img 
                                                                src={post.thumbnail_url} 
                                                                alt={post.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                                                        {new Date(post.published_at || post.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-4 bg-gray-50 p-4 rounded-xl hover:bg-primary-50 transition-colors border border-gray-100">
                                                    <div className="w-28 h-28 shrink-0 bg-white rounded-lg overflow-hidden relative">
                                                        {post.thumbnail_url ? (
                                                            <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                                                            {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
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
                                                    <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden relative mb-3">
                                                        {post.thumbnail_url ? (
                                                            <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                                            <div className="w-full sm:w-[280px] shrink-0 aspect-[16/10] bg-gray-100 overflow-hidden relative rounded-lg">
                                                {post.thumbnail_url ? (
                                                    <img 
                                                        src={post.thumbnail_url} 
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                                                    {new Date(post.published_at || post.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                    
                    {/* Trending Widget */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                            Bài viết nổi bật
                        </h3>
                        <div className="space-y-4">
                            {trendingPosts.map((post, index) => (
                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-3 items-start">
                                    <span className="text-2xl font-bold text-gray-200 w-6 text-center group-hover:text-primary-200 transition-colors">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h4>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(post.published_at || post.created_at || '').toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* B2B Banner Widget */}
                    <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 text-center">
                        <h3 className="text-lg font-bold text-primary-900 mb-2">Nhập sỉ tận xưởng?</h3>
                        <p className="text-primary-700 text-sm mb-5 leading-relaxed">
                            Tham gia hệ thống phân phối LYHU với mức chiết khấu lên tới 45%.
                        </p>
                        <Link 
                            href="/wholesale" 
                            className="block w-full bg-primary-600 text-white py-2.5 rounded text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm"
                        >
                            Đăng ký Báo Giá
                        </Link>
                    </div>
                </aside>
                
            </div>
        </div>
    );
}
