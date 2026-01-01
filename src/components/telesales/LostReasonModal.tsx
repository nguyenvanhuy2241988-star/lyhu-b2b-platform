"use client";

import React, { useState } from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";

interface LostReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    dealTitle?: string;
}

const LOST_REASONS = [
    { value: "no_contact", label: "Không liên lạc được (gọi nhiều lần không nghe)" },
    { value: "price_high", label: "Khách báo giá cao so với đối thủ" },
    { value: "bought_elsewhere", label: "Khách đã mua nơi khác" },
    { value: "no_need", label: "Không có nhu cầu lúc này" },
    { value: "out_of_stock", label: "Hết hàng / Không có sản phẩm phù hợp" },
    { value: "bad_timing", label: "Không đúng thời điểm (đang bận, hết vốn...)" },
    { value: "competitor", label: "Đối thủ có ưu đãi tốt hơn" },
    { value: "quality_concern", label: "Khách lo ngại chất lượng" },
    { value: "other", label: "Lý do khác" },
];

export const LostReasonModal = ({
    isOpen,
    onClose,
    onConfirm,
    dealTitle = "Cơ hội này"
}: LostReasonModalProps) => {
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const handleConfirm = () => {
        if (!selectedReason) {
            alert("Vui lòng chọn lý do");
            return;
        }

        let finalReason = LOST_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

        if (selectedReason === "other" && customReason.trim()) {
            finalReason = `Lý do khác: ${customReason.trim()}`;
        }

        onConfirm(finalReason);
        setSelectedReason("");
        setCustomReason("");
    };

    const handleClose = () => {
        setSelectedReason("");
        setCustomReason("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-red-50">
                    <div className="p-2 bg-red-100 rounded-full">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Đánh dấu Thua</h3>
                        <p className="text-sm text-slate-500 truncate">{dealTitle}</p>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                            Chọn lý do để phân tích và cải thiện quy trình bán hàng
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Lý do thất bại <span className="text-red-500">*</span>
                    </label>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {LOST_REASONS.map(reason => (
                            <label
                                key={reason.value}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedReason === reason.value
                                        ? "border-red-400 bg-red-50 ring-1 ring-red-200"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="lostReason"
                                    value={reason.value}
                                    checked={selectedReason === reason.value}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-slate-700">{reason.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Custom reason input */}
                    {selectedReason === "other" && (
                        <div className="mt-3">
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Nhập lý do cụ thể..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            />
                        </div>
                    )}
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
                        onClick={handleConfirm}
                        disabled={!selectedReason}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Xác nhận Thua
                    </button>
                </div>
            </div>
        </div>
    );
};
