import React from "react";
import { Film, X, MoveUp, MoveDown } from "lucide-react";
import { VideoClip } from "../../types";

interface ClipPreviewModalProps {
    previewingClip: VideoClip | null;
    clips: VideoClip[];
    onClose: () => void;
    onSetOpeningClip: (clip: VideoClip) => void;
    onMoveClip: (index: number, direction: "up" | "down") => void;
}

export const ClipPreviewModal: React.FC<ClipPreviewModalProps> = ({
    previewingClip,
    clips,
    onClose,
    onSetOpeningClip,
    onMoveClip
}) => {
    if (!previewingClip) return null;

    const idx = clips.findIndex(c => c.url === previewingClip.url || c.id === previewingClip.id);

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
                    <div className="flex items-center gap-2.5 truncate">
                        <span className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
                            <Film className="w-4 h-4" />
                        </span>
                        <div className="truncate">
                            <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                                {previewingClip.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">
                                Thời lượng: {previewingClip.duration.toFixed(1)}s • Độ phân giải: {previewingClip.width || 1080}x{previewingClip.height || 1920}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Video Player */}
                <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[300px]">
                    <video
                        src={previewingClip.url}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[62vh] max-w-full rounded-lg shadow-inner bg-black object-contain"
                    />
                </div>

                {/* Quick Actions Footer */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => {
                                onSetOpeningClip(previewingClip);
                                onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <span>⭐ Đặt Làm Mở Đầu (#1)</span>
                        </button>
                        {idx >= 0 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onMoveClip(idx, "up")}
                                    disabled={idx === 0}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <MoveUp className="w-3.5 h-3.5" />
                                    <span>Lên Trước</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMoveClip(idx, "down")}
                                    disabled={idx === clips.length - 1}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <MoveDown className="w-3.5 h-3.5" />
                                    <span>Xuống Sau</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                        Đóng Xem Thử
                    </button>
                </div>
            </div>
        </div>
    );
};
