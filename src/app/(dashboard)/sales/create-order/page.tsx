"use client";

import { useState } from "react";
import { mockCustomers, mockProducts } from "@/mocks/data";
import type { Customer, Product } from "@/mocks/data";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, User } from "lucide-react";

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

export default function CreateOrderPage() {
    // Step 1: Select customer
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Step 2 & 3: Add products and quantities
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    // UI state
    const [currentStep, setCurrentStep] = useState(1);

    const handleSelectCustomer = (customerId: string) => {
        const customer = mockCustomers.find((c) => c.id === customerId);
        setSelectedCustomer(customer || null);
        if (customer) {
            setCurrentStep(2);
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

    const handleRemoveItem = (productId: string) => {
        setOrderItems((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => {
            return sum + item.product.wholesalePrice * item.quantity;
        }, 0);
    };

    const handleCreateOrder = () => {
        const orderData = {
            customer: selectedCustomer,
            items: orderItems.map((item) => ({
                productId: item.product.id,
                productName: item.product.name,
                sku: item.product.sku,
                quantity: item.quantity,
                price: item.product.wholesalePrice,
                total: item.product.wholesalePrice * item.quantity,
            })),
            total: calculateTotal(),
            createdAt: new Date().toISOString(),
            createdBy: "Sales Rep", // Mock user
        };

        console.log("Creating order:", orderData);
        alert("✅ Tạo đơn hàng thành công!\n\nChi tiết đã được ghi vào console.");

        // Reset form
        setSelectedCustomer(null);
        setOrderItems([]);
        setCurrentStep(1);
    };

    const handleReset = () => {
        setSelectedCustomer(null);
        setOrderItems([]);
        setCurrentStep(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tạo đơn hàng</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Tạo đơn hàng hộ khách hàng
                </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1
                                    ? "bg-primary-500 text-white"
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
                                    ? "bg-primary-500 text-white"
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
                                    ? "bg-primary-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                        >
                            3
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Xác nhận</p>
                            <p className="text-xs text-slate-500">Tạo đơn hàng</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Select Customer */}
            {currentStep === 1 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">Chọn khách hàng</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mockCustomers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer.id)}
                                className="p-4 border border-slate-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 group-hover:bg-primary-100 rounded-lg transition-colors">
                                        <User className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 mb-1 truncate">
                                            {customer.storeName}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {customer.type} • {customer.area}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Select Products */}
            {currentStep >= 2 && selectedCustomer && (
                <>
                    {/* Selected Customer Info */}
                    <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm text-primary-700 font-medium">Khách hàng đã chọn:</p>
                            <p className="text-lg font-semibold text-primary-900">
                                {selectedCustomer.storeName}
                            </p>
                            <p className="text-xs text-primary-600 mt-1">
                                {selectedCustomer.type} • {selectedCustomer.area}
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-white text-primary-700 border border-primary-300 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                        >
                            Đổi khách
                        </button>
                    </div>

                    {/* Product Selection */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Chọn sản phẩm</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {mockProducts.map((product) => {
                                const inOrder = orderItems.find((item) => item.product.id === product.id);
                                const brandColors: Record<string, string> = {
                                    UHI: "bg-orange-500",
                                    BOYO: "bg-purple-500",
                                    CVT: "bg-blue-500",
                                    LYHU: "bg-primary-500",
                                };
                                const brandColor = brandColors[product.brand] || "bg-primary-500";

                                return (
                                    <div
                                        key={product.id}
                                        className={`p-4 border rounded-lg ${inOrder ? "border-primary-500 bg-primary-50" : "border-slate-200"
                                            }`}
                                    >
                                        <span className={`inline-block ${brandColor} text-white text-xs font-semibold px-2 py-1 rounded mb-2`}>
                                            {product.brand}
                                        </span>
                                        <h4 className="font-medium text-slate-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-2">SKU: {product.sku}</p>
                                        <p className="text-lg font-bold text-slate-900 mb-3">
                                            {formatPrice(product.wholesalePrice)}
                                        </p>
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
                            <h3 className="font-semibold text-slate-900 mb-4">Đơn hàng ({orderItems.length} sản phẩm)</h3>

                            <div className="space-y-3 mb-6">
                                {orderItems.map((item) => (
                                    <div
                                        key={item.product.id}
                                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-900 text-sm">{item.product.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatPrice(item.product.wholesalePrice)} × {item.quantity}
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
                                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                                className="p-1.5 hover:bg-white rounded transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">
                                                {formatPrice(item.product.wholesalePrice * item.quantity)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveItem(item.product.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-semibold text-slate-900">Tổng cộng:</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatPrice(calculateTotal())}
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
