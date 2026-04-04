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
type DrillMode = 'none' | 'day' | 'week' | 'month' | 'year';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Mon=0
}

function getWeekRange(year: number, month: number, weekRowStart: number) {
    const from = new Date(year, month, weekRowStart);
    const to = new Date(year, month, weekRowStart + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
}

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
    const [drillMode, setDrillMode] = useState<DrillMode>('none');
    const ref = useRef<HTMLDivElement>(null);

    // Calendar state
    const now = new Date();
    const [calYear, setCalYear] = useState(now.getFullYear());
    const [calMonth, setCalMonth] = useState(now.getMonth());
    const [yearPageStart, setYearPageStart] = useState(Math.floor(now.getFullYear() / 10) * 10);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setDrillMode('none'); }
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

    const selectDay = (day: number) => {
        const d = new Date(calYear, calMonth, day);
        onCustomChange(toDateStr(d), toDateStr(d));
        setOpen(false);
        setDrillMode('none');
    };

    const selectWeek = (startDay: number) => {
        const wr = getWeekRange(calYear, calMonth, startDay);
        onCustomChange(toDateStr(wr.from), toDateStr(wr.to));
        setOpen(false);
        setDrillMode('none');
    };

    const selectMonth = (month: number) => {
        const from = new Date(calYear, month, 1);
        const to = new Date(calYear, month + 1, 0);
        onCustomChange(toDateStr(from), toDateStr(to));
        setOpen(false);
        setDrillMode('none');
    };

    const selectYear = (year: number) => {
        const from = new Date(year, 0, 1);
        const to = new Date(year, 11, 31);
        onCustomChange(toDateStr(from), toDateStr(to));
        setOpen(false);
        setDrillMode('none');
    };

    // Build calendar grid
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfWeek(calYear, calMonth);
    const prevMonthDays = getDaysInMonth(calYear, calMonth - 1);
    const calendarCells: { day: number; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) calendarCells.push({ day: prevMonthDays - i, current: false });
    for (let i = 1; i <= daysInMonth; i++) calendarCells.push({ day: i, current: true });
    const remaining = 7 - (calendarCells.length % 7);
    if (remaining < 7) for (let i = 1; i <= remaining; i++) calendarCells.push({ day: i, current: false });

    // Week rows for "Theo tuần"
    const weekRows: number[][] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
        weekRows.push(calendarCells.slice(i, i + 7).map(c => c.current ? c.day : 0));
    }

    const todayDate = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();

    const presetItems = [
        ...QUICK_PRESETS.map(p => ({ ...p, type: 'preset' as const })),
    ];

    const drillItems: { key: DrillMode; label: string }[] = [
        { key: 'day', label: 'Theo ngày' },
        { key: 'week', label: 'Theo tuần' },
        { key: 'month', label: 'Theo tháng' },
        { key: 'year', label: 'Theo năm' },
    ];

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                onClick={() => { setOpen(!open); if (!open) setDrillMode('none'); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    open ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                         : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/30'
                }`}
            >
                <Calendar className="w-4 h-4 text-primary-500" />
                <span>{displayLabel}</span>
                <span className="text-slate-300 mx-1">|</span>
                <span className="text-xs text-slate-400 font-medium">{displayRange}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex">
                        {/* LEFT: Presets + Drill */}
                        <div className="w-[170px] border-r border-slate-100 py-2 bg-slate-50/50 shrink-0">
                            {/* Quick presets */}
                            {presetItems.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => {
                                        onPresetChange(p.key);
                                        setDrillMode('none');
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${
                                        preset === p.key && drillMode === 'none'
                                            ? 'text-primary-600 font-bold bg-primary-50'
                                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}

                            <div className="mx-3 my-2 border-t border-slate-200" />

                            {/* Drill-down items */}
                            {drillItems.map(d => (
                                <button
                                    key={d.key}
                                    onClick={() => {
                                        setDrillMode(d.key);
                                        setCalYear(now.getFullYear());
                                        setCalMonth(now.getMonth());
                                        setYearPageStart(Math.floor(now.getFullYear() / 10) * 10);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center justify-between ${
                                        drillMode === d.key
                                            ? 'text-primary-600 font-bold bg-primary-50'
                                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                                    }`}
                                >
                                    {d.label}
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            ))}
                        </div>

                        {/* RIGHT: Contextual picker */}
                        <div className="w-[260px] p-4">
                            {drillMode === 'none' && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khoảng thời gian</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PERIOD_PRESETS.map(p => (
                                            <button
                                                key={p.key}
                                                onClick={() => { onPresetChange(p.key); setOpen(false); }}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                                    preset === p.key
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Preview */}
                                    <div className="bg-primary-50/60 border border-primary-100 rounded-lg p-2.5 flex items-center gap-2 mt-3">
                                        <Calendar className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                                        <span className="text-xs font-semibold text-primary-700">{displayRange}</span>
                                    </div>
                                </div>
                            )}

                            {/* === THEO NGÀY: Calendar === */}
                            {drillMode === 'day' && (
                                <div>
                                    {/* Month nav */}
                                    <div className="flex items-center justify-between mb-3">
                                        <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                                            className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">‹</span></button>
                                        <span className="text-sm font-bold text-slate-800">Tháng {calMonth + 1}/{calYear}</span>
                                        <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                                            className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">›</span></button>
                                    </div>
                                    {/* Weekday headers */}
                                    <div className="grid grid-cols-7 gap-0 mb-1">
                                        {WEEKDAYS.map(w => (
                                            <div key={w} className="text-center text-[10px] font-bold text-slate-400 py-1">{w}</div>
                                        ))}
                                    </div>
                                    {/* Days grid */}
                                    <div className="grid grid-cols-7 gap-0">
                                        {calendarCells.map((cell, i) => {
                                            const isToday = cell.current && cell.day === todayDate && calMonth === todayMonth && calYear === todayYear;
                                            return (
                                                <button
                                                    key={i}
                                                    disabled={!cell.current}
                                                    onClick={() => cell.current && selectDay(cell.day)}
                                                    className={`h-8 text-xs font-semibold rounded-lg transition-colors ${
                                                        !cell.current
                                                            ? 'text-slate-300'
                                                            : isToday
                                                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                                                : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700'
                                                    }`}
                                                >
                                                    {cell.day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* === THEO TUẦN: Week rows === */}
                            {drillMode === 'week' && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                                            className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">‹</span></button>
                                        <span className="text-sm font-bold text-slate-800">Tháng {calMonth + 1}/{calYear}</span>
                                        <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                                            className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">›</span></button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-0 mb-1">
                                        {WEEKDAYS.map(w => (
                                            <div key={w} className="text-center text-[10px] font-bold text-slate-400 py-1">{w}</div>
                                        ))}
                                    </div>
                                    <div className="space-y-1">
                                        {weekRows.map((row, ri) => {
                                            const validDays = row.filter(d => d > 0);
                                            if (validDays.length === 0) return null;
                                            const firstValid = validDays[0];
                                            return (
                                                <button
                                                    key={ri}
                                                    onClick={() => selectWeek(firstValid)}
                                                    className="w-full grid grid-cols-7 gap-0 rounded-lg hover:bg-primary-50 transition-colors group"
                                                >
                                                    {row.map((d, di) => (
                                                        <div key={di} className={`h-8 flex items-center justify-center text-xs font-semibold ${
                                                            d === 0 ? 'text-slate-300' : 'text-slate-700 group-hover:text-primary-700'
                                                        }`}>
                                                            {d > 0 ? d : ''}
                                                        </div>
                                                    ))}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* === THEO THÁNG: Month grid === */}
                            {drillMode === 'month' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setCalYear(y => y - 1)} className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">‹‹</span></button>
                                        <span className="text-sm font-bold text-slate-800">{calYear}</span>
                                        <button onClick={() => setCalYear(y => y + 1)} className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">››</span></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MONTH_NAMES.map((name, idx) => {
                                            const isCurrent = calYear === todayYear && idx === todayMonth;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectMonth(idx)}
                                                    className={`px-2 py-3 rounded-lg text-xs font-bold transition-colors ${
                                                        isCurrent
                                                            ? 'bg-primary-500 text-white hover:bg-primary-600'
                                                            : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700'
                                                    }`}
                                                >
                                                    {name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* === THEO NĂM: Year grid === */}
                            {drillMode === 'year' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setYearPageStart(y => y - 10)} className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">‹‹</span></button>
                                        <span className="text-sm font-bold text-slate-800">{yearPageStart} — {yearPageStart + 9}</span>
                                        <button onClick={() => setYearPageStart(y => y + 10)} className="text-slate-400 hover:text-slate-600 p-1"><span className="text-sm font-bold">››</span></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Array.from({ length: 12 }, (_, i) => yearPageStart - 1 + i).map(year => {
                                            const isInRange = year >= yearPageStart && year <= yearPageStart + 9;
                                            const isCurrent = year === todayYear;
                                            return (
                                                <button
                                                    key={year}
                                                    onClick={() => selectYear(year)}
                                                    className={`px-2 py-3 rounded-lg text-xs font-bold transition-colors ${
                                                        !isInRange ? 'text-slate-300'
                                                        : isCurrent ? 'bg-primary-500 text-white hover:bg-primary-600'
                                                        : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700'
                                                    }`}
                                                >
                                                    {year}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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
    const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

    // Time filter state
    const [timePreset, setTimePreset] = useState<TimePreset>('this_month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    // Beep sound using Web Audio API
    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
            // Second beep
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
            osc2.start(ctx.currentTime + 0.15);
            osc2.stop(ctx.currentTime + 0.55);
        } catch (e) { /* Audio not available */ }
    }, []);

    const prevPendingCountRef = useRef(0);

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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
                // Detect new pending order
                if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
                    playBeep();
                    const name = payload.new.customer_name || 'Khách hàng';
                    setNewOrderToast(`🛒 Đơn mới — ${name}`);
                    setTimeout(() => setNewOrderToast(null), 4000);
                }
                loadData();
            })
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
                pending: dayOrders.filter(o => o.status === 'pending').length,
                processing: dayOrders.filter(o => o.status === 'processing').length,
                delivering: dayOrders.filter(o => o.status === 'delivering').length,
                delivered: dayOrders.filter(o => o.status === 'delivered').length,
                cancelled: dayOrders.filter(o => o.status === 'cancelled').length,
                total: dayOrders.length,
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
                    {/* Table view - each day is a row */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-300">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="text-center py-12 text-slate-300 text-sm">Chưa có dữ liệu</div>
                    ) : (
                        <>
                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
                                {[
                                    { label: 'Đã giao', color: BRAND.teal },
                                    { label: 'Đang giao', color: '#6366f1' },
                                    { label: 'Đang XL', color: '#3b82f6' },
                                    { label: 'Chờ duyệt', color: '#f59e0b' },
                                    { label: 'Đã hủy', color: '#ef4444' },
                                ].map((l, i) => (
                                    <span key={i} className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                                        {l.label}
                                    </span>
                                ))}
                            </div>

                            {/* Day rows */}
                            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                                {[...chartData].reverse().map((day, idx) => {
                                    const maxTotal = Math.max(...chartData.map(d => d.total), 1);
                                    const barWidth = Math.max((day.total / maxTotal) * 100, day.total > 0 ? 8 : 0);
                                    const segments = [
                                        { key: 'delivered', val: day.delivered, color: BRAND.teal },
                                        { key: 'delivering', val: day.delivering, color: '#6366f1' },
                                        { key: 'processing', val: day.processing, color: '#3b82f6' },
                                        { key: 'pending', val: day.pending, color: '#f59e0b' },
                                        { key: 'cancelled', val: day.cancelled, color: '#ef4444' },
                                    ].filter(s => s.val > 0);

                                    const isToday = day.label === new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                                isToday ? 'bg-primary-50/60 border border-primary-100' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            {/* Date */}
                                            <div className="w-[52px] shrink-0">
                                                <span className={`text-xs font-bold ${isToday ? 'text-primary-700' : 'text-slate-600'}`}>
                                                    {day.label}
                                                </span>
                                                {isToday && <span className="block text-[9px] text-primary-500 font-bold">Hôm nay</span>}
                                            </div>

                                            {/* Total count */}
                                            <div className="w-[36px] text-right shrink-0">
                                                <span className={`text-sm font-extrabold ${day.total > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                    {day.total}
                                                </span>
                                            </div>

                                            {/* Stacked bar */}
                                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden flex" style={{ maxWidth: '100%' }}>
                                                {day.total === 0 ? (
                                                    <div className="w-full h-full" />
                                                ) : (
                                                    <div className="flex h-full rounded-full overflow-hidden" style={{ width: `${barWidth}%` }}>
                                                        {segments.map((seg, si) => (
                                                            <div
                                                                key={si}
                                                                className="h-full transition-all duration-300"
                                                                style={{
                                                                    width: `${(seg.val / day.total) * 100}%`,
                                                                    backgroundColor: seg.color,
                                                                }}
                                                                title={`${seg.key}: ${seg.val}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status breakdown numbers */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {day.delivered > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: BRAND.tealDark, backgroundColor: BRAND.tealLight }}>
                                                        {day.delivered} giao
                                                    </span>
                                                )}
                                                {day.pending > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                                        {day.pending} chờ
                                                    </span>
                                                )}
                                                {day.cancelled > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                                                        {day.cancelled} hủy
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
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

            {/* New order toast notification */}
            {newOrderToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">{newOrderToast}</p>
                        <p className="text-[10px] text-slate-400">Vừa tạo</p>
                    </div>
                </div>
            )}
        </div>
    );
}
