'use client';

import React, { useState, useMemo } from 'react';
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

// ... existing interfaces ...
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
                    for (const action of promo.actions) {
                        if (action.action_type === 'discount_percent') {
                            const discount = (baseTotal * action.reward_value) / 100;
                            discountAmount += discount;
                        }
                    }
                    break;
                } else if (!appliedPromoName && closestMiss.msg !== '' && totalItems > 0) {
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
        <div className="pb-32 bg-[#f5f5f5] min-h-screen">
            {/* Header LYHU Style */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-4 sticky top-0 z-10 shadow-md">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Logo Area */}
                    <div className="flex items-center w-full md:w-auto">
                        <ShoppingCart className="w-8 h-8 text-white mr-2" />
                        <h1 className="text-2xl font-bold text-white tracking-wide">LYHU <span className="font-light">Sỉ</span></h1>
                        {!isWholesaleCustomer && (
                            <span className="ml-3 text-[10px] font-bold bg-white text-primary-600 px-2 py-0.5 rounded-sm uppercase tracking-wider">Khách lẻ</span>
                        )}
                    </div>
                    
                    {/* Search */}
                    <div className="relative w-full md:w-1/2">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm sản phẩm, thương hiệu sỉ..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white rounded-sm pl-4 pr-12 py-2.5 text-sm text-gray-800 focus:outline-none shadow-sm placeholder-gray-400"
                        />
                        <button className="absolute right-1 top-1 bottom-1 bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-sm flex items-center justify-center transition-colors">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Desktop Cart Icon (Optional) */}
                    <div className="hidden md:flex items-center justify-end w-[150px]">
                        <div className="relative cursor-pointer">
                            <ShoppingCart className="w-8 h-8 text-white hover:text-white/80 transition-colors" />
                            {cartAnalysis.totalItems > 0 && (
                                <span className="absolute -top-2 -right-3 bg-secondary-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white shadow-sm">
                                    {cartAnalysis.totalItems}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-6">
                
                {/* Banner / Promotional Space */}
                <div className="mb-6 rounded-sm overflow-hidden bg-white shadow-sm flex flex-col md:flex-row border border-gray-100">
                    <div className="p-6 md:w-2/3 bg-gradient-to-r from-primary-50 to-primary-100">
                        <h2 className="text-2xl font-bold text-primary-700 mb-2 uppercase tracking-wide">Siêu Hội Bán Sỉ</h2>
                        <p className="text-gray-700 font-medium">Nhập càng nhiều - Chiết khấu càng sâu. Áp dụng bảng giá NPP mới từ tháng này.</p>
                        <div className="mt-4 flex gap-2">
                             <span className="bg-secondary-500 text-white text-xs px-2 py-1 rounded-sm font-bold shadow-sm">-15% ĐƠN TỪ 4 THÙNG</span>
                             <span className="bg-white border border-secondary-500 text-secondary-600 text-xs px-2 py-1 rounded-sm font-bold shadow-sm">GIAO HÀNG TẬN NƠI</span>
                        </div>
                    </div>
                </div>

                {/* Brands Tabs */}
                <div className="bg-white rounded-sm shadow-sm mb-4 px-2 py-3 border border-gray-100">
                    <div className="flex overflow-x-auto hide-scrollbar space-x-4 pl-2 items-center">
                        <span className="text-gray-500 font-medium text-sm whitespace-nowrap hidden md:block uppercase">Thương hiệu:</span>
                        {brands.map(brand => (
                            <button
                                key={brand}
                                onClick={() => setActiveTab(brand)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-sm text-sm transition-all duration-200 border-b-2 ${
                                    activeTab === brand 
                                    ? 'border-primary-500 text-primary-600 font-bold' 
                                    : 'border-transparent text-gray-700 hover:text-primary-500'
                                }`}
                            >
                                {brand === 'All' ? 'Tất cả' : brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                    {filteredProducts.map(product => {
                        const qty = cart[product.id]?.quantity || 0;
                        const price = isWholesaleCustomer ? (product.basePricePerUnit || product.basePrice || 0) : (product.retailPrice || product.basePrice || 0);

                        return (
                            <div key={product.id} className="group bg-white rounded-sm shadow-sm hover:shadow-md border border-transparent hover:border-primary-500 overflow-hidden flex flex-col transition-all duration-200 relative">
                                
                                {/* Badge */}
                                {qty > 0 && (
                                    <div className="absolute top-0 right-0 bg-secondary-500 text-white text-xs font-bold px-2 py-1 z-10 rounded-bl-sm">
                                        Đã chọn {qty}
                                    </div>
                                )}

                                {/* Product Image */}
                                <div className="aspect-square bg-gray-50 w-full relative flex items-center justify-center overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <ShoppingCart className="w-10 h-10 text-primary-200" />
                                    )}
                                    {price === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1">Liên hệ lấy giá</div>}
                                </div>
                                
                                <div className="p-2.5 flex-1 flex flex-col">
                                    <h3 className="text-sm text-gray-800 line-clamp-2 leading-[1.2rem] h-[2.4rem] break-words mb-2">
                                        {product.name}
                                    </h3>
                                    
                                    <div className="mt-auto flex flex-col pt-1">
                                        <div className="flex items-center gap-1 min-h-[24px]">
                                            {!isWholesaleCustomer && price > 0 && (
                                                <span className="text-[10px] text-gray-400 line-through">
                                                    ₫{new Intl.NumberFormat('vi-VN').format(price * 1.5)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-primary-600 flex items-baseline">
                                            <span className="text-xs font-bold mr-[2px]">₫</span>
                                            <span className="text-base font-medium">
                                                {price > 0 ? new Intl.NumberFormat('vi-VN').format(price) : 'Liên hệ'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Inline Add to Cart Controls */}
                                    <div className="mt-3">
                                        {qty === 0 ? (
                                            <button 
                                                onClick={() => updateQuantity(product, 1)}
                                                className="w-full py-1.5 border border-primary-500 text-primary-600 rounded-sm text-sm font-medium hover:bg-primary-500 hover:text-white transition-colors"
                                            >
                                                Thêm vào giỏ
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-between border border-primary-500 rounded-sm bg-primary-50 h-8">
                                                <button 
                                                    onClick={() => updateQuantity(product, -1)}
                                                    className="w-8 h-full flex items-center justify-center text-primary-600 hover:bg-primary-100"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold text-sm text-primary-600 flex-1 text-center select-none bg-transparent">{qty}</span>
                                                <button 
                                                    onClick={() => updateQuantity(product, 1)}
                                                    className="w-8 h-full flex items-center justify-center text-primary-600 hover:bg-primary-100"
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
            </div>

            {/* Sticky Bottom Bar (Mobile/Desktop friendly) */}
            {cartAnalysis.totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                    
                    {/* Upsell / Promo Banner */}
                    {(cartAnalysis.appliedPromoName || cartAnalysis.pendingUpsellMsg) && (
                        <div className={`text-xs px-4 py-1.5 font-medium flex items-center justify-center transition-colors ${cartAnalysis.appliedPromoName ? 'bg-secondary-500 text-white' : 'bg-primary-50 text-primary-700 border-b border-primary-100'}`}>
                            {cartAnalysis.appliedPromoName ? (
                                <><CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> {cartAnalysis.appliedPromoName}</>
                            ) : (
                                <><Info className="w-3.5 h-3.5 mr-1 inline" /> {cartAnalysis.pendingUpsellMsg}</>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between h-[60px] max-w-6xl mx-auto">
                        <div className="flex items-center pl-4 relative h-full flex-1">
                            {/* Icon Cart Floating partially out */}
                            <div className="relative -top-4 w-14 h-14 bg-white border-2 border-primary-500 text-primary-600 rounded-full flex items-center justify-center shadow-lg">
                                <ShoppingCart className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[10px] font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
                                    {cartAnalysis.totalItems}
                                </span>
                            </div>
                            
                            <div className="ml-4 h-full flex flex-col justify-center">
                                <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">Tổng thanh toán</div>
                                <div className="flex items-baseline gap-2">
                                    <p className="font-bold text-xl text-primary-600 leading-none tracking-tight">
                                        ₫{new Intl.NumberFormat('vi-VN').format(cartAnalysis.finalTotal)}
                                    </p>
                                    {cartAnalysis.discountAmount > 0 && (
                                        <p className="text-xs text-gray-400 line-through">
                                            ₫{new Intl.NumberFormat('vi-VN').format(cartAnalysis.baseTotal)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button className="bg-primary-600 text-white px-8 h-full font-bold text-[15px] hover:bg-primary-700 transition-colors flex items-center justify-center min-w-[140px] shadow-inner shadow-white/20">
                            Mua Hàng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

