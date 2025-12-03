"use client";

import { useState, useEffect } from "react";
import { loadOrders, type Order } from "@/lib/ordersStore";
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

export default function SalesOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Load only SALES orders
        const allOrders = loadOrders();
        const salesOrders = allOrders.filter(o => o.source === "SALES");
        setOrders(salesOrders);
    }, []);

    const filteredOrders = orders.filter(order =>
        (order.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Đơn hàng Sales</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Quản lý đơn hàng do Sales tạo
                </p>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã đơn</th>
                                <th className="px-6 py-3 font-medium">Khách hàng</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Chưa có đơn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const normalizedStatus = (order.status || "pending").toLowerCase() as keyof typeof STATUS_CONFIG;
                                    const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                                            <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                                {formatPrice(order.totalAmount)}
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
