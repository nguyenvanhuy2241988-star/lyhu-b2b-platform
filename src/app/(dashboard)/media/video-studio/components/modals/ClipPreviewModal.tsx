import React, { useState, useEffect, useRef } from "react";
import { Film, X, MoveUp, MoveDown, Scissors, Clock, Tag, Check, Play, Pause } from "lucide-react";
import { VideoClip } from "../../types";

interface ClipPreviewModalProps {
    previewingClip: VideoClip | null;
    clips: VideoClip[];
    onClose: () => void;
    onSetOpeningClip: (clip: VideoClip) => void;
    onMoveClip: (index: number, direction: "up" | "down") => void;
    onUpdateClip?: (id: string, updates: Partial<VideoClip>) => void;
}

export const ClipPreviewModal: React.FC<ClipPreviewModalProps> = ({
    previewingClip,
    clips,
    onClose,
    onSetOpeningClip,
    onMoveClip,
    onUpdateClip
}) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [trimStart, setTrimStart] = useState<number>(0);
    const [displayDuration, setDisplayDuration] = useState<number>(2.5);
    const [role, setRole] = useState<string>("");
    const [savedNotice, setSavedNotice] = useState<boolean>(false);

    useEffect(() => {
        if (previewingClip) {
            setTrimStart(previewingClip.trimStart || 0);
            setDisplayDuration(previewingClip.displayDuration || 2.5);
            setRole(previewingClip.role || "");
            setSavedNotice(false);
        }
    }, [previewingClip]);

    if (!previewingClip) return null;

    const idx = clips.findIndex(c => c.url === previewingClip.url || c.id === previewingClip.id);
    const maxTrim = Math.max(0, (previewingClip.duration || 10) - 1.0);

    const handleSaveTrim = () => {
        if (onUpdateClip && previewingClip.id) {
            onUpdateClip(previewingClip.id, {
                trimStart,
                displayDuration,
                role: role.trim() || undefined
            });
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2000);
        }
    };

    const handleSetTrimFromCurrentTime = () => {
        if (videoRef.current) {
            const cur = Math.min(maxTrim, Math.max(0, videoRef.current.currentTime));
            setTrimStart(Math.round(cur * 10) / 10);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
                    <div className="flex items-center gap-2.5 truncate">
                        <span className="p-2 rounded-xl bg-primary-600 text-white shadow-sm">
                            <Film className="w-4 h-4" />
                        </span>
                        <div className="truncate">
                            <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                                {previewingClip.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">
                                Thời lượng gốc: {previewingClip.duration.toFixed(1)}s • Độ phân giải: {previewingClip.width || 1080}x{previewingClip.height || 1920}
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

                {/* Video / Image Player */}
                <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[260px] relative">
                    {previewingClip.mediaType === "image" ? (
                        <img
                            src={previewingClip.url}
                            alt={previewingClip.name}
                            className="max-h-[50vh] max-w-full rounded-lg shadow-inner object-contain"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={previewingClip.url}
                            controls
                            autoPlay
                            playsInline
                            className="max-h-[50vh] max-w-full rounded-lg shadow-inner bg-black object-contain"
                        />
                    )}
                </div>

                {/* Fine Trim & In-Point Settings Panel */}
                <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-primary-400" />
                            <span>Cắt Điểm Vào (Trim In-Point) & Thời Lượng Phân Cảnh:</span>
                        </span>
                        {savedNotice && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã lưu điểm cắt!</span>
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {/* Trim Start */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="font-semibold flex items-center gap-1 text-[11px]">
                                    <span>✂️ Bắt đầu tại giây:</span>
                                </span>
                                <span className="font-mono font-bold text-primary-400">{trimStart.toFixed(1)}s</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={maxTrim || 10}
                                step={0.1}
                                value={trimStart}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTrimStart(val);
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = val;
                                    }
                                }}
                                className="w-full accent-primary-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                            />
                            {previewingClip.mediaType !== "image" && (
                                <button
                                    type="button"
                                    onClick={handleSetTrimFromCurrentTime}
                                    className="text-[10px] text-primary-400 hover:text-primary-300 underline cursor-pointer"
                                >
                                    Lấy giây đang xem trên video
                                </button>
                            )}
                        </div>

                        {/* Display Duration */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="font-semibold flex items-center gap-1 text-[11px]">
                                    <Clock className="w-3 h-3 text-sky-400" />
                                    <span>Thời lượng phát:</span>
                                </span>
                                <span className="font-mono font-bold text-sky-400">{displayDuration.toFixed(1)}s</span>
                            </div>
                            <input
                                type="range"
                                min={1.0}
                                max={10.0}
                                step={0.2}
                                value={displayDuration}
                                onChange={(e) => setDisplayDuration(Number(e.target.value))}
                                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                            />
                            <p className="text-[10px] text-slate-500">
                                Nhịp clip trên timeline video
                            </p>
                        </div>

                        {/* Scene Role */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="font-semibold flex items-center gap-1 text-[11px]">
                                    <Tag className="w-3 h-3 text-amber-400" />
                                    <span>Vai trò cảnh:</span>
                                </span>
                            </div>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs outline-none focus:border-primary-400 cursor-pointer"
                            >
                                <option value="">Tự động / Tiêu chuẩn</option>
                                <option value="Hook 3s đầu (Cực phẩm)">🔥 Hook 3s đầu (Cực phẩm)</option>
                                <option value="Cận cảnh chi tiết sản phẩm">📸 Cận cảnh chi tiết món</option>
                                <option value="Chứng minh chất lượng / Quy trình">✨ Chứng minh chất lượng</option>
                                <option value="Kho bãi / Pallet sỉ">📦 Kho bãi / Pallet sỉ</option>
                                <option value="Kêu gọi hành động CTA">🛒 Kêu gọi mua sỉ (CTA)</option>
                            </select>
                            <button
                                type="button"
                                onClick={handleSaveTrim}
                                className="w-full mt-1 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                                Lưu Điểm Cắt Cảnh Này
                            </button>
                        </div>
                    </div>
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

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                            Đóng Xem Thử
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
