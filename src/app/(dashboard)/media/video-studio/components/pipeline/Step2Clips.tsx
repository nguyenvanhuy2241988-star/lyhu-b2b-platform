import React from "react";
import {
    Film,
    Smartphone,
    Monitor,
    Square,
    Upload,
    Loader2,
    Clapperboard,
    Play,
    Eye,
    MoveUp,
    MoveDown,
    Trash2,
    Plus,
    Palette,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Wand2,
    Scissors,
    Zap
} from "lucide-react";
import { VideoClip, BRollItem } from "../../types";
import { AI_BROLL_LIBRARY, VIDEO_FILTERS } from "../../lib/constants";

interface Step2ClipsProps {
    clips: VideoClip[];
    aspectRatio: "9:16" | "16:9" | "1:1";
    setAspectRatio: (ar: "9:16" | "16:9" | "1:1") => void;
    clipSwitchInterval: number;
    setClipSwitchInterval: (val: number) => void;
    handleLoadDemoClips: () => void;
    isDragging: boolean;
    setIsDragging: (val: boolean) => void;
    handleDrop: (e: React.DragEvent<any>) => void | Promise<void>;
    fileInputRef: React.RefObject<any>;
    isUploadingVideo: boolean;
    handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    displayTime?: number;
    activeClipIndex?: number;
    setPreviewingClip: (clip: VideoClip) => void;
    handlePreviewSpecificClip: (idx: number) => void;
    moveClipToIndex: (fromIdx: number, toIdx: number) => void;
    moveClip: (idx: number, direction: "up" | "down") => void;
    handleSetOpeningClip: (clip: VideoClip) => void;
    removeClip: (id: string) => void;
    handleAddBRoll: (item: any) => void;
    videoFilterPreset: string;
    setVideoFilterPreset: (f: string) => void;
    transitionEffect?: "auto" | "crossfade" | "zoom_in" | "slide_left" | "white_flash" | "hard_cut";
    setTransitionEffect?: (effect: "auto" | "crossfade" | "zoom_in" | "slide_left" | "white_flash" | "hard_cut") => void;
    onTriggerAutoEdit?: () => void;
    isAutoEditing?: boolean;
    onPrev: () => void;
    onNext: () => void;
}

const Step2ClipsComponent: React.FC<Step2ClipsProps> = ({
    clips,
    aspectRatio,
    setAspectRatio,
    clipSwitchInterval,
    setClipSwitchInterval,
    handleLoadDemoClips,
    isDragging,
    setIsDragging,
    handleDrop,
    fileInputRef,
    isUploadingVideo,
    handleVideoUpload,
    displayTime = 0,
    activeClipIndex,
    setPreviewingClip,
    handlePreviewSpecificClip,
    moveClipToIndex,
    moveClip,
    handleSetOpeningClip,
    removeClip,
    handleAddBRoll,
    videoFilterPreset,
    setVideoFilterPreset,
    transitionEffect = "auto",
    setTransitionEffect,
    onTriggerAutoEdit,
    isAutoEditing = false,
    onPrev,
    onNext
}) => {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center">
                        <Film className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 2: Chọn Video Quay Thô & Ảnh Minh Họa</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                                {clips.length} cảnh / ảnh trong timeline
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Quản lý các đoạn video, ảnh chụp sản phẩm/siêu thị, đổi thứ tự và nạp kho B-Roll thực tế.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {onTriggerAutoEdit && (
                        <button
                            type="button"
                            onClick={onTriggerAutoEdit}
                            disabled={clips.length < 1}
                            className="flex items-center gap-1.5 text-xs text-white font-bold px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                            title="Tự động gán Clip 1 -> Câu 1, Clip 2 -> Câu 2 trong 0.001 giây trên máy bạn"
                        >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>⚡ Xếp Theo Kịch Bản (0.001s)</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleLoadDemoClips}
                        className="text-xs text-primary-700 hover:text-primary-800 font-semibold px-3 py-1.5 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer"
                    >
                        + Nạp 3 clip mẫu LYHU
                    </button>
                </div>
            </div>

            {/* Aspect Ratio & Pacing Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tỉ lệ khung hình video:</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setAspectRatio("9:16")}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                                aspectRatio === "9:16"
                                    ? "border-primary-500 bg-primary-500 text-white font-bold"
                                    : "border-slate-200 hover:bg-slate-100 text-slate-700 bg-white"
                            }`}
                        >
                            <Smartphone className="w-4 h-4" />
                            <span className="text-[11px]">9:16 (Dọc TikTok)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAspectRatio("16:9")}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                                aspectRatio === "16:9"
                                    ? "border-primary-500 bg-primary-500 text-white font-bold"
                                    : "border-slate-200 hover:bg-slate-100 text-slate-700 bg-white"
                            }`}
                        >
                            <Monitor className="w-4 h-4" />
                            <span className="text-[11px]">16:9 (Ngang Web)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAspectRatio("1:1")}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                                aspectRatio === "1:1"
                                    ? "border-primary-500 bg-primary-500 text-white font-bold"
                                    : "border-slate-200 hover:bg-slate-100 text-slate-700 bg-white"
                            }`}
                        >
                            <Square className="w-4 h-4" />
                            <span className="text-[11px]">1:1 (Vuông Feed)</span>
                        </button>
                    </div>
                </div>

                {/* Nhịp cắt Pacing */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Nhịp đổi góc quay (Pacing):</label>
                        <span className="font-mono text-primary-700 font-bold text-xs">{clipSwitchInterval}s / cảnh</span>
                    </div>
                    <input
                        type="range"
                        min={1.5}
                        max={5.0}
                        step={0.5}
                        value={clipSwitchInterval}
                        onChange={(e) => setClipSwitchInterval(parseFloat(e.target.value))}
                        className="w-full accent-primary-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                        <span>1.5s (Nhanh)</span>
                        <span className="text-primary-700 font-semibold">2.5s (Chuẩn TikTok)</span>
                        <span>5.0s (Chậm)</span>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-primary-600" />
                        <span>Tải Lên Video & Ảnh Minh Họa (Footage & Photos):</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                        {clips.length} cảnh • {(clips.length * clipSwitchInterval).toFixed(1)}s thời lượng
                    </span>
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDragging
                            ? "border-primary-500 bg-primary-50"
                            : "border-slate-300 hover:border-primary-400 bg-slate-50 hover:bg-primary-50/30"
                    }`}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {isUploadingVideo ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                                <p className="text-xs font-semibold text-primary-800">Đang nạp video / ảnh vào bộ nhớ...</p>
                            </div>
                        ) : (
                            <>
                                <span className="p-2 rounded-lg bg-primary-500 text-white shrink-0">
                                    <Upload className="w-4 h-4" />
                                </span>
                                <div className="text-left sm:flex-1">
                                    <p className="text-xs font-bold text-slate-800">
                                        Kéo thả hoặc nhấp để tải thêm Video clip hoặc Ảnh chụp sản phẩm từ máy
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Hỗ trợ Video (MP4, MOV, WebM) & Ảnh (PNG, JPG, WEBP) • Tự động chuyển cảnh nhịp {clipSwitchInterval}s
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                                >
                                    + Chọn Video / Ảnh
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*,.mp4,.mov,.webm,.m4v,.mkv,.png,.jpg,.jpeg,.webp"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
            />

            {/* Smart 100% Client-Side Auto-Align Banner */}
            {clips.length >= 2 && onTriggerAutoEdit && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-teal-50/90 via-primary-50/70 to-emerald-50/80 border border-primary-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                            <Zap className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>⚡ Ghép Kịch Bản & Cảnh Quay Tự Động (0.001s Trên Máy Bạn)</span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary-100 text-primary-800">
                                    0đ Máy Chủ • Siêu Tốc
                                </span>
                            </p>
                            <p className="text-[11px] text-slate-600 leading-snug">
                                Tự động gán Clip 1 → Câu 1, Clip 2 → Câu 2 theo đúng nhịp kịch bản, tự gọt 1.0s rung lắc máy quay. Sau đó bạn kéo thả tinh chỉnh tùy thích!
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onTriggerAutoEdit}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>⚡ Bấm Ghép Ngay (0.001s)</span>
                    </button>
                </div>
            )}

            {/* Timeline Clips Strip */}
            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clapperboard className="w-4 h-4 text-primary-600" />
                        <span>Danh Sách Cảnh Quay ({clips.length} Cảnh Trong Timeline):</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                        Bấm vào hình để xem video thô • Đổi thứ tự cảnh 1, 2, 3 bằng menu hoặc mũi tên
                    </span>
                </div>

                {clips.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 space-y-1.5">
                        <Film className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">Chưa có cảnh nào trong video.</p>
                        <p className="text-[11px] text-slate-500">Hãy bấm tải video ở trên hoặc chọn thêm các cảnh B-Roll bên dưới.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {clips.map((c, idx) => {
                            if (!c?.id) return null;
                            const activeIdx = typeof activeClipIndex === "number"
                                ? activeClipIndex
                                : (clips.length > 0 ? Math.floor((displayTime || 0) / Math.max(1.5, clipSwitchInterval || 2.5)) % clips.length : 0);
                            const isCurrentlyPlayingThis = activeIdx === idx;
                            return (
                                <div
                                    key={c.id}
                                    className={`p-2.5 rounded-lg border transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                        isCurrentlyPlayingThis
                                            ? "bg-primary-50 border-primary-400"
                                            : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    {/* Video Thumbnail & Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            onClick={() => setPreviewingClip(c)}
                                            className="relative group/thumb cursor-pointer shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 w-20 h-14 flex items-center justify-center"
                                            title="Xem trước cảnh này"
                                        >
                                            {c.mediaType === "image" ? (
                                                <img
                                                    src={c.url}
                                                    alt={c.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <video
                                                    src={c.url}
                                                    preload="none"
                                                    muted
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                                                <span className="p-1 rounded-full bg-white/90 text-primary-600">
                                                    <Play className="w-3 h-3 fill-primary-600" />
                                                </span>
                                            </div>
                                            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-black/70 text-white px-1 rounded">
                                                {c.duration.toFixed(0)}s
                                            </span>
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                    idx === 0
                                                        ? "bg-primary-500 text-white"
                                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                                }`}>
                                                    {idx === 0 ? "CẢNH #1 (MỞ ĐẦU)" : `CẢNH #${idx + 1}`}
                                                </span>
                                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                    c.mediaType === "image"
                                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                                }`}>
                                                    {c.mediaType === "image" ? "📸 ẢNH" : "🎬 VIDEO"}
                                                </span>
                                                {c.role && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                        {c.role}
                                                    </span>
                                                )}
                                                {typeof c.trimStart === "number" && c.trimStart > 0 && (
                                                    <span className="text-[9px] text-emerald-700 font-mono bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 font-semibold">
                                                        ✂️ Bỏ {c.trimStart.toFixed(1)}s đầu
                                                    </span>
                                                )}
                                                {isCurrentlyPlayingThis && (
                                                    <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-1.5 rounded">
                                                        Đang phát
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-semibold text-slate-800 text-xs truncate max-w-xs" title={c.name}>
                                                {c.name}
                                            </p>
                                            {c.matchedSentence && (
                                                <p className="text-[10px] text-slate-500 italic truncate max-w-xs sm:max-w-md">
                                                    🗣️ "{c.matchedSentence}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions & Ordering */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handlePreviewSpecificClip(idx)}
                                            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                                                isCurrentlyPlayingThis
                                                    ? "bg-primary-500 text-white border-primary-500"
                                                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                            }`}
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>Xem Thử</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPreviewingClip(c)}
                                            className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                                            title="Cắt điểm vào In-point và thời lượng"
                                        >
                                            <Scissors className="w-3 h-3 text-primary-600" />
                                            <span>Cắt</span>
                                        </button>

                                        {/* Dropdown Đổi Thứ Tự Cảnh */}
                                        <select
                                            value={idx}
                                            onChange={(e) => moveClipToIndex(idx, Number(e.target.value))}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 outline-none hover:border-primary-400 cursor-pointer"
                                        >
                                            {clips.map((_, i) => (
                                                <option key={i} value={i}>
                                                    {i === 0 ? "Vị trí #1 (Đầu)" : `Vị trí #${i + 1}`}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Nút Lên / Xuống */}
                                        <button
                                            type="button"
                                            onClick={() => moveClip(idx, "up")}
                                            disabled={idx === 0}
                                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 cursor-pointer"
                                            title="Đẩy lên trước"
                                        >
                                            <MoveUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveClip(idx, "down")}
                                            disabled={idx === clips.length - 1}
                                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 cursor-pointer"
                                            title="Đẩy xuống sau"
                                        >
                                            <MoveDown className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Nút Đặt Làm Mở Đầu */}
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetOpeningClip(c)}
                                                className="px-2 py-1 bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                                            >
                                                Đặt Đầu
                                            </button>
                                        )}

                                        {/* Nút Xóa Cảnh */}
                                        <button
                                            type="button"
                                            onClick={() => removeClip(c.id)}
                                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                                            title="Xóa cảnh này"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* B-Roll Warehouse Library */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-primary-600" />
                        <span>Kho B-Roll Thực Tế LYHU (Bấm để thêm vào video):</span>
                    </span>
                    <span className="text-[11px] text-slate-500">B-Roll quay sẵn có bản quyền</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {AI_BROLL_LIBRARY.map((item) => (
                        <div
                            key={item.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-primary-400 transition-colors text-xs flex flex-col justify-between gap-2"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-50 text-primary-800 border border-primary-200">
                                        {item.tag}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {item.duration}s
                                    </span>
                                </div>
                                <p className="font-semibold text-slate-800 text-xs line-clamp-2">
                                    {item.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPreviewingClip({
                                        id: item.id,
                                        url: item.url,
                                        name: item.name,
                                        duration: item.duration,
                                        width: item.width,
                                        height: item.height,
                                        muted: true
                                    })}
                                    className="p-1 rounded-md text-slate-600 hover:text-primary-700 hover:bg-slate-50 transition-colors cursor-pointer border border-slate-200"
                                    title="Xem thử clip B-roll này"
                                >
                                    <Play className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddBRoll(item)}
                                    className="flex-1 py-1 px-2 rounded-md bg-primary-500 hover:bg-primary-600 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Thêm Cảnh Này</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transition Effect Selector */}
            {setTransitionEffect && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span>Hiệu Ứng Chuyển Cảnh (Transitions):</span>
                        </span>
                        <span className="text-[11px] text-teal-700 font-medium">
                            {transitionEffect === "hard_cut" ? "Dứt khoát 0ms bóng mờ (Chuẩn TikTok)" : transitionEffect === "crossfade" ? "Hòa tan êm dịu 200ms" : transitionEffect === "zoom_in" ? "Zoom cận cảnh" : "⚡ Tự động thông minh"}
                        </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { id: "auto", name: "⚡ Tự động (Auto)", desc: "Hard cut & hòa tan đan xen" },
                            { id: "hard_cut", name: "✂️ Cắt dứt khoát", desc: "Chuẩn TikTok / Reels viral" },
                            { id: "crossfade", name: "🌊 Hòa tan mượt", desc: "Mềm mại, không giật hình" },
                            { id: "zoom_in", name: "🔍 Zoom cận cảnh", desc: "Đẩy khung hình tạo điểm nhấn" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTransitionEffect(item.id as any)}
                                className={`p-2 rounded-lg border text-left transition-all cursor-pointer text-xs flex flex-col justify-between ${
                                    (transitionEffect || "auto") === item.id
                                        ? "bg-white border-teal-500 text-teal-900 font-semibold shadow-xs ring-1 ring-teal-500"
                                        : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"
                                }`}
                            >
                                <span className="font-bold text-[11px]">{item.name}</span>
                                <span className="text-[10px] text-slate-700 mt-0.5 line-clamp-1">{item.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Filters LUT */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary-600" />
                    <span>Bộ Lọc Màu Video (LUT Color Grading):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {VIDEO_FILTERS.map((filt) => (
                        <button
                            key={filt.id}
                            type="button"
                            onClick={() => setVideoFilterPreset(filt.id)}
                            className={`p-2 rounded-lg border text-center transition-colors cursor-pointer text-xs ${
                                videoFilterPreset === filt.id
                                    ? "bg-primary-500 text-white border-primary-500 font-bold"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <span>{filt.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onPrev}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại Bước 1: Kịch bản</span>
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                    <span>Tiếp tục: Bước 3 - Tiêu Đề & Huy Hiệu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export const Step2Clips = React.memo(Step2ClipsComponent);
