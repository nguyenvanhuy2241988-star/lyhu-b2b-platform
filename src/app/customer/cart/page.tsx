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

    const handleCheckout = async () => {
        const user = await getCurrentUser();
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
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Giỏ hàng của bạn</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {cartItems.length} sản phẩm đã chọn
                    </p>
                </div>
                <Link
                    href="/customer/catalogue"
                    className="text-[#00AFA9] hover:underline font-semibold text-xs sm:text-sm"
                >
                    ← Tiếp tục xem hàng
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                    {cartItems.map((item) => {
                        const product = item?.product || {};
                        const brand = product.brand || "LYHU";

                        return (
                            <div
                                key={item.id}
                                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 transition-colors"
                            >
                                <div className="flex gap-3 sm:gap-4 items-center">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {(product as any)?.image_url ? (
                                            <img src={(product as any).image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingCart className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mb-1">
                                                    {brand}
                                                </span>
                                                <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">
                                                    {product.name || "Sản phẩm"}
                                                </h3>
                                                <p className="text-[11px] text-slate-400">
                                                    {formatPrice(product.wholesalePrice || 0)} / {product.unit || "Đơn vị"}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveItem(item.product.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Quantity & Line Total */}
                                        <div className="flex items-center justify-between mt-2.5">
                                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-30"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm sm:text-base font-bold text-[#00AFA9]">
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
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 sticky top-20">
                        <h3 className="font-bold text-slate-900 text-base mb-4">Tóm tắt đơn hàng</h3>

                        <div className="space-y-3 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tạm tính ({cartItems.length} món)</span>
                                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Phí giao hàng</span>
                                <span className="font-semibold text-[#8EC63F]">Báo sau</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-slate-900">Tổng thanh toán</span>
                                    <span className="text-xl font-extrabold text-[#00AFA9]">{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-[#00AFA9] hover:bg-[#009893] text-white py-3 rounded-xl font-bold text-sm transition-colors mb-2.5 flex items-center justify-center gap-2"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Xác nhận đặt hàng sỉ
                        </button>

                        <Link
                            href="/customer/catalogue"
                            className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                        >
                            Tiếp tục xem catalogue
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
