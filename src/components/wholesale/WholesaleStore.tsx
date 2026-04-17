'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Info, CheckCircle2, ChevronRight, Minus, Plus } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    sku: string;
    brand: string;
    retailPrice?: number;
    basePricePerUnit: number;
    basePrice: number;
    packSize?: number;
    image_url?: string;
}

interface PromotionCondition {
    id: string;
    condition_type: 'min_cart_qty' | 'min_unique_items' | 'specific_item_qty';
    target_product_ids: string[];
    required_value: number;
}

interface PromotionAction {
    id: string;
    action_type: 'discount_percent' | 'override_price' | 'free_items';
    reward_value: number;
    reward_product_id?: string;
}

interface Promotion {
    id: string;
    name: string;
    description: string;
    priority: number;
    conditions: PromotionCondition[];
    actions: PromotionAction[];
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function WholesaleStore({ 
    initialProducts, 
    promotions, 
    isWholesaleCustomer 
}: { 
    initialProducts: Product[], 
    promotions: Promotion[], 
    isWholesaleCustomer: boolean 
}) {
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Extract unique brands
    const brands = useMemo(() => {
        const brandSet = new Set(initialProducts.map(p => p.brand).filter(Boolean));
        return ['All', ...Array.from(brandSet)];
    }, [initialProducts]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return initialProducts.filter(p => {
            const matchesBrand = activeTab === 'All' || p.brand === activeTab;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesBrand && matchesSearch;
        });
    }, [initialProducts, activeTab, searchQuery]);

    // Handle Quantity Change
    const updateQuantity = (product: Product, delta: number) => {
        setCart(prev => {
            const currentQty = prev[product.id]?.quantity || 0;
            const newQty = Math.max(0, currentQty + delta);
            
            const newCart = { ...prev };
            if (newQty === 0) {
                delete newCart[product.id];
            } else {
                newCart[product.id] = { product, quantity: newQty };
            }
            return newCart;
        });
    };

    // Calculate Cart and Promotions
    const cartAnalysis = useMemo(() => {
        const items = Object.values(cart);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueItemsCount = items.length;
        
        let baseTotal = 0;
        items.forEach(item => {
            const priceToUse = isWholesaleCustomer ? (item.product.basePricePerUnit || item.product.basePrice || 0) : (item.product.retailPrice || 0);
            baseTotal += priceToUse * item.quantity;
        });

        let finalTotal = baseTotal;
        let discountAmount = 0;
        let appliedPromoName = null;
        let pendingUpsellMsg = null;

        if (isWholesaleCustomer && promotions && promotions.length > 0) {
            // Very simple rule engine evaluator for demo purposes
            for (const promo of promotions) {
                let isEligible = true;
                let closestMiss = { diff: 9999, msg: '' };

                for (const cond of promo.conditions) {
                    if (cond.condition_type === 'min_cart_qty') {
                        if (totalItems < cond.required_value) {
                            isEligible = false;
                            const diff = cond.required_value - totalItems;
                            if (diff < closestMiss.diff) {
                                closestMiss = { diff, msg: `Thêm ${diff} sản phẩm bất kỳ để kích hoạt: ${promo.name}` };
                            }
                        }
                    } else if (cond.condition_type === 'min_unique_items') {
                        if (uniqueItemsCount < cond.required_value) {
                            isEligible = false;
                        }
                    }
                }

                if (isEligible) {
                    appliedPromoName = promo.name;
                    // Apply actions
                    for (const action of promo.actions) {
                        if (action.action_type === 'discount_percent') {
                            const discount = (baseTotal * action.reward_value) / 100;
                            discountAmount += discount;
                        }
                    }
                    break; // Stop at highest priority promo
                } else if (!appliedPromoName && closestMiss.msg !== '' && totalItems > 0) {
                    // Show upsell for the highest priority missed promo
                    if (!pendingUpsellMsg) pendingUpsellMsg = closestMiss.msg;
                }
            }
        }

        finalTotal = Math.max(0, baseTotal - discountAmount);

        return {
            totalItems,
            baseTotal,
            finalTotal,
            discountAmount,
            appliedPromoName,
            pendingUpsellMsg
        };
    }, [cart, promotions, isWholesaleCustomer]);


    return (
        <div className="pb-32">
            {/* Header */}
            <div className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-xl font-bold text-gray-800">Đặt hàng Sỉ</h1>
                    {!isWholesaleCustomer && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">Chế độ Khách lẻ</span>
                    )}
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên món, mã hàng..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Brands Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar mt-4 space-x-2 pb-1">
                    {brands.map(brand => (
                        <button
                            key={brand}
                            onClick={() => setActiveTab(brand)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeTab === brand 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredProducts.map(product => {
                    const qty = cart[product.id]?.quantity || 0;
                    const price = isWholesaleCustomer ? (product.basePricePerUnit || product.basePrice || 0) : (product.retailPrice || product.basePrice || 0);

                    return (
                        <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            {/* Product Image placeholder */}
                            <div className="h-32 bg-gray-100 w-full relative flex items-center justify-center text-gray-400">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <ShoppingCart className="w-8 h-8 opacity-20" />
                                )}
                            </div>
                            
                            <div className="p-3 flex-1 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight flex-1 mb-1">
                                    {product.name}
                                </h3>
                                
                                <div className="mt-1 mb-3">
                                    {!isWholesaleCustomer && (
                                        <p className="text-xs text-gray-500 line-through">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((product.basePricePerUnit || 0) * 1.5)}
                                        </p>
                                    )}
                                    <p className="text-blue-600 font-bold">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                                    </p>
                                </div>

                                {/* Controls */}
                                <div className="mt-auto">
                                    {qty === 0 ? (
                                        <button 
                                            onClick={() => updateQuantity(product, 1)}
                                            className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            Chọn mua
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-between border border-blue-200 rounded-lg bg-blue-50">
                                            <button 
                                                onClick={() => updateQuantity(product, -1)}
                                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded-l-lg"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-bold text-sm select-none">{qty}</span>
                                            <button 
                                                onClick={() => updateQuantity(product, 1)}
                                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded-r-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sticky Cart */}
            {cartAnalysis.totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                    
                    {/* Upsell / Promo Banner */}
                    {(cartAnalysis.appliedPromoName || cartAnalysis.pendingUpsellMsg) && (
                        <div className={`text-xs px-4 py-2 font-medium flex items-center justify-center ${cartAnalysis.appliedPromoName ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {cartAnalysis.appliedPromoName ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã áp dụng: {cartAnalysis.appliedPromoName}</>
                            ) : (
                                <><Info className="w-3 h-3 mr-1 inline" /> {cartAnalysis.pendingUpsellMsg}</>
                            )}
                        </div>
                    )}

                    <div className="px-4 flex justify-between items-center h-16 max-w-4xl mx-auto">
                        <div className="flex items-center relative">
                            <div className="relative">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartAnalysis.totalItems}
                                </span>
                            </div>
                            
                            <div className="ml-3">
                                {cartAnalysis.discountAmount > 0 && (
                                    <p className="text-xs text-gray-400 line-through">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartAnalysis.baseTotal)}
                                    </p>
                                )}
                                <p className="font-bold text-gray-900 leading-none">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartAnalysis.finalTotal)}
                                </p>
                            </div>
                        </div>

                        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-blue-700 flex items-center transition-colors">
                            Đặt hàng ({cartAnalysis.totalItems})
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

