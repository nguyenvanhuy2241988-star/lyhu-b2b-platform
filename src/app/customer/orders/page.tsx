"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { type Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { Package, Clock, CheckCircle, XCircle, Filter, RotateCcw, ShoppingBag, Gift } from "lucide-react";
import { useRouter } from "next/navigation";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
};

const STATUS_CONFIG = {
    pending: {
        label: "Chờ xác nhận",
        icon: Clock,
        color: "bg-amber-50 text-amber-800 border border-amber-200",
    },
    processing: {
        label: "Đang xử lý",
        icon: Package,
        color: "bg-[#00AFA9]/10 text-[#00AFA9] border border-[#00AFA9]/20",
    },
    delivering: {
        label: "Đang giao hàng",
        icon: Package,
        color: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    delivered: {
        label: "Đã giao",
        icon: CheckCircle,
        color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    returned: {
        label: "Hoàn hàng",
        icon: RotateCcw,
        color: "bg-orange-50 text-orange-700 border border-orange-200",
    },
    cancelled: {
        label: "Đã hủy",
        icon: XCircle,
        color: "bg-rose-50 text-rose-700 border border-rose-200",
    },
    draft: {
        label: "Nháp",
        icon: Package,
        color: "bg-slate-50 text-slate-600 border border-slate-200",
    }
};

const ORDER_STATUS_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "processing", label: "Đang xử lý" },
    { value: "delivering", label: "Đang giao hàng" },
    { value: "delivered", label: "Đã giao" },
    { value: "returned", label: "Hoàn hàng" },
    { value: "cancelled", label: "Đã hủy" },
];

export default function OrdersPage() {
    const { user: authUser, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (authIsLoading) return;
        if (authUser) {
            const fetchCustomerOrders = async () => {
                try {
                    const phone = authUser.phone || authUser.user_metadata?.phone || (authUser as any).phone;
                    
                    let query = supabase
                        .from('orders')
                        .select(`
                            id, 
                            status, 
                            total_amount, 
                            created_at,
                            source,
                            note,
                            items:order_items(
                                quantity, 
                                price,
                                product:products(*)
                            )
                        `);

                    if (phone) {
                        // Clean phone number (remove spaces, +84 etc if needed, but usually just exact match)
                        const cleanPhone = phone.replace('+84', '0').replace(/\s+/g, '');
                        query = query.or(`customer_id.eq.${authUser.id},telesales_user_id.eq.${authUser.id},receiver_phone.eq.${cleanPhone}`);
                    } else {
                        query = query.or(`customer_id.eq.${authUser.id},telesales_user_id.eq.${authUser.id}`);
                    }
                    
                    const { data, error } = await query.order('created_at', { ascending: false });

                    if (error) {
                        console.error('Supabase query error:', error);
                    }
                    
                    if (data) {
                        const formattedOrders = data.map((o: any) => ({
                            id: o.id,
                            status: o.status,
                            totalAmount: o.total_amount,
                            createdAt: o.created_at,
                            source: o.source,
                            note: o.note,
                            items: o.items?.map((item: any) => ({
                                product: item.product,
                                name: item.product?.name || 'Sản phẩm',
                                quantity: item.quantity,
                                subtotal: item.quantity * item.price,
                            })) || []
                        }));
                        setOrders(formattedOrders as any);
                    }
                } catch (e) {
                    console.error('Error fetching orders:', e);
                }
            };
            fetchCustomerOrders();
        }
    }, [authUser, authIsLoading]);

    const filteredOrders = useMemo(() => {
        if (!orders || !Array.isArray(orders)) {
            return [];
        }
        if (selectedStatus === "ALL") {
            return orders;
        }
        return orders.filter((order) => order.status === selectedStatus);
    }, [orders, selectedStatus]);

    const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        processing: orders.filter((o) => o.status === "processing").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
    };

    const handleReorder = (order: any) => {
        if (!order.items || order.items.length === 0) return;
        
        try {
            // Reconstruct cart state
            const newCart: Record<string, { product: any; quantity: number }> = {};
            order.items.forEach((item: any) => {
                if (item.product && item.product.id) {
                    const p = item.product;
                    const mappedProduct = {
                        ...p,
                        retailPrice: p.retailPrice ?? p.retail_price,
                        basePricePerUnit: p.basePricePerUnit ?? p.base_price_per_unit ?? p.basePrice ?? p.base_price ?? p.price ?? 0,
                        basePrice: p.basePrice ?? p.base_price ?? p.price ?? 0,
                    };
                    newCart[item.product.id] = {
                        product: mappedProduct,
                        quantity: item.quantity
                    };
                }
            });
            
            // Save to localStorage so WholesaleStore can load it
            localStorage.setItem('lyhu_b2b_cart', JSON.stringify(newCart));
            
            // Redirect to home page
            router.push('/');
        } catch (err) {
            console.error('Lỗi khi mua lại đơn:', err);
        }
    };

    const cancelOrderInternal = async (orderId: string) => {
        const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        if (error) throw error;
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
        try {
            await cancelOrderInternal(orderId);
            alert('Đã hủy đơn hàng thành công');
        } catch (error) {
            console.error('Lỗi khi hủy đơn:', error);
            alert('Có lỗi xảy ra khi hủy đơn hàng');
        }
    };

    const handleEditOrder = async (order: any) => {
        if (!confirm('Hệ thống sẽ hủy đơn hàng hiện tại và chuyển các sản phẩm vào giỏ hàng để bạn sửa lại. Bạn có đồng ý không?')) return;
        try {
            await cancelOrderInternal(order.id);
            handleReorder(order);
        } catch (error) {
            console.error('Lỗi khi sửa đơn:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại sau');
        }
    };

    return (
        <div className="space-y-5 pb-16 lg:pb-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-[#00AFA9]" />
                    Lịch sử đơn hàng
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Theo dõi trạng thái và lịch sử tất cả đơn đặt hàng B2B của bạn
                </p>
            </div>

            {/* Stats Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">Tổng đơn</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-amber-700 font-medium">Chờ xác nhận</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-0.5">{stats.pending}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-[#00AFA9] font-medium">Đang xử lý</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#00AFA9] mt-0.5">{stats.processing}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-emerald-700 font-medium">Đã giao</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5">{stats.delivered}</p>
                </div>
            </div>

            {/* Horizontal Swipeable Status Filter */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-0.5" />
                    {ORDER_STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedStatus(option.value)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
                                selectedStatus === option.value
                                    ? "bg-[#00AFA9] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3.5">
                {filteredOrders.map((order) => {
                    const status = order.status;
                    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConfig?.icon || Package;
                    const items = order.items || [];
                    
                    // Parse voucher from note: "[B2B Web] ... KM: Voucher ABC"
                    let voucherName = null;
                    if (order.note && order.note.includes("KM: ")) {
                        voucherName = order.note.split("KM: ")[1].trim();
                    }

                    let parsedDiscounts: { label: string, amountStr: string, value: number }[] = [];
                    if (voucherName) {
                        if (voucherName.toLowerCase().includes('miễn phí vận chuyển') || voucherName.toLowerCase().includes('freeship')) {
                            parsedDiscounts.push({ label: 'Voucher vận chuyển', amountStr: 'Miễn phí', value: 0 });
                        }
                        const match = voucherName.match(/giảm\s*(\d+)k/i);
                        if (match) {
                            const amount = parseInt(match[1]) * 1000;
                            parsedDiscounts.push({ label: 'Voucher giảm giá', amountStr: `-${formatPrice(amount)}`, value: amount });
                        }
                    }

                    const knownDiscountsValue = parsedDiscounts.reduce((sum, d) => sum + d.value, 0);
                    let baseTotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || (item.price * item.quantity) || 0), 0);
                    const shippingFee = order.shippingFee || 0;
                    
                    if (parsedDiscounts.length > 0) {
                        baseTotal = order.totalAmount + knownDiscountsValue - shippingFee;
                    }

                    let unparsedDiscount = 0;
                    if (parsedDiscounts.length === 0) {
                        unparsedDiscount = Math.max(0, baseTotal + shippingFee - order.totalAmount);
                    }

                    return (
                        <div
                            key={order.id}
                            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-all"
                        >
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                        Đơn hàng #{order.id.split('-')[0].toUpperCase()}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Ngày đặt: {formatDate(order.createdAt || order.created_at)}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${statusConfig?.color || "bg-slate-100 text-slate-700"}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusConfig?.label || status}
                                </span>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-1.5 mb-3">
                                {items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-slate-700 font-medium">
                                            {item.name || item.product?.name} <span className="text-slate-400 font-normal">× {item.quantity}</span>
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {formatPrice(item.subtotal || (item.price * item.quantity) || 0)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Voucher Info */}
                            {voucherName && (
                                <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                                    <p className="text-xs font-semibold text-amber-800">
                                        Voucher áp dụng: <span className="font-bold">{voucherName}</span>
                                    </p>
                                </div>
                            )}

                            {/* Order Footer Breakdown */}
                            <div className="pt-3 border-t border-slate-100">
                                <div className="space-y-1 text-xs text-right mb-3">
                                    <div className="flex justify-end gap-3 text-slate-500">
                                        <span>Tiền hàng:</span>
                                        <span className="font-medium text-slate-700">{formatPrice(baseTotal)}</span>
                                    </div>
                                    {shippingFee > 0 && (
                                        <div className="flex justify-end gap-3 text-slate-500">
                                            <span>Phí vận chuyển:</span>
                                            <span className="font-medium text-slate-700">{formatPrice(shippingFee)}</span>
                                        </div>
                                    )}
                                    {parsedDiscounts.map((d, i) => (
                                        <div key={i} className="flex justify-end gap-3 text-slate-500">
                                            <span>{d.label}:</span>
                                            <span className="text-rose-600 font-semibold">{d.amountStr}</span>
                                        </div>
                                    ))}
                                    {parsedDiscounts.length === 0 && unparsedDiscount > 0 && (
                                        <div className="flex justify-end gap-3 text-slate-500">
                                            <span>Giảm giá / Voucher:</span>
                                            <span className="text-rose-600 font-semibold">- {formatPrice(unparsedDiscount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
                                    <div className="flex flex-wrap gap-2">
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-colors"
                                                >
                                                    Hủy đơn
                                                </button>
                                                <button
                                                    onClick={() => handleEditOrder(order)}
                                                    className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-xl transition-colors"
                                                >
                                                    Sửa đơn
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleReorder(order)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00AFA9] hover:bg-[#009b95] text-white font-bold text-xs rounded-xl transition-colors justify-center"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            Mua lại đơn này
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                        <span className="text-xs font-medium text-slate-500">Tổng thanh toán:</span>
                                        <span className="text-lg sm:text-xl font-bold text-[#00AFA9]">
                                            {formatPrice(order.totalAmount || order.total_amount || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {filteredOrders.length === 0 && (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-800">Không tìm thấy đơn hàng nào</p>
                    <p className="text-xs text-slate-400 mt-1">Các đơn hàng bạn đặt sẽ xuất hiện tại đây</p>
                </div>
            )}
        </div>
    );
}
