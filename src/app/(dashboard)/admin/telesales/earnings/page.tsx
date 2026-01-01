"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Download, Users, Phone, ShoppingBag, DollarSign, TrendingUp, Search, ArrowUpRight, ArrowDownRight, ChevronDown } from "lucide-react";
import { calculateKpiProgress, getGlobalKpiSummary, getKpiSummaryByUser, AdminTeleKpiRow, getWeeklyRanges } from "@/lib/telesalesKpiSelectors";
import { ROLES } from "@/lib/constants";

// Local helper if utils doesn't have it
const formatCurrency = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

type DateRangeOption = 'today' | 'last_7_days' | 'this_month';

export default function AdminTelesalesKpiPage() {
    const [dateRange, setDateRange] = useState<DateRangeOption>('today');
    // We need to trigger re-renders when data changes (e.g. if we were listening to events).
    // For now, let's just mount and calc. If real-time needed, we add listeners.
    // However, the selectors use `loadTasks` which reads from localStorage. 
    // We should use a simple state to force re-read or just rely on mount if admin doesn't expect live updates without refresh.
    // Better: Add listener like in telesales page.
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const handleUpdate = () => setRefreshKey(prev => prev + 1);
        window.addEventListener("telesales-tasks-updated", handleUpdate);
        window.addEventListener("users-updated", handleUpdate);
        return () => {
            window.removeEventListener("telesales-tasks-updated", handleUpdate);
            window.removeEventListener("users-updated", handleUpdate);
        }
    }, []);

    // Derived State
    const { from, to, label } = useMemo(() => {
        const now = new Date();
        const start = new Date();
        const end = new Date();
        let l = "";

        switch (dateRange) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                l = "Hôm nay";
                break;
            case 'last_7_days':
                start.setDate(now.getDate() - 6);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                l = "7 ngày gần đây";
                break;
            case 'this_month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                l = "Tháng này";
                break;
        }
        return { from: start, to: end, label: l };
    }, [dateRange]);

    // Data State (Async)
    const [teamStats, setTeamStats] = useState<any>({
        totalCalls: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        conversionRate: 0
    });
    const [userStats, setUserStats] = useState<AdminTeleKpiRow[]>([]);

    useEffect(() => {
        let alive = true;
        const fetchData = async () => {
            try {
                const [g, u] = await Promise.all([
                    getGlobalKpiSummary(from, to),
                    getKpiSummaryByUser(from, to)
                ]);
                if (!alive) return;
                setTeamStats(g);
                setUserStats(u);
            } catch (err) {
                console.error("Error loading KPI", err);
            }
        };
        fetchData();
        return () => { alive = false; };
    }, [from, to, refreshKey]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof AdminTeleKpiRow; direction: 'asc' | 'desc' } | null>({ key: 'totalRevenue', direction: 'desc' });

    const sortedUsers = useMemo(() => {
        if (!sortConfig) return userStats;
        return [...userStats].sort((a, b) => {
            // Special handling for string vs number if needed, but keys here are mostly numbers
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [userStats, sortConfig]);

    const handleSort = (key: keyof AdminTeleKpiRow) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

    const SortIcon = ({ column }: { column: keyof AdminTeleKpiRow }) => {
        if (sortConfig?.key !== column) return <ArrowDownRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-50" />;
        return sortConfig.direction === 'asc' ?
            <ArrowUpRight className="w-3 h-3 text-primary-600" /> :
            <ArrowDownRight className="w-3 h-3 text-primary-600" />;
    };

    // Export CSV
    const handleExport = () => {
        const headers = ["Nhân viên", "Cuộc gọi", "Đơn hàng", "Doanh số", "Hoa hồng", "Tỷ lệ chốt", "Tiến độ KPI"];
        const rows = sortedUsers.map(u => [
            u.userName,
            u.totalCalls,
            u.totalOrders,
            u.totalRevenue,
            u.totalCommission,
            `${u.conversionRate.toFixed(1)}%`,
            `${u.overallProgress.toFixed(1)}%`
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `admin_telesales_kpi_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">KPI Telesales theo nhân sự</h1>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                {label}
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 hidden group-hover:block">
                                <button onClick={() => setDateRange('today')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'today' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Hôm nay</button>
                                <button onClick={() => setDateRange('last_7_days')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'last_7_days' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>7 ngày gần đây</button>
                                <button onClick={() => setDateRange('this_month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${dateRange === 'this_month' ? 'text-primary-600 font-medium' : 'text-slate-700'}`}>Tháng này</button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
                    >
                        <Download className="w-4 h-4 text-slate-500" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Team Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">Tổng doanh số team</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(teamStats.totalRevenue)}</div>
                    <div className="text-sm text-slate-500 mt-1">{teamStats.totalOrders} đơn hàng</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">Hoa hồng ước tính</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(teamStats.totalCommission)}</div>
                    <div className="text-sm text-slate-500 mt-1">Toàn team</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Phone className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">Số cuộc gọi & Tỷ lệ chốt</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{teamStats.totalCalls}</span>
                        <span className="text-sm text-slate-500">cuộc gọi</span>
                    </div>
                    <div className="text-sm font-medium text-purple-600 mt-1">
                        {teamStats.conversionRate.toFixed(1)}% chốt đơn
                    </div>
                </div>
            </div>

            {/* User Details Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Chi tiết theo nhân sự</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nhân sự</th>
                                <th
                                    className="px-6 py-3 font-medium text-center cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('totalCalls')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Cuộc gọi
                                        <SortIcon column="totalCalls" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium text-center cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('totalOrders')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Hàng
                                        <SortIcon column="totalOrders" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium text-right cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('totalRevenue')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Doanh số
                                        <SortIcon column="totalRevenue" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium text-right cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('totalCommission')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Hoa hồng
                                        <SortIcon column="totalCommission" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium text-center cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('conversionRate')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Tỷ lệ chốt
                                        <SortIcon column="conversionRate" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 font-medium text-center">Tiến độ KPI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu nhân sự telesales.</td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr key={user.userId} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                    {user.userName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.userName}</div>
                                                    <div className="text-xs text-slate-500">Telesales</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600">
                                            {user.totalCalls}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600">
                                            {user.totalOrders}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatCurrency(user.totalRevenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-green-600">
                                            {formatCurrency(user.totalCommission)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${user.conversionRate >= 10 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {user.conversionRate.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 max-w-[100px] mx-auto">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>{user.overallProgress.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${user.overallProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(user.overallProgress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
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
