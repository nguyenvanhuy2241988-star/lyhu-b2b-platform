"use client";

import { useState, useEffect } from "react";
import {
    loadOrders,
    updateOrderStatus,
    getOrdersSummary,
    filterOrdersByStatus,
    ORDER_STATUS_LABELS,
    type Order,
    type OrderStatus
} from "@/lib/ordersStore";
import { Package, Clock, CheckCircle, XCircle, Search } from "lucide-react";

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
    delivered: {
        label: "Đã giao",
        icon: CheckCircle,
        color: "bg-green-100 text-green-700",
    },
    cancelled: {
        label: "Đã hủy",
        icon: XCircle,
        color: "bg-red-100 text-red-700",
    },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalPending: 0,
        totalProcessing: 0,
        totalDelivered: 0,
        totalCancelled: 0,
        totalRevenue: 0
    });

    const loadData = () => {
        setOrders(loadOrders());
        setStats(getOrdersSummary());
    };

    useEffect(() => {
        loadData();

        // Listen for updates from other tabs/windows
        window.addEventListener("orders-updated", loadData);
        return () => window.removeEventListener("orders-updated", loadData);
    }, []);

    const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
        updateOrderStatus(orderId, newStatus);
        loadData(); // Reload to reflect changes
    };

    // Filter orders by status first, then by search term
    const filteredByStatus = filterOrdersByStatus(orders, statusFilter);
    const filteredOrders = filteredByStatus.filter(order => {
        return (
            (order.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const statusFilters: { value: OrderStatus | "all"; label: string }[] = [
        { value: "all", label: "Tất cả" },
        { value: "pending", label: "Chờ xác nhận" },
        { value: "processing", label: "Đang xử lý" },
        { value: "delivered", label: "Đã giao" },
        { value: "cancelled", label: "Đã hủy" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Theo dõi và xử lý đơn hàng từ tất cả nguồn
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Tổng đơn</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Chờ xử lý</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.totalPending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Đang xử lý</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalProcessing}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Đã giao</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalDelivered}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Đã hủy</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalCancelled}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Doanh thu</p>
                    <p className="text-xl font-bold text-primary-600 mt-1 truncate" title={formatPrice(stats.totalRevenue)}>
                        {new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short", currency: "VND", style: "currency" }).format(stats.totalRevenue)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === filter.value
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-500"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn, tên khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                                <th className="px-6 py-3 font-medium text-center">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredOrders.length === 0 ? (
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
                                            <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">{order.customerName}</p>
                                                <p className="text-xs text-slate-500">{order.items.length} sản phẩm</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${order.source === "CUSTOMER"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {order.source}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                                {formatPrice(order.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                                                    className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                >
                                                    <option value="pending">Chờ xác nhận</option>
                                                    <option value="processing">Đang xử lý</option>
                                                    <option value="delivered">Đã giao</option>
                                                    <option value="cancelled">Hủy đơn</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
