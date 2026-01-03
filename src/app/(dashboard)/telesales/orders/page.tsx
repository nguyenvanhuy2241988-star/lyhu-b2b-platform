"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Eye, FileText, MessageCircle } from "lucide-react";
import { fetchOrders } from "@/lib/ordersStore";
import { supabase } from "@/lib/supabaseClient"
import type { Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
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

export default function TelesalesOrdersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
                            <option value="delivered">Đã giao</option>
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
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50">
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
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'processing'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : order.status === 'delivered'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {order.status === 'processing'
                                                ? 'Đang xử lý'
                                                : order.status === 'delivered'
                                                    ? 'Đã giao'
                                                    : order.status === 'cancelled'
                                                        ? 'Đã hủy' : 'Chờ xác nhận'}
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
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

            {/* Chat Modal */}
            {chatOrder && (
                <OrderChatModal
                    isOpen={!!chatOrder}
                    onClose={() => setChatOrder(null)}
                    orderId={chatOrder.id}
                    orderReadableId={chatOrder.readableId}
                    onMarkAsRead={() => {
                        setUnreadOrders(prev => {
                            const next = new Set(prev);
                            next.delete(chatOrder.id);
                            return next;
                        });
                    }}
                />
            )}
        </div>
    );
}
