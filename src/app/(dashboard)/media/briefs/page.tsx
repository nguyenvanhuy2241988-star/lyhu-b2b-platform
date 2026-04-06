"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { FileInput, Clock, CheckCircle, XCircle, User, Calendar, FileText, Search, Filter } from "lucide-react";

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
    const [mediaUsers, setMediaUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters and Search
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: usersData } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .order("full_name");
            
            if (usersData) {
                setMediaUsers(usersData);
            }

            let query = supabase
                .from("media_briefs")
                .select("*")
                .or(`assigned_to.eq.${user.id},assignees.cs.{${user.id}},created_by.eq.${user.id}`)
                .order("deadline", { ascending: true, nullsFirst: false })
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq("status", filterStatus);
            }
            if (dateFrom) {
                query = query.gte("created_at", new Date(dateFrom).toISOString());
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setDate(toDate.getDate() + 1);
                query = query.lt("created_at", toDate.toISOString());
            }

            const { data: briefsData } = await query;
            
            let filtered = briefsData || [];
            if (searchQuery.trim()) {
                const term = searchQuery.toLowerCase();
                filtered = filtered.filter((b: any) => 
                    b.title.toLowerCase().includes(term) || 
                    (b.description && b.description.toLowerCase().includes(term))
                );
            }

            setBriefs(filtered);
        } catch (err) {
            console.error("loadData error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase, filterStatus, searchQuery, dateFrom, dateTo]);

    useEffect(() => { loadData(); }, [loadData]);

    const updateStatus = async (id: string, newStatus: string) => {
        await supabase.from("media_briefs").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
        loadData();
    };

    const getAssigneeNames = (assigneeIds: string[], fallbackId: string) => {
        let ids = assigneeIds && assigneeIds.length > 0 ? assigneeIds : fallbackId ? [fallbackId] : [];
        if (ids.length === 0) return "Chưa phân công";
        
        return ids.map(id => {
            const u = mediaUsers.find(mu => mu.id === id);
            return u ? u.full_name : "Ẩn danh";
        }).join(", ");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Brief / Yêu cầu</h1>
                    <p className="text-sm text-slate-500 mt-1">Các yêu cầu chụp ảnh, quay video từ phòng ban</p>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tìm kiếm từ khóa</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Tên dự án, nội dung brief..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-36">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Từ ngày</label>
                            <input type="date"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                                value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 md:w-36">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Đến ngày</label>
                            <input type="date"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                                value={dateTo} onChange={e => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mr-2 text-slate-400">
                        <Filter className="w-4 h-4" /> <span className="text-[11px] font-bold uppercase tracking-wider">Trạng thái:</span>
                    </div>
                    {[{ key: "all", label: "Tất cả" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(opt => (
                        <button key={opt.key} onClick={() => setFilterStatus(opt.key)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors border ${filterStatus === opt.key ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-32 rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : briefs.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <p className="text-base text-slate-600 font-bold">Không tìm thấy Kế hoạch / Brief nào!</p>
                    <p className="text-sm text-slate-400 mt-1 mb-4">Bạn có thể thay đổi bộ lọc thời gian hoặc chờ Admin giao task.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {briefs.map((brief: any) => {
                        const status = STATUS_CONFIG[brief.status] || STATUS_CONFIG.pending;
                        const priority = PRIORITY_CONFIG[brief.priority] || PRIORITY_CONFIG.normal;
                        const StatusIcon = status.icon;
                        
                        return (
                            <div key={brief.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${status.color.split(' ')[0]}`} />
                                <div className="pl-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${priority.color}`}>{priority.label}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                {MEDIA_TYPE_LABELS[brief.media_type] || brief.media_type}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-slate-900 text-[15px] mb-2 leading-snug">{brief.title}</h3>
                                    
                                    {brief.description && (
                                        <p className="text-xs text-slate-500 line-clamp-3 mb-4 bg-slate-50 p-2 text-justify rounded border border-slate-100">
                                            {brief.description}
                                        </p>
                                    )}

                                    <div className="space-y-2 mt-auto pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                <User className="w-3.5 h-3.5 text-slate-400" /> Phụ trách:
                                            </span>
                                            <span className="font-bold text-teal-700 max-w-[140px] truncate" title={getAssigneeNames(brief.assignees, brief.assigned_to)}>
                                                {getAssigneeNames(brief.assignees, brief.assigned_to)}
                                            </span>
                                        </div>
                                        
                                        {brief.deadline && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Hạn chót:
                                                </span>
                                                <span className="font-bold text-pink-700">{new Date(brief.deadline).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" /> Ngày phát lệnh:
                                            </span>
                                            <span className="text-slate-600">{new Date(brief.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                            <div className={`flex items-center gap-1.5 text-xs font-bold ${status.color.split(' ')[1]}`}>
                                                <StatusIcon className="w-4 h-4" /> {status.label}
                                            </div>
                                            <select
                                                value={brief.status}
                                                onChange={(e) => updateStatus(brief.id, e.target.value)}
                                                className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 border-none cursor-pointer outline-none hover:bg-slate-200 transition-colors"
                                            >
                                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                                    <option key={k} value={k}>Đổi thẻ: {v.label}</option>
                                                ))}
                                            </select>
                                        </div>
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
