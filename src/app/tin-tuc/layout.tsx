import React from 'react';
import WholesaleFooter from '@/components/wholesale/WholesaleFooter';
import { Metadata } from 'next';
import Link from 'next/link';

import { TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Tin tức & Kiến thức Kinh doanh B2B - LYHU',
    description: 'Cập nhật tin tức thị trường, kiến thức mở tạp hóa, siêu thị mini và kinh nghiệm nhập sỉ bánh kẹo ăn vặt tận xưởng.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            {/* Magazine-style Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                {/* Top thin bar */}
                <div className="bg-primary-700 text-primary-50 text-xs font-medium py-1.5 hidden sm:block">
                    <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <span>Hệ thống phân phối LYHU B2B</span>
                            <span className="text-primary-300">|</span>
                            <span>Hotline: 1900 xxxx</span>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/wholesale" className="hover:text-white transition-colors font-bold">Vào trang Mua Sỉ</Link>
                        </div>
                    </div>
                </div>

                {/* Main Logo & Slogan Area */}
                <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Logo & Slogan */}
                    <Link href="/tin-tuc" className="flex flex-col items-center md:items-start group shrink-0">
                        {/* We use the original colored logo without the invert filter */}
                        <img src="/logo-full.png" alt="LYHU Logo" className="h-[72px] object-contain transition-transform origin-left group-hover:scale-105" />
                        <span className="mt-3 text-[13px] font-extrabold text-primary-700 uppercase tracking-[0.25em] relative">
                            Chuyển động FMCG 24/7
                            <div className="absolute -bottom-1 left-0 w-1/2 h-[2px] bg-primary-600"></div>
                        </span>
                    </Link>

                    {/* Banner Space (728x90 standard leaderboard) */}
                    <Link href="/wholesale" className="hidden md:block w-full max-w-[728px] h-[90px] bg-gray-50 rounded-lg overflow-hidden relative border border-gray-200 group">
                        {/* Mock ad banner */}
                        <img 
                            src="https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                            alt="Banner Mua Sỉ" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-transparent flex items-center px-8">
                            <div className="text-white">
                                <h3 className="text-2xl font-black mb-1">LYHU WHOLESALE</h3>
                                <p className="text-sm font-medium text-primary-100">Nguồn sỉ tạp hóa siêu ưu đãi. Xem ngay &rarr;</p>
                            </div>
                        </div>
                    </Link>
                </div>
                
                {/* Trending Topics Bar */}
                <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide text-sm font-semibold">
                        <span className="flex items-center text-red-600 shrink-0 uppercase tracking-wider text-xs">
                            <TrendingUp className="w-4 h-4 mr-1.5" /> Xu hướng:
                        </span>
                        <Link href="/tin-tuc?q=tiktok" className="shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"># TikTok Shop</Link>
                        <Link href="/tin-tuc?q=chiết+khấu" className="shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"># Chiết khấu đại lý</Link>
                        <Link href="/tin-tuc?q=gen+z" className="shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"># Khách hàng Gen Z</Link>
                        <Link href="/tin-tuc?q=nhập+sỉ" className="shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"># Nguồn nhập sỉ rẻ</Link>
                        <Link href="/tin-tuc?q=siêu+thị+mini" className="shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"># Setup siêu thị mini</Link>
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
