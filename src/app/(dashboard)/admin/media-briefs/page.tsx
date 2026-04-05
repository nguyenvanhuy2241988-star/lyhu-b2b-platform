"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { FileInput, Clock, CheckCircle, XCircle, Plus, X, Save, Pencil, Trash2, Calendar, FileText, User, Search, Filter } from "lucide-react";

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

const DEPARTMENTS = [
    "Ban Giám Đốc", "Telesales", "Marketing", "R&D", "Khác"
];

const EMPTY_FORM = {
    title: "",
    description: "",
    media_type: "video",
    priority: "normal",
    deadline: "",
    requested_department: "Marketing",
    status: "pending",
    assignees: [] as string[],
};

export default function AdminMediaBriefsPage() {
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

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // First load users with media capabilities
            const { data: usersData } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .order("full_name");
            
            if (usersData) {
                const mediaStaff = usersData.filter((u: any) => u.role === 'media_creator' || u.full_name);
                setMediaUsers(mediaStaff);
            }

            // Then load briefs
            let query = supabase
                .from("media_briefs")
                .select("*")
                .order("deadline", { ascending: true, nullsFirst: false }) // Sort by deadline earliest first
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq("status", filterStatus);
            }
            if (dateFrom) {
                query = query.gte("created_at", new Date(dateFrom).toISOString());
            }
            if (dateTo) {
                // Add 1 day to include the end date fully
                const toDate = new Date(dateTo);
                toDate.setDate(toDate.getDate() + 1);
                query = query.lt("created_at", toDate.toISOString());
            }

            const { data: briefsData } = await query;
            
            // Client side search filter
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
    }, [supabase, filterStatus, searchQuery, dateFrom, dateTo]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const handleOpenEdit = (brief: any) => {
        setEditingId(brief.id);
        const deadlineDate = brief.deadline ? new Date(brief.deadline).toISOString().split('T')[0] : "";
        
        let initialAssignees = brief.assignees || [];
        // Migration fallback if old assigned_to still holding value
        if (initialAssignees.length === 0 && brief.assigned_to) {
            initialAssignees = [brief.assigned_to];
        }

        setForm({
            title: brief.title,
            description: brief.description || "",
            media_type: brief.media_type,
            priority: brief.priority,
            deadline: deadlineDate,
            requested_department: brief.requested_department || "",
            status: brief.status,
            assignees: initialAssignees,
        });
        setShowForm(true);
    };

    const handleToggleAssignee = (userId: string) => {
        setForm(prev => {
            const isSelected = prev.assignees.includes(userId);
            return {
                ...prev,
                assignees: isSelected 
                    ? prev.assignees.filter(id => id !== userId)
                    : [...prev.assignees, userId]
            };
        });
    };

    const handleSave = async () => {
        if (!form.title.trim()) { alert("Vui lòng nhập tên công việc / dự án!"); return; }
        if (form.assignees.length === 0) { alert("Vui lòng chọn ít nhất 1 nhân viên phụ trách!"); return; }

        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                media_type: form.media_type,
                priority: form.priority,
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                requested_department: form.requested_department || null,
                status: form.status,
                assignees: form.assignees,
                // Optional: keep assigned_to synced to the first user for backward compatibility
                assigned_to: form.assignees[0] || null,
                created_by: user?.id,
            };

            if (editingId) {
                const { error } = await supabase.from("media_briefs").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("media_briefs").insert(payload);
                if (error) throw error;
            }

            setShowForm(false);
            loadData();
        } catch (err) {
            console.error("Error saving brief:", err);
            alert("Đã xảy ra lỗi khi lưu! Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa Lịch quay / Brief này không?")) return;
        try {
            await supabase.from("media_briefs").delete().eq("id", id);
            loadData();
        } catch (err) {
            console.error("Error deleting brief:", err);
        }
    };

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Tính năng Quản lý Lịch Quay & Brief</h1>
                    <p className="text-sm text-slate-500 mt-1">Lên lịch tác nghiệp, giao nhiệm vụ cho đội ngũ Media</p>
                </div>
                <button onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors w-fit">
                    <Plus className="w-4 h-4" /> Lên lịch quay / Tạo Brief
                </button>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Search */}
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
                    {/* Date Filters */}
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
                
                {/* Status Tabs */}
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

            {/* Briefs List */}
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
                    <p className="text-sm text-slate-400 mt-1 mb-4">Bạn có thể thay đổi bộ lọc thời gian hoặc Tạo mới ngay.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {briefs.map(brief => {
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
                                        <div className="flex bg-slate-50 rounded border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEdit(brief)} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(brief.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
                                                <User className="w-3.5 h-3.5 text-slate-400" /> Nhóm phụ trách:
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

            {/* Modal Lên Lịch / Tạo Brief */}
            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {editingId ? <Pencil className="w-5 h-5 text-pink-600"/> : <Plus className="w-5 h-5 text-pink-600" />}
                                {editingId ? "Cập nhật Yêu cầu / Lịch quay" : "Giao việc / Lên lịch quay mới"}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {/* General */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Tên công việc / Tên chiến dịch <span className="text-red-500">*</span></label>
                                <input className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                                    placeholder="Điền tên ngắn gọn, dễ hiểu..."
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="row-span-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-2">Nhóm phụ trách <span className="text-red-500">*</span></label>
                                    <p className="text-[10px] text-slate-400 mb-2 italic">Có thể chọn nhiều người để làm việc nhóm</p>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
                                        {mediaUsers.map(u => (
                                            <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={form.assignees.includes(u.id)}
                                                    onChange={() => handleToggleAssignee(u.id)}
                                                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">{u.full_name} <span className="text-xs text-slate-400">({u.role})</span></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Thời hạn (Deadline)</label>
                                        <input type="date" className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                            value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Mức độ ưu tiên</label>
                                        <select className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-sm font-medium bg-white"
                                            value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Hình thức</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                                        value={form.media_type} onChange={e => setForm({ ...form, media_type: e.target.value })}>
                                        {Object.entries(MEDIA_TYPE_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Phòng ban đề xuất</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                                        value={form.requested_department} onChange={e => setForm({ ...form, requested_department: e.target.value })}>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Brief Description */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Kịch bản / Nội dung Brief chi tiết</label>
                                <textarea className="w-full py-3 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed" 
                                    rows={5}
                                    placeholder={'Ví dụ:\n- Concept ánh sáng: Bright & Airy\n- Yêu cầu thiết bị: Máy quay góc rộng, chân Tripod\n- Phân đoạn: 3 scene (Intro 5s - Body 10s - Outro 5s)'}
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                                Hủy bỏ
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? "Lưu thay đổi" : "Phát lệnh ngay!"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
