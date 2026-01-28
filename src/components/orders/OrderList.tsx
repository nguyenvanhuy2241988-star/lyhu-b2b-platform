'use client';

import { useState, useEffect, useCallback } from "react";
import {
    fetchOrders,
    updateOrderStatus,
    ORDER_STATUS_LABELS,
    type Order,
    type OrderStatus,
    FRAUD_STATUS_LABELS,
} from "@/lib/ordersStore";
import { supabase } from "@/lib/supabaseClient";
import { scanOrdersForFraud } from "@/lib/fraudScan";
import {
    Package, Clock, CheckCircle, XCircle, Search, Calendar,
    AlertTriangle, ShieldAlert, ArrowUpDown, Filter, Download, MessageCircle, Eye, Trash2, Truck, RotateCcw, Edit
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { exportOrdersToCSV } from "@/lib/exportCSV";
import { notifyNewOrder } from "@/hooks/useNotification";
import { OrderChatModal } from "@/components/orders/OrderChatModal";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal"; // Added import
import { getOrdersWithUnreadMessages } from "@/lib/orderChatStore";
import { OrderEditModal } from "@/components/orders/OrderEditModal";

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
        icon: Truck,
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
};

const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 7) return '***';
    return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
};

const maskAddress = (address?: string) => {
    if (!address) return '---';
    // Try to keep city/district if possible, otherwise simple mask
    return "Thông tin bị ẩn";
};

interface OrderListProps {
    readOnly?: boolean;
    maskSensitiveData?: boolean;
    hideRevenue?: boolean;
}

export default function OrderList({ readOnly = false, maskSensitiveData = false, hideRevenue = false }: OrderListProps) {
    const { user, session, role } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [chatOrder, setChatOrder] = useState<{ id: string; readableId: string } | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // Added state
    const [editOrder, setEditOrder] = useState<Order | null>(null); // Edit state
    const [unreadOrders, setUnreadOrders] = useState<Set<string>>(new Set());

    // Stats calculated from REAL data
    const stats = {
        totalOrders: orders.length,
        totalPending: orders.filter(o => o.status === 'pending').length,
        totalProcessing: orders.filter(o => o.status === 'processing').length,
        totalDelivered: orders.filter(o => o.status === 'delivered').length,
        totalCancelled: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders.filter(o => o.status !== 'cancelled' && o.status !== 'draft')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };

    const loadData = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            // Pass role explicit to RPC to avoid permission lookup failures
            const data = await fetchOrders(session?.access_token, { role: role || undefined });
            setOrders(data);

            if (data.length > 0) {
                const unread = await getOrdersWithUnreadMessages(data.map(o => o.id), session?.access_token);
                setUnreadOrders(unread);
            }
        } catch (err) {
            console.error('[OrderList] Failed to load data:', err);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [session?.access_token, role]);

    useEffect(() => {
        try {
            scanOrdersForFraud();
        } catch (e) {
            console.error("Fraud scan failed:", e);
        }

        loadData();

        if (!session?.access_token) return;

        const channel = supabase
            .channel('orders_global_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload: any) => {
                    console.log('[OrderList] Realtime change detected');
                    if (payload.eventType === 'INSERT' && payload.new) {
                        const newOrder = payload.new as any;
                        // Avoid notifying if user created it themselves? Or just notify all.
                        notifyNewOrder(
                            newOrder.id,
                            newOrder.customer_name || 'Khách hàng',
                            newOrder.total_amount || 0
                        );
                    }
                    loadData(true);
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') loadData(true);
            });

        const chatChannel = supabase
            .channel('orders_chat_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'order_messages' },
                (payload: any) => {
                    const newMsg = payload.new as any;
                    if (newMsg?.order_id) {
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
            supabase.removeChannel(channel);
            supabase.removeChannel(chatChannel);
        };
    }, [session?.access_token, loadData]);

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        if (readOnly) return;

        const userId = user?.id;
        if (!userId) {
            alert("❌ Vui lòng đăng nhập lại");
            return;
        }
        const success = await updateOrderStatus(orderId, newStatus, userId, session?.access_token);
        if (success) {
            loadData(true);
        } else {
            alert("❌ Lỗi: Không thể cập nhật trạng thái.");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        const term = searchTerm.toLowerCase();
        // Masked search? Users might want to search by last digits of phone even if masked?
        // For security, if masked, maybe we shouldn't allow searching by full phone?
        // But for "Sales Admin" supporting customers, they might search by name.
        const matchesSearch =
            (order.id || "").toLowerCase().includes(term) ||
            (order.customerName || "").toLowerCase().includes(term) ||
            (order.receiverPhone || "").includes(searchTerm) || // Still allow searching by phone underlying data? Or strict? 
            // If masked, users might not know the phone to search. Let's allow search for now but display masked.
            (order.readableId?.toString() || "").includes(searchTerm);

        let matchesDates = true;
        if (startDate || endDate) {
            const orderDate = new Date(order.createdAt).getTime();
            if (startDate) {
                const start = new Date(startDate).setHours(0, 0, 0, 0);
                if (orderDate < start) matchesDates = false;
            }
            if (endDate) {
                const end = new Date(endDate).setHours(23, 59, 59, 999);
                if (orderDate > end) matchesDates = false;
            }
        }

        return matchesStatus && matchesSearch && matchesDates;
    });

    const statusFilters: { value: OrderStatus | "all"; label: string }[] = [
        { value: "all", label: "Tất cả" },
        { value: "pending", label: "Chờ xác nhận" },
        { value: "processing", label: "Đang xử lý" },
        { value: "delivering", label: "Đang giao hàng" },
        { value: "delivered", label: "Đã giao" },
        { value: "returned", label: "Hoàn hàng" },
        { value: "cancelled", label: "Đã hủy" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Theo dõi và xử lý đơn hàng từ tất cả nguồn
                    </p>
                </div>
                {!readOnly && !hideRevenue && (
                    <button
                        onClick={() => exportOrdersToCSV(filteredOrders)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        disabled={isLoading || orders.length === 0}
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                    { label: "Tổng đơn", value: stats.totalOrders, color: "text-slate-900", icon: Package },
                    { label: "Chờ xử lý", value: stats.totalPending, color: "text-amber-600", icon: Clock },
                    { label: "Đang xử lý", value: stats.totalProcessing, color: "text-blue-600", icon: Package },
                    { label: "Đã giao", value: stats.totalDelivered, color: "text-emerald-600", icon: CheckCircle },
                    { label: "Đã hủy", value: stats.totalCancelled, color: "text-rose-600", icon: XCircle },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{stat.label}</p>
                        <p className={`text-xl font-bold ${stat.color} mt-1`}>{isLoading ? '-' : stat.value}</p>
                    </div>
                ))}
                {!hideRevenue && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Doanh thu</p>
                        <p className="text-xl font-bold text-primary-600 mt-1 truncate">
                            {isLoading ? '-' : new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short", currency: "VND", style: "currency" }).format(stats.totalRevenue)}
                        </p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Status Pills */}
                    <div className="flex flex-wrap gap-2">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === filter.value
                                    ? "bg-slate-900 text-white"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-28 uppercase"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-300 font-bold mx-1">-</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-28 uppercase"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(""); setEndDate(""); }}
                                    className="ml-2 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm thông minh: Tên khách, Số điện thoại, Mã đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm font-medium"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã đơn</th>
                                <th className="px-6 py-3 font-medium">Khách hàng</th>
                                <th className="px-6 py-3 font-medium">Nguồn</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                                {!hideRevenue && <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>}
                                <th className="px-6 py-3 font-medium text-center">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Không tìm thấy đơn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const normalizedStatus = (order.status || "pending").toLowerCase() as keyof typeof STATUS_CONFIG;
                                    const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusConfig.icon;
                                    const isCompleted = normalizedStatus === "delivered" || normalizedStatus === "cancelled";

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`hover:bg-slate-50 transition-colors ${isCompleted ? "opacity-75" : ""}`}
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {order.readableId ? `#${order.readableId}` : order.id}
                                                {order.flagged && (
                                                    <span className="block mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Gian lận
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">{order.customerName}</p>
                                                {maskSensitiveData ? (
                                                    <p className="text-xs text-slate-400">
                                                        {maskPhone(order.receiverPhone)} | {maskAddress(order.receiverAddress)}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-slate-500">
                                                        {order.receiverPhone}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-0.5">{order.items?.length ?? 0} sản phẩm</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${order.source === "CUSTOMER"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : order.source === "CTV"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {order.source}
                                                </span>
                                                {order.creatorName && (
                                                    <div className="text-xs text-slate-500 mt-1 font-medium">
                                                        {order.creatorName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                            {!hideRevenue && (
                                                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                                    {formatPrice(order.totalAmount)}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setChatOrder({ id: order.id, readableId: String(order.readableId || order.id.slice(0, 8)) })}
                                                        className="relative p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Chat"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        {unreadOrders.has(order.id) && (
                                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {readOnly ? (
                                                        <div className="px-2 py-1 bg-slate-100 text-slate-400 text-xs rounded">
                                                            Chỉ xem
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                                                            className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                            disabled={readOnly}
                                                        >
                                                            <option value="pending">Chờ xác nhận</option>
                                                            <option value="processing">Đang xử lý</option>
                                                            <option value="delivering">Đang giao hàng</option>
                                                            <option value="delivered">Đã giao</option>
                                                            <option value="returned">Hoàn hàng</option>
                                                            <option value="cancelled">Hủy đơn</option>
                                                        </select>
                                                    )}

                                                    {role !== 'warehouse' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không? Hành động này không thể hoàn tác.")) {
                                                                    const { deleteOrder } = await import("@/lib/ordersStore");
                                                                    const success = await deleteOrder(order.id);
                                                                    if (success) {
                                                                        // Realtime subscription should handle removal, or we can manually trigger reload
                                                                        loadData(true);
                                                                    }
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa đơn hàng"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />

            <OrderEditModal
                isOpen={!!editOrder}
                order={editOrder}
                onClose={() => setEditOrder(null)}
                onSuccess={() => loadData(true)}
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
