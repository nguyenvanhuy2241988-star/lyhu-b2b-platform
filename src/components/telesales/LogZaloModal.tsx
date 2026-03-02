"use client";

import React, { useState } from "react";
import { X, MessageCircle, Save } from "lucide-react";

interface LogZaloModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        description?: string;
    }) => void;
    customerName?: string;
    customerPhone?: string;
}

export const LogZaloModal = ({
    isOpen,
    onClose,
    onSave,
    customerName = "Khách hàng",
    customerPhone = "",
}: LogZaloModalProps) => {
    const [description, setDescription] = useState("");

    const handleSave = () => {
        onSave({
            description: description.trim(),
        });
        setDescription("");
    };

    const handleClose = () => {
        setDescription("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-blue-50">
                    <div className="p-2 bg-blue-100 rounded-full">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Ghi nhận nhắn Zalo</h3>
                        <p className="text-sm text-slate-500">{customerName}{customerPhone ? ` • ${customerPhone}` : ''}</p>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Info note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        💬 Nhắn tin Zalo chỉ để theo dõi, <strong>không tính vào KPI lương</strong>.
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <MessageCircle className="w-4 h-4 inline mr-1" />
                            Ghi chú (tùy chọn)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                            placeholder="VD: Đã nhắn Zalo gửi bảng giá, chờ KH phản hồi..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};
