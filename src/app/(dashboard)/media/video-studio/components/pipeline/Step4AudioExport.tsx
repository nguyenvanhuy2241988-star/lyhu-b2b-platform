import React, { useState, useRef } from "react";
import {
    Music,
    Sparkles,
    Wand2,
    Flame,
    Bot,
    Zap,
    Loader2,
    Play,
    Pause,
    Check,
    Copy,
    Volume2,
    Gauge,
    ArrowLeft,
    Download,
    Search,
    Upload,
    SlidersHorizontal,
    Plus
} from "lucide-react";
import { ViralityScore, TikTokTrendingSound } from "../../types";
import { BGM_PRESETS, TIKTOK_TRENDING_SOUNDS } from "../../lib/constants";

interface Step4AudioExportProps {
    viralityScore: ViralityScore;
    bgmMode: "ai_smart" | "manual_trend";
    setBgmMode: (mode: "ai_smart" | "manual_trend") => void;
    selectedVoiceText: string;
    handleAiMatchMusic: () => void;
    bgmChoice: string;
    setBgmChoice: (choice: string) => void;
    tiktokExtractUrl: string;
    setTiktokExtractUrl: (url: string) => void;
    handleExtractTikTokSound: () => void;
    isExtractingTikTokSound: boolean;
    previewingSoundUrl: string | null;
    handleTogglePreviewSound: (url: string) => void;
    handleCopySoundTitle: (title: string) => void;
    copiedSoundTitle: string | null;
    handleApplyTikTokSound: (sound: TikTokTrendingSound) => void;
    bgmVolume: number;
    setBgmVolume: (vol: number) => void;
    enableAudioDucking: boolean;
    setEnableAudioDucking: (enable: boolean) => void;
    showWatermark: boolean;
    setShowWatermark: (show: boolean) => void;
    sfxVolume: number;
    setSfxVolume: (vol: number) => void;
    enableSfxWhoosh: boolean;
    setEnableSfxWhoosh: (enable: boolean) => void;
    enableSfxDing: boolean;
    setEnableSfxDing: (enable: boolean) => void;
    enableSfxKaching: boolean;
    setEnableSfxKaching: (enable: boolean) => void;
    enableSfxBoom: boolean;
    setEnableSfxBoom: (enable: boolean) => void;
    handleAuditionSfx: (sfx: "whoosh" | "ding" | "kaching" | "boom") => void;
    handleBoostVirality: () => void;
    isRendering: boolean;
    renderProgress: number;
    handleExportVideo: () => void;
    renderedVideoUrl?: string | null;
    renderedFormat?: string;
    aspectRatio?: string;
    onPrev: () => void;
}

export const Step4AudioExport: React.FC<Step4AudioExportProps> = ({
    viralityScore,
    bgmMode,
    setBgmMode,
    selectedVoiceText,
    handleAiMatchMusic,
    bgmChoice,
    setBgmChoice,
    tiktokExtractUrl,
    setTiktokExtractUrl,
    handleExtractTikTokSound,
    isExtractingTikTokSound,
    previewingSoundUrl,
    handleTogglePreviewSound,
    handleCopySoundTitle,
    copiedSoundTitle,
    handleApplyTikTokSound,
    bgmVolume,
    setBgmVolume,
    enableAudioDucking,
    setEnableAudioDucking,
    showWatermark,
    setShowWatermark,
    sfxVolume,
    setSfxVolume,
    enableSfxWhoosh,
    setEnableSfxWhoosh,
    enableSfxDing,
    setEnableSfxDing,
    enableSfxKaching,
    setEnableSfxKaching,
    enableSfxBoom,
    setEnableSfxBoom,
    handleAuditionSfx,
    handleBoostVirality,
    isRendering,
    renderProgress,
    handleExportVideo,
    renderedVideoUrl,
    renderedFormat = "mp4",
    aspectRatio = "9:16",
    onPrev
}) => {
    const [bgmCategoryFilter, setBgmCategoryFilter] = useState<"all" | "trending" | "food" | "warehouse" | "lofi" | "hype">("all");
    const [bgmSearchQuery, setBgmSearchQuery] = useState("");
    const customMusicInputRef = useRef<HTMLInputElement>(null);

    const filteredTrendingSounds = TIKTOK_TRENDING_SOUNDS.filter((s) => {
        const matchCategory = bgmCategoryFilter === "all" || s.category === bgmCategoryFilter;
        const matchSearch = !bgmSearchQuery.trim() ||
            s.title.toLowerCase().includes(bgmSearchQuery.toLowerCase()) ||
            s.useCase.toLowerCase().includes(bgmSearchQuery.toLowerCase()) ||
            s.tag.toLowerCase().includes(bgmSearchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const handleCustomMp3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        handleApplyTikTokSound({
            id: `custom_${Date.now()}`,
            title: `🎵 ${file.name.replace(/\.[^/.]+$/, "")} (File từ máy tính)`,
            author: "Tải từ máy tính",
            tag: "📁 Nhạc Riêng",
            url: objectUrl,
            duration: "Gốc",
            useCase: "Nhạc nền MP3 do người dùng tự tải lên từ thiết bị cá nhân"
        });
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center">
                        <Music className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 4: Nhạc Nền, Hiệu Ứng Foley & Xuất Bản Video</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                                60 FPS Chuẩn Mượt
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Phối nhạc nền TikTok, âm thanh foley chuyển cảnh và xuất video MP4 chất lượng cao.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-3 py-1 rounded-md flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                        <span>Điểm Viral: {viralityScore.overall}/100</span>
                    </span>
                </div>
            </div>

            {/* SECTION 1: NHẠC NỀN VIDEO */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-primary-600" />
                        <span>Nhạc Nền Video:</span>
                    </h3>
                    <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
                        <button
                            type="button"
                            onClick={() => setBgmMode("ai_smart")}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                bgmMode === "ai_smart" ? "bg-primary-500 text-white" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            AI Tự Phối Nhạc
                        </button>
                        <button
                            type="button"
                            onClick={() => setBgmMode("manual_trend")}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                bgmMode === "manual_trend" ? "bg-primary-500 text-white" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Radar Trend TikTok
                        </button>
                    </div>
                </div>

                {/* AI SMART SOUND MATCHING */}
                {bgmMode === "ai_smart" && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-600">
                                AI phân tích nội dung kịch bản ({selectedVoiceText.length} ký tự) để tự động chọn bản nhạc phù hợp nhịp độ bán buôn.
                            </p>
                            <button
                                type="button"
                                onClick={handleAiMatchMusic}
                                className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Phối Nhạc Ngay</span>
                            </button>
                        </div>

                        {/* Current Track */}
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                                <span className="text-[10px] text-slate-500 block">Đang áp dụng:</span>
                                <span className="font-bold text-slate-800 truncate block">
                                    {BGM_PRESETS.find(b => b.id === bgmChoice)?.name || TIKTOK_TRENDING_SOUNDS.find(b => b.id === bgmChoice)?.title || bgmChoice}
                                </span>
                            </div>
                            <select
                                value={bgmChoice}
                                onChange={(e) => setBgmChoice(e.target.value)}
                                className="p-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white outline-none max-w-[200px]"
                            >
                                {BGM_PRESETS.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                                {TIKTOK_TRENDING_SOUNDS.map(b => (
                                    <option key={b.id} value={b.id}>{b.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* MANUAL TIKTOK TREND & STATIC BGM CATALOG (0Đ MÁY CHỦ, 0.05S TỨC THÌ) */}
                {bgmMode === "manual_trend" && (
                    <div className="space-y-3">
                        {/* CATEGORY FILTER PILLS */}
                        <div className="flex flex-wrap items-center gap-1.5 pb-1">
                            {[
                                { id: "all", label: "Tất cả (23)" },
                                { id: "trending", label: "🔥 Hot Trend & Bán Hàng" },
                                { id: "food", label: "🍟 Review Đồ Ăn & ASMR" },
                                { id: "warehouse", label: "📦 Tổng Kho Sỉ B2B" },
                                { id: "lofi", label: "☕ Lofi Chill" },
                                { id: "hype", label: "⚡ Flash Sale & Hype" }
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setBgmCategoryFilter(cat.id as any)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                        bgmCategoryFilter === cat.id
                                            ? "bg-primary-500 text-white shadow-xs"
                                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* SEARCH & CUSTOM UPLOAD BAR */}
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative flex-1 w-full">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={bgmSearchQuery}
                                    onChange={(e) => setBgmSearchQuery(e.target.value)}
                                    placeholder="Tìm nhạc theo tên, phong cách (khoai môn, bán hàng, kho đêm, vui nhộn...)"
                                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 bg-white"
                                />
                            </div>

                            {/* UPLOAD CUSTOM MP3 BUTTON */}
                            <input
                                ref={customMusicInputRef}
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleCustomMp3Upload}
                            />
                            <button
                                type="button"
                                onClick={() => customMusicInputRef.current?.click()}
                                className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                            >
                                <Upload className="w-3.5 h-3.5 text-primary-600" />
                                <span>Tải Nhạc Riêng (0đ)</span>
                            </button>
                        </div>

                        {/* TRACK LIST */}
                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {filteredTrendingSounds.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
                                    Không tìm thấy bài hát nào phù hợp với từ khóa & bộ lọc.
                                </div>
                            ) : (
                                filteredTrendingSounds.map((sound) => {
                                    const isPlayingThis = previewingSoundUrl === sound.url;
                                    const isSelected = bgmChoice === sound.id;
                                    return (
                                        <div
                                            key={sound.id}
                                            className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs ${
                                                isSelected
                                                    ? "bg-primary-50/70 border-primary-500 ring-1 ring-primary-400 shadow-xs"
                                                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePreviewSound(sound.url)}
                                                    className={`p-2 rounded-lg shrink-0 transition-colors cursor-pointer border ${
                                                        isPlayingThis
                                                            ? "bg-primary-500 text-white border-primary-500 animate-pulse"
                                                            : "bg-slate-50 text-slate-700 hover:bg-primary-50 hover:text-primary-600 border-slate-200"
                                                    }`}
                                                    title={isPlayingThis ? "Tạm dừng nghe thử" : "Nghe thử bản nhạc"}
                                                >
                                                    {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                </button>
                                                <div className="min-w-0">
                                                    <div className="font-bold truncate text-slate-900 text-xs">
                                                        {sound.title}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                                        <span className="font-medium text-primary-700">{sound.tag}</span> • {sound.duration} • {sound.useCase}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyTikTokSound(sound)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white shadow-xs"
                                                            : "bg-primary-500 hover:bg-primary-600 text-white shadow-xs"
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Đang Dùng</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Áp Dụng</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Volume & Ducking Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="font-semibold text-slate-700">Âm lượng nhạc nền:</label>
                            <span className="font-mono text-primary-700 font-bold">{Math.round(bgmVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={bgmVolume}
                            onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                            className="w-full accent-primary-600"
                        />
                    </div>

                    <div className="space-y-1 flex flex-col justify-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enableAudioDucking}
                                onChange={(e) => setEnableAudioDucking(e.target.checked)}
                                className="accent-primary-600 rounded"
                            />
                            <span className="font-semibold text-slate-800">Tự động giảm nhạc khi AI đọc (Ducking)</span>
                        </label>
                        <p className="text-[10px] text-slate-500">Giảm âm lượng nhạc nền xuống 22% khi có lời nói</p>
                    </div>
                </div>
            </div>

            {/* SECTION 2: FOLEY SFX */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-primary-600" />
                        <span>Hiệu Ứng Âm Thanh Foley (SFX 0ms Độ Trễ):</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Âm lượng SFX:</span>
                        <input
                            type="range"
                            min={0.1}
                            max={1.0}
                            step={0.1}
                            value={sfxVolume}
                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                            className="w-20 accent-primary-600"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { id: "whoosh", label: "Swoosh Trầm (Tùy chọn)", checked: enableSfxWhoosh, setChecked: setEnableSfxWhoosh, desc: "Âm vuốt trầm nhẹ khi đổi cảnh (mặc định tắt)" },
                        { id: "ding", label: "Ding Thu Hút 0.3s", checked: enableSfxDing, setChecked: setEnableSfxDing, desc: "Keng nhẹ giữ chân người xem" },
                        { id: "kaching", label: "Kaching Tiền Sỉ", checked: enableSfxKaching, setChecked: setEnableSfxKaching, desc: "Keng máy đếm tiền khi có từ sỉ" },
                        { id: "boom", label: "Boom Bass Drop", checked: enableSfxBoom, setChecked: setEnableSfxBoom, desc: "Trầm uy lực khi hé lộ giá" }
                    ].map((sfx) => (
                        <div key={sfx.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">{sfx.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={sfx.checked}
                                        onChange={(e) => sfx.setChecked(e.target.checked)}
                                        className="accent-primary-600 rounded"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">{sfx.desc}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAuditionSfx(sfx.id as any)}
                                className="w-full py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 cursor-pointer"
                            >
                                Nghe Thử
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 3: VIRALITY SCORE */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-primary-600" />
                        <h3 className="font-bold text-xs text-slate-900">
                            Điểm Giữ Chân Thuật Toán (Virality Radar)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleBoostVirality}
                        className="px-2.5 py-1 rounded-md bg-primary-50 border border-primary-200 hover:bg-primary-100 text-primary-800 font-semibold text-xs transition-colors cursor-pointer"
                    >
                        Tối Ưu 99 Điểm Xu Hướng
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500">Hook 3.5s Đầu</div>
                        <div className="text-lg font-bold text-primary-700">{viralityScore.hook}%</div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500">Nhịp Cắt 2.5s</div>
                        <div className="text-lg font-bold text-primary-700">{viralityScore.pacing}%</div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500">Tỷ Lệ Inbox Sỉ</div>
                        <div className="text-lg font-bold text-primary-700">{viralityScore.conversion}%</div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500">Dự Báo Lượt Xem</div>
                        <div className="text-sm font-bold text-slate-900 mt-1">{viralityScore.estimatedViews}</div>
                    </div>
                </div>
            </div>

            {/* RENDERED VIDEO SUCCESS SHOWCASE CARD */}
            {renderedVideoUrl && !isRendering && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/70">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                                <Check className="w-4 h-4" />
                            </span>
                            <div>
                                <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <span>🎉 Video Thành Phẩm Đã Render Hoàn Tất!</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 uppercase">
                                        {(renderedFormat || "mp4").toUpperCase()} • 60 FPS
                                    </span>
                                </h3>
                                <p className="text-[11px] text-emerald-800">
                                    Video chuẩn tỷ lệ {aspectRatio}, âm thanh và hình ảnh đã khớp 100%, sẵn sàng để đăng tải ngay.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Video Player Preview */}
                    <div className="rounded-lg overflow-hidden border border-emerald-200 bg-black flex justify-center max-h-72">
                        <video
                            src={renderedVideoUrl}
                            controls
                            playsInline
                            className="max-h-72 w-auto object-contain mx-auto"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-emerald-700 font-medium">
                            ✓ Không dính watermark lạ • Tương thích mọi mạng xã hội
                        </span>
                        <a
                            href={renderedVideoUrl}
                            download={`LYHU_Studio_${(aspectRatio || "9-16").replace(":", "-")}_${Date.now()}.${renderedFormat || "mp4"}`}
                            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>Tải Video {(renderedFormat || "mp4").toUpperCase()} Về Máy Ngay</span>
                        </a>
                    </div>
                </div>
            )}

            {/* NAVIGATION & EXPORT BUTTON */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onPrev}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại Bước 3: Tiêu Đề</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (isRendering) return;
                        handleExportVideo();
                    }}
                    disabled={isRendering}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                    {isRendering ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Đang Xuất ({renderProgress}%)...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 text-white" />
                            <span>BẮT ĐẦU XUẤT VIDEO 60 FPS</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
