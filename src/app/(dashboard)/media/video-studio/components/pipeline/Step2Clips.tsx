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
    ArrowRight
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
    displayTime: number;
    setPreviewingClip: (clip: VideoClip) => void;
    handlePreviewSpecificClip: (idx: number) => void;
    moveClipToIndex: (fromIdx: number, toIdx: number) => void;
    moveClip: (idx: number, direction: "up" | "down") => void;
    handleSetOpeningClip: (clip: VideoClip) => void;
    removeClip: (id: string) => void;
    handleAddBRoll: (item: any) => void;
    videoFilterPreset: string;
    setVideoFilterPreset: (f: string) => void;
    onPrev: () => void;
    onNext: () => void;
}

export const Step2Clips: React.FC<Step2ClipsProps> = ({
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
    displayTime,
    setPreviewingClip,
    handlePreviewSpecificClip,
    moveClipToIndex,
    moveClip,
    handleSetOpeningClip,
    removeClip,
    handleAddBRoll,
    videoFilterPreset,
    setVideoFilterPreset,
    onPrev,
    onNext
}) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                        <Film className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 2: Chọn Cảnh Quay & Kho B-Roll Điện Ảnh</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                                {clips.length} Cảnh Trong Timeline
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Bấm vào bất kỳ cảnh nào để xem thử trực tiếp hoặc sắp xếp thứ tự cảnh 1, 2, 3...
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleLoadDemoClips}
                        className="text-xs text-purple-700 hover:text-purple-800 font-bold px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                        + Nạp 3 clip mẫu Tổng kho LYHU
                    </button>
                </div>
            </div>

            {/* Aspect Ratio & Pacing Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tỉ lệ khung hình:</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setAspectRatio("9:16")}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                aspectRatio === "9:16"
                                    ? "border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500 font-bold"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                            }`}
                        >
                            <Smartphone className="w-4 h-4" />
                            <span className="text-[11px]">9:16 (TikTok)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAspectRatio("16:9")}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                aspectRatio === "16:9"
                                    ? "border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500 font-bold"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                            }`}
                        >
                            <Monitor className="w-4 h-4" />
                            <span className="text-[11px]">16:9 (Ngang)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAspectRatio("1:1")}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                aspectRatio === "1:1"
                                    ? "border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500 font-bold"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                            }`}
                        >
                            <Square className="w-4 h-4" />
                            <span className="text-[11px]">1:1 (Vuông)</span>
                        </button>
                    </div>
                </div>

                {/* Nhịp cắt Pacing */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Nhịp đổi góc quay (Pacing):</label>
                        <span className="font-mono text-teal-600 font-bold text-xs">{clipSwitchInterval}s / cảnh</span>
                    </div>
                    <input
                        type="range"
                        min={1.5}
                        max={5.0}
                        step={0.5}
                        value={clipSwitchInterval}
                        onChange={(e) => setClipSwitchInterval(parseFloat(e.target.value))}
                        className="w-full accent-teal-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1.5s (Hối hả)</span>
                        <span className="text-teal-600 font-bold">2.5s (Chuẩn TikTok)</span>
                        <span>5s (Chậm rãi)</span>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-teal-600" />
                        <span>Tải Lên Video Quay Thô (Footage):</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                        {clips.length} clip trong dàn cảnh • Ước tính {(clips.length * clipSwitchInterval).toFixed(1)}s video
                    </span>
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isDragging
                            ? "border-teal-500 bg-teal-50 scale-[1.01]"
                            : "border-teal-200 hover:border-teal-500 bg-teal-50/20 hover:bg-teal-50/40"
                    }`}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {isUploadingVideo ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                                <p className="text-xs font-bold text-teal-700">Đang nạp video vào bộ nhớ...</p>
                            </div>
                        ) : (
                            <>
                                <span className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm shrink-0">
                                    <Upload className="w-4 h-4" />
                                </span>
                                <div className="text-left sm:flex-1">
                                    <p className="text-xs font-bold text-slate-800">
                                        Kéo thả hoặc nhấp để tải thêm clip quay thô từ điện thoại / máy tính
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Hỗ trợ MP4, MOV, WebM • Chọn nhiều video cùng lúc • Tự động co giãn theo tỉ lệ {aspectRatio}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                                >
                                    + Chọn Tệp Video
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
                accept="video/*,.mp4,.mov,.webm,.m4v,.mkv"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
            />

            {/* Timeline Clips Strip */}
            <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clapperboard className="w-4 h-4 text-purple-600" />
                        <span>Dàn Cảnh Video Hiện Tại ({clips.length} Cảnh Quay - Sắp Xếp Trực Tiếp):</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                        Bấm vào hình để xem video thô • Đổi thứ tự cảnh 1, 2, 3 bằng menu hoặc mũi tên
                    </span>
                </div>

                {clips.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <Film className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">Chưa có cảnh nào trong video.</p>
                        <p className="text-[11px] text-slate-400">Hãy bấm tải video ở trên hoặc chọn thêm các cảnh B-Roll mẫu bên dưới!</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {clips.map((c, idx) => {
                            if (!c?.id) return null;
                            const activeClipIndex = clips.length > 0 ? Math.floor(displayTime / Math.max(1.5, clipSwitchInterval || 2.5)) % clips.length : 0;
                            const isCurrentlyPlayingThis = activeClipIndex === idx;
                            return (
                                <div
                                    key={c.id}
                                    className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        isCurrentlyPlayingThis
                                            ? "bg-purple-50/70 border-purple-400 ring-2 ring-purple-300 shadow-sm"
                                            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                                    }`}
                                >
                                    {/* Video Thumbnail & Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Thumbnail Preview with Play Overlay */}
                                        <div
                                            onClick={() => setPreviewingClip(c)}
                                            className="relative group/thumb cursor-pointer shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-black w-20 h-16 sm:w-24 sm:h-16 flex items-center justify-center shadow-xs"
                                            title="Nhấn để xem trước toàn bộ video thô này"
                                        >
                                            <video
                                                src={c.url}
                                                preload="metadata"
                                                muted
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/35 group-hover/thumb:bg-black/15 flex items-center justify-center transition-all">
                                                <span className="p-1 rounded-full bg-white/90 text-purple-700 shadow-sm group-hover/thumb:scale-110 transition-transform">
                                                    <Play className="w-3.5 h-3.5 fill-purple-600" />
                                                </span>
                                            </div>
                                            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-black/70 text-white px-1 rounded">
                                                {c.duration.toFixed(0)}s
                                            </span>
                                        </div>

                                        {/* Text Info */}
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                                                    idx === 0
                                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                                        : "bg-purple-100 text-purple-800"
                                                }`}>
                                                    {idx === 0 ? "⭐ CẢNH #1 (MỞ ĐẦU HOOK)" : `CẢNH #${idx + 1}`}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    Xuất hiện từ: {(idx * clipSwitchInterval).toFixed(1)}s
                                                </span>
                                            </div>
                                            <div className="font-bold text-slate-800 text-xs truncate" title={c.name}>
                                                {c.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                <span>Thời lượng gốc: {c.duration.toFixed(1)}s</span>
                                                <span>•</span>
                                                <span>Kích thước: {c.width || 1080}x{c.height || 1920}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Control Actions & Reorder */}
                                    <div className="flex items-center gap-1.5 shrink-0 justify-end flex-wrap pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                        {/* Nút Xem Video Thô */}
                                        <button
                                            type="button"
                                            onClick={() => setPreviewingClip(c)}
                                            className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                            title="Mở trình phát video để xem trực tiếp video thô này"
                                        >
                                            <Play className="w-3 h-3 fill-white" />
                                            <span>Xem Video</span>
                                        </button>

                                        {/* Nút Xem Trên Canvas Ghép */}
                                        <button
                                            type="button"
                                            onClick={() => handlePreviewSpecificClip(idx)}
                                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                                isCurrentlyPlayingThis
                                                    ? "bg-teal-600 text-white"
                                                    : "bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700"
                                            }`}
                                            title="Xem cảnh này trên màn hình video thành phẩm"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span className="hidden sm:inline">{isCurrentlyPlayingThis ? "Đang Hiện" : "Màn Ghép"}</span>
                                        </button>

                                        {/* Dropdown Đổi Thứ Tự Cảnh */}
                                        <select
                                            value={idx}
                                            onChange={(e) => moveClipToIndex(idx, Number(e.target.value))}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:border-purple-300 cursor-pointer"
                                            title="Đổi trực tiếp thứ tự xuất hiện của cảnh này"
                                        >
                                            {clips.map((_, i) => (
                                                <option key={i} value={i}>
                                                    {i === 0 ? "Vị trí: Cảnh #1 (Mở Đầu)" : `Vị trí: Cảnh #${i + 1}`}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Nút Lên / Xuống */}
                                        <button
                                            type="button"
                                            onClick={() => moveClip(idx, "up")}
                                            disabled={idx === 0}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                                            title="Đẩy lên trước"
                                        >
                                            <MoveUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveClip(idx, "down")}
                                            disabled={idx === clips.length - 1}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                                            title="Đẩy xuống sau"
                                        >
                                            <MoveDown className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Nút Đặt Làm Mở Đầu */}
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetOpeningClip(c)}
                                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                                title="Đưa cảnh này lên làm Cảnh #1 mở đầu video"
                                            >
                                                ⭐ Đặt Đầu
                                            </button>
                                        )}

                                        {/* Nút Xóa Cảnh */}
                                        <button
                                            type="button"
                                            onClick={() => removeClip(c.id)}
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
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
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-purple-600" />
                        <span>Kho B-Roll Thực Tế LYHU (Bấm để thêm vào video):</span>
                    </span>
                    <span className="text-[11px] text-purple-700 font-medium">B-Roll quay sẵn bản quyền</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {AI_BROLL_LIBRARY.map((item) => (
                        <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 transition-all text-xs flex flex-col justify-between gap-2 shadow-2xs group"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                        {item.tag}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {item.duration}s
                                    </span>
                                </div>
                                <p className="font-bold text-slate-800 text-xs line-clamp-2 group-hover:text-purple-700 transition-colors">
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
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                    title="Xem thử clip B-roll này"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddBRoll(item)}
                                    className="flex-1 py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Thêm Cảnh Này</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Filters LUT */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-teal-600" />
                    <span>Bộ Lọc Màu Điện Ảnh (LUT Color Grading):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {VIDEO_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setVideoFilterPreset(f.id)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                videoFilterPreset === f.id
                                    ? "bg-teal-600 text-white shadow-sm ring-1 ring-teal-500"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onPrev}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại Bước 1: Kịch bản</span>
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer transition-all active:scale-95"
                >
                    <span>Tiếp tục: Bước 3 - Tiêu Đề & Huy Hiệu</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
