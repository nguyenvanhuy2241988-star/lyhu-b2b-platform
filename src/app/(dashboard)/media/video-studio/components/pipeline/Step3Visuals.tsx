import React from "react";
import {
    Tag,
    Sparkles,
    Palette,
    Sliders,
    Play,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { VIRAL_HOOK_PRESETS } from "../../lib/constants";

interface Step3VisualsProps {
    handlePreviewHookOnly: () => void;
    hookDuration: number;
    setHookDuration: (d: number) => void;
    showHookTitle: boolean;
    setShowHookTitle: (show: boolean) => void;
    customHookTitle: string;
    handleHookTitleChange: (val: string) => void;
    hookBannerTheme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu";
    setHookBannerTheme: (theme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu") => void;
    stickerPosition: "top_right" | "top_left" | "bottom_right";
    setStickerPosition: (pos: "top_right" | "top_left" | "bottom_right") => void;
    activeSalesSticker: string;
    setActiveSalesSticker: (stk: string) => void;
    enableSubtitles: boolean;
    setEnableSubtitles: (enable: boolean) => void;
    fontFamily: string;
    setFontFamily: (font: string) => void;
    subtitleStyle: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow";
    setSubtitleStyle: (style: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow") => void;
    textColor: string;
    setTextColor: (color: string) => void;
    textAnimationEffect: "tiktok_pop" | "karaoke_glow" | "bicolor_punch" | "fire_shake" | "box_pill" | "clean_fade";
    setTextAnimationEffect: (eff: "tiktok_pop" | "karaoke_glow" | "bicolor_punch" | "fire_shake" | "box_pill" | "clean_fade") => void;
    subtitleOffset: number;
    setSubtitleOffset: React.Dispatch<React.SetStateAction<number>>;
    fontSize: number;
    setFontSize: (sz: number) => void;
    textPosition: "bottom" | "center" | "top";
    setTextPosition: (pos: "bottom" | "center" | "top") => void;
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
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center">
                        <Tag className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 3: Tiêu Đề Hook & Phụ Đề Động</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                                B2B Video Branding
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Tiêu đề 3.5s đầu giữ chân người xem, huy hiệu chốt đơn sỉ và phụ đề động khớp giọng nói.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePreviewHookOnly}
                    className="px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Xem Thử Hook 3.5s Đầu</span>
                </button>
            </div>

            {/* SECTION 1: TIÊU ĐỀ HOOK 3.5S ĐẦU */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary-600" />
                        <span>Tiêu đề giật tít Hook ({hookDuration}s đầu video):</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showHookTitle}
                            onChange={(e) => setShowHookTitle(e.target.checked)}
                            className="accent-primary-600 rounded"
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
                            placeholder="Nhập tiêu đề Hook 3s đầu (VD: CONTAINER KHOAI MÔN CVT VỪA CẬP BẾN GIÁ SỈ TẬN KHO!)"
                            className="w-full p-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-primary-500 focus:outline-none leading-relaxed"
                        />

                        {/* Presets giật tít */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-600">Gợi ý mẫu Hook bán buôn:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {VIRAL_HOOK_PRESETS.map((tmpl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleHookTitleChange(tmpl.text)}
                                        className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-primary-400 hover:bg-primary-50 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                                    >
                                        {tmpl.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Hook Banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">Phong cách Hook:</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { id: "teal_lyhu", label: "Xanh LYHU (Brand)", desc: "Pill phẳng màu thương hiệu" },
                                        { id: "tiktok_sticker", label: "Đen TikTok (Creator)", desc: "Nền tối giản kính mờ viral" },
                                        { id: "red_orange", label: "Đỏ Bán Hàng (Deal)", desc: "Nổi bật, kích thích chốt đơn" },
                                        { id: "black_gold", label: "Trắng Tối Giản (Clean)", desc: "Phong cách tạp chí cao cấp" }
                                    ].map((thm) => (
                                        <button
                                            key={thm.id}
                                            type="button"
                                            onClick={() => setHookBannerTheme(thm.id as any)}
                                            className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                                                hookBannerTheme === thm.id
                                                    ? "bg-[#00afa9] text-white border-[#00afa9] font-bold shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="text-[11px] font-bold line-clamp-1">{thm.label}</div>
                                            <div className={`text-[10px] mt-0.5 ${hookBannerTheme === thm.id ? "text-white/80" : "text-slate-400"}`}>{thm.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">Thời lượng hiển thị:</label>
                                <select
                                    value={hookDuration}
                                    onChange={(e) => setHookDuration(parseFloat(e.target.value))}
                                    className="w-full p-2 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-800 outline-none focus:border-primary-500"
                                >
                                    <option value={2.5}>2.5s (Chớp nhoáng)</option>
                                    <option value={3.5}>3.5s (Chuẩn TikTok - Khuyên dùng)</option>
                                    <option value={4.5}>4.5s (Giữ lâu)</option>
                                    <option value={6.0}>6.0s (Cả video ngắn)</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* SECTION 2: HUY HIỆU BÁN HÀNG SỈ (SALES BADGE) */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-primary-600" />
                            <span>Huy Hiệu Chốt Đơn Sỉ (Sales Sticker):</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Sticker gắn cố định góc video để kích thích chủ quán nhắn tin lấy giá sỉ.
                        </p>
                    </div>

                    {/* Position Selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold">Vị trí:</span>
                        <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
                            <button
                                type="button"
                                onClick={() => setStickerPosition("top_right")}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                    stickerPosition === "top_right" ? "bg-primary-500 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Trên Phải
                            </button>
                            <button
                                type="button"
                                onClick={() => setStickerPosition("top_left")}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                    stickerPosition === "top_left" ? "bg-primary-500 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Trên Trái
                            </button>
                            <button
                                type="button"
                                onClick={() => setStickerPosition("bottom_right")}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                    stickerPosition === "bottom_right" ? "bg-primary-500 text-white" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Dưới Phải
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                        { id: "freeship", label: "FREESHIP TẬN QUÁN", sub: "Giao nhanh nội & ngoại thành", icon: "🚚" },
                        { id: "si_1_thung", label: "SỈ TỪ 1 THÙNG", sub: "Giá gốc xưởng lời x2", icon: "🏷️" },
                        { id: "san_kho", label: "SẴN KHO SỐ LƯỢNG", sub: "Date mới tinh 2026", icon: "📦" },
                        { id: "lai_x2", label: "LÃI GẤP ĐÔI", sub: "Chiết khấu cao đại lý", icon: "💰" },
                        { id: "inbox_cta", label: "MẪU THỬ MIỄN PHÍ", sub: "Gửi mẫu ăn thử tận quán", icon: "🎁" },
                        { id: "none", label: "TẮT HUY HIỆU", sub: "Không gắn lên video", icon: "✕" }
                    ].map((stk) => {
                        const isSelected = activeSalesSticker === stk.id;
                        return (
                            <button
                                key={stk.id}
                                type="button"
                                onClick={() => setActiveSalesSticker(stk.id)}
                                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? "bg-[#00afa9]/10 border-[#00afa9] text-slate-900 font-bold"
                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-sm mb-1">
                                    <span>{stk.icon}</span>
                                    <span className="text-[11px] font-bold line-clamp-1">{stk.label}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">{stk.sub}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SECTION 3: PHỤ ĐỀ ĐỘNG (KINETIC TYPOGRAPHY) */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-primary-600" />
                        <span>Phụ Đề Động & Hiệu Ứng Chữ (100% Khớp Tiếng Nói)</span>
                    </h3>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enableSubtitles}
                            onChange={(e) => setEnableSubtitles(e.target.checked)}
                            className="accent-primary-600 rounded"
                        />
                        <span>Bật Phụ Đề</span>
                    </label>
                </div>

                {enableSubtitles && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Font chữ */}
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">Kiểu Font chữ hiển thị:</label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-md bg-white outline-none text-xs font-semibold text-slate-800 focus:border-primary-500"
                                >
                                    <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro (Chuẩn Thương Hiệu LYHU)</option>
                                    <option value="Montserrat, sans-serif">Montserrat (Hiện đại TikTok & Reels)</option>
                                    <option value="'Arial Black', Impact, sans-serif">Arial Black / Impact (Dày dặn, bán hàng mạnh)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Chuẩn phát thanh viên)</option>
                                </select>
                            </div>

                            {/* Phong cách phụ đề */}
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">Màu sắc & Phong cách phụ đề:</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={subtitleStyle}
                                        onChange={(e) => setSubtitleStyle(e.target.value as any)}
                                        className="w-full p-2 border border-slate-200 rounded-md bg-white outline-none text-xs font-semibold text-slate-800 focus:border-primary-500"
                                    >
                                        <option value="tiktok_stroke">Viền đen đậm (TikTok Viral)</option>
                                        <option value="clean_shadow">Đổ bóng mờ tối giản</option>
                                        <option value="pill_dark">Hộp nền tối mờ (Chuyên nghiệp)</option>
                                        <option value="neon_glow">Phát sáng Neon</option>
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
                            <div className="space-y-1 sm:col-span-2">
                                <label className="font-semibold text-slate-700">
                                    Hiệu ứng xuất hiện chữ (Kinetic Typography):
                                </label>
                                <select
                                    value={textAnimationEffect}
                                    onChange={(e) => setTextAnimationEffect(e.target.value as any)}
                                    className="w-full p-2 border border-slate-200 rounded-md bg-white outline-none text-xs font-semibold text-slate-800 focus:border-primary-500"
                                >
                                    <option value="tiktok_pop">Nảy chữ từng từ CapCut (TikTok Pop Bounce - Khuyên dùng)</option>
                                    <option value="karaoke_glow">Karaoke Glow (Tô sáng & Chấm nhịp theo giọng đọc)</option>
                                    <option value="bicolor_punch">Hai màu tương phản (Vàng chanh + Trắng)</option>
                                    <option value="fire_shake">Dynamic Slam (Đập chữ dứt khoát)</option>
                                    <option value="box_pill">Hộp bo góc chữ tối giản</option>
                                    <option value="clean_fade">Chữ viền đen dày (Classic Bold)</option>
                                </select>
                            </div>

                            {/* Subtitle Sync Offset Slider */}
                            <div className="space-y-2 sm:col-span-2 p-3 rounded-lg bg-white border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-primary-600" />
                                        <span>Khớp giọng đọc chính xác (Độ trễ phụ đề +/- Offset):</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                                            {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(2)}s` : `${subtitleOffset.toFixed(2)}s`}
                                        </span>
                                        {subtitleOffset !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSubtitleOffset(0)}
                                                className="text-[10px] text-primary-600 hover:underline font-semibold"
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
                                    className="w-full accent-primary-600"
                                />
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>-2.0s (Chữ hiện sớm)</span>
                                    <span>0.0s (Chuẩn đồng bộ AI)</span>
                                    <span>+2.0s (Chữ hiện trễ)</span>
                                </div>
                                {/* Quick Nudge Buttons */}
                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                    <span className="text-[10px] text-slate-600 font-semibold mr-1">Chỉnh nhanh:</span>
                                    {[-0.2, -0.1, 0, 0.1, 0.2].map((offsetVal) => (
                                        <button
                                            key={offsetVal}
                                            type="button"
                                            onClick={() => setSubtitleOffset(offsetVal === 0 ? 0 : prev => +(prev + offsetVal).toFixed(2))}
                                            className={`px-2 py-0.5 rounded border text-[10px] font-semibold transition-colors cursor-pointer ${
                                                offsetVal === 0
                                                    ? "bg-primary-500 text-white border-primary-500"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            {offsetVal === 0 ? "0s (Chuẩn)" : offsetVal > 0 ? `+${offsetVal}s` : `${offsetVal}s`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Quick Picks */}
                            <div className="sm:col-span-2 flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500 font-medium">Màu nhanh:</span>
                                {[
                                    { name: "Vàng TikTok", hex: "#FACC15" },
                                    { name: "Xanh LYHU", hex: "#00AFA9" },
                                    { name: "Trắng", hex: "#FFFFFF" },
                                    { name: "Cam Sỉ", hex: "#FB923C" }
                                ].map((p) => (
                                    <button
                                        key={p.hex}
                                        type="button"
                                        onClick={() => setTextColor(p.hex)}
                                        className="px-2 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 hover:border-slate-400 bg-white"
                                        style={{ borderColor: textColor === p.hex ? "#00AFA9" : "#e2e8f0" }}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: p.hex }} />
                                        <span>{p.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Font Size & Position */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-slate-700">Kích thước chữ:</label>
                                    <span className="font-mono text-primary-700 font-bold">{fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={18}
                                    max={42}
                                    step={2}
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full accent-primary-600"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">Vị trí chữ trên video:</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {[
                                        { id: "top", label: "Trên cao" },
                                        { id: "center", label: "Chính giữa" },
                                        { id: "bottom", label: "Dưới đáy (Chuẩn)" }
                                    ].map((pos) => (
                                        <button
                                            key={pos.id}
                                            type="button"
                                            onClick={() => setTextPosition(pos.id as any)}
                                            className={`py-1.5 px-2 rounded-md border text-center text-xs transition-colors cursor-pointer ${
                                                textPosition === pos.id
                                                    ? "bg-primary-500 text-white border-primary-500 font-bold"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
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
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại Bước 2: Chọn Cảnh</span>
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                    <span>Tiếp tục: Bước 4 - Âm Thanh & Xuất Video</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
