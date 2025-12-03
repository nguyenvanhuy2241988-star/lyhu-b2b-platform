"use client";

import { useState, useMemo, useEffect } from "react";
import { loadOrders, getOrdersByCustomer, type Order } from "@/lib/ordersStore";
import { getCurrentUser } from "@/lib/auth";
import { Package, Clock, CheckCircle, XCircle, Filter } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

{ value: "PENDING", label: "Chờ xác nhận" },
{ value: "PROCESSING", label: "Đang xử lý" },
{ value: "DELIVERED", label: "Đã giao" },
{ value: "CANCELLED", label: "Đã hủy" },
];

export default function OrdersPage() {
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            // Use helper function
            const customerOrders = getOrdersByCustomer(user.id);
            setOrders(customerOrders);
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

    const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.status === "PENDING").length,
        processing: orders.filter((o) => o.status === "PROCESSING").length,
        delivered: orders.filter((o) => o.status === "DELIVERED").length,
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
                    const status = order.status;
                    const statusConfig = STATUS_CONFIG[status];
                    const StatusIcon = statusConfig?.icon || Package;
                    const items = order.items || [];

                    return (
                        <div
                            key={order.id}
                            className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-1">{order.id}</h3>
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
                                {items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600">
                                            {item.name} <span className="text-slate-400">× {item.quantity}</span>
                                        </span>
                                        <span className="font-medium text-slate-900">
                                            {formatPrice(item.subtotal)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200">
                                <div>
                                    {/* Delivery date can be added to Order type later if needed */}
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                    <p className="text-sm text-slate-600">Tổng tiền:</p>
                                    <p className="text-xl font-bold text-primary-600">{formatPrice(order.totalAmount)}</p>
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
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                        <td className="px-6 py-4 text-slate-600">{order.items.length} sản phẩm</td>
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
