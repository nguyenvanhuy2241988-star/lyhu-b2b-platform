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
    CheckCircle2,
    FolderArchive,
    FolderUp
} from "lucide-react";
import { toast } from "sonner";

export interface CustomLayer {
    id: string;
    name: string;
    imgUrl: string;
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
    duration: number;
    referencePosterUrl: string;
    layers: CustomLayer[];
    scriptText: string;
    audioUrl?: string;
    isGeneratingAudio?: boolean;
}

// Chuẩn hóa vị trí và thứ tự các layer theo HUONG_DAN.txt của bộ layer UHi
const BUILT_IN_UHI_LAYERS: CustomLayer[] = [
    {
        id: "l_01a",
        name: "01a. Nền xanh chấm bi",
        imgUrl: "/uhi-layers/01a_nen_cham_bi.png",
        pos: { x: 50, y: 50, scale: 1, rot: 0, zIndex: 1 },
        animation: { entry: "fade", delay: 0, duration: 0.4, loopEffect: "pulse", loopSpeed: 1.5 },
        visible: true
    },
    {
        id: "l_01b",
        name: "01b. Cuốn sổ tay",
        imgUrl: "/uhi-layers/01b_cuon_so.png",
        pos: { x: 42, y: 50, scale: 0.98, rot: 0, zIndex: 2 },
        animation: { entry: "pop-in", delay: 0.2, duration: 0.5, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_01c",
        name: "01c. Mảng xanh tia nổ",
        imgUrl: "/uhi-layers/01c_mang_xanh_giua_so.png",
        pos: { x: 38, y: 46, scale: 1.05, rot: 0, zIndex: 3 },
        animation: { entry: "pop-in", delay: 0.4, duration: 0.5, loopEffect: "lightning-flicker", loopSpeed: 2 },
        visible: true
    },
    {
        id: "l_02",
        name: "02. Tiêu đề TỪ ĐIỂN UHi",
        imgUrl: "/uhi-layers/02_tu_dien_UHi.png",
        pos: { x: 32, y: 12, scale: 0.95, rot: -2, zIndex: 4 },
        animation: { entry: "slide-down", delay: 0.6, duration: 0.4, loopEffect: "idle-float", loopSpeed: 1.8 },
        visible: true
    },
    {
        id: "l_03a",
        name: "03a. Chữ 'CHUA' Vàng Comic",
        imgUrl: "/uhi-layers/03a_CHUA.png",
        pos: { x: 32, y: 38, scale: 1.08, rot: -4, zIndex: 6 },
        animation: { entry: "slam-down", delay: 0.8, duration: 0.5, loopEffect: "idle-float", loopSpeed: 2.2 },
        visible: true
    },
    {
        id: "l_03b",
        name: "03b. Chữ 'VUI' Vàng Comic",
        imgUrl: "/uhi-layers/03b_VUI.png",
        pos: { x: 38, y: 57, scale: 1.08, rot: 3, zIndex: 7 },
        animation: { entry: "pop-in", delay: 1.2, duration: 0.5, loopEffect: "idle-float", loopSpeed: 2.0 },
        visible: true
    },
    {
        id: "l_04",
        name: "04. Nhãn DANH TỪ",
        imgUrl: "/uhi-layers/04_DANH_TU.png",
        pos: { x: 23, y: 73, scale: 0.95, rot: 0, zIndex: 5 },
        animation: { entry: "slide-up", delay: 1.5, duration: 0.4, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_05",
        name: "05. Câu mô tả",
        imgUrl: "/uhi-layers/05_cau_mo_ta.png",
        pos: { x: 32, y: 84, scale: 0.95, rot: 0, zIndex: 5 },
        animation: { entry: "slide-up", delay: 1.7, duration: 0.4, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_08",
        name: "08. Bóng đen gói kẹo",
        imgUrl: "/uhi-layers/08_bong_goi_keo.png",
        pos: { x: 77, y: 92, scale: 1, rot: 0, zIndex: 8 },
        animation: { entry: "fade", delay: 1.9, duration: 0.3, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_06",
        name: "06. Gói kẹo UHi King (Hero)",
        imgUrl: "/uhi-layers/06_goi_keo_UHi.png",
        pos: { x: 77, y: 52, scale: 1.04, rot: 2, zIndex: 9 },
        animation: { entry: "wobble-in", delay: 2.0, duration: 0.8, loopEffect: "idle-float", loopSpeed: 2.5 },
        visible: true
    },
    {
        id: "l_09",
        name: "09. Gạch vàng trên",
        imgUrl: "/uhi-layers/09_gach_vang_tren.png",
        pos: { x: 38, y: 73, scale: 0.95, rot: 0, zIndex: 5 },
        animation: { entry: "pop-in", delay: 2.3, duration: 0.3, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_10",
        name: "10. Gạch vàng dưới",
        imgUrl: "/uhi-layers/10_gach_vang_duoi.png",
        pos: { x: 50, y: 88, scale: 0.95, rot: 0, zIndex: 5 },
        animation: { entry: "pop-in", delay: 2.4, duration: 0.3, loopEffect: "none", loopSpeed: 1 },
        visible: true
    },
    {
        id: "l_set_01",
        name: "Tia sét góc phải trên",
        imgUrl: "/uhi-layers/hieu_ung_rieng/tia_set_01.png",
        pos: { x: 92, y: 10, scale: 1.1, rot: 5, zIndex: 10 },
        animation: { entry: "pop-in", delay: 1.0, duration: 0.4, loopEffect: "lightning-flicker", loopSpeed: 3 },
        visible: true
    },
    {
        id: "l_bb_02",
        name: "Bong bóng Soda sủi bọt",
        imgUrl: "/uhi-layers/hieu_ung_rieng/bong_bong_02.png",
        pos: { x: 62, y: 58, scale: 1, rot: 0, zIndex: 10 },
        animation: { entry: "pop-in", delay: 2.2, duration: 0.6, loopEffect: "bubble-float", loopSpeed: 2 },
        visible: true
    }
];

const DEFAULT_SCENES: VideoScene[] = [
    {
        id: "scene_1",
        name: "Cảnh 1: Bùng nổ vị giác (Hook)",
        duration: 6.5,
        referencePosterUrl: "/motion-demo/uhi_poster.jpg",
        scriptText: "Bạn đã từng thử cảm giác CHUA muốn xỉu nhưng lại CỰC VUI chưa? Đỉnh cao ăn vặt là đây!",
        layers: BUILT_IN_UHI_LAYERS
    },
    {
        id: "scene_2",
        name: "Cảnh 2: Khám phá Soda Sảng Khoái",
        duration: 7.0,
        referencePosterUrl: "/motion-demo/uhi_poster.jpg",
        scriptText: "Kẹo dẻo chua UHi King vị Soda mát lạnh, từng hạt chua giòn rụm bùng nổ trong khoang miệng!",
        layers: BUILT_IN_UHI_LAYERS.map((l) =>
            l.id === "l_06"
                ? { ...l, pos: { ...l.pos, scale: 1.25, x: 55, y: 50 }, animation: { ...l.animation, delay: 0.3 } }
                : l
        )
    },
    {
        id: "scene_3",
        name: "Cảnh 3: Kêu gọi hành động (Call To Action)",
        duration: 6.5,
        referencePosterUrl: "/motion-demo/uhi_poster.jpg",
        scriptText: "Rủ ngay hội bạn cùng bóc gói kẹo UHi để xem ai là người giữ được biểu cảm đỉnh nhất nhé!",
        layers: BUILT_IN_UHI_LAYERS
    }
];

export default function AdvancedMotionStudioAdmin() {
    // Multi-Scene State
    const [scenes, setScenes] = useState<VideoScene[]>(DEFAULT_SCENES);
    const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
    const [selectedLayerId, setSelectedLayerId] = useState<string>("l_06");

    // Playback Timeline
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [playbackTime, setPlaybackTime] = useState<number>(0);
    const [cameraShake, setCameraShake] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [showReferencePoster, setShowReferencePoster] = useState<boolean>(false);
    const [guideText, setGuideText] = useState<string>(
        "Thứ tự dựng: nền chấm bi → sổ → mảng xanh → bóng gói → chữ/gạch vàng → gói kẹo → hiệu ứng tia sét và bọt khí."
    );

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

    // Compute scene local time
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

    // TẢI HÀNG LOẠT FILE LAYER PNG (Batch Upload)
    const handleBatchLayerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const newLayers: CustomLayer[] = [];

        fileArray.forEach((file, idx) => {
            if (file.name.endsWith(".txt")) {
                // Đọc file hướng dẫn tự động
                const reader = new FileReader();
                reader.onload = (re) => {
                    const text = re.target?.result as string;
                    if (text) {
                        setGuideText(text);
                        toast.success("AI đã tiếp nhận và đọc tệp HƯỚNG DẪN dựng!");
                    }
                };
                reader.readAsText(file);
                return;
            }

            if (!file.type.startsWith("image/")) return;

            const objectUrl = URL.createObjectURL(file);
            const fileName = file.name.replace(/\.[^/.]+$/, "");

            // Thông minh: Phán đoán vai trò layer theo tên file
            let zIndex = 5;
            let delay = 0.5 + idx * 0.15;
            let entry: CustomLayer["animation"]["entry"] = "pop-in";
            let loopEffect: CustomLayer["animation"]["loopEffect"] = "idle-float";

            if (fileName.includes("nen") || fileName.includes("01a")) {
                zIndex = 1;
                delay = 0;
                entry = "fade";
                loopEffect = "pulse";
            } else if (fileName.includes("so") || fileName.includes("01b")) {
                zIndex = 2;
                delay = 0.2;
                entry = "pop-in";
            } else if (fileName.includes("CHUA") || fileName.includes("03a")) {
                zIndex = 6;
                delay = 0.8;
                entry = "slam-down";
            } else if (fileName.includes("VUI") || fileName.includes("03b")) {
                zIndex = 7;
                delay = 1.2;
                entry = "pop-in";
            } else if (fileName.includes("keo") || fileName.includes("06")) {
                zIndex = 9;
                delay = 1.8;
                entry = "wobble-in";
            } else if (fileName.includes("set") || fileName.includes("tia")) {
                zIndex = 10;
                delay = 1.0;
                entry = "pop-in";
                loopEffect = "lightning-flicker";
            }

            newLayers.push({
                id: `batch_${Date.now()}_${idx}`,
                name: fileName,
                imgUrl: objectUrl,
                pos: { x: 50, y: 50, scale: 1, rot: 0, zIndex },
                animation: { entry, delay, duration: 0.5, loopEffect, loopSpeed: 2 },
                visible: true
            });
        });

        if (newLayers.length > 0) {
            setScenes((prev) =>
                prev.map((sc, idx) =>
                    idx === activeSceneIndex ? { ...sc, layers: [...sc.layers, ...newLayers] } : sc
                )
            );
            toast.success(`Đã nạp thành công ${newLayers.length} layer PNG vào cảnh hiện tại!`);
        }
    };

    // AI Auto-Script Writer
    const handleGenerateAiScript = () => {
        setIsGeneratingAiScript(true);
        toast.info("AI đang phân tích Poster và viết kịch bản 3 cảnh (Hook - Feature - CTA)...");

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
        }, 800);
    };

    // Synthesize Voice via API
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

            if (!res.ok) throw new Error("Lỗi kết nối giọng nói AI");

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
            setScenes((prev) =>
                prev.map((sc, idx) => (idx === sceneIndex ? { ...sc, isGeneratingAudio: false } : sc))
            );
            toast.error(err.message || "Không thể tạo giọng đọc, vui lòng thử lại.");
        }
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
            } else if (entry === "slide-down") {
                const p = progress;
                currentTranslateY = (1 - p) * -70;
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
            } else if (loopEffect === "bubble-float") {
                currentTranslateY = -Math.sin(loopTime * loopSpeed * 2) * 6;
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
        const hit = currentSceneLocalTime >= 0.8 && currentSceneLocalTime <= 1.05;
        if (hit) {
            const decay = (1.05 - currentSceneLocalTime) / 0.25;
            const rx = (Math.random() - 0.5) * 12 * decay;
            const ry = (Math.random() - 0.5) * 12 * decay;
            return `translate(${rx}px, ${ry}px) scale(1.02)`;
        }
        return "none";
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
                                Motion Video Studio Pro (Hỗ Trợ Tải Hàng Loạt Layer)
                            </h1>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Batch Upload + AI Guidance
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Tự động nhận diện thư mục layer tách lớp, đọc hướng dẫn dựng và khớp timeline 15s - 30s
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
                            toast.info(`Bắt đầu ghi hình video ${totalVideoDuration}s...`);
                            setTimeout(() => {
                                setIsExporting(false);
                                toast.success("Xuất video thành công!");
                            }, 5000);
                        }}
                        disabled={isExporting}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Video Full ({totalVideoDuration}s)
                    </button>
                </div>
            </div>

            {/* AI Guidance Box (Hướng Dẫn Dựng Tự Động) */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-amber-200/90 leading-relaxed">
                    <strong>AI Note / Hướng Dẫn Kỹ Thuật:</strong> {guideText}
                </div>
                <button
                    onClick={() => setShowReferencePoster(!showReferencePoster)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium transition-all shrink-0"
                >
                    {showReferencePoster ? "Ẩn Poster Gốc" : "So Sánh Poster Gốc"}
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
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="relative w-full aspect-square max-w-[620px] mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                        <div
                            ref={previewContainerRef}
                            style={{
                                transform: getCameraTransform(),
                                transition: "transform 0.05s ease-out"
                            }}
                            className="relative w-full h-full overflow-hidden select-none"
                        >
                            {/* So sánh Poster Gốc mờ nếu bật */}
                            {showReferencePoster && (
                                <div className="absolute inset-0 z-30 pointer-events-none opacity-40">
                                    <img
                                        src="/motion-demo/uhi_poster.jpg"
                                        alt="Reference"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Render All Real Cutout PNG Layers */}
                            {currentScene.layers.map((layer) => {
                                if (!layer.imgUrl) return null;
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
                                            className="max-w-[620px] max-h-[620px] object-contain drop-shadow-xl"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-amber-300 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {currentScene.name} • {currentSceneLocalTime.toFixed(1)}s / {currentScene.duration}s
                        </div>
                    </div>

                    {/* Timeline Controls */}
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

                {/* Right / Batch Upload & Layer Manager (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* BATCH UPLOAD ZONE (Tải Hàng Loạt Layer) */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-amber-500/40 shadow-lg shadow-amber-500/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-semibold text-sm text-amber-300">
                                <FolderUp className="w-4 h-4 text-amber-400" />
                                Tải Hàng Loạt Layer PNG & Tệp Hướng Dẫn
                            </div>
                        </div>

                        <label className="cursor-pointer py-4 px-4 border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-xs text-center text-slate-200 transition-all flex flex-col items-center justify-center gap-2">
                            <FolderArchive className="w-6 h-6 text-amber-400" />
                            <span className="font-semibold text-amber-300">
                                Chọn cùng lúc nhiều file PNG (Ctrl + A hoặc quét chọn tất cả)
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Bạn có thể đính kèm cả tệp <code>HUONG_DAN.txt</code> để AI tự đọc quy tắc dựng
                            </span>
                            <input
                                type="file"
                                multiple
                                accept="image/png,.txt,text/plain"
                                className="hidden"
                                onChange={handleBatchLayerUpload}
                            />
                        </label>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Đã tải {currentScene.layers.length} layer trong cảnh này</span>
                            <button
                                onClick={() => {
                                    setScenes((prev) =>
                                        prev.map((sc, idx) =>
                                            idx === activeSceneIndex ? { ...sc, layers: BUILT_IN_UHI_LAYERS } : sc
                                        )
                                    );
                                    toast.success("Đã khôi phục bộ layer gốc UHi!");
                                }}
                                className="text-amber-400 hover:underline"
                            >
                                Reset về bộ gốc UHi
                            </button>
                        </div>
                    </div>

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
                                <label className="text-[11px] text-slate-400 block mb-1">Mô hình Voice</label>
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
                                <label className="text-[11px] text-slate-400 block mb-1">Tông Giọng</label>
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
                        </div>

                        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
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
                                                className="w-5 h-5 object-contain rounded bg-slate-900"
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
                </div>
            </div>
        </div>
    );
}
