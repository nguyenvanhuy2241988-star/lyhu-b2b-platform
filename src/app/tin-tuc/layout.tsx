import React from 'react';
import WholesaleFooter from '@/components/wholesale/WholesaleFooter';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Tin tức & Kiến thức Kinh doanh B2B - LYHU',
    description: 'Cập nhật tin tức thị trường, kiến thức mở tạp hóa, siêu thị mini và kinh nghiệm nhập sỉ bánh kẹo ăn vặt tận xưởng.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            {/* Simple Wholesale-style Header for Blog */}
            <header className="bg-primary-600 text-white">
                <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/wholesale" className="flex items-center gap-3">
                        <img src="/logo-full.png" alt="LYHU Logo" className="h-10 brightness-0 invert" />
                        <span className="text-xl font-medium border-l border-white/30 pl-3 hidden sm:block">Góc Kiến Thức</span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm font-medium">
                        <Link href="/wholesale" className="hover:text-primary-100 transition-colors">Vào trang Mua Sỉ</Link>
                    </nav>
                </div>
            </header>
            
            <main className="flex-1 w-full max-w-[1200px] mx-auto pt-6 pb-12 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
            
            <WholesaleFooter />
        </div>
    );
}
