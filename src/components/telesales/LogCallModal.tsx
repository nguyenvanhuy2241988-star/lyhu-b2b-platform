"use client";

import React, { useState } from "react";
import { X, Phone, Clock, MessageSquare, Save } from "lucide-react";
import { CallResult, CALL_RESULT_LABELS } from "@/lib/crmDealsStore";

interface LogCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        call_result?: CallResult;
        call_duration_seconds?: number;
        description?: string;
        // For backward compatibility
        result?: string;
        duration?: number;
        note?: string;
    }) => void;
    customerName?: string;
    customerPhone?: string;
    // Alias for tasks page compatibility
    taskTitle?: string;
}

export const LogCallModal = ({
    isOpen,
    onClose,
    onSave,
    customerName = "Khách hàng",
    customerPhone = "",
    taskTitle = ""
}: LogCallModalProps) => {
    const [callResult, setCallResult] = useState<CallResult>("answered");
    const [durationMinutes, setDurationMinutes] = useState(5);
    const [description, setDescription] = useState("");

    // Use taskTitle as fallback for customerName display
    const displayName = customerName || taskTitle || "Khách hàng";

    const handleSave = () => {
        onSave({
            // New CRM format
            call_result: callResult,
            call_duration_seconds: durationMinutes * 60,
            description: description.trim(),
            // Old tasks format (for backward compatibility)
            result: CALL_RESULT_LABELS[callResult],
            duration: durationMinutes,
            note: description.trim()
        });
        // Reset form
        setCallResult("answered");
        setDurationMinutes(5);
        setDescription("");
    };

    const handleClose = () => {
        setCallResult("answered");
        setDurationMinutes(5);
        setDescription("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-green-50">
                    <div className="p-2 bg-green-100 rounded-full">
                        <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Ghi nhận cuộc gọi</h3>
                        <p className="text-sm text-slate-500">{displayName}{customerPhone ? ` • ${customerPhone}` : ''}</p>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Call Result */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Kết quả cuộc gọi <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(CALL_RESULT_LABELS) as [CallResult, string][]).map(([value, label]) => (
                                <label
                                    key={value}
                                    className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${callResult === value
                                        ? "border-green-400 bg-green-50 ring-1 ring-green-200"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="callResult"
                                        value={value}
                                        checked={callResult === value}
                                        onChange={() => setCallResult(value)}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-slate-700">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Thời lượng (phút)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <div className="w-16 text-center">
                                <span className="text-lg font-semibold text-slate-900">{durationMinutes}</span>
                                <span className="text-xs text-slate-500 ml-1">phút</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>1 phút</span>
                            <span>60 phút</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            Ghi chú cuộc gọi
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                            placeholder="VD: Khách quan tâm UHi, hẹn gọi lại thứ 2 tuần sau..."
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
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Lưu cuộc gọi
                    </button>
                </div>
            </div>
        </div>
    );
};
