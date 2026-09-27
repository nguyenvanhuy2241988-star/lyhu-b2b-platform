"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
    Users, Phone, ShoppingBag, TrendingUp, ArrowRight,
    Loader2, Award, Star, Trophy, PartyPopper, ChevronRight,
    Crown, Medal, Flame, CheckCircle2, Clock, Calendar,
    PlusCircle, Filter, RefreshCw, ExternalLink, AlertCircle,
    ListTodo, FileText, Target, Sparkles, PhoneCall, HelpCircle
} from "lucide-react";
import { getMyTasks, TelesalesTask } from "@/lib/telesalesTasksStore";
import { fetchSalesLeads, SalesLead } from "@/lib/salesLeads";
import { fetchOrders, Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    fetchBondingFund,
    getLeaderboard,
    fetchUserAchievements,
    fetchCareerLevels,
    type BondingFund,
    type LeaderboardEntry,
    type CareerLevel,
    type UserAchievement
} from "@/lib/engagementStore";
import { createClient } from "@/lib/supabaseClient";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/SkeletonUI";
import { fetchKPIStats, fetchSalesFunnel, KPISummary, FunnelStage } from "@/lib/crmDealsStore";
import { SalesFunnelChart } from "@/components/telesales/dashboard/KPICharts";
import LeaderboardWidget from "@/components/telesales/dashboard/LeaderboardWidget";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(price || 0);
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return dateString;
    }
};

const formatTimeAgo = (dateString: string) => {
    try {
        const diffMs = Date.now() - new Date(dateString).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${Math.floor(diffHours / 24)} ngày trước`;
    } catch {
        return dateString;
    }
};

// Target KPI constants for Telesales
const MONTHLY_REVENUE_TARGET = 50000000; // 50M VND
const DAILY_CALLS_TARGET = 30; // 30 calls/day

export default function TelesalesDashboard() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    // State for personal data
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [leads, setLeads] = useState<SalesLead[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // KPI & Funnel State (Personal only - security & role separation)
    const [kpiStats, setKpiStats] = useState<KPISummary | null>(null);
    const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);

    // Engagement state (Team motivation)
    const [bondingFund, setBondingFund] = useState<BondingFund | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userAchievements, setUserAchievements] = useState<any[]>([]);
    const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);

    // Filter State
    const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "year">("month");
    const [currentDate, setCurrentDate] = useState(new Date());

    // Safe access
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    // Helper to get date range
    const getDateRange = useCallback(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);

        if (timeFilter === "today") {
            start.setHours(0, 0, 0, 0);
        } else if (timeFilter === "week") {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(start);
            endOfWeek.setDate(start.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            end.setTime(endOfWeek.getTime());
        } else if (timeFilter === "month") {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);

            const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
            end.setTime(endOfMonth.getTime());
        } else if (timeFilter === "year") {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);

            const endOfYear = new Date(start.getFullYear(), 11, 31, 23, 59, 59);
            end.setTime(endOfYear.getTime());
        }

        return { start, end };
    }, [timeFilter, currentDate]);

    // Navigation Handlers for Leaderboard
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (timeFilter === "today") newDate.setDate(newDate.getDate() - 1);
        if (timeFilter === "week") newDate.setDate(newDate.getDate() - 7);
        if (timeFilter === "month") newDate.setMonth(newDate.getMonth() - 1);
        if (timeFilter === "year") newDate.setFullYear(newDate.getFullYear() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (timeFilter === "today") newDate.setDate(newDate.getDate() + 1);
        if (timeFilter === "week") newDate.setDate(newDate.getDate() + 7);
        if (timeFilter === "month") newDate.setMonth(newDate.getMonth() + 1);
        if (timeFilter === "year") newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDate(newDate);
    };

    // Load personal data
    const loadAll = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const token = session?.access_token;
            const { start: globalStart, end: globalEnd } = getDateRange();

            const [
                taskRows,
                leadRows,
                orderRows,
                personalKpi,
                personalFunnel,
                fundData,
                leaderboardData,
                achievementsData,
                roadmapData
            ] = await Promise.all([
                getMyTasks(user?.id, token),
                fetchSalesLeads(user?.id, token, {
                    fromDate: globalStart.toISOString(),
                    toDate: globalEnd.toISOString()
                }),
                fetchOrders(token, {
                    userId: user?.id,
                    startDate: globalStart.toISOString(),
                    endDate: globalEnd.toISOString()
                }),
                fetchKPIStats(globalStart, globalEnd, user?.id, token),
                fetchSalesFunnel(globalStart, globalEnd, user?.id, token),
                fetchBondingFund(token),
                getLeaderboard(globalStart, globalEnd, token),
                fetchUserAchievements(user?.id || "", token),
                fetchCareerLevels(token)
            ]);

            setTasks(Array.isArray(taskRows) ? taskRows : []);
            setLeads(Array.isArray(leadRows) ? leadRows : []);
            setOrders(Array.isArray(orderRows) ? orderRows : []);
            setKpiStats(personalKpi);
            setFunnelData(personalFunnel || []);
            setBondingFund(fundData);
            setLeaderboard(leaderboardData || []);
            setUserAchievements(achievementsData || []);
            setCareerLevels(roadmapData || []);
        } catch (e) {
            console.error("[TelesalesDashboard] Error loading data:", e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, session, getDateRange]);

    useEffect(() => {
        if (!user && !authIsLoading) {
            setIsLoading(false);
            return;
        }
        if (user) {
            loadAll();
        }
    }, [user, authIsLoading, loadAll]);

    // Active KPI metrics
    const activeKpi = useMemo(() => {
        return kpiStats || {
            total_revenue: 0,
            total_deals_won: 0,
            total_calls: 0,
            total_deals_new: 0,
            avg_call_duration: 0
        };
    }, [kpiStats]);

    // Progress Calculations
    const revenueProgress = Math.min(Math.round(((activeKpi.total_revenue || 0) / MONTHLY_REVENUE_TARGET) * 100), 100);
    const winRate = activeKpi.total_deals_new > 0
        ? Math.round((activeKpi.total_deals_won / activeKpi.total_deals_new) * 100)
        : (activeKpi.total_deals_won > 0 ? 100 : 0);

    // Career Level Roadmap Logic
    const currentMonthlyRevenue = kpiStats?.total_revenue || 0;
    const currentCareerLevel = careerLevels.find(l => currentMonthlyRevenue >= l.min_exp * 1000) || careerLevels[0];
    const nextLevel = careerLevels.find(l => l.min_exp * 1000 > currentMonthlyRevenue);
    const progressToNext = nextLevel ? (currentMonthlyRevenue / (nextLevel.min_exp * 1000)) * 100 : 100;

    // Daily quote
    const quotes = [
        "Năng lượng và sự tận tâm của bạn quyết định kết quả của mỗi cuộc đối thoại.",
        "Mỗi cuộc gọi từ chối là một kinh nghiệm để tiến gần hơn đến một cái gật đầu.",
        "Đừng chỉ bán sản phẩm, hãy mang lại giải pháp và giá trị thiết thực cho khách hàng.",
        "Khách hàng mua niềm tin trước khi mua sản phẩm của bạn.",
        "Sự kiên trì, chân thành và thấu hiểu là vũ khí mạnh nhất của người bán hàng xuất sắc."
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
                <div className="bg-slate-100 h-20 rounded-2xl animate-pulse" />
                <StatsSkeleton />
                <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TableSkeleton rows={5} cols={3} />
                    <TableSkeleton rows={5} cols={4} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300">
            {/* ============================================================ */}
            {/* 1. HEADER (PERSONAL DESK FOCUS & SECURITY)                  */}
            {/* ============================================================ */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AFA9] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00AFA9]"></span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#00AFA9]">
                            Bàn làm việc Telesales cá nhân • Sẵn sàng gọi điện
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Tổng quan Telesales
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Theo dõi chỉ tiêu doanh số cá nhân, tiến độ cuộc gọi và khách hàng phụ trách
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Time Filter Pills */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                        <button
                            onClick={() => { setTimeFilter("today"); setCurrentDate(new Date()); }}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                timeFilter === "today"
                                    ? "bg-white text-[#00AFA9] font-bold shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => { setTimeFilter("week"); setCurrentDate(new Date()); }}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                timeFilter === "week"
                                    ? "bg-white text-[#00AFA9] font-bold shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Tuần này
                        </button>
                        <button
                            onClick={() => { setTimeFilter("month"); setCurrentDate(new Date()); }}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                timeFilter === "month"
                                    ? "bg-white text-[#00AFA9] font-bold shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Tháng này
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => loadAll(true)}
                        disabled={isRefreshing}
                        title="Làm mới dữ liệu"
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#00AFA9]" : ""}`} />
                    </button>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 2. DAILY INSPIRATION & FAST ACTION BAR                       */}
            {/* ============================================================ */}
            <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-teal-200/80 flex items-center justify-center shrink-0 text-[#00AFA9] shadow-sm">
                        <Sparkles className="w-4 h-4 text-[#00AFA9]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#00AFA9] uppercase tracking-wider">
                            Lời khuyên & Định hướng ngày mới
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-800 italic truncate sm:whitespace-normal">
                            "{dailyQuote}"
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/telesales/leads-queue"
                        className="px-3.5 py-1.5 bg-[#00AFA9] hover:bg-[#009690] text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                    >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Nhận Lead từ Hàng Đợi</span>
                    </Link>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 3. 4 KEY KPI SCORECARDS (TARGET TRACKER)                    */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Doanh số chốt được */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Doanh số của tôi
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00AFA9]">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {formatPrice(activeKpi.total_revenue || 0)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Chỉ tiêu tháng: {formatPrice(MONTHLY_REVENUE_TARGET)}
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Tiến độ chỉ tiêu:</span>
                            <span className="font-extrabold text-[#00AFA9]">{revenueProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#00AFA9] rounded-full transition-all duration-700"
                                style={{ width: `${revenueProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Deal chốt thành công */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deal thắng</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
                            {activeKpi.total_deals_won || 0}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Hợp đồng / đơn hàng chốt thành công
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Tỷ lệ chốt thành công:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {winRate}%
                        </span>
                    </div>
                </div>

                {/* 3. Hoạt động cuộc gọi */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuộc gọi thực hiện</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Phone className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {activeKpi.total_calls || 0}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Thời lượng trung bình: <span className="font-bold text-slate-700">{Math.round(activeKpi.avg_call_duration || 0)}s</span>/cuộc
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Mục tiêu ngày:</span>
                        <span className="font-semibold text-slate-700">{DAILY_CALLS_TARGET} cuộc/ngày</span>
                    </div>
                </div>

                {/* 4. Khách hàng tiềm năng mới */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data & Leads mới</span>
                            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {activeKpi.total_deals_new || 0}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Khách hàng được phân bổ trong kỳ này
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <Link
                            href="/telesales/customers"
                            className="text-xs font-bold text-[#00AFA9] hover:text-[#009690] inline-flex items-center gap-1"
                        >
                            <span>Danh sách khách hàng</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 4. SALES FUNNEL & PERFORMANCE CONVERSION (STABLE LAYOUT)    */}
            {/* ============================================================ */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Target className="w-5 h-5 text-[#00AFA9]" />
                            Phễu Chuyển Đổi Bán Hàng Cá Nhân
                        </h3>
                        <p className="text-xs text-slate-500">
                            Tiến trình chuyển dịch khách hàng từ Data mới đến Chốt đơn thành công của bạn
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/crm"
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors"
                        >
                            Mở CRM Pipeline
                        </Link>
                        <Link
                            href="/telesales/create-order"
                            className="px-3.5 py-1.5 rounded-lg bg-[#00AFA9] hover:bg-[#009690] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                            + Tạo đơn chốt ngay
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left: Summary Metrics */}
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Khách hàng tiếp nhận</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-slate-900">{activeKpi.total_deals_new || 0}</span>
                                <span className="text-xs text-slate-500">tiềm năng</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Data phân bổ từ marketing & web</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Tỉ lệ chốt thành công</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-[#00AFA9]">{winRate}%</span>
                                <span className="text-xs text-emerald-600 font-semibold">{activeKpi.total_deals_won || 0} đơn ký</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Tỷ lệ đơn hàng thành công trên tổng data</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Giá trị chốt trung bình</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-lg sm:text-xl font-black text-slate-900">
                                    {activeKpi.total_deals_won > 0
                                        ? formatPrice(Math.round(activeKpi.total_revenue / activeKpi.total_deals_won))
                                        : "0 đ"}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Giá trị trung bình mỗi đơn sỉ B2B</p>
                        </div>
                    </div>

                    {/* Right: Funnel Progress Stages (No SVG Overflow Bugs) */}
                    <div className="lg:col-span-2 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                        {funnelData.length > 0 ? (
                            <SalesFunnelChart data={funnelData} />
                        ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-full bg-teal-50 text-[#00AFA9] flex items-center justify-center mb-2.5">
                                    <Target className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Chưa có deal nào trong phễu cá nhân</h4>
                                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                                    Nhận data từ Hàng Đợi hoặc bắt đầu cuộc gọi chào hàng để đưa khách hàng vào các nấc phễu
                                </p>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/telesales/leads-queue"
                                        className="px-4 py-2 bg-[#00AFA9] hover:bg-[#009690] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                    >
                                        Nhận Data Mới từ Hàng Đợi
                                    </Link>
                                    <Link
                                        href="/crm"
                                        className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-[#00AFA9] rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Mở Pipeline CRM
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 5. GAMIFICATION: LEADERBOARD & BONDING & CAREER ROADMAP      */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Leaderboard (Bảng vàng vinh danh) */}
                <div className="lg:col-span-2 h-[520px]">
                    <LeaderboardWidget
                        leaderboard={leaderboard}
                        isLoading={isLoading}
                        timeFilter={timeFilter}
                        currentDate={currentDate}
                        onFilterChange={(f) => { setTimeFilter(f); setCurrentDate(new Date()); }}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                </div>

                {/* 2. Quỹ Bonding & Cấp bậc */}
                <div className="space-y-6">
                    {/* Quỹ Bonding */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform text-[#00AFA9]">
                            <PartyPopper className="w-28 h-28" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00AFA9] flex items-center justify-center">
                                <PartyPopper className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiền ăn chơi tập thể</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quỹ Bonding hiện tại</p>
                        <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                            {formatPrice(bondingFund?.balance || 2500000)}
                        </div>
                        <p className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-100">
                            🎉 Hôm nay cả đội đã tích thêm +50.000 đ!
                        </p>
                    </div>

                    {/* Cấp bậc cá nhân */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00AFA9] flex items-center justify-center">
                                <Crown className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cấp bậc của bạn</span>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-base font-bold text-slate-900">{currentCareerLevel?.name || "Tân binh"}</span>
                                <span className="text-xs font-bold text-[#00AFA9] bg-teal-50 px-2 py-0.5 rounded">
                                    CẤP {currentCareerLevel?.id || 1}
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#00AFA9] rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                                />
                            </div>
                            {nextLevel && (
                                <p className="text-[11px] text-slate-500 mt-2">
                                    Còn <span className="font-bold text-[#00AFA9]">{formatPrice((nextLevel.min_exp * 1000) - currentMonthlyRevenue)}</span> doanh số để thăng cấp <span className="font-bold text-slate-800">{nextLevel.name}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {userAchievements.slice(0, 5).map((ua, i) => (
                                <div
                                    key={i}
                                    title={ua.achievement?.name || "Huy hiệu"}
                                    className={`p-1.5 bg-white border border-slate-200 rounded-lg ${ua.achievement?.color_class || "text-slate-400"} hover:scale-110 transition-all cursor-help shadow-sm`}
                                >
                                    <Star className="w-4 h-4 fill-current" />
                                </div>
                            ))}
                            {userAchievements.length === 0 && (
                                <p className="text-xs text-slate-400 italic">Vượt chỉ tiêu tháng để mở khóa các huy hiệu vinh danh!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 6. PRIORITY CALLING LEADS & RECENT ORDERS                   */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Leads Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#00AFA9]" />
                                Khách hàng ưu tiên cần gọi
                            </h3>
                            <p className="text-xs text-slate-500">Danh sách cần tương tác và tư vấn</p>
                        </div>
                        <Link
                            href="/telesales/leads-queue"
                            className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center gap-1"
                        >
                            <span>Hàng đợi Data</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Khách hàng / Cửa hàng</th>
                                    <th className="px-5 py-3">Trạng thái</th>
                                    <th className="px-5 py-3 text-right">Nguồn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {safeLeads.length > 0 ? (
                                    safeLeads.slice(0, 5).map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">
                                                    {lead.storeName || lead.contactName || "Khách tiềm năng"}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {lead.phone || "Chưa có SĐT"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                    lead.status === "NEW" ? "border-blue-200 bg-blue-50 text-blue-700" :
                                                    lead.status === "CONTACTED" ? "border-amber-200 bg-amber-50 text-amber-700" :
                                                    lead.status === "WON" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                                    "border-slate-200 bg-slate-50 text-slate-700"
                                                }`}>
                                                    {lead.status === "NEW" ? "Mới nhận" :
                                                     lead.status === "CONTACTED" ? "Đã liên hệ" :
                                                     lead.status === "WON" ? "Đã chốt" : lead.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-slate-500 text-xs">
                                                {lead.source || "Telesales Queue"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users className="w-8 h-8 text-slate-300 mb-2" />
                                                <p className="text-xs font-semibold text-slate-700">Chưa có lead cá nhân nào được chỉ định</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Bạn có thể lấy data ngay từ hàng đợi chung để bắt đầu gọi</p>
                                                <Link
                                                    href="/telesales/leads-queue"
                                                    className="px-3.5 py-1.5 rounded-lg bg-[#00AFA9] hover:bg-[#009690] text-white text-xs font-bold transition-colors shadow-sm"
                                                >
                                                    Vào Hàng Đợi Nhận Lead
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-[#00AFA9]" />
                                Đơn hàng mới nhất của bạn
                            </h3>
                            <p className="text-xs text-slate-500">Các đơn bạn đã chốt thành công</p>
                        </div>
                        <Link
                            href="/telesales/orders"
                            className="text-xs text-[#00AFA9] hover:text-[#009690] font-bold flex items-center gap-1"
                        >
                            <span>Xem tất cả</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Mã & Ngày</th>
                                    <th className="px-5 py-3">Khách hàng</th>
                                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                                    <th className="px-5 py-3 text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {safeOrders.length > 0 ? (
                                    safeOrders.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">
                                                    #{order.readableId ? order.readableId : order.id.slice(0, 8)}
                                                </div>
                                                <div className="text-[11px] text-slate-400">{formatTimeAgo(order.createdAt)}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900 truncate max-w-[150px]" title={order.customerName}>
                                                    {order.customerName || "Khách sỉ"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-black text-slate-900">
                                                {formatPrice(order.totalAmount || 0)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                    order.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    order.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                    order.status === "delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    order.status === "delivering" ? "bg-teal-50 text-[#00AFA9] border-teal-200" :
                                                    "bg-rose-50 text-rose-700 border-rose-200"
                                                }`}>
                                                    {order.status === "pending" ? "Chờ duyệt" :
                                                     order.status === "processing" ? "Đang xử lý" :
                                                     order.status === "delivering" ? "Đang giao" :
                                                     order.status === "delivered" ? "Đã giao" : "Đã hủy"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <ShoppingBag className="w-8 h-8 text-slate-300 mb-2" />
                                                <p className="text-xs font-semibold text-slate-700">Bạn chưa có đơn hàng nào trong kỳ này</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Tạo đơn hàng mới ngay khi chốt cuộc gọi thành công</p>
                                                <Link
                                                    href="/telesales/create-order"
                                                    className="px-3.5 py-1.5 rounded-lg bg-[#00AFA9] hover:bg-[#009690] text-white text-xs font-bold transition-colors shadow-sm"
                                                >
                                                    + Lên Đơn Hàng Mới
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 7. QUICK ACTION SHORTCUT BAR                                */}
            {/* ============================================================ */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Flame className="w-4 h-4 text-[#00AFA9]" />
                    <span>Lối tắt hành động nhanh cho Telesales:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/telesales/create-order"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        + Tạo đơn hàng
                    </Link>
                    <Link
                        href="/telesales/leads-queue"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Nhận Lead mới
                    </Link>
                    <Link
                        href="/telesales/customers"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Danh sách Khách hàng
                    </Link>
                    <Link
                        href="/telesales/retail-chains"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Chuỗi Siêu thị
                    </Link>
                    <Link
                        href="/telesales/earnings"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00AFA9] hover:border-[#00AFA9] transition-colors shadow-sm"
                    >
                        Thu nhập & Thưởng KPI
                    </Link>
                </div>
            </div>
        </div>
    );
}
