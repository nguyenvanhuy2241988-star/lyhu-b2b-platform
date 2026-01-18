"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/mocks/data";
import { fetchCustomers, Customer, fetchDealItems } from "@/lib/crmDealsStore";
import { loadProducts } from "@/lib/supabase/products";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, User, ArrowLeft, Building, Gift, Tag, FileText, Percent } from "lucide-react";
import { addOrderSupabase, updateOrderSupabase } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabaseClient";
import { reserveStock, getInventoryLevel, getDefaultWarehouseId } from "@/lib/inventoryStore";

const supabase = createClient();

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

interface OrderItem {
    product: Product;
    quantity: number;
    discount: number; // in VNĐ (Always the effective money amount)
    discountType: 'amount' | 'percent';
    discountValue: number; // The input value (e.g. 10 for 10% or 10000 for 10k)
    isGift: boolean;
    price: number; // Override price
}

function TelesalesCreateOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, session } = useAuth();

    // Get deal_id and customer_id from URL
    const dealIdFromUrl = searchParams.get('deal_id');
    const customerIdFromUrl = searchParams.get('customer_id');
    const editOrderId = searchParams.get('edit');

    // Data State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null);
    const [dealInfo, setDealInfo] = useState<{ id: string; title: string } | null>(null);




    useEffect(() => {
        const fetchData = async () => {
            if (!user || !session?.access_token) return;

            setIsLoading(true);
            try {
                const [custs, prods, warehouseId] = await Promise.all([
                    fetchCustomers(user?.id, session.access_token), // Fetch Customers filtered by User
                    loadProducts(session.access_token),
                    getDefaultWarehouseId(session.access_token)
                ]);

                if (custs) setCustomers(custs);
                if (prods) setProducts(prods);
                if (warehouseId) setCurrentWarehouseId(warehouseId);

                // Fetch Real-time Inventory
                if (warehouseId) {
                    const invMap: Record<string, number> = {};
                    await Promise.all(prods.map(async (p) => {
                        const level = await getInventoryLevel(p.id, warehouseId, session.access_token);
                        invMap[p.id] = level?.quantity_available ?? 0;
                    }));
                    setInventory(invMap);
                }

                // Auto-select customer if coming from CRM
                if (customerIdFromUrl && custs) {
                    const customer = custs.find(c => c.id === customerIdFromUrl);
                    if (customer) {
                        setSelectedCustomer(customer);
                        setCurrentStep(2);
                    }
                }

                if (dealIdFromUrl) {
                    // TODO: Refactor fetchDeal to Pure Fetch in crmDealsStore. 
                    // For now, if we use supabase client here it effectively might deadlock if Realtime is active elsewhere.
                    // But we used createClient defined in file.
                    // Ideally: const deal = await fetchDeal(dealIdFromUrl, session.access_token);
                    // But fetchDeal isn't updated to take token yet. 

                    // fetchDealItems IS updated to take token.
                    const items = await fetchDealItems(dealIdFromUrl, session.access_token);
                    if (items.length > 0) {
                        const mappedItems: OrderItem[] = [];
                        items.forEach(di => {
                            const prod = prods.find(p => p.id === di.product_id);
                            if (prod) {
                                mappedItems.push({
                                    product: prod,
                                    quantity: di.quantity,
                                    discount: 0,
                                    discountType: 'amount',
                                    discountValue: 0,
                                    isGift: false,
                                    price: prod.wholesalePrice || 0
                                });
                            }
                        });
                        if (mappedItems.length > 0) {
                            setOrderItems(mappedItems);
                        }
                    }

                    // Fetch deal title manually with fetch to be safe?
                    // const { data } = await supabase.from('crm_deals').select('id, title').eq('id', dealIdFromUrl).single();
                    // if (data) setDealInfo(data);
                }

                // Handle Edit Mode
                if (editOrderId) {
                    // Use RPC to bypass RLS permissions
                    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_orders_v2`, {
                        method: 'POST',
                        headers: {
                            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ p_id: editOrderId })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const order = data[0];
                            // Set Customer
                            const customerRes = await fetchCustomers(undefined, session.access_token);
                            const customer = customerRes.find(c => c.id === order.customer_id);
                            if (customer) {
                                setSelectedCustomer(customer);
                            }

                            // Set Items
                            // RPC returns items in 'items' field, ensuring structure matches
                            const mappedItems: OrderItem[] = (order.items || []).map((item: any) => ({
                                product: item.product,
                                quantity: item.quantity,
                                discount: item.discount,
                                discountType: item.discount_type,
                                discountValue: item.discount, // Assuming simple case for now
                                isGift: item.is_gift,
                                price: item.price
                            }));
                            setOrderItems(mappedItems);

                            // Set Other Info
                            setVatRate(((order.vat || 0) / (order.total_amount - (order.vat || 0))) * 100 || 0); // Approx
                            setOrderNote(order.note || "");
                            setPaymentMethod(order.payment_method || "COD");

                            setCurrentStep(3); // Jump to final step
                        }
                    } else {
                        console.error("Failed to fetch order for edit:", await res.text());
                    }
                }
            } catch (err) {
                console.error("Error loading create-order data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.access_token) {
            fetchData();
        }
    }, [customerIdFromUrl, dealIdFromUrl, user, session?.access_token]);

    // Step 1: Select customer
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Step 2 & 3: Add products and quantities
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [vatRate, setVatRate] = useState<number>(0); // Percentage
    const [orderNote, setOrderNote] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("COD");

    // UI state
    const [currentStep, setCurrentStep] = useState(1);

    const handleSelectCustomer = (customerId: string) => {
        const customer = customers.find((c) => c.id === customerId);
        setSelectedCustomer(customer || null);
        if (customer) {
            setCurrentStep(2);
        }
    };

    const handleAddProduct = (product: Product) => {
        // Smart Gift Logic:
        // Find if there is an existing item that is NOT a gift.
        // If found -> Increment.
        // If not found (even if there is a Gift item) -> Add new line.
        const existingItemIndex = orderItems.findIndex((item) => item.product.id === product.id && !item.isGift);

        if (existingItemIndex !== -1) {
            const existingItem = orderItems[existingItemIndex];
            const available = inventory[product.id] ?? 0;
            if (existingItem.quantity + 1 > available) {
                alert(`Chỉ còn ${available} sản phẩm trong kho!`);
                return;
            }

            const newItems = [...orderItems];
            newItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
            setOrderItems(newItems);
        } else {
            // Check inventory for new item
            const available = inventory[product.id] ?? 0;
            if (available <= 0) {
                alert(`Sản phẩm này đã hết hàng!`);
                return;
            }

            setOrderItems((prev) => [
                ...prev,
                {
                    product,
                    quantity: 1,
                    price: product.wholesalePrice || 0, // Initialize with default list price
                    discount: 0,
                    discountType: 'amount',
                    discountValue: 0,
                    isGift: false
                }
            ]);
        }
    };

    const handleUpdateQuantity = (index: number, delta: number) => {
        setOrderItems((prev) => {
            const newItems = [...prev];
            const item = newItems[index];
            const newQuantity = Math.max(1, item.quantity + delta);
            const available = inventory[item.product.id] ?? 0;

            // TODO: Total quantity check across multiple lines for same product?
            // For simplicity, just checking per line for now, but ideally should sum all lines.
            // Let's keep it simple as per request.

            if (newQuantity > available) {
                alert(`Kho chỉ còn ${available} sản phẩm!`);
                return prev;
            }

            newItems[index] = { ...item, quantity: newQuantity };
            return newItems;
        });
    };

    const handleRemoveItem = (index: number) => {
        setOrderItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpdateDiscount = (index: number, value: number, type: 'amount' | 'percent') => {
        setOrderItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const subtotal = item.price * item.quantity;

            let newDiscount = 0;
            if (type === 'amount') {
                newDiscount = value; // Direct money
            } else {
                newDiscount = subtotal * (value / 100); // Percentage
            }

            newItems[index] = {
                ...item,
                discount: newDiscount,
                discountType: type,
                discountValue: value
            };
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
            // If toggling ON, price effectively becomes irrelevant (it's 0 for subtotal), but we keep the stored price.
            // If toggling OFF, it resumes being a normal item.
            newItems[index] = { ...newItems[index], isGift: !newItems[index].isGift };
            return newItems;
        });
    };

    const calculateItemSubtotal = (item: OrderItem) => {
        if (item.isGift) return 0;
        // Use edited price
        const sub = (item.price * item.quantity) - item.discount;
        return sub > 0 ? sub : 0;
    };

    const calculateTotal = () => {
        const subtotal = orderItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
        const vatAmount = subtotal * (vatRate / 100);
        return subtotal + vatAmount;
    };

    const calculateTotalListPrice = () => {
        return orderItems.reduce((sum, item) => {
            if (item.isGift) return sum;
            return sum + (item.price * item.quantity);
        }, 0);
    };

    const calculateTotalDiscount = () => {
        return orderItems.reduce((sum, item) => {
            if (item.isGift) return sum;
            return sum + item.discount;
        }, 0);
    };

    const handleCreateOrder = async () => {
        if (!selectedCustomer) return;

        const userId = user?.id;
        if (!userId) {
            alert("❌ Không xác định được người dùng. Vui lòng đăng nhập lại.");
            return;
        }

        const total = calculateTotal();

        if (editOrderId) {
            // UDPATE ORDER
            const res = await updateOrderSupabase(editOrderId, {
                customerName: selectedCustomer.name,
                customer_id: selectedCustomer.id,
                items: orderItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: item.discount,
                    discountType: item.discountType,
                    isGift: item.isGift
                })),
                totalAmount: total,
                vat: calculateTotal() - orderItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0),
                notes: orderNote,
                paymentMethod: paymentMethod
            }, session?.access_token);

            if (res?.success) {
                alert("✅ Cập nhật đơn hàng thành công!");
                router.push("/telesales/orders");
            } else {
                alert(`❌ Cập nhật thất bại: ${res?.error}`);
            }
        } else {
            // CREATE NEW ORDER
            const res = await addOrderSupabase({
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                source: "TELESALES",
                telesalesUserId: userId,
                items: orderItems.map((item) => ({
                    sku: item.product.sku || "N/A",
                    name: item.product.name,
                    brand: item.product.brand || "LHU",
                    quantity: item.quantity,
                    unit: item.product.unit || "Cái",
                    unitPrice: item.price, // Use edited price
                    subtotal: calculateItemSubtotal(item),
                    productId: item.product.id,
                    discount: item.discount,
                    discountType: item.discountType,
                    isGift: item.isGift
                })),
                totalAmount: total,
                status: "pending",
                notes: orderNote || (dealInfo ? `Đơn hàng từ cơ hội: ${dealInfo.title}` : "Đơn hàng tạo bởi Telesales"),
                vat: calculateTotal() - orderItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0), // exact vat val
                paymentMethod: paymentMethod
            }, session?.access_token);

            if (res?.success && res.data) {
                const newOrder = res.data;
                console.log("Created telesales order:", newOrder);

                // 2. Success message
                alert("✅ Tạo đơn hàng thành công & Đã giữ hàng!");

                // 3. Reset and Redirect
                setSelectedCustomer(null);
                setOrderItems([]);
                setCurrentStep(1);
                router.push("/telesales/orders");
            } else {
                console.error(res?.error);
                alert(`❌ Tạo đơn hàng thất bại: ${res?.error || "Lỗi không xác định"}`);
            }
        }
    };

    const handleReset = () => {
        setSelectedCustomer(null);
        setOrderItems([]);
        setVatRate(0);
        setOrderNote("");
        setPaymentMethod("COD");
        setCurrentStep(1);
    };

    if (isLoading) {
        return <div className="p-6">Đang tải dữ liệu...</div>;
    }

    // Calculated Summary Data
    const totalListPrice = calculateTotalListPrice();
    const totalDiscount = calculateTotalDiscount();
    const totalAfterDiscount = totalListPrice - totalDiscount;
    const itemsSubtotal = orderItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0); // Should equal totalAfterDiscount if no negative logic
    const totalVAT = itemsSubtotal * (vatRate / 100);
    const finalTotal = itemsSubtotal + totalVAT;
    const discountPercent = totalListPrice > 0 ? (totalDiscount / totalListPrice) * 100 : 0;


    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{editOrderId ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}</h1>
                <p className="text-sm text-slate-600 mt-1">
                    {editOrderId ? `Đang chỉnh sửa đơn hàng #${editOrderId.slice(0, 8)}...` : "Tạo đơn hàng cho khách hàng trong danh sách của bạn"}
                </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-400"
                                }`}
                        >
                            {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Chọn khách hàng</p>
                            <p className="text-xs text-slate-500">Khách cần đặt hàng</p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-12 h-0.5 bg-slate-200"></div>

                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-400"
                                }`}
                        >
                            {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Chọn sản phẩm</p>
                            <p className="text-xs text-slate-500">Thêm vào đơn</p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-12 h-0.5 bg-slate-200"></div>

                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 3 && orderItems.length > 0
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-400"
                                }`}
                        >
                            3
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Xác nhận</p>
                            <p className="text-xs text-slate-500">{editOrderId ? "Lưu thay đổi" : "Tạo đơn hàng"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Select Customer */}
            {currentStep === 1 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">Chọn khách hàng</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer.id)}
                                className="p-4 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 group-hover:bg-indigo-100 rounded-lg transition-colors">
                                        <User className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 mb-1 truncate">
                                            {customer.name}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {customer.address}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {customers.length === 0 && (
                            <p className="text-slate-500 col-span-3 text-center py-4">Chưa có khách hàng nào.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Select Products */}
            {currentStep >= 2 && selectedCustomer && (
                <>
                    {/* Selected Customer Info */}
                    <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm text-indigo-700 font-medium">Khách hàng đã chọn:</p>
                            <p className="text-lg font-semibold text-indigo-900">
                                {selectedCustomer.name}
                            </p>
                            <p className="text-xs text-indigo-600 mt-1">
                                {selectedCustomer.address}
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-white text-indigo-700 border border-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                        >
                            Đổi khách
                        </button>
                    </div>

                    {/* Product Selection */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Chọn sản phẩm</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {products.map((product) => {
                                // Simple check: is there any item of this product?
                                const inOrderCount = orderItems.reduce((sum, item) => item.product.id === product.id ? sum + item.quantity : sum, 0);

                                const brandColors: Record<string, string> = {
                                    UHI: "bg-orange-500",
                                    BOYO: "bg-purple-500",
                                    CVT: "bg-blue-500",
                                    LYHU: "bg-indigo-500",
                                };
                                const brandColor = brandColors[product.brand || "LHU"] || "bg-indigo-500";

                                return (
                                    <div
                                        key={product.id}
                                        className={`p-4 border rounded-lg ${inOrderCount > 0 ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                                            }`}
                                    >
                                        <span className={`inline-block ${brandColor} text-white text-xs font-semibold px-2 py-1 rounded mb-2`}>
                                            {product.brand || "LHU"}
                                        </span>
                                        <h4 className="font-medium text-slate-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-2">SKU: {product.sku}</p>
                                        <p className="text-lg font-bold text-slate-900 mb-1">
                                            {formatPrice(product.wholesalePrice || 0)}
                                        </p>
                                        <p className={`text-xs font-semibold mb-3 ${(inventory[product.id] ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {(inventory[product.id] ?? 0) > 0
                                                ? `Sẵn hàng: ${inventory[product.id]}`
                                                : 'Hết hàng'}
                                        </p>
                                        <button
                                            onClick={() => handleAddProduct(product)}
                                            disabled={(inventory[product.id] ?? 0) <= 0}
                                            className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${(inventory[product.id] ?? 0) <= 0
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" // Disabled style
                                                : inOrderCount > 0
                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                }`}
                                        >
                                            <Plus className="w-4 h-4" />
                                            {inOrderCount > 0 ? `Thêm nữa (${inOrderCount})` : "Thêm vào đơn"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    {orderItems.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Đơn hàng ({orderItems.length} dòng)</h3>

                            <div className="space-y-3 mb-6">
                                {orderItems.map((item, index) => (
                                    <div
                                        key={`${item.product.id}-${index}`}
                                        className={`flex flex-col gap-3 p-4 border rounded-lg transition-colors ${item.isGift ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}
                                    >
                                        {/* Top Row: Info + Actions */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {item.isGift && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">Quà tặng</span>}
                                                    <h4 className="font-medium text-slate-900 text-sm">{item.product.name}</h4>
                                                </div>

                                                {/* Price Edit Input */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-slate-500">Đơn giá:</span>
                                                    {item.isGift ? (
                                                        <span className="text-sm font-medium text-slate-400">0 đ</span>
                                                    ) : (
                                                        <div className="relative w-28">
                                                            <input
                                                                type="number"
                                                                className="w-full pl-2 pr-5 py-0.5 text-sm font-medium text-slate-900 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                value={item.price}
                                                                onChange={(e) => handleUpdatePrice(index, Number(e.target.value))}
                                                            />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">đ</span>
                                                        </div>
                                                    )}
                                                    {item.price !== (item.product.wholesalePrice || 0) && !item.isGift && (
                                                        <span className="text-[10px] text-slate-400 line-through ml-1">
                                                            {formatPrice(item.product.wholesalePrice || 0)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`font-semibold ${item.isGift ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                    {formatPrice(calculateItemSubtotal(item))}
                                                </p>
                                                {item.discount > 0 && !item.isGift && (
                                                    <p className="text-xs text-red-500">
                                                        - {formatPrice(item.discount)}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Bottom Row: Controls */}
                                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                                            {/* Quantity */}
                                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, 1)}
                                                    className="p-1 hover:bg-white rounded transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Options */}
                                            <div className="flex items-center gap-3">
                                                {/* Gift Toggle */}
                                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isGift}
                                                        onChange={() => handleToggleGift(index)}
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <Gift className="w-3.5 h-3.5" />
                                                    <span>Tặng</span>
                                                </label>

                                                <div className="w-px h-4 bg-slate-200"></div>

                                                {/* Discount Input */}
                                                <div className={`flex items-center gap-1.5 ${item.isGift ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                                                    <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                                                        <input
                                                            type="number"
                                                            placeholder="Giảm..."
                                                            className="w-20 pl-2 pr-1 py-1 text-xs outline-none text-right"
                                                            value={item.discountValue || ""}
                                                            onChange={(e) => handleUpdateDiscount(index, Number(e.target.value), item.discountType)}
                                                            min={0}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateDiscount(index, item.discountValue, item.discountType === 'amount' ? 'percent' : 'amount')}
                                                            className="px-1.5 py-1 bg-slate-50 border-l border-slate-200 text-[10px] text-slate-600 font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                            title="Đổi đơn vị (đ / %)"
                                                        >
                                                            {item.discountType === 'amount' ? 'đ' : '%'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <div className="space-y-3 mb-4">
                                    {/* Note */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                            <FileText className="w-4 h-4" /> Ghi chú đơn hàng
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                                            placeholder="Ghi chú thêm..."
                                            value={orderNote}
                                            onChange={(e) => setOrderNote(e.target.value)}
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                            <Building className="w-4 h-4" /> Phương thức thanh toán
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'COD', label: 'Tiền mặt (COD/Ship)' },
                                                { id: 'BANKING', label: 'Chuyển khoản' },
                                                { id: 'DEBT', label: 'Công nợ' }
                                            ].map((method) => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`py-2 px-3 text-sm rounded-lg border text-center transition-colors ${paymentMethod === method.id
                                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {method.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary Stats */}
                                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                                        <div className="flex items-center justify-between text-slate-600">
                                            <span>Tổng tiền hàng (Niêm yết):</span>
                                            <span>{formatPrice(totalListPrice)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-600">
                                            <span>Tổng được chiết khấu:</span>
                                            <div className="text-right">
                                                <span className="text-red-600 mr-1">-{formatPrice(totalDiscount)}</span>
                                                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                                    {discountPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 my-2"></div>

                                        <div className="flex items-center justify-between text-slate-600">
                                            <span>Thành tiền (Trước VAT):</span>
                                            <span className="font-medium">{formatPrice(itemsSubtotal)}</span>
                                        </div>

                                        {/* VAT */}
                                        <div className="flex items-center justify-between text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Percent className="w-3.5 h-3.5" />
                                                <span>Thuế VAT (%):</span>
                                                <input
                                                    type="number"
                                                    className="w-12 px-1 py-0.5 text-center border border-slate-300 rounded focus:border-indigo-500 text-xs"
                                                    placeholder="0"
                                                    min={0}
                                                    max={100}
                                                    value={vatRate || ""}
                                                    onChange={(e) => setVatRate(Number(e.target.value))}
                                                />
                                            </div>
                                            <span>+{formatPrice(totalVAT)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-lg font-bold text-slate-900">Tổng thanh toán:</span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleCreateOrder}
                                        className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        {editOrderId ? "Cập nhật đơn" : "Tạo đơn"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function TelesalesCreateOrderPage() {
    return (
        <Suspense fallback={
            <div className="p-6 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        }>
            <TelesalesCreateOrderContent />
        </Suspense>
    );
}
