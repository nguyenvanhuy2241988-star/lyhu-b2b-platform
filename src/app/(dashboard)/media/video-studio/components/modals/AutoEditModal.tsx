import React, { useState } from "react";
import { Sparkles, Wand2, X, Check, RotateCcw, Clapperboard, Film, Scissors, Clock, MessageSquare, Layers } from "lucide-react";
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
    onApplyCurated: () => void;
    onApplyAll: () => void;
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
    onApplyCurated,
    onApplyAll,
    onRevert,
    canRevert
}) => {
    const [activeTab, setActiveTab] = useState<"curated" | "backup">("curated");

    if (!isOpen) return null;

    const curatedCount = result?.curatedClips?.length || 0;
    const backupCount = result?.backupClips?.length || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>AI Đạo Diễn Cắt Dựng Điện Ảnh</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                                    Trim In-Point & Story Sync
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                Bắt đúng khoảnh khắc đắt giá (Trim), lọc bỏ cảnh thừa, đồng bộ timecode theo từng câu thoại
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
                        <div className="py-10 px-4 text-center space-y-5">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-primary-200 animate-ping opacity-25" />
                                <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin flex items-center justify-center">
                                    <Clapperboard className="w-6 h-6 text-primary-600 animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-800">
                                    {progressStep || "Đang phân tích đa khung hình thị giác..."}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    AI đang quét đầu - giữa - cuối của {originalClips.length} cảnh quay, tìm đoạn rung lắc để cắt bỏ, và ghép vào từng câu kịch bản.
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
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary-50/90 via-teal-50/70 to-emerald-50/80 border border-primary-200/80 text-slate-800 space-y-2 shadow-xs">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary-900">
                                    <Wand2 className="w-4 h-4 text-primary-600" />
                                    <span>Tư Duy Cắt Dựng Của Đạo Diễn AI:</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {result.summary}
                                </p>
                                <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Scissors className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Tự động đặt In-point (Bỏ rung đầu)</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                                        <span>Đồng bộ nhịp từng câu nói</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Layers className="w-3.5 h-3.5 text-sky-600" />
                                        <span>Đã chọn lọc {curatedCount} cảnh tinh hoa</span>
                                    </span>
                                </div>
                            </div>

                            {/* View Tabs if there are backup clips */}
                            {backupCount > 0 && (
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("curated")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                            activeTab === "curated"
                                                ? "bg-primary-500 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        <span>🎬 Cảnh Dựng Tinh Hoa (A-Roll)</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                            activeTab === "curated" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                                        }`}>
                                            {curatedCount}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("backup")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                            activeTab === "backup"
                                                ? "bg-primary-500 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        <span>📦 Kho Dự Phòng (B-Roll)</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                            activeTab === "backup" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                                        }`}>
                                            {backupCount}
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Clips List */}
                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {(activeTab === "curated" ? result.curatedClips : result.backupClips).map((c, idx) => {
                                    const note = result.directorNotes.find(n => n.clipId === c.id);
                                    const isHook = activeTab === "curated" && idx === 0;

                                    return (
                                        <div
                                            key={c.id}
                                            className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                                                isHook
                                                    ? "bg-amber-50/70 border-amber-300 shadow-xs"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <span className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                                        isHook
                                                            ? "bg-amber-500 text-white"
                                                            : "bg-slate-100 text-slate-700 border border-slate-200"
                                                    }`}>
                                                        #{idx + 1}
                                                    </span>

                                                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 relative group">
                                                        {c.mediaType === "image" ? (
                                                            <img src={c.url} alt={c.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <video src={c.url} muted className="w-full h-full object-cover" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="font-bold text-slate-900 text-xs truncate max-w-xs">
                                                                {c.name}
                                                            </p>
                                                            {c.role && (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 shrink-0">
                                                                    {c.role}
                                                                </span>
                                                            )}
                                                            {isHook && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                                                                    🎯 Hook 3s đầu
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Timing Badges: Trim In-Point & Allocated Duration */}
                                                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                                                            {typeof c.trimStart === "number" && c.trimStart > 0 ? (
                                                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                                                                    <Scissors className="w-3 h-3 text-emerald-600" />
                                                                    <span>Bắt đầu từ: {c.trimStart.toFixed(1)}s (Bỏ rung đầu)</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    Bắt đầu từ: 0.0s
                                                                </span>
                                                            )}

                                                            <span className="text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 font-semibold flex items-center gap-1">
                                                                <Clock className="w-3 h-3 text-primary-600" />
                                                                <span>Chiếu: {(c.displayDuration || 2.5).toFixed(1)}s</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Matched Dialogue Sentence */}
                                            {c.matchedSentence && (
                                                <div className="text-[11px] text-slate-700 bg-slate-50/80 p-2 rounded-lg border-l-2 border-primary-400 italic">
                                                    🗣️ <span className="font-semibold text-slate-800">Khớp câu thoại:</span> "{c.matchedSentence}"
                                                </div>
                                            )}

                                            {/* Director Note */}
                                            {note?.reason && (
                                                <p className="text-[10px] text-slate-500 leading-tight">
                                                    💡 <span className="font-semibold text-slate-600">Đạo diễn:</span> {note.reason}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50">
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

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Đóng
                        </button>

                        {!isLoading && result && (
                            <>
                                {backupCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={onApplyAll}
                                        className="px-3.5 py-1.5 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 text-xs font-semibold transition-colors cursor-pointer"
                                        title="Áp dụng toàn bộ bao gồm cả các cảnh dự phòng ở cuối"
                                    >
                                        Lấy Hết ({result.orderedClips.length} Cảnh)
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={onApplyCurated}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Áp Dụng Cắt Dựng Tinh Hoa ({curatedCount} Cảnh)</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
