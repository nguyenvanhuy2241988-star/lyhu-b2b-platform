"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Eye, FileText, MessageCircle, Pencil, Trash2, Clock, Package, CheckCircle, XCircle, Truck, RotateCcw, Scale, UserCheck, StickyNote } from "lucide-react";
import { fetchOrders, SHIPPING_CARRIERS } from "@/lib/ordersStore";
import { supabase } from "@/lib/supabaseClient"
import type { Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { OrderEditModal } from "@/components/orders/OrderEditModal";
import { OrderChatModal } from "@/components/orders/OrderChatModal";
import { getOrdersWithUnreadMessages } from "@/lib/orderChatStore";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    } catch {
        return dateString;
    }
};

const STATUS_CONFIG: Record<string, any> = {
    pending: {
        label: "Chờ xác nhận",
        icon: Filter, // Placeholder if Clock not imported, but let's check imports
        color: "bg-yellow-100 text-yellow-700",
    },
    processing: {
        label: "Đang xử lý",
        icon: FileText, // Placeholder
        color: "bg-blue-100 text-blue-700",
    },
    delivering: {
        label: "Đang giao hàng",
        icon: Truck,
        color: "bg-indigo-100 text-indigo-700",
    },
    delivered: {
        label: "Đã giao",
        icon: Eye, // Placeholder
        color: "bg-green-100 text-green-700",
    },
    returned: {
        label: "Hoàn hàng",
        icon: RotateCcw,
        color: "bg-orange-100 text-orange-700",
    },
    cancelled: {
        label: "Đã hủy",
        icon: Trash2,
        color: "bg-red-100 text-red-700",
    },
};

export default function TelesalesOrdersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editOrder, setEditOrder] = useState<Order | null>(null); // Added edit state
    const [chatOrder, setChatOrder] = useState<{ id: string; readableId: string } | null>(null);
    const [unreadOrders, setUnreadOrders] = useState<Set<string>>(new Set());

    const { user, session, isLoading: authIsLoading } = useAuth(); // ADDED session

    const loadOrders = useCallback(async (mounted = true) => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Pass token to fetchOrders
            const all = await fetchOrders(session?.access_token);

            if (!mounted) return;
            setOrders(all || []);

            // Check unread messages
            if (all && all.length > 0) {
                const unread = await getOrdersWithUnreadMessages(all.map(o => o.id), session?.access_token);
                if (mounted) setUnreadOrders(unread);
            }
        } catch (error) {
            console.error("[TelesalesOrders] Error:", error);
            if (mounted) setOrders([]);
        } finally {
            if (mounted) setIsLoading(false);
        }
    }, [user, session?.access_token]);

    useEffect(() => {
        let mounted = true;

        if (user?.id) {
            loadOrders(mounted);
        } else if (!authIsLoading) {
            setIsLoading(false);
        }

        // Realtime Subscription
        const channel = supabase
            .channel('telesales_orders_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    loadOrders(mounted);
                }
            )
            .subscribe();

        // Realtime subscription for chat messages (badge updates)
        const chatChannel = supabase
            .channel('telesales_chat_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'order_messages' },
                (payload: any) => {
                    const newMsg = payload.new as any;
                    if (newMsg?.order_id) {
                        // Add to unread orders (show badge)
                        setUnreadOrders(prev => {
                            const next = new Set(prev);
                            next.add(newMsg.order_id);
                            return next;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
            supabase.removeChannel(chatChannel);
        };
    }, [user, session?.access_token, authIsLoading, loadOrders]);

    // Apply filters
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            (order.readableId?.toString() || "").includes(searchTerm) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Handle mark as read
    const handleMarkAsRead = useCallback(() => {
        if (!chatOrder?.id) return;
        setUnreadOrders(prev => {
            const next = new Set(prev);
            next.delete(chatOrder.id);
            return next;
        });
    }, [chatOrder?.id]);

    if (isLoading) return <div className="p-6">Đang tải đơn hàng...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Đơn hàng của tôi</h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Mã đơn, tên khách..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="delivering">Đang giao hàng</option>
                            <option value="delivered">Đã giao</option>
                            <option value="returned">Hoàn hàng</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã đơn hàng</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                                <th className="px-6 py-3 font-medium">Khách hàng</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                                <th className="px-6 py-3 font-medium text-center">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((order) => {
                                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                const StatusIcon = statusConfig.icon;

                                const hasShippingData = order.shippingCarrier || order.trackingCode || order.packedByName || (order.totalBoxes && order.totalBoxes > 0) || order.shippingFee || order.shippingNote;
                                return (
                                    <React.Fragment key={order.id}>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                ORD-{order.readableId}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{order.customerName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                {formatPrice(order.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                                                >
                                                    {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setChatOrder({ id: order.id, readableId: String(order.readableId || order.id.slice(0, 8)) })}
                                                        className="relative text-slate-400 hover:text-primary-600 transition-colors bg-slate-50 hover:bg-primary-50 p-2 rounded-lg"
                                                        title="Chat"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        {unreadOrders.has(order.id) && (
                                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={() => router.push(`/telesales/create-order?edit=${order.id}`)}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 p-2 rounded-lg"
                                                            title="Sửa đơn hàng"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
                                                                const { deleteOrder } = await import("@/lib/ordersStore");
                                                                const success = await deleteOrder(order.id);
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 p-2 rounded-lg"
                                                        title="Xóa đơn hàng"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {hasShippingData && (
                                            <tr className="bg-blue-50/40 border-b border-slate-100">
                                                <td colSpan={6} className="px-6 py-2">
                                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                                                        {order.shippingCarrier && (
                                                            <span className="inline-flex items-center gap-1 text-slate-600">
                                                                <Truck className="w-3 h-3 text-blue-500" />
                                                                <strong>{SHIPPING_CARRIERS.find((c: any) => c.value === order.shippingCarrier)?.label || order.shippingCarrier}</strong>
                                                                {order.trackingCode && (
                                                                    <span className="text-blue-600 font-mono font-medium ml-1">{order.trackingCode}</span>
                                                                )}
                                                            </span>
                                                        )}
                                                        {order.packedByName && (
                                                            <span className="inline-flex items-center gap-1 text-slate-600">
                                                                <UserCheck className="w-3 h-3 text-emerald-500" />
                                                                Đóng: <strong>{order.packedByName}</strong>
                                                            </span>
                                                        )}
                                                        {order.totalBoxes && order.totalBoxes > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-slate-600">
                                                                <Package className="w-3 h-3 text-amber-500" />
                                                                {order.totalBoxes} thùng
                                                                {order.shippingBoxes && order.shippingBoxes.length > 0 && (
                                                                    <span className="text-slate-400 ml-0.5">
                                                                        ({order.shippingBoxes.map((b: any, i: number) => `${b.qty && b.qty > 1 ? b.qty + '× ' : ''}${b.length_cm || 0}x${b.width_cm || 0}x${b.height_cm || 0}cm`).join(', ')})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : null}
                                                        {order.totalWeightKg && order.totalWeightKg > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-slate-600">
                                                                <Scale className="w-3 h-3 text-purple-500" />
                                                                {order.totalWeightKg} kg
                                                            </span>
                                                        ) : null}
                                                        {order.shippingFee && order.shippingFee > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                                                                Phí VC: {formatPrice(order.shippingFee)}
                                                            </span>
                                                        ) : null}
                                                        {order.shippingNote && (
                                                            <span className="inline-flex items-center gap-1 text-slate-500 italic">
                                                                <StickyNote className="w-3 h-3 text-slate-400" />
                                                                {order.shippingNote}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="w-8 h-8 text-slate-300" />
                                            <p>Chưa có đơn hàng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDetailsModal
                isOpen={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />

            <OrderEditModal
                isOpen={!!editOrder}
                order={editOrder}
                onClose={() => setEditOrder(null)}
                onSuccess={() => loadOrders(true)}
            />

            {/* Chat Modal */}
            {chatOrder && (
                <OrderChatModal
                    isOpen={!!chatOrder}
                    onClose={() => setChatOrder(null)}
                    orderId={chatOrder.id}
                    orderReadableId={chatOrder.readableId}
                    onMarkAsRead={handleMarkAsRead}
                />
            )}
        </div>
    );
}
