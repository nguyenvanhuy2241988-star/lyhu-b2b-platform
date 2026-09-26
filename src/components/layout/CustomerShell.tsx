"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogOut, User, ShoppingBag, FileText, Settings, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";
import WholesaleFooter from "@/components/wholesale/WholesaleFooter";
import { supabase } from "@/lib/supabaseClient";

import BottomNav from "@/components/layout/BottomNav";
import { ROLES } from "@/lib/constants";
import { getCart } from "@/lib/customerStore";
import { ShoppingCart } from "lucide-react";

export default function CustomerShell({ children, title }: { children: React.ReactNode, title: string }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [isAffiliate, setIsAffiliate] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const updateCart = () => {
            const cart = getCart();
            const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            setCartCount(total);
        };
        updateCart();
        window.addEventListener('storage', updateCart);
        return () => window.removeEventListener('storage', updateCart);
    }, []);

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
        { name: "Mua sỉ / Catalogue", href: "/customer/catalogue", icon: ShoppingBag },
        { name: "Giỏ hàng", href: "/customer/cart", icon: ShoppingCart },
        ...(isAffiliate ? [{ name: "Tiếp thị liên kết", href: "/customer/affiliate", icon: TrendingUp }] : []),
        { name: "Đơn hàng của tôi", href: "/customer/orders", icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Flat Header */}
            <header className="bg-[#00AFA9] text-white sticky top-0 z-40 border-b border-[#009893]">
                <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/customer" className="shrink-0 flex items-center cursor-pointer h-10 w-28 md:w-36">
                            <img src="/logo-full.png" alt="LYHU Logo" className="h-full w-auto object-contain brightness-0 invert scale-125 origin-left" />
                        </Link>
                        <div className="hidden md:flex gap-5 text-sm font-medium">
                            <Link href="/customer/catalogue" className="hover:text-emerald-100 transition-colors">Mua sỉ Catalogue</Link>
                            <Link href="/tin-tuc" className="hover:text-emerald-100 transition-colors">Tin tức</Link>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Cart Button with Live Counter */}
                        <Link 
                            href="/customer/cart" 
                            className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#008f8a] text-white hover:bg-[#00827d] transition-colors"
                            title="Giỏ hàng"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[#8EC63F] text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#00AFA9]">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>

                        <div className="text-sm hidden sm:block text-slate-100">
                            <span className="font-semibold text-white">{typeof user?.email === 'string' ? user.email.split('@')[0] : "Khách hàng"}</span>
                        </div>
                        <button 
                            onClick={() => signOut()}
                            className="flex items-center gap-1.5 text-xs sm:text-sm bg-[#008f8a] hover:bg-[#00827d] px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <LogOut size={15} /> 
                            <span className="hidden sm:inline">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex flex-col md:flex-row gap-6 pb-24 md:pb-8">
                {/* Desktop Sidebar Navigation */}
                <aside className="hidden md:block w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-20">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500 uppercase tracking-wider">
                            Menu Khách Hàng
                        </div>
                        <nav className="p-2 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                            isActive 
                                            ? "bg-[#00AFA9] text-white" 
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon size={17} className={isActive ? "text-white" : "text-slate-400"} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 min-h-[450px]">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav role={ROLES.CUSTOMER} />

            {/* Footer */}
            <div className="hidden md:block">
                <WholesaleFooter />
            </div>
        </div>
    );
}
