"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, ShoppingBag, TrendingUp, ArrowRight } from "lucide-react";
import { SalesLead, loadSalesLeads, getSalesStats } from "@/lib/salesLeads";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/SkeletonUI";
import Link from "next/link";

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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const data = loadSalesLeads();
        setLeads(data);
        setIsLoading(false);
    }, []);

    const stats = getSalesStats(leads);

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <StatsSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 h-64 animate-pulse" />
                    <TableSkeleton rows={5} cols={2} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white h-24 rounded-xl border border-slate-200 animate-pulse" />
                    <div className="bg-white h-24 rounded-xl border border-slate-200 animate-pulse" />
                </div>
            </div>
        );
    }

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
            color: "text-[#00AFA9]",
            bg: "bg-teal-50",
        },
        {
            label: "Đang chốt",
            value: stats.inProgress.toString(),
            change: "Đang theo dõi",
            icon: ShoppingBag,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Đã ký",
            value: stats.won.toString(),
            change: "Thành công",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
    ];

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        Bán hàng (Sales)
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Tổng hợp hiệu suất quản lý khách hàng và cơ hội kinh doanh
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/sales/new-lead"
                        className="px-4 py-2 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                    >
                        Tạo Lead mới
                    </Link>
                </div>
            </div>

            {/* KPI Cards (Pure Flat) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate" title={stat.value}>{stat.value}</h3>
                            <div className="mt-3 flex items-center text-[11px] border-t border-slate-100 pt-2">
                                <span className="text-slate-500">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Sales Performance */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
                    <h3 className="text-base font-bold text-slate-900 mb-3">Hiệu suất bán hàng</h3>
                    <div className="h-56 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-center p-4">
                            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-[#00AFA9]/40" />
                            <p className="text-sm font-semibold text-slate-700">Theo dõi doanh số theo thời gian</p>
                            <p className="text-xs text-slate-400 mt-0.5">Dữ liệu được cập nhật tự động từ hệ thống đơn hàng</p>
                        </div>
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Leads gần đây</h3>
                            <Link href="/sales/my-leads" className="text-xs text-[#00AFA9] hover:text-[#009b95] font-bold transition-colors">
                                Xem tất cả
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {leads.slice(0, 5).map((lead, index) => (
                                <div key={lead.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-50 border border-teal-100 text-[#00AFA9] text-[10px] font-bold shrink-0">
                                                {index + 1}
                                            </span>
                                            <h4 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                                {lead.storeName}
                                            </h4>
                                        </div>
                                        <span className="font-bold text-[#00AFA9] text-xs shrink-0">
                                            {formatPrice(lead.estimatedRevenue)}
                                        </span>
                                    </div>
                                    <div className="ml-7 flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                        <span>{lead.type} • {lead.area}</span>
                                        <span>{formatDate(lead.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                            {leads.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-6">Chưa có lead nào</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions (Pure Flat) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link
                    href="/sales/my-leads"
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-[#00AFA9] transition-colors">Leads của tôi</h4>
                        <p className="text-xs text-slate-500">Xem và quản lý tất cả leads được phân công</p>
                    </div>
                </Link>
                <Link
                    href="/sales/new-lead"
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex items-center gap-4"
                >
                    <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-[#00AFA9]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-[#00AFA9] transition-colors">Tạo Lead mới</h4>
                        <p className="text-xs text-slate-500">Thêm thông tin khách hàng tiềm năng mới</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
