'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabaseClient';
import { fetchOrders, type Order, ORDER_STATUS_LABELS } from '@/lib/ordersStore';
import { fetchUsers, type User } from '@/lib/usersStore';
import {
    AlertCircle, ClipboardCheck, Truck, DollarSign,
    ShoppingCart, Package, Trophy, ArrowRight,
    Loader2, CheckCircle, BarChart3, RefreshCw,
    Calendar, ChevronDown, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

// ========== HELPERS ==========
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtPrice = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; } };
const toDateStr = (d: Date) => d.toISOString().split('T')[0];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// ========== BRAND COLORS ==========
const BRAND = {
    teal: '#00afa9',
    tealLight: '#e6f7f7',
    tealDark: '#007b77',
    lime: '#98c93c',
    limeLight: '#f7fdf0',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b', processing: '#3b82f6', delivering: '#6366f1',
    delivered: BRAND.teal, returned: '#f97316', cancelled: '#ef4444',
};

// ========== TIME PRESETS (Shopee-style) ==========
type TimePreset = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

interface PresetItem {
    key: TimePreset;
    label: string;
    hasSubmenu?: boolean;
}

const QUICK_PRESETS: PresetItem[] = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'yesterday', label: 'Hôm qua' },
    { key: '7days', label: 'Trong 7 ngày qua' },
    { key: '30days', label: 'Trong 30 ngày qua' },
];

const PERIOD_PRESETS: PresetItem[] = [
    { key: 'this_month', label: 'Tháng này' },
    { key: 'last_month', label: 'Tháng trước' },
    { key: 'this_quarter', label: 'Quý này' },
    { key: 'this_year', label: 'Năm nay' },
];

function getPresetRange(preset: TimePreset): { from: Date; to: Date } {
    const now = new Date();
    const today = startOfDay(now);
    const eod = endOfDay(now);

    switch (preset) {
        case 'today': return { from: today, to: eod };
        case 'yesterday': {
            const y = new Date(today); y.setDate(y.getDate() - 1);
            return { from: y, to: endOfDay(y) };
        }
        case '7days': { const f = new Date(today); f.setDate(f.getDate() - 6); return { from: f, to: eod }; }
        case '30days': { const f = new Date(today); f.setDate(f.getDate() - 29); return { from: f, to: eod }; }
        case 'this_month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod };
        case 'last_month': {
            const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return { from: f, to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) };
        }
        case 'this_quarter': {
            const q = Math.floor(now.getMonth() / 3);
            return { from: new Date(now.getFullYear(), q * 3, 1), to: eod };
        }
        case 'this_year': return { from: new Date(now.getFullYear(), 0, 1), to: eod };
        default: return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod };
    }
}

function getPresetLabel(preset: TimePreset): string {
    const all = [...QUICK_PRESETS, ...PERIOD_PRESETS];
    return all.find(p => p.key === preset)?.label || 'Tùy chọn';
}

function formatRangeDisplay(from: Date, to: Date): string {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return `${from.toLocaleDateString('vi-VN', opts)} — ${to.toLocaleDateString('vi-VN', opts)}`;
}

// ========== SHOPEE-STYLE DATE PICKER ==========
function DateRangePicker({
    preset, customFrom, customTo,
    onPresetChange, onCustomChange
}: {
    preset: TimePreset;
    customFrom: string;
    customTo: string;
    onPresetChange: (p: TimePreset) => void;
    onCustomChange: (from: string, to: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const range = preset === 'custom' && customFrom && customTo
        ? { from: new Date(customFrom), to: endOfDay(new Date(customTo)) }
        : getPresetRange(preset);

    const displayLabel = preset === 'custom' && customFrom && customTo
        ? formatRangeDisplay(new Date(customFrom), new Date(customTo))
        : getPresetLabel(preset);

    const displayRange = formatRangeDisplay(range.from, range.to);

    return (
        <div ref={ref} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    open
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/30'
                }`}
            >
                <Calendar className="w-4 h-4 text-primary-500" />
                <span>{displayLabel}</span>
                <span className="text-slate-300 mx-1">|</span>
                <span className="text-xs text-slate-400 font-medium">{displayRange}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-w-[420px] animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex">
                        {/* Left: Preset list */}
                        <div className="w-[200px] border-r border-slate-100 py-2 bg-slate-50/50">
                            {/* Quick presets */}
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhanh</div>
                            {QUICK_PRESETS.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => { onPresetChange(p.key); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                                        preset === p.key
                                            ? 'bg-primary-50 text-primary-700 font-bold border-l-3 border-primary-500'
                                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                                    }`}
                                >
                                    {p.label}
                                    {preset === p.key && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                </button>
                            ))}

                            {/* Divider */}
                            <div className="mx-3 my-2 border-t border-slate-200" />

                            {/* Period presets */}
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Theo kỳ</div>
                            {PERIOD_PRESETS.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => { onPresetChange(p.key); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                                        preset === p.key
                                            ? 'bg-primary-50 text-primary-700 font-bold border-l-3 border-primary-500'
                                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                                    }`}
                                >
                                    {p.label}
                                    {preset === p.key && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                </button>
                            ))}
                        </div>

                        {/* Right: Custom date inputs + preview */}
                        <div className="flex-1 p-5 space-y-4">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tùy chọn khoảng thời gian</div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={customFrom || (preset !== 'custom' ? toDateStr(range.from) : '')}
                                        onChange={e => {
                                            const to = customTo || toDateStr(range.to);
                                            onCustomChange(e.target.value, to);
                                        }}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={customTo || (preset !== 'custom' ? toDateStr(range.to) : '')}
                                        onChange={e => {
                                            const from = customFrom || toDateStr(range.from);
                                            onCustomChange(from, e.target.value);
                                        }}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Preview range */}
                            <div className="bg-primary-50/60 border border-primary-100 rounded-xl p-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary-600 shrink-0" />
                                <span className="text-sm font-semibold text-primary-700">{displayRange}</span>
                            </div>

                            {/* Apply button for custom */}
                            <button
                                onClick={() => setOpen(false)}
                                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== MAIN DASHBOARD ==========
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
    const { fromDate, toDate } = useMemo(() => {
        if (timePreset === 'custom' && customFrom && customTo) {
            return { fromDate: new Date(customFrom), toDate: endOfDay(new Date(customTo)) };
        }
        const r = getPresetRange(timePreset);
        return { fromDate: r.from, toDate: r.to };
    }, [timePreset, customFrom, customTo]);

    const rangeLabel = useMemo(() => {
        if (timePreset === 'custom' && customFrom && customTo) return 'Tùy chọn';
        return getPresetLabel(timePreset);
    }, [timePreset, customFrom, customTo]);

    // ========== FILTERED DATA ==========
    const filteredOrders = useMemo(() =>
        orders.filter(o => { const d = new Date(o.createdAt); return d >= fromDate && d <= toDate; })
    , [orders, fromDate, toDate]);

    const allPending = orders.filter(o => o.status === 'pending');
    const allDelivering = orders.filter(o => o.status === 'delivering');

    const now = new Date();
    const todayStr = toDateStr(now);
    const todayProcessed = orders.filter(o => {
        return toDateStr(new Date(o.createdAt)) === todayStr && o.status !== 'pending';
    });

    const filteredRevenue = filteredOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);
    const filteredDelivered = filteredOrders.filter(o => o.status === 'delivered').length;
    const deliveryRate = filteredOrders.length > 0 ? Math.round((filteredDelivered / filteredOrders.length) * 100) : 0;

    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    // Chart
    const chartData = useMemo(() => {
        const diffMs = toDate.getTime() - fromDate.getTime();
        const diffDays = Math.min(Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1, 90);
        const days = [];
        for (let i = 0; i < diffDays; i++) {
            const d = new Date(fromDate); d.setDate(d.getDate() + i);
            const ds = toDateStr(d);
            const dayOrders = orders.filter(o => toDateStr(new Date(o.createdAt)) === ds);
            days.push({
                label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                total: dayOrders.length,
                delivered: dayOrders.filter(o => o.status === 'delivered').length,
                cancelled: dayOrders.filter(o => o.status === 'cancelled').length,
            });
        }
        return days;
    }, [orders, fromDate, toDate]);

    // Top sales
    const topSales = useMemo(() => {
        const m: Record<string, { name: string; count: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
            const uid = o.telesalesUserId || 'unknown';
            if (!m[uid]) {
                const u = users.find(u => u.id === uid);
                m[uid] = { name: u?.name || o.creatorName || 'Không rõ', count: 0, revenue: 0 };
            }
            m[uid].count++;
            if (o.status !== 'cancelled') m[uid].revenue += o.totalAmount || 0;
        });
        return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [filteredOrders, users]);

    const recentPending = useMemo(() =>
        [...allPending].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    , [allPending]);

    // Handlers
    const handlePresetChange = (p: TimePreset) => {
        setTimePreset(p);
        if (p !== 'custom') { setCustomFrom(''); setCustomTo(''); }
    };
    const handleCustomChange = (from: string, to: string) => {
        setTimePreset('custom');
        setCustomFrom(from);
        setCustomTo(to);
    };

    // ========== KPI CARDS ==========
    const statCards = [
        { label: 'Chờ duyệt', value: String(allPending.length), icon: AlertCircle, color: 'text-amber-600', bgIcon: 'bg-amber-50', highlight: allPending.length > 0, global: true },
        { label: 'Xử lý hôm nay', value: String(todayProcessed.length), icon: ClipboardCheck, color: 'text-primary-600', bgIcon: 'bg-primary-50', global: true },
        { label: 'Đang giao', value: String(allDelivering.length), icon: Truck, color: 'text-indigo-600', bgIcon: 'bg-indigo-50', global: true },
        { label: 'Doanh thu', value: fmtPrice(filteredRevenue), icon: DollarSign, color: 'text-emerald-600', bgIcon: 'bg-emerald-50', isPrice: true },
        { label: 'Tổng đơn', value: String(filteredOrders.length), icon: ShoppingCart, color: 'text-primary-700', bgIcon: 'bg-primary-50' },
        { label: 'Giao thành công', value: filteredOrders.length > 0 ? `${deliveryRate}%` : '—', icon: CheckCircle, color: 'text-secondary-600', bgIcon: 'bg-secondary-50' },
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

    // ========== RENDER ==========
    return (
        <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
            {/* HEADER */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Tổng quan Hậu cần</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Quản lý đơn hàng và vận hành bán hàng</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DateRangePicker
                            preset={timePreset}
                            customFrom={customFrom}
                            customTo={customTo}
                            onPresetChange={handlePresetChange}
                            onCustomChange={handleCustomChange}
                        />
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-60 transition-colors shadow-sm"
                            title="Làm mới"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={idx}
                            className={`bg-white p-4 rounded-xl border transition-all hover:shadow-md group ${
                                stat.highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-100 hover:border-primary-200'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className={`w-9 h-9 rounded-lg ${stat.bgIcon} flex items-center justify-center`}>
                                    <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                                </div>
                                {stat.global && (
                                    <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded uppercase">Live</span>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{stat.label}</p>
                            <h3 className={`font-extrabold mt-0.5 ${stat.color} ${(stat as any).isPrice ? 'text-[15px] leading-snug' : 'text-xl'}`}>
                                {isLoading ? <span className="inline-block w-10 h-5 bg-slate-100 rounded animate-pulse" /> : stat.value}
                            </h3>
                        </div>
                    );
                })}
            </div>

            {/* CHART + TOP SALES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Chart (2/3) */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary-500" />
                            Đơn hàng theo ngày
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">{rangeLabel}</span>
                    </div>
                    <div className="h-[260px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-slate-300">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-300 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barCategoryGap="25%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                                        interval={chartData.length > 15 ? Math.floor(chartData.length / 8) : 0} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                                        formatter={(value: any, name: any) => {
                                            const l: Record<string, string> = { total: 'Tổng', delivered: 'Đã giao', cancelled: 'Hủy' };
                                            return [value, l[name] || name];
                                        }}
                                    />
                                    <Bar dataKey="total" name="total" radius={[4, 4, 0, 0]} fill={BRAND.teal} opacity={0.85} />
                                    <Bar dataKey="delivered" name="delivered" radius={[4, 4, 0, 0]} fill={BRAND.lime} />
                                    <Bar dataKey="cancelled" name="cancelled" radius={[4, 4, 0, 0]} fill="#ef4444" opacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {/* Chart legend */}
                    <div className="flex items-center gap-5 mt-3 pt-3 border-t border-slate-50">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BRAND.teal }} /> Tổng đơn</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BRAND.lime }} /> Đã giao</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Đã hủy</span>
                    </div>
                </div>

                {/* Top Sales (1/3) */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Top Sales
                        <span className="ml-auto text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{rangeLabel}</span>
                    </h3>
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-slate-300"><Loader2 className="w-4 h-4 animate-spin" /></div>
                        ) : topSales.length > 0 ? topSales.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-100 hover:border-primary-200 transition-colors">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                    idx === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                                    : idx === 1 ? 'bg-slate-200 text-slate-600'
                                    : 'bg-white border border-slate-200 text-slate-400'
                                }`}>{idx + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                                    <p className="text-[11px] text-slate-400">{s.count} đơn</p>
                                </div>
                                <p className="text-xs font-bold text-primary-600 shrink-0">{fmtPrice(s.revenue)}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-300 text-center py-8">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>

            {/* STATUS FUNNEL + PENDING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Funnel (1/3) */}
                <div className="bg-white p-5 rounded-xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary-500" />
                        Trạng thái đơn
                        <span className="ml-auto text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{rangeLabel}</span>
                    </h3>
                    <div className="space-y-3">
                        {funnelData.map(item => {
                            const pct = Math.round((item.count / maxFunnel) * 100);
                            return (
                                <div key={item.key}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600">{item.label}</span>
                                        <span className="font-bold text-slate-800">{isLoading ? '—' : item.count}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Orders (2/3) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Đơn cần duyệt
                            {allPending.length > 0 && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-full">{allPending.length}</span>
                            )}
                        </h3>
                        <Link href="/sale-admin/orders" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5">
                            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10 text-slate-300">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải...
                            </div>
                        ) : recentPending.length > 0 ? (
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold">Mã đơn</th>
                                        <th className="px-4 py-2 text-left font-semibold">Khách hàng</th>
                                        <th className="px-4 py-2 text-left font-semibold">Người tạo</th>
                                        <th className="px-4 py-2 text-right font-semibold">Tổng tiền</th>
                                        <th className="px-4 py-2 text-right font-semibold">Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentPending.map(order => (
                                        <tr key={order.id} className="hover:bg-primary-50/30 transition-colors">
                                            <td className="px-4 py-2.5 font-bold text-slate-800">#{order.readableId}</td>
                                            <td className="px-4 py-2.5">
                                                <p className="font-semibold text-slate-700">{order.customerName}</p>
                                                <p className="text-[10px] text-slate-400">{order.items?.length || 0} sản phẩm</p>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-500">{order.creatorName || '—'}</td>
                                            <td className="px-4 py-2.5 text-right font-bold text-slate-800">{fmtPrice(order.totalAmount)}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-400">{fmtDate(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                <CheckCircle className="w-8 h-8 text-primary-300 mb-2" />
                                <p className="font-semibold text-primary-600 text-sm">Tất cả đã xử lý!</p>
                                <p className="text-[11px] text-slate-400">Không có đơn nào chờ duyệt</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
