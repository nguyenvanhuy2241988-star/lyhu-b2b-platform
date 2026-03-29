"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
    Camera, FileInput, FolderOpen, ClipboardList, Users, TrendingUp,
    CheckCircle, Clock, Film, Image, ChevronRight, X, ChevronDown,
    BarChart3, Eye
} from "lucide-react";

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface UserReport {
    userId: string;
    fullName: string;
    briefsAssigned: number;
    briefsCompleted: number;
    projectsActive: number;
    projectsCompleted: number;
    assetsUploaded: number;
}

interface ProjectStatusCount {
    status: string;
    count: number;
}

interface BriefDetail {
    id: string;
    title: string;
    media_type: string;
    status: string;
    priority: string;
    deadline: string | null;
    created_at: string;
}

interface ProjectDetail {
    id: string;
    title: string;
    media_type: string;
    status: string;
    priority: string;
    asset_count: number;
    deadline: string | null;
    completed_at: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700" },
    in_progress: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
    planned: { label: "Kế hoạch", color: "bg-slate-100 text-slate-600" },
    shooting: { label: "Chụp/Quay", color: "bg-amber-100 text-amber-700" },
    editing: { label: "Dựng/Chỉnh", color: "bg-blue-100 text-blue-700" },
    review: { label: "Review", color: "bg-purple-100 text-purple-700" },
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Đã hủy", color: "bg-slate-100 text-slate-500" },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
    urgent: { label: "Gấp", color: "bg-red-100 text-red-700" },
    high: { label: "Cao", color: "bg-orange-100 text-orange-700" },
    normal: { label: "Bình thường", color: "bg-slate-50 text-slate-500" },
    low: { label: "Thấp", color: "bg-slate-50 text-slate-400" },
};

const PROJECT_STATUS_ORDER = ["planned", "shooting", "editing", "review", "completed"];
const PROJECT_STATUS_COLORS: Record<string, string> = {
    planned: "bg-slate-400",
    shooting: "bg-amber-500",
    editing: "bg-blue-500",
    review: "bg-purple-500",
    completed: "bg-green-500",
};

type Period = "today" | "week" | "month" | "year" | "custom";

export default function AdminMediaReportsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("month");

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [customFrom, setCustomFrom] = useState(fmtDate(firstOfMonth));
    const [customTo, setCustomTo] = useState(fmtDate(now));

    // Summary
    const [totalBriefs, setTotalBriefs] = useState(0);
    const [activeProjects, setActiveProjects] = useState(0);
    const [completionRate, setCompletionRate] = useState(0);
    const [totalAssets, setTotalAssets] = useState(0);

    // Breakdown
    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [projectStatusCounts, setProjectStatusCounts] = useState<ProjectStatusCount[]>([]);

    // Drill-down
    const [selectedUser, setSelectedUser] = useState<UserReport | null>(null);
    const [userBriefs, setUserBriefs] = useState<BriefDetail[]>([]);
    const [userProjects, setUserProjects] = useState<ProjectDetail[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const getDateRange = useCallback((): [Date, Date] => {
        const n = new Date();
        switch (period) {
            case "today":
                return [new Date(n.getFullYear(), n.getMonth(), n.getDate()), new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59, 999)];
            case "week": {
                const dayOfWeek = n.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(n);
                monday.setDate(n.getDate() + mondayOffset);
                monday.setHours(0, 0, 0, 0);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                return [monday, sunday];
            }
            case "month":
                return [new Date(n.getFullYear(), n.getMonth(), 1), new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59, 999)];
            case "year":
                return [new Date(n.getFullYear(), 0, 1), new Date(n.getFullYear(), 11, 31, 23, 59, 59, 999)];
            case "custom":
                return [new Date(customFrom + "T00:00:00"), new Date(customTo + "T23:59:59.999")];
            default:
                return [new Date(n.getFullYear(), n.getMonth(), 1), n];
        }
    }, [period, customFrom, customTo]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [from, to] = getDateRange();
            const fromStr = from.toISOString();
            const toStr = to.toISOString();

            // 1. Get all media_creator users
            const { data: mediaUsers } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("role", "media_creator")
                .eq("status", "active");

            const users = mediaUsers || [];
            const userIds = users.map(u => u.id);

            if (userIds.length === 0) {
                setTotalBriefs(0);
                setActiveProjects(0);
                setCompletionRate(0);
                setTotalAssets(0);
                setUserReports([]);
                setProjectStatusCounts([]);
                setLoading(false);
                return;
            }

            // 2. Fetch all briefs in period
            const { data: allBriefs } = await supabase
                .from("media_briefs")
                .select("id, assigned_to, status")
                .in("assigned_to", userIds)
                .gte("created_at", fromStr)
                .lte("created_at", toStr);

            // 3. Fetch all projects in period
            const { data: allProjects } = await supabase
                .from("media_projects")
                .select("id, assigned_to, status")
                .in("assigned_to", userIds)
                .gte("created_at", fromStr)
                .lte("created_at", toStr);

            // 4. Fetch all assets in period
            const { data: allAssets } = await supabase
                .from("media_assets")
                .select("id, uploaded_by")
                .in("uploaded_by", userIds)
                .gte("created_at", fromStr)
                .lte("created_at", toStr);

            const briefs = allBriefs || [];
            const projects = allProjects || [];
            const assets = allAssets || [];

            // Summary cards
            setTotalBriefs(briefs.length);
            const active = projects.filter(p => ["shooting", "editing", "review"].includes(p.status)).length;
            setActiveProjects(active);
            const completed = projects.filter(p => p.status === "completed").length;
            const total = projects.length;
            setCompletionRate(total > 0 ? Math.round((completed / total) * 100) : 0);
            setTotalAssets(assets.length);

            // Per-user breakdown
            const userReportList: UserReport[] = users.map(u => {
                const uBriefs = briefs.filter(b => b.assigned_to === u.id);
                const uProjects = projects.filter(p => p.assigned_to === u.id);
                const uAssets = assets.filter(a => a.uploaded_by === u.id);
                return {
                    userId: u.id,
                    fullName: u.full_name || u.id.slice(0, 8),
                    briefsAssigned: uBriefs.length,
                    briefsCompleted: uBriefs.filter(b => b.status === "completed").length,
                    projectsActive: uProjects.filter(p => ["shooting", "editing", "review"].includes(p.status)).length,
                    projectsCompleted: uProjects.filter(p => p.status === "completed").length,
                    assetsUploaded: uAssets.length,
                };
            });
            userReportList.sort((a, b) => (b.projectsCompleted + b.assetsUploaded) - (a.projectsCompleted + a.assetsUploaded));
            setUserReports(userReportList);

            // Project status breakdown
            const statusMap: Record<string, number> = {};
            projects.forEach(p => {
                statusMap[p.status] = (statusMap[p.status] || 0) + 1;
            });
            const statusCounts = PROJECT_STATUS_ORDER.map(s => ({
                status: s,
                count: statusMap[s] || 0,
            }));
            setProjectStatusCounts(statusCounts);

        } catch (err) {
            console.error("loadData error:", err);
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => { loadData(); }, [loadData]);

    // Drill-down
    const openUserDetail = async (user: UserReport) => {
        setSelectedUser(user);
        setDetailLoading(true);
        try {
            const [from, to] = getDateRange();

            const [briefsRes, projectsRes] = await Promise.all([
                supabase
                    .from("media_briefs")
                    .select("id, title, media_type, status, priority, deadline, created_at")
                    .eq("assigned_to", user.userId)
                    .gte("created_at", from.toISOString())
                    .lte("created_at", to.toISOString())
                    .order("created_at", { ascending: false }),
                supabase
                    .from("media_projects")
                    .select("id, title, media_type, status, priority, asset_count, deadline, completed_at, created_at")
                    .eq("assigned_to", user.userId)
                    .gte("created_at", from.toISOString())
                    .lte("created_at", to.toISOString())
                    .order("created_at", { ascending: false }),
            ]);

            setUserBriefs(briefsRes.data || []);
            setUserProjects(projectsRes.data || []);
        } catch (err) {
            console.error("openUserDetail error:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const periodLabels: Record<Period, string> = {
        today: "Hôm nay",
        week: "Tuần này",
        month: "Tháng này",
        year: "Năm nay",
        custom: "Tùy chọn",
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white h-28 rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
                <div className="bg-white h-64 rounded-xl border border-slate-200 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-pink-500" />
                        Báo cáo Media (Ảnh/Video)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Tổng hợp hiệu suất nhân viên quay dựng</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        {(["today", "week", "month", "year", "custom"] as Period[]).map(opt => (
                            <button key={opt} onClick={() => setPeriod(opt)}
                                className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${period === opt ? "bg-white text-pink-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                                {periodLabels[opt]}
                            </button>
                        ))}
                    </div>
                    {period === "custom" && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                            <span className="text-xs text-slate-400">→</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-orange-50 rounded-lg"><FileInput className="w-4 h-4 text-orange-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Tổng Brief</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalBriefs}</p>
                    <p className="text-xs text-slate-400 mt-1">yêu cầu chụp/quay</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg"><ClipboardList className="w-4 h-4 text-blue-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Dự án đang thực hiện</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{activeProjects}</p>
                    <p className="text-xs text-slate-400 mt-1">shooting / editing / review</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Tỷ lệ hoàn thành</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full transition-all ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${Math.min(completionRate, 100)}%` }} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg"><FolderOpen className="w-4 h-4 text-purple-600" /></div>
                        <span className="text-xs font-medium text-slate-500">Media đã upload</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalAssets}</p>
                    <p className="text-xs text-slate-400 mt-1">ảnh & video</p>
                </div>
            </div>

            {/* Project Status Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-pink-500" /> Phân bố trạng thái dự án
                </h3>
                <div className="flex items-end gap-3 h-32">
                    {projectStatusCounts.map(item => {
                        const maxCount = Math.max(...projectStatusCounts.map(i => i.count), 1);
                        const heightPct = (item.count / maxCount) * 100;
                        const label = STATUS_LABELS[item.status]?.label || item.status;
                        const barColor = PROJECT_STATUS_COLORS[item.status] || "bg-slate-300";
                        return (
                            <div key={item.status} className="flex-1 flex flex-col items-center">
                                <span className="text-sm font-bold text-slate-900 mb-1">{item.count}</span>
                                <div className="w-full relative" style={{ height: '80px' }}>
                                    <div className={`absolute bottom-0 w-full rounded-t-md ${barColor} transition-all`}
                                        style={{ height: `${Math.max(heightPct, 4)}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-500 mt-2 text-center leading-tight">{label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Per-User Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-pink-500" /> Hiệu suất theo nhân viên
                    </h3>
                </div>
                {userReports.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Chưa có nhân viên Media nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left border-b border-slate-100">
                                    <th className="p-3 text-xs font-medium text-slate-500">Nhân viên</th>
                                    <th className="p-3 text-xs font-medium text-slate-500 text-center">Brief nhận</th>
                                    <th className="p-3 text-xs font-medium text-slate-500 text-center">Brief xong</th>
                                    <th className="p-3 text-xs font-medium text-slate-500 text-center">Dự án đang làm</th>
                                    <th className="p-3 text-xs font-medium text-slate-500 text-center">Dự án hoàn thành</th>
                                    <th className="p-3 text-xs font-medium text-slate-500 text-center">Media upload</th>
                                    <th className="p-3 text-xs font-medium text-slate-500 text-center">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {userReports.map(u => (
                                    <tr key={u.userId} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">{u.fullName}</td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded">{u.briefsAssigned}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded">{u.briefsCompleted}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">{u.projectsActive}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded">{u.projectsCompleted}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">{u.assetsUploaded}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => openUserDetail(u)}
                                                className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Drill-down Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{selectedUser.fullName}</h2>
                                <p className="text-xs text-slate-500">Chi tiết briefs & dự án trong kỳ</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {/* Briefs */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileInput className="w-4 h-4 text-orange-500" />
                                        Briefs ({userBriefs.length})
                                    </h3>
                                    {userBriefs.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">Không có brief trong kỳ</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {userBriefs.map(b => (
                                                <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{b.title}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                                                            <span>{b.media_type === "photo" ? "📸 Ảnh" : b.media_type === "video" ? "🎬 Video" : "📸🎬 Cả hai"}</span>
                                                            {b.deadline && <span>Deadline: {new Date(b.deadline).toLocaleDateString('vi-VN')}</span>}
                                                            <span>{new Date(b.created_at).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(STATUS_LABELS[b.status] || STATUS_LABELS.pending).color}`}>
                                                            {(STATUS_LABELS[b.status] || STATUS_LABELS.pending).label}
                                                        </span>
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(PRIORITY_LABELS[b.priority] || PRIORITY_LABELS.normal).color}`}>
                                                            {(PRIORITY_LABELS[b.priority] || PRIORITY_LABELS.normal).label}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Projects */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-blue-500" />
                                        Dự án ({userProjects.length})
                                    </h3>
                                    {userProjects.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">Không có dự án trong kỳ</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {userProjects.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                                                            <span>{p.media_type === "photo" ? "📸 Ảnh" : p.media_type === "video" ? "🎬 Video" : "📸🎬 Cả hai"}</span>
                                                            <span>{p.asset_count} files</span>
                                                            {p.deadline && <span>Deadline: {new Date(p.deadline).toLocaleDateString('vi-VN')}</span>}
                                                            {p.completed_at && <span>✅ {new Date(p.completed_at).toLocaleDateString('vi-VN')}</span>}
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-3 ${(STATUS_LABELS[p.status] || STATUS_LABELS.planned).color}`}>
                                                        {(STATUS_LABELS[p.status] || STATUS_LABELS.planned).label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
