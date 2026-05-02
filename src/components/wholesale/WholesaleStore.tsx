'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Info, CheckCircle2, ChevronRight, Minus, Plus, Star, X, Clock, Flame, Ticket, Loader2, History, Bell, User, LogIn, Eye, EyeOff, Package, MessageCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';
import B2BSupportChat from '@/components/wholesale/B2BSupportChat';
import Link from 'next/link';

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
    weight?: string;
    packaging_spec?: string;
    items_per_carton?: number;
    description?: string;
    video_url?: string;
    extra_images?: string[];
    unit?: string;
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

interface WholesaleBanner {
    id: string;
    image_url: string;
    link_url?: string;
    position: 'main_slider' | 'side_top' | 'side_bottom' | 'popup';
    sort_order: number;
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
    banners = [],
    vouchers = [],
    isWholesaleCustomer: serverIsWholesaleCustomer,
    b2bCodeData: serverB2bCodeData
}: { 
    initialProducts: Product[], 
    promotions: Promotion[], 
    flashSale?: FlashSale | null,
    banners?: WholesaleBanner[],
    vouchers?: any[],
    isWholesaleCustomer: boolean,
    b2bCodeData?: any
}) {
    const supabase = getSupabase();
    // B2B Active Code State
    const [b2bCodeData, setB2bCodeData] = useState<any>(serverB2bCodeData);
    const [inputB2bCode, setInputB2bCode] = useState('');
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    
    const isWholesaleCustomer = serverIsWholesaleCustomer || !!b2bCodeData;
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [isCartLoaded, setIsCartLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'topsale' | 'price_asc' | 'price_desc'>('popular');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    // V4 Features States
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [pastOrders, setPastOrders] = useState<any[]>([]);

    // V3 Vouchers & Real Data
    const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<string>('00:00:00');
    
    // Banner Carousel State
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // V5: Search History
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // V5: Auth Layout State
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState('');
    
    // Register State
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerError, setRegisterError] = useState('');

    // Popup Banner State
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const popupBanner = useMemo(() => banners.find(b => b.position === 'popup'), [banners]);

    // V5: Notifications
    const [notifications] = useState([
        { id: '1', text: 'Chào mừng bạn đến với LYHU Sỉ! Đặt hàng sỉ dễ dàng hơn bao giờ hết.', time: 'Hôm nay', read: false },
        { id: '2', text: 'Flash Sale đang diễn ra, nhanh tay săn deal!', time: 'Hôm nay', read: false },
        { id: '3', text: 'Voucher FREESHIP đã sẵn sàng trong ví của bạn.', time: 'Hôm qua', read: true },
    ]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // B2B Support Chat: track auth user
    const [wholesaleUser, setWholesaleUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getSession().then(({ data }: any) => {
            setWholesaleUser(data?.session?.user || null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
            setWholesaleUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Checkout States
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [address, setAddress] = useState('');
    const [shippingMethod, setShippingMethod] = useState<'lyhu_ship'|'self'>('lyhu_ship');

    // V4: Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('lyhu_b2b_cart');
        if (saved) {
            try { setCart(JSON.parse(saved)); } catch (e) {}
        }
        setIsCartLoaded(true);
    }, []);

    // V4: Save to local storage
    useEffect(() => {
        if (isCartLoaded) {
            localStorage.setItem('lyhu_b2b_cart', JSON.stringify(cart));
        }
    }, [cart, isCartLoaded]);

    // Popup logic
    useEffect(() => {
        if (popupBanner) {
            // Check if this specific popup has been closed in this session
            const popupClosed = sessionStorage.getItem(`lyhu_popup_closed_${popupBanner.id}`);
            if (!popupClosed) {
                setIsPopupVisible(true);
            }
        }
    }, [popupBanner]);

    const handleClosePopup = () => {
        if (popupBanner) {
            sessionStorage.setItem(`lyhu_popup_closed_${popupBanner.id}`, 'true');
        }
        setIsPopupVisible(false);
    };

    // V4: Fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .eq('customer_id', session.user.id)
                    .order('created_at', { ascending: false });
                if (data) setPastOrders(data);
            }
        };
        fetchHistory();
    }, []);

    // Banner Data Processing
    const mainSliders = useMemo(() => banners.filter(b => b.position === 'main_slider').sort((a,b) => a.sort_order - b.sort_order), [banners]);
    const sideTop = useMemo(() => banners.find(b => b.position === 'side_top'), [banners]);
    const sideBottom = useMemo(() => banners.find(b => b.position === 'side_bottom'), [banners]);

    // Slider Auto-play
    useEffect(() => {
        if (mainSliders.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlideIndex(prev => (prev + 1) % mainSliders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [mainSliders.length]);

    // V4: Handle Reorder
    const handleReorder = (order: any) => {
        const newCart = { ...cart };
        
        order.order_items.forEach((item: any) => {
            const product = initialProducts.find(p => p.id === item.product_id);
            if (product) {
                const existingQty = newCart[product.id]?.quantity || 0;
                newCart[product.id] = {
                    product,
                    quantity: existingQty + item.quantity,
                };
            }
        });
        
        setCart(newCart);
        setIsHistoryOpen(false);
        setIsCheckoutOpen(true);
    };

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

    // Helper function to ignore accents
    const normalizeSearch = (str: string) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const filteredProducts = useMemo(() => {
        let result = productsWithSocialProof.filter(p => {
            const matchesBrand = activeTab === 'All' || p.brand === activeTab;
            const searchNormalized = normalizeSearch(searchQuery);
            const matchesSearch = !searchNormalized || 
                                  normalizeSearch(p.name).includes(searchNormalized) || 
                                  normalizeSearch(p.sku).includes(searchNormalized);
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
            const normalPrice = item.product.retailPrice || ((item.product.basePricePerUnit || item.product.basePrice || 0) * 1.5) || 0;
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
        
        // Real Voucher System
        if (savedVouchers.length > 0 && vouchers && vouchers.length > 0) {
            for (const vId of savedVouchers) {
                const voucher = vouchers.find(v => v.id === vId);
                if (voucher && baseTotal >= voucher.min_order_value) {
                    if (voucher.discount_type === 'fixed_amount') {
                        discountAmount += voucher.discount_value;
                    } else if (voucher.discount_type === 'percent') {
                        discountAmount += (baseTotal * voucher.discount_value) / 100;
                    } else if (voucher.discount_type === 'freeship') {
                        // We will just discount the total by at most shipping cost (mock it as 100k limit)
                        discountAmount += Math.min(voucher.discount_value, 100000); 
                    }
                    appliedPromoName = appliedPromoName ? `${appliedPromoName} + ${voucher.name}` : voucher.name;
                }
            }
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
    }, [cart, promotions, isWholesaleCustomer, savedVouchers, vouchers]);

    // Handle B2B Code Verification
    const handleVerifyB2bCode = async () => {
        setIsVerifyingCode(true);
        const { data, error } = await supabase
            .from('b2b_customer_codes')
            .select('*')
            .eq('code', inputB2bCode.toUpperCase())
            .eq('is_active', true)
            .single();

        if (data) {
            setB2bCodeData(data);
            alert('Đã kích hoạt Bảng giá Sỉ thành công!');
            // If logged in and code is unbound, bind it
            const { data: { session } } = await supabase.auth.getSession();
            if (session && !data.customer_id) {
                await supabase.from('b2b_customer_codes').update({ customer_id: session.user.id }).eq('id', data.id);
            }
        } else {
            alert('Mã không hợp lệ hoặc đã hết hạn!');
        }
        setIsVerifyingCode(false);
    };

    // Handle Order Submission - Uses server-side API route to bypass RLS
    const submitOrder = async () => {
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const payload: any = {
                total_amount: cartAnalysis.finalTotal,
                status: 'pending',
                customer_name: customerName.trim(),
                receiver_phone: customerPhone.trim(),
                receiver_address: address.trim(),
                note: `[B2B Web] ${customerName} - ${customerPhone}. Đ/c: ${address}. Ship: ${shippingMethod === 'lyhu_ship' ? 'LYHU Giao' : 'Tự tới lấy'}. ${cartAnalysis.appliedPromoName ? 'KM: ' + cartAnalysis.appliedPromoName : ''}`,
                source: 'B2B_WEB'
            };

            if (b2bCodeData && b2bCodeData.telesales_id) {
                payload.telesales_user_id = b2bCodeData.telesales_id;
            } else if (session?.user?.id) {
                payload.telesales_user_id = session.user.id;
            }

            const items = cartAnalysis.items.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.flashSalePrice ?? item.product.basePricePerUnit ?? item.product.basePrice ?? 0,
                discount: 0
            }));

            // Call server-side API route which uses Service Role Key to bypass RLS
            const res = await fetch('/api/wholesale/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload, items })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Lỗi tạo đơn hàng');

            // Success
            setCheckoutSuccess(true);
            setCart({});
            setIsCheckoutOpen(false);
            
            // Tắt popup sau 4 giây
            setTimeout(() => setCheckoutSuccess(false), 4000);
            
        } catch (error: any) {
            console.error("Order submission failed:", error);
            alert(`Rất tiếc! ${error.message || 'Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // V5: Search history helpers
    useEffect(() => {
        try {
            const h = localStorage.getItem('lyhu_search_history');
            if (h) setSearchHistory(JSON.parse(h));
        } catch {}
    }, []);

    const saveSearchTerm = (term: string) => {
        if (!term.trim()) return;
        const updated = [term.trim(), ...searchHistory.filter(t => t !== term.trim())].slice(0, 8);
        setSearchHistory(updated);
        localStorage.setItem('lyhu_search_history', JSON.stringify(updated));
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('lyhu_search_history');
    };

    // V5: Login handler
    const handleLogin = async () => {
        setIsLoggingIn(true);
        setLoginError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
            if (error) throw error;
            setIsLoginOpen(false);
            window.location.reload();
        } catch (err: any) {
            setLoginError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin + '/auth/callback?next=/wholesale',
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setLoginError(`Lỗi đăng nhập ${provider}: ${err.message}`);
            setRegisterError(`Lỗi đăng nhập ${provider}: ${err.message}`);
        }
    };

    const handleRegister = async () => {
        setIsRegistering(true);
        setRegisterError('');
        try {
            const { error } = await supabase.auth.signUp({
                email: registerEmail,
                password: registerPassword,
            });
            if (error) throw error;
            setIsRegisterOpen(false);
            window.location.reload();
        } catch (err: any) {
            setRegisterError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setIsRegistering(false);
        }
    };

    if (isLoginOpen || isRegisterOpen) {
        return (
            <div className="min-h-screen flex flex-col font-sans bg-white md:bg-gray-50">
                {/* Auth Header */}
                <div className="bg-white px-4 z-10 w-full relative">
                    <div className="max-w-6xl mx-auto h-[84px] flex items-center justify-between">
                        <div className="flex items-center gap-4 md:gap-6">
                            <img 
                                src="/logo-full.png" 
                                alt="LYHU" 
                                className="w-[160px] md:w-[190px] h-auto object-contain cursor-pointer" 
                                onClick={() => { setIsLoginOpen(false); setIsRegisterOpen(false); }}
                            />
                            <div className="text-xl md:text-2xl font-medium text-gray-800 pt-1">
                                {isLoginOpen ? 'Đăng nhập' : 'Đăng ký'}
                            </div>
                        </div>
                        <a href="https://zalo.me" target="_blank" rel="noreferrer" className="text-primary-600 text-sm hover:underline cursor-pointer pt-1">
                            Bạn cần giúp đỡ?
                        </a>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-primary-500 py-10 md:py-20 relative px-4">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between z-10 relative h-full">
                        {/* Branding Left */}
                        <div className="hidden md:flex flex-col items-center justify-center flex-1 pr-10 md:pr-16 text-white text-center">
                            <img src="/logo-full.png" alt="LYHU" className="w-[450px] object-contain brightness-0 invert drop-shadow-sm mb-6" />
                            <h1 className="text-3xl font-medium leading-relaxed drop-shadow-sm pb-10">
                                Nền tảng bán sỉ ưu đãi hàng đầu <br/>dành cho Đại lý toàn quốc
                            </h1>
                        </div>

                        {/* Form Card Right */}
                        <div className="w-full max-w-[400px] bg-white rounded-sm shadow-[0_3px_10px_0_rgba(0,0,0,0.14)] p-8 shrink-0">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-medium text-gray-800">{isLoginOpen ? 'Đăng nhập' : 'Đăng ký'}</h2>
                            </div>

                            {/* Forms */}
                            {isLoginOpen ? (
                                <div className="space-y-6">
                                    {loginError && <div className="text-sm bg-[#fff9fa] border border-[#ffb4a0] p-3 text-red-500 rounded-sm">{loginError}</div>}
                                    <div>
                                        <input
                                            type="text"
                                            value={loginEmail}
                                            onChange={e => setLoginEmail(e.target.value)}
                                            placeholder="Email / Số điện thoại"
                                            className="w-full border border-gray-300 rounded-sm p-2.5 text-sm focus:border-gray-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={loginPassword}
                                            onChange={e => setLoginPassword(e.target.value)}
                                            placeholder="Mật khẩu"
                                            className="w-full border border-gray-300 rounded-sm p-2.5 text-sm focus:border-gray-500 focus:outline-none pr-10"
                                            onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleLogin}
                                        disabled={isLoggingIn || !loginEmail || !loginPassword}
                                        className="w-full bg-primary-600 text-white uppercase text-sm py-3 rounded-sm font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ĐĂNG NHẬP'}
                                    </button>
                                    <div className="flex justify-between items-center text-xs text-[#05a] mt-2">
                                        <span className="cursor-pointer hover:opacity-80">Quên mật khẩu</span>
                                        <span className="cursor-pointer hover:opacity-80">Đăng nhập với SMS</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {registerError && <div className="text-sm bg-[#fff9fa] border border-[#ffb4a0] p-3 text-red-500 rounded-sm">{registerError}</div>}
                                    <div>
                                        <input
                                            type="text"
                                            value={registerEmail}
                                            onChange={e => setRegisterEmail(e.target.value)}
                                            placeholder="Email đăng ký"
                                            className="w-full border border-gray-300 rounded-sm p-2.5 text-sm focus:border-gray-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={registerPassword}
                                            onChange={e => setRegisterPassword(e.target.value)}
                                            placeholder="Mật khẩu tạo tài khoản"
                                            className="w-full border border-gray-300 rounded-sm p-2.5 text-sm focus:border-gray-500 focus:outline-none pr-10"
                                            onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleRegister}
                                        disabled={isRegistering || !registerEmail || !registerPassword}
                                        className="w-full bg-primary-600 text-white uppercase text-sm py-3 rounded-sm font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ĐĂNG KÝ'}
                                    </button>
                                    <div className="text-center text-xs text-gray-500 mt-2">
                                        Bằng việc Đăng ký, bạn đồng ý với LYHU về <br/>
                                        <span className="text-primary-600 font-medium hover:underline cursor-pointer">Điều khoản dịch vụ</span> & <span className="text-primary-600 font-medium hover:underline cursor-pointer">Chính sách bảo mật</span>
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 border-b border-gray-200"></div>
                                <span className="text-xs text-gray-400 uppercase">Hoặc</span>
                                <div className="flex-1 border-b border-gray-200"></div>
                            </div>

                            {/* Social Logins */}
                            <div className="flex gap-2">
                                <button onClick={() => handleOAuthLogin('facebook')} className="flex-1 border border-gray-300 p-2.5 flex items-center justify-center gap-2 rounded-sm hover:bg-gray-50 transition cursor-pointer">
                                    <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    <span className="text-sm text-gray-600 font-medium">Facebook</span>
                                </button>
                                <button onClick={() => handleOAuthLogin('google')} className="flex-1 border border-gray-300 p-2.5 flex items-center justify-center gap-2 rounded-sm hover:bg-gray-50 transition cursor-pointer">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                                    <span className="text-sm text-gray-600 font-medium">Google (Gmail)</span>
                                </button>
                            </div>

                            {/* Toggle Sign Up / Login */}
                            <div className="text-center mt-8 text-sm text-gray-400">
                                {isLoginOpen ? (
                                    <>Bạn mới biết đến LYHU Sỉ? <span onClick={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }} className="text-primary-600 font-medium cursor-pointer hover:underline">Đăng ký</span></>
                                ) : (
                                    <>Bạn đã có tài khoản? <span onClick={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }} className="text-primary-600 font-medium cursor-pointer hover:underline">Đăng nhập</span></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer simple space filler */}
                <div className="bg-white py-10"></div>
            </div>
        );
    }

    return (
        <div className="pb-32 bg-[#f5f5f5] min-h-screen font-sans">
            {/* Shopee-style Entry Popup */}
            {isPopupVisible && popupBanner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={handleClosePopup}>
                    <div className="relative max-w-[500px] w-full animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <button 
                            className="absolute -top-10 right-0 md:-right-10 text-white hover:text-gray-200 transition-colors bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur-sm"
                            onClick={handleClosePopup}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <a 
                            href={popupBanner.link_url || '#'} 
                            onClick={(e) => {
                                handleClosePopup();
                                if (!popupBanner.link_url) e.preventDefault();
                            }}
                            className="block rounded-lg overflow-hidden shadow-2xl relative group bg-white"
                        >
                            <img src={popupBanner.image_url} alt="Khuyến mãi đặc biệt" className="w-full h-auto max-h-[70vh] object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                        </a>
                    </div>
                </div>
            )}

            {/* V5: Top Utility Bar */}
            <div className="bg-primary-700 text-white/80 text-xs hidden md:block">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-8">
                    <div className="flex items-center gap-4">
                        <span className="hover:text-white cursor-pointer">Kênh NPP</span>
                        <Link href="/tin-tuc" className="hover:text-white transition-colors font-medium text-secondary-300">Tin tức Thị trường</Link>
                        <span className="hover:text-white cursor-pointer">Tải ứng dụng</span>
                        <span>Kết nối</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="flex items-center gap-1 hover:text-white cursor-pointer">
                                <Bell className="w-3.5 h-3.5" />
                                Thông Báo
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="bg-secondary-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>
                            {/* Notification Dropdown */}
                            {isNotifOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-1 w-[360px] bg-white shadow-xl border border-gray-200 rounded-sm z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-gray-800">Thông Báo Mới</h4>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {notifications.map(n => (
                                                <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-primary-50/30 cursor-pointer text-left ${!n.read ? 'bg-primary-50/50' : ''}`}>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{n.text}</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-2 text-center border-t border-gray-100">
                                            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Xem tất cả thông báo</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {wholesaleUser ? (
                            <button onClick={handleLogout} className="hover:text-white cursor-pointer">Đăng Xuất</button>
                        ) : (
                            <>
                                <button onClick={() => setIsLoginOpen(true)} className="hover:text-white cursor-pointer">Đăng Nhập</button>
                                <span className="text-white/40">|</span>
                                <button onClick={() => setIsRegisterOpen(true)} className="hover:text-white cursor-pointer">Đăng Ký</button>
                            </>
                        )}
                        {!isWholesaleCustomer && (
                            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                                <input type="text" value={inputB2bCode} onChange={e=>setInputB2bCode(e.target.value)} placeholder="Nhập Mã Sỉ" className="px-2 py-1 text-black text-xs rounded-sm outline-none w-24" />
                                <button onClick={handleVerifyB2bCode} disabled={isVerifyingCode} className="bg-secondary-500 hover:bg-secondary-600 text-white px-2 py-1 rounded-sm text-xs font-bold transition-colors">
                                    {isVerifyingCode ? 'Đang KT' : 'KÍCH HOẠT'}
                                </button>
                            </div>
                        )}
                        {b2bCodeData && (
                            <div className="flex items-center gap-1 border-l border-white/20 pl-4 text-secondary-300 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Khách Sỉ ({b2bCodeData.code})
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Header LYHU Style - Shopee layout */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 sticky top-0 z-40 shadow-md">
                <div className="max-w-6xl mx-auto hidden md:flex items-center gap-6 pt-3 pb-2">
                    {/* Col 1: Logo */}
                    <div className="w-[220px] shrink-0 flex items-center">
                        <div className="h-[55px] overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <img 
                                src="/logo-full.png" 
                                alt="LYHU" 
                                className="h-[200px] w-auto object-contain brightness-0 invert drop-shadow-sm" 
                            />
                        </div>
                    </div>
                    
                    {/* Col 2: Search Input + Keywords */}
                    <div className="flex-1 flex flex-col gap-1.5 pt-1">
                        {/* Search Bar constrained to 40px */}
                        <div className="relative h-[40px]">
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm sản phẩm, thương hiệu sỉ..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        saveSearchTerm(searchQuery);
                                        setIsSearchFocused(false);
                                        document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="w-full h-full bg-white rounded-sm pl-4 pr-12 text-sm text-gray-800 focus:outline-none shadow-sm placeholder-gray-400"
                            />
                            <button 
                                onClick={() => {
                                    if (searchQuery.trim()) saveSearchTerm(searchQuery);
                                    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="absolute right-1 top-1 bottom-1 bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-sm flex items-center justify-center transition-colors"
                            >
                                <Search className="w-4 h-4" />
                            </button>

                            {/* Search History Dropdown */}
                            {isSearchFocused && searchHistory.length > 0 && !searchQuery && (
                                <div className="absolute top-full left-0 right-0 bg-white shadow-xl border border-gray-200 rounded-b-sm z-50 mt-0.5">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                                        <span className="text-xs font-semibold text-gray-500">Lịch sử tìm kiếm</span>
                                        <button onClick={clearSearchHistory} className="text-[11px] text-primary-600 hover:text-primary-700 font-medium">Xoá tất cả</button>
                                    </div>
                                    {searchHistory.map((term, i) => (
                                        <button 
                                            key={i}
                                            onMouseDown={() => { setSearchQuery(term); setIsSearchFocused(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 flex items-center gap-2 transition-colors"
                                        >
                                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{term}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Keywords perfectly flush with search bar left edge */}
                        <div className="flex items-center gap-3 overflow-x-auto h-[20px]">
                            {(searchHistory.length > 0 ? searchHistory.slice(0, 7) : ['Bánh tráng Abi', 'Khoai môn sấy', 'Snack BOYO', 'Đặc sản miền Tây', 'Bánh tráng phô mai', 'Gia vị', 'Flash Sale']).map((kw, i) => (
                                <button 
                                    key={i}
                                    onClick={() => { setSearchQuery(kw); document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                                    className="text-white/80 hover:text-white text-[11px] whitespace-nowrap transition-colors"
                                >
                                    {kw}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Col 3: Actions constraints */}
                    <div className="shrink-0 flex items-center justify-end">
                        <div className="relative group">
                            <button className="p-2 cursor-pointer hover:bg-white/10 rounded-sm transition-colors flex items-center justify-center">
                                <ShoppingCart className="w-[28px] h-[28px] text-white" strokeWidth={1.5} />
                                {cartAnalysis.totalItems > 0 && (
                                    <span className="absolute top-0 -right-1 bg-white text-primary-600 outline outline-2 outline-primary-500 text-[10px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-0.5 shadow-sm">
                                        {cartAnalysis.totalItems}
                                    </span>
                                )}
                            </button>
                            <div className="absolute top-full right-0 w-[400px] bg-white shadow-xl border border-gray-200 rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top mt-1 z-50">
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
                                                const price = item.flashSalePrice ?? (item.product.price || item.product.basePricePerUnit || item.product.basePrice || 0);
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

                {/* Mobile header (simple) */}
                <div className="md:hidden flex items-center gap-3 py-2">
                    <div className="h-[32px] overflow-hidden flex items-center justify-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/logo-full.png" alt="LYHU" className="h-[120px] w-auto object-contain brightness-0 invert" />
                    </div>
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white rounded-sm pl-3 pr-10 py-2 text-sm text-gray-800 focus:outline-none placeholder-gray-400"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <button className="relative p-1" onClick={() => setIsCheckoutOpen(true)}>
                        <ShoppingCart className="w-6 h-6 text-white" />
                        {cartAnalysis.totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">{cartAnalysis.totalItems}</span>
                        )}
                    </button>
                </div>
            </div>



            <div className="max-w-6xl mx-auto px-4 mt-6">
                
                {/* Dynamic Banners (Shopee Style) */}
                {banners.length > 0 ? (
                    <div className="mb-4 flex flex-col md:flex-row gap-2 h-auto md:h-[300px]">
                        {/* Main Carousel (2/3 width) */}
                        <div className="w-full md:w-2/3 h-[200px] md:h-full relative overflow-hidden rounded-sm bg-gray-100 group">
                            {mainSliders.length > 0 ? (
                                <>
                                    <div className="w-full h-full flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}>
                                        {mainSliders.map(slide => (
                                            <a key={slide.id} href={slide.link_url || '#'} className="min-w-full h-full relative cursor-pointer block">
                                                <img src={slide.image_url} alt="Carousel Banner" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                    {mainSliders.length > 1 && (
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                            {mainSliders.map((_, idx) => (
                                                <button key={idx} onClick={() => setCurrentSlideIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentSlideIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} />
                                            ))}
                                        </div>
                                    )}
                                    {/* Navigation Arrows */}
                                    {mainSliders.length > 1 && (
                                        <>
                                            <button onClick={() => setCurrentSlideIndex(p => (p - 1 + mainSliders.length) % mainSliders.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                                            <button onClick={() => setCurrentSlideIndex(p => (p + 1) % mainSliders.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"><ChevronRight className="w-5 h-5" /></button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-primary-50 to-primary-100 p-6 flex flex-col justify-center">
                                    <h2 className="text-2xl md:text-3xl font-bold text-primary-700 mb-2 uppercase tracking-wide">Siêu Hội Bán Sỉ</h2>
                                    <p className="text-gray-700 font-medium">Nhập càng nhiều - Chiết khấu càng sâu. Áp dụng bảng giá NPP mới từ tháng này.</p>
                                </div>
                            )}
                        </div>

                        {/* Side Banners (1/3 width, hidden on mobile) */}
                        <div className="hidden md:flex w-1/3 flex-col gap-2 h-full">
                            {sideTop && (
                                <a href={sideTop.link_url || '#'} className="h-1/2 rounded-sm overflow-hidden block relative group">
                                    <img src={sideTop.image_url} alt="Side Top Banner" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                </a>
                            )}
                            {sideBottom && (
                                <a href={sideBottom.link_url || '#'} className="h-1/2 rounded-sm overflow-hidden block relative group">
                                    <img src={sideBottom.image_url} alt="Side Bottom Banner" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
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
                )}

                {/* Dynamic Voucher Wallet Row */}
                {vouchers && vouchers.length > 0 && (
                    <div className="mb-6 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                        {vouchers.map(v => (
                            <div key={v.id} className={`min-w-[280px] bg-white border rounded-sm shadow-sm flex overflow-hidden ${v.discount_type === 'freeship' ? 'border-primary-200' : 'border-secondary-500'}`}>
                                <div className={`w-[80px] flex flex-col items-center justify-center text-white p-2 border-r border-dashed border-white ${v.discount_type === 'freeship' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-secondary-400 to-secondary-500'}`}>
                                    {v.discount_type === 'freeship' ? (
                                        <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center mb-1"><span className="text-xs font-bold font-serif">%</span></div>
                                    ) : (
                                        <Ticket className="w-8 h-8 opacity-80 mb-1" />
                                    )}
                                    <span className="text-[10px] font-bold text-center leading-tight uppercase max-w-full break-all">{v.code}</span>
                                </div>
                                <div className={`flex-1 p-3 flex flex-col justify-center ${v.discount_type === 'freeship' ? 'bg-primary-50/10' : 'bg-secondary-50/30'}`}>
                                    <h4 className="text-sm font-bold text-gray-800">{v.name}</h4>
                                    <p className="text-[10px] text-gray-500 mb-2">{v.description}</p>
                                    <button 
                                        onClick={() => setSavedVouchers(prev => Array.from(new Set([...prev, v.id])))}
                                        className={`self-start text-[11px] font-bold px-4 py-1 rounded-sm transition-colors ${savedVouchers.includes(v.id) ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                                        {savedVouchers.includes(v.id) ? 'Đã Lưu Ví' : 'Lưu'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
                <div id="product-grid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                    {filteredProducts.map(product => {
                        const qty = cart[product.id]?.quantity || 0;
                        const fsProd = flashSaleProducts.find(f => f.id === product.id);
                        const isFlashSaleActive = !!fsProd;
                        const price = fsProd?.flashSalePrice ?? (product.price || product.basePricePerUnit || product.basePrice || 0);

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
                                        onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); }}
                                    >
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center justify-between mb-2 mt-auto">
                                        <div className="flex bg-primary-50 px-1 py-0.5 rounded-sm items-center border border-primary-100">
                                            <span className="text-[10px] text-primary-600 font-bold mr-0.5">{product.rating}</span>
                                            <Star className="w-[10px] h-[10px] fill-primary-500 text-primary-500" />
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                            Đã bán {(product.soldCount || 0) >= 1000 ? ((product.soldCount || 0)/1000).toFixed(1) + 'k' : (product.soldCount || 0)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col pt-1 border-t border-gray-100 border-dashed">
                                        <div className="flex items-center gap-1 min-h-[22px]">
                                            {isFlashSaleActive && (
                                                <span className="text-[10px] text-gray-400 line-through">
                                                    ₫{new Intl.NumberFormat('vi-VN').format(product.price || product.basePricePerUnit || product.basePrice || 0)}
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

            {/* Quick View Modal (Shopee style) */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProduct(null)}>
                    <div className="bg-white rounded-md shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 z-20 transition-colors" onClick={() => setSelectedProduct(null)}>
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col p-6 border-r border-gray-100 shrink-0 relative overflow-y-auto">
                            {/* Product Main Image */}
                            <div className="w-full aspect-square bg-white border border-gray-200 mb-2 relative flex items-center justify-center overflow-hidden">
                                {(() => {
                                    const allImages = [selectedProduct.image_url, ...(selectedProduct.extra_images || [])].filter(Boolean);
                                    const currentImg = allImages[activeImageIdx] || selectedProduct.image_url;
                                    if (currentImg) {
                                        return <img src={currentImg} alt="" className="w-full h-full object-contain" />;
                                    }
                                    return <ShoppingCart className="w-24 h-24 text-gray-300" />;
                                })()}
                            </div>
                            
                            {/* Thumbnail Row */}
                            {(() => {
                                const allImages = [selectedProduct.image_url, ...(selectedProduct.extra_images || [])].filter(Boolean);
                                if (allImages.length > 0) {
                                    return (
                                        <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar py-1">
                                            {allImages.map((imgUrl, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => setActiveImageIdx(idx)}
                                                    className={`w-16 h-16 border-2 rounded-sm flex-shrink-0 cursor-pointer transition-all ${idx === activeImageIdx ? 'border-primary-500' : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'}`}
                                                >
                                                    <img src={imgUrl} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {selectedProduct.video_url && (
                                                <a href={selectedProduct.video_url} target="_blank" rel="noreferrer" className="w-16 h-16 border border-gray-200 rounded-sm flex-shrink-0 cursor-pointer opacity-80 hover:opacity-100 bg-gray-900 flex items-center justify-center relative">
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                                        <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"><ChevronRight className="w-3 h-3 text-white ml-0.5" /></div>
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Share to Chat */}
                            <div className="flex items-center gap-3 mt-4 px-2">
                                <button
                                    onClick={() => {
                                        const price = selectedProduct.price || selectedProduct.basePricePerUnit || selectedProduct.basePrice || 0;
                                        window.dispatchEvent(new CustomEvent('b2b-share-product', {
                                            detail: {
                                                name: selectedProduct.name,
                                                price,
                                                image_url: selectedProduct.image_url,
                                                brand: selectedProduct.brand
                                            }
                                        }));
                                        setSelectedProduct(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Hỏi qua Chat LYHU
                                </button>
                                <div className="flex gap-2 items-center cursor-pointer text-gray-500 hover:text-blue-600 text-sm">
                                    <span className="font-medium">Chia sẻ:</span>
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54v-2.2c0-2.5 1.5-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/></svg>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
                            <span className="bg-primary-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm w-fit mb-2">{selectedProduct.brand}</span>
                            <h2 className="text-xl font-medium text-gray-800 leading-tight mb-2">{selectedProduct.name}</h2>
                            
                            <div className="flex items-center gap-4 text-sm mb-4">
                                <div className="flex items-center gap-1 text-primary-600 font-bold">
                                    <span className="border-b border-primary-600 pb-[1px]">{selectedProduct.rating || '5.0'}</span><Star className="w-4 h-4 fill-primary-500" />
                                </div>
                                <div className="w-px h-3 bg-gray-300"></div>
                                <div className="text-gray-600">Đã bán <span className="font-bold text-gray-900">{selectedProduct.soldCount || 0}</span></div>
                            </div>

                            <div className="bg-gray-50/80 p-4 rounded-sm border border-gray-100 flex flex-col gap-1 mb-6">
                                {(() => {
                                    const fsProd = flashSaleProducts.find(f => f.id === selectedProduct.id);
                                    const baseOrNormal = selectedProduct.price || selectedProduct.basePricePerUnit || selectedProduct.basePrice || 0;
                                    const activePrice = fsProd ? fsProd.flashSalePrice : baseOrNormal;
                                    const hasCarton = (selectedProduct.items_per_carton || 0) > 0;
                                    
                                    return (
                                        <>
                                            {fsProd ? (
                                                <>
                                                    <span className="text-gray-500 text-sm">Giá gốc: <span className="line-through ml-2">₫{new Intl.NumberFormat('vi-VN').format(baseOrNormal)}</span></span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl text-[#ee4d2d] font-medium">₫{new Intl.NumberFormat('vi-VN').format(activePrice)}</span>
                                                        <span className="text-xs bg-[#ee4d2d] text-white font-bold px-1.5 py-0.5 rounded-sm uppercase">Flash Sale</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-gray-500 text-sm">Giá nhập sỉ ({selectedProduct.unit || 'sản phẩm'}): </span>
                                                    <span className="text-3xl text-primary-600 font-medium">₫{new Intl.NumberFormat('vi-VN').format(activePrice)}</span>
                                                </>
                                            )}
                                            
                                            {hasCarton && (
                                                <div className="border-t border-gray-200/60 mt-2 pt-2">
                                                    <span className="text-gray-500 text-sm">Mua nguyên thùng ({selectedProduct.items_per_carton} {selectedProduct.unit || 'sản phẩm'}): </span>
                                                    <div className="text-xl text-primary-600 font-medium">₫{new Intl.NumberFormat('vi-VN').format(activePrice * (selectedProduct.items_per_carton || 1))}</div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="mb-6 flex-1">
                                <h4 className="font-bold text-gray-800 text-sm mb-2 uppercase">Thông tin sản phẩm</h4>
                                <div className="text-sm text-gray-600 space-y-1 bg-white p-3 border border-gray-100 shadow-sm rounded-sm">
                                    <p className="flex"><span className="w-24 text-gray-400 shrink-0">Mã SKU</span> <span className="font-medium text-gray-800 break-words">{selectedProduct.sku}</span></p>
                                    <p className="flex"><span className="w-24 text-gray-400 shrink-0">Kho hàng</span> <span className="font-medium text-gray-800">Sẵn sàng giao</span></p>
                                    <p className="flex"><span className="w-24 text-gray-400 shrink-0">Thương hiệu</span> <span className="text-primary-600">{selectedProduct.brand}</span></p>
                                    <p className="flex"><span className="w-24 text-gray-400 shrink-0">Đóng gói</span> <span className="font-medium text-gray-800">{selectedProduct.packaging_spec || selectedProduct.unit}</span></p>
                                    {selectedProduct.weight && <p className="flex"><span className="w-24 text-gray-400 shrink-0">Trọng lượng</span> <span className="font-medium text-gray-800">{selectedProduct.weight}</span></p>}
                                    {((selectedProduct.items_per_carton || 0) > 0) && <p className="flex"><span className="w-24 text-gray-400 shrink-0">Quy cách</span> <span className="font-medium text-gray-800">{selectedProduct.items_per_carton} sản phẩm / thùng</span></p>}
                                    <div className="my-2 border-t border-gray-100 pt-2">
                                        <p className="text-gray-700 leading-relaxed max-w-prose whitespace-pre-wrap">
                                            {selectedProduct.description || (
                                                `${selectedProduct.name} chính hãng phân phối bởi LYHU. Sản phẩm phù hợp để nhập sỉ số lượng lớn cho cửa hàng bán lẻ, siêu thị mini, hoặc đẩy mảng TikTok Shop/Shopee. Đầy đủ hình ảnh, video chất lượng cao hỗ trợ đăng bài mượt mà.`
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0">
                                {(() => {
                                    const qty = cart[selectedProduct.id]?.quantity || 0;
                                    const fsProd = flashSaleProducts.find(f => f.id === selectedProduct.id);
                                    const cartonSize = selectedProduct.items_per_carton || 0;
                                    return qty === 0 ? (
                                        <>
                                            <button 
                                                onClick={() => updateQuantity(selectedProduct, 1, fsProd?.flashSalePrice)} 
                                                className="h-12 flex-1 bg-primary-50 text-primary-600 border border-primary-500 rounded-sm font-medium hover:bg-primary-100 flex gap-2 items-center justify-center transition-colors"
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                                Thêm vào Giỏ
                                            </button>
                                            {cartonSize > 0 && (
                                                <button 
                                                    onClick={() => updateQuantity(selectedProduct, cartonSize, fsProd?.flashSalePrice)} 
                                                    className="h-12 flex-1 bg-primary-600 text-white rounded-sm font-medium hover:bg-primary-700 flex gap-2 items-center justify-center transition-colors shadow-sm"
                                                >
                                                    + Mua 1 Thùng
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center border border-primary-500 rounded-sm h-12 w-32 text-primary-600 bg-white shrink-0">
                                                <button onClick={() => updateQuantity(selectedProduct, -1)} className="w-10 h-full flex items-center justify-center hover:bg-primary-50 active:bg-primary-100 transition-colors"><Minus className="w-5 h-5" /></button>
                                                <span className="font-bold text-lg text-gray-800 border-x border-gray-200 flex-1 text-center h-full flex items-center justify-center bg-gray-50">{qty}</span>
                                                <button onClick={() => updateQuantity(selectedProduct, 1)} className="w-10 h-full flex items-center justify-center hover:bg-primary-50 active:bg-primary-100 transition-colors"><Plus className="w-5 h-5" /></button>
                                            </div>
                                            {cartonSize > 0 && (
                                                <button 
                                                    onClick={() => updateQuantity(selectedProduct, cartonSize, fsProd?.flashSalePrice)} 
                                                    className="h-12 flex-1 bg-primary-50 border border-primary-500 text-primary-700 rounded-sm font-medium hover:bg-primary-100 flex gap-2 items-center justify-center transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" /> 1 Thùng ({cartonSize})
                                                </button>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* V4: Order History Sliding Drawer */}
            {isHistoryOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsHistoryOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary-500 text-white">
                            <h2 className="text-lg font-bold">Lịch Sử Mua Sỉ</h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="hover:bg-primary-600 p-1 rounded-full text-white"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
                            {pastOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <History className="w-16 h-16 opacity-30 mb-4" />
                                    <p className="text-sm">Bạn chưa có đơn sỉ nào.</p>
                                </div>
                            ) : (
                                pastOrders.map(order => (
                                    <div key={order.id} className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                                        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                            <div>
                                                <p className="text-xs text-gray-500">Mã đơn: <span className="font-mono text-gray-800">{order.id.slice(0,8)}</span></p>
                                                <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN')}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded-sm ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {order.order_items?.slice(0,2).map((item: any, idx: number) => {
                                                const product = initialProducts.find(p => p.id === item.product_id);
                                                return (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-700 truncate max-w-[200px]">{product?.name || 'Sản phẩm không xác định'}</span>
                                                        <span className="text-gray-500 text-xs">x{item.quantity}</span>
                                                    </div>
                                                )
                                            })}
                                            {(order.order_items?.length || 0) > 2 && (
                                                <p className="text-xs text-gray-400 italic">...và {(order.order_items?.length || 0) - 2} mặt hàng khác</p>
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-gray-100 flex justify-between items-center">
                                            <span className="font-bold text-primary-600">₫{new Intl.NumberFormat('vi-VN').format(order.total_amount)}</span>
                                            <button 
                                                onClick={() => handleReorder(order)} 
                                                className="bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100 px-4 py-1.5 rounded-sm text-sm font-medium transition-colors"
                                            >
                                                Mua lại đơn này
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
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
                                <div className="flex flex-col gap-4">
                                    {cartAnalysis.items.map(item => {
                                        const price = item.flashSalePrice ?? item.product.basePricePerUnit ?? 0;
                                        return (
                                            <div key={item.product.id} className="flex gap-3 relative border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                                <button 
                                                    onClick={() => updateQuantity(item.product, -item.quantity)} 
                                                    className="absolute top-0 right-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </button>
                                                <img src={item.product.image_url || ''} className="w-16 h-16 border border-gray-200 object-cover rounded-sm bg-gray-50 flex-shrink-0" />
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <p className="text-sm text-gray-800 break-words mb-1" title={item.product.name}>{item.product.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono mb-2">SKU: {item.product.sku}</p>
                                                    <div className="flex justify-between items-center bg-gray-50/50 p-1.5 rounded-sm">
                                                        <span className="text-sm font-bold text-primary-600">₫{new Intl.NumberFormat('vi-VN').format(price)}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex items-center border border-gray-200 rounded-sm bg-white overflow-hidden shadow-sm">
                                                                <button 
                                                                    onClick={() => updateQuantity(item.product, -1)} 
                                                                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center justify-center"
                                                                ><Minus className="w-3 h-3"/></button>
                                                                <span className="text-xs font-bold px-3 py-1 select-none border-x border-gray-100 text-center min-w-[30px]">{item.quantity}</span>
                                                                <button 
                                                                    onClick={() => updateQuantity(item.product, 1)} 
                                                                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors flex items-center justify-center"
                                                                ><Plus className="w-3 h-3"/></button>
                                                            </div>
                                                            {(item.product.items_per_carton || 0) > 0 && (
                                                                <button 
                                                                    onClick={() => updateQuantity(item.product, item.product.items_per_carton!)} 
                                                                    title={`Thêm 1 Thùng (${item.product.items_per_carton})`}
                                                                    className="px-2 py-1 text-white bg-primary-600 border border-primary-600 hover:bg-primary-700 transition-colors rounded-sm flex items-center justify-center shadow-sm"
                                                                >
                                                                    <Package className="w-3 h-3"/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Form Thông tin khách hàng */}
                            <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-4 mb-4">
                                <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Thông tin giao hàng</h3>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Họ tên người nhận <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            className="w-full border border-gray-200 rounded-sm p-2.5 text-sm focus:outline-primary-500 bg-gray-50" 
                                            placeholder="Nhập họ tên..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input 
                                            type="tel"
                                            value={customerPhone}
                                            onChange={e => setCustomerPhone(e.target.value)}
                                            className="w-full border border-gray-200 rounded-sm p-2.5 text-sm focus:outline-primary-500 bg-gray-50" 
                                            placeholder="VD: 0901234567"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
                                        <textarea 
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            rows={2} 
                                            className="w-full border border-gray-200 rounded-sm p-2.5 text-sm focus:outline-primary-500 bg-gray-50" 
                                            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
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
                                disabled={isSubmitting || cartAnalysis.items.length === 0 || customerName.trim() === '' || customerPhone.trim() === '' || address.trim() === ''}
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

            {/* B2B Support Chat Widget */}
            <B2BSupportChat user={wholesaleUser} />
        </div>
    );
}

