"use client";

import { useState, useEffect, useMemo } from "react";
import { Product } from "@/mocks/data";
import { Package, Search, Loader2 } from "lucide-react";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=name.asc`, {
                    headers: {
                        'apikey': SUPABASE_KEY || '',
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) throw new Error("Failed to fetch products");
                const data = await res.json();
                setProducts(data || []);
            } catch (err) {
                console.error("Error loading products:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // Group products by brand
    const brandStats = useMemo(() => {
        return products.reduce((acc, p) => {
            acc[p.brand] = (acc[p.brand] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [products]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý sản phẩm</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Danh sách sản phẩm và giá sỉ
                </p>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Stats */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600">Tổng SP</p>
                            <p className="text-xl font-bold text-slate-900">{products.length}</p>
                        </div>
                    </div>
                </div>

                {Object.entries(brandStats).map(([brand, count]) => (
                    <div key={brand} className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600">{brand}</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{count} SP</p>
                    </div>
                ))}

                {/* Search */}
                <div className="lg:col-span-1 bg-white p-4 rounded-lg border border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">
                        Danh sách sản phẩm
                        {!isLoading && (
                            <span className="ml-2 text-sm font-normal text-slate-500">
                                ({filteredProducts.length} sản phẩm)
                            </span>
                        )}
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tải danh sách sản phẩm...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Chưa có sản phẩm nào</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">
                            Danh sách sản phẩm đang trống. Bạn cần thêm sản phẩm vào database để bắt đầu kinh doanh.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[768px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">SKU</th>
                                    <th className="px-6 py-3 font-medium">Tên sản phẩm</th>
                                    <th className="px-6 py-3 font-medium">Thương hiệu</th>
                                    <th className="px-6 py-3 font-medium">Đơn vị</th>
                                    <th className="px-6 py-3 font-medium text-right">Giá sỉ</th>
                                    <th className="px-6 py-3 font-medium text-right">Tồn kho</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {product.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{product.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.brand === "UHI"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : product.brand === "BOYO"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : product.brand === "CVT"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-primary-100 text-primary-700"
                                                    }`}
                                            >
                                                {product.brand}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{product.unit}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-semibold text-slate-900">
                                                {formatPrice(product.wholesalePrice || product.basePricePerUnit || 0)}
                                            </div>
                                            {(product.retailPrice || 0) > 0 && (
                                                <div className="text-xs text-slate-500">
                                                    Lẻ: {formatPrice(product.retailPrice!)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(product.stock || 0) > 500
                                                    ? "bg-green-100 text-green-700"
                                                    : (product.stock || 0) > 200
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Mobile hint */}
                <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-200 sm:hidden">
                    Vuốt sang trái/phải để xem thêm
                </div>
            </div>
        </div>
    );
}
