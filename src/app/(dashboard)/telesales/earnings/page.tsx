"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown, Clock, Download } from "lucide-react";
import { TelesalesTask, getMyTasks } from "@/lib/telesalesTasksStore";
import { Order, loadOrders } from "@/lib/ordersStore";
import { getCurrentUser } from "@/lib/auth";
import {
    calculateCombinedMetrics,
    calculateKpiHistory,
    COMMISSION_RATE,
    getWeeklyRanges,
    calculateKpiProgress,
    getTodayTargetForCurrentUser,
    calculateKpiRemaining
} from "@/lib/telesalesKpiSelectors";

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
    const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');

    // Load data
    useEffect(() => {
        const loadData = () => {
            setTasks(getMyTasks());
            const user = getCurrentUser();
            if (user) {
                const all = loadOrders();
                const myOrders = all.filter(o =>
                    o.source === "TELESALES" &&
                    o.telesalesUserId === user.id
                );
                setOrders(myOrders);
            }
        };

        loadData();

        window.addEventListener("telesales-tasks-updated", loadData);
        window.addEventListener("orders-updated", loadData);

        return () => {
            window.removeEventListener("telesales-tasks-updated", loadData);
            window.removeEventListener("orders-updated", loadData);
        };
    }, []);

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

    // Metrics
    const currentMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, currentRange.from, currentRange.to), [tasks, orders, currentRange]);

    // Today & Target Metrics
    const todayMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, todayRange.from, todayRange.to), [tasks, orders, todayRange]);
    const todayTarget = useMemo(() => getTodayTargetForCurrentUser(), []);
    const todayRemaining = useMemo(() => calculateKpiRemaining(todayMetrics, todayTarget), [todayMetrics, todayTarget]);
    const { status: todayKpiStatus, percentage: todayKpiPercent } = useMemo(() => calculateKpiProgress(todayMetrics), [todayMetrics]);

    // Comparison for Filtered Data
    const prevMetrics = useMemo(() => calculateCombinedMetrics(tasks, orders, prevRange.from, prevRange.to), [tasks, orders, prevRange]);
    const revenueGrowth = prevMetrics.totalRevenue > 0
        ? ((currentMetrics.totalRevenue - prevMetrics.totalRevenue) / prevMetrics.totalRevenue) * 100
        : (currentMetrics.totalRevenue > 0 ? 100 : 0);

    // Weekly Comparison Metrics
    const weeklyMetrics = useMemo(() => {
        const ranges = getWeeklyRanges();
        const thisWeek = calculateCombinedMetrics(tasks, orders, ranges.thisWeek.from, ranges.thisWeek.to);
        const lastWeek = calculateCombinedMetrics(tasks, orders, ranges.lastWeek.from, ranges.lastWeek.to);
        return { thisWeek, lastWeek };
    }, [tasks, orders]);

    // History Table
    const history = useMemo(() => calculateKpiHistory(tasks, currentRange.from, currentRange.to, orders), [tasks, orders, currentRange]);

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

        const headers = ["Ngày", "Cuộc gọi", "Đơn thành công", "Doanh số", "Hoa hồng", "Tỷ lệ chốt"];
        const rows = history.map(row => {
            // Re-calculate conversion for row if not present
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
            headers.join(","),
            ...rows.map(r => r.join(","))
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
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-16 h-16" />
                    </div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded backdrop-blur-sm border ${todayKpiStatus === 'good' ? 'bg-green-500/20 border-green-400 text-green-100' : 'bg-orange-500/20 border-orange-400 text-orange-100'}`}>
                            {todayKpiStatus === 'good' ? 'Đã đạt' : 'Cần cố gắng'}
                        </span>
                    </div>

                    <div className="relative z-10">
                        <div className="mb-3">
                            <p className="text-indigo-100 font-medium mb-1 flex justify-between">
                                <span>KPI Hôm nay</span>
                                <span className="text-white font-bold">{todayKpiPercent}%</span>
                            </p>
                            {/* Progress Bar */}
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${todayKpiStatus === 'good' ? 'bg-green-400' : (todayKpiStatus === 'warning' ? 'bg-yellow-400' : 'bg-red-400')}`}
                                    style={{ width: `${Math.min(todayKpiPercent, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                                <span className="opacity-80">Cuộc gọi:</span>
                                <span className="font-bold">{todayMetrics.totalCalls}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-80">Đơn hàng:</span>
                                <span className="font-bold">{todayMetrics.totalOrders}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-80">Doanh số:</span>
                                <span className="font-bold">{formatPrice(todayMetrics.totalRevenue)}</span>
                            </div>
                        </div>

                        {/* Target & Remaining Section */}
                        {todayRemaining.isCompleted ? (
                            <div className="mt-3 pt-2 border-t border-white/10 text-center">
                                <span className="text-green-300 font-bold text-sm">🎉 Đã hoàn thành chỉ tiêu!</span>
                            </div>
                        ) : (
                            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-indigo-200">
                                <div className="flex justify-between mb-0.5">
                                    <span>Chỉ tiêu:</span>
                                    <span>{todayTarget.callsPerDay} gọi · {todayTarget.ordersPerDay} đơn · {formatPrice(todayTarget.revenuePerDay)}</span>
                                </div>
                                <div className="flex justify-between text-orange-200 font-medium">
                                    <span>Còn thiếu:</span>
                                    <span>
                                        {todayRemaining.calls > 0 && `${todayRemaining.calls} gọi `}
                                        {todayRemaining.orders > 0 && `· ${todayRemaining.orders} đơn `}
                                        {todayRemaining.revenue > 0 && `· ${formatPrice(todayRemaining.revenue)}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Revenue Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {rangeLabel}
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Doanh số</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatPrice(currentMetrics.totalRevenue)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                        <span>{currentMetrics.totalOrders} đơn hàng</span>
                    </div>
                </div>

                {/* 3. Commission Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Hoa hồng ước tính</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatPrice(currentMetrics.totalCommission)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm">
                        {dateRange === 'this_month' && (
                            <div className={`flex items-center font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                                {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs tháng trước
                            </div>
                        )}
                        {dateRange !== 'this_month' && (
                            <div className="text-slate-400 italic text-xs">Theo bộ lọc</div>
                        )}
                    </div>
                </div>

                {/* 4. Conversion Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Tỷ lệ chốt</p>
                        <h3 className="text-2xl font-bold text-slate-900">{currentMetrics.conversionRate.toFixed(1)}%</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-500">
                        {currentMetrics.totalOrders} đơn / {currentMetrics.totalCalls} cuộc gọi
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
