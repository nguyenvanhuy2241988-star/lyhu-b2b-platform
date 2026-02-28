"use client";
// Force deploy: 2026-01-06 17:05

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
import { supabase, getRealtimeClient } from "@/lib/supabaseClient";
import { KPI_TEMPLATES, formatKpiValue } from "@/lib/kpi_config";
import { KpiSalaryResult, calculateKpiSalary } from "@/lib/kpiSalaryStore";

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
    const [kpiSettings, setKpiSettings] = useState<any>(null);
    const [kpiTracking, setKpiTracking] = useState<any>(null);
    const [kpiSalary, setKpiSalary] = useState<KpiSalaryResult | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

            const trackingRes = await Promise.all([
                fetchTasks(user.id, session.access_token, {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                fetchOrders(session.access_token, {
                    userId: user.id,
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                fetchUserTransactions(user.id, session.access_token, {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                fetchPayrollConfig('telesales_parttime', session.access_token),
                supabase.rpc('get_user_kpi_settings', { p_user_id: user.id }),
                supabase.rpc('get_telesales_kpi_v4', {
                    data: JSON.stringify({
                        user_id: user.id,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear()
                    })
                })
            ]);

            setTasks(trackingRes[0]);
            setOrders(trackingRes[1]);
            setTransactions(trackingRes[2]);
            setPayrollConfig(trackingRes[3]);
            if (trackingRes[4].data) setKpiSettings(trackingRes[4].data);
            if (trackingRes[5].data) setKpiTracking(trackingRes[5].data);

            // Calculate KPI-based salary
            const baseSalary = trackingRes[3]?.baseSalaryMonthly || (trackingRes[4].data?.base_salary_monthly) || 0;
            const now = new Date();
            const salaryResult = await calculateKpiSalary(user.id, now.getMonth() + 1, now.getFullYear(), baseSalary);
            setKpiSalary(salaryResult);
            setLastUpdated(new Date());

        } catch (error) {
            console.error("loadData error:", error);
            setTasks([]);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, session?.access_token]);

    // Initial load
    useEffect(() => {
        if (user && session?.access_token) {
            loadData();
        } else {
            setIsLoading(false);
        }
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
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_kpi_settings', filter: `user_id=eq.${user.id}` },
                (payload: any) => {
                    console.log("[Realtime] KPI Settings changed:", payload);
                    loadData();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'kpi_metric_definitions' },
                (payload: any) => {
                    console.log("[Realtime] KPI Metric Definitions changed:", payload);
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

    const rate = kpiSettings?.commission_rate !== undefined ? kpiSettings.commission_rate : (payrollConfig?.commissionRate || 0.03);

    // Metrics
    const currentMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, currentRange.from, currentRange.to, rate), [tasks, orders, currentRange, rate]);

    // Today & Target Metrics
    const todayMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, todayRange.from, todayRange.to, rate), [tasks, orders, todayRange, rate]);
    const todayTarget = useMemo(() => {
        if (kpiSettings) {
            return {
                callsPerDay: kpiSettings.daily_calls_target,
                ordersPerDay: kpiSettings.daily_orders_target,
                revenuePerDay: kpiSettings.daily_revenue_target
            };
        }
        return getTodayTargetForCurrentUser();
    }, [kpiSettings]);
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
        const kpiBasedSalary = kpiSalary?.totalKpiSalary ?? baseSalary;
        const totalNetSalary = kpiBasedSalary + bonusTotal + currentMetrics.totalCommission - penaltyTotal;

        return {
            bonusTotal,
            penaltyTotal,
            estimatedBonuses,
            baseSalary,
            totalNetSalary
        };
    }, [transactions, payrollConfig, currentMetrics.totalCommission, kpiSalary]);

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-slate-900">Thu nhập & KPI</h1>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {getDateRangeText()}
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-md py-1 z-10 hidden group-hover:block">
                            <button onClick={() => setDateRange('today')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'today' ? 'text-primary-600 font-medium' : 'text-slate-600'}`}>Hôm nay</button>
                            <button onClick={() => setDateRange('last_7_days')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_7_days' ? 'text-primary-600 font-medium' : 'text-slate-600'}`}>7 ngày gần đây</button>
                            <button onClick={() => setDateRange('this_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_month' ? 'text-primary-600 font-medium' : 'text-slate-600'}`}>Tháng này</button>
                        </div>
                    </div>
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-4 h-4 text-slate-400" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* KPI Progress Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {kpiTracking && KPI_TEMPLATES['telesales'].fields.map((field) => {
                    const actual = kpiTracking.metrics?.[field.key] || 0;
                    const target = kpiTracking.targets?.[field.key] || 0;
                    const percent = target > 0 ? (actual / target) * 100 : (actual > 0 ? 100 : 0);

                    let barColor = "bg-primary-500";
                    let badgeClass = "text-primary-600 bg-primary-50";

                    if (percent >= 100) {
                        barColor = "bg-emerald-500";
                        badgeClass = "text-emerald-700 bg-emerald-50";
                    } else if (percent >= 80) {
                        barColor = "bg-emerald-500";
                        badgeClass = "text-emerald-600 bg-emerald-50";
                    } else if (percent < 50) {
                        barColor = "bg-rose-400";
                        badgeClass = "text-rose-600 bg-rose-50";
                    } else {
                        barColor = "bg-amber-400";
                        badgeClass = "text-amber-600 bg-amber-50";
                    }

                    return (
                        <div key={field.key} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500">{field.label}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                                    {percent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-lg font-bold text-slate-900">{formatKpiValue(actual, field.type)}</span>
                                <span className="text-xs text-slate-400">/ {formatKpiValue(target, field.type)}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payroll Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Salary Summary */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-primary-500" />
                                Chi tiết Bảng lương {rangeLabel}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-slate-100 p-0.5 rounded-md">
                                    <button
                                        onClick={() => setViewMode('finance')}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'finance' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Tài chính
                                    </button>
                                    <button
                                        onClick={() => setViewMode('orders')}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewMode === 'orders' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Đơn hàng
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-slate-400">
                                        {lastUpdated ? (
                                            <>{lastUpdated.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} lúc {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                                        ) : 'Chưa cập nhật'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            {viewMode === 'finance' ? (
                                <div className="space-y-4">
                                    {/* KPI-Based Salary Breakdown */}
                                    {kpiSalary && kpiSalary.items.length > 0 ? (
                                        <div>
                                            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-200">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">Lương theo KPI</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">Lương cơ bản: {formatPrice(kpiSalary.baseSalary)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base font-bold text-primary-600">{formatPrice(kpiSalary.totalKpiSalary)}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {kpiSalary.items.map(item => {
                                                    const pct = Math.min(item.completionPercent, 100);
                                                    const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
                                                    const badgeClass = pct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200';
                                                    return (
                                                        <div key={item.key} className="bg-slate-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                                                                        {item.completionPercent.toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-slate-400">×{item.salaryPercent}%</span>
                                                                    <span className="text-sm font-bold text-slate-900">{formatPrice(item.salaryAmount)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs text-slate-500">
                                                                    {formatKpiValue(item.actual, item.field_type as any)} / {formatKpiValue(item.target, item.field_type as any)}
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                            <span className="text-sm text-slate-600">Lương cố định tháng</span>
                                            <span className="text-sm font-bold text-slate-900">{formatPrice(payrollMetrics.baseSalary)}</span>
                                        </div>
                                    )}

                                    {/* Summary Items */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                            <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-1">Thưởng chốt</div>
                                            <div className="text-sm font-bold text-emerald-700">+{formatPrice(payrollMetrics.bonusTotal)}</div>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                            <div className="text-[10px] font-medium text-blue-600 uppercase tracking-wide mb-1">Hoa hồng</div>
                                            <div className="text-sm font-bold text-blue-700">+{formatPrice(currentMetrics.totalCommission)}</div>
                                        </div>
                                        <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                            <div className="text-[10px] font-medium text-rose-600 uppercase tracking-wide mb-1">Phạt</div>
                                            <div className="text-sm font-bold text-rose-700">-{formatPrice(payrollMetrics.penaltyTotal)}</div>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Tổng thu nhập</div>
                                            <div className="text-[10px] text-primary-500 mt-0.5">Ước tính thực nhận tháng này</div>
                                        </div>
                                        <div className="text-xl font-bold text-primary-700">{formatPrice(payrollMetrics.totalNetSalary)}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                                                <th className="p-3 text-xs font-medium">Mã đơn</th>
                                                <th className="p-3 text-xs font-medium">Khách hàng</th>
                                                <th className="p-3 text-xs font-medium text-right">Giá trị</th>
                                                <th className="p-3 text-xs font-medium text-center">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {orders.filter(o => {
                                                const d = new Date(o.createdAt);
                                                return d >= currentRange.from && d <= currentRange.to;
                                            }).length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">Chưa có đơn hàng nào.</td>
                                                </tr>
                                            ) : (
                                                orders
                                                    .filter(o => {
                                                        const d = new Date(o.createdAt);
                                                        return d >= currentRange.from && d <= currentRange.to;
                                                    })
                                                    .map((o) => (
                                                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 font-mono text-xs text-slate-400">#{o.readableId || o.id.slice(0, 8)}</td>
                                                            <td className="p-3 font-medium text-slate-800">{o.customerName}</td>
                                                            <td className="p-3 text-right font-medium text-primary-600">{formatPrice(o.totalAmount || 0)}</td>
                                                            <td className="p-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
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
                        {/* Notice */}
                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-start gap-2">
                            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                <strong>Lưu ý:</strong> Thưởng NPP/Đại lý sẽ ở trạng thái Dự kiến cho đến khi đơn hàng được giao thành công.
                            </p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">Biến động số dư mới nhất</h4>
                            <Award className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="max-h-[280px] overflow-y-auto">
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
                                            <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">Chưa có biến động tài chính.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 text-slate-400">
                                                    {new Date(t.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                    <div className="text-[9px] text-slate-300 mt-0.5">{new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-slate-700">{t.category}</div>
                                                    {t.note && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.note}</div>}
                                                </td>
                                                <td className={`p-3 text-right font-medium ${t.type === 'penalty' ? 'text-red-500' : 'text-primary-600'}`}>
                                                    {t.type === 'penalty' ? '-' : '+'}{formatPrice(t.amount)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${t.status === 'finalized'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-orange-50 text-orange-600'
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
                <div className="space-y-4">
                    {/* Pending Bonuses Card */}
                    <div className="bg-primary-50 border border-primary-100 rounded-lg p-5">
                        <h4 className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">Đang chờ xử lý</h4>
                        <div className="text-2xl font-bold text-primary-700 mb-1">{formatPrice(payrollMetrics.estimatedBonuses)}</div>
                        <p className="text-xs text-primary-600/70 leading-relaxed">
                            Tổng thưởng dự kiến từ các đơn hàng mở mới đang vận chuyển.
                        </p>
                        <div className="mt-3 pt-3 border-t border-primary-200/50">
                            <div className="flex items-center gap-2 text-xs text-primary-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
                                <span>Chờ đơn hàng "Đã giao" để chốt</span>
                            </div>
                        </div>
                    </div>

                    {/* Penalties Notice */}
                    {payrollMetrics.penaltyTotal > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-red-800 mb-1">Cảnh báo Vi phạm</h4>
                                <p className="text-xs text-red-600 leading-relaxed">
                                    Anh/Chị có các khoản phạt do vi phạm nội quy (đi muộn, đồng phục...). Vui lòng liên hệ Admin nếu có thắc mắc.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Rules Link */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-800 text-sm mb-2">Chính sách Lương Thưởng</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            Tìm hiểu chi tiết về các định mức thưởng mở mới NPP (300k), Đại lý (100k) và các quy định xử phạt tại đây.
                        </p>
                        <a
                            href="/telesales/rules"
                            className="block w-full py-2 bg-slate-800 text-white text-center rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
                        >
                            Xem Quy định Chi tiết
                        </a>
                    </div>
                </div>
            </div>

            {/* Weekly Comparison */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">So sánh Tuần này vs Tuần trước</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* This Week */}
                    <div>
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Tuần này</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Cuộc gọi</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">{weeklyMetrics.thisWeek.totalCalls}</span>
                                    <span className="text-xs flex items-center">
                                        {getTrendIcon(weeklyMetrics.thisWeek.totalCalls, weeklyMetrics.lastWeek.totalCalls)}
                                        <span className={weeklyMetrics.thisWeek.totalCalls >= weeklyMetrics.lastWeek.totalCalls ? "text-emerald-600 text-[10px]" : "text-red-500 text-[10px]"}>
                                            {getTrendPercent(weeklyMetrics.thisWeek.totalCalls, weeklyMetrics.lastWeek.totalCalls)}
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Doanh số</p>
                                <span className="text-base font-semibold text-slate-900">{formatPrice(weeklyMetrics.thisWeek.totalRevenue)}</span>
                                <div className="text-xs flex items-center gap-1 mt-0.5">
                                    {getTrendIcon(weeklyMetrics.thisWeek.totalRevenue, weeklyMetrics.lastWeek.totalRevenue)}
                                    <span className={weeklyMetrics.thisWeek.totalRevenue >= weeklyMetrics.lastWeek.totalRevenue ? "text-emerald-600 text-[10px]" : "text-red-500 text-[10px]"}>
                                        {getTrendPercent(weeklyMetrics.thisWeek.totalRevenue, weeklyMetrics.lastWeek.totalRevenue)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Đơn hàng</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">{weeklyMetrics.thisWeek.totalOrders}</span>
                                    <span className="text-xs flex items-center">
                                        {getTrendIcon(weeklyMetrics.thisWeek.totalOrders, weeklyMetrics.lastWeek.totalOrders)}
                                        <span className={weeklyMetrics.thisWeek.totalOrders >= weeklyMetrics.lastWeek.totalOrders ? "text-emerald-600 text-[10px]" : "text-red-500 text-[10px]"}>
                                            {getTrendPercent(weeklyMetrics.thisWeek.totalOrders, weeklyMetrics.lastWeek.totalOrders)}
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Tỷ lệ chốt</p>
                                <span className="text-base font-semibold text-slate-900">{weeklyMetrics.thisWeek.conversionRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    {/* Last Week */}
                    <div className="opacity-60">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Tuần trước</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Cuộc gọi</p>
                                <p className="text-base font-semibold text-slate-600">{weeklyMetrics.lastWeek.totalCalls}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Doanh số</p>
                                <p className="text-base font-semibold text-slate-600">{formatPrice(weeklyMetrics.lastWeek.totalRevenue)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Đơn hàng</p>
                                <p className="text-base font-semibold text-slate-600">{weeklyMetrics.lastWeek.totalOrders}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase mb-1">Tỷ lệ chốt</p>
                                <p className="text-base font-semibold text-slate-600">{weeklyMetrics.lastWeek.conversionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900">Lịch sử hiệu quả</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3 font-medium">Ngày</th>
                                <th className="px-5 py-3 font-medium text-center">Cuộc gọi</th>
                                <th className="px-5 py-3 font-medium text-center">Đơn thành công</th>
                                <th className="px-5 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-5 py-3 font-medium text-right">Hoa hồng ({COMMISSION_RATE * 100}%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-sm">Chưa có dữ liệu trong khoảng này.</td>
                                </tr>
                            ) : (
                                history.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-800">{row.dateLabel}</td>
                                        <td className="px-5 py-3 text-center text-slate-600">{row.calls}</td>
                                        <td className="px-5 py-3 text-center text-slate-600">{row.orders}</td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-800">{formatPrice(row.revenue)}</td>
                                        <td className="px-5 py-3 text-right font-medium text-emerald-600">{formatPrice(row.commission)}</td>
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
