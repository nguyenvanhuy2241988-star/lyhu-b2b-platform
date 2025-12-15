"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown, Clock } from "lucide-react";
import { TelesalesTask, getMyTasks } from "@/lib/telesalesTasksStore";
import { calculateKpiMetrics, calculateKpiHistory, COMMISSION_RATE } from "@/lib/telesalesKpiSelectors";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

type DateRangeOption = 'today' | 'last_7_days' | 'this_month';

export default function TelesalesEarningsPage() {
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');

    // Load data
    useEffect(() => {
        setTasks(getMyTasks());
        const handleUpdate = () => setTasks(getMyTasks());
        window.addEventListener("telesales-tasks-updated", handleUpdate);
        return () => window.removeEventListener("telesales-tasks-updated", handleUpdate);
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
                // Already set to start of today derived from `start`
                end.setHours(23, 59, 59, 999);
                label = "Hôm nay";
                break;

            case 'last_7_days':
                start.setDate(now.getDate() - 6); // 7 days inclusive: [Today-6, Today]
                end.setHours(23, 59, 59, 999);
                label = "7 ngày gần đây";
                break;

            case 'this_month':
                start.setDate(1); // 1st of month
                end.setMonth(end.getMonth() + 1);
                end.setDate(0); // End of month
                end.setHours(23, 59, 59, 999);
                label = `Tháng ${now.getMonth() + 1}`;
                break;
        }

        // Previous Period (Simple comparison: Previous Month for 'this_month', or generic previous period)
        // For simplicity, mimicking 'this_month' comparison logic for now, or just Previous Month
        const prevStart = new Date(start);
        prevStart.setMonth(prevStart.getMonth() - 1);
        const prevEnd = new Date(start);
        prevEnd.setDate(0);
        prevEnd.setHours(23, 59, 59, 999);

        return {
            currentRange: { from: start, to: end },
            todayRange: { from: todayStart, to: todayEnd },
            prevRange: { from: prevStart, to: prevEnd }, // Mostly reused for "Growth" calculation logic if applicable
            rangeLabel: label
        };
    }, [dateRange]);

    // Calculate Metrics
    const currentMetrics = useMemo(() => calculateKpiMetrics(tasks, currentRange.from, currentRange.to), [tasks, currentRange]);
    const todayMetrics = useMemo(() => calculateKpiMetrics(tasks, todayRange.from, todayRange.to), [tasks, todayRange]);

    // Comparison for This Month (only relevant if 'this_month' selected or generally useful?)
    // User asked for filters. The cards relying on filters are the 3 big ones.
    // The "Today" card is independent.

    // We can keep 'prevMetrics' to compare "This Month" vs "Last Month" if 'this_month' is selected. 
    // If 'today' or 'last_7_days' is selected, growth vs "last month" might be waiting for user feedback, 
    // but code currently compares vs "prevRange" defined in useMemo. 
    // For 'this_month', prevRange is Last Month. 
    // For 'today', prevRange is... Last Month? (logic above sets it to last month from start date).

    // Let's refine prevRange for 'today':
    // If 'today' -> comparison vs 'yesterday'? Or 'average'? 
    // Current code: prevStart = today - 1 month. This is "Same day last month". Strange.
    // For simplicity, I will hide the growth indicator if filter is NOT 'this_month', or keep it simple.
    // User requested "3 thẻ lớn tính toán lại theo dữ liệu đã lọc". Growth is strictly required? 
    // Existing code had comparison. I'll keep it but only show relevant label or just keep it as is.

    const prevMetrics = useMemo(() => calculateKpiMetrics(tasks, prevRange.from, prevRange.to), [tasks, prevRange]);

    const revenueGrowth = prevMetrics.totalRevenue > 0
        ? ((currentMetrics.totalRevenue - prevMetrics.totalRevenue) / prevMetrics.totalRevenue) * 100
        : (currentMetrics.totalRevenue > 0 ? 100 : 0);

    // Calculate History (Table) - Sorted descending
    const history = useMemo(() => calculateKpiHistory(tasks, currentRange.from, currentRange.to), [tasks, currentRange]);

    const getDateRangeText = () => {
        switch (dateRange) {
            case 'today': return "Hôm nay";
            case 'last_7_days': return "7 ngày gần đây";
            case 'this_month': return "Tháng này";
            default: return "";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Thu nhập & KPI</h1>

                {/* Filters */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {getDateRangeText()}
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                            <button onClick={() => setDateRange('today')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'today' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Hôm nay</button>
                            <button onClick={() => setDateRange('last_7_days')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_7_days' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>7 ngày gần đây</button>
                            <button onClick={() => setDateRange('this_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_month' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tháng này</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                {/* 1. Today KPI Card (New) */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                            Hôm nay
                        </span>
                    </div>
                    <div>
                        <p className="text-indigo-100 font-medium mb-1">KPI Hôm nay</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Cuộc gọi:</span>
                                <span className="font-bold">{todayMetrics.totalCalls}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Đơn hàng:</span>
                                <span className="font-bold">{todayMetrics.totalOrders}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-white/10 mt-2">
                                <span>Doanh số:</span>
                                <span className="font-bold">{formatPrice(todayMetrics.totalRevenue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Revenue Card (Filtered) */}
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

                {/* 3. Commission Card (Filtered) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Hoa hồng ({COMMISSION_RATE * 100}%)</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatPrice(currentMetrics.totalCommission)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm">
                        {/* Show growth only if This Month is selected for clarity, or just generic */}
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

                {/* 4. Conversion Card (Filtered) */}
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
