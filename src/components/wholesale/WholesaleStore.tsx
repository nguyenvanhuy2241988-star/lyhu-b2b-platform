'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Info, CheckCircle2, ChevronRight, Minus, Plus, Star, X, Clock, Flame, Ticket, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

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
    soldCount?: number;
    rating?: number;
    price?: number;
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

interface FlashSaleItem {
    id: string;
    product_id: string;
    discount_price: number;
    quantity_limit: number;
    quantity_sold: number;
}

interface FlashSale {
    id: string;
    name: string;
    end_time: string;
    items?: FlashSaleItem[];
}

interface CartItem {
    product: Product;
    quantity: number;
    flashSalePrice?: number; // If bought via flash sale
}

const getMockSocialProof = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const positiveHash = Math.abs(hash);
    const rating = 4.5 + (positiveHash % 6) / 10;
    const sold = 50 + (positiveHash % 3450);
    return { rating, sold };
};

export default function WholesaleStore({ 
    initialProducts, 
    promotions, 
    flashSale,
    isWholesaleCustomer 
}: { 
    initialProducts: Product[], 
    promotions: Promotion[], 
    flashSale?: FlashSale | null,
    isWholesaleCustomer: boolean 
}) {
    const supabase = getSupabase();
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'topsale' | 'price_asc' | 'price_desc'>('popular');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // V3 Features States
    const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<string>('00:00:00');
    
    // Checkout States
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [address, setAddress] = useState('');
    const [shippingMethod, setShippingMethod] = useState<'lyhu_ship'|'self'>('lyhu_ship');

    const productsWithSocialProof = useMemo(() => {
        return initialProducts.map(p => ({
            ...p,
            ...getMockSocialProof(p.id)
        }));
    }, [initialProducts]);
    
    const brands = useMemo(() => {
        const brandSet = new Set(initialProducts.map(p => p.brand).filter(Boolean));
        return ['All', ...Array.from(brandSet)];
    }, [initialProducts]);

    const filteredProducts = useMemo(() => {
        let result = productsWithSocialProof.filter(p => {
            const matchesBrand = activeTab === 'All' || p.brand === activeTab;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesBrand && matchesSearch;
        });

        switch (sortBy) {
            case 'topsale': result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)); break;
            case 'price_asc': result.sort((a, b) => ((a.basePricePerUnit || a.basePrice || 0) - (b.basePricePerUnit || b.basePrice || 0))); break;
            case 'price_desc': result.sort((a, b) => ((b.basePricePerUnit || b.basePrice || 0) - (a.basePricePerUnit || a.basePrice || 0))); break;
            case 'latest': result.reverse(); break;
        }

        return result;
    }, [productsWithSocialProof, activeTab, searchQuery, sortBy]);

    // Flash Sale Logic
    const flashSaleProducts = useMemo(() => {
        if (!flashSale || !flashSale.items) return [];
        return flashSale.items.map(fsItem => {
            const p = productsWithSocialProof.find(prod => prod.id === fsItem.product_id);
            if (!p) return null;
            return {
                ...p,
                flashSalePrice: fsItem.discount_price,
                stockRatio: Math.min(100, Math.floor((fsItem.quantity_sold / fsItem.quantity_limit) * 100))
            };
        }).filter(Boolean) as (Product & { flashSalePrice: number, stockRatio: number })[];
    }, [flashSale, productsWithSocialProof]);

    useEffect(() => {
        if (flashSale && flashSale.end_time) {
            const timerId = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(flashSale.end_time).getTime();
                const diff = end - now;
                if (diff <= 0) {
                    setCountdown("00:00:00");
                    clearInterval(timerId);
                } else {
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    setCountdown(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
                }
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [flashSale]);

    const updateQuantity = (product: Product, delta: number, overrideFlashSalePrice?: number) => {
        setCart(prev => {
            const currentQty = prev[product.id]?.quantity || 0;
            const newQty = Math.max(0, currentQty + delta);
            
            const newCart = { ...prev };
            if (newQty === 0) {
                delete newCart[product.id];
            } else {
                newCart[product.id] = { product, quantity: newQty, flashSalePrice: overrideFlashSalePrice };
            }
            return newCart;
        });
    };

    const cartAnalysis = useMemo(() => {
        const items = Object.values(cart);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueItemsCount = items.length;
        
        let baseTotal = 0;
        let originalTotalForDisplay = 0; // The non-discounted value for crossing out

        items.forEach(item => {
            const normalPrice = isWholesaleCustomer ? (item.product.basePricePerUnit || item.product.basePrice || 0) : (item.product.retailPrice || 0);
            const activePrice = item.flashSalePrice ?? normalPrice;
            originalTotalForDisplay += normalPrice * item.quantity;
            baseTotal += activePrice * item.quantity;
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
                                closestMiss = { diff, msg: `Thêm ${diff} sản phẩm để kích hoạt: ${promo.name}` };
                            }
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
        
        // Mock Voucher System (if user saved "VOUCHER_50K")
        if (savedVouchers.includes('VOUCHER_50K') && finalTotal > 500000) {
            discountAmount += 50000;
            appliedPromoName = appliedPromoName ? `${appliedPromoName} + Voucher Giảm 50K` : "Voucher Giảm 50K";
        }

        finalTotal = Math.max(0, baseTotal - discountAmount);

        return {
            totalItems,
            originalTotalForDisplay,
            baseTotal,
            finalTotal,
            discountAmount,
            appliedPromoName,
            pendingUpsellMsg,
            items
        };
    }, [cart, promotions, isWholesaleCustomer, savedVouchers]);

    // Handle Order Submission
    const submitOrder = async () => {
        setIsSubmitting(true);
        try {
            // Lấy ID khách hàng hiện tại
            const { data: { session } } = await supabase.auth.getSession();
            const customerId = session?.user?.id || null;

            // Tạo order gốc
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: customerId,
                    total_amount: cartAnalysis.finalTotal,
                    status: 'pending',
                    note: `B2B Wholesale / Đơn tự tạo trên Web. Đ/c: ${address}. Phương thức: ${shippingMethod}.`,
                    source: 'B2B_WEB'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Tạo danh sách items
            const orderItems = cartAnalysis.items.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.flashSalePrice ?? item.product.basePricePerUnit ?? item.product.basePrice ?? 0,
                discount: 0 // Overall discount was applied directly on order side or can be divided
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);
                
            if (itemsError) throw itemsError;

            // Success
            setCheckoutSuccess(true);
            setCart({});
            setIsCheckoutOpen(false);
            
            // Tắt popup sau 4 giây
            setTimeout(() => setCheckoutSuccess(false), 4000);
            
        } catch (error) {
            console.error("Order submission failed:", error);
            alert("Rất tiếc! Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="pb-32 bg-[#f5f5f5] min-h-screen font-sans">
            {/* Header LYHU Style */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-4 sticky top-0 z-40 shadow-md">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center w-full md:w-auto">
                        <ShoppingCart className="w-8 h-8 text-white mr-2" />
                        <h1 className="text-2xl font-bold text-white tracking-wide cursor-pointer">LYHU <span className="font-light">Sỉ</span></h1>
                        {!isWholesaleCustomer && (
                            <span className="ml-3 text-[10px] font-bold bg-white text-primary-600 px-2 py-0.5 rounded-sm uppercase tracking-wider">Khách lẻ</span>
                        )}
                    </div>
                    
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

                    <div className="hidden md:flex items-center justify-end w-[150px] group relative">
                        <div className="relative py-2 px-2 cursor-pointer">
                            <ShoppingCart className="w-8 h-8 text-white hover:text-white/80 transition-colors" />
                            {cartAnalysis.totalItems > 0 && (
                                <span className="absolute top-0 right-0 bg-secondary-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white shadow-sm">
                                    {cartAnalysis.totalItems}
                                </span>
                            )}
                        </div>

                        {/* Hover Popup Mini Cart */}
                        <div className="absolute top-12 right-0 w-[400px] bg-white shadow-xl border border-gray-200 rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top mt-2">
                            {cartAnalysis.items.length === 0 ? (
                                <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingCart className="w-16 h-16 opacity-30 mb-2" />
                                    <p className="text-sm">Chưa có sản phẩm</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="p-3 text-sm text-gray-400">Sản phẩm mới thêm</div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {cartAnalysis.items.slice().reverse().map(item => {
                                            const price = item.flashSalePrice ?? (isWholesaleCustomer ? (item.product.basePricePerUnit || item.product.basePrice || 0) : (item.product.retailPrice || item.product.basePrice || 0));
                                            return (
                                                <div key={item.product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
                                                    <div className="w-10 h-10 border border-gray-200 bg-white">
                                                        {item.product.image_url && <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-800 truncate">{item.product.name}</p>
                                                        {item.flashSalePrice && <span className="text-[10px] bg-primary-100 text-primary-700 px-1 py-0.5 rounded-sm font-bold">Flash Sale</span>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-primary-600 font-medium">₫{new Intl.NumberFormat('vi-VN').format(price)}</p>
                                                        <p className="text-xs text-gray-500">x {item.quantity}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="p-3 bg-gray-50 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">{cartAnalysis.items.length} Thêm hàng vào giỏ</p>
                                        <button onClick={() => setIsCheckoutOpen(true)} className="bg-primary-600 text-white px-4 py-2 text-sm hover:bg-primary-700">Xem Giỏ Hàng</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-6">
                
                {/* Banner / Promotional Space */}
                <div className="mb-4 rounded-sm overflow-hidden bg-white shadow-sm flex flex-col md:flex-row border border-gray-100">
                    <div className="p-6 md:w-2/3 bg-gradient-to-r from-primary-50 to-primary-100">
                        <h2 className="text-2xl font-bold text-primary-700 mb-2 uppercase tracking-wide">Siêu Hội Bán Sỉ</h2>
                        <p className="text-gray-700 font-medium">Nhập càng nhiều - Chiết khấu càng sâu. Áp dụng bảng giá NPP mới từ tháng này.</p>
                        <div className="mt-4 flex gap-2">
                             <span className="bg-secondary-500 text-white text-xs px-2 py-1 rounded-sm font-bold shadow-sm">-15% ĐƠN TỪ 4 THÙNG</span>
                             <span className="bg-white border border-secondary-500 text-secondary-600 text-xs px-2 py-1 rounded-sm font-bold shadow-sm">GIAO HÀNG TẬN NƠI</span>
                        </div>
                    </div>
                </div>

                {/* V3: Voucher Wallet Row (Giả lậP Voucher xé tay) */}
                <div className="mb-6 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    <div className="min-w-[280px] bg-white border border-secondary-500 rounded-sm shadow-sm flex overflow-hidden">
                        <div className="bg-gradient-to-br from-secondary-400 to-secondary-500 w-[80px] flex flex-col items-center justify-center text-white p-2 border-r border-dashed border-white">
                            <Ticket className="w-8 h-8 opacity-80 mb-1" />
                            <span className="text-[10px] font-bold text-center leading-tight">MÃ<br/>LYHU</span>
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-center bg-secondary-50/30">
                            <h4 className="text-sm font-bold text-gray-800">Giảm 50K</h4>
                            <p className="text-[10px] text-gray-500 mb-2">Đơn tối thiểu đ500k</p>
                            <button 
                                onClick={() => setSavedVouchers(prev => Array.from(new Set([...prev, 'VOUCHER_50K'])))}
                                className={`self-start text-[11px] font-bold px-4 py-1 rounded-sm transition-colors ${savedVouchers.includes('VOUCHER_50K') ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                                {savedVouchers.includes('VOUCHER_50K') ? 'Đã Lưu Vĩ' : 'Lưu'}
                            </button>
                        </div>
                    </div>

                    <div className="min-w-[280px] bg-white border border-primary-200 rounded-sm shadow-sm flex overflow-hidden">
                        <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-[80px] flex flex-col items-center justify-center text-white p-2 border-r border-dashed border-white">
                            <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center mb-1"><span className="text-xs font-bold font-serif">%</span></div>
                            <span className="text-[10px] font-bold text-center leading-tight">MÃ<br/>ĐỐI TÁC</span>
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-center bg-primary-50/10">
                            <h4 className="text-sm font-bold text-gray-800">Freeship Extra</h4>
                            <p className="text-[10px] text-gray-500 mb-2">Tối đa 100K chi phí VC</p>
                            <button 
                                onClick={() => setSavedVouchers(prev => Array.from(new Set([...prev, 'FREESHIP'])))}
                                className={`self-start text-[11px] font-bold px-4 py-1 rounded-sm transition-colors ${savedVouchers.includes('FREESHIP') ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                                {savedVouchers.includes('FREESHIP') ? 'Đã Lưu Vĩ' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* V3: Flash Sale Area */}
                {flashSaleProducts.length > 0 && (
                    <div className="bg-white rounded-sm shadow-sm mb-6 border border-primary-100 overflow-hidden">
                        <div className="bg-primary-50 border-b border-primary-100 p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <Flame className="w-6 h-6 text-primary-600 fill-primary-600 mr-2" />
                                <h2 className="text-xl italic font-black text-primary-700 tracking-wider hidden md:block">FLASH SALE CHỚP NHÁNG</h2>
                                
                                <div className="ml-4 flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-gray-600 mr-1" />
                                    {countdown.split(':').map((num, i) => (
                                        <React.Fragment key={i}>
                                            <span className="bg-black text-white text-xs font-bold px-1.5 py-1 rounded-sm">{num}</span>
                                            {i < 2 && <span className="font-bold text-black">:</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <button className="text-primary-600 text-sm font-medium hover:underline flex items-center">Xem tất cả <ChevronRight className="w-4 h-4"/></button>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto p-4 hide-scrollbar">
                            {flashSaleProducts.map(product => {
                                const qtyInCart = cart[product.id]?.quantity || 0;
                                return (
                                    <div key={product.id} className="min-w-[150px] md:min-w-[180px] group flex flex-col cursor-pointer" onClick={() => setSelectedProduct(product)}>
                                        <div className="aspect-square bg-gray-50 border border-gray-100 mb-2 relative overflow-hidden flex items-center justify-center">
                                            {qtyInCart > 0 && <span className="absolute top-0 right-0 bg-secondary-500 text-white text-[10px] font-bold px-1.5 py-0.5 z-10 rounded-bl-sm">Đã chọn {qtyInCart}</span>}
                                            <div className="absolute top-0 left-0 bg-[#ffd839] text-[#ee4d2d] text-[10px] font-bold px-1 py-0.5 z-10 flex flex-col items-center shadow-sm">
                                                <span>GIẢM</span>
                                                <span>{Math.round(100 - (product.flashSalePrice/(product.basePricePerUnit||1))*100)}%</span>
                                            </div>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <ShoppingCart className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-primary-600 font-bold text-lg mb-1">
                                                <span className="text-[10px] align-top mr-0.5">₫</span>
                                                {new Intl.NumberFormat('vi-VN').format(product.flashSalePrice)}
                                            </span>
                                            <div className="w-full bg-primary-100 rounded-full h-3 mb-2 relative overflow-hidden flex items-center justify-center">
                                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${product.stockRatio}%` }}></div>
                                                <span className="relative text-[9px] font-bold text-white uppercase drop-shadow-md z-1">Đã bán {product.stockRatio}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

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

                {/* Sắp Xếp Giống Shopee */}
                <div className="bg-gray-100 rounded-sm mb-4 flex flex-col md:flex-row items-center p-3 gap-3 justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar">
                        <span className="text-sm text-gray-600 mr-2 whitespace-nowrap hidden md:block">Sắp xếp theo</span>
                        
                        <button onClick={() => setSortBy('popular')} className={`px-4 py-1.5 text-sm rounded-sm whitespace-nowrap ${sortBy === 'popular' ? 'bg-primary-600 text-white font-medium' : 'bg-white border border-transparent shadow-sm hover:border-gray-300'}`}>Phổ Biến</button>
                        <button onClick={() => setSortBy('latest')} className={`px-4 py-1.5 text-sm rounded-sm whitespace-nowrap ${sortBy === 'latest' ? 'bg-primary-600 text-white font-medium' : 'bg-white border border-transparent shadow-sm hover:border-gray-300'}`}>Mới Nhất</button>
                        <button onClick={() => setSortBy('topsale')} className={`px-4 py-1.5 text-sm rounded-sm whitespace-nowrap ${sortBy === 'topsale' ? 'bg-primary-600 text-white font-medium' : 'bg-white border border-transparent shadow-sm hover:border-gray-300'}`}>Bán Chạy</button>
                        
                        <select 
                            className={`px-4 py-1.5 text-sm rounded-sm outline-none cursor-pointer ${['price_asc', 'price_desc'].includes(sortBy) ? 'bg-primary-600 text-white font-medium' : 'bg-white border border-transparent shadow-sm hover:border-gray-300'}`}
                            value={['price_asc', 'price_desc'].includes(sortBy) ? sortBy : ''}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="" disabled>Giá</option>
                            <option value="price_asc" className="text-gray-900 bg-white">Giá: Thấp đến Cao</option>
                            <option value="price_desc" className="text-gray-900 bg-white">Giá: Cao đến Thấp</option>
                        </select>
                    </div>
                    <div className="text-sm font-medium"><span className="text-primary-600">{filteredProducts.length}</span> Sản phẩm</div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                    {filteredProducts.map(product => {
                        const qty = cart[product.id]?.quantity || 0;
                        const fsProd = flashSaleProducts.find(f => f.id === product.id);
                        const isFlashSaleActive = !!fsProd;
                        const price = fsProd?.flashSalePrice ?? (isWholesaleCustomer ? (product.basePricePerUnit || product.basePrice || 0) : (product.retailPrice || product.basePrice || 0));

                        return (
                            <div key={product.id} className="group bg-white rounded-sm shadow-sm hover:shadow-md border border-transparent hover:border-primary-500 overflow-hidden flex flex-col transition-all duration-200 relative">
                                
                                {qty > 0 && (
                                    <div className="absolute top-0 right-0 bg-secondary-500 text-white text-[10px] leading-tight font-bold px-1.5 py-1 z-10 rounded-bl-sm shadow-sm pointer-events-none">
                                        Đã chọn {qty}
                                    </div>
                                )}
                                
                                {isFlashSaleActive && (
                                     <div className="absolute top-0 left-0 bg-[#ffd839] text-[#ee4d2d] text-[10px] leading-tight font-bold px-1 py-0.5 z-10 shadow-sm pointer-events-none border border-[#ffd839]/80">
                                        FLASH SALE
                                    </div>
                                )}

                                <div 
                                    className="aspect-square bg-gray-50 w-full relative flex items-center justify-center overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <ShoppingCart className="w-10 h-10 text-primary-200" />
                                    )}
                                    {price === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-medium z-10">Liên hệ lấy giá</div>}
                                </div>
                                
                                <div className="p-2.5 flex-1 flex flex-col">
                                    <h3 
                                        className="text-sm text-gray-800 line-clamp-2 leading-[1.2rem] h-[2.4rem] break-words mb-1 cursor-pointer hover:text-primary-600 transition-colors"
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center justify-between mb-2 mt-auto">
                                        <div className="flex bg-primary-50 px-1 py-0.5 rounded-sm items-center border border-primary-100">
                                            <span className="text-[10px] text-primary-600 font-bold mr-0.5">{product.rating}</span>
                                            <Star className="w-[10px] h-[10px] fill-primary-500 text-primary-500" />
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                            Đã bán {(product.soldCount || 0) >= 1000 ? ((product.soldCount || 0)/1000).toFixed(1) + 'k' : product.soldCount}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col pt-1 border-t border-gray-100 border-dashed">
                                        <div className="flex items-center gap-1 min-h-[22px]">
                                            {!isWholesaleCustomer && price > 0 && !isFlashSaleActive && (
                                                <span className="text-[10px] text-gray-400 line-through">
                                                    ₫{new Intl.NumberFormat('vi-VN').format((product.basePricePerUnit || 0) * 1.5)}
                                                </span>
                                            )}
                                            {isFlashSaleActive && (
                                                <span className="text-[10px] text-gray-400 line-through">
                                                    ₫{new Intl.NumberFormat('vi-VN').format(product.basePricePerUnit || 0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`flex items-baseline ${isFlashSaleActive ? 'text-[#ee4d2d]' : 'text-primary-600'}`}>
                                            <span className="text-xs font-bold mr-[2px]">₫</span>
                                            <span className="text-base font-medium">
                                                {price > 0 ? new Intl.NumberFormat('vi-VN').format(price) : 'Liên hệ'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        {qty === 0 ? (
                                            <button 
                                                onClick={() => updateQuantity(product, 1, isFlashSaleActive ? price : undefined)}
                                                className={`w-full py-1.5 border rounded-sm text-sm font-medium transition-colors ${isFlashSaleActive ? 'border-[#ee4d2d] text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white' : 'border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white'}`}
                                            >
                                                Thêm vào giỏ
                                            </button>
                                        ) : (
                                            <div className={`flex items-center justify-between border rounded-sm h-8 ${isFlashSaleActive ? 'border-[#ee4d2d] bg-[#ee4d2d]/10 text-[#ee4d2d]' : 'border-primary-500 bg-primary-50 text-primary-600'}`}>
                                                <button onClick={() => updateQuantity(product, -1)} className="w-8 h-full flex items-center justify-center hover:bg-black/5"><Minus className="w-4 h-4" /></button>
                                                <span className="font-bold text-sm flex-1 text-center select-none bg-transparent">{qty}</span>
                                                <button onClick={() => updateQuantity(product, 1)} className="w-8 h-full flex items-center justify-center hover:bg-black/5"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick View Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProduct(null)}>
                    <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 z-20 transition-colors" onClick={() => setSelectedProduct(null)}>
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-8 border-r border-gray-100 shrink-0 relative">
                            {selectedProduct.image_url ? <img src={selectedProduct.image_url} alt="" className="w-full h-auto object-contain max-h-[300px]" /> : <ShoppingCart className="w-24 h-24 text-gray-300" />}
                        </div>

                        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
                            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-sm w-fit mb-3">{selectedProduct.brand}</span>
                            <h2 className="text-xl font-medium text-gray-800 leading-tight mb-2">{selectedProduct.name}</h2>
                            
                            <div className="flex items-center gap-4 text-sm mb-4">
                                <div className="flex items-center gap-1 text-primary-600 font-bold">
                                    <span className="border-b border-primary-600 pb-[1px]">{selectedProduct.rating}</span><Star className="w-4 h-4 fill-primary-500" />
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="text-gray-600">Đã bán <span className="font-semibold text-gray-900">{selectedProduct.soldCount}</span></div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 flex flex-col gap-1 mb-6 mt-2">
                                <span className="text-gray-500 text-sm">Giá gốc: 
                                    <span className="line-through ml-2">₫{new Intl.NumberFormat('vi-VN').format((selectedProduct.basePricePerUnit || 0) * 1.5)}</span>
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl text-primary-600 font-medium">
                                        ₫{new Intl.NumberFormat('vi-VN').format(selectedProduct.basePricePerUnit || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-gray-500 text-sm">Số lượng thêm</span>
                                {(() => {
                                    const qty = cart[selectedProduct.id]?.quantity || 0;
                                    return qty === 0 ? (
                                        <button onClick={() => updateQuantity(selectedProduct, 1)} className="px-6 py-2.5 bg-primary-600 text-white rounded-sm font-medium hover:bg-primary-700">Thêm vào giỏ</button>
                                    ) : (
                                        <div className="flex items-center justify-between border border-primary-500 rounded-sm h-10 w-32 shadow-sm text-primary-600">
                                            <button onClick={() => updateQuantity(selectedProduct, -1)} className="w-10 h-full flex items-center justify-center hover:bg-primary-50"><Minus className="w-4 h-4" /></button>
                                            <span className="font-bold text-sm text-gray-800 border-x border-gray-200 flex-1 text-center h-full flex items-center justify-center">{qty}</span>
                                            <button onClick={() => updateQuantity(selectedProduct, 1)} className="w-10 h-full flex items-center justify-center hover:bg-primary-50"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* V3: Checkout Sliding Drawer */}
            {isCheckoutOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsCheckoutOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary-500 text-white">
                            <h2 className="text-lg font-bold">Thanh Toán Đơn Sỉ</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="hover:bg-primary-600 p-1 rounded-full text-white"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                            {/* Danh sách hàng */}
                            <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-4 mb-4">
                                <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Danh sách sản phẩm</h3>
                                <div className="flex flex-col gap-3">
                                    {cartAnalysis.items.map(item => {
                                        const price = item.flashSalePrice ?? item.product.basePricePerUnit ?? 0;
                                        return (
                                            <div key={item.product.id} className="flex gap-3">
                                                <img src={item.product.image_url || ''} className="w-12 h-12 border border-gray-200 object-cover rounded-sm bg-gray-50" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 truncate">{item.product.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">SKU: {item.product.sku}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-sm font-bold text-primary-600">₫{new Intl.NumberFormat('vi-VN').format(price)}</span>
                                                        <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-sm">x{item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Form Giao hàng */}
                            <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-4 mb-4">
                                <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Thông tin giao hàng</h3>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Địa chỉ nhận hàng (Kho)</label>
                                        <textarea 
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            rows={2} 
                                            className="w-full border border-gray-200 rounded-sm p-2 text-sm focus:outline-primary-500 bg-gray-50" 
                                            placeholder="Nhập địa chỉ cụ thể..."
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Phương thức</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShippingMethod('lyhu_ship')} className={`flex-1 py-2 text-sm rounded-sm border font-medium ${shippingMethod === 'lyhu_ship' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 bg-white text-gray-600'}`}>LYHU Giao</button>
                                            <button onClick={() => setShippingMethod('self')} className={`flex-1 py-2 text-sm rounded-sm border font-medium ${shippingMethod === 'self' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 bg-white text-gray-600'}`}>Tự tới lấy</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tổng kết */}
                            <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-4">
                                <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Chi tiết thanh toán</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Tổng tiền hàng</span>
                                        <span>₫{new Intl.NumberFormat('vi-VN').format(cartAnalysis.baseTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tổng giảm giá/Voucher</span>
                                        <span className="text-secondary-600">-₫{new Intl.NumberFormat('vi-VN').format(cartAnalysis.discountAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Phí vận chuyển</span>
                                        <span>{shippingMethod === 'lyhu_ship' ? (savedVouchers.includes('FREESHIP') ? 'Miễn phí' : 'Thoả thuận') : '₫0'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-100 mt-2 pt-2">
                                        <span className="font-bold text-gray-800">Tổng thanh toán</span>
                                        <span className="text-2xl font-bold text-primary-600">₫{new Intl.NumberFormat('vi-VN').format(cartAnalysis.finalTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200">
                            <button 
                                onClick={submitOrder}
                                disabled={isSubmitting || cartAnalysis.items.length === 0 || address.trim() === ''}
                                className="w-full bg-primary-600 text-white py-3.5 rounded-sm font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Đặt Hàng Sỉ Ngay'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Popup Thông báo Thành công Mock */}
            {checkoutSuccess && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
                    <div className="bg-white p-8 rounded-md flex flex-col items-center max-w-sm w-full shadow-2xl text-center transform scale-100 animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-secondary-100 text-secondary-500 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt Hàng Thành Công!</h2>
                        <p className="text-gray-500 text-sm mb-6">Đơn sỉ của bạn đã được ghi nhận vào hệ thống LYHU. Bộ phận Sales sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                        <button onClick={() => setCheckoutSuccess(false)} className="bg-primary-600 text-white w-full py-2 rounded-sm font-medium">Tiếp tục mua hàng</button>
                    </div>
                </div>
            )}

            {/* Sticky Bottom Bar (Mobile/Desktop friendly) */}
            {cartAnalysis.totalItems > 0 && !isCheckoutOpen && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
                    
                    {/* Upsell / Promo Banner */}
                    {(cartAnalysis.appliedPromoName || cartAnalysis.pendingUpsellMsg) && (
                        <div className={`text-xs px-4 py-1.5 font-medium flex items-center justify-center transition-colors shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex-wrap gap-2 ${cartAnalysis.appliedPromoName ? 'bg-secondary-500 text-white' : 'bg-primary-50 text-primary-700 border-b border-primary-100'}`}>
                            {cartAnalysis.appliedPromoName ? (
                                <><CheckCircle2 className="w-3.5 h-3.5 mr-1 inline shrink-0" /> {cartAnalysis.appliedPromoName}</>
                            ) : (
                                <><Info className="w-3.5 h-3.5 mr-1 inline shrink-0" /> {cartAnalysis.pendingUpsellMsg}</>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between h-[60px] max-w-6xl mx-auto">
                        <div className="flex items-center pl-4 relative h-full flex-1 group" onClick={() => setIsCheckoutOpen(true)}>
                            {/* Icon Cart Floating */}
                            <div className="relative -top-3 w-12 h-12 bg-white border border-primary-500 text-primary-600 rounded-full flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform cursor-pointer">
                                <ShoppingCart className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
                                    {cartAnalysis.totalItems}
                                </span>
                            </div>
                            
                            <div className="ml-4 h-full flex flex-col justify-center cursor-pointer">
                                <div className="text-gray-500 text-[10px] uppercase tracking-wide font-semibold">Tổng thanh toán</div>
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

                        <button onClick={() => setIsCheckoutOpen(true)} className="bg-primary-600 text-white px-8 h-full font-bold text-[15px] hover:bg-primary-700 transition-colors flex items-center justify-center min-w-[140px] shadow-inner shadow-white/20">
                            Mua Hàng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

