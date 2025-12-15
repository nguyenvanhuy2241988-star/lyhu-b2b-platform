import React, { useState } from "react";
import { X, Phone, Clock, FileText, CheckCircle2 } from "lucide-react";
import { CallLog } from "@/lib/telesalesTasksStore";

interface LogCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: Omit<CallLog, "id" | "taskId" | "timestamp">) => void;
    taskTitle: string;
    customerName: string;
}

export const LogCallModal = ({ isOpen, onClose, onSave, taskTitle, customerName }: LogCallModalProps) => {
    const [result, setResult] = useState<CallLog['result']>('connected');
    const [duration, setDuration] = useState<number>(0);
    const [note, setNote] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            result,
            durationSeconds: duration,
            note
        });
        onClose();
        // Reset form
        setResult('connected');
        setDuration(0);
        setNote("");
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Ghi kết quả cuộc gọi</h3>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{customerName} - {taskTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Result */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Kết quả cuộc gọi <span className="text-red-500">*</span></label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={result}
                            onChange={(e) => setResult(e.target.value as any)}
                        >
                            <option value="connected">Nghe máy (Connected)</option>
                            <option value="no_answer">Không nghe máy (No Answer)</option>
                            <option value="busy">Máy bận (Busy)</option>
                            <option value="wrong_number">Sai số (Wrong Number)</option>
                            <option value="other">Khác (Other)</option>
                        </select>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Thời lượng (giây)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                min="0"
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="0"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <textarea
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px]"
                                placeholder="Nhập ghi chú chi tiết..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow flex items-center gap-2 transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Lưu kết quả
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
