import React from "react";
import {
    Tag,
    Play,
    Sparkles,
    Palette,
    Sliders,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { VIRAL_HOOK_PRESETS } from "../../lib/constants";

interface Step3VisualsProps {
    handlePreviewHookOnly: () => void;
    hookDuration: number;
    setHookDuration: (val: number) => void;
    showHookTitle: boolean;
    setShowHookTitle: (val: boolean) => void;
    customHookTitle: string;
    handleHookTitleChange: (val: string) => void;
    hookBannerTheme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu";
    setHookBannerTheme: (theme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu") => void;
    stickerPosition: "top_right" | "top_left" | "bottom_right";
    setStickerPosition: (pos: "top_right" | "top_left" | "bottom_right") => void;
    activeSalesSticker: string;
    setActiveSalesSticker: (stickerId: string) => void;
    enableSubtitles: boolean;
    setEnableSubtitles: (enable: boolean) => void;
    fontFamily: string;
    setFontFamily: (font: string) => void;
    subtitleStyle: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow";
    setSubtitleStyle: (style: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow") => void;
    textColor: string;
    setTextColor: (color: string) => void;
    textAnimationEffect: "tiktok_pop" | "karaoke_glow" | "bicolor_punch" | "fire_shake" | "box_pill" | "clean_fade";
    setTextAnimationEffect: (effect: any) => void;
    subtitleOffset: number;
    setSubtitleOffset: React.Dispatch<React.SetStateAction<number>>;
    fontSize: number;
    setFontSize: (size: number) => void;
    textPosition: "top" | "center" | "bottom";
    setTextPosition: (pos: "top" | "center" | "bottom") => void;
    onPrev: () => void;
    onNext: () => void;
}

export const Step3Visuals: React.FC<Step3VisualsProps> = ({
    handlePreviewHookOnly,
    hookDuration,
    setHookDuration,
    showHookTitle,
    setShowHookTitle,
    customHookTitle,
    handleHookTitleChange,
    hookBannerTheme,
    setHookBannerTheme,
    stickerPosition,
    setStickerPosition,
    activeSalesSticker,
    setActiveSalesSticker,
    enableSubtitles,
    setEnableSubtitles,
    fontFamily,
    setFontFamily,
    subtitleStyle,
    setSubtitleStyle,
    textColor,
    setTextColor,
    textAnimationEffect,
    setTextAnimationEffect,
    subtitleOffset,
    setSubtitleOffset,
    fontSize,
    setFontSize,
    textPosition,
    setTextPosition,
    onPrev,
    onNext
}) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                        <Tag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 3: Tiêu Đề Hook & Huy Hiệu Bán Hàng</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                Chuẩn Viral TikTok
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Tiêu đề đập mắt 3.5s đầu, Huy hiệu chốt đơn nhấp nháy đỏ, và Phụ đề động khớp 100% tiếng nói.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePreviewHookOnly}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
                >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Xem Thử Hook 3.5s Đầu</span>
                </button>
            </div>

            {/* 🎯 SECTION 1: TIÊU ĐỀ HOOK 3.5S ĐẦU (VIRAL HOOK BANNER) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-white border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Tiêu đề giật tít Hook ({hookDuration}s đầu để giữ chân TikTok):</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showHookTitle}
                            onChange={(e) => setShowHookTitle(e.target.checked)}
                            className="accent-amber-600 rounded"
                        />
                        <span>Bật Tiêu Đề Hook</span>
                    </label>
                </div>

                {showHookTitle && (
                    <>
                        <textarea
                            rows={2}
                            value={customHookTitle}
                            onChange={(e) => handleHookTitleChange(e.target.value)}
                            placeholder="Nhập tiêu đề Hook 3s đầu, ví dụ: 🔥 CONTAINER KHOAI MÔN CVT VỀ ĐÊM DATE MỚI TINH!"
                            className="w-full p-3 text-xs font-bold text-amber-950 bg-white border border-amber-300 rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none leading-relaxed transition-all shadow-inner"
                        />

                        {/* Presets giật tít */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Gợi ý mẫu Hook bán buôn (Nhấp chọn ăn liền):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {VIRAL_HOOK_PRESETS.map((v, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleHookTitleChange(v.text)}
                                        className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-200/90 rounded-lg text-[10px] font-semibold text-slate-700 hover:text-amber-950 transition-colors cursor-pointer text-left line-clamp-1"
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4 Phong cách Hook Banner */}
                        <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700">Phong cách Hook:</span>
                                <div className="flex flex-wrap gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setHookBannerTheme("tiktok_sticker")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                            hookBannerTheme === "tiktok_sticker"
                                                ? "bg-amber-400 text-slate-950 border border-amber-500 shadow-sm ring-1 ring-amber-400"
                                                : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-50"
                                        }`}
                                    >
                                        ✨ Nhãn TikTok Viền 8.5px
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHookBannerTheme("red_orange")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                            hookBannerTheme === "red_orange"
                                                ? "bg-red-600 text-white shadow-sm"
                                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        Đỏ Cam
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHookBannerTheme("black_gold")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                            hookBannerTheme === "black_gold"
                                                ? "bg-zinc-900 text-yellow-400 shadow-sm"
                                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        Đen Vàng B2B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHookBannerTheme("teal_lyhu")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                            hookBannerTheme === "teal_lyhu"
                                                ? "bg-teal-600 text-white shadow-sm"
                                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        Xanh LYHU
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700">Thời lượng hiện:</span>
                                <select
                                    value={hookDuration}
                                    onChange={(e) => setHookDuration(parseFloat(e.target.value))}
                                    className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-amber-950 outline-none cursor-pointer"
                                >
                                    <option value={3.0}>3.0s</option>
                                    <option value={3.5}>3.5s (Chuẩn TikTok)</option>
                                    <option value={4.0}>4.0s</option>
                                    <option value={5.0}>5.0s</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 🏷️ SECTION 2: HUY HIỆU LIVESTREAM & CALLOUT CHỐT ĐƠN */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <div>
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-600" />
                            <h3 className="font-bold text-xs text-slate-900">
                                Huy Hiệu Chốt Đơn Trực Tiếp (Live Sales Sticker)
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Sticker động có chấm đỏ beacon <code>● LIVE DEAL</code> nhấp nháy, kích thích chủ quán nhắn lấy sỉ ngay.
                        </p>
                    </div>

                    {/* Position Selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold">Vị trí:</span>
                        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                            <button
                                type="button"
                                onClick={() => setStickerPosition("top_right")}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                    stickerPosition === "top_right" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Trên Phải
                            </button>
                            <button
                                type="button"
                                onClick={() => setStickerPosition("top_left")}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                    stickerPosition === "top_left" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Trên Trái
                            </button>
                            <button
                                type="button"
                                onClick={() => setStickerPosition("bottom_right")}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                    stickerPosition === "bottom_right" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Dưới Phải
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                        { id: "freeship", label: "🚚 FREESHIP TẬN QUÁN", sub: "Miễn phí ship", color: "border-amber-500 bg-amber-50 text-amber-900" },
                        { id: "si_1_thung", label: "📦 SỈ TỪ 1 THÙNG", sub: "Giá gốc xưởng", color: "border-yellow-500 bg-yellow-50 text-yellow-900" },
                        { id: "san_kho", label: "🏭 SẴN KHO 1000 THÙNG", sub: "Giao ngay 2h", color: "border-rose-500 bg-rose-50 text-rose-900" },
                        { id: "lai_x2", label: "📈 LÃI GẤP ĐÔI", sub: "Bán chạy nhất", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
                        { id: "inbox_cta", label: "💬 NHẬN MẪU THỬ", sub: "Thử miễn phí", color: "border-teal-500 bg-teal-50 text-teal-900" },
                        { id: "none", label: "🚫 TẮT HUY HIỆU", sub: "Không gắn", color: "border-slate-300 bg-slate-50 text-slate-600" }
                    ].map((stk) => {
                        const isSelected = activeSalesSticker === stk.id;
                        return (
                            <button
                                key={stk.id}
                                type="button"
                                onClick={() => setActiveSalesSticker(stk.id)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                        ? `${stk.color} ring-2 ring-purple-500 font-bold shadow-sm`
                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                }`}
                            >
                                <div className="text-[11px] font-bold line-clamp-1">{stk.label}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{stk.sub}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 📝 SECTION 3: FONT CHỮ THƯƠNG HIỆU & PHỤ ĐỀ ĐỘNG (KINETIC TYPOGRAPHY) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-600" />
                        <span>Phụ Đề Động & Hiệu Ứng Nhảy Chữ (100% Khớp Lời Nói)</span>
                    </h3>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enableSubtitles}
                            onChange={(e) => setEnableSubtitles(e.target.checked)}
                            className="accent-purple-600 rounded"
                        />
                        <span>Bật Phụ Đề</span>
                    </label>
                </div>

                {enableSubtitles && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* Font chữ */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-slate-700">Kiểu Font chữ hiển thị:</label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs font-semibold text-slate-800"
                                >
                                    <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro (Chuẩn Thương Hiệu LYHU)</option>
                                    <option value="Montserrat, sans-serif">Montserrat (Hiện đại TikTok & Reels)</option>
                                    <option value="'Arial Black', Impact, sans-serif">Arial Black / Impact (Dày dặn, bán hàng mạnh)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Chuẩn đài truyền hình, đĩnh đạc)</option>
                                    <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI (Thanh lịch, hiện đại)</option>
                                </select>
                            </div>

                            {/* Phong cách phụ đề */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-slate-700">Màu sắc & Phong cách phụ đề:</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={subtitleStyle}
                                        onChange={(e) => setSubtitleStyle(e.target.value as any)}
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs font-semibold text-slate-800"
                                    >
                                        <option value="tiktok_stroke">Viền đen đậm (TikTok Viral)</option>
                                        <option value="neon_glow">Phát sáng Neon (Gen Z)</option>
                                        <option value="pill_dark">Hộp nền tối mờ (Chuyên nghiệp)</option>
                                        <option value="clean_shadow">Đổ bóng mờ tối giản</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5 shrink-0"
                                        title="Chọn màu chữ tùy ý"
                                    />
                                </div>
                            </div>

                            {/* Kinetic Typography Dropdown */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-slate-700 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Hiệu ứng chữ sáng tạo (Kinetic Typography):</span>
                                    </span>
                                    <span className="text-[10px] text-purple-600 font-bold">Chuẩn Viral TikTok</span>
                                </label>
                                <select
                                    value={textAnimationEffect}
                                    onChange={(e) => setTextAnimationEffect(e.target.value as any)}
                                    className="w-full p-2.5 border border-purple-200 rounded-lg bg-white outline-none text-xs font-bold text-purple-900 shadow-sm"
                                >
                                    <option value="tiktok_pop">🔥 Nảy chữ từng từ CapCut (TikTok Pop Bounce - Khuyên dùng)</option>
                                    <option value="karaoke_glow">🌟 Karaoke Neon Glow (Tô sáng & Chấm nhịp theo giọng đọc)</option>
                                    <option value="bicolor_punch">🎨 CapCut 2 Màu Tương Phản (Vàng Chanh + Trắng Sành Điệu)</option>
                                    <option value="fire_shake">⚡ Dynamic Slam & Shake (Đập dứt khoát & Rung năng lượng)</option>
                                    <option value="box_pill">🏷️ Gen Z Dark Badge (Hộp bo góc CapCut Pro viền vàng)</option>
                                    <option value="clean_fade">✨ Chữ nét căng viền đen dày (Classic Bold Stroke)</option>
                                </select>
                            </div>

                            {/* Subtitle Sync Offset Slider & Quick Nudge Buttons */}
                            <div className="space-y-2 sm:col-span-2 p-3 rounded-xl bg-purple-50/40 border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-purple-900 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Khớp giọng đọc chính xác (Độ trễ phụ đề +/- Offset):</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                                            {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(2)}s` : `${subtitleOffset.toFixed(2)}s`}
                                        </span>
                                        {subtitleOffset !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSubtitleOffset(0)}
                                                className="text-[10px] text-purple-600 hover:underline font-semibold"
                                            >
                                                Đặt lại 0s
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={-2.0}
                                    max={2.0}
                                    step={0.05}
                                    value={subtitleOffset}
                                    onChange={(e) => setSubtitleOffset(parseFloat(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                                <div className="flex items-center justify-between text-[10px] text-gray-400">
                                    <span>-2.0s (Chữ hiện sớm)</span>
                                    <span>0.0s (Chuẩn đồng bộ AI)</span>
                                    <span>+2.0s (Chữ hiện trễ)</span>
                                </div>
                                {/* Quick Nudge Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-purple-800 font-bold mr-1">Chỉnh nhanh:</span>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.max(-2, +(prev - 0.2).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện sớm hơn 0.2s"
                                    >
                                        -0.2s
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.max(-2, +(prev - 0.1).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện sớm hơn 0.1s"
                                    >
                                        -0.1s
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(0)}
                                        className="px-2.5 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700"
                                    >
                                        0s (Chuẩn AI)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.min(2, +(prev + 0.1).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện trễ hơn 0.1s"
                                    >
                                        +0.1s
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.min(2, +(prev + 0.2).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện trễ hơn 0.2s"
                                    >
                                        +0.2s
                                    </button>
                                </div>
                            </div>

                            {/* Fast Color Presets */}
                            <div className="sm:col-span-2 flex items-center gap-2 text-xs">
                                <span className="text-gray-500 font-medium">Màu nhanh:</span>
                                {[
                                    { name: "Vàng TikTok", hex: "#FACC15" },
                                    { name: "Xanh LYHU", hex: "#00AFA9" },
                                    { name: "Cyan Neon", hex: "#22D3EE" },
                                    { name: "Trắng", hex: "#FFFFFF" },
                                    { name: "Cam Rực Rỡ", hex: "#FB923C" }
                                ].map((p) => (
                                    <button
                                        key={p.hex}
                                        type="button"
                                        onClick={() => setTextColor(p.hex)}
                                        className="px-2 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1 hover:border-gray-400"
                                        style={{ backgroundColor: `${p.hex}15`, borderColor: textColor === p.hex ? p.hex : "#e2e8f0" }}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                                        <span>{p.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Font Size & Position */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-gray-700">Kích thước chữ:</label>
                                    <span className="font-mono text-purple-600 font-bold">{fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={18}
                                    max={42}
                                    step={2}
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-semibold text-gray-700">Vị trí chữ trên video:</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setTextPosition("top")}
                                        className={`py-1.5 px-2 rounded-lg border text-center ${textPosition === "top" ? "bg-purple-50 border-purple-500 font-bold text-purple-700" : "bg-slate-50 border-gray-200 text-gray-600"}`}
                                    >
                                        Trên cao
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTextPosition("center")}
                                        className={`py-1.5 px-2 rounded-lg border text-center ${textPosition === "center" ? "bg-purple-50 border-purple-500 font-bold text-purple-700" : "bg-slate-50 border-gray-200 text-gray-600"}`}
                                    >
                                        Chính giữa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTextPosition("bottom")}
                                        className={`py-1.5 px-2 rounded-lg border text-center ${textPosition === "bottom" ? "bg-purple-50 border-purple-500 font-bold text-purple-700" : "bg-slate-50 border-gray-200 text-gray-600"}`}
                                    >
                                        Dưới đáy (Chuẩn)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onPrev}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại Bước 2: Chọn Cảnh</span>
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer transition-all active:scale-95"
                >
                    <span>Tiếp tục: Bước 4 - Âm Thanh & Xuất Video</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
