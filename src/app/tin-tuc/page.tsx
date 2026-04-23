import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, TrendingUp, Sparkles } from 'lucide-react';
import { BlogPost, BlogCategory } from '@/lib/blogStore';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';

export const revalidate = 60; // Revalidate more frequently since we have search/pagination

const POSTS_PER_PAGE = 12;

async function getBlogData(page: number, categorySlug: string, searchQuery: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    return {
        posts: (posts || []) as BlogPost[],
        categories: (categories || []) as BlogCategory[],
        trendingPosts: (trending || []) as Partial<BlogPost>[],
        totalCount: count || 0
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

    const { posts, categories, trendingPosts, totalCount } = await getBlogData(
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
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
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
                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {posts.map(post => (
                                    <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                        <div className="aspect-[16/10] w-full bg-gray-100 overflow-hidden relative">
                                            {post.thumbnail_url ? (
                                                <img 
                                                    src={post.thumbnail_url} 
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                                    <span className="font-bold text-2xl">LYHU</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            {post.category && (
                                                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">
                                                    {post.category.name}
                                                </span>
                                            )}
                                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-3 leading-snug">
                                                {post.title}
                                            </h4>
                                            <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                                {post.meta_description || post.ai_summary}
                                            </p>
                                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-xs text-gray-400 font-medium">
                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
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
                                            {new Date(post.published_at || post.created_at || '').toLocaleDateString('vi-VN')}
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
