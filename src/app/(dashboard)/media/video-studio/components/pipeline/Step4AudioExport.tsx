import React from "react";
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
    Download
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
    onPrev
}) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            {/* Header Bước 4 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                        <Music className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 4: Âm Thanh Xu Hướng, Foley SFX & Xuất Video</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                                60 FPS Chuẩn Mượt
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Phối nhạc nền TikTok, âm thanh Foley 0ms độ trễ, kiểm tra điểm thuật toán và xuất bản video.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Điểm Viral: {viralityScore.overall}/100 🌟</span>
                    </span>
                </div>
            </div>

            {/* 🎵 SECTION 1: NHẠC NỀN VIDEO (TIKTOK DUAL-MODE) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Music className="w-4 h-4 text-teal-600" />
                        <span>Nhạc Nền Video (2 Lựa chọn Chuyên Nghiệp)</span>
                    </h3>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        {bgmMode === "ai_smart" ? "🤖 AI Tự Động Phối Nhạc" : "🔥 Radar Trend TikTok"}
                    </span>
                </div>

                {/* DUAL MODE SELECTOR BUTTONS */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setBgmMode("ai_smart")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            bgmMode === "ai_smart"
                                ? "border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm ring-1 ring-teal-500"
                                : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                        }`}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Wand2 className="w-4 h-4 text-teal-600" />
                            <span>Lựa chọn A: AI Tự Phối Nhạc</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                            AI quét nội dung kịch bản & tự chọn nhạc hợp mood
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setBgmMode("manual_trend")}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            bgmMode === "manual_trend"
                                ? "border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm ring-1 ring-teal-500"
                                : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                        }`}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span>Lựa chọn B: Radar Trend TikTok</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                            Bảng xếp hạng âm thanh viral & công cụ bóc tách nhạc
                        </span>
                    </button>
                </div>

                {/* SUB-SECTION 1: AI SMART SOUND MATCHING */}
                {bgmMode === "ai_smart" && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 border border-teal-200/80 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                    <Bot className="w-4 h-4 text-teal-600" />
                                    <span>Thuật Toán AI Smart Sound Match:</span>
                                </h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    AI tự động phân tích tâm trạng kịch bản hiện tại ({selectedVoiceText.length} ký tự), nhận diện các yếu tố: <em>kho hàng đêm, sỉ số lượng lớn, ẩm thực giòn rụm</em> để đề xuất bản nhạc giữ chân người xem tốt nhất.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAiMatchMusic}
                                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Quét & Phối Nhạc Ngay</span>
                            </button>
                        </div>

                        {/* Current Selected Track Preview */}
                        <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
                                    <Music className="w-4 h-4" />
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Đang áp dụng vào video:</div>
                                    <div className="text-xs font-bold text-slate-800 truncate">
                                        {BGM_PRESETS.find(b => b.id === bgmChoice)?.name || TIKTOK_TRENDING_SOUNDS.find(b => b.id === bgmChoice)?.title || bgmChoice}
                                    </div>
                                </div>
                            </div>
                            <select
                                value={bgmChoice}
                                onChange={(e) => setBgmChoice(e.target.value)}
                                className="p-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 outline-none max-w-[200px]"
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

                {/* SUB-SECTION 2: RADAR TREND TIKTOK & BÓC TÁCH LINK */}
                {bgmMode === "manual_trend" && (
                    <div className="space-y-3">
                        {/* TOOL 1: EXTRACT SOUND FROM ANY TIKTOK URL */}
                        <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 shadow-sm">
                            <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>Bóc tách âm thanh trực tiếp từ link TikTok:</span>
                                </span>
                                <span className="text-[10px] text-slate-400">Trích xuất MP3</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tiktokExtractUrl}
                                    onChange={(e) => setTiktokExtractUrl(e.target.value)}
                                    placeholder="Dán link TikTok (VD: https://www.tiktok.com/@tra.my.24zone/video/...)"
                                    className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleExtractTikTokSound()}
                                    disabled={isExtractingTikTokSound}
                                    className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs whitespace-nowrap flex items-center gap-1.5 disabled:opacity-60 transition-colors cursor-pointer"
                                >
                                    {isExtractingTikTokSound ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Đang tách...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-3.5 h-3.5 fill-black" />
                                            <span>Tách Nhạc</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* TOOL 2: RADAR TIKTOK TRENDING SOUNDS LIST */}
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                    <span>Top Âm Thanh Đang Viral Cho Bán Hàng & Đồ Ăn Vặt:</span>
                                </span>
                                <span className="text-[10px] text-slate-400">Nghe thử & Gắn nhanh</span>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {TIKTOK_TRENDING_SOUNDS.map((sound) => {
                                    const isPlayingThis = previewingSoundUrl === sound.url;
                                    const isSelected = bgmChoice === sound.id;
                                    return (
                                        <div
                                            key={sound.id}
                                            className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                                isSelected
                                                    ? "bg-teal-50 border-teal-500 text-teal-950 shadow-sm"
                                                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-800"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePreviewSound(sound.url)}
                                                    className={`p-2 rounded-full shrink-0 transition-colors cursor-pointer ${
                                                        isPlayingThis
                                                            ? "bg-teal-600 text-white animate-pulse"
                                                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                                                    }`}
                                                    title={isPlayingThis ? "Tạm dừng" : "Nghe thử"}
                                                >
                                                    {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                </button>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                                            {sound.tag}
                                                        </span>
                                                        <span className="font-semibold text-xs truncate text-slate-900">
                                                            {sound.title}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 truncate">
                                                        {sound.useCase} • <span className="font-mono text-slate-400">{sound.duration}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopySoundTitle(sound.title)}
                                                    className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-[10px] font-medium text-slate-600 flex items-center gap-1 border border-slate-200 cursor-pointer"
                                                    title="Copy tên âm thanh để tìm trên ứng dụng TikTok"
                                                >
                                                    {copiedSoundTitle === sound.title ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                    <span>{copiedSoundTitle === sound.title ? "Đã chép" : "Copy tên"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyTikTokSound(sound)}
                                                    className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? "bg-teal-600 text-white"
                                                            : "bg-slate-200 hover:bg-teal-600 hover:text-white text-slate-800"
                                                    }`}
                                                >
                                                    {isSelected ? "Đang chọn" : "+ Gắn vào video"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ALGORITHM PRO-TIP BANNER */}
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-900 leading-relaxed">
                            <strong>💡 Bí quyết đẩy Xu Hướng TikTok:</strong>
                            <p className="mt-0.5 text-slate-700 text-[10px]">
                                Nếu đăng lên TikTok, bạn nên chọn <strong>"🔇 Không dùng nhạc nền"</strong> trong Studio để xuất video sạch chỉ có giọng nói. Sau đó, khi đăng video trên điện thoại, bấm nút <strong>"Thêm âm thanh"</strong> của TikTok, dán tên bài hát vừa Copy ở trên, và chỉnh âm lượng nhạc còn 10-15%. Thuật toán TikTok sẽ đẩy video vào luồng xu hướng của bài hát đó và 100% không bị tắt tiếng bản quyền!
                            </p>
                        </div>
                    </div>
                )}

                {/* BGM Volume Slider */}
                {bgmChoice !== "none" && (
                    <div className="pt-3 border-t border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <label className="font-semibold text-slate-700">Âm lượng nhạc nền:</label>
                            <span className="font-mono text-teal-600 font-bold">{Math.round(bgmVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0.05}
                            max={0.5}
                            step={0.02}
                            value={bgmVolume}
                            onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                            className="w-full accent-teal-600"
                        />
                    </div>
                )}

                {/* Audio Ducking & Watermark */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enableAudioDucking}
                            onChange={(e) => setEnableAudioDucking(e.target.checked)}
                            className="accent-teal-600 rounded"
                        />
                        <span className="text-slate-700 font-medium">Tự động giảm nhạc nền khi có tiếng nói (Audio Ducking)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showWatermark}
                            onChange={(e) => setShowWatermark(e.target.checked)}
                            className="accent-teal-600 rounded"
                        />
                        <span className="text-slate-700 font-medium">Gắn logo LYHU! Tổng Kho Sỉ B2B</span>
                    </label>
                </div>
            </div>

            {/* 🔊 SECTION 2: HỆ THỐNG HIỆU ỨNG FOLEY SFX (Web Audio 0ms Latency) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-purple-600" />
                            <h3 className="font-bold text-xs text-slate-900">
                                Hệ Thống Hiệu Ứng Âm Thanh Foley (Web Audio 0ms Latency)
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Bộ âm thanh Whoosh vút gió, Ding chuông giật mắt, Kaching keng tiền bán buôn. Tổng hợp tức thì không sợ lỗi tải file.
                        </p>
                    </div>

                    {/* SFX Volume slider */}
                    <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-600">Âm lượng SFX:</span>
                        <input
                            type="range"
                            min={0.1}
                            max={0.8}
                            step={0.05}
                            value={sfxVolume}
                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                            className="w-20 accent-purple-600"
                        />
                        <span className="font-mono font-bold text-purple-700 w-8 text-right">
                            {Math.round(sfxVolume * 100)}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Foley 1: Whoosh */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>💨 Whoosh Chuyển Cảnh</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={enableSfxWhoosh}
                                    onChange={(e) => setEnableSfxWhoosh(e.target.checked)}
                                    className="accent-purple-600 rounded cursor-pointer"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Âm vút gió điện ảnh khớp mỗi lần nhảy góc quay 2.5s.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAuditionSfx("whoosh")}
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                            <Volume2 className="w-3 h-3 text-purple-600" />
                            <span>Nghe Thử</span>
                        </button>
                    </div>

                    {/* Foley 2: Hook Ding */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>🔔 Ding Giật Mắt 0.3s</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={enableSfxDing}
                                    onChange={(e) => setEnableSfxDing(e.target.checked)}
                                    className="accent-purple-600 rounded cursor-pointer"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Chuông ngân pha lê ở 0.3s đầu giữ chân ngón tay lướt.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAuditionSfx("ding")}
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                            <Volume2 className="w-3 h-3 text-purple-600" />
                            <span>Nghe Thử</span>
                        </button>
                    </div>

                    {/* Foley 3: Kaching */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>💰 Kaching Keng Tiền</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={enableSfxKaching}
                                    onChange={(e) => setEnableSfxKaching(e.target.checked)}
                                    className="accent-purple-600 rounded cursor-pointer"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Keng máy đếm tiền khi có từ khóa: LÃI, SỈ, GIÁ GỐC, FREESHIP.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAuditionSfx("kaching")}
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                            <Volume2 className="w-3 h-3 text-purple-600" />
                            <span>Nghe Thử</span>
                        </button>
                    </div>

                    {/* Foley 4: Boom Bass Drop */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>💥 Boom Bass Drop</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={enableSfxBoom}
                                    onChange={(e) => setEnableSfxBoom(e.target.checked)}
                                    className="accent-purple-600 rounded cursor-pointer"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Trầm uy lực dằn xuống khi hé lộ bí mật nhập sỉ tận gốc.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAuditionSfx("boom")}
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                            <Volume2 className="w-3 h-3 text-purple-600" />
                            <span>Nghe Thử</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 📊 SECTION 3: BỘ MÁY KIỂM TRA ĐIỂM GIỮ CHÂN THUẬT TOÁN (VIRALITY & RETENTION RADAR) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-purple-600" />
                        <h3 className="font-bold text-xs text-slate-900">
                            Bộ Máy Kiểm Tra Điểm Giữ Chân Thuật Toán (Virality & Retention Radar)
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBoostVirality}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                            <Flame className="w-3.5 h-3.5 fill-slate-950" />
                            <span>1-Click Lên 99 Điểm Xu Hướng</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500 font-medium">Hook 3.5s Đầu</div>
                        <div className="text-xl font-black text-purple-700 mt-0.5">{viralityScore.hook}%</div>
                        <div className="text-[9px] text-emerald-600 font-bold">Cực Kì Thu Hút</div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500 font-medium">Nhịp Cắt 2.5s</div>
                        <div className="text-xl font-black text-teal-700 mt-0.5">{viralityScore.pacing}%</div>
                        <div className="text-[9px] text-emerald-600 font-bold">Chuẩn Dopamine</div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500 font-medium">Tỷ Lệ Inbox Sỉ</div>
                        <div className="text-xl font-black text-amber-600 mt-0.5">{viralityScore.conversion}%</div>
                        <div className="text-[9px] text-amber-700 font-bold">Chốt Đơn Cao</div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <div className="text-[11px] text-slate-500 font-medium">Dự Báo Lượt Xem</div>
                        <div className="text-sm font-black text-slate-900 mt-1.5">{viralityScore.estimatedViews}</div>
                        <div className="text-[9px] text-purple-600 font-bold">Thuật Toán Đẩy Xu Hướng</div>
                    </div>
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gợi ý độc quyền từ AI Đạo Diễn:</span>
                    </div>
                    <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px]">
                        {viralityScore.insights.map((insight, idx) => (
                            <li key={idx} className="leading-relaxed">{insight}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 🚀 NAVIGATION & BIG PROMINENT EXPORT BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onPrev}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại Bước 3: Tiêu Đề & Huy Hiệu</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (isRendering) return;
                        handleExportVideo();
                    }}
                    disabled={isRendering}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                    {isRendering ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Đang Xuất ({renderProgress}%)...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 text-white" />
                            <span>🚀 BẮT ĐẦU XUẤT VIDEO 60 FPS SIÊU MƯỢT</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
