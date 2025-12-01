"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { SalesLead, loadSalesLeads, getSalesStats } from "@/lib/salesLeads";

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

export default function SalesDashboard() {
    const [leads, setLeads] = useState<SalesLead[]>([]);

    useEffect(() => {
        const data = loadSalesLeads();
        setLeads(data);
    }, []);

    const stats = getSalesStats(leads);

    const statsCards = [
        {
            label: "Tổng Leads",
            value: stats.total.toString(),
            change: "Khách hàng tiềm năng",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Doanh thu dự kiến",
            value: formatPrice(stats.estimatedRevenue),
            change: "Tổng tiềm năng",
            icon: DollarSign,
            color: "text-primary-600",
            bg: "bg-primary-50",
        },
        {
            label: "Đang chốt",
            value: stats.inProgress.toString(),
            change: "Đang theo dõi",
            icon: ShoppingBag,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Đã ký",
            value: stats.won.toString(),
            change: "Thành công",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];
    return (
        <div className="space-y-6">
            {/* KPI Cards - CORE APP Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                                <span className="text-primary-600 font-semibold">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts & Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Performance Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Hiệu suất bán hàng</h3>
                    <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">Chart Placeholder</p>
                            <p className="text-xs text-slate-400 mt-1">Biểu đồ doanh số theo tháng</p>
                        </div>
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Leads gần đây</h3>
                    <div className="space-y-4">
                        {leads.slice(0, 5).map((lead, index) => (
                            <div key={lead.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <h4 className="font-medium text-slate-900 text-sm truncate">
                                                {lead.storeName}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 ml-8">
                                            {lead.type} • {lead.area}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-8 flex items-center justify-between text-xs">
                                    <span className="text-slate-600">{formatDate(lead.createdAt)}</span>
                                    <span className="font-semibold text-primary-600">
                                        {formatPrice(lead.estimatedRevenue)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                    href="/sales/my-leads"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Leads của tôi</h4>
                        <p className="text-sm text-slate-600">Xem tất cả leads phụ trách</p>
                    </div>
                </a>
                <a
                    href="/sales/new-lead"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Tạo Lead mới</h4>
                        <p className="text-sm text-slate-600">Thêm khách hàng tiềm năng</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
