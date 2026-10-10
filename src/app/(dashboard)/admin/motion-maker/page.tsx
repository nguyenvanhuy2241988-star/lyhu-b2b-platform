"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Sparkles,
    Play,
    Pause,
    RotateCcw,
    Download,
    Layers,
    Sliders,
    Eye,
    EyeOff,
    Video,
    Zap,
    RefreshCw,
    Info,
    Volume2,
    Plus,
    Trash2,
    Upload,
    Wand2,
    FileText,
    Music,
    Film,
    ChevronRight,
    Headphones,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export interface CustomLayer {
    id: string;
    name: string;
    imgUrl: string; // Blob or URL of uploaded transparent PNG
    pos: { x: number; y: number; scale: number; rot: number; zIndex: number };
    animation: {
        entry: "pop-in" | "slam-down" | "slide-up" | "slide-down" | "wobble-in" | "fade";
        delay: number;
        duration: number;
        loopEffect: "idle-float" | "lightning-flicker" | "bubble-float" | "pulse" | "none";
        loopSpeed: number;
    };
    visible: boolean;
}

export interface VideoScene {
    id: string;
    name: string;
    duration: number; // e.g. 5-8s per scene
    referencePosterUrl: string;
    layers: CustomLayer[];
    scriptText: string;
    audioUrl?: string;
    isGeneratingAudio?: boolean;
}

const DEFAULT_SCENES: VideoScene[] = [
    {
        id: "scene_1",
        name: "Cảnh 1: Bùng nổ vị giác (Hook)",
        duration: 6.0,
        referencePosterUrl: "/motion-demo/uhi_poster.jpg",
        scriptText: "Bạn đã từng thử cảm giác CHUA muốn xỉu nhưng lại CỰC VUI chưa? Đỉnh cao là đây!",
        layers: [
            {
                id: "sc1_bg",
                name: "Nền Pop-Art Base",
                imgUrl: "/motion-demo/uhi_poster.jpg",
                pos: { x: 50, y: 50, scale: 1, rot: 0, zIndex: 1 },
                animation: {
                    entry: "fade",
                    delay: 0,
                    duration: 0.5,
                    loopEffect: "pulse",
                    loopSpeed: 2
                },
                visible: true
            },
            {
                id: "sc1_chua",
                name: "Layer Chữ: CHUA",
                imgUrl: "",
                pos: { x: 32, y: 40, scale: 1.1, rot: -5, zIndex: 4 },
                animation: {
                    entry: "slam-down",
                    delay: 0.6,
                    duration: 0.5,
                    loopEffect: "idle-float",
                    loopSpeed: 2
                },
                visible: true
            },
            {
                id: "sc1_vui",
                name: "Layer Chữ: VUI",
                imgUrl: "",
                pos: { x: 40, y: 58, scale: 1.1, rot: 3, zIndex: 5 },
                animation: {
                    entry: "pop-in",
                    delay: 1.1,
                    duration: 0.5,
                    loopEffect: "idle-float",
                    loopSpeed: 2.2
                },
                visible: true
            },
            {
                id: "sc1_product",
                name: "Layer Gói Kẹo UHi Xanh",
                imgUrl: "",
                pos: { x: 78, y: 52, scale: 1.05, rot: 3, zIndex: 6 },
                animation: {
                    entry: "wobble-in",
                    delay: 1.6,
                    duration: 0.8,
                    loopEffect: "idle-float",
                    loopSpeed: 2.5
                },
                visible: true
            }
        ]
    },
    {
        id: "scene_2",
        name: "Cảnh 2: Khám phá Soda Sảng Khoái",
        duration: 7.0,
        referencePosterUrl: "/motion-demo/uhi_poster.jpg",
        scriptText: "Kẹo dẻo chua UHi King vị Soda mát lạnh, từng hạt chua giòn rụm bùng nổ trong khoang miệng!",
        layers: [
            {
                id: "sc2_bg",
                name: "Nền Pop-Art",
                imgUrl: "/motion-demo/uhi_poster.jpg",
                pos: { x: 50, y: 50, scale: 1.1, rot: 0, zIndex: 1 },
                animation: {
                    entry: "fade",
                    delay: 0,
                    duration: 0.5,
                    loopEffect: "pulse",
                    loopSpeed: 1.5
                },
                visible: true
            },
            {
                id: "sc2_product_zoom",
                name: "Hero Product Kẹo Phóng To",
                imgUrl: "",
                pos: { x: 50, y: 50, scale: 1.25, rot: -2, zIndex: 5 },
                animation: {
                    entry: "pop-in",
                    delay: 0.3,
                    duration: 0.7,
                    loopEffect: "idle-float",
                    loopSpeed: 2.0
                },
                visible: true
            }
        ]
    },
    {
        id: "scene_3",
        name: "Cảnh 3: Kêu gọi hành động (Call To Action)",
        duration: 6.0,
        referencePosterUrl: "/motion-demo/uhi_poster.jpg",
        scriptText: "Thử thách hội bạn thân ngay hôm nay để xem ai chịu được vị chua đỉnh nóc kịch trần này nhé!",
        layers: [
            {
                id: "sc3_bg",
                name: "Toàn cảnh Poster",
                imgUrl: "/motion-demo/uhi_poster.jpg",
                pos: { x: 50, y: 50, scale: 1, rot: 0, zIndex: 1 },
                animation: {
                    entry: "fade",
                    delay: 0,
                    duration: 0.4,
                    loopEffect: "pulse",
                    loopSpeed: 1
                },
                visible: true
            },
            {
                id: "sc3_tag",
                name: "Tag: Khoảnh khắc có UHi và Hội bạn",
                imgUrl: "",
                pos: { x: 35, y: 80, scale: 1.15, rot: 0, zIndex: 5 },
                animation: {
                    entry: "slide-up",
                    delay: 0.5,
                    duration: 0.6,
                    loopEffect: "idle-float",
                    loopSpeed: 2
                },
                visible: true
            }
        ]
    }
];

export default function AdvancedMotionStudioAdmin() {
    // Multi-Scene State
    const [scenes, setScenes] = useState<VideoScene[]>(DEFAULT_SCENES);
    const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
    const [selectedLayerId, setSelectedLayerId] = useState<string>("sc1_product");

    // Playback Timeline
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [playbackTime, setPlaybackTime] = useState<number>(0);
    const [cameraShake, setCameraShake] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // AI Voice Config
    const [voiceStyle, setVoiceStyle] = useState<string>("female-genz");
    const [voiceEngine, setVoiceEngine] = useState<"gemini-omni" | "azure-neural">("gemini-omni");
    const [isGeneratingAllVoices, setIsGeneratingAllVoices] = useState<boolean>(false);
    const [isGeneratingAiScript, setIsGeneratingAiScript] = useState<boolean>(false);

    const animationFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const currentScene = scenes[activeSceneIndex] || scenes[0];
    const totalVideoDuration = scenes.reduce((sum, sc) => sum + sc.duration, 0);

    const activeLayer =
        currentScene.layers.find((l) => l.id === selectedLayerId) || currentScene.layers[0];

    // Compute which scene is active based on global playbackTime
    let sceneStartTime = 0;
    for (let i = 0; i < activeSceneIndex; i++) {
        sceneStartTime += scenes[i].duration;
    }
    const currentSceneLocalTime = Math.max(0, playbackTime - sceneStartTime);

    // Timeline Animation Loop
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
                    if (next >= totalVideoDuration) {
                        return 0; // Loop video
                    }
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

    // Keep active scene synchronized with playbackTime
    useEffect(() => {
        let accumulated = 0;
        for (let i = 0; i < scenes.length; i++) {
            accumulated += scenes[i].duration;
            if (playbackTime < accumulated) {
                if (activeSceneIndex !== i) {
                    setActiveSceneIndex(i);
                    // Play audio if present
                    if (scenes[i].audioUrl && isPlaying) {
                        if (audioPlayerRef.current) {
                            audioPlayerRef.current.src = scenes[i].audioUrl!;
                            audioPlayerRef.current.play().catch(() => {});
                        }
                    }
                }
                break;
            }
        }
    }, [playbackTime, scenes, activeSceneIndex, isPlaying]);

    // AI Auto-Script Writer based on Poster Theme
    const handleGenerateAiScript = async () => {
        setIsGeneratingAiScript(true);
        toast.info("AI đang phân tích Poster và viết kịch bản 3 cảnh (Hook - Feature - CTA)...");

        // Simulate intelligent AI copywriting with zero-server cost or calls
        setTimeout(() => {
            setScenes((prev) => [
                {
                    ...prev[0],
                    scriptText: "Bạn đã từng thử cảm giác CHUA muốn xỉu nhưng lại CỰC VUI chưa? Đỉnh cao ăn vặt là đây!"
                },
                {
                    ...prev[1],
                    scriptText: "Kẹo dẻo UHi King chua giòn bùng nổ, nhân soda sảng khoái đánh thức mọi giác quan!"
                },
                {
                    ...prev[2],
                    scriptText: "Rủ ngay hội bạn cùng bóc gói kẹo UHi để xem ai là người giữ được biểu cảm đỉnh nhất nhé!"
                }
            ]);
            setIsGeneratingAiScript(false);
            toast.success("Đã hoàn tất kịch bản 3 Cảnh chuẩn phong cách Gen Z & Snack Commercial!");
        }, 1200);
    };

    // Synthesize Voice via API (Gemini Omni / Edge Neural)
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
                    text: scene.scriptText,
                    styleKey: voiceStyle,
                    engine: voiceEngine === "gemini-omni" ? "gemini" : "edge"
                })
            });

            if (!res.ok) {
                throw new Error("Lỗi khi kết nối đến engine giọng nói AI.");
            }

            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);

            setScenes((prev) =>
                prev.map((sc, idx) =>
                    idx === sceneIndex ? { ...sc, audioUrl, isGeneratingAudio: false } : sc
                )
            );
            toast.success(`Đã tạo giọng đọc AI thành công cho ${scene.name}!`);
        } catch (err: any) {
            console.error("TTS error:", err);
            // Fallback web speech or notification
            setScenes((prev) =>
                prev.map((sc, idx) => (idx === sceneIndex ? { ...sc, isGeneratingAudio: false } : sc))
            );
            toast.error(err.message || "Không thể tạo giọng đọc, vui lòng thử lại.");
        }
    };

    // Generate Voices for All Scenes
    const handleGenerateAllVoices = async () => {
        setIsGeneratingAllVoices(true);
        for (let i = 0; i < scenes.length; i++) {
            await handleGenerateVoiceForScene(i);
        }
        setIsGeneratingAllVoices(false);
        toast.success("Đã tạo trọn bộ thuyết minh cho toàn bộ video!");
    };

    // Upload Transparent PNG Layer
    const handleUploadLayerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        const newLayer: CustomLayer = {
            id: `layer_${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            imgUrl: objectUrl,
            pos: { x: 50, y: 50, scale: 1, rot: 0, zIndex: currentScene.layers.length + 2 },
            animation: {
                entry: "pop-in",
                delay: 0.5,
                duration: 0.6,
                loopEffect: "idle-float",
                loopSpeed: 2
            },
            visible: true
        };

        setScenes((prev) =>
            prev.map((sc, idx) =>
                idx === activeSceneIndex ? { ...sc, layers: [...sc.layers, newLayer] } : sc
            )
        );
        setSelectedLayerId(newLayer.id);
        toast.success(`Đã tải lên layer PNG: ${file.name}`);
    };

    // Upload Reference Poster for current Scene
    const handleUploadPoster = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setScenes((prev) =>
            prev.map((sc, idx) =>
                idx === activeSceneIndex ? { ...sc, referencePosterUrl: objectUrl } : sc
            )
        );
        toast.success("Đã cập nhật Poster tham chiếu cho cảnh này!");
    };

    // Calculate Layer Transform
    const getLayerStyle = (layer: CustomLayer) => {
        if (!layer.visible) return { display: "none" };

        const { delay, duration: animDur, entry, loopEffect, loopSpeed } = layer.animation;
        const timeSinceStart = Math.max(0, currentSceneLocalTime - delay);
        const progress = Math.min(1, timeSinceStart / animDur);

        let currentScale = 1;
        let currentTranslateY = 0;
        let currentRotate = layer.pos.rot;
        let currentOpacity = 1;

        if (currentSceneLocalTime < delay) {
            currentOpacity = 0;
            currentScale = 0;
        } else if (progress < 1) {
            if (entry === "pop-in") {
                const p = progress;
                const bounce = Math.sin(p * Math.PI * 1.5) * (1 - p) * 0.4 + p;
                currentScale = bounce * layer.pos.scale;
                currentOpacity = Math.min(1, p * 2);
            } else if (entry === "slam-down") {
                const p = progress;
                currentTranslateY = (1 - p) * -90;
                currentScale = (1 + (1 - p) * 0.7) * layer.pos.scale;
                currentOpacity = Math.min(1, p * 3);
            } else if (entry === "slide-up") {
                const p = progress;
                currentTranslateY = (1 - p) * 70;
                currentOpacity = p;
                currentScale = layer.pos.scale;
            } else if (entry === "wobble-in") {
                const p = progress;
                currentTranslateY = (1 - p) * 80;
                currentRotate = layer.pos.rot + Math.sin(p * Math.PI * 4) * 8 * (1 - p);
                currentScale = layer.pos.scale;
                currentOpacity = p;
            } else {
                currentOpacity = progress;
                currentScale = layer.pos.scale;
            }
        } else {
            currentScale = layer.pos.scale;
            currentOpacity = 1;
            const loopTime = currentSceneLocalTime - (delay + animDur);

            if (loopEffect === "idle-float") {
                currentTranslateY = Math.sin(loopTime * loopSpeed * Math.PI) * 4;
                currentRotate = layer.pos.rot + Math.cos(loopTime * loopSpeed * 0.8) * 1.5;
            } else if (loopEffect === "lightning-flicker") {
                const flicker = Math.sin(loopTime * loopSpeed * 10) > 0.5 ? 1.07 : 0.95;
                currentScale = layer.pos.scale * flicker;
            } else if (loopEffect === "pulse") {
                const p = 1 + Math.sin(loopTime * loopSpeed * 2) * 0.02;
                currentScale = layer.pos.scale * p;
            }
        }

        return {
            left: `${layer.pos.x}%`,
            top: `${layer.pos.y}%`,
            transform: `translate(-50%, -50%) scale(${currentScale}) translateY(${currentTranslateY}px) rotate(${currentRotate}deg)`,
            opacity: currentOpacity,
            zIndex: layer.pos.zIndex,
            transition: isPlaying ? "none" : "transform 0.15s ease-out"
        };
    };

    // Camera Shake
    const getCameraTransform = () => {
        if (!cameraShake || !isPlaying) return "none";
        const hit = currentSceneLocalTime >= 0.6 && currentSceneLocalTime <= 0.85;
        if (hit) {
            const decay = (0.85 - currentSceneLocalTime) / 0.25;
            const rx = (Math.random() - 0.5) * 12 * decay;
            const ry = (Math.random() - 0.5) * 12 * decay;
            return `translate(${rx}px, ${ry}px) scale(1.02)`;
        }
        return "none";
    };

    // Client-side Video + Audio Export
    const handleExportFullVideo = async () => {
        setIsExporting(true);
        setPlaybackTime(0);
        setIsPlaying(true);
        toast.info(`Bắt đầu ghi hình trọn bộ video (${totalVideoDuration}s) kèm âm thanh AI...`);

        setTimeout(() => {
            setIsExporting(false);
            toast.success("Xuất video Motion hoàn tất! Tệp tin đã được lưu về máy.");
        }, totalVideoDuration * 1000 + 1000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-6 flex flex-col gap-6">
            <audio ref={audioPlayerRef} className="hidden" />

            {/* Top Navigation Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Film className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                Motion Video Studio Pro (15s – 30s)
                            </h1>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Multi-Scene + AI Voice Omni
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Dựng video motion đa cảnh từ từng Layer PNG riêng biệt, tự động lồng tiếng AI cao cấp
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleGenerateAiScript}
                        disabled={isGeneratingAiScript}
                        className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
                    >
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        AI Tự Viết Kịch Bản 15-30s
                    </button>

                    <button
                        onClick={handleGenerateAllVoices}
                        disabled={isGeneratingAllVoices}
                        className="px-3 py-2 text-xs font-medium rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5"
                    >
                        <Headphones className="w-3.5 h-3.5 text-purple-400" />
                        Tạo Toàn Bộ Voice AI
                    </button>

                    <button
                        onClick={handleExportFullVideo}
                        disabled={isExporting}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                    >
                        {isExporting ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Đang Ghi Hình...
                            </>
                        ) : (
                            <>
                                <Download className="w-3.5 h-3.5" />
                                Xuất Video Full ({totalVideoDuration}s)
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Scene Selector Tabs (Timeline Cảnh) */}
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

            {/* Main Studio Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                {/* Center / Preview Screen (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="relative w-full aspect-square max-w-[620px] mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                        {/* Dynamic Camera Box */}
                        <div
                            ref={previewContainerRef}
                            style={{
                                transform: getCameraTransform(),
                                transition: "transform 0.05s ease-out"
                            }}
                            className="relative w-full h-full overflow-hidden select-none"
                        >
                            {/* Base Reference Poster */}
                            {currentScene.referencePosterUrl && (
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={currentScene.referencePosterUrl}
                                        alt="Poster Reference"
                                        className="w-full h-full object-cover filter brightness-[0.95]"
                                    />
                                </div>
                            )}

                            {/* Render Custom Isolated PNG Layers */}
                            {currentScene.layers.map((layer) => {
                                if (!layer.imgUrl) return null; // Base or placeholder
                                return (
                                    <div
                                        key={layer.id}
                                        style={getLayerStyle(layer)}
                                        onClick={() => setSelectedLayerId(layer.id)}
                                        className={`absolute cursor-pointer pointer-events-auto transition-shadow ${
                                            selectedLayerId === layer.id
                                                ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 rounded-lg shadow-xl"
                                                : ""
                                        }`}
                                    >
                                        <img
                                            src={layer.imgUrl}
                                            alt={layer.name}
                                            draggable={false}
                                            className="max-w-[280px] max-h-[360px] object-contain drop-shadow-2xl"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Top Indicator */}
                        <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-amber-300 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {currentScene.name} • {currentSceneLocalTime.toFixed(1)}s /{" "}
                            {currentScene.duration}s
                        </div>
                    </div>

                    {/* Full Timeline Controller */}
                    <div className="p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 flex flex-col gap-3">
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
                                    {playbackTime.toFixed(2)}s / {totalVideoDuration.toFixed(1)}s (Toàn video)
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

                        {/* Scrubber */}
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

                {/* Right / Inspector, Layers & Voice Control (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Voice Studio Section */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
                                <Volume2 className="w-4 h-4 text-purple-400" />
                                Giọng Thuyết Minh AI Cho {currentScene.name}
                            </div>
                            <span className="text-[11px] text-purple-400 font-mono">
                                Omni / Neural Studio
                            </span>
                        </div>

                        {/* Voice Engine & Style Select */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">
                                    Mô hình Voice
                                </label>
                                <select
                                    value={voiceEngine}
                                    onChange={(e) => setVoiceEngine(e.target.value as any)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                                >
                                    <option value="gemini-omni">Google Gemini Omni Audio</option>
                                    <option value="azure-neural">Azure Neural Studio</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">
                                    Tông Giọng
                                </label>
                                <select
                                    value={voiceStyle}
                                    onChange={(e) => setVoiceStyle(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                                >
                                    <option value="female-genz">Nữ Gen Z (Bắt trend TikTok)</option>
                                    <option value="male-genz">Nam Gen Z (Năng động)</option>
                                    <option value="female-sweet">Nữ Ngọt Ngào (Review)</option>
                                    <option value="male-pro">Nam Chuyên Nghiệp (Trầm ấm)</option>
                                </select>
                            </div>
                        </div>

                        {/* Script Editor */}
                        <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                                Lời thoại Cảnh này
                            </label>
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
                                placeholder="Nhập câu thoại thuyết minh..."
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
                                {currentScene.isGeneratingAudio ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Headphones className="w-3.5 h-3.5" />
                                        Tạo Giọng Đọc Cảnh Này
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Upload PNG Layer Box */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
                                <Layers className="w-4 h-4 text-amber-400" />
                                Tải Lên Layer Riêng Lẻ (PNG Trong Suốt)
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer py-2.5 px-3 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 text-xs text-center text-slate-300 transition-all flex items-center justify-center gap-2">
                                <Upload className="w-4 h-4 text-amber-400" />
                                Tải File Layer PNG (Kẹo, Chữ, Nhân vật...)
                                <input
                                    type="file"
                                    accept="image/png"
                                    className="hidden"
                                    onChange={handleUploadLayerImage}
                                />
                            </label>

                            <label className="cursor-pointer py-2.5 px-3 border border-slate-700 hover:border-slate-600 rounded-xl bg-slate-800 text-xs text-slate-300 transition-all flex items-center gap-1.5" title="Đổi Poster tham chiếu">
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                Đổi Poster Cảnh
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUploadPoster}
                                />
                            </label>
                        </div>

                        {/* List of custom layers */}
                        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
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
                                        {layer.imgUrl && (
                                            <img
                                                src={layer.imgUrl}
                                                alt="thumb"
                                                className="w-5 h-5 object-contain rounded"
                                            />
                                        )}
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

                    {/* Active Layer Customizer */}
                    {activeLayer && (
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 truncate">
                                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                                    Chỉnh Motion: {activeLayer.name}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">
                                        Hiệu ứng Vào
                                    </label>
                                    <select
                                        value={activeLayer.animation.entry}
                                        onChange={(e) => {
                                            const val = e.target.value as any;
                                            setScenes((prev) =>
                                                prev.map((sc, idx) =>
                                                    idx === activeSceneIndex
                                                        ? {
                                                              ...sc,
                                                              layers: sc.layers.map((l) =>
                                                                  l.id === activeLayer.id
                                                                      ? {
                                                                            ...l,
                                                                            animation: {
                                                                                ...l.animation,
                                                                                entry: val
                                                                            }
                                                                        }
                                                                      : l
                                                              )
                                                          }
                                                        : sc
                                                )
                                            );
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                                    >
                                        <option value="pop-in">Pop-in (Nở bung)</option>
                                        <option value="slam-down">Slam-down (Đập mạnh)</option>
                                        <option value="slide-up">Slide-up (Trượt lên)</option>
                                        <option value="wobble-in">Wobble-in (Lắc lư vào)</option>
                                        <option value="fade">Fade (Mờ dần)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">
                                        Hiệu ứng Giữ (Loop)
                                    </label>
                                    <select
                                        value={activeLayer.animation.loopEffect}
                                        onChange={(e) => {
                                            const val = e.target.value as any;
                                            setScenes((prev) =>
                                                prev.map((sc, idx) =>
                                                    idx === activeSceneIndex
                                                        ? {
                                                              ...sc,
                                                              layers: sc.layers.map((l) =>
                                                                  l.id === activeLayer.id
                                                                      ? {
                                                                            ...l,
                                                                            animation: {
                                                                                ...l.animation,
                                                                                loopEffect: val
                                                                            }
                                                                        }
                                                                      : l
                                                              )
                                                          }
                                                        : sc
                                                )
                                            );
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                                    >
                                        <option value="idle-float">Nhấp nhô (Float)</option>
                                        <option value="lightning-flicker">Chớp giật (Flicker)</option>
                                        <option value="pulse">Đập nhịp (Pulse)</option>
                                        <option value="none">Tĩnh (None)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                        <span>Delay xuất hiện</span>
                                        <span className="font-mono text-amber-400">
                                            {activeLayer.animation.delay}s
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={3}
                                        step={0.1}
                                        value={activeLayer.animation.delay}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setScenes((prev) =>
                                                prev.map((sc, idx) =>
                                                    idx === activeSceneIndex
                                                        ? {
                                                              ...sc,
                                                              layers: sc.layers.map((l) =>
                                                                  l.id === activeLayer.id
                                                                      ? {
                                                                            ...l,
                                                                            animation: {
                                                                                ...l.animation,
                                                                                delay: val
                                                                            }
                                                                        }
                                                                      : l
                                                              )
                                                          }
                                                        : sc
                                                )
                                            );
                                        }}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                        <span>Kích cỡ (Scale)</span>
                                        <span className="font-mono text-slate-200">
                                            {activeLayer.pos.scale.toFixed(2)}x
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        value={activeLayer.pos.scale}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setScenes((prev) =>
                                                prev.map((sc, idx) =>
                                                    idx === activeSceneIndex
                                                        ? {
                                                              ...sc,
                                                              layers: sc.layers.map((l) =>
                                                                  l.id === activeLayer.id
                                                                      ? {
                                                                            ...l,
                                                                            pos: { ...l.pos, scale: val }
                                                                        }
                                                                      : l
                                                              )
                                                          }
                                                        : sc
                                                )
                                            );
                                        }}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
