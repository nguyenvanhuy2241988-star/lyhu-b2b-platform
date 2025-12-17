"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, FileText } from "lucide-react";
import { fetchOrders } from "@/lib/ordersStore"; // Changed to fetchOrders
import type { Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";

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

    const { user } = useAuth();

    useEffect(() => {
        const fetchOrdersData = async () => {
            if (!user) return;
            setIsLoading(true);
            const all = await fetchOrders(); // Use Async Fetch

            // Filter
            const myOrders = all.filter(o =>
                o.source === "TELESALES"
                // && o.telesalesUserId === user.id // Uncomment if RLS isn't strict enough
            );
            setOrders(myOrders);
            setIsLoading(false);
        };
        fetchOrdersData();
    }, [user]);

    // Apply filters
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
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
                                        <button className="text-slate-400 hover:text-primary-600 transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </button>
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
        </div>
    );
}
