"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { X, Search, Clock, Save, Paperclip, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface MediaProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUser: any;
    isAdmin?: boolean;
    project?: any | null; // Pass null for create, project object for edit
    defaultStatus?: string; // Tùy chọn trạng thái mặc định khi tạo mới
}

export default function MediaProjectModal({ isOpen, onClose, onSuccess, currentUser, isAdmin, project, defaultStatus }: MediaProjectModalProps) {
    const supabase = createClient();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        media_type: "photo",
        priority: "normal",
        deadline: "",
        brief_id: "",
        assigned_to: currentUser?.id || ""
    });

    const [briefs, setBriefs] = useState<any[]>([]);
    const [mediaUsers, setMediaUsers] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            if (project) {
                setFormData({
                    title: project.title || "",
                    description: project.description || "",
                    media_type: project.media_type || "photo",
                    priority: project.priority || "normal",
                    deadline: project.deadline ? project.deadline.split('T')[0] : "",
                    brief_id: project.brief_id || "",
                    assigned_to: project.assigned_to || currentUser?.id
                });
            } else {
                setFormData({
                    title: "",
                    description: "",
                    media_type: "photo",
                    priority: "normal",
                    deadline: "",
                    brief_id: "",
                    assigned_to: currentUser?.id || ""
                });
            }
        }
    }, [isOpen, project, currentUser]);

    const loadOptions = async () => {
        try {
            // Load briefs (if not admin, only load briefs assigned to me or unassigned)
            let query = supabase.from("media_briefs").select("id, title, status");
            if (!isAdmin) {
                query = query.eq("assigned_to", currentUser.id);
            }
            // Only show pending or in_progress, plus the currently selected brief if editing
            const { data: bData } = await query
                .in("status", ["pending", "in_progress"])
                .order("created_at", { ascending: false });
                
            setBriefs(bData || []);

            // Load media users if admin
            if (isAdmin) {
                const { data: uData } = await supabase.rpc('get_users_activity_stats');
                if (uData) {
                    setMediaUsers(uData.filter((u: any) => u.role === 'media_creator' || u.role === 'admin' || u.role === 'marketing'));
                }
            }
        } catch (err) {
            console.error("Load options error", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showToast("Vui lòng nhập tên dự án", "error");
            return;
        }

        setLoading(true);
        try {
            const savePayload = {
                title: formData.title,
                description: formData.description || null,
                media_type: formData.media_type,
                priority: formData.priority,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
                brief_id: formData.brief_id || null,
                assigned_to: formData.assigned_to || currentUser?.id,
                updated_at: new Date().toISOString()
            };

            if (project?.id) {
                // UPDATE
                const { error } = await supabase
                    .from("media_projects")
                    .update(savePayload)
                    .eq("id", project.id);
                if (error) throw error;
                showToast("Cập nhật dự án thành công!", "success");
            } else {
                // CREATE
                const { error } = await supabase
                    .from("media_projects")
                    .insert({
                        ...savePayload,
                        status: defaultStatus || "planned" // Default status is set via prop or fallback to planned
                    });
                if (error) throw error;
                showToast("Tạo dự án mới thành công!", "success");
            }

            // Sync Brief to in_progress if linked
            if (formData.brief_id) {
                await supabase
                    .from("media_briefs")
                    .update({ status: "in_progress", updated_at: new Date().toISOString() })
                    .eq("id", formData.brief_id)
                    .eq("status", "pending"); // Only update if it was pending
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Save project error", err);
            showToast("Có lỗi xảy ra: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">
                        {project ? "📝 Chỉnh sửa Dự án" : "✨ Tạo Dự án Kế hoạch mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên dự án *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Vd: TVC Giới thiệu Sản phẩm mới, Concept Tết 2026..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả nội dung / Kịch bản</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ghi chú các yêu cầu chi tiết về kịch bản, ánh sáng, góc máy..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Paperclip className="w-4 h-4 text-slate-400" /> Liên kết Brief Yêu cầu
                                </label>
                                <select
                                    value={formData.brief_id}
                                    onChange={e => setFormData({ ...formData, brief_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                >
                                    <option value="">-- Không liên kết (Tự tạo riêng) --</option>
                                    {briefs.map(b => (
                                        <option key={b.id} value={b.id}>
                                            [{b.status === 'in_progress' ? 'Đang chạy' : 'Đang chờ'}] - {b.title}
                                        </option>
                                    ))}
                                    {project?.brief_id && !briefs.find(b => b.id === project.brief_id) && (
                                        <option value={project.brief_id}>(Đang gắn với Brief ẩn)</option>
                                    )}
                                </select>
                            </div>

                            {isAdmin && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <UserIcon className="w-4 h-4 text-slate-400" /> Gán người phụ trách
                                    </label>
                                    <select
                                        value={formData.assigned_to}
                                        onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                    >
                                        <option value="">-- Chưa giao --</option>
                                        {mediaUsers.map(u => (
                                            <option key={u.user_id} value={u.user_id}>
                                                {u.full_name} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại nội dung</label>
                                <select
                                    value={formData.media_type}
                                    onChange={e => setFormData({ ...formData, media_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                >
                                    <option value="photo">Chỉ chụp Ảnh (Photo)</option>
                                    <option value="video">Quay Video</option>
                                    <option value="both">Cả Ảnh và Video</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" /> Deadline Hạn chót
                                </label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mức độ ưu tiên</label>
                                <div className="flex gap-2">
                                    {['low', 'normal', 'high', 'urgent'].map((p) => {
                                        const labels: any = { low: "Thấp", normal: "Bình thường", high: "Cao", urgent: "Gấp!" };
                                        const colors: any = { 
                                            low: "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200", 
                                            normal: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200", 
                                            high: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200", 
                                            urgent: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" 
                                        };
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: p })}
                                                className={`flex-1 py-1.5 border rounded-lg text-xs font-medium transition-all ${
                                                    formData.priority === p ? colors[p] + ' ring-2 ring-offset-1 ring-opacity-50 ' + colors[p].replace('bg-', 'ring-').split(' ')[0] : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {labels[p]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="project-form"
                        disabled={loading}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Đang lưu..." : project ? "Lưu thay đổi" : "Tạo dự án"}
                    </button>
                </div>
            </div>
        </div>
    );
}
