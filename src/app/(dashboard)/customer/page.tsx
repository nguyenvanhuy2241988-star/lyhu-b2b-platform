"use client";

import { ShoppingBag, ShoppingCart, FileText, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CustomerDashboard() {
    const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchSavedVouchers = async () => {
            const stored = localStorage.getItem('lyhu_saved_vouchers');
            if (stored) {
                try {
                    const parsedIds = JSON.parse(stored);
                    if (Array.isArray(parsedIds) && parsedIds.length > 0) {
                        const { data } = await supabase
                            .from('wholesale_vouchers')
                            .select('*')
                            .in('id', parsedIds)
                            .eq('is_active', true);
                        if (data) {
                            setSavedVouchers(data);
                        }
                    }
                } catch (e) {}
            }
        };
        fetchSavedVouchers();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan Khách hàng</h1>
                <p className="text-slate-500">Chào mừng bạn quay trở lại!</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/customer/catalogue" className="block group">
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary-500 transition-colors">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Danh mục sản phẩm</h3>
                        <p className="text-sm text-slate-500 mt-1">Xem danh sách sản phẩm</p>
                    </div>
                </Link>

                <Link href="/customer/cart" className="block group">
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary-500 transition-colors">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Giỏ hàng</h3>
                        <p className="text-sm text-slate-500 mt-1">Xem giỏ hàng của bạn</p>
                    </div>
                </Link>

                <Link href="/customer/orders" className="block group">
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary-500 transition-colors">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Đơn hàng</h3>
                        <p className="text-sm text-slate-500 mt-1">Lịch sử đơn hàng</p>
                    </div>
                </Link>
            </div>

            {savedVouchers.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-primary-500" />
                        Ví Voucher của bạn
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {savedVouchers.map(v => (
                            <div key={v.id} className="bg-white border rounded-xl shadow-sm flex overflow-hidden border-primary-200 hover:shadow-md transition-shadow">
                                <div className={`w-[100px] flex flex-col items-center justify-center text-white p-3 border-r border-dashed border-white shrink-0 ${v.discount_type === 'freeship' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-secondary-400 to-secondary-500'}`}>
                                    <span className="font-bold text-lg leading-tight text-center">{v.discount_type === 'percent' ? `${v.discount_value}%` : v.discount_type === 'freeship' ? 'FREE\nSHIP' : `${v.discount_value / 1000}K`}</span>
                                    <span className="text-[10px] uppercase mt-1 opacity-80">Giảm giá</span>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-center">
                                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{v.name}</h4>
                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{v.description}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">HSD: Không giới hạn</span>
                                        <Link href="/" className="text-[11px] font-bold text-primary-600 hover:text-primary-700">Dùng ngay</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
