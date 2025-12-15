"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, Filter, ChevronDown } from "lucide-react";
import { TelesalesTask, getMyTasks } from "@/lib/telesalesTasksStore";
import { calculateKpiSummary, calculateKpiHistory, COMMISSION_RATE } from "@/lib/telesalesKpiSelectors";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function TelesalesEarningsPage() {
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [dateRange, setDateRange] = useState<'today' | 'this_week' | 'this_month' | 'last_7_days' | 'last_30_days'>('this_month');

    // Load data
    useEffect(() => {
        setTasks(getMyTasks());
        const handleUpdate = () => setTasks(getMyTasks());
        window.addEventListener("telesales-tasks-updated", handleUpdate);
        return () => window.removeEventListener("telesales-tasks-updated", handleUpdate);
    }, []);

    // Derived State: Date Range for KPI Summary
    const { from, to } = useMemo(() => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        switch (dateRange) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_7_days':
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_30_days':
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
        }
        return { from: start, to: end };
    }, [dateRange]);

    // Calculate Summary Data
    const summary = useMemo(() => calculateKpiSummary(tasks, from, to), [tasks, from, to]);

    // Calculate History Data (Table)
    const history = useMemo(() => calculateKpiHistory(tasks, viewMode, 30), [tasks, viewMode]);

    const getDateRangeLabel = () => {
        switch (dateRange) {
            case 'today': return "Hôm nay";
            case 'this_week': return "Tuần này";
            case 'this_month': return "Tháng này";
            case 'last_7_days': return "7 ngày qua";
            case 'last_30_days': return "30 ngày qua";
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
                            {getDateRangeLabel()}
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                            <button onClick={() => setDateRange('today')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'today' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Hôm nay</button>
                            <button onClick={() => setDateRange('this_week')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_week' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tuần này</button>
                            <button onClick={() => setDateRange('this_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_month' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tháng này</button>
                            <div className="border-t border-slate-100 my-1"></div>
                            <button onClick={() => setDateRange('last_7_days')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_7_days' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>7 ngày qua</button>
                            <button onClick={() => setDateRange('last_30_days')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_30_days' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>30 ngày qua</button>
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
                            {getDateRangeLabel()}
                        </span>
                    </div>
                    <div>
                        <p className="text-primary-100 font-medium mb-1">Doanh số Telesales</p>
                        <h3 className="text-3xl font-bold">{formatPrice(summary.totalRevenue)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                        <span className="text-primary-100">{summary.totalOrders} đơn hàng thành công</span>
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
                        <h3 className="text-3xl font-bold text-slate-900">{formatPrice(summary.totalCommission)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-green-600 font-medium">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        Theo doanh số thực tế
                    </div>
                </div>

                {/* KPI Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Tỷ lệ chốt đơn</p>
                        <h3 className="text-3xl font-bold text-slate-900">{summary.conversionRate.toFixed(1)}%</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-500">
                        {summary.totalOrders} đơn / {summary.totalCalls} cuộc gọi
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Lịch sử hiệu quả</h3>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Theo Ngày
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Theo Tuần
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Thời gian</th>
                                <th className="px-6 py-3 font-medium text-center">Cuộc gọi</th>
                                <th className="px-6 py-3 font-medium text-center">Đơn thành công</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Hoa hồng ({COMMISSION_RATE * 100}%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu trong khoảng thời gian này.</td>
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
                        {/* Footer Totals (Optional) */}
                        {history.length > 0 && (
                            <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                                <tr>
                                    <td className="px-6 py-3">Tổng cộng (30 ngày gần đây)</td>
                                    <td className="px-6 py-3 text-center">{history.reduce((a, b) => a + b.calls, 0)}</td>
                                    <td className="px-6 py-3 text-center">{history.reduce((a, b) => a + b.orders, 0)}</td>
                                    <td className="px-6 py-3 text-right">{formatPrice(history.reduce((a, b) => a + b.revenue, 0))}</td>
                                    <td className="px-6 py-3 text-right text-green-600">{formatPrice(history.reduce((a, b) => a + b.commission, 0))}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
