"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
    Users, DollarSign, TrendingUp, Package, CreditCard,
    Filter, Loader2, Trophy, ArrowRight, Headset,
    AlertCircle, CheckCircle2, Clock, Truck, ShoppingCart,
    RefreshCw, Store, ExternalLink, ShieldCheck, Activity,
    Calendar, ChevronRight, BarChart3, AlertTriangle, Eye
} from "lucide-react";
import { getAdminLeadStats, getAdvancedStats, AdminLeadStats, TopProduct, FunnelStat } from "@/lib/adminStats";
import { getRevenueByDate, getLowStockItems, RevenueDataPoint, LowStockItem } from "@/lib/dashboardStore";
import { fetchOrders, type Order } from "@/lib/ordersStore";
import RevenueChart from "@/components/dashboard/RevenueChart";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabaseClient";

// Format Helpers
const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(price || 0);
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num || 0);
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return dateString;
    }
};

const formatTimeAgo = (dateString: string) => {
    try {
        const diffMs = Date.now() - new Date(dateString).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${Math.floor(diffHours / 24)} ngày trước`;
    } catch {
        return dateString;
    }
};

const ORDER_STATUS_MAP: Record<string, { label: string; badge: string }> = {
    pending: { label: "Chờ duyệt", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    processing: { label: "Đang xử lý", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    delivering: { label: "Đang giao", badge: "bg-teal-50 text-[#00AFA9] border-teal-200" },
    delivered: { label: "Đã giao", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    returned: { label: "Hoàn hàng", badge: "bg-orange-50 text-orange-700 border-orange-200" },
    cancelled: { label: "Đã hủy", badge: "bg-rose-50 text-rose-700 border-rose-200" },
    draft: { label: "Nháp", badge: "bg-slate-100 text-slate-600 border-slate-200" }
};

const LEAD_STATUS_MAP: Record<string, { label: string; badge: string }> = {
    new_data: { label: "Mới nhận", badge: "bg-sky-50 text-sky-700 border-sky-200" },
    NEW: { label: "Mới", badge: "bg-sky-50 text-sky-700 border-sky-200" },
    CONTACTED: { label: "Đã liên hệ", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    IN_PROGRESS: { label: "Đang tư vấn", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    QUALIFIED: { label: "Tiềm năng", badge: "bg-teal-50 text-[#00AFA9] border-teal-200" },
    WON: { label: "Chốt đơn", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    LOST: { label: "Thất bại", badge: "bg-rose-50 text-rose-700 border-rose-200" }
};

export default function AdminDashboard() {
    const { session, user } = useAuth();
    const supabase = createClient();

    // Data State
    const [stats, setStats] = useState<AdminLeadStats | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [funnelStats, setFunnelStats] = useState<FunnelStat[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [activePreset, setActivePreset] = useState<"all" | "today" | "7days" | "month" | "custom">("month");
    const [activeTab, setActiveTab] = useState<"orders" | "leads">("orders");

    // Greeting based on current hour
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng";
        if (hour < 18) return "Chào buổi chiều";
        return "Chào buổi tối";
    }, []);

    // Set default preset to "Tháng này"
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        setFromDate(firstDay.toISOString().split("T")[0]);
        setToDate(now.toISOString().split("T")[0]);
    }, []);

    const loadData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const token = session?.access_token;
            const [leadStats, revenue, lowStock, advanced, ordersList] = await Promise.all([
                getAdminLeadStats(token, fromDate, toDate),
                getRevenueByDate(30, fromDate, toDate),
                getLowStockItems(),
                getAdvancedStats(fromDate, toDate),
                fetchOrders(token)
            ]);

            setStats(leadStats);
            setRevenueData(revenue);
            setLowStockItems(lowStock);
            setTopProducts(advanced.topProducts);
            setFunnelStats(advanced.funnel);
            setOrders(ordersList || []);
        } catch (err) {
            console.error("[AdminDashboard] Load data error:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [session?.access_token, fromDate, toDate]);

    useEffect(() => {
        loadData();
        const handleUpdates = () => loadData(true);
        window.addEventListener("orders-updated", handleUpdates);

        // Realtime Subscription
        const channel = supabase.channel("admin-dashboard-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => loadData(true))
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadData(true))
            .subscribe();

        return () => {
            window.removeEventListener("orders-updated", handleUpdates);
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    // Preset Handlers
    const handleSetPreset = (preset: "all" | "today" | "7days" | "month") => {
        setActivePreset(preset);
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        if (preset === "today") {
            setFromDate(todayStr);
            setToDate(todayStr);
        } else if (preset === "7days") {
            const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
            setFromDate(past7.toISOString().split("T")[0]);
            setToDate(todayStr);
        } else if (preset === "month") {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            setFromDate(firstDay.toISOString().split("T")[0]);
            setToDate(todayStr);
        } else if (preset === "all") {
            setFromDate("");
            setToDate("");
        }
    };

    // Filter orders according to selected date range
    const filteredOrders = useMemo(() => {
        if (!fromDate && !toDate) return orders;
        return orders.filter(o => {
            if (!o.createdAt) return true;
            const d = o.createdAt.split("T")[0];
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        });
    }, [orders, fromDate, toDate]);

    // Financial & Operational Metrics
    const metrics = useMemo(() => {
        const totalRevenue = stats?.totalOrderRevenue || 0;
        const totalProfit = stats?.totalProfit || 0;
        const totalOrdersCount = stats?.totalOrders || filteredOrders.length || 0;

        // Delivered orders
        const deliveredOrders = filteredOrders.filter(o => o.status === "delivered");
        const pendingOrders = filteredOrders.filter(o => o.status === "pending");
        const processingOrders = filteredOrders.filter(o => o.status === "processing");
        const deliveringOrders = filteredOrders.filter(o => o.status === "delivering");
        const cancelledOrders = filteredOrders.filter(o => o.status === "cancelled" || o.status === "returned");

        // Average Order Value (AOV)
        const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

        // Profit Margin
        const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

        // Delivery Success Rate
        const nonPendingCount = deliveredOrders.length + cancelledOrders.length;
        const successRate = nonPendingCount > 0
            ? Math.round((deliveredOrders.length / nonPendingCount) * 100)
            : (deliveredOrders.length > 0 ? 100 : 0);

        // Channels Breakdown
        const channels = {
            telesales: { orders: 0, revenue: 0, leads: stats?.totalTelesalesLeads || 0 },
            salesGt: { orders: 0, revenue: 0, leads: stats?.totalSalesLeads || 0 },
            ctv: { orders: 0, revenue: 0, leads: stats?.totalCTVLeads || 0 },
            web: { orders: 0, revenue: 0, leads: 0 }
        };

        filteredOrders.forEach(o => {
            const src = (o.source || "").toUpperCase();
            const amt = o.totalAmount || 0;

            if (src.includes("TELESALES")) {
                channels.telesales.orders += 1;
                channels.telesales.revenue += amt;
            } else if (src.includes("GT") || src.includes("SALES")) {
                channels.salesGt.orders += 1;
                channels.salesGt.revenue += amt;
            } else if (src.includes("CTV") || src.includes("AFFILIATE")) {
                channels.ctv.orders += 1;
                channels.ctv.revenue += amt;
            } else {
                channels.web.orders += 1;
                channels.web.revenue += amt;
            }
        });

        return {
            totalRevenue,
            totalProfit,
            margin,
            totalOrdersCount,
            aov,
            successRate,
            pendingOrdersCount: pendingOrders.length,
            processingOrdersCount: processingOrders.length,
            deliveringOrdersCount: deliveringOrders.length,
            deliveredOrdersCount: deliveredOrders.length,
            cancelledOrdersCount: cancelledOrders.length,
            channels
        };
    }, [stats, filteredOrders]);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300">
            {/* ============================================================ */}
            {/* 1. EXECUTIVE HEADER & CONTROLS                              */}
            {/* ============================================================ */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AFA9] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00AFA9]"></span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#00AFA9]">
                            Executive Command Center • Realtime Sync
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {greeting}, {user?.user_metadata?.full_name || "Ban Giám Đốc"}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Tổng hợp toàn diện số liệu bán buôn, vận hành đơn hàng, kho bãi và đội ngũ kinh doanh LYHU
                    </p>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Presets */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                            onClick={() => handleSetPreset("today")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activePreset === "today"
                                    ? "bg-white text-[#00AFA9] shadow-sm font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => handleSetPreset("7days")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activePreset === "7days"
                                    ? "bg-white text-[#00AFA9] shadow-sm font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            7 ngày
                        </button>
                        <button
                            onClick={() => handleSetPreset("month")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activePreset === "month"
                                    ? "bg-white text-[#00AFA9] shadow-sm font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => handleSetPreset("all")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activePreset === "all"
                                    ? "bg-white text-[#00AFA9] shadow-sm font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Tất cả
                        </button>
                    </div>

                    {/* Custom Date Inputs */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setActivePreset("custom");
                            }}
                            className="bg-transparent border-none outline-none text-slate-700 font-medium text-xs w-28 cursor-pointer"
                        />
                        <span className="text-slate-400">→</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setActivePreset("custom");
                            }}
                            className="bg-transparent border-none outline-none text-slate-700 font-medium text-xs w-28 cursor-pointer"
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => loadData(true)}
                        disabled={isRefreshing || isLoading}
                        title="Làm mới dữ liệu"
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#00AFA9]" : ""}`} />
                    </button>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 2. URGENT ACTION & ALERT BANNER                              */}
            {/* ============================================================ */}
            {(metrics.pendingOrdersCount > 0 || lowStockItems.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.pendingOrdersCount > 0 && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5 text-amber-700" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-amber-950">
                                        {metrics.pendingOrdersCount} đơn hàng đang chờ duyệt
                                    </h4>
                                    <p className="text-xs text-amber-800 truncate">
                                        Cần phòng Sale Admin và Kế toán phê duyệt để xuất kho xử lý
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/admin/orders"
                                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                                Duyệt đơn ngay <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}

                    {lowStockItems.length > 0 && (
                        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-rose-950">
                                        {lowStockItems.length} mặt hàng chạm ngưỡng tồn kho tối thiểu
                                    </h4>
                                    <p className="text-xs text-rose-800 truncate">
                                        Cần tạo đề xuất nhập xưởng bổ sung để tránh đứt gãy cung ứng
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/warehouse/inventory"
                                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                                Xem kho ngay <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* 3. EXECUTIVE KPI SCORECARD (6 METRICS)                      */}
            {/* ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Tổng doanh thu */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doanh thu sỉ</span>
                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-[#00AFA9]" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                            {formatPrice(metrics.totalRevenue)}
                        </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Đơn ghi nhận:</span>
                        <span className="font-bold text-slate-700">{formatNumber(metrics.totalOrdersCount)}</span>
                    </div>
                </div>

                {/* 2. Lợi nhuận gộp */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận gộp</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-extrabold text-emerald-600 tracking-tight">
                            {formatPrice(metrics.totalProfit)}
                        </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Tỷ suất gộp:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {metrics.margin}%
                        </span>
                    </div>
                </div>

                {/* 3. Giá trị đơn trung bình (AOV) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AOV (Trung bình)</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                            {formatPrice(metrics.aov)}
                        </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Quy mô đơn:</span>
                        <span className="font-semibold text-slate-700">Đơn sỉ B2B</span>
                    </div>
                </div>

                {/* 4. Tỷ lệ giao thành công */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ giao đạt</span>
                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-[#00AFA9]" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-extrabold text-[#00AFA9] tracking-tight">
                            {metrics.successRate}%
                        </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Đã giao hoàn tất:</span>
                        <span className="font-bold text-[#00AFA9]">{metrics.deliveredOrdersCount} đơn</span>
                    </div>
                </div>

                {/* 5. Khách hàng tiềm năng (Leads) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Leads</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                            {formatNumber(stats?.totalLeads || 0)}
                        </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Chuyển đổi:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {stats?.totalLeads ? Math.round(((stats.convertedLeads || 0) / stats.totalLeads) * 100) : 0}%
                        </span>
                    </div>
                </div>

                {/* 6. Vận hành & Cảnh báo */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cần lưu tâm</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-extrabold text-amber-600 tracking-tight">
                            {metrics.pendingOrdersCount + lowStockItems.length}
                        </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Chờ duyệt / Thiếu hàng:</span>
                        <span className="font-bold text-slate-700">{metrics.pendingOrdersCount}/{lowStockItems.length}</span>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 4. REVENUE TRENDS & MULTI-CHANNEL BREAKDOWN                  */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Timeline Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-[#00AFA9]" />
                                Biểu đồ Xu hướng Doanh thu Bán buôn
                            </h3>
                            <p className="text-xs text-slate-500">
                                Theo dõi lượng tiền phát sinh thực tế từ các đơn hàng được xác nhận
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400">Doanh thu kỳ này:</span>
                            <p className="text-sm sm:text-base font-bold text-[#00AFA9]">
                                {formatPrice(metrics.totalRevenue)}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px]">
                        <RevenueChart data={revenueData} isLoading={isLoading} />
                    </div>
                </div>

                {/* Multi-Channel Distribution Breakdown (1/3 width) */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Store className="w-4 h-4 text-[#00AFA9]" />
                                    Cơ cấu theo Kênh bán hàng
                                </h3>
                                <p className="text-xs text-slate-500">Phân rã đơn & doanh số theo 4 kênh</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Kênh 1: Telesales */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-teal-100 text-[#00AFA9] flex items-center justify-center">
                                            <Headset className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">Telesales B2B</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-[#00AFA9]">
                                        {formatPrice(metrics.channels.telesales.revenue)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span>{metrics.channels.telesales.orders} đơn hoàn tất</span>
                                    <span>{metrics.channels.telesales.leads} leads phụ trách</span>
                                </div>
                            </div>

                            {/* Kênh 2: Sales GT */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                                            <Store className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">Sales GT (Đại lý & Điểm bán)</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-blue-700">
                                        {formatPrice(metrics.channels.salesGt.revenue)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span>{metrics.channels.salesGt.orders} đơn giao</span>
                                    <span>{metrics.channels.salesGt.leads} khách hàng NPP</span>
                                </div>
                            </div>

                            {/* Kênh 3: CTV / Affiliate */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Users className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">Cộng tác viên & Affiliate</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-700">
                                        {formatPrice(metrics.channels.ctv.revenue)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span>{metrics.channels.ctv.orders} đơn đặt</span>
                                    <span>{metrics.channels.ctv.leads} CTV hoạt động</span>
                                </div>
                            </div>

                            {/* Kênh 4: Sàn sỉ B2B Trực tuyến */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center">
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">Khách sỉ đặt Online</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-orange-700">
                                        {formatPrice(metrics.channels.web.revenue)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span>{metrics.channels.web.orders} đơn trực tiếp</span>
                                    <span>Tự động qua Portal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                        <Link
                            href="/admin/b2b-campaigns"
                            className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center justify-between"
                        >
                            <span>Xem chiến dịch kênh B2B</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 5. ORDER FULFILLMENT FUNNEL (PIPELINE TRẠNG THÁI)           */}
            {/* ============================================================ */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#00AFA9]" />
                            Vòng đời Vận hành Đơn hàng (Order Fulfillment Lifecycle)
                        </h3>
                        <p className="text-xs text-slate-500">Theo dõi tiến độ từ lúc tiếp nhận đến khi giao thành công</p>
                    </div>
                    <Link
                        href="/admin/orders"
                        className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center gap-1"
                    >
                        Quản lý đơn hàng <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Stage 1: Chờ duyệt */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                        <div className="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
                            <span>1. Chờ duyệt</span>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <p className="text-lg font-black text-amber-800">{metrics.pendingOrdersCount}</p>
                        <p className="text-[10px] text-amber-700/80 mt-0.5">Đơn hàng mới tạo</p>
                    </div>

                    {/* Stage 2: Đang xử lý */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                        <div className="flex items-center justify-between text-xs text-blue-900 font-bold mb-1">
                            <span>2. Đang đóng gói</span>
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-lg font-black text-blue-800">{metrics.processingOrdersCount}</p>
                        <p className="text-[10px] text-blue-700/80 mt-0.5">Kho đang chuẩn bị</p>
                    </div>

                    {/* Stage 3: Đang giao */}
                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
                        <div className="flex items-center justify-between text-xs text-teal-900 font-bold mb-1">
                            <span>3. Đang giao hàng</span>
                            <Truck className="w-3.5 h-3.5 text-[#00AFA9]" />
                        </div>
                        <p className="text-lg font-black text-[#00AFA9]">{metrics.deliveringOrdersCount}</p>
                        <p className="text-[10px] text-teal-700/80 mt-0.5">Shipper/Chành xe</p>
                    </div>

                    {/* Stage 4: Đã giao thành công */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                        <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
                            <span>4. Giao thành công</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-lg font-black text-emerald-800">{metrics.deliveredOrdersCount}</p>
                        <p className="text-[10px] text-emerald-700/80 mt-0.5">Đã thu COD / Chuyển khoản</p>
                    </div>

                    {/* Stage 5: Hoàn / Hủy */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1">
                            <span>5. Hoàn / Hủy</span>
                            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <p className="text-lg font-black text-slate-700">{metrics.cancelledOrdersCount}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Đã kết thúc xử lý</p>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 6. TOP PRODUCTS & LOW STOCK HEALTH                          */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                Top Mặt hàng Sỉ Bán Chạy Nhất
                            </h3>
                            <p className="text-xs text-slate-500">Xếp hạng theo sản lượng và doanh thu phát sinh</p>
                        </div>
                        <Link
                            href="/admin/products"
                            className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center gap-1"
                        >
                            Kho sản phẩm <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex-1 space-y-3">
                        {topProducts.length > 0 ? (
                            topProducts.slice(0, 5).map((p, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-teal-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                            idx === 0 ? "bg-amber-100 text-amber-800" :
                                            idx === 1 ? "bg-slate-200 text-slate-700" :
                                            idx === 2 ? "bg-orange-100 text-orange-800" : "bg-white text-slate-600 border"
                                        }`}>
                                            #{idx + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={p.productName}>
                                                {p.productName}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                SKU: <span className="font-mono text-slate-700">{p.sku || "N/A"}</span> • Đã xuất: <span className="font-bold text-slate-800">{formatNumber(p.quantity)}</span> gói/thùng
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-xs sm:text-sm font-extrabold text-[#00AFA9]">
                                            {formatPrice(p.revenue)}
                                        </p>
                                        {p.profit > 0 && (
                                            <p className="text-[10px] text-emerald-600 font-semibold" title="Lợi nhuận gộp">
                                                +{formatPrice(p.profit)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-xs">
                                Chưa có đủ dữ liệu giao dịch trong khoảng thời gian đã chọn
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Watchlist */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-rose-600" />
                                    Tình trạng Tồn kho & Cảnh báo Cháy hàng
                                </h3>
                                <p className="text-xs text-slate-500">Giám sát các mặt hàng dưới định mức an toàn</p>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                {lowStockItems.length} cảnh báo
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {lowStockItems.length > 0 ? (
                                lowStockItems.slice(0, 5).map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 truncate" title={item.productName}>
                                                {item.productName}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                SKU: <span className="font-mono text-slate-700">{item.sku}</span> • Kho: {item.warehouseName || "Kho Tổng"}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                item.currentStock === 0
                                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                            }`}>
                                                {item.currentStock === 0 ? "HẾT HÀNG" : `Còn ${item.currentStock}`} (Định mức: {item.minStockLevel})
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-emerald-600 flex flex-col items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 mb-1" />
                                    <p className="text-xs font-bold">Kho hàng đang ở trạng thái an toàn</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Tất cả sản phẩm đều trên định mức tối thiểu</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                        <Link
                            href="/warehouse/inventory"
                            className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center gap-1"
                        >
                            Quản lý tồn kho <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                            href="/warehouse/import"
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                        >
                            Tạo phiếu nhập kho
                        </Link>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 7. RECENT TRANSACTIONS & LEADS (DUAL TAB VIEW)               */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header Tabs */}
                <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab("orders")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                activeTab === "orders"
                                    ? "bg-white text-[#00AFA9] shadow-sm border border-slate-200"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Đơn hàng mới nhất ({filteredOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("leads")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                activeTab === "leads"
                                    ? "bg-white text-[#00AFA9] shadow-sm border border-slate-200"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Khách hàng tiềm năng ({stats?.latestLeads?.length || 0})
                        </button>
                    </div>

                    <Link
                        href={activeTab === "orders" ? "/admin/orders" : "/crm"}
                        className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center gap-1 shrink-0"
                    >
                        <span>Xem toàn bộ danh sách</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {activeTab === "orders" ? (
                        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Mã & Khách hàng</th>
                                    <th className="px-6 py-3">Kênh phân phối</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                    <th className="px-6 py-3 text-right">Tổng tiền</th>
                                    <th className="px-6 py-3 text-right">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.slice(0, 8).map((order) => {
                                        const statusCfg = ORDER_STATUS_MAP[order.status] || {
                                            label: order.status,
                                            badge: "bg-slate-100 text-slate-700 border-slate-200"
                                        };
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-3.5">
                                                    <div className="font-bold text-slate-900">
                                                        #{order.readableId || order.id.slice(0, 8)}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        {order.customerName || "Khách lẻ"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                        (order.source || "").includes("CTV") ? "bg-green-50 text-green-700 border-green-200" :
                                                        (order.source || "").includes("TELESALES") ? "bg-teal-50 text-[#00AFA9] border-teal-200" :
                                                        (order.source || "").includes("GT") ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                        "bg-slate-100 text-slate-700 border-slate-200"
                                                    }`}>
                                                        {order.source || "Trực tiếp"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badge}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-extrabold text-slate-900">
                                                    {formatPrice(order.totalAmount)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-xs text-slate-500 font-medium">
                                                    {formatTimeAgo(order.createdAt)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                                            Không có đơn hàng nào trong khoảng thời gian đã chọn
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Tên tiềm năng / Công ty</th>
                                    <th className="px-6 py-3">Người liên hệ</th>
                                    <th className="px-6 py-3">Nguồn</th>
                                    <th className="px-6 py-3">Trạng thái chăm sóc</th>
                                    <th className="px-6 py-3 text-right">Cập nhật</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats?.latestLeads && stats.latestLeads.length > 0 ? (
                                    stats.latestLeads.slice(0, 8).map((lead) => {
                                        const leadCfg = LEAD_STATUS_MAP[lead.status] || {
                                            label: lead.status,
                                            badge: "bg-slate-100 text-slate-700 border-slate-200"
                                        };
                                        return (
                                            <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-3.5">
                                                    <div className="font-bold text-slate-900">{lead.name}</div>
                                                    <div className="text-xs text-slate-400">{lead.phone || "Chưa có SĐT"}</div>
                                                </td>
                                                <td className="px-6 py-3.5 text-slate-600 text-xs">
                                                    {lead.contactName || "—"}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                        lead.source === "CTV" ? "bg-green-50 text-green-700 border-green-200" :
                                                        lead.source === "Telesales" ? "bg-teal-50 text-[#00AFA9] border-teal-200" :
                                                        "bg-blue-50 text-blue-700 border-blue-200"
                                                    }`}>
                                                        {lead.source}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${leadCfg.badge}`}>
                                                        {leadCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-xs text-slate-500 font-medium">
                                                    {formatTimeAgo(lead.createdAt)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                                            Chưa có dữ liệu khách hàng tiềm năng
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ============================================================ */}
            {/* 8. QUICK WORKFLOW ACCESS SHORTCUTS                           */}
            {/* ============================================================ */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Activity className="w-4 h-4 text-[#00AFA9]" />
                    <span>Lối tắt điều hành tác vụ:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/sale-admin/create-order"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        + Tạo đơn hàng mới
                    </Link>
                    <Link
                        href="/admin/npp-map"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Bản đồ Nhà phân phối
                    </Link>
                    <Link
                        href="/warehouse/inventory"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Kiểm kê kho hàng
                    </Link>
                    <Link
                        href="/admin/users"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Phân quyền nhân sự
                    </Link>
                    <Link
                        href="/admin/analytics"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Phân tích truy cập web
                    </Link>
                </div>
            </div>
        </div>
    );
}
