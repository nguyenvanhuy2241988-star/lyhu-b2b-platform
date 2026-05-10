"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    DollarSign, TrendingUp, Calendar, ChevronDown, Download, Package,
    Target, Award, MapPin, CheckCircle2, Route, ShoppingCart, Loader2
} from "lucide-react";
import { Order, fetchOrders } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
const formatNumber = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

type DateRangeOption = 'today' | 'this_week' | 'this_month';

interface GTMetrics {
    totalCheckins: number;
    uniqueOutlets: number;
    totalOrders: number;
    totalRevenue: number;
    routeCompletionRate: number;
    totalRoutes: number;
    completedRoutes: number;
}

export default function GTEarningsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [checkinData, setCheckinData] = useState<any[]>([]);
    const [routeData, setRouteData] = useState<any[]>([]);
    const [dailyStats, setDailyStats] = useState<any[]>([]);

    const { user, session } = useAuth();

    const loadData = useCallback(async () => {
        if (!user || !session?.access_token) return;
        setIsLoading(true);

        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

        try {
            const [ordersRes, checkinsRes, routesRes] = await Promise.all([
                fetchOrders(session.access_token, {
                    userId: user.id,
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                supabase
                    .from('gt_checkins')
                    .select('id, outlet_id, check_in_at')
                    .eq('user_id', user.id)
                    .gte('check_in_at', startOfMonth.toISOString())
                    .lte('check_in_at', endOfMonth.toISOString()),
                supabase
                    .from('gt_routes')
                    .select('id, name, day_of_week, outlet_ids')
                    .eq('assigned_to', user.id)
                    .eq('status', 'active'),
            ]);

            setOrders(ordersRes);
            setCheckinData(checkinsRes.data || []);
            setRouteData(routesRes.data || []);

            // Build daily stats for history table
            const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
            const daily: any[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
                const dayStart = new Date(selectedYear, selectedMonth, d, 0, 0, 0);
                const dayEnd = new Date(selectedYear, selectedMonth, d, 23, 59, 59, 999);
                if (dayStart > new Date()) break;

                const dayCheckins = (checkinsRes.data || []).filter((c: any) => {
                    const t = new Date(c.check_in_at);
                    return t >= dayStart && t <= dayEnd;
                });
                const dayOrders = ordersRes.filter((o: any) => {
                    const t = new Date(o.createdAt);
                    return t >= dayStart && t <= dayEnd;
                });
                const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                const uniqueOutlets = new Set(dayCheckins.map((c: any) => c.outlet_id)).size;

                daily.push({
                    date: dayStart,
                    dateLabel: `${String(d).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}`,
                    checkins: dayCheckins.length,
                    uniqueOutlets,
                    orders: dayOrders.length,
                    revenue: dayRevenue,
                });
            }
            setDailyStats(daily);
        } catch (error) {
            console.error("loadData error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, session?.access_token, selectedMonth, selectedYear]);

    useEffect(() => { if (user && session?.access_token) loadData(); }, [loadData, user, session?.access_token]);

    // Date range computation
    const { currentRange, rangeLabel } = useMemo(() => {
        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        let rangeFrom = startOfMonth, rangeTo = endOfMonth, label = '';

        switch (dateRange) {
            case 'today': {
                const now = new Date();
                rangeFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                rangeTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                label = "Hôm nay";
                break;
            }
            case 'this_week': {
                const now = new Date();
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                rangeFrom = new Date(now);
                rangeFrom.setDate(now.getDate() + mondayOffset);
                rangeFrom.setHours(0, 0, 0, 0);
                rangeTo = new Date(rangeFrom);
                rangeTo.setDate(rangeFrom.getDate() + 6);
                rangeTo.setHours(23, 59, 59, 999);
                label = "Tuần này";
                break;
            }
            case 'this_month':
                label = `${monthNames[selectedMonth]} ${selectedYear}`;
                break;
        }
        return { currentRange: { from: rangeFrom, to: rangeTo }, rangeLabel: label };
    }, [dateRange, selectedMonth, selectedYear]);

    // Compute metrics for current range
    const metrics = useMemo((): GTMetrics => {
        const filteredCheckins = checkinData.filter(c => {
            const t = new Date(c.check_in_at);
            return t >= currentRange.from && t <= currentRange.to;
        });
        const filteredOrders = orders.filter(o => {
            const t = new Date(o.createdAt);
            return t >= currentRange.from && t <= currentRange.to;
        });

        const uniqueOutlets = new Set(filteredCheckins.map(c => c.outlet_id)).size;
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Route completion: for each route scheduled in the period, check if all outlets were visited
        let completedRoutes = 0;
        let totalRouteSlots = 0;
        routeData.forEach(route => {
            // Count how many days in the range this route is scheduled
            const start = currentRange.from;
            const end = currentRange.to;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (route.day_of_week.includes(d.getDay())) {
                    totalRouteSlots++;
                    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
                    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
                    const dayCheckinOutlets = new Set(
                        filteredCheckins
                            .filter(c => {
                                const t = new Date(c.check_in_at);
                                return t >= dayStart && t <= dayEnd;
                            })
                            .map(c => c.outlet_id)
                    );
                    const allVisited = (route.outlet_ids || []).every((id: string) => dayCheckinOutlets.has(id));
                    if (allVisited && (route.outlet_ids || []).length > 0) completedRoutes++;
                }
            }
        });

        const routeCompletionRate = totalRouteSlots > 0 ? Math.round((completedRoutes / totalRouteSlots) * 100) : 0;

        return {
            totalCheckins: filteredCheckins.length,
            uniqueOutlets,
            totalOrders: filteredOrders.length,
            totalRevenue,
            routeCompletionRate,
            totalRoutes: totalRouteSlots,
            completedRoutes,
        };
    }, [checkinData, orders, routeData, currentRange]);

    // Month navigation
    const goToPrevMonth = () => {
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
        setDateRange('this_month');
    };
    const goToNextMonth = () => {
        const now = new Date();
        if (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth()) return;
        if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
        else setSelectedMonth(m => m + 1);
        setDateRange('this_month');
    };
    const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

    // CSV Export
    const handleExportCsv = () => {
        if (dailyStats.length === 0) { alert("Không có dữ liệu để xuất."); return; }
        const headers = ["Ngày", "Check-in", "Điểm bán", "Đơn hàng", "Doanh số"];
        const rows = dailyStats.map(r => [r.dateLabel, r.checkins, r.uniqueOutlets, r.orders, r.revenue]);
        const csvContent = [
            "BÁO CÁO KPI SALES GT",
            `Phạm vi: ${rangeLabel}`,
            `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`,
            "", headers.join(","), ...rows.map(r => r.join(","))
        ].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `gt_kpi_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-slate-900">Thu nhập & KPI</h1>
                <div className="flex items-center gap-2">
                    {/* Month Navigator */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={goToPrevMonth} className="px-2 py-2 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600">
                            <ChevronDown className="w-4 h-4 rotate-90" />
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-slate-700 min-w-[140px] text-center">
                            <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                            {rangeLabel}
                        </span>
                        <button onClick={goToNextMonth}
                            className={`px-2 py-2 transition-colors ${isCurrentMonth ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            disabled={isCurrentMonth}>
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                        </button>
                    </div>
                    {/* Quick Filters */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        {(['today', 'this_week', 'this_month'] as DateRangeOption[]).map(opt => (
                            <button key={opt} onClick={() => setDateRange(opt)}
                                className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${dateRange === opt ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                {opt === 'today' ? 'Ngày' : opt === 'this_week' ? 'Tuần' : 'Tháng'}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4 text-slate-400" /> Xuất
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-teal-50 rounded-lg"><MapPin className="w-4 h-4 text-teal-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Check-in</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{metrics.totalCheckins}</p>
                    <p className="text-xs text-slate-400 mt-1">{metrics.uniqueOutlets} điểm bán khác nhau</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg"><ShoppingCart className="w-4 h-4 text-blue-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Đơn hàng</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{metrics.totalOrders}</p>
                    <p className="text-xs text-slate-400 mt-1">đơn tạo mới</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg"><DollarSign className="w-4 h-4 text-purple-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Doanh số</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatPrice(metrics.totalRevenue)}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-amber-50 rounded-lg"><Route className="w-4 h-4 text-amber-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Hoàn thành tuyến</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{metrics.routeCompletionRate}%</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full transition-all ${metrics.routeCompletionRate >= 80 ? 'bg-emerald-500' : metrics.routeCompletionRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${Math.min(metrics.routeCompletionRate, 100)}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{metrics.completedRoutes}/{metrics.totalRoutes} lượt tuyến</p>
                </div>
            </div>

            {/* Daily History Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-500" /> Chi tiết theo ngày
                    </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100 sticky top-0">
                                    <th className="p-3 text-xs font-medium">Ngày</th>
                                    <th className="p-3 text-xs font-medium text-center">Check-in</th>
                                    <th className="p-3 text-xs font-medium text-center">Điểm bán</th>
                                    <th className="p-3 text-xs font-medium text-center">Đơn hàng</th>
                                    <th className="p-3 text-xs font-medium text-right">Doanh số</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dailyStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">Chưa có dữ liệu.</td>
                                    </tr>
                                ) : (
                                    dailyStats.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-medium text-slate-700">{row.dateLabel}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.checkins > 0 ? 'bg-teal-50 text-teal-700' : 'text-slate-400'}`}>
                                                    {row.checkins}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-slate-600">{row.uniqueOutlets}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.orders > 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-400'}`}>
                                                    {row.orders}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-medium text-slate-900">{row.revenue > 0 ? formatPrice(row.revenue) : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {dailyStats.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                        <td className="p-3 text-slate-700">Tổng</td>
                                        <td className="p-3 text-center text-teal-700">{dailyStats.reduce((s, r) => s + r.checkins, 0)}</td>
                                        <td className="p-3 text-center text-slate-600">-</td>
                                        <td className="p-3 text-center text-blue-700">{dailyStats.reduce((s, r) => s + r.orders, 0)}</td>
                                        <td className="p-3 text-right text-slate-900">{formatPrice(dailyStats.reduce((s, r) => s + r.revenue, 0))}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {dailyStats.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Chưa có dữ liệu.</div>
                        ) : (
                            <>
                                {dailyStats.map((row, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-semibold text-slate-900">{row.dateLabel}</span>
                                            <span className="font-bold text-slate-900">{row.revenue > 0 ? formatPrice(row.revenue) : '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-slate-50 p-2 rounded text-center">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Check-in</div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.checkins > 0 ? 'bg-teal-50 text-teal-700' : 'text-slate-400'}`}>
                                                    {row.checkins}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded text-center">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Điểm bán</div>
                                                <span className="text-xs font-medium text-slate-700">{row.uniqueOutlets}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded text-center">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Đơn hàng</div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.orders > 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-400'}`}>
                                                    {row.orders}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {dailyStats.length > 0 && (
                                    <div className="p-4 bg-slate-50 font-bold border-t border-slate-200 mt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-700">Tổng doanh số</span>
                                            <span className="text-slate-900 text-lg">{formatPrice(dailyStats.reduce((s, r) => s + r.revenue, 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className="text-slate-500">Tổng Check-in: <span className="text-teal-700">{dailyStats.reduce((s, r) => s + r.checkins, 0)}</span></span>
                                            <span className="text-slate-500">Tổng Đơn hàng: <span className="text-blue-700">{dailyStats.reduce((s, r) => s + r.orders, 0)}</span></span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders Detail */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" /> Đơn hàng trong kỳ
                    </h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100 sticky top-0">
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
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">Chưa có đơn hàng nào.</td></tr>
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
                                                <td className="p-3 text-right font-medium text-teal-600">{formatPrice(o.totalAmount || 0)}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {o.status === 'delivered' ? 'Thành công' : o.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {orders.filter(o => {
                            const d = new Date(o.createdAt);
                            return d >= currentRange.from && d <= currentRange.to;
                        }).length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Chưa có đơn hàng nào.</div>
                        ) : (
                            orders
                                .filter(o => {
                                    const d = new Date(o.createdAt);
                                    return d >= currentRange.from && d <= currentRange.to;
                                })
                                .map((o) => (
                                    <div key={o.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium text-slate-900 text-sm">{o.customerName}</div>
                                                <div className="font-mono text-[11px] text-slate-400 mt-0.5">#{o.readableId || o.id.slice(0, 8)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-teal-600">{formatPrice(o.totalAmount || 0)}</div>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {o.status === 'delivered' ? 'Thành công' : o.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
