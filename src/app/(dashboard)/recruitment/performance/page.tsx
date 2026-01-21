"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Loader2, TrendingUp, Users, MousePointer, Target, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

type KPIRecruiter = {
    recruiter_id: string;
    recruiter_name: string;
    recruiter_email: string;
    recruiter_avatar: string | null;
    total_links: number;
    total_clicks: number;
    total_leads: number;
    conversion_rate: number;
    top_source: string;
};

export default function RecruitmentPerformancePage() {
    const [stats, setStats] = useState<KPIRecruiter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("all"); // all, month, week

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            let startDate = null;
            let endDate = null;

            if (timeRange === 'month') {
                startDate = startOfMonth(new Date()).toISOString();
                endDate = endOfMonth(new Date()).toISOString();
            } else if (timeRange === 'week') {
                startDate = subDays(new Date(), 7).toISOString();
            }

            const { data, error } = await supabase.rpc('get_recruitment_kpi_report', {
                p_start_date: startDate,
                p_end_date: endDate
            });

            if (error) throw error;
            setStats(data || []);
        } catch (error) {
            console.error("Failed to load KPI stats", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Totals
    const totalTraffic = stats.reduce((sum, s) => sum + s.total_clicks, 0);
    const totalLeads = stats.reduce((sum, s) => sum + s.total_leads, 0);
    const avgConversion = totalTraffic > 0 ? ((totalLeads / totalTraffic) * 100).toFixed(2) : "0";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        Hiệu quả Tuyển dụng (Social KPI)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi Traffic và Chuyển đổi từ nguồn Social Media</p>
                </div>

                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button
                        onClick={() => setTimeRange("all")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${timeRange === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setTimeRange("month")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${timeRange === 'month' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tháng này
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MousePointer className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500">Tổng Traffic (Clicks)</h3>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{totalTraffic.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1">Lượt truy cập từ link seeding</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500">Tổng Ứng viên (Leads)</h3>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{totalLeads.toLocaleString()}</div>
                    <div className="text-xs text-purple-600 mt-1">Đơn ứng tuyển hợp lệ</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Target className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500">Tỷ lệ chuyển đổi</h3>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{avgConversion}%</div>
                    <div className="text-xs text-orange-600 mt-1">Lead / Click</div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Bảng xếp hạng Hiệu suất</h3>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                    </div>
                ) : stats.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        Chưa có dữ liệu nào. Hãy bắt đầu tạo link và chia sẻ!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Nhân sự</th>
                                    <th className="px-6 py-3 text-right">Số Link đã tạo</th>
                                    <th className="px-6 py-3 text-right">Traffic (Clicks)</th>
                                    <th className="px-6 py-3 text-right">Leads</th>
                                    <th className="px-6 py-3 text-right">Hiệu quả (%)</th>
                                    <th className="px-6 py-3">Kênh chủ đạo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.map((s, idx) => (
                                    <tr key={s.recruiter_id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs">
                                                    {s.recruiter_avatar ? <img src={s.recruiter_avatar} className="w-full h-full rounded-full object-cover" /> : (idx + 1)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{s.recruiter_name}</div>
                                                    <div className="text-xs text-slate-500">{s.recruiter_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-600 font-mono">{s.total_links}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-bold text-blue-600">{s.total_clicks.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-bold text-purple-600">{s.total_leads.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`font-bold ${s.conversion_rate > 1 ? 'text-green-600' : 'text-slate-500'}`}>
                                                {s.conversion_rate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">
                                                {s.top_source}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
