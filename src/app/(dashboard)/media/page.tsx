"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Camera, FileInput, FolderOpen, ClipboardList, Wrench, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

interface MediaStats {
    pendingBriefs: number;
    activeProjects: number;
    completedThisMonth: number;
    totalAssets: number;
}

export default function MediaDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState<MediaStats>({
        pendingBriefs: 0, activeProjects: 0, completedThisMonth: 0, totalAssets: 0
    });
    const [recentBriefs, setRecentBriefs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Pending briefs
            const { count: pendingBriefs } = await supabase
                .from("media_briefs")
                .select("*", { count: "exact", head: true })
                .eq("assigned_to", user.id)
                .in("status", ["pending", "in_progress"]);

            // Active projects
            const { count: activeProjects } = await supabase
                .from("media_projects")
                .select("*", { count: "exact", head: true })
                .eq("assigned_to", user.id)
                .in("status", ["shooting", "editing", "review"]);

            // Completed this month
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const { count: completedThisMonth } = await supabase
                .from("media_projects")
                .select("*", { count: "exact", head: true })
                .eq("assigned_to", user.id)
                .eq("status", "completed")
                .gte("completed_at", monthStart.toISOString());

            // Total assets
            const { count: totalAssets } = await supabase
                .from("media_assets")
                .select("*", { count: "exact", head: true })
                .eq("uploaded_by", user.id);

            setStats({
                pendingBriefs: pendingBriefs || 0,
                activeProjects: activeProjects || 0,
                completedThisMonth: completedThisMonth || 0,
                totalAssets: totalAssets || 0,
            });

            // Recent briefs
            const { data: briefs } = await supabase
                .from("media_briefs")
                .select("*")
                .eq("assigned_to", user.id)
                .in("status", ["pending", "in_progress"])
                .order("created_at", { ascending: false })
                .limit(5);

            setRecentBriefs(briefs || []);
        } catch (err) {
            console.error("Load media dashboard error:", err);
        } finally {
            setLoading(false);
        }
    }

    const statsCards = [
        {
            label: "Brief chờ xử lý",
            value: stats.pendingBriefs.toString(),
            sub: "Yêu cầu mới",
            icon: FileInput,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
        {
            label: "Dự án đang thực hiện",
            value: stats.activeProjects.toString(),
            sub: "Chụp / Quay / Dựng",
            icon: Camera,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Hoàn thành tháng này",
            value: stats.completedThisMonth.toString(),
            sub: "Dự án đã bàn giao",
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Tổng media đã upload",
            value: stats.totalAssets.toString(),
            sub: "Ảnh & Video",
            icon: FolderOpen,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    const statusLabels: Record<string, { text: string; color: string }> = {
        pending: { text: "Chờ xử lý", color: "bg-amber-100 text-amber-700" },
        in_progress: { text: "Đang thực hiện", color: "bg-blue-100 text-blue-700" },
        completed: { text: "Hoàn thành", color: "bg-green-100 text-green-700" },
        cancelled: { text: "Đã hủy", color: "bg-slate-100 text-slate-500" },
    };

    const priorityLabels: Record<string, { text: string; color: string }> = {
        urgent: { text: "Gấp", color: "bg-red-100 text-red-700" },
        high: { text: "Cao", color: "bg-orange-100 text-orange-700" },
        normal: { text: "Bình thường", color: "bg-slate-100 text-slate-600" },
        low: { text: "Thấp", color: "bg-slate-50 text-slate-400" },
    };

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

            {/* Recent Briefs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                        📋 Brief cần xử lý
                    </h3>
                    <Link href="/media/briefs" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                        Xem tất cả →
                    </Link>
                </div>

                {recentBriefs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <FileInput className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Chưa có brief nào</p>
                        <p className="text-xs mt-1">Các phòng ban sẽ gửi yêu cầu chụp/quay tại đây</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentBriefs.map(brief => (
                            <div key={brief.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg ${brief.priority === 'urgent' ? 'bg-red-50' : 'bg-amber-50'}`}>
                                        {brief.priority === 'urgent' ? (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <FileInput className="w-4 h-4 text-amber-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-slate-800 truncate">{brief.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {brief.media_type === 'photo' ? '📸 Chụp ảnh' :
                                                brief.media_type === 'video' ? '🎬 Quay video' : '📸🎬 Ảnh + Video'}
                                            {brief.deadline && ` • Deadline: ${new Date(brief.deadline).toLocaleDateString('vi-VN')}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(statusLabels[brief.status] || statusLabels.pending).color}`}>
                                        {(statusLabels[brief.status] || statusLabels.pending).text}
                                    </span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(priorityLabels[brief.priority] || priorityLabels.normal).color}`}>
                                        {(priorityLabels[brief.priority] || priorityLabels.normal).text}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Link href="/media/briefs" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-orange-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                        <FileInput className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Brief / Yêu cầu</h4>
                        <p className="text-xs text-slate-500">Xem yêu cầu chụp/quay</p>
                    </div>
                </Link>
                <Link href="/media/library" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <FolderOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Thư viện Media</h4>
                        <p className="text-xs text-slate-500">Upload & quản lý ảnh/video</p>
                    </div>
                </Link>
                <Link href="/media/projects" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Dự án</h4>
                        <p className="text-xs text-slate-500">Quản lý tiến độ dự án</p>
                    </div>
                </Link>
                <Link href="/media/equipment" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-200 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                        <Wrench className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Thiết bị</h4>
                        <p className="text-xs text-slate-500">Camera, lens, phụ kiện</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
