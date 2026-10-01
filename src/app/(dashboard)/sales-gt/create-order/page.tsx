"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/mocks/data";
import { loadProducts } from "@/lib/supabase/products";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Store, Gift, Search, Filter, ArrowUpDown, Eye, EyeOff, Package, Loader2, FileText, Building, Clock, AlertCircle, Calendar } from "lucide-react";
import { addOrderSupabase } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabaseClient";
import { getInventoryLevel, getDefaultWarehouseId } from "@/lib/inventoryStore";
import Link from "next/link";

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

interface Outlet {
    id: string;
    name: string;
    address: string;
    district: string;
    outlet_type: string;
}

interface OrderItem {
    product: Product;
    quantity: number;
    discount: number;
    discountType: 'amount' | 'percent';
    discountValue: number;
    isGift: boolean;
    price: number;
    isPreOrder?: boolean;
}

export default function GTCreateOrderPage() {
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const preselectedOutlet = searchParams.get("outlet");
    const { user, session } = useAuth();

    // Data
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Flow
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [orderNote, setOrderNote] = useState("");
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [vatRate, setVatRate] = useState<number>(0);
    const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>("COD");
    const [outletSearch, setOutletSearch] = useState("");

    // Product filters
    const [productSearch, setProductSearch] = useState("");
    const [brandFilter, setBrandFilter] = useState("ALL");
    const [hideOutOfStock, setHideOutOfStock] = useState(false);
    const [sortBy, setSortBy] = useState("name-asc");
    const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !session?.access_token) return;
            setIsLoading(true);
            try {
                const [prods, warehouseId] = await Promise.all([
                    loadProducts(session.access_token),
                    getDefaultWarehouseId(session.access_token)
                ]);
                setProducts(prods);

                // Fetch outlets
                const { data: outletData } = await supabase
                    .from('gt_outlets')
                    .select('id, name, address, district, outlet_type')
                    .eq('assigned_to', user.id)
                    .eq('status', 'active')
                    .order('name');
                setOutlets(outletData || []);

                if (preselectedOutlet && outletData) {
                    const found = outletData.find((o: any) => o.id === preselectedOutlet);
                    if (found) {
                        setSelectedOutlet(found);
                        setCurrentStep(2);
                    }
                }

                // Fetch inventory
                if (warehouseId) {
                    const invMap: Record<string, number> = {};
                    await Promise.all(prods.map(async (p) => {
                        const level = await getInventoryLevel(p.id, warehouseId, session.access_token);
                        invMap[p.id] = level?.quantity_available ?? 0;
                    }));
                    setInventory(invMap);
                }
            } catch (err) {
                console.error("Error loading GT order data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        if (session?.access_token) fetchData();
    }, [user, session?.access_token, preselectedOutlet]);

    // Derived
    const filteredOutlets = outlets.filter(o => {
        const term = outletSearch.toLowerCase();
        return o.name.toLowerCase().includes(term) ||
            (o.district && o.district.toLowerCase().includes(term)) ||
            (o.address && o.address.toLowerCase().includes(term));
    });
    const availableBrands = Array.from(new Set(products.map(p => p.brand || "LHU"))).sort();
    const filteredProducts = products
        .filter(p => {
            const term = productSearch.toLowerCase();
            const matchesSearch = p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
            const matchesBrand = brandFilter === "ALL" || (p.brand || "LHU") === brandFilter;
            const matchesStock = !hideOutOfStock || (inventory[p.id] ?? 0) > 0;
            return matchesSearch && matchesBrand && matchesStock;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc": return a.name.localeCompare(b.name);
                case "name-desc": return b.name.localeCompare(a.name);
                case "price-asc": return (a.wholesalePrice || 0) - (b.wholesalePrice || 0);
                case "price-desc": return (b.wholesalePrice || 0) - (a.wholesalePrice || 0);
                case "stock-desc": return (inventory[b.id] ?? 0) - (inventory[a.id] ?? 0);
                default: return 0;
            }
        });

    // Handlers
    const handleAddProduct = (product: Product, qty: number = 1) => {
        const existingIdx = orderItems.findIndex(item => item.product.id === product.id && !item.isGift);
        const currentQty = orderItems.reduce((sum, item) => item.product.id === product.id ? sum + item.quantity : sum, 0);
        const available = inventory[product.id] ?? 0;
        const targetTotalQty = currentQty + qty;

        if (existingIdx !== -1) {
            const newItems = [...orderItems];
            newItems[existingIdx] = { 
                ...newItems[existingIdx], 
                quantity: targetTotalQty,
                isPreOrder: targetTotalQty > available
            };
            setOrderItems(newItems);
        } else {
            setOrderItems(prev => [...prev, {
                product, 
                quantity: qty, 
                price: product.wholesalePrice || 0,
                discount: 0, 
                discountType: 'amount', 
                discountValue: 0, 
                isGift: false,
                isPreOrder: qty > available
            }]);
        }
        setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
    };

    const handleUpdateQuantity = (index: number, delta: number) => {
        setOrderItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const newQty = Math.max(1, item.quantity + delta);
            const available = inventory[item.product.id] ?? 0;
            newItems[index] = { 
                ...item, 
                quantity: newQty,
                isPreOrder: newQty > available
            };
            return newItems;
        });
    };

    const handleRemoveItem = (index: number) => setOrderItems(prev => prev.filter((_, i) => i !== index));

    const handleSetQuantity = (index: number, value: number) => {
        setOrderItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const newQty = Math.max(1, value);
            const available = inventory[item.product.id] ?? 0;
            newItems[index] = { 
                ...item, 
                quantity: newQty,
                isPreOrder: newQty > available
            };
            return newItems;
        });
    };

    const handleUpdateDiscount = (index: number, value: number, type: 'amount' | 'percent') => {
        setOrderItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const subtotal = item.price * item.quantity;
            let newDiscount = type === 'amount' ? value : subtotal * (value / 100);
            newItems[index] = { ...item, discount: newDiscount, discountType: type, discountValue: value };
            return newItems;
        });
    };

    const handleUpdatePrice = (index: number, price: number) => {
        setOrderItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], price };
            return newItems;
        });
    };

    const handleToggleGift = (index: number) => {
        setOrderItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            if (!item.isGift) {
                newItems.splice(index + 1, 0, { ...item, isGift: true, quantity: 1, discount: 0, discountValue: 0 });
            } else {
                newItems.splice(index, 1);
            }
            return newItems;
        });
    };

    const calcItemSubtotal = (item: OrderItem) => item.isGift ? 0 : Math.max(0, (item.price * item.quantity) - item.discount);
    const totalListPrice = orderItems.reduce((sum, item) => item.isGift ? sum : sum + (item.price * item.quantity), 0);
    const totalItemDiscount = orderItems.reduce((sum, item) => item.isGift ? sum : sum + item.discount, 0);
    const itemsSubtotal = orderItems.reduce((sum, item) => sum + calcItemSubtotal(item), 0);
    const orderDiscountAmount = itemsSubtotal * (orderDiscountPercent / 100);
    const afterAllDiscounts = itemsSubtotal - orderDiscountAmount;
    const totalVAT = afterAllDiscounts * (vatRate / 100);
    const finalTotal = afterAllDiscounts + totalVAT;
    const totalAllDiscounts = totalItemDiscount + orderDiscountAmount;
    const discountPercent = totalListPrice > 0 ? (totalAllDiscounts / totalListPrice) * 100 : 0;

    const handleSubmit = async () => {
        if (!selectedOutlet || orderItems.length === 0) return;
        setSubmitting(true);

        const preOrderItems = orderItems.filter(i => i.isPreOrder || i.quantity > (inventory[i.product.id] ?? 0));
        let combinedNoteParts: string[] = [];
        if (expectedDeliveryDate) {
            const dateStr = new Date(expectedDeliveryDate).toLocaleDateString("vi-VN");
            combinedNoteParts.push(`[Hẹn giao: ${dateStr}]`);
        }
        if (preOrderItems.length > 0) {
            combinedNoteParts.push(`[Có ${preOrderItems.length} mã đặt trước/chờ kho]`);
        }
        if (orderNote.trim()) {
            combinedNoteParts.push(orderNote.trim());
        } else {
            combinedNoteParts.push(`Đơn GT - ${selectedOutlet.name}`);
        }
        const finalNote = combinedNoteParts.join(" ");

        const res = await addOrderSupabase({
            customerId: null,
            customerName: selectedOutlet.name,
            source: "SALES_GT",
            telesalesUserId: user?.id,
            creatorName: user?.full_name || user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
            outlet_id: selectedOutlet.id,
            items: orderItems.map(item => ({
                sku: item.product.sku || "N/A",
                name: item.product.name,
                brand: item.product.brand || "LHU",
                quantity: item.quantity,
                unit: item.product.unit || "Cái",
                unitPrice: item.price,
                subtotal: calcItemSubtotal(item),
                productId: item.product.id,
                discount: item.discount,
                discountType: item.discountType,
                isGift: item.isGift
            })),
            totalAmount: finalTotal,
            status: "pending",
            notes: finalNote,
            vat: totalVAT,
            vat_rate: vatRate,
            order_discount_percent: orderDiscountPercent,
            paymentMethod: paymentMethod
        }, session?.access_token);

        if (res?.success) {
            // Mark checkin as ordered
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            await supabase.from('gt_checkins').update({ order_created: true })
                .eq('user_id', user?.id).eq('outlet_id', selectedOutlet.id)
                .gte('check_in_at', todayStart.toISOString());

            setCurrentStep(3);
        } else {
            alert(`❌ Tạo đơn thất bại: ${res?.error || "Lỗi không xác định"}`);
        }
        setSubmitting(false);
    };

    const handleReset = () => {
        setSelectedOutlet(null);
        setOrderItems([]);
        setOrderNote("");
        setExpectedDeliveryDate("");
        setVatRate(0);
        setOrderDiscountPercent(0);
        setPaymentMethod("COD");
        setCurrentStep(1);
    };

    if (isLoading) return <div className="p-6 text-slate-500">Đang tải dữ liệu...</div>;

    // STEP 3: Success
    if (currentStep === 3) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#00AFA9]/10 text-[#00AFA9] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Đơn hàng đã được tạo thành công!</h2>
                <p className="text-sm text-slate-500 mt-2">
                    {selectedOutlet?.name} • {orderItems.length} sản phẩm • <span className="font-bold text-[#00AFA9]">{formatPrice(finalTotal)}</span>
                </p>
                <div className="flex gap-3 justify-center mt-6">
                    <button onClick={handleReset} className="px-5 py-2.5 text-sm font-semibold bg-[#00AFA9] text-white rounded-xl hover:bg-[#009690] transition-colors">
                        Tạo đơn mới
                    </button>
                    <Link href="/sales-gt" className="px-5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors">
                        Về GT Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const brandColors: Record<string, string> = {
        ABI: "bg-[#00AFA9] text-white",
        BOYO: "bg-[#8EC63F] text-slate-900",
        CVT: "bg-slate-700 text-white",
        "ROLL N' ROLL": "bg-rose-600 text-white",
        LHU: "bg-[#00AFA9] text-white",
        LYHU: "bg-[#00AFA9] text-white",
        UHi: "bg-amber-600 text-white"
    };

    return (
        <div className="space-y-5 pb-20 lg:pb-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-[#00AFA9]" />
                    Tạo đơn hàng GT
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Tạo đơn sỉ trực tiếp cho điểm bán tuyến bán hàng</p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {[
                        { step: 1, label: "Chọn điểm bán" },
                        { step: 2, label: "Chọn sản phẩm & Giỏ" }
                    ].map(({ step, label }, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3">
                            {i > 0 && <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />}
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                                currentStep > step
                                    ? "bg-[#00AFA9] text-white"
                                    : currentStep === step
                                        ? "bg-[#00AFA9] text-white shadow-sm"
                                        : "bg-slate-100 text-slate-400"
                            }`}>
                                {currentStep > step ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                            </div>
                            <p className={`text-xs sm:text-sm font-semibold ${currentStep === step ? "text-slate-900" : "text-slate-400"}`}>
                                {label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Select Outlet */}
            {currentStep === 1 && (
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">Chọn điểm bán</h3>
                            <p className="text-xs text-slate-500">Danh sách các điểm bán được phân công trên tuyến</p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên, địa chỉ, quận..."
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#00AFA9] transition-colors"
                                value={outletSearch}
                                onChange={(e) => setOutletSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredOutlets.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">Không tìm thấy điểm bán phù hợp</p>
                            {outletSearch && (
                                <button onClick={() => setOutletSearch("")} className="text-xs text-[#00AFA9] font-semibold mt-1">
                                    Xóa tìm kiếm
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredOutlets.map(outlet => (
                                <button
                                    key={outlet.id}
                                    onClick={() => { setSelectedOutlet(outlet); setCurrentStep(2); }}
                                    className="p-3.5 sm:p-4 border border-slate-200 rounded-xl hover:border-[#00AFA9] hover:bg-[#00AFA9]/5 transition-all text-left group bg-white"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-slate-100 group-hover:bg-[#00AFA9]/10 rounded-xl transition-colors shrink-0">
                                            <Store className="w-5 h-5 text-slate-600 group-hover:text-[#00AFA9]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-[#00AFA9] transition-colors">
                                                    {outlet.name}
                                                </h4>
                                                {outlet.outlet_type && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                                        {outlet.outlet_type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">{outlet.address}</p>
                                            {outlet.district && (
                                                <span className="inline-block text-[11px] font-medium text-[#00AFA9] mt-1">
                                                    📍 {outlet.district}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Product Catalog + Cart */}
            {currentStep === 2 && selectedOutlet && (
                <>
                    {/* Selected Outlet Info */}
                    <div className="bg-[#00AFA9]/5 border border-[#00AFA9]/20 p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#00AFA9] uppercase tracking-wider">Điểm bán đang tạo đơn</p>
                            <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{selectedOutlet.name}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{selectedOutlet.district} • {selectedOutlet.address}</p>
                        </div>
                        <button onClick={handleReset} className="px-3 py-1.5 bg-white text-[#00AFA9] border border-[#00AFA9]/30 rounded-xl text-xs font-semibold hover:bg-[#00AFA9]/10 transition-colors shrink-0">
                            Đổi điểm bán
                        </button>
                    </div>

                    {/* Split Panel */}
                    <div className="flex flex-col lg:flex-row gap-5">
                        {/* LEFT: Product Catalog */}
                        <div className="flex-[3] min-w-0">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Header */}
                                <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-3">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-[#00AFA9]" />
                                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Danh mục sản phẩm</h3>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {filteredProducts.length}/{products.length} SP
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Tìm tên hoặc SKU..."
                                                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#00AFA9] transition-colors"
                                                value={productSearch}
                                                onChange={e => setProductSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Horizontal Swipeable Filter Bar */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                                <button onClick={() => setBrandFilter("ALL")}
                                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${brandFilter === "ALL" ? "bg-[#00AFA9] text-white" : "text-slate-600 hover:bg-white"}`}
                                                >Tất cả</button>
                                                {availableBrands.map(brand => (
                                                    <button key={brand} onClick={() => setBrandFilter(brand)}
                                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${brandFilter === brand ? "bg-[#00AFA9] text-white" : "text-slate-600 hover:bg-white"}`}
                                                    >{brand}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-px h-5 bg-slate-200 shrink-0" />
                                        <button onClick={() => setHideOutOfStock(!hideOutOfStock)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors shrink-0 ${hideOutOfStock ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            {hideOutOfStock ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {hideOutOfStock ? "Chỉ còn hàng" : "Ẩn hết hàng"}
                                        </button>
                                        <div className="w-px h-5 bg-slate-200 shrink-0" />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-[#00AFA9] cursor-pointer"
                                            >
                                                <option value="name-asc">Tên A→Z</option>
                                                <option value="name-desc">Tên Z→A</option>
                                                <option value="price-asc">Giá thấp→cao</option>
                                                <option value="price-desc">Giá cao→thấp</option>
                                                <option value="stock-desc">Kho nhiều→ít</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Dual View Product List */}
                                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                                    {/* Desktop Table View */}
                                    <div className="hidden lg:block">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 sticky top-0 z-10">
                                                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    <th className="px-4 py-3">Sản phẩm</th>
                                                    <th className="px-3 py-3 text-right whitespace-nowrap">Giá sỉ</th>
                                                    <th className="px-3 py-3 text-center">Kho</th>
                                                    <th className="px-3 py-3 text-center">Số lượng</th>
                                                    <th className="px-3 py-3 text-center w-28"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredProducts.map(product => {
                                                    const inOrder = orderItems.reduce((s, i) => i.product.id === product.id ? s + i.quantity : s, 0);
                                                    const stock = inventory[product.id] ?? 0;
                                                    const isOutOfStock = stock <= 0;
                                                    const qty = productQuantities[product.id] || 1;
                                                    const bc = brandColors[product.brand || "LHU"] || "bg-slate-500";

                                                    return (
                                                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`${bc} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                                                                        {(product.brand || "LHU").slice(0, 3)}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-medium text-slate-800 text-xs">{product.name}</p>
                                                                        <p className="text-[10px] text-slate-400">SKU: {product.sku}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right text-xs font-medium text-slate-700">
                                                                {formatPrice(product.wholesalePrice || 0)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                    {isOutOfStock ? "Hết" : stock}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => setProductQuantities(prev => ({ ...prev, [product.id]: Math.max(1, qty - 1) }))}
                                                                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                                                                    ><Minus className="w-3 h-3" /></button>
                                                                    <input type="number" min={1} value={qty}
                                                                        onChange={e => setProductQuantities(prev => ({ ...prev, [product.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                                                        className="w-12 text-center text-xs border border-slate-200 rounded py-1"
                                                                    />
                                                                    <button onClick={() => setProductQuantities(prev => ({ ...prev, [product.id]: qty + 1 }))}
                                                                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                                                                    ><Plus className="w-3 h-3" /></button>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <button
                                                                    onClick={() => handleAddProduct(product, qty)}
                                                                    className={`text-xs font-semibold flex items-center gap-1 mx-auto px-2 py-1 rounded transition-colors ${
                                                                        isOutOfStock 
                                                                            ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200" 
                                                                            : "text-[#00AFA9] hover:text-[#009b95] hover:bg-teal-50"
                                                                    }`}
                                                                    title={isOutOfStock ? "Sản phẩm tạm hết kho - Đặt trước" : "Thêm vào giỏ"}
                                                                >
                                                                    {isOutOfStock ? <Clock className="w-3.5 h-3.5 text-amber-600" /> : <Plus className="w-3.5 h-3.5" />}
                                                                    {isOutOfStock ? "Đặt trước" : "Thêm"}
                                                                </button>
                                                                {inOrder > 0 && (
                                                                    <span className="text-[10px] text-[#00AFA9] font-medium block mt-0.5">Đã thêm: {inOrder}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="lg:hidden divide-y divide-slate-100">
                                        {filteredProducts.map(product => {
                                            const inOrder = orderItems.reduce((s, i) => i.product.id === product.id ? s + i.quantity : s, 0);
                                            const stock = inventory[product.id] ?? 0;
                                            const isOutOfStock = stock <= 0;
                                            const qty = productQuantities[product.id] || 1;
                                            const bc = brandColors[product.brand || "LHU"] || "bg-slate-500 text-white";

                                            return (
                                                <div key={product.id} className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                                            <span className={`${bc} text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0`}>
                                                                {(product.brand || "LHU").slice(0, 3)}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-800 text-sm line-clamp-1">{product.name}</p>
                                                                <p className="text-[11px] text-slate-400">SKU: {product.sku}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="font-bold text-[#00AFA9] text-sm">{formatPrice(product.wholesalePrice || 0)}</p>
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${isOutOfStock ? 'bg-red-100 text-red-600' : stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {isOutOfStock ? "Hết hàng" : `Kho: ${stock}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-1.5">
                                                            <button onClick={() => setProductQuantities(prev => ({ ...prev, [product.id]: Math.max(1, qty - 1) }))}
                                                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                                                            ><Minus className="w-3.5 h-3.5" /></button>
                                                            <input type="number" min={1} value={qty}
                                                                onChange={e => setProductQuantities(prev => ({ ...prev, [product.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                                                className="w-12 text-center text-xs font-semibold border border-slate-200 rounded-lg py-1 focus:border-[#00AFA9] outline-none"
                                                            />
                                                            <button onClick={() => setProductQuantities(prev => ({ ...prev, [product.id]: qty + 1 }))}
                                                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                                                            ><Plus className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {inOrder > 0 && (
                                                                <span className="text-[11px] text-[#00AFA9] font-semibold">Đã thêm: {inOrder}</span>
                                                            )}
                                                            <button
                                                                onClick={() => handleAddProduct(product, qty)}
                                                                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors ${
                                                                    isOutOfStock
                                                                        ? "bg-amber-600 text-white hover:bg-amber-700"
                                                                        : "bg-[#00AFA9] text-white hover:bg-[#009b95]"
                                                                }`}
                                                                title={isOutOfStock ? "Sản phẩm tạm hết kho - Đặt trước" : "Thêm vào giỏ"}
                                                            >
                                                                {isOutOfStock ? <Clock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                                {isOutOfStock ? "Đặt trước" : "Thêm"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Cart */}
                        <div id="order-cart-panel" className="flex-[2] min-w-[320px]">
                            <div className="bg-white rounded-xl border border-slate-200 sticky top-4">
                                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5 text-[#00AFA9]" />
                                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">Đơn hàng GT</h3>
                                    </div>
                                    {orderItems.length > 0 && (
                                        <span className="text-xs bg-[#00AFA9]/10 text-[#00AFA9] px-2.5 py-0.5 rounded-full font-bold">
                                            {orderItems.filter(i => !i.isGift).length} sản phẩm
                                        </span>
                                    )}
                                </div>

                                <div className="p-3.5 sm:p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                                    {orderItems.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-medium">Chưa có sản phẩm nào</p>
                                            <p className="text-xs text-slate-400 mt-1">Chọn từ danh mục sản phẩm bên cạnh</p>
                                        </div>
                                    ) : (
                                        orderItems.map((item, idx) => (
                                            <div key={idx} className={`p-3 rounded-xl border border-slate-100 transition-colors ${item.isGift ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white'}`}>
                                                {/* Item header: name + subtotal + delete */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {item.isGift && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase rounded">Tặng</span>}
                                                            <h4 className="font-semibold text-slate-900 text-xs truncate">{item.product.name}</h4>
                                                            {(item.isPreOrder || item.quantity > (inventory[item.product.id] ?? 0)) && (
                                                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold rounded shrink-0" title={`Tồn kho: ${inventory[item.product.id] ?? 0}`}>
                                                                    Đặt trước (Kho: {inventory[item.product.id] ?? 0})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`text-xs sm:text-sm font-bold ${item.isGift ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                            {formatPrice(calcItemSubtotal(item))}
                                                        </span>
                                                        <button onClick={() => handleRemoveItem(idx)}
                                                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        ><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>

                                                {/* Controls row: qty, price, gift, discount */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Quantity */}
                                                    <div className="flex items-center bg-slate-100 rounded-lg">
                                                        <button onClick={() => handleUpdateQuantity(idx, -1)} disabled={item.quantity <= 1}
                                                            className="p-1 hover:bg-white rounded-l-lg transition-colors disabled:opacity-40"
                                                        ><Minus className="w-3 h-3" /></button>
                                                        <input type="number" className="w-14 text-center text-xs font-bold bg-white border-x border-slate-200 py-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            value={item.quantity} onChange={(e) => handleSetQuantity(idx, parseInt(e.target.value) || 1)} min={1}
                                                        />
                                                        <button onClick={() => handleUpdateQuantity(idx, 1)}
                                                            className="p-1 hover:bg-white rounded-r-lg transition-colors"
                                                        ><Plus className="w-3 h-3" /></button>
                                                    </div>

                                                    {/* Price edit */}
                                                    {!item.isGift && (
                                                        <div className="relative">
                                                            <input type="number"
                                                                className="w-20 pl-1.5 pr-3 py-1 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:border-[#00AFA9] text-right"
                                                                value={item.price} onChange={(e) => handleUpdatePrice(idx, Number(e.target.value))}
                                                            />
                                                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">đ</span>
                                                        </div>
                                                    )}

                                                    {/* Gift toggle */}
                                                    <label className="flex items-center gap-1 cursor-pointer text-[11px] font-medium text-slate-500 select-none ml-auto">
                                                        <input type="checkbox" checked={item.isGift} onChange={() => handleToggleGift(idx)}
                                                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#00AFA9] focus:ring-[#00AFA9]"
                                                        />
                                                        <Gift className="w-3 h-3 text-[#00AFA9]" />
                                                    </label>

                                                    {/* Discount */}
                                                    {!item.isGift && (
                                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                                            <input type="number" placeholder="CK"
                                                                className="w-12 pl-1.5 pr-0.5 py-1 text-[11px] outline-none text-right font-medium"
                                                                value={item.discountValue || ""}
                                                                onChange={(e) => handleUpdateDiscount(idx, Number(e.target.value), item.discountType)}
                                                                min={0}
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateDiscount(idx, item.discountValue, item.discountType === 'amount' ? 'percent' : 'amount')}
                                                                className="px-1.5 py-1 bg-slate-50 border-l border-slate-200 text-[9px] text-slate-600 font-bold hover:bg-[#00AFA9]/10 hover:text-[#00AFA9] transition-colors"
                                                            >{item.discountType === 'amount' ? 'đ' : '%'}</button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Discount info */}
                                                {item.discount > 0 && !item.isGift && (
                                                    <p className="text-[10px] text-rose-600 font-medium mt-1 text-right">CK: -{formatPrice(item.discount)}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Cart Footer: Note, Payment, Summary, Actions */}
                                {orderItems.length > 0 && (
                                    <div className="border-t border-slate-200 p-3.5 sm:p-4 space-y-3">
                                        {/* Pre-order Notice if any item has quantity > stock */}
                                        {orderItems.some(i => i.isPreOrder || i.quantity > (inventory[i.product.id] ?? 0)) && (
                                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-amber-800">Đơn có sản phẩm đặt trước (kho tạm hết)</p>
                                                    <p className="text-[11px] text-amber-700 leading-relaxed">
                                                        Kế toán vẫn đẩy MISA bình thường. Doanh số sale chỉ ghi nhận khi giao thành công.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Expected Delivery Date */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5 text-[#00AFA9]" /> Hẹn ngày giao hàng (Dự kiến)
                                                </label>
                                                {expectedDeliveryDate && (
                                                    <button 
                                                        onClick={() => setExpectedDeliveryDate("")}
                                                        className="text-[10px] text-slate-400 hover:text-red-500"
                                                    >
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="date"
                                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#00AFA9] text-slate-700"
                                                value={expectedDeliveryDate}
                                                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                                                {[2, 3, 5, 7].map(days => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + days);
                                                    const yyyy = d.getFullYear();
                                                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                    const dd = String(d.getDate()).padStart(2, '0');
                                                    const val = `${yyyy}-${mm}-${dd}`;
                                                    return (
                                                        <button
                                                            key={days}
                                                            type="button"
                                                            onClick={() => setExpectedDeliveryDate(val)}
                                                            className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${expectedDeliveryDate === val
                                                                ? "bg-[#00AFA9] text-white border-[#00AFA9]"
                                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                                }`}
                                                        >
                                                            +{days} ngày
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Note */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" /> Ghi chú đơn
                                            </label>
                                            <textarea
                                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#00AFA9] min-h-[40px] resize-none"
                                                placeholder="Ghi chú giao hàng, xuất hóa đơn..."
                                                value={orderNote}
                                                onChange={(e) => setOrderNote(e.target.value)}
                                            />
                                        </div>

                                        {/* Payment Method */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                                                <Building className="w-3.5 h-3.5 text-slate-400" /> Thanh toán
                                            </label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {[
                                                    { id: 'COD', label: 'COD' },
                                                    { id: 'BANKING', label: 'Chuyển khoản' },
                                                    { id: 'DEBT', label: 'Công nợ' }
                                                ].map((method) => (
                                                    <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                                                        className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-colors font-medium ${paymentMethod === method.id
                                                            ? 'bg-[#00AFA9]/10 border-[#00AFA9] text-[#00AFA9] font-bold'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                    >{method.label}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span>Tiền hàng:</span>
                                                <span className="font-semibold text-slate-800">{formatPrice(totalListPrice)}</span>
                                            </div>
                                            {totalItemDiscount > 0 && (
                                                <div className="flex items-center justify-between text-slate-600">
                                                    <span>CK dòng:</span>
                                                    <span className="text-rose-600 font-semibold">-{formatPrice(totalItemDiscount)}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <span>CK đơn:</span>
                                                    <input type="number" className="w-10 px-1 py-0.5 text-center border border-slate-300 rounded focus:border-[#00AFA9] text-[11px]"
                                                        placeholder="0" min={0} max={100} value={orderDiscountPercent || ""}
                                                        onChange={(e) => setOrderDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                    />
                                                    <span className="text-slate-400">%</span>
                                                </div>
                                                <span className="text-rose-600 font-semibold">-{formatPrice(orderDiscountAmount)}</span>
                                            </div>
                                            {totalAllDiscounts > 0 && (
                                                <div className="flex items-center justify-between text-slate-500">
                                                    <span>Tổng CK:</span>
                                                    <div>
                                                        <span className="text-rose-600 mr-1 font-semibold">-{formatPrice(totalAllDiscounts)}</span>
                                                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{discountPercent.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="border-t border-slate-200 my-1"></div>
                                            <div className="flex items-center justify-between text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <span>VAT:</span>
                                                    <input type="number" className="w-10 px-1 py-0.5 text-center border border-slate-300 rounded focus:border-[#00AFA9] text-[11px]"
                                                        placeholder="0" min={0} max={100} value={vatRate || ""}
                                                        onChange={(e) => setVatRate(Number(e.target.value))}
                                                    />
                                                    <span className="text-slate-400">%</span>
                                                </div>
                                                <span className="font-semibold text-slate-800">+{formatPrice(totalVAT)}</span>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                                            <span className="text-xl font-bold text-[#00AFA9]">{formatPrice(finalTotal)}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={handleReset}
                                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm transition-colors"
                                            >Hủy</button>
                                            <button onClick={handleSubmit} disabled={submitting}
                                                className="flex-[2] px-4 py-2.5 bg-[#00AFA9] hover:bg-[#009690] text-white rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo đơn...</>
                                                ) : (
                                                    <><ShoppingCart className="w-4 h-4" /> Xác nhận đặt hàng</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sticky Order Bar */}
                    {orderItems.length > 0 && (
                        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900 text-white rounded-2xl p-3 px-4 border border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Đã chọn <span className="font-bold text-white">{orderItems.filter(i => !i.isGift).length} SP</span>
                                </p>
                                <p className="text-base font-bold text-[#8EC63F]">{formatPrice(finalTotal)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    const cartEl = document.getElementById('order-cart-panel');
                                    if (cartEl) cartEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-4 py-2 bg-[#00AFA9] hover:bg-[#009690] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Xem đơn & Chốt
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
