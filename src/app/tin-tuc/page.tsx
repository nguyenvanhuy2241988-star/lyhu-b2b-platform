import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, ChevronRight, TrendingUp, Sparkles, MoveRight } from 'lucide-react';
import { BlogPost, BlogCategory } from '@/lib/blogStore';

export const revalidate = 3600; // Revalidate every hour

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
    
    // Filter by category if param exists
    const activeCategory = searchParams.category || 'all';
    const filteredPosts = activeCategory === 'all' 
        ? posts 
        : posts.filter(p => p.category?.slug === activeCategory);

    // Split posts for different sections
    const heroPosts = filteredPosts.slice(0, 3);
    const gridPosts = filteredPosts.slice(3);
    
    // Most viewed/Trending (just random/latest for now, but design it nicely)
    const trendingPosts = [...posts].sort(() => 0.5 - Math.random()).slice(0, 5);

    return (
        <div className="space-y-12">
            
            {/* Category Pills Navigation */}
            <div className="sticky top-0 z-30 bg-[#F5F5F5]/80 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    <Link 
                        href="/tin-tuc"
                        className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
                            activeCategory === 'all' 
                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/30' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        Mới nhất
                    </Link>
                    {categories.map(cat => (
                        <Link 
                            key={cat.id}
                            href={`/tin-tuc?category=${cat.slug}`}
                            className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
                                activeCategory === cat.slug 
                                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/30' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            {filteredPosts.length === 0 ? (
                <div className="bg-white p-16 text-center rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có bài viết nào</h3>
                    <p className="text-gray-500">Chúng tôi đang cập nhật nội dung cho chuyên mục này. Vui lòng quay lại sau.</p>
                </div>
            ) : (
                <>
                    {/* Hero Section - Magazine Style Asymmetric Grid */}
                    {activeCategory === 'all' && heroPosts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[600px]">
                            {heroPosts.map((post, index) => {
                                const isMain = index === 0;
                                return (
                                    <Link 
                                        key={post.id} 
                                        href={`/tin-tuc/${post.slug}`} 
                                        className={`group block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
                                            isMain ? 'md:col-span-2 md:row-span-2' : 'md:col-span-2 md:row-span-1'
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gray-200">
                                            {post.thumbnail_url ? (
                                                <img 
                                                    src={post.thumbnail_url} 
                                                    alt={post.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-300">
                                                    <span className="font-bold text-5xl opacity-50">LYHU</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Glassmorphism Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                            {post.category && (
                                                <span className="inline-block bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-3 w-fit">
                                                    {post.category.name}
                                                </span>
                                            )}
                                            <h2 className={`font-bold text-white mb-2 leading-tight ${isMain ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                                                {post.title}
                                            </h2>
                                            {isMain && (
                                                <p className="text-gray-200 line-clamp-2 text-sm md:text-base mt-2 mb-4 max-w-lg">
                                                    {post.meta_description || post.ai_summary}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-300 text-xs font-medium mt-auto">
                                                <Clock className="w-3.5 h-3.5" />
                                                <time>{new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}</time>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Main Content Area: Grid + Sidebar */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* Left: Article Grid */}
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                {activeCategory === 'all' ? 'Bài viết mới' : 'Tất cả bài viết'}
                                <MoveRight className="w-5 h-5 text-primary-500" />
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(activeCategory === 'all' ? gridPosts : filteredPosts).map(post => (
                                    <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 h-full">
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
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                                <span className="text-xs font-bold text-primary-600 group-hover:translate-x-1 transition-transform flex items-center">
                                                    Đọc tiếp <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right: Sidebar */}
                        <div className="w-full lg:w-[320px] shrink-0 space-y-8">
                            
                            {/* Trending Widget */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-red-500" />
                                    Xem nhiều nhất
                                </h3>
                                <div className="space-y-5">
                                    {trendingPosts.map((post, index) => (
                                        <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-4 items-start relative">
                                            <span className="absolute -left-2 -top-3 text-4xl font-black text-gray-100 z-0 group-hover:text-primary-50 transition-colors">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0 z-10 pl-4">
                                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
                                                    {post.title}
                                                </h4>
                                                <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                                    {post.category?.name} • <Clock className="w-3 h-3" /> {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* B2B Banner Widget */}
                            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"></div>
                                
                                <h3 className="text-xl font-bold mb-2 relative z-10">Nhập sỉ tận xưởng?</h3>
                                <p className="text-primary-100 text-sm mb-6 relative z-10 leading-relaxed">
                                    Tham gia hệ thống phân phối LYHU với mức chiết khấu lên tới 45%.
                                </p>
                                <Link 
                                    href="/wholesale" 
                                    className="block text-center w-full bg-white text-primary-700 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 hover:shadow-md transition-all relative z-10"
                                >
                                    Đăng ký Kênh NPP
                                </Link>
                            </div>
                        </div>
                        
                    </div>
                </>
            )}
        </div>
    );
}
