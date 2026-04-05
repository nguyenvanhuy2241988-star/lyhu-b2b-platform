"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { FileInput, Clock, CheckCircle, XCircle, Plus, X, Save, Pencil, Trash2, Calendar, FileText, User } from "lucide-react";

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
    assigned_to: "",
};

export default function AdminMediaBriefsPage() {
    const supabase = createClient();
    const { user } = useAuth();
    
    const [briefs, setBriefs] = useState<any[]>([]);
    const [mediaUsers, setMediaUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

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
                // Filter only those who might receive media tasks (media_creator or generally anyone for flexible logic)
                const mediaStaff = usersData.filter((u: any) => u.role === 'media_creator' || u.full_name);
                setMediaUsers(mediaStaff);
            }

            // Then load briefs
            let query = supabase
                .from("media_briefs")
                .select("*")
                .order("created_at", { ascending: false });

            if (filter !== "all") {
                query = query.eq("status", filter);
            }

            const { data: briefsData } = await query;
            setBriefs(briefsData || []);
        } catch (err) {
            console.error("loadData error:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase, filter]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const handleOpenEdit = (brief: any) => {
        setEditingId(brief.id);
        const deadlineDate = brief.deadline ? new Date(brief.deadline).toISOString().split('T')[0] : "";
        
        setForm({
            title: brief.title,
            description: brief.description || "",
            media_type: brief.media_type,
            priority: brief.priority,
            deadline: deadlineDate,
            requested_department: brief.requested_department || "",
            status: brief.status,
            assigned_to: brief.assigned_to || "",
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { alert("Vui lòng nhập tên công việc / dự án!"); return; }
        if (!form.assigned_to) { alert("Vui lòng chọn nhân viên phụ trách!"); return; }

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
                assigned_to: form.assigned_to,
                created_by: user?.id,
            };

            if (editingId) {
                // Update
                const { error } = await supabase.from("media_briefs").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingId);
                if (error) throw error;
            } else {
                // Insert
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

    const getUserName = (id: string) => {
        const u = mediaUsers.find(user => user.id === id);
        return u ? u.full_name : "Chưa phân công";
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

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm border-b-4 border-b-amber-500">
                    <p className="text-xs text-amber-600 font-bold uppercase mb-1">Mới Giao</p>
                    <p className="text-2xl font-black text-slate-800">{briefs.filter(b => b.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm border-b-4 border-b-blue-500">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Đang Thực Hiện</p>
                    <p className="text-2xl font-black text-slate-800">{briefs.filter(b => b.status === 'in_progress').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm border-b-4 border-b-green-500">
                    <p className="text-xs text-green-600 font-bold uppercase mb-1">Đã Hoàn Thành</p>
                    <p className="text-2xl font-black text-slate-800">{briefs.filter(b => b.status === 'completed').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm border-b-4 border-b-red-500">
                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Cần Xử Lý Gấp</p>
                    <p className="text-2xl font-black text-slate-800">{briefs.filter(b => b.priority === 'urgent' && b.status !== 'completed').length}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {[{ key: "all", label: "Tất cả" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(opt => (
                    <button key={opt.key} onClick={() => setFilter(opt.key)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors border ${filter === opt.key ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        {opt.label}
                    </button>
                ))}
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
                    <p className="text-base text-slate-600 font-bold">Chưa có Kế hoạch & Brief nào được giao!</p>
                    <p className="text-sm text-slate-400 mt-1 mb-4">Mọi công việc bạn gắn cho nhân sự sẽ hiển thị trực tiếp ở máy của họ.</p>
                    <button onClick={handleOpenAdd}
                        className="text-sm text-pink-600 hover:text-pink-700 font-bold underline underline-offset-4">
                        Bắt đầu giao việc đầu tiên
                    </button>
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
                                        {/* Quick Actions (Admin Only) */}
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEdit(brief)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(brief.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-slate-900 text-[15px] mb-2 leading-snug">{brief.title}</h3>
                                    
                                    {brief.description && (
                                        <p className="text-xs text-slate-500 line-clamp-3 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
                                            {brief.description}
                                        </p>
                                    )}

                                    <div className="space-y-2 mt-auto pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                <User className="w-3.5 h-3.5 text-slate-400" /> Phụ trách:
                                            </span>
                                            <span className="font-bold text-slate-800">{getUserName(brief.assigned_to)}</span>
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
                                                <FileText className="w-3.5 h-3.5 text-slate-400" /> Nguồn phát:
                                            </span>
                                            <span className="text-slate-600">{brief.requested_department || "Khác"}</span>
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
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Người phụ trách <span className="text-red-500">*</span></label>
                                    <select className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-sm bg-white font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                                        <option value="">-- Chỉ định nhân sự Media --</option>
                                        {mediaUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Thời hạn (Deadline)</label>
                                    <input type="date" className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Mức độ ưu tiên</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                                        value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
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
                                    placeholder={'Ví dụ:\n- Concept ánh sáng: Bright & Airy\n- Yêu cầu thiết bị: Máy quay góc rộng, chân Tripod\n- Lưu ý: Dán kèm Link file Kịch bản Driver nếu dài...'}
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
