"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogOut, User, ShoppingBag, FileText, Settings, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";
import WholesaleFooter from "@/components/wholesale/WholesaleFooter";
import { supabase } from "@/lib/supabaseClient";

export default function CustomerShell({ children, title }: { children: React.ReactNode, title: string }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [isAffiliate, setIsAffiliate] = useState(false);

    useEffect(() => {
        if (user?.id) {
            const checkAffiliate = async () => {
                const { data } = await supabase
                    .from('affiliate_profiles')
                    .select('status')
                    .eq('user_id', user.id)
                    .single();
                if (data && data.status === 'active') {
                    setIsAffiliate(true);
                }
            };
            checkAffiliate();
        }
    }, [user?.id]);

    const navItems: any[] = [
        { name: "Tổng quan", href: "/customer", icon: User },
        ...(isAffiliate ? [{ name: "Tiếp thị liên kết", href: "/customer/affiliate", icon: TrendingUp }] : []),
        { name: "Đơn hàng của tôi", href: "/customer/orders", icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-primary-600 text-white sticky top-0 z-50 shadow-md">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="shrink-0 flex items-center cursor-pointer h-12 w-32 md:w-40">
                            <img src="/logo-full.png" alt="LYHU Logo" className="h-full w-auto object-contain brightness-0 invert drop-shadow-sm scale-150 origin-left" />
                        </Link>
                        <div className="hidden md:flex gap-6 text-sm font-medium">
                            <Link href="/" className="hover:text-primary-100 transition-colors">Về Trang chủ Mua sỉ</Link>
                            <Link href="/tin-tuc" className="hover:text-primary-100 transition-colors">Tin tức</Link>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-sm hidden sm:block">
                            Xin chào, <span className="font-bold">{typeof user?.email === 'string' ? user.email.split('@')[0] : "Khách hàng"}</span>
                        </div>
                        <button 
                            onClick={() => signOut()}
                            className="flex items-center gap-2 text-sm bg-primary-700 hover:bg-primary-800 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <LogOut size={16} /> Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-medium text-gray-700">
                            Tài khoản của tôi
                        </div>
                        <nav className="p-2 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isActive 
                                            ? "bg-primary-50 text-primary-700" 
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        <Icon size={18} className={isActive ? "text-primary-600" : "text-gray-400"} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <WholesaleFooter />
        </div>
    );
}
