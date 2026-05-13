'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function TrendingWidget() {
    const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            setLoading(true);
            
            // Calculate date threshold
            const now = new Date();
            let thresholdDate = new Date();
            if (activeTab === 'day') thresholdDate.setDate(now.getDate() - 1);
            else if (activeTab === 'week') thresholdDate.setDate(now.getDate() - 7);
            else if (activeTab === 'month') thresholdDate.setDate(now.getDate() - 30);
            
            const { data, error } = await supabaseBrowser
                .from('blog_posts')
                .select('id, title, slug, published_at, created_at, view_count')
                .eq('status', 'published')
                .gte('published_at', thresholdDate.toISOString())
                .order('view_count', { ascending: false })
                .order('published_at', { ascending: false })
                .limit(5);
                
            if (!error && data) {
                setPosts(data);
            }
            setLoading(false);
        };

        fetchTrending();
    }, [activeTab]);

    return (
        <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-800">Bài viết nổi bật</h3>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 mb-5">
                <button 
                    onClick={() => setActiveTab('day')}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'day' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Hôm nay
                </button>
                <button 
                    onClick={() => setActiveTab('week')}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'week' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Tuần này
                </button>
                <button 
                    onClick={() => setActiveTab('month')}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'month' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Tháng này
                </button>
            </div>

            <div className="space-y-4 relative min-h-[250px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                
                {!loading && posts.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-10 italic">
                        Chưa có bài viết nổi bật nào trong thời gian này.
                    </div>
                )}

                {posts.map((post, index) => (
                    <div key={post.id} className="flex gap-3 group">
                        <span className="text-2xl font-bold text-gray-200 group-hover:text-primary-200 transition-colors shrink-0 w-6">
                            {index + 1}
                        </span>
                        <div className="flex-1">
                            <Link href={`/tin-tuc/${post.slug}`} className="text-[13px] font-bold text-gray-800 group-hover:text-primary-600 transition-colors line-clamp-3 leading-snug">
                                {post.title}
                            </Link>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] text-gray-400">
                                    {new Date(post.published_at || post.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                                {post.view_count > 0 && (
                                    <span className="text-[10px] text-primary-600 font-medium bg-primary-50 px-1.5 py-0.5 rounded">
                                        {post.view_count} views
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
