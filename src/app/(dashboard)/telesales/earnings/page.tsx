"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown, Clock, Download, Package, Target, Zap, Award, Receipt, ShieldAlert, Info } from "lucide-react";
import { TelesalesTask, fetchTasks } from "@/lib/telesalesTasksStore";
import { Order, fetchOrders } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    calculateCombinedMetrics,
    calculateKpiHistory,
    COMMISSION_RATE,
    getWeeklyRanges,
    calculateKpiProgress,
    getTodayTargetForCurrentUser,
    calculateKpiRemaining
} from "@/lib/telesalesKpiSelectors";
import {
    FinancialTransaction,
    PayrollConfig,
    fetchPayrollConfig,
    fetchUserTransactions
} from "@/lib/payrollStore";
import { getRealtimeClient } from "@/lib/supabaseClient";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

type DateRangeOption = 'today' | 'last_7_days' | 'this_month';

export default function TelesalesEarningsPage() {
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'finance' | 'orders'>('finance');

    const { user, session } = useAuth();

    const loadData = useCallback(async () => {
        if (!user || !session?.access_token) return;
        setIsLoading(true);
        try {
            // Calculate date range for server-side filtering
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setMilliseconds(-1);

            const [allTasks, allOrders, userTransactions, config] = await Promise.all([
                fetchTasks(user.id, session.access_token, {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                fetchOrders(session.access_token, {
                    userId: user.id,
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                fetchUserTransactions(user.id, session.access_token),
                fetchPayrollConfig('telesales_parttime', session.access_token)
            ]);

            setTasks(allTasks);
            setOrders(allOrders);
            setTransactions(userTransactions);
            setPayrollConfig(config);
        } catch (error) {
            console.error("loadData error:", error);
            setTasks([]);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, session?.access_token]);

    // Initial load
}, [user, session?.access_token, loadData]);

// Realtime subscriptions
useEffect(() => {
    if (!user || !session?.access_token) return;

    const supabase = getRealtimeClient();

    // Channel for all relevant tables
    const channel = supabase
        .channel('telesales-earnings-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'financial_transactions', filter: `user_id=eq.${user.id}` },
            (payload: any) => {
                console.log("[Realtime] Financial transactions changed:", payload);
                loadData();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' }, // Remove filter for robustness
            (payload: any) => {
                console.log("[Realtime] Order event detected:", payload.eventType, payload.new?.id);
                // Reload if it belongs to this user (we reload anyway for safety)
                loadData();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'telesales_tasks', filter: `user_id=eq.${user.id}` },
            (payload: any) => {
                console.log("[Realtime] Tasks changed:", payload);
                loadData();
            }
        )
        .subscribe((status: any) => {
            console.log("[Realtime] Subscription status:", status);
        });

    return () => {
        supabase.removeChannel(channel);
    };
}, [user, session?.access_token, loadData]);

// Derived State: Date Ranges
const { currentRange, prevRange, rangeLabel, todayRange } = useMemo(() => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    let label = "";

    // Today Range (Static)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Filter Logic
    start.setHours(0, 0, 0, 0); // Reset start

    switch (dateRange) {
        case 'today':
            end.setHours(23, 59, 59, 999);
            label = "Hôm nay";
            break;

        case 'last_7_days':
            start.setDate(now.getDate() - 6);
            end.setHours(23, 59, 59, 999);
            label = "7 ngày gần đây";
            break;

        case 'this_month':
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
            label = `Tháng ${now.getMonth() + 1}`;
            break;
    }

    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(start);
    prevEnd.setDate(0);
    prevEnd.setHours(23, 59, 59, 999);

    return {
        currentRange: { from: start, to: end },
        todayRange: { from: todayStart, to: todayEnd },
        prevRange: { from: prevStart, to: prevEnd },
        rangeLabel: label
    };
}, [dateRange]);

const rate = payrollConfig?.commissionRate || 0.03;

// Metrics
const currentMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, currentRange.from, currentRange.to, rate), [tasks, orders, currentRange, rate]);

// Today & Target Metrics
const todayMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, todayRange.from, todayRange.to, rate), [tasks, orders, todayRange, rate]);
const todayTarget = useMemo(() => getTodayTargetForCurrentUser(), []);
const todayRemaining = useMemo(() => calculateKpiRemaining(todayMetrics, todayTarget), [todayMetrics, todayTarget]);
const { status: todayKpiStatus, percentage: todayKpiPercent } = useMemo(() => calculateKpiProgress(todayMetrics), [todayMetrics]);

// Comparison for Filtered Data
const prevMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, prevRange.from, prevRange.to, rate), [tasks, orders, prevRange, rate]);
const revenueGrowth = prevMetrics.totalRevenue > 0
    ? ((currentMetrics.totalRevenue - prevMetrics.totalRevenue) / prevMetrics.totalRevenue) * 100
    : (currentMetrics.totalRevenue > 0 ? 100 : 0);

// Weekly Comparison Metrics
const weeklyMetrics = useMemo(() => {
    const ranges = getWeeklyRanges();
    const thisWeek = calculateCombinedMetrics(tasks, orders, ranges.thisWeek.from, ranges.thisWeek.to, rate);
    const lastWeek = calculateCombinedMetrics(tasks, orders, ranges.lastWeek.from, ranges.lastWeek.to, rate);
    return { thisWeek, lastWeek };
}, [tasks, orders, rate]);

// History Table
const history = useMemo(() => calculateKpiHistory(tasks, currentRange.from, currentRange.to, orders, rate), [tasks, orders, currentRange, rate]);

// Financial calculations
const payrollMetrics = useMemo(() => {
    const bonusTotal = transactions
        .filter(t => t.type === 'bonus' && t.status === 'finalized')
        .reduce((sum, t) => sum + t.amount, 0);

    const penaltyTotal = transactions
        .filter(t => t.type === 'penalty' && t.status === 'finalized')
        .reduce((sum, t) => sum + t.amount, 0);

    const estimatedBonuses = transactions
        .filter(t => t.type === 'bonus' && t.status === 'estimated')
        .reduce((sum, t) => sum + t.amount, 0);

    const baseSalary = payrollConfig?.baseSalaryMonthly || 0;
    const totalNetSalary = baseSalary + bonusTotal + currentMetrics.totalCommission - penaltyTotal;

    return {
        bonusTotal,
        penaltyTotal,
        estimatedBonuses,
        baseSalary,
        totalNetSalary
    };
}, [transactions, payrollConfig, currentMetrics.totalCommission]);

const getDateRangeText = () => {
    switch (dateRange) {
        case 'today': return "Hôm nay";
        case 'last_7_days': return "7 ngày gần đây";
        case 'this_month': return "Tháng này";
        default: return "";
    }
};

const getTrendIcon = (current: number, prev: number) => {
    if (current > prev) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (current < prev) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <span className="text-slate-400 w-4 block text-center">-</span>;
};

const getTrendPercent = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? "+100%" : "0%";
    const p = ((current - prev) / prev) * 100;
    return `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;
};

// CSV Export Logic
const handleExportCsv = () => {
    if (!history || history.length === 0) {
        alert("Không có dữ liệu để xuất.");
        return;
    }

    const summaryHeaders = ["Mục tiêu", "Giá trị", "Đơn vị"];
    const summaryRows = [
        ["Tổng cuộc gọi", currentMetrics.totalCalls, "Cuộc"],
        ["Tổng đơn hàng", currentMetrics.totalOrders, "Đơn"],
        ["Tổng doanh số", currentMetrics.totalRevenue, "VND"],
        ["Tổng hoa hồng", currentMetrics.totalCommission, "VND"],
        ["Tỷ lệ chốt", currentMetrics.conversionRate.toFixed(1), "%"]
    ];

    const historyHeaders = ["Ngày", "Cuộc gọi", "Đơn thành công", "Doanh số", "Hoa hồng", "Tỷ lệ chốt"];
    const historyRows = history.map(row => {
        const conv = row.calls > 0 ? ((row.orders / row.calls) * 100).toFixed(1) : "0.0";
        return [
            row.dateLabel,
            row.calls,
            row.orders,
            row.revenue,
            row.commission,
            `${conv}%`
        ];
    });

    const csvContent = [
        "BÁO CÁO TỔNG HỢP KPI",
        `Phạm vi: ${getDateRangeText()}`,
        `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`,
        "",
        "1. TÓM TẮT CHỈ SỐ",
        summaryHeaders.join(","),
        ...summaryRows.map(r => r.join(",")),
        "",
        "2. CHI TIẾT THEO NGÀY",
        historyHeaders.join(","),
        ...historyRows.map(r => r.join(","))
    ].join("\n");

    // Add UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `telesales_kpi_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

if (isLoading) {
    return <div className="p-6">Đang tải báo cáo...</div>;
}

return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Thu nhập & KPI</h1>

            <div className="flex items-center gap-3">
                {/* Filters */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {getDateRangeText()}
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                            <button onClick={() => setDateRange('today')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'today' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Hôm nay</button>
                            <button onClick={() => setDateRange('last_7_days')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_7_days' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>7 ngày gần đây</button>
                            <button onClick={() => setDateRange('this_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_month' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tháng này</button>
                        </div>
                    </div>
                </div>

                {/* Export Button */}
                <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
                >
                    <Download className="w-4 h-4 text-slate-500" />
                    Xuất báo cáo
                </button>
            </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            {/* 1. Today KPI Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-primary-50 rounded-lg text-primary-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${todayKpiStatus === 'good' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {todayKpiStatus === 'good' ? 'Hoàn thành' : 'Đang thực hiện'}
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mục tiêu ngày</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">{todayKpiPercent}%</span>
                            <span className="text-xs text-slate-400">tiến độ</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${todayKpiStatus === 'good' ? 'bg-emerald-500' : (todayKpiStatus === 'warning' ? 'bg-amber-500' : 'bg-rose-500')}`}
                            style={{ width: `${Math.min(todayKpiPercent, 100)}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 pt-2 border-t border-slate-50">
                        <div className="text-[11px]">
                            <span className="text-slate-400">Gọi:</span> <span className="font-bold text-slate-700">{todayMetrics.totalCalls}</span>
                        </div>
                        <div className="text-[11px]">
                            <span className="text-slate-400">Đơn:</span> <span className="font-bold text-slate-700">{todayMetrics.totalOrders}</span>
                        </div>
                        <div className="text-[11px] col-span-2">
                            <span className="text-slate-400">Doanh số:</span> <span className="font-bold text-slate-700">{formatPrice(todayMetrics.totalRevenue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Total Revenue Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                        <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rangeLabel}</span>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Doanh số</p>
                    <div className="text-2xl font-bold text-slate-900">{formatPrice(currentMetrics.totalRevenue)}</div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 py-1 px-2 bg-blue-50 w-fit rounded-lg">
                        <Package className="w-3 h-3" />
                        {currentMetrics.totalOrders} Đơn hàng
                    </div>
                </div>
            </div>

            {/* 3. Commission Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-secondary-50 rounded-lg text-secondary-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    {dateRange === 'this_month' && (
                        <div className={`flex items-center text-[10px] font-bold ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(revenueGrowth).toFixed(1)}%
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thực lĩnh dự kiến</p>
                    <div className="text-2xl font-bold text-slate-900 leading-none">{formatPrice(currentMetrics.totalCommission)}</div>
                    <p className="mt-2 text-[10px] text-slate-400 font-medium">Hoa hồng & Thưởng</p>
                </div>
            </div>

            {/* 4. Conversion Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        <Target className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiệu suất</span>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tỉ lệ chốt</p>
                    <div className="text-2xl font-bold text-slate-900 leading-none">{currentMetrics.conversionRate.toFixed(1)}%</div>
                    <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 transition-all duration-1000"
                            style={{ width: `${currentMetrics.conversionRate}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Payroll Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Salary Summary */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg">
                                <Receipt className="w-5 h-5 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Chi tiết Bảng lương {rangeLabel}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('finance')}
                                    className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all ${viewMode === 'finance' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tài chính
                                </button>
                                <button
                                    onClick={() => setViewMode('orders')}
                                    className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all ${viewMode === 'orders' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Đơn hàng
                                </button>
                            </div>
                            <span className="text-xs text-slate-500 italic">Cập nhật lúc: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div className="p-6">
                        {viewMode === 'finance' ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-slate-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        Lương cố định tháng
                                    </span>
                                    <span className="font-semibold text-slate-900">{formatPrice(payrollMetrics.baseSalary)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 text-green-600">
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        Thưởng mở mới & Sáng kiến (Chốt)
                                    </span>
                                    <span className="font-bold">+{formatPrice(payrollMetrics.bonusTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 text-blue-600">
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        Hoa hồng doanh số (Dự kiến)
                                    </span>
                                    <span className="font-bold">+{formatPrice(currentMetrics.totalCommission)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 text-red-500">
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        Các khoản phạt & Vi phạm
                                    </span>
                                    <span className="font-bold">-{formatPrice(payrollMetrics.penaltyTotal)}</span>
                                </div>
                                <div className="pt-4 flex justify-between items-center text-xl">
                                    <span className="font-bold text-slate-900">TỔNG THU NHẬP</span>
                                    <div className="text-right">
                                        <span className="font-black text-primary-600">{formatPrice(payrollMetrics.totalNetSalary)}</span>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Ước tính thực nhận tháng này</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                                            <th className="p-3 font-medium">Mã đơn</th>
                                            <th className="p-3 font-medium">Khách hàng</th>
                                            <th className="p-3 font-medium text-right">Giá trị</th>
                                            <th className="p-3 font-medium text-center">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orders.filter(o => {
                                            const d = new Date(o.createdAt);
                                            return d.getMonth() === 11 && d.getFullYear() === 2025;
                                        }).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-400 italic">Chưa có đơn hàng nào trong tháng 12.</td>
                                            </tr>
                                        ) : (
                                            orders
                                                .filter(o => {
                                                    const d = new Date(o.createdAt);
                                                    return d.getMonth() === 11 && d.getFullYear() === 2025;
                                                })
                                                .map((o) => (
                                                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-3 font-mono text-xs text-slate-400">#{o.readableId || o.id.slice(0, 8)}</td>
                                                        <td className="p-3 font-bold text-slate-900">{o.customerName}</td>
                                                        <td className="p-3 text-right font-black text-primary-600">{formatPrice(o.totalAmount || 0)}</td>
                                                        <td className="p-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {o.status === 'delivered' ? 'Thành công' : 'Đang xử lý'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {/* Incentive Notice */}
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-start gap-3">
                        <Info className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <p><strong>Lưu ý:</strong> Thưởng NPP/Đại lý sẽ ở trạng thái <b>Dự kiến</b> cho đến khi đơn hàng được giao thành công. Hoa hồng doanh số cũng có thể thay đổi nếu đơn hàng bị hủy hoặc hoàn trả.</p>
                        </div>
                    </div>
                </div>

                {/* Transaction History Sub-table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800 text-sm">Biến động số dư mới nhất</h4>
                        <Award className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                                    <th className="p-3 font-medium">Thời gian</th>
                                    <th className="p-3 font-medium">Nội dung</th>
                                    <th className="p-3 font-medium text-right">Số tiền</th>
                                    <th className="p-3 font-medium text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">Chưa có biến động tài chính.</td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 text-slate-400">
                                                {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-slate-700">{t.category}</div>
                                                {t.note && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.note}</div>}
                                            </td>
                                            <td className={`p-3 text-right font-bold ${t.type === 'penalty' ? 'text-red-500' : 'text-primary-600'}`}>
                                                {t.type === 'penalty' ? '-' : '+'}{formatPrice(t.amount)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.status === 'finalized'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {t.status === 'finalized' ? 'Đã chốt' : 'Dự kiến'}
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

            {/* Right Area */}
            <div className="space-y-6">
                {/* Pending Bonuses Card */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
                    <Award className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
                    <h4 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Đang chờ xử lý</h4>
                    <div className="text-3xl font-black mb-1">{formatPrice(payrollMetrics.estimatedBonuses)}</div>
                    <p className="text-white/60 text-[10px] leading-relaxed">
                        Tổng thưởng dự kiến từ các đơn hàng mở mới đang vận chuyển.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                            <span>Chờ đơn hàng "Đã giao" để chốt</span>
                        </div>
                    </div>
                </div>

                {/* Penalties Notice */}
                {payrollMetrics.penaltyTotal > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex gap-4">
                        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-red-900 mb-1">Cảnh báo Vi phạm</h4>
                            <p className="text-xs text-red-700 leading-normal">
                                Anh/Chị có các khoản phạt do vi phạm nội quy (đi muộn, đồng phục...). Vui lòng liên hệ Admin nếu có thắc mắc.
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Rules Link */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">Chính sách Lương Thưởng</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Tìm hiểu chi tiết về các định mức thưởng mở mới NPP (300k), Đại lý (100k) và các quy định xử phạt tại đây.
                    </p>
                    <a
                        href="/telesales/rules"
                        className="block w-full py-2 bg-slate-900 text-white text-center rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                        Xem Quy định Chi tiết
                    </a>
                </div>
            </div>
        </div>

        {/* Weekly Comparison Block */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">So sánh Tuần này vs Tuần trước</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* This Week */}
                <div className="space-y-4">
                    <h4 className="font-medium text-slate-700 border-b pb-2">Tuần này</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Cuộc gọi</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{weeklyMetrics.thisWeek.totalCalls}</span>
                                <span className="text-xs text-slate-500 flex items-center">
                                    {getTrendIcon(weeklyMetrics.thisWeek.totalCalls, weeklyMetrics.lastWeek.totalCalls)}
                                    <span className={weeklyMetrics.thisWeek.totalCalls >= weeklyMetrics.lastWeek.totalCalls ? "text-green-600" : "text-red-600"}>
                                        {getTrendPercent(weeklyMetrics.thisWeek.totalCalls, weeklyMetrics.lastWeek.totalCalls)}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Doanh số</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{formatPrice(weeklyMetrics.thisWeek.totalRevenue)}</span>
                            </div>
                            <span className="text-xs flex items-center gap-1 mt-1">
                                {getTrendIcon(weeklyMetrics.thisWeek.totalRevenue, weeklyMetrics.lastWeek.totalRevenue)}
                                <span className={weeklyMetrics.thisWeek.totalRevenue >= weeklyMetrics.lastWeek.totalRevenue ? "text-green-600" : "text-red-600"}>
                                    {getTrendPercent(weeklyMetrics.thisWeek.totalRevenue, weeklyMetrics.lastWeek.totalRevenue)}
                                </span>
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Đơn hàng</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{weeklyMetrics.thisWeek.totalOrders}</span>
                                <span className="text-xs text-slate-500 flex items-center">
                                    {getTrendIcon(weeklyMetrics.thisWeek.totalOrders, weeklyMetrics.lastWeek.totalOrders)}
                                    <span className={weeklyMetrics.thisWeek.totalOrders >= weeklyMetrics.lastWeek.totalOrders ? "text-green-600" : "text-red-600"}>
                                        {getTrendPercent(weeklyMetrics.thisWeek.totalOrders, weeklyMetrics.lastWeek.totalOrders)}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Tỷ lệ chốt</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{weeklyMetrics.thisWeek.conversionRate.toFixed(1)}%</span>
                                <span className="text-xs text-slate-500 flex items-center">
                                    {getTrendIcon(weeklyMetrics.thisWeek.conversionRate, weeklyMetrics.lastWeek.conversionRate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Week */}
                <div className="space-y-4 opacity-75">
                    <h4 className="font-medium text-slate-700 border-b pb-2">Tuần trước</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Cuộc gọi</p>
                            <p className="text-lg font-semibold text-slate-600">{weeklyMetrics.lastWeek.totalCalls}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Doanh số</p>
                            <p className="text-lg font-semibold text-slate-600">{formatPrice(weeklyMetrics.lastWeek.totalRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Đơn hàng</p>
                            <p className="text-lg font-semibold text-slate-600">{weeklyMetrics.lastWeek.totalOrders}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Tỷ lệ chốt</p>
                            <p className="text-lg font-semibold text-slate-600">{weeklyMetrics.lastWeek.conversionRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Lịch sử hiệu quả</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">Ngày</th>
                            <th className="px-6 py-3 font-medium text-center">Cuộc gọi</th>
                            <th className="px-6 py-3 font-medium text-center">Đơn thành công</th>
                            <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                            <th className="px-6 py-3 font-medium text-right">Hoa hồng ({COMMISSION_RATE * 100}%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu trong khoảng này.</td>
                            </tr>
                        ) : (
                            history.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {row.dateLabel}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">
                                        {row.calls}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">
                                        {row.orders}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {formatPrice(row.revenue)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-green-600">
                                        {formatPrice(row.commission)}
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
