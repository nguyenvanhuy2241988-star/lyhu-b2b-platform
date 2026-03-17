"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { MapPin, ShoppingCart, TrendingUp, CheckCircle, Clock, Store, Plus } from "lucide-react";
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
                ordersToday: 0,
                monthlyRevenue: 0,
            });
        } catch (err) {
            console.error("Load GT dashboard error:", err);
        } finally {
            setLoading(false);
        }
    }

    const statsCards = [
        {
            label: "Điểm bán phụ trách",
            value: stats.totalOutlets.toString(),
            sub: "Đang hoạt động",
            icon: Store,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Check-in hôm nay",
            value: stats.checkinsToday.toString(),
            sub: `/ ${todayOutlets.length} điểm theo tuyến`,
            icon: MapPin,
            color: "text-teal-600",
            bg: "bg-teal-50",
        },
        {
            label: "Đơn GT hôm nay",
            value: stats.ordersToday.toString(),
            sub: "Đơn tạo tại điểm bán",
            icon: ShoppingCart,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Doanh số tháng",
            value: formatPrice(stats.monthlyRevenue),
            sub: "Tháng hiện tại",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white h-32 rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
                <div className="bg-white h-64 rounded-xl border border-slate-200 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                            <p className="text-xs text-slate-400 mt-2">{stat.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tuyến hôm nay */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                        📍 Tuyến hôm nay — {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][new Date().getDay()]}
                    </h3>
                    <Link href="/sales-gt/checkin" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                        Check-in →
                    </Link>
                </div>

                {todayOutlets.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Chưa có tuyến cho hôm nay</p>
                        <p className="text-xs mt-1">Liên hệ quản lý để được phân tuyến</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayOutlets.map(outlet => (
                            <div key={outlet.id} className={`flex items-center justify-between p-3 rounded-lg border ${outlet.checked_in ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center gap-3">
                                    {outlet.checked_in ? (
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    )}
                                    <div>
                                        <p className="font-medium text-sm text-slate-800">{outlet.name}</p>
                                        <p className="text-xs text-slate-500">{outlet.district} • {OUTLET_TYPE_LABELS[outlet.outlet_type] || outlet.outlet_type}</p>
                                    </div>
                                </div>
                                {!outlet.checked_in && (
                                    <Link href={`/sales-gt/checkin?outlet=${outlet.id}`} className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition-colors">
                                        Check-in
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/sales-gt/checkin" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                        <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Check-in nhanh</h4>
                        <p className="text-xs text-slate-500">Ghé thăm điểm bán</p>
                    </div>
                </Link>
                <Link href="/sales-gt/create-order" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-green-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Tạo đơn hàng</h4>
                        <p className="text-xs text-slate-500">Tạo đơn tại điểm bán</p>
                    </div>
                </Link>
                <Link href="/sales-gt/outlets" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Quản lý điểm bán</h4>
                        <p className="text-xs text-slate-500">Thêm & quản lý cửa hàng</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
