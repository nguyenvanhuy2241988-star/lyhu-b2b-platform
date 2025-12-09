"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockProducts } from "@/mocks/data";
import type { Product } from "@/mocks/data";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Truck, Package, User, Info } from "lucide-react";
import { addOrder, type FulfillmentMode } from "@/lib/ordersStore";
import { getCurrentUser } from "@/lib/auth";
import { getCustomerUnitPrice, getCtvSelfShipUnitPrice } from "@/lib/pricing";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

interface OrderItem {
    product: Product;
    quantity: number;
}

interface ReceiverInfo {
    name: string;
    phone: string;
    address: string;
    notes: string;
}

export default function CreateOrderPage() {
    const router = useRouter();
    const currentUser = getCurrentUser();

    // Step 1: Select Fulfillment Mode
    const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode | null>(null);

    // Step 2: Receiver Info (Only for LYHU_SHIP)
    const [receiverInfo, setReceiverInfo] = useState<ReceiverInfo>({
        name: "",
        phone: "",
        address: "",
        notes: "",
    });

    // Step 3: Add products
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    // UI state
    const [currentStep, setCurrentStep] = useState(1);

    const handleSelectMode = (mode: FulfillmentMode) => {
        setFulfillmentMode(mode);
        setCurrentStep(2);
    };

    const handleReceiverInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReceiverInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleConfirmReceiver = () => {
        if (receiverInfo.name && receiverInfo.phone && receiverInfo.address) {
            setCurrentStep(3);
        } else {
            alert("Vui lòng điền đầy đủ thông tin người nhận");
        }
    };

    const handleAddProduct = (product: Product) => {
        const existingItem = orderItems.find((item) => item.product.id === product.id);

        if (existingItem) {
            setOrderItems((prev) =>
                prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setOrderItems((prev) => [...prev, { product, quantity: 1 }]);
        }
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.product.id === productId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const handleQuantityInput = (productId: string, value: string) => {
        const newQuantity = parseInt(value);
        if (!isNaN(newQuantity) && newQuantity >= 1) {
            setOrderItems((prev) =>
                prev.map((item) => {
                    if (item.product.id === productId) {
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
            );
        }
    };

    const handleRemoveItem = (productId: string) => {
        setOrderItems((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const getUnitPrice = (product: Product, quantity: number) => {
        if (fulfillmentMode === "SELF_SHIP") {
            return getCtvSelfShipUnitPrice(product, quantity);
        }
        return getCustomerUnitPrice(product, quantity);
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => {
            return sum + getUnitPrice(item.product, item.quantity) * item.quantity;
        }, 0);
    };

    const calculateCommission = () => {
        if (!fulfillmentMode) return 0;

        return orderItems.reduce((sum, item) => {
            const product = item.product;
            if (fulfillmentMode === "SELF_SHIP") {
                // Discount = Base Price - Self Ship Price (Tiered)
                const selfShipPrice = getCtvSelfShipUnitPrice(product, item.quantity);
                const discount = Math.max(0, product.basePricePerUnit - selfShipPrice);
                return sum + discount * item.quantity;
            } else {
                // Commission = Line Total * Rate
                const customerPrice = getCustomerUnitPrice(product, item.quantity);
                const revenue = customerPrice * item.quantity;
                return sum + revenue * product.ctvCommissionRate;
            }
        }, 0);
    };

    const handleCreateOrder = () => {
        if (!fulfillmentMode) return;
        if (fulfillmentMode === "LYHU_SHIP" && (!receiverInfo.name || !receiverInfo.phone || !receiverInfo.address)) {
            alert("Vui lòng điền đầy đủ thông tin người nhận");
            return;
        }

        const total = calculateTotal();
        const commission = calculateCommission();

        const orderData = {
            customerId: fulfillmentMode === "SELF_SHIP" ? (currentUser?.id || "CTV") : "GUEST",
            customerName: fulfillmentMode === "SELF_SHIP" ? (currentUser?.name || "CTV Stock") : receiverInfo.name,
            source: "CTV" as const,
            fulfillmentMode,
            ctvId: currentUser?.id,
            ctvName: currentUser?.name,
            ctvCommission: commission, // Pass calculated commission
            items: orderItems.map((item) => ({
                sku: item.product.sku || "N/A",
                name: item.product.name,
                brand: item.product.brand,
                quantity: item.quantity,
                unit: item.product.unit || "Cái",
                unitPrice: getUnitPrice(item.product, item.quantity),
                subtotal: getUnitPrice(item.product, item.quantity) * item.quantity,
                productId: item.product.id,
            })),
            totalAmount: total,
            receiverPhone: fulfillmentMode === "LYHU_SHIP" ? receiverInfo.phone : undefined,
            receiverAddress: fulfillmentMode === "LYHU_SHIP" ? receiverInfo.address : undefined,
            notes: fulfillmentMode === "LYHU_SHIP" ? receiverInfo.notes : undefined,
        };

        const newOrder = addOrder(orderData);

        console.log("Created CTV order:", newOrder);

        alert("✅ Tạo đơn hàng thành công!");

        // Reset and Redirect
        setFulfillmentMode(null);
        setReceiverInfo({ name: "", phone: "", address: "", notes: "" });
        setOrderItems([]);
        setCurrentStep(1);
        router.push("/ctv/orders");
    };

    const handleReset = () => {
        setFulfillmentMode(null);
        setReceiverInfo({ name: "", phone: "", address: "", notes: "" });
        setOrderItems([]);
        setCurrentStep(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tạo đơn hàng mới</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Chọn hình thức giao hàng và tạo đơn
                </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1 ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Hình thức</p>
                            <p className="text-xs text-slate-500">Chọn cách giao</p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-12 h-0.5 bg-slate-200"></div>

                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2 ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Thông tin</p>
                            <p className="text-xs text-slate-500">Sản phẩm & Khách</p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-12 h-0.5 bg-slate-200"></div>

                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 3 && orderItems.length > 0 ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                            3
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Xác nhận</p>
                            <p className="text-xs text-slate-500">Hoàn tất đơn</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Select Fulfillment Mode */}
            {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => handleSelectMode("SELF_SHIP")}
                        className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Tự ship cho khách</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Bạn nhập hàng về kho của mình trước. Giá ưu đãi dành cho CTV.
                        </p>
                        <ul className="text-sm text-slate-500 space-y-2">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Giá nhập thấp hơn
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Chủ động giao hàng
                            </li>
                        </ul>
                    </button>

                    <button
                        onClick={() => handleSelectMode("LYHU_SHIP")}
                        className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all text-left group"
                    >
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                            <Truck className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Để LYHU giao cho khách</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Không cần vốn nhập hàng. LYHU sẽ đóng gói và giao trực tiếp cho khách của bạn.
                        </p>
                        <ul className="text-sm text-slate-500 space-y-2">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Không cần vốn
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Nhận hoa hồng trên đơn
                            </li>
                        </ul>
                    </button>
                </div>
            )}

            {/* Step 2: Receiver Info (LYHU_SHIP) or Skip to Products (SELF_SHIP) */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    {fulfillmentMode === "LYHU_SHIP" ? (
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Thông tin người nhận</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng / Cửa hàng</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={receiverInfo.name}
                                        onChange={handleReceiverInfoChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="VD: Tạp hóa Minh Anh"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={receiverInfo.phone}
                                        onChange={handleReceiverInfoChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="VD: 0901234567"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ giao hàng</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={receiverInfo.address}
                                        onChange={handleReceiverInfoChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="VD: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (nếu có)</label>
                                    <textarea
                                        name="notes"
                                        value={receiverInfo.notes}
                                        onChange={handleReceiverInfoChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        rows={2}
                                        placeholder="VD: Giao giờ hành chính"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleConfirmReceiver}
                                    className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                                >
                                    Tiếp tục chọn sản phẩm
                                </button>
                            </div>
                        </div>
                    ) : (
                        // SELF_SHIP: Auto skip to products, but we show a small info box
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Chế độ: Tự nhập hàng</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Đơn hàng sẽ được tạo dưới tên của bạn.
                                </p>
                            </div>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            >
                                Chọn sản phẩm ngay
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Select Products */}
            {currentStep === 3 && (
                <>
                    {/* Product Selection */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Chọn sản phẩm ({fulfillmentMode === "SELF_SHIP" ? "Giá nhập" : "Giá bán lẻ"})</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {mockProducts.map((product) => {
                                const inOrder = orderItems.find((item) => item.product.id === product.id);
                                // Show base price for reference, actual price depends on quantity
                                const displayPrice = fulfillmentMode === "SELF_SHIP"
                                    ? (product.ctvSelfShipPriceTiers?.[0]?.pricePerUnit || product.ctvSelfShipPrice)
                                    : (product.customerPriceTiers?.[0]?.pricePerUnit || product.customerPrice);

                                return (
                                    <div
                                        key={product.id}
                                        className={`p-4 border rounded-lg ${inOrder ? "border-primary-500 bg-primary-50" : "border-slate-200"}`}
                                    >
                                        <h4 className="font-medium text-slate-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-1">Đơn vị: {product.unit}</p>
                                        <p className="text-lg font-bold text-slate-900 mb-1">
                                            {formatPrice(displayPrice)}
                                            <span className="text-xs font-normal text-slate-500 ml-1">/ {product.unit}</span>
                                        </p>

                                        {/* Tier Info Hint */}
                                        <div className="mb-3 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                            <div className="flex items-center gap-1 mb-1 font-medium">
                                                <Info className="w-3 h-3" />
                                                Bảng giá:
                                            </div>
                                            {(fulfillmentMode === "SELF_SHIP" ? product.ctvSelfShipPriceTiers : product.customerPriceTiers)?.slice(0, 2).map((tier, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                    <span>{tier.minQty}{tier.maxQty ? `-${tier.maxQty}` : "+"} {product.unit}:</span>
                                                    <span className="font-medium">{formatPrice(tier.pricePerUnit)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleAddProduct(product)}
                                            className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${inOrder
                                                ? "bg-primary-600 text-white hover:bg-primary-700"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                }`}
                                        >
                                            <Plus className="w-4 h-4" />
                                            {inOrder ? `Đã thêm (${inOrder.quantity})` : "Thêm vào đơn"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    {orderItems.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Chi tiết đơn hàng</h3>

                            <div className="space-y-3 mb-6">
                                {orderItems.map((item) => {
                                    const unitPrice = getUnitPrice(item.product, item.quantity);
                                    return (
                                        <div key={item.product.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-900 text-sm">{item.product.name}</h4>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Đơn giá: {formatPrice(unitPrice)} / {item.product.unit}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1.5 hover:bg-white rounded transition-colors disabled:opacity-50"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityInput(item.product.id, e.target.value)}
                                                    className="w-16 text-center font-semibold bg-transparent border border-slate-300 rounded py-1"
                                                />
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                                    className="p-1.5 hover:bg-white rounded transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="text-right min-w-[100px]">
                                                <p className="font-semibold text-slate-900">
                                                    {formatPrice(unitPrice * item.quantity)}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveItem(item.product.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600">Tổng tiền hàng:</span>
                                    <span className="text-xl font-bold text-slate-900">
                                        {formatPrice(calculateTotal())}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-green-600 font-medium">
                                        {fulfillmentMode === "SELF_SHIP" ? "Tổng chiết khấu nhập:" : "Tổng hoa hồng dự kiến:"}
                                    </span>
                                    <span className="text-lg font-bold text-green-600">
                                        {formatPrice(calculateCommission())}
                                    </span>
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
                                        className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        Tạo đơn hàng
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
