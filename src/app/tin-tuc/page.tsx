import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, ChevronRight, TrendingUp, Sparkles, MoveRight } from 'lucide-react';
import { BlogPost, BlogCategory } from '@/lib/blogStore';

export const revalidate = 3600;

async function getBlogData() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [postsRes, catsRes] = await Promise.all([
        supabase
            .from('blog_posts')
            .select(`
                *,
                category:blog_categories(id, name, slug)
            `)
            .eq('status', 'published')
            .order('published_at', { ascending: false }),
        supabase
            .from('blog_categories')
            .select('*')
            .order('sort_order', { ascending: true })
    ]);

    return {
        posts: (postsRes.data || []) as BlogPost[],
        categories: (catsRes.data || []) as BlogCategory[]
    };
}

export default async function BlogIndexPage({
    searchParams
}: {
    searchParams: { category?: string }
}) {
    const { posts, categories } = await getBlogData();
    
    const activeCategory = searchParams.category || 'all';
    const filteredPosts = activeCategory === 'all' 
        ? posts 
        : posts.filter(p => p.category?.slug === activeCategory);

    // Split posts
    const featuredPost = filteredPosts[0];
    const gridPosts = featuredPost ? filteredPosts.slice(1) : [];
    
    // Most viewed (placeholder random logic)
    const trendingPosts = [...posts].sort(() => 0.5 - Math.random()).slice(0, 5);

    return (
        <div className="space-y-10">
            
            {/* Category Pills Navigation - Minimalist */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                    <Link 
                        href="/tin-tuc"
                        className={`shrink-0 text-sm font-semibold transition-all duration-300 pb-4 -mb-4 border-b-2 ${
                            activeCategory === 'all' 
                            ? 'text-primary-600 border-primary-600' 
                            : 'text-gray-500 border-transparent hover:text-gray-800'
                        }`}
                    >
                        Tất cả bài viết
                    </Link>
                    {categories.map(cat => (
                        <Link 
                            key={cat.id}
                            href={`/tin-tuc?category=${cat.slug}`}
                            className={`shrink-0 text-sm font-semibold transition-all duration-300 pb-4 -mb-4 border-b-2 ${
                                activeCategory === cat.slug 
                                ? 'text-primary-600 border-primary-600' 
                                : 'text-gray-500 border-transparent hover:text-gray-800'
                            }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            {filteredPosts.length === 0 ? (
                <div className="bg-white p-16 text-center rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bài viết nào</h3>
                    <p className="text-gray-500">Nội dung chuyên mục này đang được cập nhật.</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-10">
                    
                    {/* Main Content Area */}
                    <div className="flex-1 space-y-10">
                        
                        {/* Featured Post */}
                        {featuredPost && activeCategory === 'all' && (
                            <Link 
                                href={`/tin-tuc/${featuredPost.slug}`} 
                                className="group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                            >
                                <div className="aspect-[21/9] w-full bg-gray-100 overflow-hidden relative">
                                    {featuredPost.thumbnail_url ? (
                                        <img 
                                            src={featuredPost.thumbnail_url} 
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                            <span className="font-bold text-4xl opacity-50">LYHU</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8">
                                    {featuredPost.category && (
                                        <span className="text-primary-600 font-bold text-sm uppercase tracking-wider mb-3 block">
                                            {featuredPost.category.name}
                                        </span>
                                    )}
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors leading-snug">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-gray-600 text-lg mb-6 line-clamp-2">
                                        {featuredPost.meta_description || featuredPost.ai_summary}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                        <Clock className="w-4 h-4" />
                                        <time>{new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('vi-VN')}</time>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Article Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(activeCategory === 'all' ? gridPosts : filteredPosts).map(post => (
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
                    </div>

                    {/* Right Sidebar - Minimalist */}
                    <aside className="w-full lg:w-[320px] shrink-0 space-y-8">
                        
                        {/* Trending Widget */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                                Xem nhiều nhất
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
                                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* B2B Banner Widget - Minimalist */}
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
            )}
        </div>
    );
}
