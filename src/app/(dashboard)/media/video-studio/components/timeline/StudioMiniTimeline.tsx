import React, { useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Film, Image as ImageIcon, MessageSquare } from "lucide-react";
import { VideoClip, SubtitleCue } from "../../types";

interface StudioMiniTimelineProps {
    clips: VideoClip[];
    subtitleCues: SubtitleCue[];
    currentTime: number;
    totalDuration: number;
    clipSwitchInterval: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
    const s = Math.max(0, isFinite(seconds) ? seconds : 0);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(1);
    return `${mins.toString().padStart(2, "0")}:${parseFloat(secs) < 10 ? "0" : ""}${secs}`;
}

export const StudioMiniTimeline: React.FC<StudioMiniTimelineProps> = ({
    clips,
    subtitleCues,
    currentTime,
    totalDuration,
    clipSwitchInterval,
    isPlaying,
    onTogglePlay,
    onSeek
}) => {
    const timelineRef = useRef<HTMLDivElement | null>(null);

    const safeTotal = Math.max(0.1, totalDuration);
    const progressPercent = Math.min(100, Math.max(0, (currentTime / safeTotal) * 100));

    const handlePointerInteraction = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!timelineRef.current) return;
            const rect = timelineRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(ratio * safeTotal);
        },
        [onSeek, safeTotal]
    );

    const clipColorClasses = [
        "bg-teal-500/20 border-teal-500/40 text-teal-300",
        "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
        "bg-purple-500/20 border-purple-500/40 text-purple-300",
        "bg-amber-500/20 border-amber-500/40 text-amber-300",
        "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
    ];

    // Compute clip widths
    let accumulatedTime = 0;
    const clipLayouts = clips.map((clip, idx) => {
        const dur = clip.displayDuration || clipSwitchInterval || 2.5;
        const start = accumulatedTime;
        const end = start + dur;
        accumulatedTime = end;

        const leftPercent = (start / safeTotal) * 100;
        const widthPercent = (dur / safeTotal) * 100;

        return {
            clip,
            idx,
            dur,
            leftPercent,
            widthPercent,
            colorClass: clipColorClasses[idx % clipColorClasses.length]
        };
    });

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 select-none text-slate-100 shadow-sm">
            {/* Header: Controls & Timecode */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onTogglePlay}
                        className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title={isPlaying ? "Tạm dừng" : "Phát video"}
                    >
                        {isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                        ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => onSeek(0)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Phát lại từ đầu"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[11px] font-mono font-bold text-teal-400 tracking-wide">
                        {formatTime(currentTime)}
                        <span className="text-slate-500 font-normal"> / {formatTime(safeTotal)}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                        <Film className="w-3 h-3 text-teal-400" /> {clips.length} clip
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-purple-400" /> {subtitleCues.length} câu
                    </span>
                </div>
            </div>

            {/* Visual Timeline Track */}
            <div
                ref={timelineRef}
                onPointerDown={handlePointerInteraction}
                className="relative h-14 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-pointer"
            >
                {/* TRACK 1: Video Clips Blocks */}
                <div className="absolute top-0 left-0 right-0 h-8 flex">
                    {clipLayouts.map((item) => (
                        <div
                            key={item.clip.id || item.idx}
                            style={{
                                left: `${item.leftPercent}%`,
                                width: `${Math.max(1.5, item.widthPercent)}%`
                            }}
                            className={`absolute top-0 bottom-0 border-r border-t border-b overflow-hidden px-1.5 flex items-center gap-1 text-[10px] font-semibold transition-opacity ${item.colorClass}`}
                            title={`Clip #${item.idx + 1}: ${item.clip.name || "Clip"} (${item.dur.toFixed(1)}s)`}
                        >
                            {item.clip.mediaType === "image" ? (
                                <ImageIcon className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            ) : (
                                <Film className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            )}
                            <span className="truncate">#{item.idx + 1} {item.clip.name}</span>
                        </div>
                    ))}
                </div>

                {/* TRACK 2: Subtitle Cues Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-slate-900/80 border-t border-slate-800 flex items-center">
                    {subtitleCues.map((cue, cIdx) => {
                        const cueLeft = (cue.start / safeTotal) * 100;
                        const cueWidth = Math.max(0.8, ((cue.end - cue.start) / safeTotal) * 100);
                        const isActive = currentTime >= cue.start && currentTime <= cue.end;

                        return (
                            <div
                                key={cIdx}
                                style={{
                                    left: `${cueLeft}%`,
                                    width: `${cueWidth}%`
                                }}
                                className={`absolute top-0.5 bottom-0.5 rounded-xs border text-[9px] px-1 truncate flex items-center transition-colors ${
                                    isActive
                                        ? "bg-purple-500 text-white border-purple-400 font-bold"
                                        : "bg-purple-950/40 text-purple-300/80 border-purple-800/40"
                                }`}
                                title={`[${cue.start.toFixed(1)}s - ${cue.end.toFixed(1)}s] "${cue.text}"`}
                            >
                                <span className="truncate">{cue.text}</span>
                            </div>
                        );
                    })}
                </div>

                {/* PLAYHEAD Line */}
                <div
                    style={{ left: `${progressPercent}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-10 pointer-events-none shadow-[0_0_8px_rgba(45,212,191,0.9)]"
                >
                    <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-teal-400 rounded-full shadow-sm" />
                </div>
            </div>
        </div>
    );
};
