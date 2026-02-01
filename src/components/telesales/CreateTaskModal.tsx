"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Phone, UserPlus, CheckCircle, AlertTriangle, Trash2, Eye, Download } from "lucide-react";
import {
    TaskStatus,
    TaskPriority,
    TASK_STATUS_LABELS,
    TelesalesTask,
    TelesalesColumn,
    TaskType
} from "@/lib/telesalesTasksStore";
import { supabase } from "@/lib/supabaseClient";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    onDelete?: (taskId: string) => void; // New: Delete handler
    initialStatus?: TaskStatus;
    initialData?: Partial<TelesalesTask>; // New: Pre-fill data
    columns?: TelesalesColumn[]; // Support dynamic columns
}

interface TaskFormData {
    title: string;
    customerName: string;
    phone: string;
    priority: TaskPriority;
    dueDate: string;
    status: TaskStatus;
    description: string;
    assigneeIds: string[];
    leaderId: string;
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export const CreateTaskModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialStatus = "today",
    initialData,
    columns = []
}: CreateTaskModalProps) => {
    const isEditMode = !!initialData?.id;

    const [formData, setFormData] = useState<TaskFormData>({
        title: "",
        customerName: "",
        phone: "",
        priority: "normal",
        dueDate: new Date().toISOString().split('T')[0],
        status: initialStatus,
        description: "",
        assigneeIds: initialData?.assignee_ids || [],
        leaderId: initialData?.leader_id || ""
    });

    const [profiles, setProfiles] = useState<Profile[]>([]);

    const [showContactFields, setShowContactFields] = useState(false); // Collapsible contact

    const taskType: TaskType = 'task'; // Phase 3: Always 'task', removed type selector

    const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);
    const [isUploading, setIsUploading] = useState(false);

    // Load profiles
    useEffect(() => {
        const loadProfiles = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
            if (data) setProfiles(data);
        };
        loadProfiles();
    }, []);

    // Reset form when opening or when Task ID changes (Switching tasks)
    // [REDEPLOY TRIGGER] Ensuring latest logic is active
    // IMPORTANT: Do NOT depend on the entire 'initialData' object, as Realtime updates create new references 
    // and would overwrite user input while typing. Only reset when the Task ID actually changes.
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || "",
                customerName: initialData?.customer_name || "",
                phone: initialData?.phone || "",
                priority: initialData?.priority || "normal",
                dueDate: initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : "",
                status: initialStatus,
                description: initialData?.note || "",
                assigneeIds: initialData?.assignee_ids || [],
                leaderId: initialData?.leader_id || ""
            });
            setAttachments(initialData?.attachments || []);
        }
    }, [isOpen, initialStatus, initialData?.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { data, error } = await supabase.storage
                .from('task_attachments')
                .upload(filePath, file);

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('task_attachments')
                .getPublicUrl(filePath);

            const newAttachment = {
                name: file.name,
                url: publicUrlData.publicUrl,
                type: file.type,
                size: file.size
            };

            setAttachments(prev => [...prev, newAttachment]);
        } catch (error: any) {
            alert(`Lỗi upload: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDownload = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download error:", error);
            window.open(url, '_blank'); // Fallback
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialData?.id,
            title: formData.title,
            customer_name: formData.customerName,
            phone: formData.phone,
            priority: formData.priority,
            status: formData.status,
            due_date: formData.dueDate || null,
            note: formData.description,
            assignee_ids: formData.assigneeIds,
            leader_id: formData.leaderId || null,
            type: taskType,
            attachments: attachments // Pass attachments
        });
        onClose();
    };

    const handleDelete = () => {
        if (isEditMode && onDelete && initialData?.id) {
            if (window.confirm("Bạn có chắc muốn xóa việc này không? Hành động này không thể hoàn tác.")) {
                onDelete(initialData.id);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="font-semibold text-lg text-slate-900">
                            {isEditMode ? "✏️ Chỉnh sửa" : "➕ Thêm mới"}
                        </h3>
                        {isEditMode && initialData?.title && (
                            <div className="text-sm text-slate-600 truncate max-w-[250px]">
                                {initialData.title}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Type selector removed - Phase 3: Tasks only */}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tiêu đề công việc <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ví dụ: Gọi lại khách A"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    {/* Collapsible Contact Section - Phase B */}
                    <div className="border border-slate-200 rounded-lg p-3">
                        <button
                            type="button"
                            onClick={() => setShowContactFields(!showContactFields)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <span className="text-sm font-medium text-slate-700">
                                👤 Thông tin liên hệ (tùy chọn)
                            </span>
                            <span className="text-slate-400">
                                {showContactFields ? '▲' : '▼'}
                            </span>
                        </button>

                        {showContactFields && (
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Tên khách..."
                                        value={formData.customerName}
                                        onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SĐT</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="09xxx"
                                        value={formData.phone}
                                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.priority}
                                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                            >
                                <option value="low">Thấp</option>
                                <option value="normal">Bình thường</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cột trạng thái</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.status}
                                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                            >
                                {columns.length > 0 ? (
                                    columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.label}</option>
                                    ))
                                ) : (
                                    Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hạn hoàn thành</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700"
                            value={formData.dueDate}
                            onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                        {!formData.dueDate && !initialData?.id && (
                            <p className="text-xs text-orange-500 mt-1">Không chọn ngày sẽ tự động vào "Hộp thư đến".</p>
                        )}
                    </div>

                    {/* Roles Assignment */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Người phối hợp thực hiện</label>
                            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-lg bg-slate-50 min-h-[40px]">
                                {formData.assigneeIds.map(id => {
                                    const p = profiles.find(prof => prof.id === id);
                                    return (
                                        <span key={id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
                                            {p?.full_name || p?.email || id}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, assigneeIds: prev.assigneeIds.filter(aid => aid !== id) }))}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                                {formData.assigneeIds.length === 0 && (
                                    <span className="text-xs text-slate-400 italic self-center">Chưa chọn ai...</span>
                                )}
                            </div>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                value=""
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val && !formData.assigneeIds.includes(val)) {
                                        setFormData(prev => ({ ...prev, assigneeIds: [...prev.assigneeIds, val] }));
                                    }
                                }}
                            >
                                <option value="">+ Thêm người tham gia...</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trưởng nhóm (Lead)</label>
                            <select
                                className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.leaderId}
                                onChange={e => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
                            >
                                <option value="">-- Không có --</option>
                                {profiles.filter(p => formData.assigneeIds.includes(p.id)).map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700">Ghi chú & Đính kèm</label>
                            <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                                {isUploading ? 'Đang tải...' : (
                                    <>
                                        <span>+ Thêm file/ảnh</span>
                                        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                                    </>
                                )}
                            </label>
                        </div>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                            placeholder="Ghi chú thêm..."
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />

                        {/* Attachments List */}
                        {attachments.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {/* Thumbnail / Icon */}
                                            <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                                                {file.type?.startsWith('image/') ? (
                                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-500">FILE</span>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</p>
                                                <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Xem"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(file.url, file.name)}
                                                className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Tải xuống"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(idx)}
                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        {/* Delete Button (Left aligned) */}
                        <div>
                            {isEditMode && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2 transition-colors"
                                    title="Xóa công việc này"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Xóa</span>
                                </button>
                            )}
                        </div>

                        {/* Action Buttons (Right aligned) */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSave({
                                            id: initialData?.id,
                                            title: formData.title,
                                            customer_name: formData.customerName,
                                            phone: formData.phone,
                                            priority: formData.priority,
                                            due_date: formData.dueDate || null,
                                            note: formData.description,
                                            status: 'done' as TaskStatus,  // Set to done
                                            assignee_ids: formData.assigneeIds,
                                            leader_id: formData.leaderId || null,
                                            attachments: attachments
                                        });
                                        onClose();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Hoàn thành
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                            >
                                {isEditMode ? "Lưu thay đổi" : "Lưu công việc"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
