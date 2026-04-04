'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabaseClient';
import { fetchOrders, type Order, type OrderStatus, ORDER_STATUS_LABELS } from '@/lib/ordersStore';
import { fetchUsers, type User } from '@/lib/usersStore';
import {
    AlertCircle, ClipboardCheck, Truck, DollarSign, TrendingUp,
    ShoppingCart, Package, Clock, Users, Trophy, ArrowRight,
    Loader2, Eye, CheckCircle, XCircle, BarChart3, RefreshCw,
    Calendar, ChevronDown
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatCompact = (n: number) =>
    new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short', style: 'currency', currency: 'VND' }).format(n);

const formatDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b', processing: '#3b82f6', delivering: '#6366f1',
    delivered: '#10b981', returned: '#f97316', cancelled: '#ef4444',
};

// ========== TIME PRESETS ==========
type TimePreset = 'today' | '7days' | 'this_month' | 'last_month' | 'this_quarter' | 'custom';

const TIME_PRESETS: { key: TimePreset; label: string; short: string }[] = [
    { key: 'today', label: 'Hôm nay', short: 'Hôm nay' },
    { key: '7days', label: '7 ngày', short: '7 ngày' },
    { key: 'this_month', label: 'Tháng này', short: 'Tháng này' },
    { key: 'last_month', label: 'Tháng trước', short: 'Tháng trước' },
    { key: 'this_quarter', label: 'Quý này', short: 'Quý này' },
    { key: 'custom', label: 'Tùy chọn', short: 'Tùy chọn' },
];

function getPresetRange(preset: TimePreset): { from: Date; to: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    switch (preset) {
        case 'today':
            return { from: today, to: endOfDay };
        case '7days': {
            const from = new Date(today);
            from.setDate(from.getDate() - 6);
            return { from, to: endOfDay };
        }
        case 'this_month':
            return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay };
        case 'last_month': {
            const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return { from, to };
        }
        case 'this_quarter': {
            const q = Math.floor(now.getMonth() / 3);
            return { from: new Date(now.getFullYear(), q * 3, 1), to: endOfDay };
        }
        default:
            return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay };
    }
}

interface DayData {
    label: string;
    total: number;
    delivered: number;
    cancelled: number;
}

export default function SaleAdminDashboard() {
    const { session } = useAuth();
    const supabase = createClient();
    const token = session?.access_token;

    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Time filter state
    const [timePreset, setTimePreset] = useState<TimePreset>('this_month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [allOrders, allUsers] = await Promise.all([
                fetchOrders(token),
                fetchUsers(token)
            ]);
            setOrders(allOrders || []);
            setUsers(allUsers || []);
        } catch (err) {
            console.error('[SaleAdminDashboard] Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
        const channel = supabase
            .channel('sale-admin-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [loadData]);

    // ========== TIME RANGE ==========
    const { fromDate, toDate, rangeLabel } = useMemo(() => {
        if (timePreset === 'custom' && customFrom && customTo) {
            const f = new Date(customFrom);
            const t = new Date(customTo);
            t.setHours(23, 59, 59, 999);
            return {
                fromDate: f,
                toDate: t,
                rangeLabel: `${formatDate(customFrom)} — ${formatDate(customTo)}`
            };
        }
        const r = getPresetRange(timePreset);
        const preset = TIME_PRESETS.find(p => p.key === timePreset);
        return { fromDate: r.from, toDate: r.to, rangeLabel: preset?.label || '' };
    }, [timePreset, customFrom, customTo]);

    // ========== FILTERED DATA ==========
    const filteredOrders = useMemo(() =>
        orders.filter(o => {
            const d = new Date(o.createdAt);
            return d >= fromDate && d <= toDate;
        }), [orders, fromDate, toDate]);

    // Global stats (not time-filtered)
    const allPending = orders.filter(o => o.status === 'pending');
    const allDelivering = orders.filter(o => o.status === 'delivering');

    // Time-filtered stats
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayProcessed = orders.filter(o => {
        const d = new Date(o.createdAt).toISOString().split('T')[0];
        return d === todayStr && o.status !== 'pending';
    });

    const filteredRevenue = filteredOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const filteredDelivered = filteredOrders.filter(o => o.status === 'delivered').length;
    const deliveryRate = filteredOrders.length > 0
        ? Math.round((filteredDelivered / filteredOrders.length) * 100)
        : 0;

    // Status counts (filtered)
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    // Chart data: group by day within range
    const chartData = useMemo(() => {
        const days: DayData[] = [];
        const diffMs = toDate.getTime() - fromDate.getTime();
        const diffDays = Math.min(Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1, 90);

        for (let i = 0; i < diffDays; i++) {
            const d = new Date(fromDate);
            d.setDate(d.getDate() + i);
            const ds = d.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === ds);
            days.push({
                label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                total: dayOrders.length,
                delivered: dayOrders.filter(o => o.status === 'delivered').length,
                cancelled: dayOrders.filter(o => o.status === 'cancelled').length,
            });
        }
        return days;
    }, [orders, fromDate, toDate]);

    // Top 5 sales (filtered)
    const topSales = useMemo(() => {
        const map: Record<string, { name: string; count: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
            const uid = o.telesalesUserId || 'unknown';
            if (!map[uid]) {
                const u = users.find(u => u.id === uid);
                map[uid] = { name: u?.name || o.creatorName || 'Không rõ', count: 0, revenue: 0 };
            }
            map[uid].count++;
            if (o.status !== 'cancelled') map[uid].revenue += o.totalAmount || 0;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [filteredOrders, users]);

    // Recent pending (always global, not filtered)
    const recentPending = useMemo(() =>
        [...allPending]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
    , [allPending]);

    // ========== UI ==========
    const statCards = [
        { label: 'Đơn chờ duyệt', value: allPending.length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', highlight: allPending.length > 0, global: true },
        { label: 'Xử lý hôm nay', value: todayProcessed.length, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', global: true },
        { label: 'Đang giao', value: allDelivering.length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', global: true },
        { label: `Doanh thu`, value: formatCompact(filteredRevenue), icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
        { label: `Tổng đơn`, value: filteredOrders.length, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        { label: 'Tỉ lệ giao TC', value: filteredOrders.length > 0 ? `${deliveryRate}%` : '—', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    const funnelData = [
        { key: 'pending', label: ORDER_STATUS_LABELS.pending, count: statusCounts['pending'] || 0, color: STATUS_COLORS.pending },
        { key: 'processing', label: ORDER_STATUS_LABELS.processing, count: statusCounts['processing'] || 0, color: STATUS_COLORS.processing },
        { key: 'delivering', label: ORDER_STATUS_LABELS.delivering, count: statusCounts['delivering'] || 0, color: STATUS_COLORS.delivering },
        { key: 'delivered', label: ORDER_STATUS_LABELS.delivered, count: statusCounts['delivered'] || 0, color: STATUS_COLORS.delivered },
        { key: 'returned', label: ORDER_STATUS_LABELS.returned, count: statusCounts['returned'] || 0, color: STATUS_COLORS.returned },
        { key: 'cancelled', label: ORDER_STATUS_LABELS.cancelled, count: statusCounts['cancelled'] || 0, color: STATUS_COLORS.cancelled },
    ];
    const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

    const handlePresetChange = (preset: TimePreset) => {
        setTimePreset(preset);
        if (preset !== 'custom') {
            setCustomFrom('');
            setCustomTo('');
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header + Time Filter */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Tổng quan Hậu cần</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                            {rangeLabel}
                        </p>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors"
                        title="Làm mới dữ liệu"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    </button>
                </div>

                {/* Time Preset Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {TIME_PRESETS.map(preset => (
                        <button
                            key={preset.key}
                            onClick={() => handlePresetChange(preset.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                timePreset === preset.key
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                        >
                            {preset.short}
                        </button>
                    ))}

                    {/* Custom Date Pickers — inline, appear smoothly */}
                    {timePreset === 'custom' && (
                        <div className="flex items-center gap-2 ml-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-left-2 duration-200">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none w-32"
                                placeholder="Từ ngày"
                            />
                            <span className="text-slate-300 font-bold">→</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none w-32"
                                placeholder="Đến ngày"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={idx}
                            className={`bg-white p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                                stat.highlight
                                    ? 'border-rose-300 ring-2 ring-rose-100 animate-pulse'
                                    : `border-slate-100 ${stat.border}`
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <h3 className={`text-xl font-bold mt-1 ${stat.color}`}>
                                {isLoading ? '—' : stat.value}
                            </h3>
                        </div>
                    );
                })}
            </div>

            {/* Row 2: Chart + Top Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart (2/3) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            Đơn hàng theo ngày
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">{rangeLabel}</span>
                    </div>
                    <div className="h-[280px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={chartData.length > 15 ? Math.floor(chartData.length / 10) : 0}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}
                                        formatter={(value: any, name: any) => {
                                            const labels: Record<string, string> = { total: 'Tổng đơn', delivered: 'Đã giao', cancelled: 'Đã hủy' };
                                            return [value, labels[name] || name];
                                        }}
                                    />
                                    <Bar dataKey="total" name="total" radius={[6, 6, 0, 0]} fill="#6366f1" />
                                    <Bar dataKey="delivered" name="delivered" radius={[6, 6, 0, 0]} fill="#10b981" />
                                    <Bar dataKey="cancelled" name="cancelled" radius={[6, 6, 0, 0]} fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Sales (1/3) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Top Sales
                        <span className="text-xs font-medium text-slate-400 ml-auto">{rangeLabel}</span>
                    </h3>
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-slate-400 py-8">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        ) : topSales.length > 0 ? topSales.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                    idx === 0 ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                                    : idx === 1 ? 'bg-slate-200 text-slate-600'
                                    : 'bg-white border border-slate-200 text-slate-500'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.count} đơn</p>
                                </div>
                                <p className="text-sm font-bold text-primary-600">{formatCompact(s.revenue)}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Status Funnel + Pending Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Funnel (1/3) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Phân bổ trạng thái
                        <span className="text-xs font-medium text-slate-400 ml-auto">{rangeLabel}</span>
                    </h3>
                    <div className="space-y-4">
                        {funnelData.map(item => {
                            const pct = Math.round((item.count / maxFunnel) * 100);
                            return (
                                <div key={item.key}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-slate-700">{item.label}</span>
                                        <span className="font-bold text-slate-900">{isLoading ? '—' : item.count}</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Orders (2/3) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            Đơn cần duyệt gấp
                            {allPending.length > 0 && (
                                <span className="ml-2 px-2.5 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                                    {allPending.length}
                                </span>
                            )}
                        </h3>
                        <Link href="/sale-admin/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[350px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12 text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                            </div>
                        ) : recentPending.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-5 py-2.5 text-left font-medium">Mã đơn</th>
                                        <th className="px-5 py-2.5 text-left font-medium">Khách hàng</th>
                                        <th className="px-5 py-2.5 text-left font-medium">Người tạo</th>
                                        <th className="px-5 py-2.5 text-right font-medium">Tổng tiền</th>
                                        <th className="px-5 py-2.5 text-right font-medium">Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentPending.map(order => (
                                        <tr key={order.id} className="hover:bg-amber-50/50 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-slate-900">#{order.readableId}</td>
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-900">{order.customerName}</p>
                                                <p className="text-xs text-slate-400">{order.items?.length || 0} sản phẩm</p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{order.creatorName || '—'}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatPrice(order.totalAmount)}</td>
                                            <td className="px-5 py-3 text-right text-slate-500 text-xs">{formatDate(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <CheckCircle className="w-10 h-10 text-emerald-300 mb-3" />
                                <p className="font-medium text-emerald-600">Không có đơn nào chờ duyệt!</p>
                                <p className="text-xs text-slate-400 mt-1">Tất cả đơn hàng đã được xử lý</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
