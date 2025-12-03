"use client";

import { useEffect, useState } from "react";
import { Users, ShoppingBag, DollarSign, TrendingUp, Package, CreditCard } from "lucide-react";
import { getAdminLeadStats, AdminLeadStats } from "@/lib/adminStats";
import { getOrdersSummary } from "@/lib/ordersStore";

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

const STATUS_LABELS: Record<string, string> = {
    NEW: "Mới",
    CONTACTED: "Đã liên hệ",
    CONVERTED: "Đã chuyển đổi",
    IN_PROGRESS: "Đang chốt",
    WON: "Đã ký",
    LOST: "Mất",
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminLeadStats | null>(null);
    const [orderStats, setOrderStats] = useState<{
        totalOrders: number;
        totalRevenue: number;
    } | null>(null);

    useEffect(() => {
        const data = getAdminLeadStats();
        setStats(data);

        const ordersData = getOrdersSummary();
        setOrderStats(ordersData);

        // Listen for updates
        const handleUpdates = () => {
            setOrderStats(getOrdersSummary());
        };
        window.addEventListener("orders-updated", handleUpdates);
        return () => window.removeEventListener("orders-updated", handleUpdates);
    }, []);

    const statsCards = [
        {
            label: "Tổng Leads",
            value: stats?.totalLeads?.toString() || "0",
            change: "Toàn hệ thống",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Leads CTV",
            value: stats?.totalCTVLeads?.toString() || "0",
            change: "Từ CTV",
            icon: ShoppingBag,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Leads Sales",
            value: stats?.totalSalesLeads?.toString() || "0",
            change: "Từ Sales",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Doanh thu dự kiến",
            value: formatPrice(stats?.totalEstimatedRevenue || 0),
            change: `${stats?.convertedLeads || 0} đã chuyển đổi`,
            icon: DollarSign,
            color: "text-primary-600",
            bg: "bg-primary-50",
        },
        {
            label: "Đơn hàng khách",
            value: orderStats?.totalOrders?.toString() || "0",
            change: "Đặt trực tiếp",
            icon: Package,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
        {
            label: "Doanh thu đơn",
            value: formatPrice(orderStats?.totalRevenue || 0),
            change: "Từ đơn hàng",
            icon: CreditCard,
            color: "text-teal-600",
            bg: "bg-teal-50",
        },
    ];

    return (
        <div className="space-y-6">
            {/* KPI Cards - CORE APP Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm border-t border-slate-100 pt-3">
                                <span className="text-slate-600">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts & Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Biểu đồ tổng quan</h3>
                    <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                        <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">Chart Placeholder</p>
                            <p className="text-xs text-slate-400 mt-1">Biểu đồ thống kê leads</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Tổng quan nhanh</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Tổng Leads</p>
                                <p className="text-xs text-slate-500 mt-1">{stats?.totalLeads || 0} leads</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">CTV Leads</p>
                                <p className="text-xs text-slate-500 mt-1">{stats?.totalCTVLeads || 0} leads</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Sales Leads</p>
                                <p className="text-xs text-slate-500 mt-1">{stats?.totalSalesLeads || 0} leads</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Đã chuyển đổi</p>
                                <p className="text-xs text-slate-500 mt-1">{stats?.convertedLeads || 0} leads</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Đơn hàng khách</p>
                                <p className="text-xs text-slate-500 mt-1">{orderStats?.totalOrders || 0} đơn</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Leads Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Hoạt động gần đây</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên / Cửa hàng</th>
                                <th className="px-6 py-3 font-medium">Người liên hệ</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium">Nguồn</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Giá trị</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {stats?.latestLeads && stats.latestLeads.length > 0 ? (
                                stats.latestLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.contactName || "-"}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.area || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${lead.source === "CTV"
                                                    ? "bg-green-100 text-green-700"
                                                    : lead.source === "Sales"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {lead.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                {STATUS_LABELS[lead.status] || lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                            {lead.estimatedRevenue ? formatPrice(lead.estimatedRevenue) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(lead.createdAt)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Chưa có lead nào
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
