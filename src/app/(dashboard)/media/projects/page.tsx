"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { ClipboardList, Camera, Film, Plus, Clock, CheckCircle, XCircle, Pencil } from "lucide-react";

const STATUS_COLUMNS = [
    { key: "planned", label: "Kế hoạch", color: "bg-slate-500" },
    { key: "shooting", label: "Chụp/Quay", color: "bg-amber-500" },
    { key: "editing", label: "Dựng/Chỉnh", color: "bg-blue-500" },
    { key: "review", label: "Review", color: "bg-purple-500" },
    { key: "completed", label: "Hoàn thành", color: "bg-green-500" },
];

const PRIORITY_BADGES: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    normal: "bg-slate-100 text-slate-600",
    low: "bg-slate-50 text-slate-400",
};

export default function MediaProjectsPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProjects = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from("media_projects")
                .select("*")
                .eq("assigned_to", user.id)
                .neq("status", "cancelled")
                .order("created_at", { ascending: false });
            setProjects(data || []);
        } catch (err) {
            console.error("loadProjects error:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    const updateStatus = async (id: string, newStatus: string) => {
        const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
        if (newStatus === "completed") updates.completed_at = new Date().toISOString();
        await supabase.from("media_projects").update(updates).eq("id", id);
        loadProjects();
    };

    const getColumnProjects = (statusKey: string) => projects.filter(p => p.status === statusKey);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-white rounded-lg animate-pulse" />
                <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Dự án</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý tiến độ dự án theo Kanban</p>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUS_COLUMNS.map(col => {
                    const colProjects = getColumnProjects(col.key);
                    return (
                        <div key={col.key} className="min-w-[260px] flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                                <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                                <span className="text-xs text-slate-400 ml-auto">{colProjects.length}</span>
                            </div>
                            <div className="space-y-2.5 min-h-[200px]">
                                {colProjects.map(project => (
                                    <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{project.title}</h4>
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${PRIORITY_BADGES[project.priority] || PRIORITY_BADGES.normal}`}>
                                                {project.priority === "urgent" ? "Gấp" : project.priority === "high" ? "Cao" : ""}
                                            </span>
                                        </div>
                                        {project.description && (
                                            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{project.description}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                {project.media_type === "video" ? <Film className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                                                <span>{project.media_type === "photo" ? "Ảnh" : project.media_type === "video" ? "Video" : "Ảnh+Video"}</span>
                                                {project.asset_count > 0 && <span>· {project.asset_count} files</span>}
                                            </div>
                                            {project.deadline && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(project.deadline).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                        {/* Status Update Buttons */}
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-1">
                                            {STATUS_COLUMNS.filter(s => s.key !== col.key).slice(0, 2).map(nextCol => (
                                                <button key={nextCol.key} onClick={() => updateStatus(project.id, nextCol.key)}
                                                    className="flex-1 text-[10px] py-1 px-2 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors truncate">
                                                    → {nextCol.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {colProjects.length === 0 && (
                                    <div className="flex items-center justify-center h-32 text-xs text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                                        Trống
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
