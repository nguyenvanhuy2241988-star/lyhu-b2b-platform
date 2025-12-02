"use client";

import { ShoppingBag, ShoppingCart, FileText } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Customer Dashboard</h1>
                <p className="text-slate-500">Chào mừng bạn quay trở lại!</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/customer/catalogue" className="block group">
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary-500 transition-colors">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Catalogue</h3>
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
        </div>
    );
}
