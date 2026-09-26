"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, UserPlus, TrendingUp, DollarSign, ShoppingBag, Wallet, Award, Target, CheckCircle } from "lucide-react";
import { CtvLead, loadLeads, getLeadStats } from "@/lib/ctvLeads";
import { loadOrders, type Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCtvLevel, LEVEL_COLORS, type CtvLevel } from "@/lib/ctvLevels";
import { getCtvMonthlyMissionsSummary, formatMissionProgress, getMissionProgressPercent } from "@/lib/ctvMissions";
import { loadUsers } from "@/lib/usersStore";
import { StarterQuest } from "@/components/ctv/StarterQuest";
import { Skeleton, StatsSkeleton, TableSkeleton } from "@/components/ui/SkeletonUI";

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const STATUS_CONFIG = {
    NEW: { label: "Mới", color: "border border-blue-200 bg-blue-50 text-blue-700" },
    CONTACTED: { label: "Đã liên hệ", color: "border border-amber-200 bg-amber-50 text-amber-700" },
    CONVERTED: { label: "Đã chuyển đổi", color: "border border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export default function CTVDashboard() {
    const { user: authUser, isLoading: authIsLoading } = useAuth();
    const [leads, setLeads] = useState<CtvLead[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const currentUser = authUser;

    useEffect(() => {
        if (authIsLoading) return;

        (async () => {
            setIsLoading(true);
            try {
                // Now we only load data, user is already from useAuth
                const [leadsData, usersData, ordersData] = await Promise.all([
                    loadLeads(),
                    loadUsers(),
                    loadOrders()
                ]);

                setLeads(leadsData || []);
                setUsers(usersData || []);
                setAllOrders(ordersData || []);

                if (currentUser) {
                    const ctvOrders = (ordersData || []).filter(o => o.ctvId === currentUser.id);
                    setOrders(ctvOrders);
                }
            } catch (error) {
                console.error("[CTVDashboard] Load error:", error);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [authUser, authIsLoading, currentUser]);

    const leadStats = getLeadStats(leads);

    const orderStats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const activeOrders = orders.filter(o => o.status !== "cancelled");
        const monthlyOrders = activeOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        return {
            totalOrders: orders.length,
            monthlySales: monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            monthlyCommission: monthlyOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0),
            pendingCount: orders.filter(o => o.status === "pending").length,
        };
    }, [orders]);

    // CTV Level
    const levelInfo = useMemo(() => {
        if (!currentUser) return null;
        return getCtvLevel(allOrders, currentUser.id);
    }, [allOrders, currentUser]);

    // Monthly Missions
    const missionsSummary = useMemo(() => {
        if (!currentUser) return null;
        const now = new Date();
        return getCtvMonthlyMissionsSummary(
            currentUser.id,
            now.getMonth() + 1,
            now.getFullYear(),
            allOrders,
            users
        );
    }, [currentUser, allOrders, users]);

    const statsCards = [
        {
            label: "Doanh số tháng này",
            value: formatPrice(orderStats.monthlySales),
            change: `${orderStats.totalOrders} đơn hàng`,
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Hoa hồng tháng này",
            value: formatPrice(orderStats.monthlyCommission),
            change: "Thu nhập ước tính",
            icon: Wallet,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Đơn chờ xử lý",
            value: orderStats.pendingCount.toString(),
            change: "Cần theo dõi",
            icon: ShoppingBag,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
        {
            label: "Khách hàng tiềm năng",
            value: leadStats.total.toString(),
            change: `${leadStats.newCount} lead mới`,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-slate-100 h-24 rounded-xl animate-pulse" /> {/* Starter Quest Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 h-40 animate-pulse" />
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 h-40 animate-pulse" />
                </div>
                <StatsSkeleton />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white h-24 rounded-xl border border-slate-200 animate-pulse" />)}
                </div>
                <TableSkeleton rows={5} cols={7} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Starter Quest (C2) */}
            <StarterQuest user={currentUser} orders={orders} leads={leads} />

            {/* Level Card + Missions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Level Card */}
                {levelInfo && (
                    <div className={`p-6 rounded-xl border-2 ${LEVEL_COLORS[levelInfo.level].border} ${LEVEL_COLORS[levelInfo.level].bg}`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl border border-slate-100">
                                <Award className={`w-8 h-8 ${LEVEL_COLORS[levelInfo.level].text}`} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium">Cấp độ hiện tại</p>
                                <h2 className={`text-2xl font-bold ${LEVEL_COLORS[levelInfo.level].text}`}>
                                    {levelInfo.level}
                                </h2>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-slate-600">
                            {levelInfo.progressText}
                        </div>
                        <div className="mt-3">
                            <div className="text-xs text-slate-500 mb-1">
                                {formatPrice(levelInfo.currentSales)} doanh số • {levelInfo.currentDeliveredOrders} đơn giao
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#00AFA9] transition-all"
                                    style={{ width: `${Math.max(levelInfo.salesProgress, levelInfo.ordersProgress)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Missions Summary */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-[#00AFA9]" />
                            <h3 className="font-semibold text-slate-900">Nhiệm vụ tháng này</h3>
                        </div>
                        {missionsSummary && (
                            <span className="text-sm text-slate-500">
                                {missionsSummary.completedCount}/{missionsSummary.totalCount} hoàn thành
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {missionsSummary?.missions.map((mission) => (
                            <div
                                key={mission.id}
                                className={`p-4 rounded-lg border ${mission.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-800">{mission.title}</p>
                                    {mission.completed && (
                                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>{formatMissionProgress(mission)}</span>
                                        <span className="text-emerald-600 font-semibold">{mission.rewardText}</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${mission.completed ? 'bg-emerald-500' : 'bg-[#00AFA9]'}`}
                                            style={{ width: `${getMissionProgressPercent(mission)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900 truncate" title={stat.value}>{stat.value}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm border-t border-slate-100 pt-3">
                                <span className="text-slate-600">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                    href="/ctv/create-order"
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex items-center gap-4"
                >
                    <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-[#00AFA9]" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-0.5 group-hover:text-[#00AFA9] transition-colors">Tạo đơn hàng</h4>
                        <p className="text-xs text-slate-500">Lên đơn mới ngay</p>
                    </div>
                </a>
                <a
                    href="/ctv/referrals"
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex items-center gap-4"
                >
                    <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                        <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-0.5 group-hover:text-[#00AFA9] transition-colors">Giới thiệu CTV</h4>
                        <p className="text-xs text-slate-500">Chia sẻ mã & xem tuyến dưới</p>
                    </div>
                </a>
                <a
                    href="/ctv/earnings"
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex items-center gap-4"
                >
                    <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-0.5 group-hover:text-[#00AFA9] transition-colors">Thu nhập & Hoa hồng</h4>
                        <p className="text-xs text-slate-500">Xem chi tiết từng tháng</p>
                    </div>
                </a>
            </div>

            {/* Recent Leads Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Leads gần đây</h3>
                    <a href="/ctv/my-leads" className="text-xs sm:text-sm text-[#00AFA9] hover:text-[#009b95] font-bold transition-colors">
                        Xem tất cả
                    </a>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[768px]">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                            <tr>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Tên cửa hàng</th>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Người liên hệ</th>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Số điện thoại</th>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Khu vực</th>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Loại</th>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Trạng thái</th>
                                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.slice(0, 5).map((lead) => {
                                const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG];
                                return (
                                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{lead.storeName}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.contactName}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.phone}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.area}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                                                {lead.customerType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(lead.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {leads.slice(0, 5).map((lead) => {
                        const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG];
                        return (
                            <div key={lead.id} className="p-3.5 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{lead.storeName}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{lead.contactName} • {lead.phone}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${statusConfig.color} shrink-0`}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                                    <span>{lead.area} • {lead.customerType}</span>
                                    <span>{formatDate(lead.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {leads.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                        Chưa có lead nào
                    </div>
                )}
            </div>
        </div>
    );
}
