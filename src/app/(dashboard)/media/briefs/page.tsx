"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { FileInput, AlertCircle, Clock, CheckCircle, XCircle, Plus, ChevronDown } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700", icon: Clock },
    in_progress: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-700", icon: FileInput },
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: CheckCircle },
    cancelled: { label: "Đã hủy", color: "bg-slate-100 text-slate-500", icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    urgent: { label: "Gấp", color: "bg-red-100 text-red-700" },
    high: { label: "Cao", color: "bg-orange-100 text-orange-700" },
    normal: { label: "Bình thường", color: "bg-slate-100 text-slate-600" },
    low: { label: "Thấp", color: "bg-slate-50 text-slate-400" },
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
    photo: "📸 Chụp ảnh",
    video: "🎬 Quay video",
    both: "📸🎬 Ảnh + Video",
};

export default function MediaBriefsPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [briefs, setBriefs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const loadBriefs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from("media_briefs")
                .select("*")
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false });

            if (filter !== "all") {
                query = query.eq("status", filter);
            }

            const { data } = await query;
            setBriefs(data || []);
        } catch (err) {
            console.error("loadBriefs error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, filter]);

    useEffect(() => { loadBriefs(); }, [loadBriefs]);

    const updateStatus = async (id: string, newStatus: string) => {
        await supabase.from("media_briefs").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
        loadBriefs();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Brief / Yêu cầu</h1>
                    <p className="text-sm text-slate-500 mt-1">Các yêu cầu chụp ảnh, quay video từ phòng ban</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {[{ key: "all", label: "Tất cả" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(opt => (
                    <button key={opt.key} onClick={() => setFilter(opt.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === opt.key ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Briefs List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-24 rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : briefs.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FileInput className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Chưa có brief nào</p>
                    <p className="text-xs text-slate-400 mt-1">Các phòng ban sẽ gửi yêu cầu chụp/quay tại đây</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {briefs.map(brief => {
                        const status = STATUS_CONFIG[brief.status] || STATUS_CONFIG.pending;
                        const priority = PRIORITY_CONFIG[brief.priority] || PRIORITY_CONFIG.normal;
                        return (
                            <div key={brief.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900 truncate">{brief.title}</h3>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priority.color}`}>{priority.label}</span>
                                        </div>
                                        {brief.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-2">{brief.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span>{MEDIA_TYPE_LABELS[brief.media_type] || brief.media_type}</span>
                                            {brief.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Deadline: {new Date(brief.deadline).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                            {brief.requested_department && (
                                                <span>Phòng: {brief.requested_department}</span>
                                            )}
                                            <span>{new Date(brief.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <select
                                            value={brief.status}
                                            onChange={(e) => updateStatus(brief.id, e.target.value)}
                                            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${status.color}`}
                                        >
                                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
