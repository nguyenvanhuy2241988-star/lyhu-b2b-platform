import React from 'react';
import WholesaleFooter from '@/components/wholesale/WholesaleFooter';
import { Metadata } from 'next';
import Link from 'next/link';

import { TrendingUp } from 'lucide-react';

import SearchBar from '@/components/blog/SearchBar';

export const metadata: Metadata = {
    title: 'Tin tức & Kiến thức Kinh doanh B2B - LYHU',
    description: 'Cập nhật tin tức thị trường, kiến thức mở tạp hóa, siêu thị mini và kinh nghiệm nhập sỉ bánh kẹo ăn vặt tận xưởng.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
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
                <div className="max-w-[1200px] mx-auto px-4 pt-2 pb-1 flex flex-col md:flex-row items-center justify-start gap-6 md:gap-8">
                    {/* Logo */}
                    <Link href="/tin-tuc" className="flex items-center shrink-0 group h-10 md:h-12 w-[200px] md:w-[280px]">
                        <img 
                            src="/logo-tin-tuc.png" 
                            alt="LYHU Chuyển động FMCG 24/7" 
                            className="w-full h-full object-contain origin-left scale-[2] md:scale-[2.5] transition-transform group-hover:scale-[2.05] md:group-hover:scale-[2.55]" 
                        />
                    </Link>

                    {/* Trending Topics Bar */}
                    <div className="flex items-center justify-start gap-4 overflow-x-auto scrollbar-hide pb-2 md:pb-0 shrink-0">
                        <TrendingUp className="w-4 h-4 text-primary-600 shrink-0" />
                        <Link href="/tin-tuc?q=tiktok" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># TikTok Shop</Link>
                        <Link href="/tin-tuc?q=chiết+khấu" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># Chiết khấu đại lý</Link>
                        <Link href="/tin-tuc?q=gen+z" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># Khách hàng Gen Z</Link>
                        <Link href="/tin-tuc?q=nguồn+nhập+sỉ" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># Nguồn nhập sỉ rẻ</Link>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:w-[280px] shrink-0 ml-auto md:ml-0">
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
