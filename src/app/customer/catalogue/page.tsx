"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { addToCart, getCart } from "@/lib/customerStore";
import { ShoppingCart, Plus, Search, Check, Package, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface CatalogueProduct {
    id: string;
    sku: string;
    name: string;
    brand: string;
    unit: string;
    price: number;
    wholesalePrice: number;
    retailPrice?: number;
    image_url?: string;
    stock?: number;
    items_per_carton?: number;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const BRANDS = ["Tất cả", "BOYO", "CVT", "ABI SNACK", "UHi", "LYHU"];

// Fallback products if DB is empty or loading fails
const FALLBACK_PRODUCTS: CatalogueProduct[] = [
    {
        id: "prod-1",
        sku: "BOYO-XM-100",
        name: "Bột Xí Muội BOYO Cao Cấp (Gói 100g)",
        brand: "BOYO",
        unit: "Gói",
        price: 25000,
        wholesalePrice: 25000,
        retailPrice: 35000,
        stock: 500,
        items_per_carton: 50,
    },
    {
        id: "prod-2",
        sku: "ABI-DH-70",
        name: "Da Heo Cháy Tỏi Abi Snack Giòn Rụm",
        brand: "ABI SNACK",
        unit: "Gói",
        price: 32000,
        wholesalePrice: 32000,
        retailPrice: 45000,
        stock: 350,
        items_per_carton: 30,
    },
    {
        id: "prod-3",
        sku: "CVT-KM-200",
        name: "Thanh Khoai Môn Sấy Giòn CVT Thượng Hạng",
        brand: "CVT",
        unit: "Hộp",
        price: 48000,
        wholesalePrice: 48000,
        retailPrice: 65000,
        stock: 180,
        items_per_carton: 24,
    },
    {
        id: "prod-4",
        sku: "UHI-BG-150",
        name: "Bánh Gạo Nướng Phô Mai UHi Hàn Quốc",
        brand: "UHi",
        unit: "Gói",
        price: 29000,
        wholesalePrice: 29000,
        retailPrice: 40000,
        stock: 220,
        items_per_carton: 36,
    },
    {
        id: "prod-5",
        sku: "LYHU-MT-500",
        name: "Mít Sấy Giòn Tự Nhiên LYHU Loại 1 (500g)",
        brand: "LYHU",
        unit: "Gói",
        price: 75000,
        wholesalePrice: 75000,
        retailPrice: 95000,
        stock: 120,
        items_per_carton: 20,
    },
    {
        id: "prod-6",
        sku: "BOYO-CL-250",
        name: "Sốt Chanh Leo BOYO Chấm Hoa Quả Đậm Vị",
        brand: "BOYO",
        unit: "Chai",
        price: 38000,
        wholesalePrice: 38000,
        retailPrice: 50000,
        stock: 260,
        items_per_carton: 24,
    },
];

export default function CataloguePage() {
    const [products, setProducts] = useState<CatalogueProduct[]>(FALLBACK_PRODUCTS);
    const [selectedBrand, setSelectedBrand] = useState("Tất cả");
    const [searchQuery, setSearchQuery] = useState("");
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Sync cart with local storage on mount
    useEffect(() => {
        setCartItems(getCart());
    }, []);

    // Fetch real products from Supabase
    useEffect(() => {
        async function loadProducts() {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('products')
                    .select('id, sku, name, brand, unit, price, wholesale_price, retail_price, image_url, items_per_carton')
                    .eq('is_active', true)
                    .order('name');

                if (!error && data && data.length > 0) {
                    const mapped: CatalogueProduct[] = data.map((p: any) => ({
                        id: p.id,
                        sku: p.sku || 'SKU-' + p.id.slice(0, 5),
                        name: p.name,
                        brand: p.brand || 'LYHU',
                        unit: p.unit || 'Cái',
                        price: p.wholesale_price || p.price || 0,
                        wholesalePrice: p.wholesale_price || p.price || 0,
                        retailPrice: p.retail_price,
                        image_url: p.image_url,
                        items_per_carton: p.items_per_carton,
                    }));
                    setProducts(mapped);
                }
            } catch (err) {
                console.log("Using fallback products", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadProducts();
    }, []);

    const cartLookup = useMemo(() => {
        return (cartItems || []).reduce((acc: Record<string, number>, item: any) => {
            if (item?.product?.id) {
                acc[item.product.id] = (acc[item.product.id] || 0) + (item.quantity || 0);
            }
            return acc;
        }, {});
    }, [cartItems]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchBrand = selectedBrand === "Tất cả" || p.brand?.toLowerCase() === selectedBrand.toLowerCase();
            const matchSearch = !searchQuery.trim() || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.brand.toLowerCase().includes(searchQuery.toLowerCase());
            return matchBrand && matchSearch;
        });
    }, [products, selectedBrand, searchQuery]);

    const handleAddToCart = useCallback((product: CatalogueProduct) => {
        // Map to structure expected by customerStore
        const productForStore = {
            id: product.id,
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            unit: product.unit,
            wholesalePrice: product.wholesalePrice,
            retailPrice: product.retailPrice,
            basePricePerUnit: product.wholesalePrice,
            customerPriceTiers: [],
            ctvSelfShipPriceTiers: [],
            ctvCommissionRate: 0,
            basePrice: product.wholesalePrice,
            customerPrice: product.wholesalePrice,
            ctvSelfShipPrice: product.wholesalePrice,
        };
        const updated = addToCart(productForStore as any, 1);
        setCartItems(updated);

        // Quick feedback
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1000);

        // Notify storage listener in CustomerShell
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
    }, []);

    const totalCartItems = useMemo(() => {
        return (cartItems || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    }, [cartItems]);

    const totalCartAmount = useMemo(() => {
        return (cartItems || []).reduce((sum: number, item: any) => {
            const price = item?.product?.wholesalePrice || 0;
            return sum + (price * (item.quantity || 0));
        }, 0);
    }, [cartItems]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Top Storefront Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Mua Sỉ Sản Phẩm</h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Bảng giá sỉ chính thức phân phối độc quyền LYHU ({filteredProducts.length} sản phẩm)
                    </p>
                </div>

                {totalCartItems > 0 && (
                    <Link
                        href="/customer/cart"
                        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00AFA9] text-white text-sm font-semibold hover:bg-[#009893] transition-colors"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{totalCartItems} sản phẩm trong giỏ</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* Quick Search & Brand Filter Strip */}
            <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên sản phẩm, mã SKU, thương hiệu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00AFA9] focus:bg-white transition-colors"
                    />
                </div>

                {/* Horizontal Brand Pills */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {BRANDS.map((brand) => {
                        const isSelected = selectedBrand === brand;
                        return (
                            <button
                                key={brand}
                                onClick={() => setSelectedBrand(brand)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                                    isSelected
                                        ? "bg-[#00AFA9] text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {brand}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2-Column Mobile Grid / 3-4 Col Desktop Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => {
                    const inCart = cartLookup[product.id] || 0;
                    const isJustAdded = addedId === product.id;
                    const discount = product.retailPrice && product.retailPrice > product.wholesalePrice
                        ? Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100)
                        : null;

                    return (
                        <div
                            key={product.id}
                            className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                                inCart > 0 ? "border-[#00AFA9] ring-1 ring-[#00AFA9]" : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <div>
                                {/* Product Image Container */}
                                <div className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <Package className="w-12 h-12 stroke-[1.25]" />
                                            <span className="text-[10px] font-mono mt-1 text-slate-400">{product.brand}</span>
                                        </div>
                                    )}

                                    {/* Discount Badge */}
                                    {discount && (
                                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                            -{discount}%
                                        </span>
                                    )}

                                    {/* In-Cart Badge */}
                                    {inCart > 0 && (
                                        <span className="absolute top-2 left-2 bg-[#00AFA9] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            <span>{inCart}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-3 sm:p-4">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                            {product.brand}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {product.unit}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-snug">
                                        {product.name}
                                    </h3>

                                    {/* Pricing */}
                                    <div className="mt-2">
                                        <div className="text-sm sm:text-base font-extrabold text-[#00AFA9]">
                                            {formatPrice(product.wholesalePrice)}
                                        </div>
                                        {product.retailPrice && (
                                            <div className="text-[10px] sm:text-xs text-slate-400 line-through">
                                                Lẻ: {formatPrice(product.retailPrice)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <div className="p-3 sm:p-4 pt-0">
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className={`w-full py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                                        isJustAdded
                                            ? "bg-[#8EC63F] text-slate-900"
                                            : inCart > 0
                                            ? "bg-[#00AFA9] text-white hover:bg-[#009893]"
                                            : "bg-slate-100 text-slate-800 hover:bg-[#00AFA9] hover:text-white"
                                    }`}
                                >
                                    {isJustAdded ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Đã thêm</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>{inCart > 0 ? `Thêm (+${inCart})` : "Thêm giỏ"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty Search Result */}
            {filteredProducts.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không tìm thấy sản phẩm phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
                </div>
            )}

            {/* Mobile Sticky Bottom Cart Bar */}
            {totalCartItems > 0 && (
                <div className="sm:hidden fixed bottom-16 left-3 right-3 z-40 bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#00AFA9] flex items-center justify-center font-bold text-xs text-white">
                            {totalCartItems}
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-medium">Tạm tính giỏ hàng</div>
                            <div className="text-sm font-bold text-[#8EC63F]">{formatPrice(totalCartAmount)}</div>
                        </div>
                    </div>

                    <Link
                        href="/customer/cart"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00AFA9] text-white rounded-xl text-xs font-bold hover:bg-[#009893] transition-colors"
                    >
                        <span>Đặt hàng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}
        </div>
    );
}
