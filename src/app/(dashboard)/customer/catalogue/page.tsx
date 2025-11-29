"use client";

import { useState, useMemo } from "react";
import { mockProducts } from "@/mocks/data";
import { ShoppingCart, Plus, Filter } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const BRANDS = ["Tất cả", "UHI", "BOYO", "CVT", "LYHU"];

export default function CataloguePage() {
    const [selectedBrand, setSelectedBrand] = useState("Tất cả");
    const [cart, setCart] = useState<Record<string, number>>({});

    const filteredProducts = useMemo(() => {
        if (selectedBrand === "Tất cả") {
            return mockProducts;
        }
        return mockProducts.filter((p) => p.brand === selectedBrand);
    }, [selectedBrand]);

    const handleAddToCart = (productId: string) => {
        setCart((prev) => ({
            ...prev,
            [productId]: (prev[productId] || 0) + 1,
        }));
        // In real app, this would update global cart state or call API
        console.log("Added to cart:", productId);
    };

    const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    const brandColors = {
        UHI: { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50", border: "border-orange-200" },
        BOYO: { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-200" },
        CVT: { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200" },
        LYHU: { bg: "bg-primary-500", text: "text-primary-700", light: "bg-primary-50", border: "border-primary-200" },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Catalogue Sản Phẩm</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        {filteredProducts.length} sản phẩm
                    </p>
                </div>
                {totalCartItems > 0 && (
                    <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-2 rounded-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="font-medium">{totalCartItems} sản phẩm trong giỏ</span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Lọc sản phẩm</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {BRANDS.map((brand) => (
                        <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedBrand === brand
                                    ? "bg-primary-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => {
                    const brandColor = brandColors[product.brand as keyof typeof brandColors] || brandColors.LYHU;
                    const inCart = cart[product.id] || 0;

                    return (
                        <div
                            key={product.id}
                            className={`bg-white rounded-xl shadow-sm border ${inCart > 0 ? brandColor.border : "border-slate-200"
                                } overflow-hidden hover:shadow-lg transition-all group`}
                        >
                            {/* Product Image */}
                            <div className={`relative aspect-square ${brandColor.light} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                <ShoppingCart className="w-16 h-16 text-slate-300" />
                                {product.retailPrice && (
                                    <span className={`absolute top-2 right-2 ${brandColor.bg} text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg`}>
                                        -{Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100)}%
                                    </span>
                                )}
                                {inCart > 0 && (
                                    <span className="absolute top-2 left-2 bg-white text-primary-600 text-xs font-bold px-2 py-1 rounded-lg shadow-lg border border-primary-200">
                                        {inCart} trong giỏ
                                    </span>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <span className={`inline-block ${brandColor.bg} text-white text-xs font-semibold px-2 py-1 rounded mb-2`}>
                                    {product.brand}
                                </span>
                                <h4 className="font-semibold text-slate-900 mb-1 line-clamp-2 min-h-[3rem]">
                                    {product.name}
                                </h4>
                                <p className="text-xs text-slate-500 mb-3">
                                    {product.unit} • SKU: {product.sku}
                                </p>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-lg font-bold text-slate-900">{formatPrice(product.wholesalePrice)}</span>
                                    {product.retailPrice && (
                                        <span className="text-sm text-slate-400 line-through">{formatPrice(product.retailPrice)}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleAddToCart(product.id)}
                                    className={`w-full ${brandColor.bg} hover:opacity-90 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all`}
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm vào giỏ
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProducts.length === 0 && (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Không tìm thấy sản phẩm nào</p>
                </div>
            )}
        </div>
    );
}
