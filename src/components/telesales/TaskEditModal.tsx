"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, User, Phone, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import {
    TaskStatus,
    TaskPriority,
    TASK_STATUS_LABELS,
    TelesalesTask,
    TelesalesColumn
} from "@/lib/telesalesTasksStore";
import { supabase } from "@/lib/supabaseClient";

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    onDelete?: (taskId: string) => void;
    initialData: TelesalesTask; // Must provide task data for editing
    columns?: TelesalesColumn[];
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export const TaskEditModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    columns = []
}: TaskEditModalProps) => {
    // const supabase = createClient(); // Switched to singleton
    const [profiles, setProfiles] = useState<Profile[]>([]);

    // Form States
    const [formData, setFormData] = useState({
        title: "",
        customerName: "",
        phone: "",
        priority: "normal" as TaskPriority,
        dueDate: "",
        status: "today" as TaskStatus,
        description: "",
        assignedTo: "",
        assigneeIds: [] as string[],
        leaderId: "",
        leadId: "",
        relatedLeadId: ""
    });

    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    useEffect(() => {
        // Load profiles
        let mounted = true;
        const loadProfiles = async () => {
            const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true });
            if (mounted && !error) setProfiles(data || []);
        };
        loadProfiles();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title || "",
                customerName: initialData.customer_name || "",
                phone: initialData.phone || "",
                priority: (initialData.priority as TaskPriority) || "normal",
                dueDate: initialData.due_date ? initialData.due_date.split('T')[0] : "",
                status: (initialData.status as TaskStatus) || 'today',
                description: initialData.note || "",
                assignedTo: initialData.assigned_to || "",
                assigneeIds: initialData.assignee_ids || [],
                leaderId: initialData.leader_id || "",
                leadId: (initialData as any).lead_id || "",
                relatedLeadId: "" // simplified
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: initialData.id,
            due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            assigned_to: formData.assignedTo,
            assignee_ids: formData.assigneeIds,
            leader_id: formData.leaderId,
            customer_name: formData.customerName,
            status: formData.status,
            priority: formData.priority,
            note: formData.description,
            phone: formData.phone
        });
        onClose();
    };

    const handleDelete = () => {
        if (onDelete && initialData.id) {
            if (window.confirm("Bạn có chắc muốn xóa việc này không? Hành động này không thể hoàn tác.")) {
                onDelete(initialData.id);
                onClose();
            }
        }
    };

    const hasLinkedLead = !!formData.leadId || !!formData.relatedLeadId;

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="font-semibold text-lg text-slate-900">Chi tiết công việc</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    {/* Status & Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                value={formData.priority}
                                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                            >
                                <option value="low">Thấp</option>
                                <option value="normal">Bình thường</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hạn hoàn thành</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={formData.dueDate}
                            onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                        {!formData.dueDate && (
                            <p className="text-xs text-slate-500 mt-1 italic">Không đặt hạn (Inbox)</p>
                        )}
                    </div>

                    {/* Assignees Selection */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Người thực hiện (Được chọn nhiều)</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                                {(profiles ?? []).map(p => (
                                    <label key={p.id} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                                            checked={formData.assigneeIds.includes(p.id) || formData.assignedTo === p.id}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => {
                                                    let newIds = [...prev.assigneeIds];
                                                    if (checked) {
                                                        if (!newIds.includes(p.id)) newIds.push(p.id);
                                                    } else {
                                                        newIds = newIds.filter(id => id !== p.id);
                                                    }
                                                    return { ...prev, assigneeIds: newIds };
                                                });
                                            }}
                                        />
                                        <span className="truncate">{p.full_name || p.email}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 font-semibold text-blue-600">Trưởng nhóm (Team Leader)</label>
                            <select
                                className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.leaderId}
                                onChange={e => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
                            >
                                <option value="">-- Không có trưởng nhóm --</option>
                                {(profiles ?? []).filter(p => formData.assigneeIds.includes(p.id) || formData.assignedTo === p.id).map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email} (Trưởng nhóm)</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-500 mt-1 italic">* Trưởng nhóm phải nằm trong danh sách người thực hiện.</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả / Ghi chú</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                            placeholder="Chi tiết công việc..."
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Advanced / Linked Lead Info */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
                        >
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                Thông tin nâng cao (Khách hàng/Lead) {hasLinkedLead && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                            </span>
                            {isAdvancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {isAdvancedOpen && (
                            <div className="p-4 bg-white space-y-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                {hasLinkedLead ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{formData.customerName || "Khách hàng"}</p>
                                                    <p className="text-xs text-blue-600 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {formData.phone || "Không có SĐT"}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Link to Open Lead - Mocked for now or link to dedicated page */}
                                            <button type="button" className="text-xs font-semibold hover:underline flex items-center gap-1">
                                                Mở Lead <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            * Thông tin này được liên kết tự động từ Lead.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={formData.customerName}
                                                onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={formData.phone}
                                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div>
                        {onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
            );
};
