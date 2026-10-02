import React from "react";
import { Sparkles, Wand2, X, Check, ArrowRight, RotateCcw, Clapperboard, Film, ShieldCheck } from "lucide-react";
import { VideoClip } from "../../types";
import { AutoEditResult } from "../../lib/autoEditService";

interface AutoEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    progressStep: string;
    progressPercent: number;
    result: AutoEditResult | null;
    originalClips: VideoClip[];
    onApply: () => void;
    onRevert: () => void;
    canRevert: boolean;
}

export const AutoEditModal: React.FC<AutoEditModalProps> = ({
    isOpen,
    onClose,
    isLoading,
    progressStep,
    progressPercent,
    result,
    originalClips,
    onApply,
    onRevert,
    canRevert
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>AI Đạo Diễn Cắt Dựng Thông Minh</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                                    Gemini Multimodal
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                Tự động xem ảnh & video thô, đối chiếu kịch bản và sắp xếp timeline cuốn hút
                            </p>
                        </div>
                    </div>

                    {!isLoading && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="py-8 px-4 text-center space-y-5">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-primary-200 animate-ping opacity-25" />
                                <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin flex items-center justify-center">
                                    <Clapperboard className="w-6 h-6 text-primary-600 animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-800">
                                    {progressStep || "Đang phân tích dữ liệu thị giác..."}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    AI đang xem từng khung hình của {originalClips.length} cảnh quay và đọc lời thoại để tìm góc quay vàng (Hook) và thứ tự liền mạch.
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                <div
                                    className="bg-primary-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                                />
                            </div>
                            <span className="text-[11px] font-mono text-primary-700 font-bold">
                                {progressPercent}%
                            </span>
                        </div>
                    )}

                    {/* Result State */}
                    {!isLoading && result && (
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="p-3.5 rounded-xl bg-primary-50/80 border border-primary-200 text-slate-800 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800">
                                    <Wand2 className="w-4 h-4 text-primary-600" />
                                    <span>Tư Duy Dựng Của Đạo Diễn AI:</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {result.summary}
                                </p>
                                {result.suggestedPacing && (
                                    <div className="pt-1 flex items-center gap-2 text-[11px] text-primary-700 font-semibold">
                                        <span>⚡ Đề xuất nhịp đổi góc quay:</span>
                                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-primary-200">
                                            {result.suggestedPacing}s / cảnh
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Reordered Sequence Preview */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800">
                                        Thứ tự cảnh quay đề xuất mới ({result.orderedClips.length} cảnh):
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        Cảnh #1 đã được chọn làm Hook mở màn
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {result.orderedClips.map((c, idx) => {
                                        const note = result.directorNotes.find(n => n.clipId === c.id);
                                        const isHook = idx === 0;
                                        return (
                                            <div
                                                key={c.id}
                                                className={`p-2 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                                                    isHook
                                                        ? "bg-amber-50/80 border-amber-300 shadow-sm"
                                                        : "bg-white border-slate-200"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                        isHook
                                                            ? "bg-amber-500 text-white"
                                                            : "bg-slate-100 text-slate-700 border border-slate-200"
                                                    }`}>
                                                        #{idx + 1}
                                                    </span>

                                                    <div className="w-12 h-9 rounded overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                                                        {c.mediaType === "image" ? (
                                                            <img src={c.url} alt={c.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <video src={c.url} muted className="w-full h-full object-cover" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                                                                {c.name}
                                                            </p>
                                                            {c.mediaType === "image" ? (
                                                                <span className="text-[9px] px-1 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                                                                    Ảnh
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                                                    Video
                                                                </span>
                                                            )}
                                                        </div>
                                                        {note && (
                                                            <p className="text-[10px] text-slate-500 truncate max-w-[240px] sm:max-w-sm">
                                                                <span className="font-semibold text-primary-700">{note.role}:</span> {note.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {isHook && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
                                                        🎯 Hook 3s đầu
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50">
                    <div>
                        {canRevert && (
                            <button
                                type="button"
                                onClick={onRevert}
                                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Hoàn tác thứ tự cũ</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Đóng
                        </button>
                        {!isLoading && result && (
                            <button
                                type="button"
                                onClick={onApply}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>Áp Dụng Vào Timeline Ngay</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
