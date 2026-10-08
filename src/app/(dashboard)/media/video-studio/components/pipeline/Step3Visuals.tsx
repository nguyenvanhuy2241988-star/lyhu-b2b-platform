import React, { useState } from "react";
import {
    Tag,
    Sparkles,
    Palette,
    Sliders,
    Play,
    ArrowLeft,
    ArrowRight,
    Wand2,
    Check,
    Layers,
    Smile,
    Flame,
    Crown,
    Store,
    Feather
} from "lucide-react";
import { VIRAL_HOOK_PRESETS } from "../../lib/constants";
import { SubtitleCue } from "../../types";

interface Step3VisualsProps {
    handlePreviewHookOnly: () => void;
    hookDuration: number;
    setHookDuration: (d: number) => void;
    showHookTitle: boolean;
    setShowHookTitle: (show: boolean) => void;
    customHookTitle: string;
    handleHookTitleChange: (val: string) => void;
    hookBannerTheme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu" | "cyber_yellow";
    setHookBannerTheme: (theme: "tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu" | "cyber_yellow") => void;
    hookTagText?: string;
    setHookTagText?: (val: string) => void;
    hookPositionOffsetY?: number;
    setHookPositionOffsetY?: (val: number) => void;

    // Brand Badge
    showWatermark: boolean;
    setShowWatermark: (show: boolean) => void;
    brandText?: string;
    setBrandText?: (val: string) => void;
    brandSubtitle?: string;
    setBrandSubtitle?: (val: string) => void;
    brandStyle?: "glass_dark" | "teal_brand" | "gold_luxury" | "white_clean";
    setBrandStyle?: (style: "glass_dark" | "teal_brand" | "gold_luxury" | "white_clean") => void;
    brandPosition?: "top_left" | "top_right" | "bottom_left";
    setBrandPosition?: (pos: "top_left" | "top_right" | "bottom_left") => void;

    // Sales Sticker
    stickerPosition: "top_right" | "top_left" | "bottom_right";
    setStickerPosition: (pos: "top_right" | "top_left" | "bottom_right") => void;
    activeSalesSticker: string;
    setActiveSalesSticker: (stk: string) => void;
    customStickerTitle?: string;
    setCustomStickerTitle?: (val: string) => void;
    customStickerSubtitle?: string;
    setCustomStickerSubtitle?: (val: string) => void;
    customStickerIcon?: string;
    setCustomStickerIcon?: (val: string) => void;
    stickerStyle?: "emerald_deal" | "teal_lyhu" | "fire_sale" | "amber_gold" | "cyber_purple";
    setStickerStyle?: (style: "emerald_deal" | "teal_lyhu" | "fire_sale" | "amber_gold" | "cyber_purple") => void;

    // 1-Click Pro Preset
    onApplyProPreset?: (presetId: "tiktok_creator" | "lyhu_b2b" | "flash_sale" | "editorial_luxury") => void;

    // Subtitles
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
    subtitleCues?: SubtitleCue[];
    onAutoAlignSubtitles?: () => void;
    isAligningSubtitles?: boolean;
    onSeekCue?: (time: number) => void;
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
    hookTagText = "🔥 VIRAL TREND",
    setHookTagText,
    hookPositionOffsetY = 0.118,
    setHookPositionOffsetY,

    showWatermark,
    setShowWatermark,
    brandText = "LYHU!",
    setBrandText,
    brandSubtitle = "• Tổng Kho Sỉ B2B",
    setBrandSubtitle,
    brandStyle = "glass_dark",
    setBrandStyle,
    brandPosition = "top_left",
    setBrandPosition,

    stickerPosition,
    setStickerPosition,
    activeSalesSticker,
    setActiveSalesSticker,
    customStickerTitle = "FREESHIP TẬN QUÁN",
    setCustomStickerTitle,
    customStickerSubtitle = "Giao nhanh nội thành & tỉnh",
    setCustomStickerSubtitle,
    customStickerIcon = "🚚",
    setCustomStickerIcon,
    stickerStyle = "emerald_deal",
    setStickerStyle,

    onApplyProPreset,

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
    subtitleCues = [],
    onAutoAlignSubtitles,
    isAligningSubtitles = false,
    onSeekCue,
    onPrev,
    onNext
}) => {
    const [showCuesList, setShowCuesList] = useState(false);
    const [activeDesignTab, setActiveDesignTab] = useState<"presets" | "brand" | "sales" | "hook" | "subtitles">("presets");

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#00afa9]/10 text-[#00afa9] border border-[#00afa9]/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 3: Thiết Kế Đồ Họa, Huy Hiệu & Tiêu Đề Hook</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#00afa9]/10 text-[#00afa9] border border-[#00afa9]/30">
                                Visual Studio Pro
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Công cụ thiết kế tân tiến: Tùy biến huy hiệu thương hiệu, sticker chốt đơn & tiêu đề hook 3.5s đầu.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePreviewHookOnly}
                    className="px-3.5 py-1.5 bg-[#00afa9] hover:bg-[#00afa9]/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
                >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Xem Thử Hook 3.5s Đầu</span>
                </button>
            </div>

            {/* TAB SELECTOR FOR VISUAL DESIGN STUDIO */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                    type="button"
                    onClick={() => setActiveDesignTab("presets")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeDesignTab === "presets"
                            ? "bg-white text-[#00afa9] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5 text-[#00afa9]" />
                    <span>Gói Phong Cách 1-Click</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveDesignTab("brand")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeDesignTab === "brand"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Store className="w-3.5 h-3.5 text-primary-500" />
                    <span>Huy Hiệu Thương Hiệu</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveDesignTab("sales")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeDesignTab === "sales"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Huy Hiệu Chốt Đơn Sỉ</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveDesignTab("hook")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeDesignTab === "hook"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tiêu Đề Hook 3.5s</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveDesignTab("subtitles")}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeDesignTab === "subtitles"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    <Palette className="w-3.5 h-3.5 text-sky-500" />
                    <span>Phụ Đề Động</span>
                </button>
            </div>

            {/* TAB 1: 1-CLICK PRO DESIGN PRESETS */}
            {activeDesignTab === "presets" && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-amber-500" />
                                <span>Gói Phong Cách Đồng Bộ 1-Click (Pro Design Bundles):</span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Áp dụng tức thì cả 3 thành phần (Huy hiệu thương hiệu + Huy hiệu deal sỉ + Tiêu đề Hook).
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {[
                            {
                                id: "tiktok_creator",
                                title: "🌟 TikTok Creator Viral",
                                desc: "Kính mờ Dark Glass, Tag Viral chói, Freeship xanh lá neon",
                                tag: "Chuẩn Xu Hướng 2026",
                                badgeCol: "bg-slate-900 text-yellow-300",
                                onClick: () => onApplyProPreset?.("tiktok_creator")
                            },
                            {
                                id: "lyhu_b2b",
                                title: "🚀 LYHU B2B Official Brand",
                                desc: "Xanh ngọc thương hiệu #00afa9, Tag Kho Sỉ, Sỉ Từ 1 Thùng",
                                tag: "Chuẩn Thương Hiệu",
                                badgeCol: "bg-[#00afa9] text-white",
                                onClick: () => onApplyProPreset?.("lyhu_b2b")
                            },
                            {
                                id: "flash_sale",
                                title: "🔥 Flash Sale Xả Kho Cực Đại",
                                desc: "Đỏ cam giật tít chốt đơn, viền vàng kim, chiết khấu x2",
                                tag: "Kích Thích Mua Ngay",
                                badgeCol: "bg-red-600 text-white",
                                onClick: () => onApplyProPreset?.("flash_sale")
                            },
                            {
                                id: "editorial_luxury",
                                title: "✨ Clean Editorial Luxury",
                                desc: "Nền trắng chữ đen tối giản, tag tinh tế, mẫu thử miễn phí",
                                tag: "Tạp Chí Cao Cấp",
                                badgeCol: "bg-white text-slate-900 border border-slate-300",
                                onClick: () => onApplyProPreset?.("editorial_luxury")
                            }
                        ].map((bundle) => (
                            <button
                                key={bundle.id}
                                type="button"
                                onClick={bundle.onClick}
                                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#00afa9] hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#00afa9] transition-colors">
                                            {bundle.title}
                                        </h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${bundle.badgeCol}`}>
                                            {bundle.tag}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        {bundle.desc}
                                    </p>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#00afa9] font-bold">
                                    <span>Áp dụng gói này</span>
                                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: BRAND BADGE (HUY HIỆU THƯƠNG HIỆU - GÓC TRÁI) */}
            {activeDesignTab === "brand" && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Store className="w-4 h-4 text-[#00afa9]" />
                                <span>Huy Hiệu Thương Hiệu (Brand Badge - Góc Trái):</span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Định vị tên kho bãi, logo & khẩu hiệu uy tín xuyên suốt video.
                            </p>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showWatermark}
                                onChange={(e) => setShowWatermark(e.target.checked)}
                                className="accent-[#00afa9] rounded"
                            />
                            <span>Bật Huy Hiệu</span>
                        </label>
                    </div>

                    {showWatermark && (
                        <div className="space-y-3 pt-1">
                            {/* Text Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-700">Tên Thương Hiệu (In Đậm):</label>
                                    <input
                                        type="text"
                                        value={brandText}
                                        onChange={(e) => setBrandText?.(e.target.value)}
                                        placeholder="VD: LYHU!, BOYO!, KHO SỈ CVT"
                                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:border-[#00afa9] outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-700">Khẩu Hiệu / Mô Tả Phụ:</label>
                                    <input
                                        type="text"
                                        value={brandSubtitle}
                                        onChange={(e) => setBrandSubtitle?.(e.target.value)}
                                        placeholder="VD: • Tổng Kho Sỉ B2B, • Hotline: 09xx"
                                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:border-[#00afa9] outline-none"
                                    />
                                </div>
                            </div>

                            {/* Style Selector */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700">Phong Cách Thiết Kế:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {[
                                        { id: "glass_dark", label: "Kính Mờ Dark Glass", desc: "Slate 900 mờ kính viền trắng" },
                                        { id: "teal_brand", label: "Xanh LYHU Brand", desc: "Nền ngọc #00afa9 rực rỡ" },
                                        { id: "gold_luxury", label: "Đen Vàng Kim Luxury", desc: "Đen tuyền viền vàng VIP" },
                                        { id: "white_clean", label: "Trắng Tạp Chí Minimal", desc: "Nền trắng phẳng tinh tế" }
                                    ].map((st) => (
                                        <button
                                            key={st.id}
                                            type="button"
                                            onClick={() => setBrandStyle?.(st.id as any)}
                                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                                brandStyle === st.id
                                                    ? "bg-[#00afa9] text-white border-[#00afa9] font-bold shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="text-[11px] font-bold">{st.label}</div>
                                            <div className={`text-[10px] mt-0.5 ${brandStyle === st.id ? "text-white/80" : "text-slate-400"}`}>{st.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Position Selector */}
                            <div className="flex items-center gap-2 pt-1 text-xs">
                                <span className="text-slate-600 font-semibold">Vị trí góc:</span>
                                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                                    {[
                                        { id: "top_left", label: "Trên Trái (Chuẩn)" },
                                        { id: "top_right", label: "Trên Phải" },
                                        { id: "bottom_left", label: "Dưới Trái" }
                                    ].map((pos) => (
                                        <button
                                            key={pos.id}
                                            type="button"
                                            onClick={() => setBrandPosition?.(pos.id as any)}
                                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                                brandPosition === pos.id ? "bg-[#00afa9] text-white" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: SALES BADGE (HUY HIỆU CHỐT ĐƠN SỈ - GÓC PHẢI) */}
            {activeDesignTab === "sales" && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Huy Hiệu Chốt Đơn Sỉ (Sales Deal Pill - Góc Phải):</span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Kích thích khách buôn nhắn tin ngay (Freeship, Chiết khấu, Mẫu thử).
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
                                        stickerPosition === "top_right" ? "bg-[#00afa9] text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Trên Phải
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStickerPosition("bottom_right")}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                        stickerPosition === "bottom_right" ? "bg-[#00afa9] text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Dưới Phải
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSalesSticker("none")}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                        activeSalesSticker === "none" ? "bg-red-500 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Tắt Huy Hiệu
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeSalesSticker !== "none" && (
                        <div className="space-y-3 pt-1">
                            {/* Preset Buttons */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {[
                                    { id: "freeship", label: "FREESHIP TẬN QUÁN", sub: "Giao nhanh nội & ngoại thành", icon: "🚚", style: "emerald_deal" },
                                    { id: "si_1_thung", label: "SỈ TỪ 1 THÙNG", sub: "Giá gốc xưởng lời x2", icon: "🏷️", style: "teal_lyhu" },
                                    { id: "san_kho", label: "SẴN KHO SỐ LƯỢNG", sub: "Date mới tinh 2026", icon: "📦", style: "amber_gold" },
                                    { id: "lai_x2", label: "LÃI GẤP ĐÔI", sub: "Chiết khấu cao đại lý", icon: "💰", style: "fire_sale" },
                                    { id: "inbox_cta", label: "MẪU THỬ MIỄN PHÍ", sub: "Gửi mẫu ăn thử tận quán", icon: "🎁", style: "cyber_purple" }
                                ].map((stk) => {
                                    const isSelected = activeSalesSticker === stk.id;
                                    return (
                                        <button
                                            key={stk.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveSalesSticker(stk.id);
                                                setCustomStickerTitle?.(stk.label);
                                                setCustomStickerSubtitle?.(stk.sub);
                                                setCustomStickerIcon?.(stk.icon);
                                                setStickerStyle?.(stk.style as any);
                                            }}
                                            className={`p-2 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                                                isSelected
                                                    ? "bg-[#00afa9]/10 border-[#00afa9] text-slate-900 font-bold shadow-2xs"
                                                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-xs mb-1">
                                                <span>{stk.icon}</span>
                                                <span className="text-[11px] font-bold line-clamp-1">{stk.label}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 line-clamp-1">{stk.sub}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Direct Customization: Title, Subtitle, Icon, Style */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 text-xs">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                    <span>Tự do chỉnh sửa nội dung & màu sắc:</span>
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Tiêu đề huy hiệu:</label>
                                        <input
                                            type="text"
                                            value={customStickerTitle}
                                            onChange={(e) => setCustomStickerTitle?.(e.target.value)}
                                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold text-slate-800 outline-none focus:border-[#00afa9]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Phụ đề mô tả:</label>
                                        <input
                                            type="text"
                                            value={customStickerSubtitle}
                                            onChange={(e) => setCustomStickerSubtitle?.(e.target.value)}
                                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-800 outline-none focus:border-[#00afa9]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Biểu tượng Icon:</label>
                                        <div className="flex items-center gap-1">
                                            {["🚚", "🏷️", "📦", "🔥", "💰", "🎁", "✨"].map((ic) => (
                                                <button
                                                    key={ic}
                                                    type="button"
                                                    onClick={() => setCustomStickerIcon?.(ic)}
                                                    className={`w-7 h-7 rounded border flex items-center justify-center text-xs transition-colors cursor-pointer ${
                                                        customStickerIcon === ic ? "border-[#00afa9] bg-[#00afa9]/10 font-bold" : "border-slate-200 bg-white hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {ic}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Style Gradient Selector */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <span className="text-[11px] text-slate-600 font-medium">Màu sắc:</span>
                                    {[
                                        { id: "emerald_deal", label: "Xanh Lá Deal", bg: "bg-emerald-600" },
                                        { id: "teal_lyhu", label: "Xanh Ngọc LYHU", bg: "bg-[#00afa9]" },
                                        { id: "fire_sale", label: "Đỏ Cam Flash Sale", bg: "bg-red-600" },
                                        { id: "amber_gold", label: "Vàng Kim VIP", bg: "bg-amber-600" },
                                        { id: "cyber_purple", label: "Tím Cyber", bg: "bg-purple-600" }
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setStickerStyle?.(c.id as any)}
                                            className={`px-2 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                                stickerStyle === c.id ? "border-slate-800 bg-slate-100 font-bold" : "border-slate-200 bg-white"
                                            }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                                            <span>{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: VIRAL HOOK TITLE 3.5S ĐẦU */}
            {activeDesignTab === "hook" && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-amber-500" />
                                <span>Tiêu Đề Giật Tít Hook ({hookDuration}s đầu video):</span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                3 giây vàng giữ chân người xem TikTok / Reels không lướt qua.
                            </p>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showHookTitle}
                                onChange={(e) => setShowHookTitle(e.target.checked)}
                                className="accent-[#00afa9] rounded"
                            />
                            <span>Bật Tiêu Đề Hook</span>
                        </label>
                    </div>

                    {showHookTitle && (
                        <div className="space-y-3 pt-1">
                            {/* Text Area */}
                            <textarea
                                rows={2}
                                value={customHookTitle}
                                onChange={(e) => handleHookTitleChange(e.target.value)}
                                placeholder="Nhập tiêu đề Hook 3s đầu (VD: CONTAINER KHOAI MÔN CVT VỪA CẬP BẾN GIÁ SỈ TẬN KHO!)"
                                className="w-full p-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-[#00afa9] focus:outline-none leading-relaxed"
                            />

                            {/* Tag Pill Input */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-700">Tag Nhỏ Giật Tít Trên Đỉnh:</label>
                                    <input
                                        type="text"
                                        value={hookTagText}
                                        onChange={(e) => setHookTagText?.(e.target.value)}
                                        placeholder="VD: 🔥 VIRAL TREND, ⚡ GIÁ SỈ TẬN KHO..."
                                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:border-[#00afa9] outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-700">Thời lượng hiển thị:</label>
                                    <select
                                        value={hookDuration}
                                        onChange={(e) => setHookDuration(parseFloat(e.target.value))}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#00afa9]"
                                    >
                                        <option value={2.5}>2.5s (Chớp nhoáng)</option>
                                        <option value={3.5}>3.5s (Chuẩn TikTok - Khuyên dùng)</option>
                                        <option value={4.5}>4.5s (Giữ lâu)</option>
                                        <option value={6.0}>6.0s (Cả video ngắn)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Presets giật tít */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-slate-600">Gợi ý mẫu Hook bán buôn:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {VIRAL_HOOK_PRESETS.map((tmpl, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleHookTitleChange(tmpl.text)}
                                            className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-[#00afa9] hover:bg-[#00afa9]/5 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                                        >
                                            {tmpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Theme Hook Banner */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                                <label className="font-semibold text-slate-700">Phong cách hiển thị Hook Banner:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[
                                        { id: "tiktok_sticker", label: "Đen TikTok Creator", desc: "Kính mờ viền neon viral" },
                                        { id: "teal_lyhu", label: "Xanh LYHU Brand", desc: "Xanh ngọc thương hiệu" },
                                        { id: "red_orange", label: "Đỏ Bán Hàng", desc: "Bùng nổ kích thích chốt đơn" },
                                        { id: "black_gold", label: "Trắng Tạp Chí", desc: "Tối giản sang trọng" },
                                        { id: "cyber_yellow", label: "Vàng Hot Trend", desc: "Streetwear Food viral" }
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

                            {/* Vertical Position Offset (Y-axis) */}
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-700">Độ cao vị trí Hook trên video:</span>
                                    <span className="font-mono text-slate-500 font-bold">{Math.round(hookPositionOffsetY * 100)}% màn hình</span>
                                </div>
                                <input
                                    type="range"
                                    min={0.08}
                                    max={0.22}
                                    step={0.01}
                                    value={hookPositionOffsetY}
                                    onChange={(e) => setHookPositionOffsetY?.(parseFloat(e.target.value))}
                                    className="w-full accent-[#00afa9] cursor-pointer"
                                />
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>Đẩy sát mép trên</span>
                                    <span>Chuẩn an toàn (Không che mặt)</span>
                                    <span>Hạ thấp xuống</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 5: KINETIC SUBTITLES (PHỤ ĐỀ ĐỘNG) */}
            {activeDesignTab === "subtitles" && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Palette className="w-4 h-4 text-[#00afa9]" />
                            <span>Phụ Đề Động & Hiệu Ứng Chữ (100% Khớp Tiếng Nói)</span>
                        </h3>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enableSubtitles}
                                onChange={(e) => setEnableSubtitles(e.target.checked)}
                                className="accent-[#00afa9] rounded"
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
                                        className="w-full p-2 border border-slate-200 rounded-md bg-white outline-none text-xs font-semibold text-slate-800 focus:border-[#00afa9]"
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
                                            className="w-full p-2 border border-slate-200 rounded-md bg-white outline-none text-xs font-semibold text-slate-800 focus:border-[#00afa9]"
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
                                        className="w-full p-2 border border-slate-200 rounded-md bg-white outline-none text-xs font-semibold text-slate-800 focus:border-[#00afa9]"
                                    >
                                        <option value="tiktok_pop">Nảy chữ từng từ CapCut (TikTok Pop Bounce - Khuyên dùng)</option>
                                        <option value="karaoke_glow">Karaoke Glow (Tô sáng & Chấm nhịp theo giọng đọc)</option>
                                        <option value="bicolor_punch">Hai màu tương phản (Vàng chanh + Trắng)</option>
                                        <option value="fire_shake">Dynamic Slam (Đập chữ dứt khoát)</option>
                                        <option value="box_pill">Hộp bo góc chữ tối giản</option>
                                        <option value="clean_fade">Chữ viền đen dày (Classic Bold)</option>
                                    </select>
                                </div>

                                {/* AI Voice Silence & Waveform Alignment */}
                                <div className="sm:col-span-2 p-3.5 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-white border border-teal-200 space-y-2.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 font-bold text-xs text-teal-900">
                                                <Sparkles className="w-4 h-4 text-teal-600" />
                                                <span>AI Đồng Bộ Phụ Đề Theo Giọng (Waveform Silence Sync)</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">Khớp 100%</span>
                                            </div>
                                            <p className="text-[11px] text-teal-700">
                                                Tự động quét khoảng lặng thực tế trong audio để khớp từng câu chữ, triệt tiêu hoàn toàn hiện tượng chữ chạy lệch tiếng.
                                            </p>
                                        </div>

                                        {onAutoAlignSubtitles && (
                                            <button
                                                type="button"
                                                onClick={onAutoAlignSubtitles}
                                                disabled={isAligningSubtitles}
                                                className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                                            >
                                                {isAligningSubtitles ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span>Đang phân tích audio...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 className="w-3.5 h-3.5" />
                                                        <span>Khớp Giọng Ngay</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Collapsible Cues List */}
                                    {subtitleCues && subtitleCues.length > 0 && (
                                        <div className="pt-2 border-t border-teal-200/60 space-y-2">
                                            <div className="flex items-center justify-between text-xs text-teal-800 font-semibold">
                                                <span>Danh sách các cụm phụ đề ({subtitleCues.length} cụm):</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCuesList(!showCuesList)}
                                                    className="text-[11px] text-teal-700 hover:underline cursor-pointer"
                                                >
                                                    {showCuesList ? "Thu gọn ▲" : "Xem chi tiết ▼"}
                                                </button>
                                            </div>

                                            {showCuesList && (
                                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                                    {subtitleCues.map((cue, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => onSeekCue?.(cue.start)}
                                                            className="p-2 rounded-lg bg-white/90 border border-teal-100 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer flex items-center justify-between text-xs group"
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0 font-bold">
                                                                    {cue.start.toFixed(1)}s - {cue.end.toFixed(1)}s
                                                                </span>
                                                                <span className="text-slate-800 font-medium truncate">
                                                                    "{cue.text}"
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                Nhấn để xem ▶
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Subtitle Sync Offset Slider */}
                                <div className="space-y-2 sm:col-span-2 p-3 rounded-lg bg-white border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                                            <Sliders className="w-3.5 h-3.5 text-[#00afa9]" />
                                            <span>Khớp giọng đọc chính xác (Độ trễ phụ đề +/- Offset):</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-[#00afa9] bg-[#00afa9]/10 px-2 py-0.5 rounded border border-[#00afa9]/30">
                                                {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(2)}s` : `${subtitleOffset.toFixed(2)}s`}
                                            </span>
                                            {subtitleOffset !== 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSubtitleOffset(0)}
                                                    className="text-[10px] text-[#00afa9] hover:underline font-semibold"
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
                                        className="w-full accent-[#00afa9]"
                                    />
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>-2.0s (Chữ hiện sớm)</span>
                                        <span>0.0s (Chuẩn đồng bộ AI)</span>
                                        <span>+2.0s (Chữ hiện trễ)</span>
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
                                        <span className="font-mono text-[#00afa9] font-bold">{fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={18}
                                        max={42}
                                        step={2}
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full accent-[#00afa9]"
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
                                                        ? "bg-[#00afa9] text-white border-[#00afa9] font-bold"
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
            )}

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
                    className="px-4 py-2 rounded-lg bg-[#00afa9] hover:bg-[#00afa9]/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                    <span>Tiếp tục: Bước 4 - Âm Thanh & Xuất Video</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
