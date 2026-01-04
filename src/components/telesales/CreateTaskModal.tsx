"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Phone, UserPlus, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
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

    // Load profiles
    useEffect(() => {
        const loadProfiles = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
            if (data) setProfiles(data);
        };
        loadProfiles();
    }, []);

    // Reset form when opening
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

            // Phase 3: Type is always 'task', removed inference logic
        }
    }, [isOpen, initialStatus, initialData]);

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
            leader_id: formData.leaderId,
            type: taskType,
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
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg text-slate-900">
                            {isEditMode ? "✏️ Chỉnh sửa" : "➕ Thêm mới"}
                        </h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {isEditMode && initialData?.title && (
                        <div className="text-sm text-slate-600">
                            <span className="font-medium">{initialData.title}</span>
                        </div>
                    )}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                            placeholder="Ghi chú thêm..."
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
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
                                            type: taskType,
                                            status: 'done' as TaskStatus  // Set to done
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
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
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
