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
        color: "bg-yellow-100 text-yellow-700",
    },
    processing: {
        label: "Đang xử lý",
        icon: Package,
        color: "bg-blue-100 text-blue-700",
    },
    delivering: {
        label: "Đang giao hàng",
        icon: Package,
        color: "bg-indigo-100 text-indigo-700",
    },
    delivered: {
        label: "Đã giao",
        icon: CheckCircle,
        color: "bg-green-100 text-green-700",
    },
    returned: {
        label: "Hoàn hàng",
        icon: RotateCcw,
        color: "bg-orange-100 text-orange-700",
    },
    cancelled: {
        label: "Đã hủy",
        icon: XCircle,
        color: "bg-red-100 text-red-700",
    },
    draft: {
        label: "Nháp",
        icon: Package,
        color: "bg-gray-100 text-gray-700",
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
                    newCart[item.product.id] = {
                        product: item.product,
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Lịch sử đơn hàng</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Theo dõi tất cả đơn hàng của bạn
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng đơn</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Chờ xác nhận</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Đang xử lý</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Đã giao</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Lọc theo trạng thái</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {ORDER_STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedStatus(option.value)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedStatus === option.value
                                ? "bg-primary-500 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List - Mobile Friendly */}
            <div className="space-y-4">
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
                    // Base total calculated from items. If it's vastly off due to wholesale bugs in DB, we reverse it:
                    let baseTotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || (item.price * item.quantity) || 0), 0);
                    const shippingFee = order.shippingFee || 0;
                    
                    // Fallback to parsed discounts if DB `totalAmount` doesn't match `baseTotal` well
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
                            className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-1">Đơn hàng #{order.id.split('-')[0].toUpperCase()}</h3>
                                    <p className="text-sm text-slate-600">
                                        Ngày đặt: {formatDate(order.createdAt)}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig?.color || "bg-gray-100 text-gray-700"}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {statusConfig?.label || status}
                                </span>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2 mb-4">
                                {items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600">
                                            {item.name} <span className="text-slate-400">× {item.quantity}</span>
                                        </span>
                                        <span className="font-medium text-slate-900">
                                            {formatPrice(item.subtotal || 0)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Voucher Info */}
                            {voucherName && (
                                <div className="mb-4 bg-orange-50/80 border border-orange-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-orange-500 shrink-0" />
                                    <p className="text-sm font-medium text-orange-700">
                                        Voucher áp dụng: <span className="font-bold">{voucherName}</span>
                                    </p>
                                </div>
                            )}

                            {/* Order Footer Breakdown */}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="space-y-2 text-sm text-right mb-4">
                                    <div className="flex justify-end gap-4 text-slate-600">
                                        <span className="w-48">Tổng tiền hàng:</span>
                                        <span className="w-28">{formatPrice(baseTotal)}</span>
                                    </div>
                                    {shippingFee > 0 && (
                                        <div className="flex justify-end gap-4 text-slate-600">
                                            <span className="w-48">Phí vận chuyển:</span>
                                            <span className="w-28">{formatPrice(shippingFee)}</span>
                                        </div>
                                    )}
                                    {parsedDiscounts.map((d, i) => (
                                        <div key={i} className="flex justify-end gap-4 text-slate-600">
                                            <span className="w-48">{d.label}:</span>
                                            <span className="w-28 text-red-500">{d.amountStr}</span>
                                        </div>
                                    ))}
                                    {parsedDiscounts.length === 0 && unparsedDiscount > 0 && (
                                        <div className="flex justify-end gap-4 text-slate-600">
                                            <span className="w-48">Giảm giá / Voucher:</span>
                                            <span className="w-28 text-red-500">- {formatPrice(unparsedDiscount)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
                                    <div className="flex flex-wrap gap-2">
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm rounded-lg transition-colors"
                                                >
                                                    Hủy đơn
                                                </button>
                                                <button
                                                    onClick={() => handleEditOrder(order)}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm rounded-lg transition-colors"
                                                >
                                                    Sửa đơn
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleReorder(order)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium text-sm rounded-lg transition-colors justify-center"
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            Mua lại đơn này
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <p className="text-sm font-medium text-slate-700">Thành tiền:</p>
                                        <p className="text-2xl font-bold text-primary-600">{formatPrice(order.totalAmount)}</p>
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
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Không tìm thấy đơn hàng nào</p>
                </div>
            )}

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">
                        Danh sách đơn hàng
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({filteredOrders.length} đơn)
                        </span>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã đơn</th>
                                <th className="px-6 py-3 font-medium">Ngày đặt</th>
                                <th className="px-6 py-3 font-medium">Sản phẩm</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredOrders.map((order) => {
                                const normalizedStatus = (order.status || "pending").toLowerCase() as keyof typeof STATUS_CONFIG;
                                const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
                                const StatusIcon = statusConfig?.icon || Package;

                                return (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">#{order.id.split('-')[0].toUpperCase()}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                        <td className="px-6 py-4 text-slate-600">{order.items?.length ?? 0} sản phẩm</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig?.color || "bg-gray-100 text-gray-700"}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusConfig?.label || status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
