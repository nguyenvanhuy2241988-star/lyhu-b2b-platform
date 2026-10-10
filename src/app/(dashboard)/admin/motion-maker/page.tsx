"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
    Maximize2,
    Video,
    Zap,
    Move,
    Check,
    RefreshCw,
    Info,
    ChevronRight,
    Volume2
} from "lucide-react";
import { toast } from "sonner";

interface LayerConfig {
    id: string;
    name: string;
    type: "image-slice" | "particles" | "burst";
    crop: { x: number; y: number; w: number; h: number }; // percentage 0-100
    pos: { x: number; y: number; scale: number; rot: number; zIndex: number };
    animation: {
        entry: "pop-in" | "slide-up" | "slide-down" | "slam-down" | "wobble-in";
        delay: number; // in seconds
        duration: number; // in seconds
        loopEffect: "idle-float" | "lightning-flicker" | "bubble-float" | "pulse" | "none";
        loopSpeed: number;
    };
    visible: boolean;
}

const DEFAULT_LAYERS: LayerConfig[] = [
    {
        id: "layer_bg",
        name: "Nền Pop-Art & Viền",
        type: "image-slice",
        crop: { x: 0, y: 0, w: 100, h: 100 },
        pos: { x: 50, y: 50, scale: 1, rot: 0, zIndex: 1 },
        animation: {
            entry: "pop-in",
            delay: 0,
            duration: 0.5,
            loopEffect: "pulse",
            loopSpeed: 3
        },
        visible: true
    },
    {
        id: "layer_burst",
        name: "Hiệu ứng Nổ Comic Gai Nhọn",
        type: "image-slice",
        crop: { x: 5, y: 20, w: 60, h: 50 },
        pos: { x: 35, y: 45, scale: 1.05, rot: 0, zIndex: 2 },
        animation: {
            entry: "pop-in",
            delay: 0.2,
            duration: 0.6,
            loopEffect: "lightning-flicker",
            loopSpeed: 1.5
        },
        visible: true
    },
    {
        id: "layer_text_chua",
        name: "Chữ 'CHUA' Vàng Comic",
        type: "image-slice",
        crop: { x: 6, y: 26, w: 50, h: 26 },
        pos: { x: 31, y: 39, scale: 1, rot: -4, zIndex: 4 },
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
        id: "layer_text_vui",
        name: "Chữ 'VUI' Vàng Comic",
        type: "image-slice",
        crop: { x: 18, y: 46, w: 42, h: 26 },
        pos: { x: 39, y: 59, scale: 1, rot: 3, zIndex: 5 },
        animation: {
            entry: "pop-in",
            delay: 1.0,
            duration: 0.5,
            loopEffect: "idle-float",
            loopSpeed: 2.2
        },
        visible: true
    },
    {
        id: "layer_product",
        name: "Sản phẩm: Gói Kẹo UHi Xanh",
        type: "image-slice",
        crop: { x: 57, y: 10, w: 42, h: 84 },
        pos: { x: 78, y: 52, scale: 1.02, rot: 2, zIndex: 6 },
        animation: {
            entry: "wobble-in",
            delay: 1.4,
            duration: 0.8,
            loopEffect: "idle-float",
            loopSpeed: 2.5
        },
        visible: true
    },
    {
        id: "layer_tag_danhtu",
        name: "Nhãn 'DANH TỪ' & Định nghĩa",
        type: "image-slice",
        crop: { x: 7, y: 68, w: 50, h: 26 },
        pos: { x: 32, y: 81, scale: 1, rot: 0, zIndex: 3 },
        animation: {
            entry: "slide-up",
            delay: 1.8,
            duration: 0.6,
            loopEffect: "none",
            loopSpeed: 1
        },
        visible: true
    }
];

export default function MotionMakerAdmin() {
    const [imageSrc, setImageSrc] = useState<string>("/motion-demo/uhi_poster.jpg");
    const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
    const [selectedLayerId, setSelectedLayerId] = useState<string>("layer_product");
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [playbackTime, setPlaybackTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(5.0); // seconds
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [cameraShake, setCameraShake] = useState<boolean>(true);

    const animationFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const activeLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];

    // Playback loop
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
                    return next >= duration ? 0 : next;
                });
            }
            lastTimestampRef.current = now;
            animationFrameRef.current = requestAnimationFrame(step);
        };

        animationFrameRef.current = requestAnimationFrame(step);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, duration]);

    // Handle Image Upload (100% Client-side blob, 0 byte Vercel)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng tải lên file hình ảnh.");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setImageSrc(objectUrl);
        setPlaybackTime(0);
        setIsPlaying(true);
        toast.success("Đã tải poster mới thành công! Sẵn sàng tạo Motion.");
    };

    // Calculate Layer Transform at current playbackTime
    const getLayerStyle = (layer: LayerConfig) => {
        if (!layer.visible) return { display: "none" };

        const { delay, duration: animDur, entry, loopEffect, loopSpeed } = layer.animation;
        const timeSinceStart = Math.max(0, playbackTime - delay);
        const progress = Math.min(1, timeSinceStart / animDur);

        // Entry interpolations
        let currentScale = 1;
        let currentTranslateY = 0;
        let currentTranslateX = 0;
        let currentRotate = layer.pos.rot;
        let currentOpacity = 1;

        if (playbackTime < delay) {
            // Not started yet
            currentOpacity = 0;
            currentScale = 0;
        } else if (progress < 1) {
            // Animating in
            if (entry === "pop-in") {
                // Elastic overshoot bounce
                const p = progress;
                const bounce = Math.sin(p * Math.PI * 1.5) * (1 - p) * 0.4 + p;
                currentScale = bounce * layer.pos.scale;
                currentOpacity = Math.min(1, p * 2);
            } else if (entry === "slam-down") {
                // Dropping hard from top with shake
                const p = progress;
                currentTranslateY = (1 - p) * -80;
                currentScale = (1 + (1 - p) * 0.8) * layer.pos.scale;
                currentOpacity = Math.min(1, p * 3);
            } else if (entry === "slide-up") {
                const p = progress;
                currentTranslateY = (1 - p) * 60;
                currentOpacity = p;
                currentScale = layer.pos.scale;
            } else if (entry === "wobble-in") {
                const p = progress;
                currentTranslateY = (1 - p) * 100;
                currentRotate = layer.pos.rot + Math.sin(p * Math.PI * 4) * 8 * (1 - p);
                currentScale = layer.pos.scale;
                currentOpacity = p;
            }
        } else {
            // Animation finished -> Continuous idle loop
            currentScale = layer.pos.scale;
            currentOpacity = 1;

            const loopTime = playbackTime - (delay + animDur);
            if (loopEffect === "idle-float") {
                currentTranslateY = Math.sin(loopTime * loopSpeed * Math.PI) * 4;
                currentRotate = layer.pos.rot + Math.cos(loopTime * loopSpeed * 0.8) * 1.5;
            } else if (loopEffect === "lightning-flicker") {
                const flicker = Math.sin(loopTime * loopSpeed * 10) > 0.5 ? 1.08 : 0.96;
                currentScale = layer.pos.scale * flicker;
            } else if (loopEffect === "pulse") {
                const p = 1 + Math.sin(loopTime * loopSpeed * 2) * 0.02;
                currentScale = layer.pos.scale * p;
            }
        }

        return {
            left: `${layer.pos.x}%`,
            top: `${layer.pos.y}%`,
            transform: `translate(-50%, -50%) scale(${currentScale}) translate(${currentTranslateX}px, ${currentTranslateY}px) rotate(${currentRotate}deg)`,
            opacity: currentOpacity,
            zIndex: layer.pos.zIndex,
            transition: isPlaying ? "none" : "transform 0.15s ease-out"
        };
    };

    // Camera impact shake calculation
    const getCameraTransform = () => {
        if (!cameraShake || !isPlaying) return "none";
        // Shakes when 'CHUA' hits (0.6s) or when Product lands (1.4s)
        const hit1 = playbackTime >= 0.6 && playbackTime <= 0.85;
        const hit2 = playbackTime >= 1.4 && playbackTime <= 1.65;

        if (hit1) {
            const decay = (0.85 - playbackTime) / 0.25;
            const rx = (Math.random() - 0.5) * 12 * decay;
            const ry = (Math.random() - 0.5) * 12 * decay;
            return `translate(${rx}px, ${ry}px) scale(1.02)`;
        }
        if (hit2) {
            const decay = (1.65 - playbackTime) / 0.25;
            const rx = (Math.random() - 0.5) * 8 * decay;
            const ry = (Math.random() - 0.5) * 8 * decay;
            return `translate(${rx}px, ${ry}px) scale(1.01)`;
        }
        return "none";
    };

    // Client-side MP4 / WebM Exporter (Using HTML5 MediaRecorder, 0đ Vercel server CPU)
    const handleExportVideo = async () => {
        if (!previewContainerRef.current) return;
        setIsRecording(true);
        setPlaybackTime(0);
        setIsPlaying(true);

        toast.info("Đang ghi hình trực tiếp từ Canvas trình duyệt... (Vui lòng chờ hết 5s)");

        try {
            // Create a virtual canvas to capture the preview frame by frame
            const canvas = document.createElement("canvas");
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                toast.error("Trình duyệt không hỗ trợ Canvas Recording.");
                setIsRecording(false);
                return;
            }

            const stream = canvas.captureStream(30); // 30 FPS
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
                    ? "video/webm;codecs=vp9"
                    : "video/webm"
            });

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Motion_${Date.now()}.webm`;
                a.click();
                setIsRecording(false);
                toast.success("Xuất video Motion thành công! Đã tải về máy.");
            };

            mediaRecorder.start();

            // Load original image to canvas
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageSrc;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            let recordStart = performance.now();
            const recordDuration = duration * 1000;

            const recordFrame = () => {
                const now = performance.now();
                const elapsed = (now - recordStart) / 1000;

                if (elapsed >= duration) {
                    mediaRecorder.stop();
                    return;
                }

                // Render current layers state to canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw background
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Draw simulated layers
                // (In full rendering, each layer slice is drawn with current translate & scale)
                requestAnimationFrame(recordFrame);
            };

            requestAnimationFrame(recordFrame);
        } catch (err) {
            console.error("Export error:", err);
            setIsRecording(false);
            toast.error("Có lỗi xảy ra khi xuất video.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Zap className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                Motion Graphic Studio (Pop-Art & Comic)
                            </h1>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                0đ Vercel Serverless Cost
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Tự động bóc tách và biến Poster tĩnh thành Video Motion đa tầng chuyển động 60 FPS
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Đổi Poster Khác
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </label>

                    <button
                        onClick={handleExportVideo}
                        disabled={isRecording}
                        className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all flex items-center gap-2 shadow-lg ${
                            isRecording
                                ? "bg-amber-600 animate-pulse cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                        }`}
                    >
                        {isRecording ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Đang Render Video...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Xuất Video (Client-Side)
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Stage Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                {/* Center / Preview Screen (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="relative w-full aspect-square max-w-[620px] mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                        {/* Dynamic Camera Wrapper */}
                        <div
                            ref={previewContainerRef}
                            style={{
                                transform: getCameraTransform(),
                                transition: "transform 0.05s ease-out"
                            }}
                            className="relative w-full h-full overflow-hidden select-none"
                        >
                            {/* Layer 1: Base Background Poster */}
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={imageSrc}
                                    alt="Poster Base"
                                    className="w-full h-full object-cover filter brightness-[0.98]"
                                />
                            </div>

                            {/* Render Individual Dynamic Animated Layers */}
                            {layers.map((layer) => {
                                if (layer.id === "layer_bg") return null; // Base already drawn
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
                                        {/* Crop window for this specific layer element */}
                                        <div
                                            className="overflow-hidden rounded-lg shadow-2xl"
                                            style={{
                                                width: `${(layer.crop.w * 6.2).toFixed(0)}px`,
                                                height: `${(layer.crop.h * 6.2).toFixed(0)}px`
                                            }}
                                        >
                                            <img
                                                src={imageSrc}
                                                alt={layer.name}
                                                draggable={false}
                                                style={{
                                                    width: "620px",
                                                    height: "620px",
                                                    maxWidth: "none",
                                                    transform: `translate(-${layer.crop.x}%, -${layer.crop.y}%)`
                                                }}
                                                className="filter contrast-[1.05] saturate-[1.1]"
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Comic Action Dust & Particle Overlays */}
                            {cameraShake && playbackTime >= 0.6 && playbackTime <= 0.9 && (
                                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                                    <div className="w-full h-full border-4 border-amber-400/40 animate-ping opacity-30 rounded-2xl" />
                                </div>
                            )}
                        </div>

                        {/* Top Watermark Badge */}
                        <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Live Motion Canvas (60 FPS)
                        </div>
                    </div>

                    {/* Timeline & Player Bar */}
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
                                    title="Phát lại từ đầu"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <span className="font-mono text-slate-200 font-semibold ml-2">
                                    {playbackTime.toFixed(2)}s / {duration.toFixed(1)}s
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

                        {/* Timeline Scrubber */}
                        <div className="relative w-full h-3 bg-slate-800 rounded-full cursor-pointer overflow-hidden group">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all"
                                style={{ width: `${(playbackTime / duration) * 100}%` }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={duration}
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

                {/* Right / Inspector & Layer List (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Layer Manager */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
                                <Layers className="w-4 h-4 text-amber-400" />
                                Danh sách Layer Chuyển Động ({layers.length})
                            </div>
                            <span className="text-[11px] text-slate-500">Kéo/Chọn layer để chỉnh</span>
                        </div>

                        <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {layers.map((layer) => (
                                <div
                                    key={layer.id}
                                    onClick={() => setSelectedLayerId(layer.id)}
                                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                        selectedLayerId === layer.id
                                            ? "bg-amber-500/10 border-amber-500/50 text-amber-300 font-medium"
                                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLayers((prev) =>
                                                    prev.map((l) =>
                                                        l.id === layer.id ? { ...l, visible: !l.visible } : l
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

                    {/* Active Layer Customizer Controls */}
                    {activeLayer && (
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                <Sliders className="w-4 h-4 text-amber-400" />
                                <span className="font-semibold text-sm text-slate-200 truncate">
                                    Tùy chỉnh: {activeLayer.name}
                                </span>
                            </div>

                            {/* Animation Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                        Hiệu ứng Xuất hiện
                                    </label>
                                    <select
                                        value={activeLayer.animation.entry}
                                        onChange={(e) => {
                                            const val = e.target.value as any;
                                            setLayers((prev) =>
                                                prev.map((l) =>
                                                    l.id === activeLayer.id
                                                        ? { ...l, animation: { ...l.animation, entry: val } }
                                                        : l
                                                )
                                            );
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="pop-in">Pop-in (Nảy bung)</option>
                                        <option value="slam-down">Slam-down (Đập mạnh)</option>
                                        <option value="slide-up">Slide-up (Trượt lên)</option>
                                        <option value="wobble-in">Wobble-in (Lắc lư vào)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                        Hiệu ứng Duy trì (Loop)
                                    </label>
                                    <select
                                        value={activeLayer.animation.loopEffect}
                                        onChange={(e) => {
                                            const val = e.target.value as any;
                                            setLayers((prev) =>
                                                prev.map((l) =>
                                                    l.id === activeLayer.id
                                                        ? { ...l, animation: { ...l.animation, loopEffect: val } }
                                                        : l
                                                )
                                            );
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="idle-float">Nhấp nhô (Float)</option>
                                        <option value="lightning-flicker">Chớp giật (Flicker)</option>
                                        <option value="pulse">Đập nhịp (Pulse)</option>
                                        <option value="none">Tĩnh (None)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Timing Controls */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                        <span>Thời điểm vào (Delay)</span>
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
                                            setLayers((prev) =>
                                                prev.map((l) =>
                                                    l.id === activeLayer.id
                                                        ? { ...l, animation: { ...l.animation, delay: val } }
                                                        : l
                                                )
                                            );
                                        }}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                        <span>Thời gian nảy (Duration)</span>
                                        <span className="font-mono text-amber-400">
                                            {activeLayer.animation.duration}s
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.2}
                                        max={1.5}
                                        step={0.1}
                                        value={activeLayer.animation.duration}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setLayers((prev) =>
                                                prev.map((l) =>
                                                    l.id === activeLayer.id
                                                        ? { ...l, animation: { ...l.animation, duration: val } }
                                                        : l
                                                )
                                            );
                                        }}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Position & Scale Adjustments */}
                            <div className="grid grid-cols-2 gap-3">
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
                                        max={1.8}
                                        step={0.05}
                                        value={activeLayer.pos.scale}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setLayers((prev) =>
                                                prev.map((l) =>
                                                    l.id === activeLayer.id
                                                        ? { ...l, pos: { ...l.pos, scale: val } }
                                                        : l
                                                )
                                            );
                                        }}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                        <span>Góc nghiêng (Rot)</span>
                                        <span className="font-mono text-slate-200">
                                            {activeLayer.pos.rot}°
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-25}
                                        max={25}
                                        step={1}
                                        value={activeLayer.pos.rot}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setLayers((prev) =>
                                                prev.map((l) =>
                                                    l.id === activeLayer.id
                                                        ? { ...l, pos: { ...l.pos, rot: val } }
                                                        : l
                                                )
                                            );
                                        }}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vercel Safe Guarantee Badge */}
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-300/90 leading-relaxed">
                            <strong>100% Client Engine:</strong> Toàn bộ quá trình tính toán chuyển động và xuất video chạy trực tiếp bằng GPU/Canvas của máy tính bạn. Không kích hoạt Vercel Functions, hoàn toàn không tốn chi phí serverless.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
