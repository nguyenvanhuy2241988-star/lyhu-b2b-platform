"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/mocks/data";
import { fetchCustomers, Customer, fetchDealItems } from "@/lib/crmDealsStore";
import { loadProducts } from "@/lib/supabase/products";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, User, Building, Gift, Tag, FileText, Search, Filter, ArrowUpDown, Eye, EyeOff, Package } from "lucide-react";
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
                    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_orders_v3`, {
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
                            // 1. Try to find in the fetched list (best for fresh consistency)
                            const customerRes = await fetchCustomers(undefined, session.access_token);
                            let customer = customerRes.find(c => c.id === order.customer_id);

                            // 2. Fallback: Use the customer data returned directly by RPC (safe against RLS filtering)
                            if (!customer && order.customer) {
                                customer = {
                                    id: order.customer.id || order.customer_id,
                                    name: order.customer.name || order.customer_name,
                                    phone: order.customer.phone || "",
                                    address: order.customer.address || "",
                                    source_category: order.customer.source || "TELESALES",
                                    type: order.customer.type || "individual",
                                    province: order.customer.province,
                                    district: order.customer.district,
                                    ward: order.customer.ward
                                } as Customer;
                            }

                            if (customer) {
                                setSelectedCustomer(customer);
                            } else {
                                alert("⚠️ Cảnh báo: Không tìm thấy thông tin khách hàng của đơn này.");
                            }

                            // Set Items
                            // RPC returns items in 'items' field, ensuring structure matches
                            const mappedItems: OrderItem[] = (order.items || []).map((item: any) => {
                                const price = item.price || 0;
                                const qty = item.quantity || 1;
                                const discAmount = item.discount || 0;
                                const dType = item.discount_type || 'amount';
                                // Restore discountValue: if percent type, reverse-calculate the %
                                let dValue = discAmount;
                                if (dType === 'percent' && price * qty > 0) {
                                    dValue = Math.round((discAmount / (price * qty)) * 100 * 100) / 100;
                                }
                                // Fix: RPC returns product as {name, sku, unit} without id
                                // We need to look up the full product or at least include product_id
                                const fullProduct = prods.find(p => p.id === item.product_id);
                                const productObj = fullProduct || {
                                    ...item.product,
                                    id: item.product_id,
                                    wholesalePrice: price,
                                } as Product;
                                return {
                                    product: productObj,
                                    quantity: qty,
                                    discount: discAmount,
                                    discountType: dType,
                                    discountValue: dValue,
                                    isGift: item.is_gift,
                                    price: price
                                };
                            });
                            setOrderItems(mappedItems);

                            // Set Other Info - use stored rates directly
                            setVatRate(order.vat_rate || 0);
                            setOrderDiscountPercent(order.order_discount_percent || 0);
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
    const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0); // Order-level discount %
    const [orderNote, setOrderNote] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("COD");

    // UI state
    const [currentStep, setCurrentStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

    // Product filter state
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [hideOutOfStock, setHideOutOfStock] = useState(false);
    const [sortBy, setSortBy] = useState<string>("name-asc");

    // Derived: available brands from loaded products
    const availableBrands = Array.from(new Set(products.map(p => p.brand || "LHU"))).sort();

    // Derived: filtered & sorted products
    const filteredProducts = products
        .filter(p => {
            const term = productSearchTerm.toLowerCase();
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

    const handleSelectCustomer = (customerId: string) => {
        const customer = customers.find((c) => c.id === customerId);
        setSelectedCustomer(customer || null);
        if (customer) {
            setCurrentStep(2);
        }
    };

    const handleAddProduct = (product: Product, quantityToAdd: number = 1) => {
        // Smart Gift Logic:
        // Find if there is an existing item that is NOT a gift.
        // If found -> Increment.
        // If not found (even if there is a Gift item) -> Add new line.
        const existingItemIndex = orderItems.findIndex((item) => item.product.id === product.id && !item.isGift);

        // Check total quantity in cart + adding
        const currentQtyInOrder = orderItems.reduce((sum, item) => item.product.id === product.id ? sum + item.quantity : sum, 0);
        const available = inventory[product.id] ?? 0;

        if (currentQtyInOrder + quantityToAdd > available) {
            alert(`Kho chỉ còn ${available} sản phẩm! (Đã chọn: ${currentQtyInOrder})`);
            return;
        }

        if (existingItemIndex !== -1) {
            const existingItem = orderItems[existingItemIndex];
            const newItems = [...orderItems];
            newItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + quantityToAdd };
            setOrderItems(newItems);
        } else {
            setOrderItems((prev) => [
                ...prev,
                {
                    product,
                    quantity: quantityToAdd,
                    price: product.wholesalePrice || 0, // Initialize with default list price
                    discount: 0,
                    discountType: 'amount',
                    discountValue: 0,
                    isGift: false
                }
            ]);
        }

        // Reset quantity input for this product to 1
        setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
    };

    const handleUpdateQuantity = (index: number, delta: number) => {
        setOrderItems((prev) => {
            const newItems = [...prev];
            const item = newItems[index];
            const newQuantity = Math.max(1, item.quantity + delta);
            const available = inventory[item.product.id] ?? 0;

            if (newQuantity > available) {
                alert(`Kho chỉ còn ${available} sản phẩm!`);
                return prev;
            }

            newItems[index] = { ...item, quantity: newQuantity };
            return newItems;
        });
    };

    const handleSetQuantity = (index: number, value: number) => {
        setOrderItems((prev) => {
            const newItems = [...prev];
            const item = newItems[index];
            const newQuantity = Math.max(1, value);
            const available = inventory[item.product.id] ?? 0;

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
            const item = newItems[index];

            if (!item.isGift) {
                // Toggling ON: add a separate gift line for this product (qty=1)
                // Keep the original item's quantity unchanged
                newItems.splice(index + 1, 0, {
                    ...item,
                    isGift: true,
                    quantity: 1,
                    discount: 0,
                    discountValue: 0
                });
            } else {
                // Toggling OFF: remove this gift line entirely
                newItems.splice(index, 1);
            }
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
        const orderDiscount = subtotal * (orderDiscountPercent / 100);
        const afterOrderDiscount = subtotal - orderDiscount;
        const vatAmount = afterOrderDiscount * (vatRate / 100);
        return afterOrderDiscount + vatAmount;
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
                vat: totalVAT,
                vat_rate: vatRate,
                order_discount_percent: orderDiscountPercent,
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
                vat: totalVAT,
                vat_rate: vatRate,
                order_discount_percent: orderDiscountPercent,
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
        setOrderDiscountPercent(0);
        setOrderNote("");
        setPaymentMethod("COD");
        setCurrentStep(1);
    };

    if (isLoading) {
        return <div className="p-6">Đang tải dữ liệu...</div>;
    }

    // Calculated Summary Data
    const totalListPrice = calculateTotalListPrice();
    const totalItemDiscount = calculateTotalDiscount();
    const itemsSubtotal = orderItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
    const orderDiscountAmount = itemsSubtotal * (orderDiscountPercent / 100);
    const afterAllDiscounts = itemsSubtotal - orderDiscountAmount;
    const totalVAT = afterAllDiscounts * (vatRate / 100);
    const finalTotal = afterAllDiscounts + totalVAT;
    const totalAllDiscounts = totalItemDiscount + orderDiscountAmount;
    const discountPercent = totalListPrice > 0 ? (totalAllDiscounts / totalListPrice) * 100 : 0;


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
                                ? "bg-teal-600 text-white"
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
                                ? "bg-teal-600 text-white"
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
                                ? "bg-teal-600 text-white"
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
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Chọn khách hàng</h3>
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên hoặc SĐT..."
                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers
                            .filter(customer => {
                                const term = searchTerm.toLowerCase();
                                return (
                                    customer.name.toLowerCase().includes(term) ||
                                    (customer.phone && customer.phone.includes(term))
                                );
                            })
                            .map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelectCustomer(customer.id)}
                                    className="p-4 border border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 group-hover:bg-teal-100 rounded-lg transition-colors">
                                            <User className="w-5 h-5 text-slate-600 group-hover:text-teal-600" />
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
                        {customers.length > 0 && customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm))).length === 0 && (
                            <p className="text-slate-500 col-span-3 text-center py-4">Không tìm thấy khách hàng phù hợp.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Select Products — Split-Panel Layout */}
            {currentStep >= 2 && selectedCustomer && (
                <>
                    {/* Selected Customer Info */}
                    <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm text-teal-700 font-medium">Khách hàng đã chọn:</p>
                            <p className="text-lg font-semibold text-teal-900">
                                {selectedCustomer.name}
                            </p>
                            <p className="text-xs text-teal-600 mt-1">
                                {selectedCustomer.address}
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-white text-teal-700 border border-teal-300 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                        >
                            Đổi khách
                        </button>
                    </div>

                    {/* Split-Panel: Product Catalog (left) + Order Cart (right) */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* LEFT PANEL: Product Catalog — Compact Table */}
                        <div className="flex-[3] min-w-0">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Header with search + filters */}
                                <div className="p-4 border-b border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-teal-600" />
                                            <h3 className="font-semibold text-slate-900">Chọn sản phẩm</h3>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {filteredProducts.length}/{products.length}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Tìm tên hoặc SKU..."
                                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                                                value={productSearchTerm}
                                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Filter Bar */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Brand Tabs */}
                                        <div className="flex items-center gap-1">
                                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => setBrandFilter("ALL")}
                                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${brandFilter === "ALL"
                                                        ? "bg-teal-600 text-white shadow-sm"
                                                        : "text-slate-600 hover:bg-white"
                                                        }`}
                                                >
                                                    Tất cả
                                                </button>
                                                {availableBrands.map(brand => (
                                                    <button
                                                        key={brand}
                                                        onClick={() => setBrandFilter(brand)}
                                                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${brandFilter === brand
                                                            ? "bg-teal-600 text-white shadow-sm"
                                                            : "text-slate-600 hover:bg-white"
                                                            }`}
                                                    >
                                                        {brand}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="w-px h-5 bg-slate-200"></div>

                                        {/* Hide Out of Stock */}
                                        <button
                                            onClick={() => setHideOutOfStock(!hideOutOfStock)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${hideOutOfStock
                                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                                }`}
                                        >
                                            {hideOutOfStock ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {hideOutOfStock ? "Chỉ còn hàng" : "Ẩn hết hàng"}
                                        </button>

                                        <div className="w-px h-5 bg-slate-200"></div>

                                        {/* Sort */}
                                        <div className="flex items-center gap-1">
                                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
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

                                {/* Product Table */}
                                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
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
                                            {filteredProducts
                                                .map((product) => {
                                                    const inOrderCount = orderItems.reduce((sum, item) => item.product.id === product.id ? sum + item.quantity : sum, 0);
                                                    const brandColors: Record<string, string> = {
                                                        ABI: "bg-teal-600",
                                                        UHI: "bg-orange-500",
                                                        BOYO: "bg-purple-500",
                                                        CVT: "bg-blue-500",
                                                        LYHU: "bg-teal-600",
                                                        LHU: "bg-teal-600",
                                                    };
                                                    const brandColor = brandColors[product.brand || "LHU"] || "bg-teal-600";
                                                    const inputValue = productQuantities[product.id] || 1;
                                                    const stock = inventory[product.id] ?? 0;
                                                    const isOutOfStock = stock <= 0;

                                                    return (
                                                        <tr
                                                            key={product.id}
                                                            className={`group transition-colors ${inOrderCount > 0
                                                                ? "bg-teal-50/60 border-l-[3px] border-l-teal-500"
                                                                : "hover:bg-slate-50 border-l-[3px] border-l-transparent"
                                                                }`}
                                                        >
                                                            {/* Product Info */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className={`${brandColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0`}>
                                                                        {product.brand || "LHU"}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-slate-900 text-sm truncate max-w-[260px]" title={product.name}>
                                                                            {product.name}
                                                                        </p>
                                                                        <p className="text-[11px] text-slate-400">SKU: {product.sku}</p>
                                                                    </div>
                                                                    {inOrderCount > 0 && (
                                                                        <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                                                            ×{inOrderCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Price */}
                                                            <td className="px-3 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                                                                {formatPrice(product.wholesalePrice || 0)}
                                                            </td>

                                                            {/* Stock */}
                                                            <td className="px-3 py-3 text-center">
                                                                <span className={`text-xs font-semibold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {isOutOfStock ? 'Hết' : stock}
                                                                </span>
                                                            </td>

                                                            {/* Quantity Input */}
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center justify-center">
                                                                    <div className="flex items-center border border-slate-200 rounded-md bg-white">
                                                                        <button
                                                                            onClick={() => setProductQuantities(prev => ({ ...prev, [product.id]: Math.max(1, (prev[product.id] || 1) - 1) }))}
                                                                            className="px-1.5 py-1 hover:bg-slate-100 transition-colors border-r border-slate-200"
                                                                        >
                                                                            <Minus className="w-3 h-3 text-slate-400" />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            className="w-20 text-center text-sm font-medium py-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                            value={inputValue}
                                                                            onChange={(e) => {
                                                                                const val = parseInt(e.target.value) || 0;
                                                                                setProductQuantities(prev => ({ ...prev, [product.id]: Math.max(1, val) }));
                                                                            }}
                                                                            min="1"
                                                                        />
                                                                        <button
                                                                            onClick={() => setProductQuantities(prev => ({ ...prev, [product.id]: (prev[product.id] || 1) + 1 }))}
                                                                            className="px-1.5 py-1 hover:bg-slate-100 transition-colors border-l border-slate-200"
                                                                        >
                                                                            <Plus className="w-3 h-3 text-slate-400" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Add Button */}
                                                            <td className="px-3 py-3 text-center">
                                                                <button
                                                                    onClick={() => handleAddProduct(product, inputValue)}
                                                                    disabled={isOutOfStock}
                                                                    className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1 mx-auto transition-all ${isOutOfStock
                                                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                                        : inOrderCount > 0
                                                                            ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                                                                            : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                                                                        }`}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Thêm
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                    {filteredProducts.length === 0 && products.length > 0 && (
                                        <div className="text-center py-8">
                                            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-500">Không tìm thấy sản phẩm phù hợp</p>
                                            <button onClick={() => { setBrandFilter("ALL"); setProductSearchTerm(""); setHideOutOfStock(false); }} className="text-xs text-teal-600 hover:underline mt-1">Xóa bộ lọc</button>
                                        </div>
                                    )}
                                    {products.length === 0 && (
                                        <p className="text-slate-500 text-center py-8">Chưa có sản phẩm nào.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Sticky Order Cart */}
                        <div className="flex-[2] min-w-0">
                            <div className="lg:sticky lg:top-4">
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    {/* Cart Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white">
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="w-5 h-5 text-teal-600" />
                                            <h3 className="font-semibold text-slate-900">Đơn hàng</h3>
                                            {orderItems.length > 0 && (
                                                <span className="bg-teal-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                    {orderItems.length}
                                                </span>
                                            )}
                                        </div>
                                        {orderItems.length > 0 && (
                                            <span className="text-lg font-bold text-teal-600">
                                                {formatPrice(finalTotal)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Cart Items — Scrollable */}
                                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 520px)' }}>
                                        {orderItems.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-400">Chưa có sản phẩm nào</p>
                                                <p className="text-xs text-slate-400 mt-1">Thêm từ danh sách bên trái</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {orderItems.map((item, index) => (
                                                    <div
                                                        key={`${item.product.id}-${index}`}
                                                        className={`p-3 transition-colors ${item.isGift ? 'bg-emerald-50/50' : ''}`}
                                                    >
                                                        {/* Item header: name + subtotal + delete */}
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    {item.isGift && <span className="px-1 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase rounded">Tặng</span>}
                                                                    <h4 className="font-medium text-slate-900 text-xs truncate">{item.product.name}</h4>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className={`text-sm font-semibold ${item.isGift ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                    {formatPrice(calculateItemSubtotal(item))}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleRemoveItem(index)}
                                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Controls row: qty, price, gift, discount */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {/* Quantity */}
                                                            <div className="flex items-center bg-slate-100 rounded-md">
                                                                <button
                                                                    onClick={() => handleUpdateQuantity(index, -1)}
                                                                    disabled={item.quantity <= 1}
                                                                    className="p-1 hover:bg-white rounded-l-md transition-colors disabled:opacity-40"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    className="w-16 text-center text-xs font-semibold bg-white border-x border-slate-200 py-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleSetQuantity(index, parseInt(e.target.value) || 1)}
                                                                    min={1}
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateQuantity(index, 1)}
                                                                    className="p-1 hover:bg-white rounded-r-md transition-colors"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {/* Price edit */}
                                                            {!item.isGift && (
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        className="w-20 pl-1.5 pr-4 py-1 text-xs font-medium text-slate-900 border border-slate-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-right"
                                                                        value={item.price}
                                                                        onChange={(e) => handleUpdatePrice(index, Number(e.target.value))}
                                                                    />
                                                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">đ</span>
                                                                </div>
                                                            )}

                                                            {/* Gift toggle */}
                                                            <label className="flex items-center gap-1 cursor-pointer text-[11px] font-medium text-slate-500 select-none ml-auto">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.isGift}
                                                                    onChange={() => handleToggleGift(index)}
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                                />
                                                                <Gift className="w-3 h-3" />
                                                            </label>

                                                            {/* Discount */}
                                                            {!item.isGift && (
                                                                <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="CK"
                                                                        className="w-14 pl-1.5 pr-0.5 py-1 text-[11px] outline-none text-right"
                                                                        value={item.discountValue || ""}
                                                                        onChange={(e) => handleUpdateDiscount(index, Number(e.target.value), item.discountType)}
                                                                        min={0}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleUpdateDiscount(index, item.discountValue, item.discountType === 'amount' ? 'percent' : 'amount')}
                                                                        className="px-1 py-1 bg-slate-50 border-l border-slate-200 text-[9px] text-slate-600 font-bold hover:bg-teal-50 hover:text-teal-600 transition-colors"
                                                                    >
                                                                        {item.discountType === 'amount' ? 'đ' : '%'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Discount info */}
                                                        {item.discount > 0 && !item.isGift && (
                                                            <p className="text-[10px] text-red-500 mt-1 text-right">CK: -{formatPrice(item.discount)}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cart Footer: Note, Payment, Summary, Actions */}
                                    {orderItems.length > 0 && (
                                        <div className="border-t border-slate-200 p-4 space-y-3">
                                            {/* Note */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                                                    <FileText className="w-3.5 h-3.5" /> Ghi chú
                                                </label>
                                                <textarea
                                                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[40px] resize-none"
                                                    placeholder="Ghi chú thêm..."
                                                    value={orderNote}
                                                    onChange={(e) => setOrderNote(e.target.value)}
                                                />
                                            </div>

                                            {/* Payment Method */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                                                    <Building className="w-3.5 h-3.5" /> Thanh toán
                                                </label>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {[
                                                        { id: 'COD', label: 'COD' },
                                                        { id: 'BANKING', label: 'CK' },
                                                        { id: 'DEBT', label: 'Công nợ' }
                                                    ].map((method) => (
                                                        <button
                                                            key={method.id}
                                                            onClick={() => setPaymentMethod(method.id)}
                                                            className={`py-1.5 px-2 text-xs rounded-md border text-center transition-colors ${paymentMethod === method.id
                                                                ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {method.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 text-xs">
                                                <div className="flex items-center justify-between text-slate-600">
                                                    <span>Tiền hàng:</span>
                                                    <span>{formatPrice(totalListPrice)}</span>
                                                </div>
                                                {totalItemDiscount > 0 && (
                                                    <div className="flex items-center justify-between text-slate-600">
                                                        <span>CK dòng:</span>
                                                        <span className="text-red-600">-{formatPrice(totalItemDiscount)}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-slate-600">
                                                    <div className="flex items-center gap-1">
                                                        <span>CK đơn:</span>
                                                        <input
                                                            type="number"
                                                            className="w-10 px-1 py-0.5 text-center border border-slate-300 rounded focus:border-teal-500 text-[11px]"
                                                            placeholder="0"
                                                            min={0}
                                                            max={100}
                                                            value={orderDiscountPercent || ""}
                                                            onChange={(e) => setOrderDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                        />
                                                        <span className="text-slate-400">%</span>
                                                    </div>
                                                    <span className="text-red-600">-{formatPrice(orderDiscountAmount)}</span>
                                                </div>

                                                {(totalAllDiscounts > 0) && (
                                                    <div className="flex items-center justify-between text-slate-500">
                                                        <span>Tổng CK:</span>
                                                        <div>
                                                            <span className="text-red-600 mr-1">-{formatPrice(totalAllDiscounts)}</span>
                                                            <span className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-[10px]">
                                                                {discountPercent.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="border-t border-slate-200 my-1"></div>

                                                <div className="flex items-center justify-between text-slate-600">
                                                    <div className="flex items-center gap-1">
                                                        <span>VAT:</span>
                                                        <input
                                                            type="number"
                                                            className="w-9 px-1 py-0.5 text-center border border-slate-300 rounded focus:border-teal-500 text-[11px]"
                                                            placeholder="0"
                                                            min={0}
                                                            max={100}
                                                            value={vatRate || ""}
                                                            onChange={(e) => setVatRate(Number(e.target.value))}
                                                        />
                                                        <span className="text-slate-400">%</span>
                                                    </div>
                                                    <span>+{formatPrice(totalVAT)}</span>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-sm font-bold text-slate-900">Tổng:</span>
                                                <span className="text-xl font-bold text-teal-600">
                                                    {formatPrice(finalTotal)}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={handleReset}
                                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition-colors"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleCreateOrder}
                                                    className="flex-[2] px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                    {editOrderId ? "Cập nhật đơn" : "Tạo đơn"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
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
