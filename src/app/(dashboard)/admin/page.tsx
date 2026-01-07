"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, ShoppingBag, DollarSign, TrendingUp, Package, CreditCard, Filter, Loader2, Trophy, ArrowRight } from "lucide-react";
import { getAdminLeadStats, getAdvancedStats, AdminLeadStats, TopProduct, FunnelStat } from "@/lib/adminStats";
import { getRevenueByDate, getLowStockItems, RevenueDataPoint, LowStockItem } from "@/lib/dashboardStore";
import RevenueChart from "@/components/dashboard/RevenueChart";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import { useAuth } from "@/components/auth/AuthProvider";

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
    const { session } = useAuth();

    // Data State
    const [stats, setStats] = useState<AdminLeadStats | null>(null);
    const [orderStats, setOrderStats] = useState<{ totalOrders: number; totalRevenue: number; } | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [funnelStats, setFunnelStats] = useState<FunnelStat[]>([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = session?.access_token;
            // Load all stats in parallel for speed
            const [leadStats, revenue, lowStock, advanced] = await Promise.all([
                getAdminLeadStats(token, fromDate, toDate),
                getRevenueByDate(30, fromDate, toDate),
                getLowStockItems(),
                getAdvancedStats(fromDate, toDate)
            ]);

            setStats(leadStats);
            setOrderStats({
                totalOrders: leadStats.totalOrders,
                totalRevenue: leadStats.totalOrderRevenue
            });
            setRevenueData(revenue);
            setLowStockItems(lowStock);
            setTopProducts(advanced.topProducts);
            setFunnelStats(advanced.funnel);
        } catch (err) {
            console.error('[AdminDashboard] Load data error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [session?.access_token, fromDate, toDate]);

    useEffect(() => {
        loadData();
        const handleUpdates = () => loadData();
        window.addEventListener("orders-updated", handleUpdates);
        return () => window.removeEventListener("orders-updated", handleUpdates);
    }, [loadData]);

    const statsCards = [
        { label: "Tổng Leads", value: stats?.totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Leads CTV", value: stats?.totalCTVLeads, icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
        { label: "Leads Sales", value: stats?.totalSalesLeads, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Doanh thu dự kiến", value: formatPrice(stats?.totalEstimatedRevenue || 0), icon: DollarSign, color: "text-primary-600", bg: "bg-primary-50" },
        { label: "Đơn hàng", value: orderStats?.totalOrders, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Doanh thu", value: formatPrice(orderStats?.totalRevenue || 0), icon: CreditCard, color: "text-teal-600", bg: "bg-teal-50" },
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tổng quan Admin</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {fromDate && toDate ? `Dữ liệu từ ${formatDate(fromDate)} - ${formatDate(toDate)}` : "Thống kê toàn thời gian"}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1 text-sm bg-transparent border-none outline-none text-slate-600 font-medium" />
                        <span className="text-slate-400">-</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1 text-sm bg-transparent border-none outline-none text-slate-600 font-medium" />
                    </div>
                    <button onClick={() => {
                        const now = new Date();
                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                        setFromDate(firstDay.toISOString().split('T')[0]);
                        setToDate(now.toISOString().split('T')[0]);
                    }} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Tháng này</button>
                    <button onClick={loadData} disabled={isLoading} className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Tier 2: Alerts (Ops) */}
            <LowStockAlert items={lowStockItems} isLoading={isLoading} />

            {/* Tier 1: Key Metrics (Financial) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statsCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-primary-200 transition-colors">
                            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            <h3 className="text-lg font-bold text-slate-900 mt-1">{stat.value != null ? stat.value : "-"}</h3>
                        </div>
                    );
                })}
            </div>

            {/* Tier 3: Trends & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Biểu đồ Doanh thu
                    </h3>
                    <div className="h-[300px]">
                        <RevenueChart data={revenueData} isLoading={isLoading} />
                    </div>
                </div>

                {/* Top Products (1/3 width) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Top Sản phẩm
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
                        {topProducts.length > 0 ? topProducts.map((p, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 font-bold text-slate-500 text-xs shadow-sm">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-900 truncate" title={p.productName}>{p.productName}</h4>
                                    <p className="text-xs text-slate-500">{p.sku} • {p.quantity} đã bán</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary-600">{formatPrice(p.revenue)}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500 text-center py-8">Chưa có dữ liệu bán hàng</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tier 4: Funnel & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Funnel (1/3 width) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Phễu Chuyển đổi (Funnel)</h3>
                    <div className="space-y-4">
                        {funnelStats.map((step, idx) => {
                            const max = Math.max(...funnelStats.map(s => s.count)) || 1;
                            const percent = Math.round((step.count / max) * 100);
                            return (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700 capitalize">
                                            {STATUS_LABELS[step.stage] || step.stage}
                                        </span>
                                        <span className="font-bold text-slate-900">{step.count}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${['won', 'delivered'].includes(step.stage) ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {funnelStats.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-8">Chưa có dữ liệu Leads</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity Table (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Hoạt động mới nhất</h3>
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Khách hàng</th>
                                    <th className="px-6 py-3 font-semibold">Nguồn</th>
                                    <th className="px-6 py-3 font-semibold">Trạng thái</th>
                                    <th className="px-6 py-3 font-semibold text-right">Ngày cập nhật</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats?.latestLeads && stats.latestLeads.length > 0 ? stats.latestLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-900">{lead.name}</div>
                                            {lead.contactName && <div className="text-xs text-slate-500">{lead.contactName}</div>}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${lead.source === 'CTV' ? 'bg-green-100 text-green-700' :
                                                    lead.source === 'Sales' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {lead.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 text-xs font-medium">
                                                {STATUS_LABELS[lead.status] || lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-500 text-xs">
                                            {formatDate(lead.createdAt)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
