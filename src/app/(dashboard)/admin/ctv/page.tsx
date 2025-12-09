"use client";

import { useEffect, useState, useMemo } from "react";
import { loadOrders, type Order } from "@/lib/ordersStore";
import { getAdminCtvLeaderboard } from "@/lib/ctvAnalytics";
import { Users, TrendingUp, Wallet, CheckCircle, Download, Search } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function AdminCtvPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const allOrders = loadOrders();
        setOrders(allOrders);
    }, []);

    const performanceData = useMemo(() => {
        return getAdminCtvLeaderboard(orders);
    }, [orders]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return performanceData;
        const lowerTerm = searchTerm.toLowerCase();
        return performanceData.filter(p =>
            p.ctvName.toLowerCase().includes(lowerTerm) ||
            p.ctvId.toLowerCase().includes(lowerTerm)
        );
    }, [performanceData, searchTerm]);

    const stats = useMemo(() => {
        return performanceData.reduce((acc, curr) => ({
            totalOrders: acc.totalOrders + curr.totalOrders,
            totalSales: acc.totalSales + curr.totalSales,
            totalCommission: acc.totalCommission + curr.totalCommission,
            payableCommission: acc.payableCommission + curr.payableCommission,
        }), {
            totalOrders: 0,
            totalSales: 0,
            totalCommission: 0,
            payableCommission: 0,
        });
    }, [performanceData]);

    const handleExportCsv = () => {
        const headers = ["CTV ID", "Tên CTV", "Tổng đơn", "Doanh số", "Tổng hoa hồng", "Hoa hồng thực nhận", "DS Tự giao", "DS LYHU giao"];
        const rows = performanceData.map(p => [
            p.ctvId,
            p.ctvName,
            p.totalOrders,
            p.totalSales,
            p.totalCommission,
            p.payableCommission,
            p.selfShipSales,
            p.lyhuShipSales
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ctv_performance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const summaryCards = [
        {
            label: "Tổng doanh số CTV",
            value: formatPrice(stats.totalSales),
            sub: `${stats.totalOrders} đơn hàng`,
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Tổng hoa hồng",
            value: formatPrice(stats.totalCommission),
            sub: "Ước tính toàn hệ thống",
            icon: Wallet,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Hoa hồng phải trả",
            value: formatPrice(stats.payableCommission),
            sub: "Đơn đã giao thành công",
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Số lượng CTV",
            value: performanceData.length.toString(),
            sub: "Đang hoạt động",
            icon: Users,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hiệu quả CTV</h1>
                    <p className="text-slate-600">Tổng hợp doanh số và hoa hồng của cộng tác viên</p>
                </div>
                <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span>Xuất CSV</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, index) => {
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
                                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-semibold text-slate-900">Danh sách CTV</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm CTV..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">CTV</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng đơn</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng hoa hồng</th>
                                <th className="px-6 py-3 font-medium text-right">Thực nhận (Đã giao)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Không tìm thấy dữ liệu CTV
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((ctv) => (
                                    <tr key={ctv.ctvId} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{ctv.ctvName}</p>
                                                <p className="text-xs text-slate-500">ID: {ctv.ctvId}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-900">{ctv.totalOrders}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatPrice(ctv.totalSales)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {formatPrice(ctv.totalCommission)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-green-600">
                                            {formatPrice(ctv.payableCommission)}
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
