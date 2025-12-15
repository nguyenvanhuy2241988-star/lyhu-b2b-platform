"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown } from "lucide-react";
import { TelesalesTask, getMyTasks } from "@/lib/telesalesTasksStore";
import { calculateKpiMetrics, calculateKpiHistory, COMMISSION_RATE } from "@/lib/telesalesKpiSelectors";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

type DateRangeOption = 'this_month' | 'last_month' | 'last_3_months';

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
    const { currentRange, prevRange, rangeLabel } = useMemo(() => {
        const now = new Date();
        const start = new Date();
        const end = new Date();
        let prevStart = new Date();
        let prevEnd = new Date();
        let label = "";

        // Reset to start of day for safety
        start.setHours(0, 0, 0, 0);

        switch (dateRange) {
            case 'this_month':
                // First day of this month
                start.setDate(1);
                // End of this month (implied by going to next month 0th day, or just current time if we only care up to now)
                // Actually user said "Tháng hiện tại". Usually means full month range.
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);

                label = `Tháng ${now.getMonth() + 1}`;

                // Prev Range: Last Month
                prevStart = new Date(start);
                prevStart.setMonth(prevStart.getMonth() - 1);
                prevEnd = new Date(start);
                prevEnd.setDate(0);
                prevEnd.setHours(23, 59, 59, 999);
                break;

            case 'last_month':
                // Logic:
                // If today is Dec 15.
                // Last Month = Nov 1 to Nov 30.

                // Let's redo explicit dates
                const m = now.getMonth();
                const y = now.getFullYear();

                // Last month start
                start.setFullYear(y, m - 1, 1);
                // Last month end
                end.setFullYear(y, m, 0);
                end.setHours(23, 59, 59, 999);

                label = `Tháng ${start.getMonth() + 1}`;

                // Prev Range: 2 Months ago
                prevStart = new Date(start);
                prevStart.setMonth(prevStart.getMonth() - 1);
                prevEnd = new Date(start);
                prevEnd.setDate(0);
                prevEnd.setHours(23, 59, 59, 999);
                break;

            case 'last_3_months':
                // Last 3 months include this month? User said "3 tháng gần nhất". 
                // Usually means [Now-3M, Now].
                start.setMonth(start.getMonth() - 2); // -2 implies (Current, Prev, PrevPrev) = 3 months total
                start.setDate(1);
                end.setHours(23, 59, 59, 999); // Up to now

                label = "3 tháng gần nhất";

                // Prev Range: The 3 months before that? Or just Previous Month for comparison?
                // Usually we compare vs "Previous Period".
                prevStart = new Date(start);
                prevStart.setMonth(prevStart.getMonth() - 3);
                prevEnd = new Date(start);
                prevEnd.setDate(0);
                prevEnd.setHours(23, 59, 59, 999);
                break;
        }

        return {
            currentRange: { from: start, to: end },
            prevRange: { from: prevStart, to: prevEnd },
            rangeLabel: label
        };
    }, [dateRange]);

    // Calculate Metrics
    const currentMetrics = useMemo(() => calculateKpiMetrics(tasks, currentRange.from, currentRange.to), [tasks, currentRange]);
    const prevMetrics = useMemo(() => calculateKpiMetrics(tasks, prevRange.from, prevRange.to), [tasks, prevRange]);

    // Calculate History (Table) - Sorted descending
    const history = useMemo(() => calculateKpiHistory(tasks, currentRange.from, currentRange.to), [tasks, currentRange]);

    // Comparison Logic
    const revenueGrowth = prevMetrics.totalRevenue > 0
        ? ((currentMetrics.totalRevenue - prevMetrics.totalRevenue) / prevMetrics.totalRevenue) * 100
        : (currentMetrics.totalRevenue > 0 ? 100 : 0);

    const getDateRangeText = () => {
        switch (dateRange) {
            case 'this_month': return "Tháng này";
            case 'last_month': return "Tháng trước";
            case 'last_3_months': return "3 tháng gần nhất";
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
                            <button onClick={() => setDateRange('this_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_month' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tháng này</button>
                            <button onClick={() => setDateRange('last_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_month' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tháng trước</button>
                            <button onClick={() => setDateRange('last_3_months')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_3_months' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>3 tháng gần nhất</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                            {rangeLabel}
                        </span>
                    </div>
                    <div>
                        <p className="text-primary-100 font-medium mb-1">Doanh số Telesales</p>
                        <h3 className="text-3xl font-bold">{formatPrice(currentMetrics.totalRevenue)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                        <span className="text-primary-100">{currentMetrics.totalOrders} đơn hàng thành công</span>
                    </div>
                </div>

                {/* Commission Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Hoa hồng ước tính ({COMMISSION_RATE * 100}%)</p>
                        <h3 className="text-3xl font-bold text-slate-900">{formatPrice(currentMetrics.totalCommission)}</h3>
                    </div>
                    <div className={`mt-4 pt-4 border-t border-slate-100 flex items-center text-sm font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% so với tháng trước
                    </div>
                </div>

                {/* Conversion Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Tỷ lệ chốt đơn</p>
                        <h3 className="text-3xl font-bold text-slate-900">{currentMetrics.conversionRate.toFixed(1)}%</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-500">
                        TB {currentMetrics.totalOrders} đơn / {currentMetrics.totalCalls} việc xử lý
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
                                <th className="px-6 py-3 font-medium text-center">Cuộc gọi (Xử lý)</th>
                                <th className="px-6 py-3 font-medium text-center">Đơn thành công</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Hoa hồng ({COMMISSION_RATE * 100}%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu trong kỳ đã chọn.</td>
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
