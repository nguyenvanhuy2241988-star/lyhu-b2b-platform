import React, { useState, useEffect, useRef, useCallback } from "react";
import { Film, X, MoveUp, MoveDown, Scissors, Clock, Tag, Check, Play, Pause, RotateCcw, ArrowLeftRight, CheckCircle2 } from "lucide-react";
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
    const timelineBarRef = useRef<HTMLDivElement | null>(null);

    const [trimStart, setTrimStart] = useState<number>(0);
    const [trimEnd, setTrimEnd] = useState<number>(2.5);
    const [displayDuration, setDisplayDuration] = useState<number>(2.5);
    const [role, setRole] = useState<string>("");
    const [savedNotice, setSavedNotice] = useState<boolean>(false);
    const [isPlayingSelection, setIsPlayingSelection] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);

    // Dragging state for the timeline range scrubber
    const isDraggingRef = useRef<"left" | "right" | "center" | null>(null);
    const dragStartXRef = useRef<number>(0);
    const dragStartTrimRef = useRef<{ start: number; end: number; duration: number }>({ start: 0, end: 2.5, duration: 2.5 });

    const totalClipDuration = Math.max(0.5, previewingClip?.duration || 10);

    useEffect(() => {
        if (previewingClip) {
            const start = Math.max(0, Math.min(previewingClip.trimStart || 0, totalClipDuration - 0.5));
            const duration = previewingClip.displayDuration || 2.5;
            const end = previewingClip.trimEnd !== undefined
                ? Math.min(totalClipDuration, Math.max(start + 0.5, previewingClip.trimEnd))
                : Math.min(totalClipDuration, start + duration);

            setTrimStart(Math.round(start * 10) / 10);
            setTrimEnd(Math.round(end * 10) / 10);
            setDisplayDuration(Math.round((end - start) * 10) / 10);
            setRole(previewingClip.role || "");
            setSavedNotice(false);
            setIsPlayingSelection(false);
            setCurrentTime(start);
        }
    }, [previewingClip, totalClipDuration]);

    // Handle video timeupdate for audition loop and playhead
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const cur = videoRef.current.currentTime;
        setCurrentTime(cur);

        if (isPlayingSelection) {
            if (cur >= trimEnd || cur < trimStart) {
                videoRef.current.currentTime = trimStart;
                videoRef.current.play().catch(() => {});
            }
        }
    };

    // Toggle playing strictly the selection range
    const togglePlaySelection = () => {
        if (!videoRef.current) return;
        if (isPlayingSelection) {
            videoRef.current.pause();
            setIsPlayingSelection(false);
        } else {
            videoRef.current.currentTime = trimStart;
            videoRef.current.play().then(() => {
                setIsPlayingSelection(true);
            }).catch(() => {});
        }
    };

    // Calculate time from mouse/touch clientX relative to timeline bar
    const getTimeFromClientX = useCallback((clientX: number): number => {
        if (!timelineBarRef.current) return 0;
        const rect = timelineBarRef.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return ratio * totalClipDuration;
    }, [totalClipDuration]);

    // Pointer Down handlers
    const startDrag = (mode: "left" | "right" | "center", e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        isDraggingRef.current = mode;
        dragStartXRef.current = e.clientX;
        dragStartTrimRef.current = {
            start: trimStart,
            end: trimEnd,
            duration: Math.max(0.5, trimEnd - trimStart)
        };

        if (isPlayingSelection && videoRef.current) {
            videoRef.current.pause();
            setIsPlayingSelection(false);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingRef.current || !timelineBarRef.current) return;
        const mode = isDraggingRef.current;
        const rect = timelineBarRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartXRef.current;
        const deltaSeconds = (deltaX / rect.width) * totalClipDuration;

        const { start: initStart, end: initEnd, duration: initDur } = dragStartTrimRef.current;

        if (mode === "center") {
            // Drag entire chunk (keep duration constant!)
            let newStart = initStart + deltaSeconds;
            let newEnd = newStart + initDur;

            if (newStart < 0) {
                newStart = 0;
                newEnd = initDur;
            } else if (newEnd > totalClipDuration) {
                newEnd = totalClipDuration;
                newStart = Math.max(0, totalClipDuration - initDur);
            }

            const rStart = Math.round(newStart * 10) / 10;
            const rEnd = Math.round(newEnd * 10) / 10;
            setTrimStart(rStart);
            setTrimEnd(rEnd);
            setDisplayDuration(Math.round((rEnd - rStart) * 10) / 10);

            if (videoRef.current) {
                videoRef.current.currentTime = rStart;
            }
        } else if (mode === "left") {
            // Trim In-point (Left edge)
            let newStart = Math.max(0, Math.min(initStart + deltaSeconds, trimEnd - 0.5));
            newStart = Math.round(newStart * 10) / 10;
            setTrimStart(newStart);
            setDisplayDuration(Math.round((trimEnd - newStart) * 10) / 10);

            if (videoRef.current) {
                videoRef.current.currentTime = newStart;
            }
        } else if (mode === "right") {
            // Trim Out-point (Right edge)
            let newEnd = Math.min(totalClipDuration, Math.max(initEnd + deltaSeconds, trimStart + 0.5));
            newEnd = Math.round(newEnd * 10) / 10;
            setTrimEnd(newEnd);
            setDisplayDuration(Math.round((newEnd - trimStart) * 10) / 10);

            if (videoRef.current) {
                videoRef.current.currentTime = newEnd;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDraggingRef.current) {
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (_) {}
            isDraggingRef.current = null;
        }
    };

    // Quick duration selector
    const handleSetFixedDuration = (desiredDur: number) => {
        const dur = Math.min(totalClipDuration, desiredDur);
        let newEnd = trimStart + dur;
        let newStart = trimStart;
        if (newEnd > totalClipDuration) {
            newEnd = totalClipDuration;
            newStart = Math.max(0, totalClipDuration - dur);
        }
        newStart = Math.round(newStart * 10) / 10;
        newEnd = Math.round(newEnd * 10) / 10;
        setTrimStart(newStart);
        setTrimEnd(newEnd);
        setDisplayDuration(Math.round((newEnd - newStart) * 10) / 10);
        if (videoRef.current) videoRef.current.currentTime = newStart;
    };

    // Reset to full clip
    const handleResetFullClip = () => {
        setTrimStart(0);
        setTrimEnd(totalClipDuration);
        setDisplayDuration(totalClipDuration);
        if (videoRef.current) videoRef.current.currentTime = 0;
    };

    // Set trim in from current video time
    const handleSetInFromCurrent = () => {
        if (!videoRef.current) return;
        const cur = Math.round(Math.min(videoRef.current.currentTime, trimEnd - 0.5) * 10) / 10;
        setTrimStart(cur);
        setDisplayDuration(Math.round((trimEnd - cur) * 10) / 10);
    };

    // Set trim out from current video time
    const handleSetOutFromCurrent = () => {
        if (!videoRef.current) return;
        const cur = Math.round(Math.max(videoRef.current.currentTime, trimStart + 0.5) * 10) / 10;
        const bounded = Math.min(totalClipDuration, cur);
        setTrimEnd(bounded);
        setDisplayDuration(Math.round((bounded - trimStart) * 10) / 10);
    };

    const handleSaveTrim = () => {
        if (onUpdateClip && previewingClip?.id) {
            onUpdateClip(previewingClip.id, {
                trimStart,
                trimEnd,
                displayDuration,
                role: role.trim() || undefined
            });
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2000);
        }
    };

    if (!previewingClip) return null;

    const idx = clips.findIndex(c => c.url === previewingClip.url || c.id === previewingClip.id);

    // Compute percentage coordinates for timeline box
    const leftPercent = (trimStart / totalClipDuration) * 100;
    const widthPercent = Math.max(2, ((trimEnd - trimStart) / totalClipDuration) * 100);
    const playheadPercent = (currentTime / totalClipDuration) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
                    <div className="flex items-center gap-2.5 truncate">
                        <span className="p-2 rounded-xl bg-[#00afa9] text-white shadow-sm">
                            <Film className="w-4 h-4" />
                        </span>
                        <div className="truncate">
                            <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                                {previewingClip.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">
                                Thời lượng gốc: {totalClipDuration.toFixed(1)}s • Độ phân giải: {previewingClip.width || 1080}x{previewingClip.height || 1920}
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
                <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[240px] relative">
                    {previewingClip.mediaType === "image" ? (
                        <img
                            src={previewingClip.url}
                            alt={previewingClip.name}
                            className="max-h-[44vh] max-w-full rounded-lg shadow-inner object-contain"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={previewingClip.url}
                            controls
                            playsInline
                            onTimeUpdate={handleTimeUpdate}
                            className="max-h-[44vh] max-w-full rounded-lg shadow-inner bg-black object-contain"
                        />
                    )}

                    {/* Audition Floating Badge */}
                    {isPlayingSelection && (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500/90 text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs animate-pulse">
                            <Play className="w-3 h-3 fill-current" />
                            <span>Đang phát lặp đoạn cắt ({displayDuration.toFixed(1)}s)</span>
                        </div>
                    )}
                </div>

                {/* ADVANCED DUAL-HANDLE & DRAGGABLE RANGE TIMELINE CONTROLLER */}
                <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800 space-y-3.5">
                    {/* Top Info Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-[#00afa9]" />
                            <span className="text-xs font-bold text-slate-100">
                                Cắt Đầu, Cắt Cuối & Kéo Trượt Cả Cụm:
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[#00afa9]/20 text-[#00afa9] text-[11px] font-mono font-bold border border-[#00afa9]/40">
                                {trimStart.toFixed(1)}s ➔ {trimEnd.toFixed(1)}s ({displayDuration.toFixed(1)}s)
                            </span>
                        </div>

                        {savedNotice ? (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Đã lưu đoạn cắt thành công!</span>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSaveTrim}
                                className="px-3 py-1 rounded-lg bg-[#00afa9] hover:bg-[#00afa9]/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Lưu Đoạn Này</span>
                            </button>
                        )}
                    </div>

                    {/* INTERACTIVE TIMELINE SCRUBBER TRACK */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                            <span>0.0s (Đầu)</span>
                            <span className="text-slate-400">
                                💡 Nhấn vào giữa ô để kéo trượt cả cụm {displayDuration.toFixed(1)}s • Kéo 2 cạnh để chỉnh đầu/cuối
                            </span>
                            <span>{totalClipDuration.toFixed(1)}s (Cuối)</span>
                        </div>

                        {/* Track Bar Container */}
                        <div
                            ref={timelineBarRef}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            className="relative h-12 bg-slate-800/90 rounded-xl border border-slate-700/80 overflow-hidden select-none touch-none cursor-pointer"
                            onClick={(e) => {
                                // Jump playhead if clicked outside selection
                                const clickedTime = getTimeFromClientX(e.clientX);
                                if (videoRef.current) {
                                    videoRef.current.currentTime = clickedTime;
                                }
                            }}
                        >
                            {/* Background Time Grid Marks */}
                            <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-20">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="h-4 w-px bg-slate-300" />
                                ))}
                            </div>

                            {/* Current Playhead Line */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-30 pointer-events-none transition-all duration-75"
                                style={{ left: `${playheadPercent}%` }}
                            >
                                <div className="w-2 h-2 -ml-[3px] bg-red-400 rounded-full" />
                            </div>

                            {/* HIGHLIGHTED SELECTION WINDOW (DRAGGABLE CHUNK) */}
                            <div
                                className="absolute top-1 bottom-1 bg-[#00afa9]/25 border-2 border-[#00afa9] rounded-lg z-20 flex items-center justify-between transition-none shadow-md backdrop-blur-[1px]"
                                style={{
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`
                                }}
                            >
                                {/* LEFT HANDLE (TRIM IN-POINT) */}
                                <div
                                    onPointerDown={(e) => startDrag("left", e)}
                                    title="Kéo sang trái/phải để cắt điểm đầu (In-point)"
                                    className="w-4 h-full bg-[#00afa9] hover:bg-[#00afa9]/90 text-white flex items-center justify-center cursor-ew-resize rounded-l select-none shrink-0 transition-colors shadow-xs"
                                >
                                    <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                                </div>

                                {/* CENTER DRAGGABLE BODY (KÉO CẢ CỤM) */}
                                <div
                                    onPointerDown={(e) => startDrag("center", e)}
                                    title="Nhấn giữ và kéo để di chuyển cả cụm thời lượng này"
                                    className="flex-1 h-full flex items-center justify-center px-1 cursor-grab active:cursor-grabbing select-none text-white text-[11px] font-bold gap-1 truncate hover:bg-[#00afa9]/15 transition-colors"
                                >
                                    <ArrowLeftRight className="w-3 h-3 text-[#00afa9] shrink-0" />
                                    <span className="font-mono text-[10px] sm:text-xs text-[#00afa9] truncate">
                                        Kéo Cụm {displayDuration.toFixed(1)}s
                                    </span>
                                </div>

                                {/* RIGHT HANDLE (TRIM OUT-POINT) */}
                                <div
                                    onPointerDown={(e) => startDrag("right", e)}
                                    title="Kéo sang trái/phải để cắt điểm cuối (Out-point)"
                                    className="w-4 h-full bg-[#00afa9] hover:bg-[#00afa9]/90 text-white flex items-center justify-center cursor-ew-resize rounded-r select-none shrink-0 transition-colors shadow-xs"
                                >
                                    <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QUICK TOOLS & PRESET DURATION BUTTONS */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                        {/* Play Selection & Reset Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={togglePlaySelection}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    isPlayingSelection
                                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                        : "bg-emerald-600 text-white hover:bg-emerald-500"
                                }`}
                            >
                                {isPlayingSelection ? (
                                    <>
                                        <Pause className="w-3.5 h-3.5 fill-current" />
                                        <span>Dừng Nghe Thử</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>Phát Đoạn Đã Cắt ({displayDuration.toFixed(1)}s)</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleResetFullClip}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Lấy lại toàn bộ video gốc"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Cả Clip</span>
                            </button>
                        </div>

                        {/* Quick Presets: 1.5s, 2.0s, 2.5s, 3.0s, 4.0s */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-slate-400">Chọn nhanh cụm:</span>
                            {[1.5, 2.0, 2.5, 3.0, 4.0].map((sec) => (
                                <button
                                    key={sec}
                                    type="button"
                                    onClick={() => handleSetFixedDuration(sec)}
                                    className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                                        Math.abs(displayDuration - sec) < 0.15
                                            ? "bg-[#00afa9] text-white"
                                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                    }`}
                                >
                                    {sec}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DETAILED NUMBER INPUTS & SCENE ROLE */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
                        {/* Start (In-point) */}
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="font-semibold text-[11px]">✂️ Điểm đầu (Trim In):</span>
                                <span className="font-mono font-bold text-[#00afa9]">{trimStart.toFixed(1)}s</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min={0}
                                    max={Math.max(0, trimEnd - 0.5)}
                                    step={0.1}
                                    value={trimStart}
                                    onChange={(e) => {
                                        const v = Math.max(0, Math.min(Number(e.target.value), trimEnd - 0.5));
                                        setTrimStart(Math.round(v * 10) / 10);
                                        setDisplayDuration(Math.round((trimEnd - v) * 10) / 10);
                                        if (videoRef.current) videoRef.current.currentTime = v;
                                    }}
                                    className="w-20 px-2 py-1 bg-slate-800 text-white text-xs font-mono rounded border border-slate-700 outline-none focus:border-[#00afa9]"
                                />
                                {previewingClip.mediaType !== "image" && (
                                    <button
                                        type="button"
                                        onClick={handleSetInFromCurrent}
                                        className="text-[10px] text-[#00afa9] hover:underline cursor-pointer"
                                    >
                                        Lấy giây video
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* End (Out-point) */}
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="font-semibold text-[11px]">✂️ Điểm cuối (Trim Out):</span>
                                <span className="font-mono font-bold text-sky-400">{trimEnd.toFixed(1)}s</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min={trimStart + 0.5}
                                    max={totalClipDuration}
                                    step={0.1}
                                    value={trimEnd}
                                    onChange={(e) => {
                                        const v = Math.min(totalClipDuration, Math.max(Number(e.target.value), trimStart + 0.5));
                                        setTrimEnd(Math.round(v * 10) / 10);
                                        setDisplayDuration(Math.round((v - trimStart) * 10) / 10);
                                        if (videoRef.current) videoRef.current.currentTime = v;
                                    }}
                                    className="w-20 px-2 py-1 bg-slate-800 text-white text-xs font-mono rounded border border-slate-700 outline-none focus:border-sky-400"
                                />
                                {previewingClip.mediaType !== "image" && (
                                    <button
                                        type="button"
                                        onClick={handleSetOutFromCurrent}
                                        className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                                    >
                                        Lấy giây video
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scene Role */}
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="font-semibold text-[11px] flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-amber-400" />
                                    <span>Vai trò cảnh:</span>
                                </span>
                            </div>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs outline-none focus:border-[#00afa9] cursor-pointer"
                            >
                                <option value="">Tự động / Tiêu chuẩn</option>
                                <option value="Hook 3s đầu (Cực phẩm)">🔥 Hook 3s đầu (Cực phẩm)</option>
                                <option value="Cận cảnh chi tiết sản phẩm">📸 Cận cảnh chi tiết món</option>
                                <option value="Chứng minh chất lượng / Quy trình">✨ Chứng minh chất lượng</option>
                                <option value="Kho bãi / Pallet sỉ">📦 Kho bãi / Pallet sỉ</option>
                                <option value="Kêu gọi hành động CTA">🛒 Kêu gọi mua sỉ (CTA)</option>
                            </select>
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
                            onClick={handleSaveTrim}
                            className="px-3.5 py-1.5 rounded-xl bg-[#00afa9] hover:bg-[#00afa9]/90 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                            Lưu & Áp Dụng
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
