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
            {/* Magazine-style Header (Minimalist & Brand Colors) */}
            <header className="bg-primary-50 border-b border-primary-200">
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

                {/* Main Header Area: Logo, Slogan, Trending */}
                <div className="max-w-[1200px] mx-auto px-4 pt-2 pb-1 flex flex-col md:flex-row items-center justify-start gap-6 md:gap-12">
                    {/* Logo & Slogan */}
                    <Link href="/tin-tuc" className="flex flex-col items-center shrink-0 group">
                        {/* Container crops the top/bottom transparent whitespace of the logo */}
                        <div className="h-14 md:h-16 overflow-hidden flex items-center justify-center">
                            <img 
                                src="/logo-full.png" 
                                alt="LYHU Logo" 
                                className="h-28 md:h-32 object-contain transition-transform group-hover:scale-105" 
                            />
                        </div>
                        {/* Slogan perfectly centered under logo, smaller, no underline */}
                        <span className="text-[8px] md:text-[9px] font-bold text-primary-700 uppercase tracking-widest mt-1">
                            Chuyển động FMCG 24/7
                        </span>
                    </Link>

                    {/* Trending Topics Bar (Shifted to the left) */}
                    <div className="flex-1 w-full flex items-center justify-start gap-4 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                        <TrendingUp className="w-4 h-4 text-primary-600 shrink-0" />
                        <Link href="/tin-tuc?q=tiktok" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># TikTok Shop</Link>
                        <Link href="/tin-tuc?q=chiết+khấu" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># Chiết khấu đại lý</Link>
                        <Link href="/tin-tuc?q=gen+z" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># Khách hàng Gen Z</Link>
                        <Link href="/tin-tuc?q=nguồn+nhập+sỉ" className="shrink-0 text-gray-600 hover:text-primary-700 text-xs font-bold transition-colors"># Nguồn nhập sỉ rẻ</Link>
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
