"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
    TaskStatus,
    TaskPriority,
    TASK_STATUS_LABELS,
    TelesalesTask,
    TelesalesColumn
} from "@/lib/telesalesTasksStore";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    initialStatus?: TaskStatus;
    initialData?: Partial<TelesalesTask>;
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
}

export const CreateTaskModal = ({ isOpen, onClose, onSave, initialStatus = "today", initialData = {}, columns = [] }: CreateTaskModalProps) => {
    const [formData, setFormData] = useState<TaskFormData>({
        title: "",
        customerName: "",
        phone: "",
        priority: "normal",
        dueDate: new Date().toISOString().split('T')[0],
        status: initialStatus,
        description: ""
    });

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData.title || "",
                customerName: initialData.customerName || "",
                phone: initialData.phone || "",
                priority: initialData.priority || "normal",
                dueDate: initialData.dueDate || new Date().toISOString().split('T')[0],
                status: initialStatus,
                description: initialData.description || ""
            });
        }
    }, [isOpen, initialStatus, initialData.title, initialData.customerName, initialData.phone, initialData.priority, initialData.dueDate, initialData.description]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            type: initialData.type || "other",
            relatedLeadId: initialData.relatedLeadId,
            relatedOrderId: initialData.relatedOrderId
        });
        onClose();
    };

    // Use passed columns if available (dynamic), otherwise fallback to static labels (legacy/safety)
    // Actually, we should preferably just use columns to support dynamic naming.
    // If columns is empty (shouldn't happy in normal flow if passed from page), we might fallback or just show empty.

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-lg text-slate-900">Thêm việc cần làm</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ví dụ: Gọi lại anh Hùng"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nguyễn Văn A"
                                value={formData.customerName}
                                onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="09xxx"
                                value={formData.phone}
                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
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
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
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
                                    // Fallback for cases where columns might not be loaded yet or passed (e.g. from Leads Queue)
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
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={formData.dueDate}
                            onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
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

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                        >
                            Lưu công việc
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
