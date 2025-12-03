"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCart, updateCartQuantity, removeFromCart, clearCart } from "@/lib/customerStore";
import { addOrder } from "@/lib/ordersStore";
import { getCurrentUser } from "@/lib/auth";
import type { CartItem } from "@/mocks/data";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        setCartItems(getCart());
    }, []);

    const handleUpdateQuantity = (itemId: string, delta: number) => {
        const item = cartItems.find((i) => i.product.id === itemId);
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > 0) {
                const updated = updateCartQuantity(itemId, newQuantity);
                setCartItems(updated);
            }
        }
    };

    const handleRemoveItem = (itemId: string) => {
        const updated = removeFromCart(itemId);
        setCartItems(updated);
    };

    // ✅ FIX: Add safety check with optional chaining and default value
    const subtotal = (cartItems || []).reduce((sum, item) => {
        // Safe access to nested properties
        const price = item?.product?.wholesalePrice || 0;
        const quantity = item?.quantity || 0;
        return sum + (price * quantity);
    }, 0);

    const total = subtotal; // In real app, might add shipping, tax, etc.

    const handleCheckout = () => {
        const user = getCurrentUser();
        if (!user) {
            alert("Vui lòng đăng nhập để đặt hàng!");
            router.push("/login");
            return;
        }

        if (cartItems.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }

        // Create order using shared store
        addOrder({
            customerId: user.id,
            customerName: user.name,
            source: "CUSTOMER",
            items: cartItems.map(item => ({
                sku: item.product.sku || "N/A",
                name: item.product.name,
                brand: item.product.brand,
                quantity: item.quantity,
                unit: item.product.unit || "Cái",
                unitPrice: item.product.wholesalePrice,
                subtotal: item.product.wholesalePrice * item.quantity
            })),
            totalAmount: total
        });

        clearCart();
        alert("Đặt hàng thành công!");
        router.push("/customer/orders");
    };

    // ✅ Empty state check
    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-900">Giỏ hàng</h1>
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <ShoppingCart className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Giỏ hàng trống</h3>
                    <p className="text-slate-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                    <Link
                        href="/customer/catalogue"
                        className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Tiếp tục mua sắm
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Giỏ hàng</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        {cartItems.length} sản phẩm
                    </p>
                </div>
                <Link
                    href="/customer/catalogue"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                    ← Tiếp tục mua sắm
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => {
                        // ✅ Safe access to product properties
                        const product = item?.product || {};
                        const brand = product.brand || "LYHU";
                        const brandColors: Record<string, string> = {
                            UHI: "bg-orange-500",
                            BOYO: "bg-purple-500",
                            CVT: "bg-blue-500",
                            LYHU: "bg-primary-500",
                        };
                        const brandColor = brandColors[brand] || "bg-primary-500";

                        return (
                            <div
                                key={item.id}
                                className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Product Image */}
                                    <div className="w-full sm:w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <ShoppingCart className="w-10 h-10 text-slate-300" />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <span className={`inline-block ${brandColor} text-white text-xs font-semibold px-2 py-1 rounded mb-2`}>
                                                    {brand}
                                                </span>
                                                <h3 className="font-semibold text-slate-900 mb-1">
                                                    {product.name || "Sản phẩm"}
                                                </h3>
                                                <p className="text-sm text-slate-600">
                                                    {formatPrice(product.wholesalePrice || 0)} / {product.unit || "Đơn vị"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.product.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900">
                                                    {formatPrice((product.wholesalePrice || 0) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 sticky top-24">
                        <h3 className="font-semibold text-slate-900 mb-4">Tổng đơn hàng</h3>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Tạm tính</span>
                                <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Phí vận chuyển</span>
                                <span className="font-medium text-green-600">Miễn phí</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-900">Tổng cộng</span>
                                    <span className="text-xl font-bold text-primary-600">{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-semibold transition-colors mb-3"
                        >
                            Xác nhận đặt hàng
                        </button>

                        <Link
                            href="/customer/catalogue"
                            className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-medium transition-colors"
                        >
                            Tiếp tục mua sắm
                        </Link>

                        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                            <p className="text-xs text-primary-700">
                                💡 <strong>Lưu ý:</strong> Đơn hàng sẽ được xác nhận trong vòng 24h làm việc
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
