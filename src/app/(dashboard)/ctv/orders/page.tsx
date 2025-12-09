"use client";

import { useState, useMemo, useEffect } from "react";
import { loadOrders, getOrdersSummary, type Order, ORDER_STATUS_LABELS } from "@/lib/ordersStore";
import { getCurrentUser } from "@/lib/auth";
import { Package, Clock, CheckCircle, XCircle, Filter, Truck, DollarSign } from "lucide-react";

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

const ORDER_STATUS_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "processing", label: "Đang xử lý" },
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Đã hủy" },
];

export default function CTVOrdersPage() {
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
        if (user) {
            const allOrders = loadOrders();
            // Filter orders for this CTV
            const ctvOrders = allOrders.filter(o => o.ctvId === user.id);
            setOrders(ctvOrders);
        }
    }, []);

    const filteredOrders = useMemo(() => {
        if (!orders || !Array.isArray(orders)) {
            return [];
        }
        if (selectedStatus === "ALL") {
            return orders;
        }
        return orders.filter((order) => order.status === selectedStatus);
    }, [orders, selectedStatus]);

    const stats = useMemo(() => {
        const activeOrders = orders.filter(o => o.status !== "cancelled");
        return {
            totalOrders: orders.length,
            totalSales: activeOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            totalCommission: activeOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0),
        };
    }, [orders]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng & Hoa hồng</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Theo dõi đơn hàng và thu nhập của bạn
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng doanh số</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{formatPrice(stats.totalSales)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng hoa hồng / Chiết khấu</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(stats.totalCommission)}</p>
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

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.map((order) => {
                    const status = order.status;
                    const statusConfig = STATUS_CONFIG[status];
                    const StatusIcon = statusConfig?.icon || Package;
                    const isSelfShip = order.fulfillmentMode === "SELF_SHIP";

                    return (
                        <div
                            key={order.id}
                            className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-slate-900">{order.id}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${isSelfShip ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                                            {isSelfShip ? "Tự ship" : "LYHU giao"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Ngày đặt: {formatDate(order.createdAt)} • {order.items.length} sản phẩm
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig?.color || "bg-gray-100 text-gray-700"}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {statusConfig?.label || status}
                                </span>
                            </div>

                            {/* Order Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Khách hàng</p>
                                    <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                                    {order.receiverPhone && (
                                        <p className="text-xs text-slate-500">{order.receiverPhone}</p>
                                    )}
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-xs text-slate-500 mb-1">
                                        {isSelfShip ? "Giá trị hàng nhập" : "Giá trị đơn hàng khách"}
                                    </p>
                                    <p className="text-lg font-bold text-slate-900">{formatPrice(order.totalAmount)}</p>
                                </div>
                            </div>

                            {/* Commission Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-green-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 py-3 rounded-b-xl">
                                <div className="flex items-center gap-2 text-green-700">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {isSelfShip ? "Chiết khấu nhập:" : "Hoa hồng đơn hàng:"}
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-green-700">
                                    {formatPrice(order.ctvCommission || 0)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {filteredOrders.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Chưa có đơn hàng nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}
