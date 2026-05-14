"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Calendar, Filter, Megaphone, Share2, Users, AlertTriangle, MessageSquare, CheckCircle2, Eye, Target } from "lucide-react";
import { getAllDailyReports, DailyPlatformFunnel, PostLog } from "@/lib/recruitmentStore";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchActiveKpiMetrics, KpiMetricDefinition } from "@/lib/kpiSalaryStore";
import ReportDetailModal from "../daily/components/ReportDetailModal";
import KpiDashboard, { countLogsForMetric } from "../daily/components/KpiDashboard";

type ReportWithProfile = {
    id: string;
    date: string;
    user_id: string;
    fb_posts_paid: number;
    fb_posts_free: number;
    fb_comments: number;
    fb_friends: number;
    threads_posts: number;
    threads_comments: number;
    issues: string;
    request_support: string;
    other_tasks?: string;
    no_post_reason?: string;
    plan_next_day?: string;
    profile: {
        full_name: string;
        avatar_url: string;
        email: string;
    };
    funnels?: DailyPlatformFunnel[];
};

export default function ReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<ReportWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
    const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
    const [selectedReport, setSelectedReport] = useState<ReportWithProfile | null>(null);
    const [teamLogs, setTeamLogs] = useState<PostLog[]>([]);
    const [kpiMetrics, setKpiMetrics] = useState<KpiMetricDefinition[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    useEffect(() => {
        if (filterType !== 'custom') {
            updateDateRange(filterType);
        }
    }, [filterType]);

    useEffect(() => {
        if (user?.id) {
            loadReports();
        }
    }, [dateRange, user?.id]);

    const updateDateRange = (type: 'today' | 'yesterday' | 'week' | 'month') => {
        const now = new Date();
        let start = now;
        let end = now;

        if (type === 'yesterday') {
            const yesterday = subDays(now, 1);
            start = yesterday;
            end = yesterday;
        } else if (type === 'week') {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else if (type === 'month') {
            start = startOfMonth(now);
            end = endOfMonth(now);
        }
        setDateRange({ start, end });
    };

    const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
        const newDate = new Date(value);
        if (!isNaN(newDate.getTime())) {
            setDateRange(prev => ({
                ...prev,
                [type]: newDate
            }));
        }
    };

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const startStr = format(dateRange.start, "yyyy-MM-dd");
            const endStr = format(dateRange.end, "yyyy-MM-dd");
            const data = await getAllDailyReports(startStr, endStr);
            
            // Fetch funnels
            const { data: funnelsData } = await supabase
                .from('recruitment_daily_platform_funnels')
                .select('*')
                .gte('date', startStr)
                .lte('date', endStr);

            // Fetch Team Logs
            const { data: logsData } = await supabase
                .from('recruitment_post_logs')
                .select('*')
                .gte('date', startStr)
                .lte('date', endStr);
            setTeamLogs(logsData || []);

            // Fetch KPI Metrics
            const metrics = await fetchActiveKpiMetrics('recruiter');
            setKpiMetrics(metrics);

            // Merge
            const enrichedData = data?.map(report => {
                const reportFunnels = (funnelsData || []).filter((f: DailyPlatformFunnel) => f.user_id === report.user_id && f.date === report.date);
                return { ...report, funnels: reportFunnels };
            });

            setReports(enrichedData || []);
        } catch (error) {
            console.error("Error loading reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReports = selectedUserId === 'all' ? reports : reports.filter(r => r.user_id === selectedUserId);
    const filteredLogs = selectedUserId === 'all' ? teamLogs : teamLogs.filter(l => l.user_id === selectedUserId);

    // Calculate Summary Stats
    const totalPosts = filteredReports.reduce((sum, r) => sum + r.fb_posts_paid + r.fb_posts_free + r.threads_posts, 0);
    const totalInteractions = filteredReports.reduce((sum, r) => sum + r.fb_comments + r.threads_comments, 0);
    const totalReports = filteredReports.length;

    // Calculate Total Funnels
    const totalFunnels = filteredReports.reduce((acc, report) => {
        if (report.funnels) {
            report.funnels.forEach(f => {
                const key = f.platform.toLowerCase();
                if (!acc[key]) {
                    acc[key] = { platform: f.platform, inquiries: 0, cvs: 0, interviews: 0 };
                }
                acc[key].inquiries += f.inquiries_count || 0;
                acc[key].cvs += f.cvs_count || 0;
                acc[key].interviews += f.interviews_count || 0;
            });
        }
        return acc;
    }, {} as Record<string, { platform: string, inquiries: number, cvs: number, interviews: number }>);
    const totalFunnelArray = Object.values(totalFunnels);

    // Group by Date for cleaner list
    const reportsByDate = filteredReports.reduce((acc, report) => {
        if (!acc[report.date]) acc[report.date] = [];
        acc[report.date].push(report);
        return acc;
    }, {} as Record<string, ReportWithProfile[]>);

    const uniqueUsers = Array.from(new Map(reports.map(r => [r.user_id, { id: r.user_id, name: r.profile.full_name }])).values());

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        Báo cáo Hàng ngày
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi hoạt động của đội ngũ Tuyển dụng</p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-3 mb-1">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-500 bg-white font-medium text-slate-700"
                        >
                            <option value="all">Tổng (Tất cả nhân sự)</option>
                            {uniqueUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        
                        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button
                            onClick={() => setFilterType('today')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'today' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setFilterType('yesterday')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'yesterday' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Hôm qua
                        </button>
                        <button
                            onClick={() => setFilterType('week')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'week' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tuần này
                        </button>
                        <button
                            onClick={() => setFilterType('month')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'month' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => setFilterType('custom')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'custom' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tùy chọn
                        </button>
                    </div>

                    {filterType === 'custom' && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                            <span className="text-sm text-slate-500">Từ</span>
                            <input
                                type="date"
                                value={format(dateRange.start, "yyyy-MM-dd")}
                                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                className="px-2 py-1 text-sm border border-slate-200 rounded outline-none focus:border-primary-500"
                            />
                            <span className="text-sm text-slate-500">Đến</span>
                            <input
                                type="date"
                                value={format(dateRange.end, "yyyy-MM-dd")}
                                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                className="px-2 py-1 text-sm border border-slate-200 rounded outline-none focus:border-primary-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Số lượng báo cáo</p>
                        <p className="text-2xl font-bold text-slate-900">{totalReports}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Tổng bài đăng</p>
                        <p className="text-2xl font-bold text-slate-900">{totalPosts}</p>
                    </div>
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                        <Share2 className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Tổng tương tác</p>
                        <p className="text-2xl font-bold text-slate-900">{totalInteractions}</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Team KPI Summary */}
            {filteredLogs.length > 0 && kpiMetrics.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-indigo-600" />
                        {selectedUserId === 'all' ? 'Tổng quan KPI Toàn đội' : `Tổng quan KPI Cá nhân`} ({format(dateRange.start, 'dd/MM')} - {format(dateRange.end, 'dd/MM')})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {kpiMetrics.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((metric, idx) => {
                            const count = countLogsForMetric(metric.key, metric.label, filteredLogs);
                            return (
                                <div key={idx} className="border border-slate-100 bg-slate-50 rounded-lg p-3 relative overflow-hidden">
                                    <p className="text-[11px] text-slate-500 font-medium mb-1 truncate" title={metric.label}>{metric.label}</p>
                                    <div className="text-xl font-bold text-slate-900">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Team Funnel Summary */}
            {totalFunnelArray.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Megaphone className="w-5 h-5 text-orange-600" />
                        {selectedUserId === 'all' ? 'Tổng quan Hiệu quả Tuyển dụng Toàn đội' : 'Tổng quan Hiệu quả Tuyển dụng Cá nhân'}
                    </h2>
                    <div className="grid grid-cols-4 bg-slate-50 text-xs font-semibold text-slate-500 p-2 border-b border-slate-200 rounded-t-lg">
                        <div>Nền tảng</div>
                        <div className="text-center text-blue-600">Số người hỏi việc</div>
                        <div className="text-center text-orange-600">Số CV thu được</div>
                        <div className="text-center text-green-600">Số hẹn Phỏng vấn</div>
                    </div>
                    {totalFunnelArray.map((funnel, idx) => (
                        <div key={idx} className="grid grid-cols-4 p-3 border-b border-slate-100 last:border-0 items-center">
                            <div className="font-semibold text-slate-800 capitalize">{funnel.platform}</div>
                            <div className="text-center font-bold text-slate-900 text-lg">{funnel.inquiries}</div>
                            <div className="text-center font-bold text-slate-900 text-lg">{funnel.cvs}</div>
                            <div className="text-center font-bold text-slate-900 text-lg">{funnel.interviews}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Report List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-10">Đang tải dữ liệu...</div>
                ) : Object.keys(reportsByDate).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                        Chưa có báo cáo nào trong khoảng thời gian này.
                    </div>
                ) : (
                    Object.keys(reportsByDate).sort().reverse().map(dateKey => (
                        <div key={dateKey} className="space-y-3">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                {format(new Date(dateKey), "dd/MM/yyyy")}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {reportsByDate[dateKey].map(report => (
                                    <div key={report.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col gap-4">
                                            {/* Top Row */}
                                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                {/* User Info */}
                                                <div className="flex items-start gap-3 min-w-[200px]">
                                                    {report.profile.avatar_url ? (
                                                        <img src={report.profile.avatar_url} alt={report.profile.full_name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                                            {report.profile.full_name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{report.profile.full_name}</h4>
                                                        <p className="text-xs text-slate-500">{report.profile.email}</p>
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            {format(new Date(), "HH:mm")}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metrics Grid */}
                                                <KpiDashboard date={report.date} userId={report.user_id} compact={true} />

                                                {/* Show Details Button */}
                                                <div className="flex items-center ml-auto">
                                                    <a
                                                        href={`/recruitment/daily?userId=${report.user_id}&date=${report.date}`}
                                                        className="p-3 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors shrink-0"
                                                        title="Xem chi tiết & Chấm điểm"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Bottom Row: Text Reports */}
                                            {(report.issues || report.request_support || report.other_tasks || report.no_post_reason || report.plan_next_day) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm pt-3 border-t border-slate-100">
                                                    {report.other_tasks && (
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="font-semibold text-slate-700 block mb-1">Công việc khác</span>
                                                            <span className="text-slate-600 break-words whitespace-pre-wrap">{report.other_tasks}</span>
                                                        </div>
                                                    )}
                                                    {report.no_post_reason && (
                                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                                            <span className="font-semibold text-yellow-800 block mb-1">Lý do không đăng bài</span>
                                                            <span className="text-yellow-700 break-words whitespace-pre-wrap">{report.no_post_reason}</span>
                                                        </div>
                                                    )}
                                                    {report.issues && (
                                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                                            <span className="font-semibold text-red-800 flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> Vấn đề gặp phải</span>
                                                            <span className="text-red-700 break-words whitespace-pre-wrap">{report.issues}</span>
                                                        </div>
                                                    )}
                                                    {report.request_support && (
                                                        <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                                                            <span className="font-semibold text-primary-800 flex items-center gap-1 mb-1"><Megaphone className="w-3 h-3" /> Đề xuất hỗ trợ</span>
                                                            <span className="text-primary-700 break-words whitespace-pre-wrap">{report.request_support}</span>
                                                        </div>
                                                    )}
                                                    {report.plan_next_day && (
                                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                            <span className="font-semibold text-blue-800 block mb-1">Kế hoạch ngày mai</span>
                                                            <span className="text-blue-700 break-words whitespace-pre-wrap">{report.plan_next_day}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Bottom Row: Platform Funnels (Hiệu quả Tuyển dụng) */}
                                            {report.funnels && report.funnels.length > 0 && report.funnels.some(f => f.inquiries_count > 0 || f.cvs_count > 0 || f.interviews_count > 0) && (
                                                <div className="mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden text-sm">
                                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
                                                        <span>Hiệu quả Nguồn Tuyển dụng (Platform Funnel)</span>
                                                    </div>
                                                    <div className="grid grid-cols-4 bg-slate-50 text-xs font-semibold text-slate-500 p-2 border-b border-slate-200">
                                                        <div>Nền tảng</div>
                                                        <div className="text-center text-blue-600">Số người hỏi việc</div>
                                                        <div className="text-center text-orange-600">Số CV thu được</div>
                                                        <div className="text-center text-green-600">Số hẹn Phỏng vấn</div>
                                                    </div>
                                                    {report.funnels.filter(f => f.inquiries_count > 0 || f.cvs_count > 0 || f.interviews_count > 0).map((funnel, idx) => (
                                                        <div key={idx} className="grid grid-cols-4 p-2 border-b border-slate-100 last:border-0 items-center">
                                                            <div className="font-medium text-slate-700 capitalize">{funnel.platform}</div>
                                                            <div className="text-center font-semibold text-slate-900">{funnel.inquiries_count}</div>
                                                            <div className="text-center font-semibold text-slate-900">{funnel.cvs_count}</div>
                                                            <div className="text-center font-semibold text-slate-900">{funnel.interviews_count}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}
