"use client";

import { useState } from "react";
import { mockProducts } from "@/mocks/data";
import Link from "next/link";
import { ShoppingCart, Plus, Star, TrendingUp, Package } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function CustomerDashboard() {
    const featuredProducts = mockProducts.slice(0, 6);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Hero Banner with Glassmorphism */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-teal-500 to-cyan-600 p-8 sm:p-12">
                <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-6 sm:p-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                        Chào mừng quay trở lại!
                    </h2>
                    <p className="text-white/90 text-base sm:text-lg mb-6">
                        Khám phá sản phẩm mới và ưu đãi đặc biệt dành cho bạn
                    </p>
                    <Link
                        href="/customer/catalogue"
                        className="inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
                    >
                        Xem Catalogue
                    </Link>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Đơn đang xử lý</p>
                            <h3 className="text-2xl font-bold text-slate-900">2</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Chi tiêu tháng này</p>
                            <h3 className="text-2xl font-bold text-slate-900">{formatPrice(485000)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Star className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Điểm tích lũy</p>
                            <h3 className="text-2xl font-bold text-slate-900">850</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Products */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Sản phẩm nổi bật</h3>
                    <Link
                        href="/customer/catalogue"
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                        Xem tất cả →
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {featuredProducts.map((product) => {
                        const brandColors = {
                            UHI: { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50" },
                            BOYO: { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50" },
                            CVT: { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50" },
                            LYHU: { bg: "bg-primary-500", text: "text-primary-700", light: "bg-primary-50" },
                        };
                        const brandColor = brandColors[product.brand as keyof typeof brandColors] || brandColors.LYHU;

                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
                            >
                                {/* Product Image */}
                                <div className={`relative aspect-square ${brandColor.light} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                    <ShoppingCart className="w-16 h-16 text-slate-300" />
                                    {product.retailPrice && (
                                        <span className={`absolute top-2 right-2 ${brandColor.bg} text-white text-xs font-bold px-2 py-1 rounded-lg`}>
                                            -{Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100)}%
                                        </span>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <span className={`inline-block ${brandColor.bg} text-white text-xs font-semibold px-2 py-1 rounded mb-2`}>
                                        {product.brand}
                                    </span>
                                    <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">
                                        {product.name}
                                    </h4>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-lg font-bold text-slate-900">{formatPrice(product.wholesalePrice)}</span>
                                        {product.retailPrice && (
                                            <span className="text-sm text-slate-400 line-through">{formatPrice(product.retailPrice)}</span>
                                        )}
                                    </div>
                                    <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Thêm vào giỏ
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/customer/cart"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                        <ShoppingCart className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Giỏ hàng của bạn</h4>
                        <p className="text-sm text-slate-600">3 sản phẩm đang chờ</p>
                    </div>
                </Link>
                <Link
                    href="/customer/orders"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Lịch sử đơn hàng</h4>
                        <p className="text-sm text-slate-600">Xem tất cả đơn hàng</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
