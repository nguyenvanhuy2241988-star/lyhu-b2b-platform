import React from 'react';
import WholesaleFooter from '@/components/wholesale/WholesaleFooter';
import { Metadata } from 'next';
import Link from 'next/link';

import { TrendingUp } from 'lucide-react';

import SearchBar from '@/components/blog/SearchBar';

import { supabase } from '@/lib/supabaseClient';

export const metadata: Metadata = {
    title: 'Tin tức & Kiến thức Kinh doanh B2B - LYHU',
    description: 'Cập nhật tin tức thị trường, kiến thức mở tạp hóa, siêu thị mini và kinh nghiệm nhập sỉ bánh kẹo ăn vặt tận xưởng.',
};

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
    // Lấy top từ khóa tìm kiếm
    let topKeywords: string[] = [];
    
    try {
        // 1. Thử lấy từ lịch sử tìm kiếm (search_logs)
        const { data: logs } = await supabase
            .from('search_logs')
            .select('query')
            .order('created_at', { ascending: false })
            .limit(100);
            
        if (logs && logs.length > 0) {
            const counts: Record<string, number> = {};
            logs.forEach((log: any) => {
                const q = log.query.trim().toLowerCase();
                if (q.length > 1) {
                    counts[q] = (counts[q] || 0) + 1;
                }
            });
            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(e => e[0]);
            
            if (sorted.length >= 4) {
                topKeywords = sorted.map(k => k.replace(/\b\w/g, l => l.toUpperCase()));
            }
        }

        // 2. Nếu không đủ dữ liệu tìm kiếm, fallback lấy từ khóa từ các bài viết
        if (topKeywords.length < 4) {
            const { data: posts } = await supabase
                .from('blog_posts')
                .select('keywords')
                .not('keywords', 'is', null)
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (posts && posts.length > 0) {
                const kwCounts: Record<string, number> = {};
                posts.forEach((post: any) => {
                    if (post.keywords) {
                        const keywordsArray = post.keywords.split(',').map((k: string) => k.trim().toLowerCase());
                        keywordsArray.forEach((kw: string) => {
                            if (kw.length > 3 && !kw.includes('2026') && !kw.includes('fmcg 247')) {
                                kwCounts[kw] = (kwCounts[kw] || 0) + 1;
                            }
                        });
                    }
                });
                
                const sortedKw = Object.entries(kwCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(e => e[0]);
                    
                if (sortedKw.length > 0) {
                    topKeywords = sortedKw.map(k => k.replace(/\b\w/g, l => l.toUpperCase()));
                }
            }
        }
        
        // 3. Fallback cứng cuối cùng nếu vẫn trống
        if (topKeywords.length === 0) {
            topKeywords = ['Kinh Doanh Bán Lẻ', 'Siêu Thị Mini', 'Nhà Phân Phối', 'Nhập Hàng Sỉ'];
        }
    } catch (e) {
        console.error('Error fetching search keywords:', e);
        topKeywords = ['Kinh Doanh Bán Lẻ', 'Siêu Thị Mini', 'Nhà Phân Phối', 'Nhập Hàng Sỉ'];
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            {/* Magazine-style Header (Minimalist & Brand Colors) */}
            <header className="bg-primary-50 border-b border-primary-200">
                {/* Top thin bar */}
                <div className="bg-primary-700 text-primary-50 text-xs font-medium py-1.5 hidden sm:block">
                    <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <span>Hệ thống phân phối LYHU B2B</span>
                            <span className="text-primary-300">|</span>
                            <span>Hotline: 0969 069 798</span>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/wholesale" className="hover:text-white transition-colors font-bold">Vào trang Mua Sỉ</Link>
                        </div>
                    </div>
                </div>

                {/* Main Header Area: Logo, Slogan, Trending, Search */}
                <div className="max-w-[1200px] mx-auto px-4 pt-3 pb-2 flex flex-col md:flex-row items-center justify-start gap-2 md:gap-8">
                    {/* Logo — image is square with whitespace, so we crop it */}
                    <Link href="/tin-tuc" className="shrink-0 group block">
                        <div className="h-[50px] md:h-[60px] overflow-hidden flex items-center justify-center">
                            <img 
                                src="/logo-tin-tuc.png" 
                                alt="LYHU Chuyển động FMCG 24/7" 
                                className="h-[180px] md:h-[210px] w-auto object-contain transition-transform group-hover:scale-105" 
                            />
                        </div>
                    </Link>

                    {/* Trending Topics Bar (Hidden on Mobile) */}
                    <div className="hidden lg:flex items-center justify-start gap-4 overflow-x-auto scrollbar-hide shrink-0">
                        <TrendingUp className="w-4 h-4 text-primary-600 shrink-0" />
                        {topKeywords.map((kw, idx) => (
                            <Link key={idx} href={`/tin-tuc?q=${encodeURIComponent(kw)}`} className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors">
                                #{kw}
                            </Link>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:w-[280px] shrink-0 ml-auto md:ml-auto lg:ml-0 mt-1 md:mt-0">
                        <SearchBar />
                    </div>
                </div>
            </header>
            
            <main className="flex-1 w-full max-w-[1200px] mx-auto pt-6 pb-12 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
            
            <WholesaleFooter />
        </div>
    );
}
