"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { LeadStage, LeadPriority, CRMLead } from "@/lib/crmLeadsStore";

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (lead: Partial<CRMLead>) => void;
    onDelete?: () => void;
    initialStage?: LeadStage;
    initialData?: Partial<CRMLead>;
}

export const CreateLeadModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialStage = "new_data",
    initialData = {}
}: CreateLeadModalProps) => {
    const isEditMode = !!initialData.id;

    const [title, setTitle] = useState(initialData.title || "");
    const [customerName, setCustomerName] = useState(initialData.customer_name || "");
    const [phone, setPhone] = useState(initialData.phone || "");
    const [company, setCompany] = useState(initialData.company || "");
    const [priority, setPriority] = useState<LeadPriority>((initialData.priority as LeadPriority) || "normal");
    const [stage, setStage] = useState<LeadStage>((initialData.stage as LeadStage) || initialStage);
    const [dueDate, setDueDate] = useState(initialData.due_date || new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState(initialData.note || "");

    // Reset form when editing a different lead (only when ID changes)
    useEffect(() => {
        setTitle(initialData.title || "");
        setCustomerName(initialData.customer_name || "");
        setPhone(initialData.phone || "");
        setCompany(initialData.company || "");
        setPriority((initialData.priority as LeadPriority) || "normal");
        setStage((initialData.stage as LeadStage) || initialStage);
        setDueDate(initialData.due_date || new Date().toISOString().split('T')[0]);
        setNote(initialData.note || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData?.id, isOpen]);

    const handleSave = () => {
        if (!title.trim()) {
            alert("Vui lòng nhập tiêu đề lead");
            return;
        }

        const leadData = {
            id: initialData.id,
            title: title.trim(),
            customer_name: customerName.trim() || null,
            phone: phone.trim() || null,
            company: company.trim() || null,
            priority: priority as any || 'normal',
            stage: stage as any || initialStage,
            due_date: dueDate || null,
            note: note.trim() || null,
        };

        onSave(leadData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-slate-900">
                        {isEditMode ? "Sửa Lead" : "Tạo Lead mới"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="VD: Gọi chào hàng NPP ABC"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Anh Nam"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SĐT</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0901234567"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Công ty</label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="VD: Tạp hóa ABC"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="low">Thấp</option>
                                <option value="normal">Bình thường</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hạn hoàn thành</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Ghi chú về lead..."
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-between">
                    <div>
                        {isEditMode && onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Xóa
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

