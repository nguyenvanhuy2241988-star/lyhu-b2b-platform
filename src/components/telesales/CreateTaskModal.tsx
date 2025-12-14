"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
    TaskStatus,
    TaskPriority,
    TASK_STATUS_LABELS,
    TelesalesTask
} from "@/lib/telesalesTasksStore";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    initialStatus?: TaskStatus;
    initialData?: Partial<TelesalesTask>;
}

export const CreateTaskModal = ({ isOpen, onClose, onSave, initialStatus = "today", initialData = {} }: CreateTaskModalProps) => {
    const [title, setTitle] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("normal");
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<TaskStatus>(initialStatus);
    const [description, setDescription] = useState("");

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setTitle(initialData.title || "");
            setCustomerName(initialData.customerName || "");
            setPhone(initialData.phone || "");
            setPriority(initialData.priority || "normal");
            setDueDate(initialData.dueDate || new Date().toISOString().split('T')[0]);
            setStatus(initialStatus);
            setDescription(initialData.description || "");
        }
    }, [isOpen, initialStatus, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            customerName,
            phone,
            priority,
            dueDate,
            status,
            description,
            type: initialData.type || "other",
            relatedLeadId: initialData.relatedLeadId,
            relatedOrderId: initialData.relatedOrderId
        });
        onClose();
    };

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
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nguyễn Văn A"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="09xxx"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={priority}
                                onChange={e => setPriority(e.target.value as TaskPriority)}
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
                                value={status}
                                onChange={e => setStatus(e.target.value as TaskStatus)}
                            >
                                {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hạn hoàn thành</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                            placeholder="Ghi chú thêm..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
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
