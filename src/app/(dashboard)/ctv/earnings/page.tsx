"use client";

import { useEffect, useState, useMemo } from "react";
import { loadOrders, type Order, ORDER_STATUS_LABELS } from "@/lib/ordersStore";
import { getCurrentUser } from "@/lib/auth";
import { getCtvOrders, getCtvMonthlySummary } from "@/lib/ctvAnalytics";
import { Wallet, TrendingUp, Package, CheckCircle, Filter } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function CTVEarningsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Month selection state
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

    useEffect(() => {
        (async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
            if (user) {
                const allOrders = loadOrders();
                const ctvOrders = getCtvOrders(allOrders, user.id);
                setOrders(ctvOrders);
            }
        })();
    }, []);

    const stats = useMemo(() => {
        return getCtvMonthlySummary(orders, selectedYear, selectedMonth);
    }, [orders, selectedMonth, selectedYear]);

    const kpiCards = [
        {
            label: "Doanh số Tự giao hàng",
            subLabel: `Tháng ${selectedMonth}`,
            value: formatPrice(stats.selfShipSales),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Doanh số LYHU giao",
            subLabel: `Tháng ${selectedMonth}`,
            value: formatPrice(stats.lyhuShipSales),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Tổng hoa hồng tháng",
            subLabel: `Tháng ${selectedMonth}`,
            value: formatPrice(stats.totalCommission),
            icon: Wallet,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
        {
            label: "Hoa hồng thực nhận",
            subLabel: "(Đã giao thành công)",
            value: formatPrice(stats.payableCommission),
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Thu nhập & Hoa hồng</h1>
                    <p className="text-slate-600">Theo dõi doanh số và hoa hồng của bạn</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <Filter className="w-4 h-4 text-slate-500 ml-2" />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                    <span className="text-slate-400">/</span>
                    <span className="text-sm font-medium text-slate-700 mr-2">{selectedYear}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${card.bg}`}>
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{card.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                                {card.subLabel && (
                                    <p className="text-xs text-slate-500 mt-1">{card.subLabel}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Chi tiết đơn hàng tháng {selectedMonth}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã đơn</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                                <th className="px-6 py-3 font-medium">Hình thức</th>
                                <th className="px-6 py-3 font-medium">Tổng tiền</th>
                                <th className="px-6 py-3 font-medium">Hoa hồng</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {stats.monthlyOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Không có đơn hàng nào trong tháng này
                                    </td>
                                </tr>
                            ) : (
                                stats.monthlyOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.fulfillmentMode === "SELF_SHIP"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-purple-100 text-purple-700"
                                                }`}>
                                                {order.fulfillmentMode === "SELF_SHIP" ? "Tự giao" : "LYHU giao"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-green-600">
                                            {order.ctvCommission ? formatPrice(order.ctvCommission) : "0 ₫"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === "delivered"
                                                ? "bg-green-100 text-green-700"
                                                : order.status === "cancelled"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {ORDER_STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
