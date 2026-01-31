"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Phone, ShoppingBag, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getMyTasks, TelesalesTask } from "@/lib/telesalesTasksStore";
import { fetchSalesLeads, SalesLead } from "@/lib/salesLeads";
import { fetchOrders, Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    fetchBondingFund,
    getLeaderboard,
    fetchUserAchievements,
    fetchCareerLevels,
    subscribeToBondingFund,
    subscribeToUserAchievements,
    type BondingFund,
    type LeaderboardEntry,
    type CareerLevel,
    type UserAchievement
} from "@/lib/engagementStore";
import { Award, Star, Trophy, PartyPopper, ChevronRight, Crown, Medal, Flame } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/SkeletonUI";
import { fetchKPIStats, fetchSalesFunnel, KPISummary, FunnelStage } from "@/lib/crmDealsStore";
import { SalesFunnelChart } from "@/components/telesales/dashboard/KPICharts";
import LeaderboardWidget from "@/components/telesales/dashboard/LeaderboardWidget";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    } catch {
        return dateString;
    }
};

export default function TelesalesDashboard() {
    const { user, session, isLoading: authIsLoading } = useAuth();

    // State for data
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [leads, setLeads] = useState<SalesLead[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // KPI State
    const [kpiStats, setKpiStats] = useState<KPISummary | null>(null);
    const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);

    // Engagement state
    const [bondingFund, setBondingFund] = useState<BondingFund | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userAchievements, setUserAchievements] = useState<any[]>([]);
    const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);

    // Filter State
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

    // SAFE ACCESS: Ensure arrays
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    // Helper to get date range based on filter
    const getDateRange = useCallback(() => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        // Reset time to end of day for end date
        end.setHours(23, 59, 59, 999);

        if (timeFilter === 'today') {
            start.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'week') {
            // Monday as start of week
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'year') {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
        }

        return { start, end };
    }, [timeFilter]);

    // Load all data
    const loadAll = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const token = session?.access_token;
            // Get date range for KPI (Always use Month for main KPI cards for now? Or sync with filter? 
            // Usually KPIs like "Revenue this month" are fixed to month. 
            // Leaderboard will use dynamic filter.)

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            // Dynamic range for Leaderboard
            const { start: lbStart, end: lbEnd } = getDateRange();

            // Load tasks, leads and orders in parallel
            const [taskRows, leadRows, orderRows, kpiData, funnel] = await Promise.all([
                getMyTasks(user?.id, token),
                fetchSalesLeads(user?.id, token),
                fetchOrders(token),
                fetchKPIStats(startOfMonth, endOfMonth, user?.id, token),
                fetchSalesFunnel(startOfMonth, endOfMonth, user?.id, token)
            ]);

            setTasks(Array.isArray(taskRows) ? taskRows : []);
            setLeads(Array.isArray(leadRows) ? leadRows : []);
            setOrders(Array.isArray(orderRows) ? orderRows : []);
            setKpiStats(kpiData);
            setFunnelData(funnel);

            // Load Engagement Data
            const [fundData, leaderboardData, achievementsData, roadmapData] = await Promise.all([
                fetchBondingFund(token),
                getLeaderboard(lbStart, lbEnd, token),
                fetchUserAchievements(user?.id || "", token),
                fetchCareerLevels(token)
            ]);

            setBondingFund(fundData);
            setLeaderboard(leaderboardData);
            setUserAchievements(achievementsData);
            setCareerLevels(roadmapData);
        } catch (e) {
            console.error("[TelesalesDashboard] Error loading data:", e);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [user, session, getDateRange]); // Added getDateRange dependency

    useEffect(() => {
        if (!user) return;

        loadAll();

        // 3. Realtime Subscription
        const channel = supabase
            .channel('telesales_dashboard_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads', filter: `assigned_to=eq.${user.id}` },
                () => {
                    console.log('[TelesalesDashboard] Leads change detected');
                    loadAll(true);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    console.log('[TelesalesDashboard] Orders change detected');
                    loadAll(true);
                }
            )
            .subscribe((status: string) => {
                console.log('[TelesalesDashboard] Channel status:', status);
                // Initial load is already handled by loadAll() call above.
                // We only need to listen for subsequent changes.
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, session, loadAll]);

    // REAL-TIME SUBSCRIPTIONS
    useEffect(() => {
        // 1. Subscribe to Bonding Fund
        const fundSub = subscribeToBondingFund((newFund) => {
            setBondingFund(newFund);
        });

        // 2. Subscribe to User Achievements
        const achievementSub = user?.id ? subscribeToUserAchievements(user.id, async () => {
            const achievementsData = await fetchUserAchievements(user.id, session?.access_token);
            setUserAchievements(achievementsData);
        }) : null;

        return () => {
            if (fundSub) fundSub.unsubscribe();
            if (achievementSub) achievementSub.unsubscribe();
        };
    }, [user?.id, session?.access_token]); // Fixed: Added session?.access_token

    // --- KPI CALCULATIONS (Using DB Stats if available, otherwise fallback to local) ---
    // Stop local loading if auth finished and no user found
    useEffect(() => {
        if (!authIsLoading && !user) {
            setIsLoading(false);
        }
    }, [authIsLoading, user]);

    // Construct Stats Cards
    const statsCards = [
        {
            label: "Doanh số tháng",
            value: formatPrice(kpiStats?.total_revenue || 0),
            change: "Doanh thu chốt được",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Deal thắng",
            value: (kpiStats?.total_deals_won || 0).toString(),
            change: "Đã chốt thành công",
            icon: ShoppingBag,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Cuộc gọi",
            value: (kpiStats?.total_calls || 0).toString(),
            change: "Trung bình " + Math.round(kpiStats?.avg_call_duration || 0) + "s/gọi",
            icon: Phone,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Deal mới",
            value: (kpiStats?.total_deals_new || 0).toString(),
            change: "Được phân bổ tháng này",
            icon: Users,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-slate-100 h-16 rounded-xl animate-pulse" /> {/* Quote Skeleton */}
                <StatsSkeleton />
                <div className="bg-white p-6 rounded-xl border border-slate-200 h-48 animate-pulse" /> {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TableSkeleton rows={5} cols={3} />
                    <TableSkeleton rows={5} cols={4} />
                </div>
            </div>
        );
    }

    // Inspiration quotes
    const quotes = [
        "Thành công là tổng hợp của những nỗ lực nhỏ bé, lặp đi lặp lại ngày qua ngày.",
        "Đừng bán sản phẩm, hãy bán giải pháp cho vấn đề của khách hàng.",
        "Khách hàng không mua những gì bạn làm, họ mua lý do tại sao bạn làm điều đó.",
        "Sự kiên trì là khác biệt lớn nhất giữa thành công và thất bại.",
        "Mỗi cuộc gọi bị từ chối là một bước gần hơn tới một cái gật đầu.",
        "Hãy phục vụ khách hàng như cách bạn muốn được phục vụ.",
        "Năng lượng của bạn quyết định kết quả của cuộc đối thoại."
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];

    // Dynamic Roadmap Logic
    // Fix: use KPI Revenue for career level instead of local order sum if possible, or keep local for now if career logic uses delivered orders
    const currentMonthlyRevenue = kpiStats?.total_revenue || 0;
    const currentCareerLevel = careerLevels.find(l => currentMonthlyRevenue >= l.min_exp * 1000) || careerLevels[0];
    const nextLevel = careerLevels.find(l => l.min_exp * 1000 > currentMonthlyRevenue);
    const progressToNext = nextLevel ? (currentMonthlyRevenue / (nextLevel.min_exp * 1000)) * 100 : 100;

    return (
        <div className="space-y-6">
            {/* Daily Inspiration */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-xl border border-primary-100 flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Medal className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                    <p className="text-xs font-bold text-primary-700 uppercase tracking-widest mb-0.5">Lời khuyên hôm nay</p>
                    <p className="text-sm italic text-slate-700 font-medium">"{dailyQuote}"</p>
                </div>
            </div>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm border-t border-slate-100 pt-3">
                                <span className="text-slate-500">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Stats */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Thống kê nhanh</h3>
                            <p className="text-sm text-slate-500">Tình hình hoạt động tháng này</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Deal Mới</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {kpiStats?.total_deals_new || 0}
                                    </span>
                                    <span className="text-xs text-green-600 font-medium mb-1">deal</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Tỉ lệ chốt</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {kpiStats?.total_deals_new ? Math.round((kpiStats.total_deals_won / kpiStats.total_deals_new) * 100) : 0}%
                                    </span>
                                    <span className="text-xs text-slate-500 mb-1">thành công</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Funnel Chart */}
                    <div className="flex-1 h-[300px]">
                        <h4 className="text-sm font-semibold text-slate-800 mb-4">Phễu chuyển đổi (Sales Funnel)</h4>
                        {funnelData.length > 0 ? (
                            <SalesFunnelChart data={funnelData} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Chưa có dữ liệu phễu</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Motivation & Bonding Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Leaderboard (Bảng vàng Vinh danh) */}
                <div className="lg:col-span-2 h-[500px]">
                    <LeaderboardWidget
                        leaderboard={leaderboard}
                        isLoading={isLoading}
                        timeFilter={timeFilter}
                        onFilterChange={setTimeFilter}
                    />
                </div>

                {/* Right Column: Bonding & Roadmap */}
                <div className="space-y-6">

                    {/* 2. Bonding Fund (Quỹ Bonding) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform text-primary-500">
                            <PartyPopper className="w-24 h-24" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 bg-primary-50 rounded-lg text-primary-600">
                                <PartyPopper className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiền ăn chơi tập thể</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Quỹ Bonding hiện tại</h3>
                        <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                            {formatPrice(bondingFund?.balance || 0)}
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                            Hôm nay chúng ta đã tích thêm +50k!
                        </p>
                    </div>

                    {/* 3. Career Roadmap (Lộ trình Thăng tiến) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                                <Crown className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cấp bậc của bạn</span>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-slate-900">{currentCareerLevel?.name || "Tân binh"}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">LV. {currentCareerLevel?.id || 1}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full shadow-sm transition-all duration-1000"
                                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                                />
                            </div>
                            {nextLevel && (
                                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium italic">
                                    <span>Còn {formatPrice((nextLevel.min_exp * 1000) - currentMonthlyRevenue)} doanh số để lên {nextLevel.name}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {userAchievements.slice(0, 5).map((ua, i) => (
                                <div key={i} title={ua.achievement?.name || "Huy hiệu"} className={`p-1.5 bg-white border border-slate-200 rounded-lg ${ua.achievement?.color_class || 'text-slate-400'} hover:scale-110 transition-all cursor-help shadow-sm`}>
                                    <Star className="w-4 h-4 fill-current" />
                                </div>
                            ))}
                            {userAchievements.length === 0 && (
                                <p className="text-xs text-slate-400 italic">Vượt chỉ tiêu để nhận huy hiệu đầu tiên!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Leads Table - Now from Supabase */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900">Lead ưu tiên</h3>
                        <Link href="/telesales/leads-queue" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Khách hàng</th>
                                    <th className="px-6 py-3 font-medium">Trạng thái</th>
                                    <th className="px-6 py-3 font-medium text-right">Nguồn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {safeLeads.slice(0, 5).map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{lead.storeName || lead.contactName || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{lead.phone || 'Chưa có SĐT'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                                                lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                                                    lead.status === 'WON' ? 'bg-green-100 text-green-800' :
                                                        'bg-slate-100 text-slate-800'
                                                }`}>
                                                {lead.status === 'NEW' ? 'Mới' :
                                                    lead.status === 'CONTACTED' ? 'Đã liên hệ' :
                                                        lead.status === 'WON' ? 'Đã chốt' : lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                            {lead.source || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {safeLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                            Chưa có lead nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Orders Table - Now from Supabase */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900">Đơn mới nhất</h3>
                        <Link href="/telesales/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Mã đơn</th>
                                    <th className="px-6 py-3 font-medium">Khách hàng</th>
                                    <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                                    <th className="px-6 py-3 font-medium text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {safeOrders.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {order.readableId ? `ORD-${order.readableId}` : order.id.slice(0, 8)}
                                            <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 truncate max-w-[120px]" title={order.customerName}>
                                                {order.customerName || 'Khách hàng'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatPrice(order.totalAmount || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {order.status === 'pending' ? 'Chờ xác nhận' :
                                                    order.status === 'processing' ? 'Đang xử lý' :
                                                        order.status === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {safeOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            Chưa có đơn hàng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
