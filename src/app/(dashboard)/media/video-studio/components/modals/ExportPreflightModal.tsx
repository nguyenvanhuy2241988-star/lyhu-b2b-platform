import React from "react";
import { X, Film, Mic, Music, AlertTriangle, Play, Sparkles, CheckCircle2 } from "lucide-react";
import { VideoClip } from "../../types";

interface ExportPreflightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmExport: () => void;
    clips: VideoClip[];
    hasVoice: boolean;
    voiceDuration: number;
    hasScript: boolean;
    aspectRatio: string;
    bgmChoice: string;
    timelineLength: number;
}

export const ExportPreflightModal: React.FC<ExportPreflightModalProps> = ({
    isOpen,
    onClose,
    onConfirmExport,
    clips,
    hasVoice,
    voiceDuration,
    hasScript,
    aspectRatio,
    bgmChoice,
    timelineLength
}) => {
    if (!isOpen) return null;

    const estimatedExportSeconds = Math.max(1, Math.round(hasVoice && voiceDuration > 0 ? voiceDuration : timelineLength));
    const clipsTotalDuration = clips.reduce((sum, c) => sum + (c.displayDuration || c.duration || 2.5), 0);
    const willLoopClips = hasVoice && voiceDuration > clipsTotalDuration;

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-slate-100">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-white text-base">
                                Kiểm Tra Trước Khi Xuất Video
                            </h3>
                            <p className="text-xs text-slate-400">
                                Đảm bảo chất lượng xuất 60 FPS chuẩn Studio
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preflight Checklist Body */}
                <div className="p-5 space-y-4 text-xs">
                    {/* Key stats grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
                            <Film className="w-4 h-4 text-teal-400 shrink-0" />
                            <div>
                                <p className="text-[11px] text-slate-400">Số lượng clip</p>
                                <p className="font-bold text-sm text-white">
                                    {clips.length} clip {clips.length === 0 ? "(Trống)" : ""}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
                            <Mic className="w-4 h-4 text-purple-400 shrink-0" />
                            <div>
                                <p className="text-[11px] text-slate-400">Giọng đọc AI</p>
                                <p className="font-bold text-sm text-white">
                                    {hasVoice ? `${Math.round(voiceDuration)}s` : hasScript ? "Tự động tạo" : "Không có"}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
                            <Music className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                                <p className="text-[11px] text-slate-400">Nhạc nền & SFX</p>
                                <p className="font-bold text-sm text-white truncate max-w-[130px]">
                                    {bgmChoice === "none" ? "Không có" : bgmChoice}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                                <p className="text-[11px] text-slate-400">Tỉ lệ khung hình</p>
                                <p className="font-bold text-sm text-white">
                                    {aspectRatio} (60 FPS)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notice if looping clips */}
                    {willLoopClips && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-xs">Thời lượng giọng nói dài hơn clip</p>
                                <p className="text-[11px] text-amber-300/80 mt-0.5">
                                    Giọng đọc dài {Math.round(voiceDuration)}s trong khi footage hiện có {Math.round(clipsTotalDuration)}s. Video studio sẽ tự động lặp các clip để phủ trọn vẹn kịch bản.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Important Tab-Focus Warning */}
                    <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-teal-300">
                            <AlertTriangle className="w-4 h-4 text-teal-400 shrink-0" />
                            <span>LƯU Ý QUAN TRỌNG KHI XUẤT VIDEO:</span>
                        </div>
                        <p className="text-[11px] text-teal-100/90 leading-relaxed">
                            Vui lòng <strong>giữ tab này hiển thị trên màn hình</strong> trong suốt khoảng <strong>{estimatedExportSeconds} giây</strong> xuất video. Không chuyển tab khác hoặc thu nhỏ trình duyệt để đảm bảo khung hình render mượt mà 60 FPS và âm thanh không bị lệch.
                        </p>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                        Quay lại chỉnh sửa
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onConfirmExport();
                        }}
                        disabled={clips.length === 0}
                        className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Bắt đầu xuất video ngay ({estimatedExportSeconds}s)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
