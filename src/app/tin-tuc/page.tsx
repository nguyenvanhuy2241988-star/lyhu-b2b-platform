import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Clock, ChevronRight } from 'lucide-react';
import { BlogCategory, BlogPost } from '@/lib/blogStore';

export const revalidate = 3600; // Revalidate every hour

async function getPublishedPosts() {
    const { data, error } = await supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
        
    if (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
    return data as BlogPost[];
}

export default async function BlogIndexPage() {
    const posts = await getPublishedPosts();
    
    // Group by category (simplified for index page)
    const featuredPost = posts[0];
    const recentPosts = posts.slice(1);

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Góc Kiến Thức & Tin Tức</h1>
                    <p className="text-gray-600 max-w-2xl">
                        Tổng hợp kinh nghiệm mở tiệm tạp hóa, siêu thị mini, cách tìm nguồn hàng giá sỉ và các xu hướng kinh doanh đồ ăn vặt mới nhất.
                    </p>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">Chưa có bài viết nào được xuất bản.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Featured Post */}
                    <div className="lg:col-span-2">
                        <Link href={`/tin-tuc/${featuredPost.slug}`} className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow h-full">
                            <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden relative">
                                {featuredPost.thumbnail_url ? (
                                    <img 
                                        src={featuredPost.thumbnail_url} 
                                        alt={featuredPost.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                        <span className="font-bold text-4xl">LYHU</span>
                                    </div>
                                )}
                                {featuredPost.category && (
                                    <span className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-md">
                                        {featuredPost.category.name}
                                    </span>
                                )}
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <Clock className="w-4 h-4" />
                                    <time dateTime={featuredPost.published_at || featuredPost.created_at}>
                                        {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('vi-VN', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </time>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors line-clamp-2">
                                    {featuredPost.title}
                                </h2>
                                <p className="text-gray-600 line-clamp-3 mb-6">
                                    {featuredPost.meta_description || featuredPost.ai_summary || "Bấm để đọc chi tiết bài viết này..."}
                                </p>
                                <span className="inline-flex items-center gap-1 font-semibold text-primary-600 group-hover:text-primary-700">
                                    Đọc tiếp <ChevronRight className="w-4 h-4" />
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Recent Posts List */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 pb-2 border-b-2 border-primary-100">Bài viết mới</h3>
                        <div className="flex flex-col gap-6">
                            {recentPosts.slice(0, 4).map(post => (
                                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-4 items-start">
                                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                        {post.thumbnail_url ? (
                                            <img 
                                                src={post.thumbnail_url} 
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                                                <span className="font-bold text-xs">LYHU</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {post.category && (
                                            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1 block">
                                                {post.category.name}
                                            </span>
                                        )}
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1.5 leading-tight">
                                            {post.title}
                                        </h4>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
