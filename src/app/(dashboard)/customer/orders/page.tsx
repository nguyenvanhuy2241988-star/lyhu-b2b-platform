"use client";

import { useState, useMemo } from "react";
import { mockOrders } from "@/mocks/data";
import type { CustomerOrder } from "@/mocks/data";
import { Package, Clock, CheckCircle, XCircle, Filter } from "lucide-react";

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
        iconColor: "text-yellow-600",
    },
    processing: {
        label: "Đang xử lý",
        icon: Package,
        color: "bg-blue-100 text-blue-700",
        iconColor: "text-blue-600",
    },
    delivered: {
        label: "Đã giao",
        icon: CheckCircle,
        color: "bg-green-100 text-green-700",
        iconColor: "text-green-600",
    },
    cancelled: {
        label: "Đã hủy",
        icon: XCircle,
        color: "bg-red-100 text-red-700",
        iconColor: "text-red-600",
    },
};

const FILTER_OPTIONS = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "processing", label: "Đang xử lý" },
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Đã hủy" },
];

export default function OrdersPage() {
    const [selectedStatus, setSelectedStatus] = useState("all");
    // ✅ FIX: Ensure default empty array to prevent undefined errors
    const [orders] = useState<CustomerOrder[]>(mockOrders || []);

    const filteredOrders = useMemo(() => {
        // ✅ Safe array check
        if (!orders || !Array.isArray(orders)) {
            return [];
        }
        if (selectedStatus === "all") {
            return orders;
        }
        return orders.filter((order) => order?.status === selectedStatus);
    }, [orders, selectedStatus]);

    // ✅ FIX: Safe stats calculation with optional chaining
    const stats = {
        total: orders?.length || 0,
        pending: orders?.filter((o) => o?.status === "pending")?.length || 0,
        processing: orders?.filter((o) => o?.status === "processing")?.length || 0,
        delivered: orders?.filter((o) => o?.status === "delivered")?.length || 0,
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
                    {FILTER_OPTIONS.map((option) => (
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
                    // ✅ Safe access to order properties
                    const status = order?.status || "pending";
                    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConfig?.icon || Package;
                    const items = order?.items || [];

                    return (
                        <div
                            key={order.id}
                            className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-1">{order.orderNumber || "N/A"}</h3>
                                    <p className="text-sm text-slate-600">
                                        Ngày đặt: {formatDate(order.createdAt || new Date().toISOString())}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig?.color || "bg-gray-100 text-gray-700"}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {statusConfig?.label || "N/A"}
                                </span>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2 mb-4">
                                {items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600">
                                            {item?.productName || "Sản phẩm"} <span className="text-slate-400">× {item?.quantity || 0}</span>
                                        </span>
                                        <span className="font-medium text-slate-900">
                                            {formatPrice((item?.price || 0) * (item?.quantity || 0))}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200">
                                <div>
                                    {order.deliveryDate && (
                                        <p className="text-sm text-slate-600">
                                            Ngày giao: {formatDate(order.deliveryDate)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                    <p className="text-sm text-slate-600">Tổng tiền:</p>
                                    <p className="text-xl font-bold text-primary-600">{formatPrice(order.totalAmount || 0)}</p>
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
                                const status = order?.status || "pending";
                                const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                                const StatusIcon = statusConfig?.icon || Package;

                                return (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.orderNumber || "N/A"}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt || new Date().toISOString())}</td>
                                        <td className="px-6 py-4 text-slate-600">{order.items?.length || 0} sản phẩm</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig?.color || "bg-gray-100 text-gray-700"}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusConfig?.label || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                            {formatPrice(order.totalAmount || 0)}
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
