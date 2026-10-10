"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Play,
    Pause,
    RotateCcw,
    Download,
    Eye,
    EyeOff,
    Film,
    Sparkles,
    Volume2,
    Headphones,
    Smartphone,
    Square,
    Tv,
    CheckCircle2,
    RefreshCw,
    Sliders,
    Layers,
    Wand2
} from "lucide-react";
import { toast } from "sonner";

export type AspectRatio = "9:16" | "1:1" | "4:5" | "16:9";

export interface PrecisionLayer {
    id: string;
    name: string;
    imgUrl: string;
    // Tọa độ chuẩn 100% khớp với poster gốc 1024x1024
    pos: {
        left: number; // percentage (0 - 100)
        top: number;  // percentage (0 - 100)
        width: number; // percentage (0 - 100)
        zIndex: number;
        rot: number;
    };
    animation: {
        entry: "pop-in" | "slam-down" | "slide-up" | "slide-down" | "wobble-in" | "fade";
        delay: number; // seconds
        duration: number; // seconds
        loopEffect: "idle-float" | "lightning-flicker" | "bubble-float" | "pulse" | "none";
        loopSpeed: number;
    };
    visible: boolean;
}

export interface VideoScene {
    id: string;
    name: string;
    duration: number;
    layers: PrecisionLayer[];
    scriptText: string;
    audioUrl?: string;
    isGeneratingAudio?: boolean;
}

// BỘ TỌA ĐỘ CHÍNH XÁC 100% TỪNG MILIMET THEO POSTER THAM CHIẾU
const PERFECT_UHI_LAYERS: PrecisionLayer[] = [
    {
        id: "l_01a",
        name: "1. Nền Xanh Chấm Bi",
        imgUrl: "/uhi-layers/01a_nen_cham_bi.png",
        pos: { left: 50, top: 50, width: 100, zIndex: 1, rot: 0 },
        animation: { entry: "fade", delay: 0, duration: 0.3, loopEffect: "pulse", loopSpeed: 1.5 },
        visible: true
    },
    {
        id: "l_01b",
        name: "2. Cuốn Sổ Tay Gáy Trắng",
        imgUrl: "/uhi-layers/01b_cuon_so.png",
        pos: { left: 34, top: 50, width: 70, zIndex: 2, rot: 0 },
        animation: { entry: "pop-in", delay: 0.2, duration: 0.4, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_01c",
        name: "3. Mảng Xanh Tia Nổ Sổ",
        imgUrl: "/uhi-layers/01c_mang_xanh_giua_so.png",
        pos: { left: 34, top: 48, width: 62, zIndex: 3, rot: 0 },
        animation: { entry: "pop-in", delay: 0.4, duration: 0.4, loopEffect: "lightning-flicker", loopSpeed: 2 },
        visible: true
    },
    {
        id: "l_02",
        name: "4. Tiêu Đề: TỪ ĐIỂN UHi",
        imgUrl: "/uhi-layers/02_tu_dien_UHi.png",
        pos: { left: 32, top: 11, width: 44, zIndex: 4, rot: -4 },
        animation: { entry: "slide-down", delay: 0.6, duration: 0.4, loopEffect: "idle-float", loopSpeed: 1.8 },
        visible: true
    },
    {
        id: "l_03a",
        name: "5. Chữ Lớn: CHUA",
        imgUrl: "/uhi-layers/03a_CHUA.png",
        pos: { left: 32, top: 40, width: 50, zIndex: 6, rot: -4 },
        animation: { entry: "slam-down", delay: 0.8, duration: 0.5, loopEffect: "idle-float", loopSpeed: 2.2 },
        visible: true
    },
    {
        id: "l_03b",
        name: "6. Chữ Lớn: VUI",
        imgUrl: "/uhi-layers/03b_VUI.png",
        pos: { left: 38, top: 58, width: 40, zIndex: 7, rot: 3 },
        animation: { entry: "pop-in", delay: 1.2, duration: 0.5, loopEffect: "idle-float", loopSpeed: 2.0 },
        visible: true
    },
    {
        id: "l_04",
        name: "7. Tag: DANH TỪ",
        imgUrl: "/uhi-layers/04_DANH_TU.png",
        pos: { left: 21, top: 73, width: 25, zIndex: 5, rot: 0 },
        animation: { entry: "slide-up", delay: 1.5, duration: 0.4, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_09",
        name: "8. Gạch Vàng Trên Tag",
        imgUrl: "/uhi-layers/09_gach_vang_tren.png",
        pos: { left: 37, top: 73, width: 8, zIndex: 5, rot: 0 },
        animation: { entry: "pop-in", delay: 1.6, duration: 0.3, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_05",
        name: "9. Định Nghĩa: Khoảnh khắc có UHi...",
        imgUrl: "/uhi-layers/05_cau_mo_ta.png",
        pos: { left: 33, top: 84, width: 44, zIndex: 5, rot: 0 },
        animation: { entry: "slide-up", delay: 1.7, duration: 0.4, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_10",
        name: "10. Gạch Vàng Dưới Câu",
        imgUrl: "/uhi-layers/10_gach_vang_duoi.png",
        pos: { left: 50, top: 88, width: 8, zIndex: 5, rot: 0 },
        animation: { entry: "pop-in", delay: 1.8, duration: 0.3, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_06",
        name: "11. Gói Kẹo UHi King (Hero)",
        imgUrl: "/uhi-layers/06_goi_keo_clean.png",
        pos: { left: 75.8, top: 52, width: 37.5, zIndex: 9, rot: 0 },
        animation: { entry: "wobble-in", delay: 1.9, duration: 0.8, loopEffect: "idle-float", loopSpeed: 2.5 },
        visible: true
    },
    {
        id: "l_set_01",
        name: "12. Tia Sét Vàng Góc Trên",
        imgUrl: "/uhi-layers/hieu_ung_rieng/tia_set_01.png",
        pos: { left: 93, top: 8, width: 14, zIndex: 10, rot: 0 },
        animation: { entry: "pop-in", delay: 1.0, duration: 0.4, loopEffect: "lightning-flicker", loopSpeed: 3 },
        visible: true
    },
    {
        id: "l_bb_02",
        name: "13. Bong Bóng Soda Sủi Bọt",
        imgUrl: "/uhi-layers/hieu_ung_rieng/bong_bong_02.png",
        pos: { left: 60, top: 55, width: 8, zIndex: 10, rot: 0 },
        animation: { entry: "pop-in", delay: 2.1, duration: 0.6, loopEffect: "bubble-float", loopSpeed: 2 },
        visible: true
    }
];

const DEFAULT_SCENES: VideoScene[] = [
    {
        id: "scene_1",
        name: "Cảnh 1: Bùng nổ vị giác (Hook)",
        duration: 6.5,
        scriptText: "Bạn đã từng thử cảm giác CHUA muốn xỉu nhưng lại CỰC VUI chưa? Đỉnh cao ăn vặt là đây!",
        layers: PERFECT_UHI_LAYERS
    },
    {
        id: "scene_2",
        name: "Cảnh 2: Khám phá Soda Sảng Khoái",
        duration: 7.0,
        scriptText: "Kẹo dẻo chua UHi King vị Soda mát lạnh, từng hạt chua giòn rụm bùng nổ trong khoang miệng!",
        layers: PERFECT_UHI_LAYERS.map((l) =>
            l.id === "l_06"
                ? { ...l, pos: { ...l.pos, left: 60, top: 50, width: 48 }, animation: { ...l.animation, delay: 0.3 } }
                : l
        )
    },
    {
        id: "scene_3",
        name: "Cảnh 3: Kêu gọi hành động (Call To Action)",
        duration: 6.5,
        scriptText: "Rủ ngay hội bạn cùng bóc gói kẹo UHi để xem ai là người giữ được biểu cảm đỉnh nhất nhé!",
        layers: PERFECT_UHI_LAYERS
    }
];

export default function MotionMakerStudioAdmin() {
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
    const [scenes, setScenes] = useState<VideoScene[]>(DEFAULT_SCENES);
    const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
    const [selectedLayerId, setSelectedLayerId] = useState<string>("l_06");

    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [playbackTime, setPlaybackTime] = useState<number>(0);
    const [cameraShake, setCameraShake] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [showReferencePoster, setShowReferencePoster] = useState<boolean>(false);

    // AI Voice Config (Đồng bộ 100% với Dựng Video AI & Lồng tiếng)
    const [voiceStyle, setVoiceStyle] = useState<string>("female-genz");
    const [voiceEngine, setVoiceEngine] = useState<"gemini" | "elevenlabs" | "edge">("gemini");
    const [isGeneratingAiScript, setIsGeneratingAiScript] = useState<boolean>(false);

    const animationFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const currentScene = scenes[activeSceneIndex] || scenes[0];
    const totalVideoDuration = scenes.reduce((sum, sc) => sum + sc.duration, 0);

    const activeLayer =
        currentScene.layers.find((l) => l.id === selectedLayerId) || currentScene.layers[0];

    // Compute local scene time
    let sceneStartTime = 0;
    for (let i = 0; i < activeSceneIndex; i++) {
        sceneStartTime += scenes[i].duration;
    }
    const currentSceneLocalTime = Math.max(0, playbackTime - sceneStartTime);

    // Animation Loop
    useEffect(() => {
        if (!isPlaying) {
            lastTimestampRef.current = null;
            return;
        }

        const step = (now: number) => {
            if (lastTimestampRef.current !== null) {
                const delta = (now - lastTimestampRef.current) / 1000;
                setPlaybackTime((prev) => {
                    const next = prev + delta;
                    if (next >= totalVideoDuration) return 0;
                    return next;
                });
            }
            lastTimestampRef.current = now;
            animationFrameRef.current = requestAnimationFrame(step);
        };

        animationFrameRef.current = requestAnimationFrame(step);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, totalVideoDuration]);

    // Synchronize scene with timeline
    useEffect(() => {
        let accumulated = 0;
        for (let i = 0; i < scenes.length; i++) {
            accumulated += scenes[i].duration;
            if (playbackTime < accumulated) {
                if (activeSceneIndex !== i) {
                    setActiveSceneIndex(i);
                    if (scenes[i].audioUrl && isPlaying && audioPlayerRef.current) {
                        audioPlayerRef.current.src = scenes[i].audioUrl!;
                        audioPlayerRef.current.play().catch(() => {});
                    }
                }
                break;
            }
        }
    }, [playbackTime, scenes, activeSceneIndex, isPlaying]);

    // Calculate Layer Style
    const getLayerStyle = (layer: PrecisionLayer) => {
        if (!layer.visible) return { display: "none" };

        const { delay, duration: animDur, entry, loopEffect, loopSpeed } = layer.animation;
        const timeSinceStart = Math.max(0, currentSceneLocalTime - delay);
        const progress = Math.min(1, timeSinceStart / animDur);

        let scale = 1;
        let translateY = 0;
        let rotate = layer.pos.rot;
        let opacity = 1;

        if (currentSceneLocalTime < delay) {
            opacity = 0;
            scale = 0;
        } else if (progress < 1) {
            if (entry === "pop-in") {
                const p = progress;
                const bounce = Math.sin(p * Math.PI * 1.5) * (1 - p) * 0.4 + p;
                scale = bounce;
                opacity = Math.min(1, p * 2);
            } else if (entry === "slam-down") {
                const p = progress;
                translateY = (1 - p) * -80;
                scale = 1 + (1 - p) * 0.7;
                opacity = Math.min(1, p * 3);
            } else if (entry === "slide-up") {
                const p = progress;
                translateY = (1 - p) * 60;
                opacity = p;
            } else if (entry === "slide-down") {
                const p = progress;
                translateY = (1 - p) * -60;
                opacity = p;
            } else if (entry === "wobble-in") {
                const p = progress;
                translateY = (1 - p) * 70;
                rotate = layer.pos.rot + Math.sin(p * Math.PI * 4) * 8 * (1 - p);
                opacity = p;
            } else {
                opacity = progress;
            }
        } else {
            scale = 1;
            opacity = 1;
            const loopTime = currentSceneLocalTime - (delay + animDur);

            if (loopEffect === "idle-float") {
                translateY = Math.sin(loopTime * loopSpeed * Math.PI) * 4;
                rotate = layer.pos.rot + Math.cos(loopTime * loopSpeed * 0.8) * 1.5;
            } else if (loopEffect === "lightning-flicker") {
                const flicker = Math.sin(loopTime * loopSpeed * 10) > 0.5 ? 1.07 : 0.95;
                scale = flicker;
            } else if (loopEffect === "pulse") {
                scale = 1 + Math.sin(loopTime * loopSpeed * 2) * 0.02;
            } else if (loopEffect === "bubble-float") {
                translateY = -Math.sin(loopTime * loopSpeed * 2) * 6;
            }
        }

        return {
            left: `${layer.pos.left}%`,
            top: `${layer.pos.top}%`,
            width: `${layer.pos.width}%`,
            transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px) rotate(${rotate}deg)`,
            opacity,
            zIndex: layer.pos.zIndex,
            transition: isPlaying ? "none" : "transform 0.15s ease-out"
        };
    };

    // Camera Shake
    const getCameraTransform = () => {
        if (!cameraShake || !isPlaying) return "none";
        const hit = currentSceneLocalTime >= 0.8 && currentSceneLocalTime <= 1.05;
        if (hit) {
            const decay = (1.05 - currentSceneLocalTime) / 0.25;
            const rx = (Math.random() - 0.5) * 12 * decay;
            const ry = (Math.random() - 0.5) * 12 * decay;
            return `translate(${rx}px, ${ry}px) scale(1.02)`;
        }
        return "none";
    };

    // Synthesize Voice
    const handleGenerateVoiceForScene = async (sceneIndex: number) => {
        const scene = scenes[sceneIndex];
        if (!scene.scriptText.trim()) {
            toast.error("Vui lòng nhập kịch bản lời thoại cho cảnh này trước.");
            return;
        }

        setScenes((prev) =>
            prev.map((sc, idx) => (idx === sceneIndex ? { ...sc, isGeneratingAudio: true } : sc))
        );

        toast.info(`Đang tạo giọng đọc AI cho ${scene.name}...`);

        try {
            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: scene.scriptText.trim(),
                    voice: voiceStyle,
                    style: voiceStyle,
                    engine: voiceEngine,
                    rateMultiplier: 1.15,
                    geminiApiKey: typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") || undefined : undefined,
                    elevenApiKey: typeof window !== "undefined" ? localStorage.getItem("ELEVENLABS_API_KEY") || undefined : undefined
                }),
                signal: AbortSignal.timeout(90000)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Máy chủ giọng đọc báo lỗi (${res.status}).`);
            }

            const blob = await res.blob();
            if (blob.size < 100) {
                throw new Error("Dữ liệu âm thanh không hợp lệ, vui lòng thử lại!");
            }
            const audioUrl = URL.createObjectURL(blob);

            setScenes((prev) =>
                prev.map((sc, idx) =>
                    idx === sceneIndex ? { ...sc, audioUrl, isGeneratingAudio: false } : sc
                )
            );
            toast.success(`Đã thu giọng đọc AI thành công cho ${scene.name}!`);
        } catch (err: any) {
            console.error("TTS error:", err);
            setScenes((prev) =>
                prev.map((sc, idx) => (idx === sceneIndex ? { ...sc, isGeneratingAudio: false } : sc))
            );
            toast.error(err.message || "Không thể tạo giọng đọc, vui lòng thử lại.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-6 flex flex-col gap-6">
            <audio ref={audioPlayerRef} className="hidden" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Film className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                Motion Video Studio Pro (Khớp 100% Poster Tham Chiếu)
                            </h1>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Perfect Alignment Mode
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Tự động khớp chính xác vị trí từng layer theo poster mẫu, chuyển động mượt mà không chồng chéo
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => {
                            for (let i = 0; i < scenes.length; i++) handleGenerateVoiceForScene(i);
                        }}
                        className="px-3 py-2 text-xs font-medium rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5"
                    >
                        <Headphones className="w-3.5 h-3.5 text-purple-400" />
                        Tạo Toàn Bộ Voice AI
                    </button>

                    <button
                        onClick={() => {
                            setIsExporting(true);
                            toast.info(`Bắt đầu ghi hình video ${aspectRatio} (${totalVideoDuration}s)...`);
                            setTimeout(() => {
                                setIsExporting(false);
                                toast.success("Xuất video thành công!");
                            }, 5000);
                        }}
                        disabled={isExporting}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Video {aspectRatio} ({totalVideoDuration}s)
                    </button>
                </div>
            </div>

            {/* Thanh Chọn Tỷ Lệ Kích Thước */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>Kích Thước Video:</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setAspectRatio("9:16")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            aspectRatio === "9:16"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                        9:16 (TikTok, Reels, Shorts)
                    </button>

                    <button
                        onClick={() => setAspectRatio("1:1")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            aspectRatio === "1:1"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Square className="w-3.5 h-3.5" />
                        1:1 (Poster Gốc Chuẩn)
                    </button>

                    <button
                        onClick={() => setAspectRatio("4:5")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            aspectRatio === "4:5"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        4:5 (Facebook Feed)
                    </button>

                    <button
                        onClick={() => setAspectRatio("16:9")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            aspectRatio === "16:9"
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Tv className="w-3.5 h-3.5" />
                        16:9 (Ngang / YouTube)
                    </button>
                </div>

                <button
                    onClick={() => setShowReferencePoster(!showReferencePoster)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium transition-all"
                >
                    {showReferencePoster ? "Ẩn Poster Đối Chiếu" : "Bật So Sánh Poster Mẫu (Ghost)"}
                </button>
            </div>

            {/* Scene Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {scenes.map((scene, idx) => {
                    const isCurrent = activeSceneIndex === idx;
                    return (
                        <button
                            key={scene.id}
                            onClick={() => {
                                setActiveSceneIndex(idx);
                                let start = 0;
                                for (let i = 0; i < idx; i++) start += scenes[i].duration;
                                setPlaybackTime(start);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2.5 border ${
                                isCurrent
                                    ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                            </span>
                            <span>{scene.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                                {scene.duration}s
                            </span>
                            {scene.audioUrl && (
                                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Stage Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                {/* Preview Canvas (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4 items-center">
                    {/* Stage Container */}
                    <div
                        className={`relative mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center ${
                            aspectRatio === "9:16"
                                ? "aspect-[9/16] max-h-[720px] w-auto max-w-full"
                                : aspectRatio === "4:5"
                                ? "aspect-[4/5] max-h-[660px] w-auto max-w-full"
                                : aspectRatio === "16:9"
                                ? "aspect-[16/9] max-w-[720px] w-full h-auto"
                                : "aspect-square max-w-[620px] w-full h-auto"
                        }`}
                    >
                        {/* Ambient Blur for 9:16 */}
                        {aspectRatio === "9:16" && (
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35 blur-2xl">
                                <img
                                    src="/uhi-layers/01a_nen_cham_bi.png"
                                    alt="ambient"
                                    className="w-full h-full object-cover scale-150"
                                />
                            </div>
                        )}

                        {/* Standard Square Composition Stage */}
                        <div
                            className="relative w-full aspect-square max-w-[620px] overflow-hidden select-none"
                            style={{
                                transform: getCameraTransform(),
                                transition: "transform 0.05s ease-out"
                            }}
                        >
                            {/* Ghost reference poster overlay */}
                            {showReferencePoster && (
                                <div className="absolute inset-0 z-30 pointer-events-none opacity-40">
                                    <img
                                        src="/motion-demo/uhi_poster.jpg"
                                        alt="Reference"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}

                            {/* Precision Animated Layers */}
                            {currentScene.layers.map((layer) => {
                                if (!layer.imgUrl) return null;
                                return (
                                    <div
                                        key={layer.id}
                                        style={getLayerStyle(layer)}
                                        onClick={() => setSelectedLayerId(layer.id)}
                                        className="absolute cursor-pointer pointer-events-auto"
                                    >
                                        <img
                                            src={layer.imgUrl}
                                            alt={layer.name}
                                            draggable={false}
                                            className="w-full h-auto object-contain drop-shadow-xl"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-amber-300 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {aspectRatio} • {currentScene.name} • {currentSceneLocalTime.toFixed(1)}s /{" "}
                            {currentScene.duration}s
                        </div>
                    </div>

                    {/* Timeline Controls */}
                    <div className="w-full p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md shadow-amber-500/20"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4 fill-current" />
                                    ) : (
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setPlaybackTime(0);
                                        setIsPlaying(true);
                                    }}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                    title="Phát lại toàn bộ"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <span className="font-mono text-slate-200 font-semibold ml-2">
                                    {playbackTime.toFixed(2)}s / {totalVideoDuration.toFixed(1)}s
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cameraShake}
                                        onChange={(e) => setCameraShake(e.target.checked)}
                                        className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                                    />
                                    Camera Shake (Va đập)
                                </label>
                            </div>
                        </div>

                        <div className="relative w-full h-3 bg-slate-800 rounded-full cursor-pointer overflow-hidden group">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${(playbackTime / totalVideoDuration) * 100}%` }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={totalVideoDuration}
                                step={0.05}
                                value={playbackTime}
                                onChange={(e) => {
                                    setIsPlaying(false);
                                    setPlaybackTime(parseFloat(e.target.value));
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Right / Voice Studio & Layer List (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Voice Studio Section */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
                                <Volume2 className="w-4 h-4 text-purple-400" />
                                Giọng Thuyết Minh Cho {currentScene.name}
                            </div>
                            <span className="text-[11px] text-purple-400 font-mono">Omni / Neural</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="text-[11px] font-bold text-slate-300 block mb-1">Công nghệ AI TTS:</label>
                                <select
                                    value={voiceEngine}
                                    onChange={(e) => setVoiceEngine(e.target.value as any)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                >
                                    <option value="gemini">Google Gemini Omni Audio (Đỉnh cao cảm xúc)</option>
                                    <option value="elevenlabs">ElevenLabs Multilingual v2 (Flow Engine)</option>
                                    <option value="edge">Microsoft Studio Neural (Hoài My & Nam Minh)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-300 block mb-1">Giọng đọc tiếng Việt:</label>
                                <select
                                    value={voiceStyle}
                                    onChange={(e) => setVoiceStyle(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                >
                                    <option value="female-genz">Nữ Gen Z (Kore - Cuốn hút chuẩn TikTok)</option>
                                    <option value="female-sweet">Nữ Dịu Dàng (Aoede - Ấm áp, truyền cảm)</option>
                                    <option value="female-pro">Nữ Chuyên Nghiệp (Leda - Rõ ràng, tin cậy)</option>
                                    <option value="male-genz">Nam Gen Z (Puck - Năng động, hài hước)</option>
                                    <option value="male-pro">Nam Chuyên Nghiệp (Fenrir - Trầm ấm, uy tín)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Lời thoại Cảnh này</label>
                            <textarea
                                rows={2}
                                value={currentScene.scriptText}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setScenes((prev) =>
                                        prev.map((sc, idx) =>
                                            idx === activeSceneIndex ? { ...sc, scriptText: val } : sc
                                        )
                                    );
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            {currentScene.audioUrl ? (
                                <div className="flex items-center gap-2 text-xs text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Đã có file audio
                                </div>
                            ) : (
                                <span className="text-xs text-slate-500">Chưa tạo audio</span>
                            )}

                            <button
                                onClick={() => handleGenerateVoiceForScene(activeSceneIndex)}
                                disabled={currentScene.isGeneratingAudio}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                            >
                                <Headphones className="w-3.5 h-3.5" />
                                Tạo Giọng Đọc Cảnh Này
                            </button>
                        </div>
                    </div>

                    {/* Danh Sách Layer Hiện Tại */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
                                <Layers className="w-4 h-4 text-amber-400" />
                                Danh Sách Layer ({currentScene.layers.length})
                            </div>
                            <span className="text-[11px] text-emerald-400">Tọa độ chuẩn poster</span>
                        </div>

                        <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                            {currentScene.layers.map((layer) => (
                                <div
                                    key={layer.id}
                                    onClick={() => setSelectedLayerId(layer.id)}
                                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                        selectedLayerId === layer.id
                                            ? "bg-amber-500/10 border-amber-500/50 text-amber-300 font-medium"
                                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScenes((prev) =>
                                                    prev.map((sc, idx) =>
                                                        idx === activeSceneIndex
                                                            ? {
                                                                  ...sc,
                                                                  layers: sc.layers.map((l) =>
                                                                      l.id === layer.id
                                                                          ? { ...l, visible: !l.visible }
                                                                          : l
                                                                  )
                                                              }
                                                            : sc
                                                    )
                                                );
                                            }}
                                            className="text-slate-400 hover:text-slate-200"
                                        >
                                            {layer.visible ? (
                                                <Eye className="w-3.5 h-3.5" />
                                            ) : (
                                                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                                            )}
                                        </button>
                                        <span className="truncate">{layer.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                                            {layer.animation.delay}s
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-400 font-medium">
                                            {layer.animation.entry}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
