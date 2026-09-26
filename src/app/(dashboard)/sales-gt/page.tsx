"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import { MapPin, ShoppingCart, TrendingUp, CheckCircle2, Clock, Store, Plus, ArrowRight, Filter } from "lucide-react";
import Link from "next/link";

interface GTStats {
    totalOutlets: number;
    checkinsToday: number;
    ordersToday: number;
    monthlyRevenue: number;
}

interface TodayOutlet {
    id: string;
    name: string;
    address: string;
    district: string;
    outlet_type: string;
    checked_in: boolean;
}

const OUTLET_TYPE_LABELS: Record<string, string> = {
    tap_hoa: "Tạp hóa",
    mini_mart: "Siêu thị mini",
    dai_ly: "Đại lý",
    sieu_thi: "Siêu thị",
};

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function SalesGTDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState<GTStats>({ totalOutlets: 0, checkinsToday: 0, ordersToday: 0, monthlyRevenue: 0 });
    const [todayOutlets, setTodayOutlets] = useState<TodayOutlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [routeFilter, setRouteFilter] = useState<"all" | "pending" | "done">("all");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get total outlets assigned to this user
            const { count: totalOutlets } = await supabase
                .from('gt_outlets')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('status', 'active');

            // Get today's checkins
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const { count: checkinsToday } = await supabase
                .from('gt_checkins')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('check_in_at', todayStart.toISOString());

            // Get today's orders count
            const { count: ordersToday } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('sales_rep_id', user.id)
                .gte('created_at', todayStart.toISOString());

            // Get today's route outlets
            const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
            const { data: routes } = await supabase
                .from('gt_routes')
                .select('outlet_ids')
                .eq('assigned_to', user.id)
                .eq('status', 'active')
                .contains('day_of_week', [dayOfWeek]);

            const routeOutletIds = routes?.flatMap((r: any) => r.outlet_ids || []) || [];

            if (routeOutletIds.length > 0) {
                const { data: outlets } = await supabase
                    .from('gt_outlets')
                    .select('id, name, address, district, outlet_type')
                    .in('id', routeOutletIds)
                    .eq('status', 'active');

                // Check which outlets have been checked in today
                const { data: todayCheckins } = await supabase
                    .from('gt_checkins')
                    .select('outlet_id')
                    .eq('user_id', user.id)
                    .gte('check_in_at', todayStart.toISOString());

                const checkedInIds = new Set(todayCheckins?.map((c: any) => c.outlet_id) || []);

                setTodayOutlets(
                    (outlets || []).map((o: any) => ({
                        ...o,
                        checked_in: checkedInIds.has(o.id),
                    }))
                );
            }

            setStats({
                totalOutlets: totalOutlets || 0,
                checkinsToday: checkinsToday || 0,
                ordersToday: ordersToday || 0,
                monthlyRevenue: 0,
            });
        } catch (err) {
            console.error("Load GT dashboard error:", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredOutlets = useMemo(() => {
        if (routeFilter === "pending") return todayOutlets.filter(o => !o.checked_in);
        if (routeFilter === "done") return todayOutlets.filter(o => o.checked_in);
        return todayOutlets;
    }, [todayOutlets, routeFilter]);

    const completionRate = todayOutlets.length > 0 
        ? Math.round((stats.checkinsToday / todayOutlets.length) * 100) 
        : 0;

    const statsCards = [
        {
            label: "Điểm bán quản lý",
            value: stats.totalOutlets.toString(),
            sub: "Đang phụ trách",
            icon: Store,
            color: "text-slate-800",
            bg: "bg-slate-100",
        },
        {
            label: "Check-in hôm nay",
            value: `${stats.checkinsToday}/${todayOutlets.length}`,
            sub: `${completionRate}% hoàn thành tuyến`,
            icon: MapPin,
            color: "text-[#00AFA9]",
            bg: "bg-teal-50",
        },
        {
            label: "Đơn GT hôm nay",
            value: stats.ordersToday.toString(),
            sub: "Đơn tạo tại điểm bán",
            icon: ShoppingCart,
            color: "text-[#8EC63F]",
            bg: "bg-lime-50",
        },
        {
            label: "Doanh số tháng",
            value: formatPrice(stats.monthlyRevenue),
            sub: "Tháng hiện tại",
            icon: TrendingUp,
            color: "text-[#00AFA9]",
            bg: "bg-teal-50",
        },
    ];

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white h-24 sm:h-32 rounded-2xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
                <div className="bg-white h-64 rounded-2xl border border-slate-200 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header & Daily Route Status Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00AFA9]"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Tuyến {["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][new Date().getDay()]}
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        Thị Trường Sales GT
                    </h1>
                </div>

                {todayOutlets.length > 0 && (
                    <div className="sm:text-right">
                        <div className="flex items-center sm:justify-end gap-2 text-xs font-bold text-slate-700">
                            <span>Tiến độ tuyến:</span>
                            <span className="text-[#00AFA9]">{stats.checkinsToday} / {todayOutlets.length} điểm</span>
                        </div>
                        <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                            <div 
                                className="bg-[#00AFA9] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(completionRate, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions (3 Flat Buttons for 1-Touch Access) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <Link
                    href="/sales-gt/checkin"
                    className="p-3 sm:p-4 rounded-2xl bg-[#00AFA9] text-white hover:bg-[#009893] transition-colors flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2"
                >
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm font-bold leading-tight">Check-in</div>
                        <div className="text-[10px] text-teal-100 hidden sm:block">Ghé thăm điểm bán</div>
                    </div>
                </Link>

                <Link
                    href="/sales-gt/create-order"
                    className="p-3 sm:p-4 rounded-2xl bg-[#8EC63F] text-slate-900 hover:bg-[#7eb336] transition-colors flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2"
                >
                    <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm font-bold leading-tight">Lên đơn</div>
                        <div className="text-[10px] text-slate-700 hidden sm:block">Tạo đơn tại quầy</div>
                    </div>
                </Link>

                <Link
                    href="/sales-gt/outlets"
                    className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 transition-colors flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2"
                >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Plus className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm font-bold leading-tight">Điểm bán</div>
                        <div className="text-[10px] text-slate-400 hidden sm:block">Thêm & tra cứu</div>
                    </div>
                </Link>
            </div>

            {/* KPI Cards (Compact 2x2 Grid on Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {statsCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 font-semibold line-clamp-1">{stat.label}</span>
                                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-2xl font-black text-slate-900">{stat.value}</h3>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">{stat.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tuyến hôm nay (Today's Route List) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-slate-900 text-base">Danh Sách Tuyến Hôm Nay</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {todayOutlets.length} điểm bán cần ghé thăm
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setRouteFilter("all")}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                                routeFilter === "all"
                                    ? "bg-[#00AFA9] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Tất cả ({todayOutlets.length})
                        </button>
                        <button
                            onClick={() => setRouteFilter("pending")}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                                routeFilter === "pending"
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Chưa ghé ({todayOutlets.filter(o => !o.checked_in).length})
                        </button>
                        <button
                            onClick={() => setRouteFilter("done")}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                                routeFilter === "done"
                                    ? "bg-[#8EC63F] text-slate-900 font-bold"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Đã ghé ({todayOutlets.filter(o => o.checked_in).length})
                        </button>
                    </div>
                </div>

                {filteredOutlets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 p-4">
                        <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">
                            {todayOutlets.length === 0 ? "Chưa có tuyến cho hôm nay" : "Không có điểm bán phù hợp bộ lọc"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {todayOutlets.length === 0 ? "Liên hệ quản lý để được phân bổ tuyến bán hàng" : "Thử đổi bộ lọc sang 'Tất cả'"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredOutlets.map((outlet, idx) => (
                            <div 
                                key={outlet.id} 
                                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-500 flex items-center justify-center shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 text-sm truncate">
                                                {outlet.name}
                                            </h4>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                                {OUTLET_TYPE_LABELS[outlet.outlet_type] || outlet.outlet_type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {outlet.address ? `${outlet.address}, ${outlet.district}` : outlet.district}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {outlet.checked_in ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-50 text-[#5f8c21] text-xs font-bold border border-lime-200">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Đã ghé</span>
                                        </div>
                                    ) : (
                                        <Link 
                                            href={`/sales-gt/checkin?outlet=${outlet.id}`} 
                                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#00AFA9] text-white text-xs font-bold hover:bg-[#009893] transition-colors"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            <span>Ghé</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
