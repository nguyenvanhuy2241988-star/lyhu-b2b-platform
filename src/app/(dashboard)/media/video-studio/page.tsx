"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    Film,
    Upload,
    Play,
    Pause,
    Download,
    Sparkles,
    Sliders,
    Layers,
    Music,
    Volume2,
    VolumeX,
    Trash2,
    RotateCcw,
    Check,
    Plus,
    MoveUp,
    MoveDown,
    Type,
    Eye,
    Maximize2,
    Sparkle,
    Radio,
    Clock,
    FileVideo,
    CheckCircle2,
    HelpCircle,
    ArrowRight,
    Wand2,
    FolderOpen
} from "lucide-react";
import Link from "next/link";
import { getVoiceHistory, VoiceHistoryItem } from "@/lib/voiceHistoryStore";
import { generateSmartFileName } from "@/lib/ttsHelper";

interface VideoClip {
    id: string;
    file?: File;
    url: string;
    name: string;
    duration: number; // in seconds
    width: number;
    height: number;
    thumbnailUrl?: string;
    muted: boolean;
}

interface SubtitleCue {
    start: number; // seconds
    end: number;   // seconds
    text: string;
}

// Demo video clips for instant test
const DEMO_CLIPS = [
    {
        name: "Cận cảnh Bánh Phồng Tôm giòn rụm",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        name: "Đóng gói & Xếp thùng kho sỉ",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: 15,
        width: 1280,
        height: 720
    }
];

export default function AutoVideoStudioPage() {
    // ── STEP 1: Video Clips State ──
    const [clips, setClips] = useState<VideoClip[]>([]);
    const [activeClipIndex, setActiveClipIndex] = useState(0);

    // ── STEP 2: Voiceover & Audio State ──
    const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
    const [selectedVoiceAudioUrl, setSelectedVoiceAudioUrl] = useState<string | null>(null);
    const [selectedVoiceText, setSelectedVoiceText] = useState<string>("");
    const [voiceDuration, setVoiceDuration] = useState<number>(0);

    // ── STEP 3: Styling & Subtitle Config ──
    const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
    const [enableSubtitles, setEnableSubtitles] = useState(true);
    const [subtitleStyle, setSubtitleStyle] = useState<"tiktok_yellow" | "neon_cyan" | "pill_dark">("tiktok_yellow");
    const [bgmChoice, setBgmChoice] = useState<"upbeat" | "chill" | "none">("upbeat");
    const [bgmVolume, setBgmVolume] = useState<number>(0.15); // 15% volume
    const [showWatermark, setShowWatermark] = useState(true);
    const [clipSwitchInterval, setClipSwitchInterval] = useState<number>(4); // Switch clips every 4s for high retention

    // ── PLAYBACK & CANVAS STATE ──
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);
    const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

    // ── REFS ──
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
    const hiddenAudioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const audioInputRef = useRef<HTMLInputElement | null>(null);

    // ── Load Voice History from IndexedDB ──
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const items = await getVoiceHistory();
            setVoiceHistory(items);
            if (items.length > 0 && !selectedVoiceId) {
                // Auto select newest voice
                selectVoiceItem(items[0]);
            }
        } catch (e) {
            console.warn("Lỗi đọc lịch sử giọng đọc:", e);
        }
    };

    const selectVoiceItem = (item: VoiceHistoryItem) => {
        setSelectedVoiceId(item.id);
        setSelectedVoiceText(item.text);

        let url = item.audioUrl;
        if (item.audioBlob && item.audioBlob.size > 0) {
            try {
                url = URL.createObjectURL(item.audioBlob);
            } catch (e) {}
        }
        if (url) {
            setSelectedVoiceAudioUrl(url);
            // Measure duration
            const tempAudio = new Audio(url);
            tempAudio.onloadedmetadata = () => {
                setVoiceDuration(tempAudio.duration || item.estimatedSeconds || 30);
            };
        }
    };

    // ── Subtitle Cues Generation (Time-aligned phrases) ──
    const subtitleCues = useMemo<SubtitleCue[]>(() => {
        if (!selectedVoiceText.trim() || voiceDuration <= 0) return [];

        // Split text into short punchy phrases (3 - 6 words each)
        const sentences = selectedVoiceText.split(/(?<=[.!?,;:\n])\s+/).filter(s => s.trim().length > 0);
        const phrases: string[] = [];

        sentences.forEach(s => {
            const words = s.trim().split(/\s+/);
            if (words.length <= 6) {
                phrases.push(words.join(" "));
            } else {
                for (let i = 0; i < words.length; i += 5) {
                    phrases.push(words.slice(i, i + 5).join(" "));
                }
            }
        });

        if (phrases.length === 0) return [];

        const totalWords = selectedVoiceText.trim().split(/\s+/).length;
        const secondsPerWord = voiceDuration / Math.max(1, totalWords);

        let currentStartTime = 0;
        return phrases.map(phrase => {
            const wordCount = phrase.split(/\s+/).length;
            const duration = Math.max(1.2, wordCount * secondsPerWord);
            const cue: SubtitleCue = {
                start: currentStartTime,
                end: Math.min(voiceDuration, currentStartTime + duration),
                text: phrase
            };
            currentStartTime += duration;
            return cue;
        });
    }, [selectedVoiceText, voiceDuration]);

    // Active subtitle at current playback time
    const activeSubtitle = useMemo(() => {
        if (!enableSubtitles) return null;
        return subtitleCues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
    }, [subtitleCues, currentTime, enableSubtitles]);

    // Total project duration is bounded by voice duration
    const totalDuration = voiceDuration > 0 ? voiceDuration : (clips.length > 0 ? clips.reduce((acc, c) => acc + c.duration, 0) : 30);

    // ── Handle Uploading Video Clips ──
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newClips: VideoClip[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = URL.createObjectURL(file);

            // Extract metadata via dummy video element
            const meta = await new Promise<{ duration: number; width: number; height: number }>((resolve) => {
                const vid = document.createElement("video");
                vid.src = url;
                vid.preload = "metadata";
                vid.onloadedmetadata = () => {
                    resolve({
                        duration: vid.duration || 10,
                        width: vid.videoWidth || 1080,
                        height: vid.videoHeight || 1920
                    });
                };
                vid.onerror = () => {
                    resolve({ duration: 10, width: 1080, height: 1920 });
                };
            });

            newClips.push({
                id: `clip-${Date.now()}-${i}`,
                file,
                url,
                name: file.name,
                duration: meta.duration,
                width: meta.width,
                height: meta.height,
                muted: true
            });
        }

        setClips(prev => [...prev, ...newClips]);
    };

    // Load Demo Clips for testing
    const handleLoadDemoClips = () => {
        const demoFormatted: VideoClip[] = DEMO_CLIPS.map((demo, idx) => ({
            id: `demo-${idx}`,
            url: demo.url,
            name: demo.name,
            duration: demo.duration,
            width: demo.width,
            height: demo.height,
            muted: true
        }));
        setClips(prev => [...prev, ...demoFormatted]);
    };

    const removeClip = (id: string) => {
        setClips(prev => prev.filter(c => c.id !== id));
    };

    const moveClip = (index: number, direction: "up" | "down") => {
        if ((direction === "up" && index === 0) || (direction === "down" && index === clips.length - 1)) return;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        setClips(prev => {
            const copy = [...prev];
            const item = copy.splice(index, 1)[0];
            copy.splice(targetIndex, 0, item);
            return copy;
        });
    };

    // ── Handle Custom Voice Upload ──
    const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setSelectedVoiceId("custom-upload");
        setSelectedVoiceAudioUrl(url);

        const tempAudio = new Audio(url);
        tempAudio.onloadedmetadata = () => {
            setVoiceDuration(tempAudio.duration || 30);
        };
    };

    // ── Determine which clip should be playing at `time` ──
    const currentClipInfo = useMemo(() => {
        if (clips.length === 0) return null;
        // Cycle through clips based on clipSwitchInterval
        const switchSec = Math.max(2, clipSwitchInterval);
        const clipIdx = Math.floor(currentTime / switchSec) % clips.length;
        const clip = clips[clipIdx];
        // Time within this clip
        const clipTime = (currentTime % switchSec) % clip.duration;
        return { clip, clipIdx, clipTime };
    }, [clips, currentTime, clipSwitchInterval]);

    // ── DRAW FRAME ON CANVAS ──
    const drawCanvasFrame = (time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const cw = canvas.width;
        const ch = canvas.height;

        // Clear canvas
        ctx.fillStyle = "#0f172a"; // dark background
        ctx.fillRect(0, 0, cw, ch);

        // 1. Draw Active Video Clip (with 9:16 center cropping)
        const vid = hiddenVideoRef.current;
        if (vid && vid.readyState >= 2 && currentClipInfo) {
            const vw = vid.videoWidth || cw;
            const vh = vid.videoHeight || ch;

            // Calculate cover scale
            const scale = Math.max(cw / vw, ch / vh);
            const dw = vw * scale;
            const dh = vh * scale;
            const dx = (cw - dw) / 2;
            const dy = (ch - dh) / 2;

            // Subtle Ken Burns motion (1.0 -> 1.05 zoom)
            const zoomProgress = (time % clipSwitchInterval) / clipSwitchInterval;
            const dynamicScale = 1.0 + zoomProgress * 0.04;

            ctx.save();
            ctx.translate(cw / 2, ch / 2);
            ctx.scale(dynamicScale, dynamicScale);
            ctx.translate(-cw / 2, -ch / 2);
            ctx.drawImage(vid, dx, dy, dw, dh);
            ctx.restore();
        } else {
            // Placeholder background pattern if no clip loaded
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, cw, ch);

            ctx.fillStyle = "#475569";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Chưa có video quay thô", cw / 2, ch / 2 - 10);
            ctx.font = "14px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("Kéo thả video vào khung bên trái", cw / 2, ch / 2 + 18);
        }

        // 2. Draw Top Watermark & Brand Logo
        if (showWatermark) {
            ctx.save();
            // Pill background
            ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
            const badgeW = 160;
            const badgeH = 34;
            const badgeX = 24;
            const badgeY = 32;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
            ctx.fill();

            // Brand Text
            ctx.fillStyle = "#00AFA9";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("LYHU", badgeX + 16, badgeY + 22);

            ctx.fillStyle = "#ffffff";
            ctx.font = "normal 12px sans-serif";
            ctx.fillText("• Tổng Kho Sỉ B2B", badgeX + 54, badgeY + 22);
            ctx.restore();
        }

        // 3. Draw Animated Subtitle (TikTok Style)
        if (enableSubtitles && activeSubtitle) {
            ctx.save();
            const text = activeSubtitle.text;
            const subY = ch * 0.78; // Lower third position

            if (subtitleStyle === "tiktok_yellow") {
                // Style: Big Bold Yellow with black heavy stroke
                ctx.font = "900 28px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Background glow / shadow
                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                ctx.shadowBlur = 12;

                // Black outline
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 6;
                ctx.lineJoin = "round";
                ctx.strokeText(text, cw / 2, subY);

                // Bright yellow fill
                ctx.fillStyle = "#FACC15";
                ctx.fillText(text, cw / 2, subY);

            } else if (subtitleStyle === "neon_cyan") {
                // Style: Neon Cyan Pill
                ctx.font = "bold 24px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 5;
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = "#22D3EE";
                ctx.fillText(text, cw / 2, subY);

            } else {
                // Style: Clean translucent pill
                ctx.font = "bold 22px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const textWidth = ctx.measureText(text).width;
                ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
                ctx.beginPath();
                ctx.roundRect((cw - textWidth - 30) / 2, subY - 20, textWidth + 30, 40, 10);
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.fillText(text, cw / 2, subY);
            }

            ctx.restore();
        }
    };

    // ── Synchronize hidden video & audio on play/pause/seek ──
    useEffect(() => {
        if (!currentClipInfo) return;

        const vid = hiddenVideoRef.current;
        if (vid && vid.src !== currentClipInfo.clip.url) {
            vid.src = currentClipInfo.clip.url;
            vid.currentTime = currentClipInfo.clipTime;
            if (isPlaying) {
                vid.play().catch(() => {});
            }
        }
    }, [currentClipInfo, isPlaying]);

    // ── Animation Loop ──
    useEffect(() => {
        let startTime = Date.now() - currentTime * 1000;

        const loop = () => {
            if (isPlaying) {
                const nowSec = (Date.now() - startTime) / 1000;
                if (nowSec >= totalDuration) {
                    setIsPlaying(false);
                    setCurrentTime(0);
                    if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
                    if (hiddenVideoRef.current) hiddenVideoRef.current.pause();
                    return;
                }
                setCurrentTime(nowSec);
                drawCanvasFrame(nowSec);
                animationFrameRef.current = requestAnimationFrame(loop);
            }
        };

        if (isPlaying) {
            startTime = Date.now() - currentTime * 1000;
            animationFrameRef.current = requestAnimationFrame(loop);
            if (hiddenAudioRef.current) {
                hiddenAudioRef.current.currentTime = currentTime;
                hiddenAudioRef.current.play().catch(() => {});
            }
            if (hiddenVideoRef.current) {
                hiddenVideoRef.current.play().catch(() => {});
            }
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
            if (hiddenVideoRef.current) hiddenVideoRef.current.pause();
            drawCanvasFrame(currentTime);
        }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, totalDuration]);

    // Re-draw canvas when styling changes
    useEffect(() => {
        drawCanvasFrame(currentTime);
    }, [enableSubtitles, subtitleStyle, showWatermark, clips, currentTime]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (hiddenAudioRef.current) hiddenAudioRef.current.currentTime = newTime;
        drawCanvasFrame(newTime);
    };

    // ── EXPORT VIDEO VIA BROWSER MEDIA RECORDER (0 VNĐ SERVER COST) ──
    const handleExportVideo = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (clips.length === 0) {
            alert("Vui lòng tải lên ít nhất 1 video quay thô hoặc bấm 'Dùng video mẫu' để dựng video!");
            return;
        }

        setIsRendering(true);
        setRenderProgress(0);
        setIsPlaying(false);

        try {
            // 1. Capture stream from Canvas (30fps)
            const canvasStream = canvas.captureStream(30);

            // 2. Setup Web Audio API to mix Voiceover + BGM
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const destNode = audioCtx.createMediaStreamDestination();

            // Setup Voice element node
            if (selectedVoiceAudioUrl) {
                const voiceAudio = new Audio(selectedVoiceAudioUrl);
                voiceAudio.crossOrigin = "anonymous";
                const voiceSource = audioCtx.createMediaElementSource(voiceAudio);
                voiceSource.connect(destNode);
                voiceSource.connect(audioCtx.destination);
                voiceAudio.currentTime = 0;
                voiceAudio.play().catch(() => {});
            }

            // Combine video tracks + audio tracks
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...destNode.stream.getAudioTracks()
            ]);

            // Setup MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
                ? "video/webm;codecs=vp9,opus"
                : MediaRecorder.isTypeSupported("video/webm")
                ? "video/webm"
                : "video/mp4";

            const recorder = new MediaRecorder(combinedStream, {
                mimeType,
                videoBitsPerSecond: 4500000 // 4.5 Mbps HD
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const finalBlob = new Blob(chunks, { type: mimeType });
                const finalUrl = URL.createObjectURL(finalBlob);
                setRenderedVideoUrl(finalUrl);
                setIsRendering(false);
                setRenderProgress(100);

                // Auto-trigger download
                const a = document.createElement("a");
                a.href = finalUrl;
                a.download = `LYHU_Video_AutoCut_TikTok_9-16_${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            recorder.start(100);

            // Play timeline from 0 to totalDuration
            let exportTime = 0;
            const step = 1 / 30; // 30fps

            const renderInterval = setInterval(() => {
                exportTime += step;
                setCurrentTime(exportTime);
                drawCanvasFrame(exportTime);

                const progress = Math.min(99, Math.round((exportTime / totalDuration) * 100));
                setRenderProgress(progress);

                if (exportTime >= totalDuration) {
                    clearInterval(renderInterval);
                    recorder.stop();
                    audioCtx.close();
                }
            }, 1000 / 30);

        } catch (err: any) {
            console.error("Render error:", err);
            alert("Có lỗi khi render video: " + err.message);
            setIsRendering(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <Film className="w-6 h-6" />
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Studio Dựng Video AI (Auto Cut & Subtitles)
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm">
                            ✦ TikTok & Reels 9:16
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 pl-11">
                        Tải video thô (kho xưởng, bẻ bánh, đóng gói) → AI tự ghép nhịp, lồng tiếng, phụ đề động TikTok & xuất video hoàn chỉnh!
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/media/voice-studio"
                        className="px-3.5 py-2 rounded-xl bg-teal-50 text-[#00AFA9] text-xs font-bold hover:bg-teal-100 transition-colors flex items-center gap-1.5 border border-teal-200"
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Mở Studio Lồng Tiếng</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Controls & Assets (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    
                    {/* BƯỚC 1: VIDEO QUAY THÔ */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <FileVideo className="w-4 h-4 text-purple-600" />
                                1. Video quay thô ({clips.length} clip)
                            </h2>
                            <button
                                type="button"
                                onClick={handleLoadDemoClips}
                                className="text-xs text-purple-600 hover:text-purple-800 hover:underline font-medium"
                            >
                                + Dùng 2 clip mẫu Bánh Phồng Tôm
                            </button>
                        </div>

                        {/* Dropzone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/20 hover:bg-purple-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 block"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    Kéo thả hoặc bấm để nạp nhiều video quay từ điện thoại
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Hỗ trợ video MP4, MOV. AI sẽ tự động cắt ghép các góc quay đẹp nhất.
                                </p>
                            </div>
                        </div>

                        {/* Clips List */}
                        {clips.length > 0 && (
                            <div className="space-y-2 pt-2">
                                {clips.map((clip, index) => (
                                    <div
                                        key={clip.id}
                                        className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 truncate max-w-[240px]">
                                                    {clip.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400">
                                                    {Math.round(clip.duration)}s • {clip.width}x{clip.height}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => moveClip(index, "up")}
                                                disabled={index === 0}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded disabled:opacity-30"
                                                title="Đưa lên trên"
                                            >
                                                <MoveUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveClip(index, "down")}
                                                disabled={index === clips.length - 1}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded disabled:opacity-30"
                                                title="Đưa xuống dưới"
                                            >
                                                <MoveDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeClip(clip.id)}
                                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                                title="Xóa clip này"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BƯỚC 2: CHỌN GIỌNG ĐỌC & KỊCH BẢN TỪ VOICE STUDIO */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-teal-600" />
                                2. Lồng tiếng & Kịch bản (Voiceover)
                            </h2>
                            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                                Độ dài: ~{Math.round(voiceDuration)}s
                            </span>
                        </div>

                        {/* List from Voice Studio History */}
                        {voiceHistory.length > 0 ? (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700">
                                    Chọn từ các kịch bản đã tạo trong Voice Studio:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {voiceHistory.slice(0, 6).map((vh) => {
                                        const isSelected = selectedVoiceId === vh.id;
                                        return (
                                            <div
                                                key={vh.id}
                                                onClick={() => selectVoiceItem(vh)}
                                                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                                                    isSelected
                                                        ? "bg-teal-50/50 border-teal-500 ring-2 ring-teal-100 font-medium"
                                                        : "bg-slate-50 border-gray-200 hover:border-teal-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between text-gray-900 font-bold">
                                                    <span className="truncate max-w-[150px]">{vh.styleName}</span>
                                                    <span className="text-[10px] text-teal-600 font-mono">~{vh.estimatedSeconds}s</span>
                                                </div>
                                                <p className="text-gray-500 line-clamp-2 text-[11px]">
                                                    {vh.text}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl text-center space-y-2">
                                <p className="text-xs text-gray-500">Chưa có giọng đọc nào trong Voice Studio.</p>
                                <Link
                                    href="/media/voice-studio"
                                    className="inline-block px-3 py-1.5 bg-[#00AFA9] text-white text-xs font-bold rounded-lg"
                                >
                                    Đến Studio Lồng Tiếng để tạo giọng
                                </Link>
                            </div>
                        )}

                        {/* Voice Upload Option */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Hoặc nạp file âm thanh MP3 từ máy:</span>
                            <button
                                type="button"
                                onClick={() => audioInputRef.current?.click()}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium"
                            >
                                Chọn file MP3
                            </button>
                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/*,.mp3,.m4a,.wav"
                                onChange={handleVoiceUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* BƯỚC 3: PHONG CÁCH & PHỤ ĐỀ ĐỘNG TIKTOK */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-purple-600" />
                            3. Hiệu ứng, Phụ đề động & Nhạc nền
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* Subtitle Style */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-gray-700">Phụ đề chạy chữ động:</label>
                                    <input
                                        type="checkbox"
                                        checked={enableSubtitles}
                                        onChange={(e) => setEnableSubtitles(e.target.checked)}
                                        className="accent-purple-600 rounded"
                                    />
                                </div>
                                <select
                                    disabled={!enableSubtitles}
                                    value={subtitleStyle}
                                    onChange={(e) => setSubtitleStyle(e.target.value as any)}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none disabled:opacity-40"
                                >
                                    <option value="tiktok_yellow">Vàng nổi bật (TikTok Viral)</option>
                                    <option value="neon_cyan">Xanh Neon Gen Z</option>
                                    <option value="pill_dark">Nền tối tối giản</option>
                                </select>
                            </div>

                            {/* Clip Switching Pace */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-gray-700">Nhịp đổi góc quay:</label>
                                    <span className="font-mono text-purple-600 font-bold">{clipSwitchInterval} giây / cảnh</span>
                                </div>
                                <input
                                    type="range"
                                    min={2}
                                    max={6}
                                    step={1}
                                    value={clipSwitchInterval}
                                    onChange={(e) => setClipSwitchInterval(parseInt(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400">
                                    <span>2s (Rất nhanh)</span>
                                    <span>4s (Chuẩn TikTok)</span>
                                    <span>6s (Từ tốn)</span>
                                </div>
                            </div>
                        </div>

                        {/* Watermark toggle */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-gray-700 font-semibold">Gắn logo thương hiệu (LYHU Tổng Kho Sỉ):</span>
                            <input
                                type="checkbox"
                                checked={showWatermark}
                                onChange={(e) => setShowWatermark(e.target.checked)}
                                className="accent-teal-600 rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live Video Canvas & Export (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-purple-600" />
                                Màn hình xem trước (9:16)
                            </h3>
                            <span className="text-[11px] font-mono text-gray-500 font-medium">
                                {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                            </span>
                        </div>

                        {/* Phone Mockup Frame */}
                        <div className="relative mx-auto bg-slate-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-slate-800 max-w-[280px]">
                            {/* Dynamic Island / Notch */}
                            <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto mb-2" />

                            {/* Canvas 9:16 (540x960) */}
                            <div className="relative overflow-hidden rounded-2xl aspect-[9/16] bg-black">
                                <canvas
                                    ref={canvasRef}
                                    width={540}
                                    height={960}
                                    className="w-full h-full object-cover"
                                />

                                {/* Subtitle Preview Overlay */}
                                {enableSubtitles && activeSubtitle && (
                                    <div className="absolute inset-x-3 bottom-16 text-center pointer-events-none">
                                        <span className="inline-block px-3 py-1.5 rounded-lg bg-black/60 text-yellow-400 font-extrabold text-xs shadow-lg">
                                            {activeSubtitle.text}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Playback Scrubbing & Controls */}
                        <div className="space-y-2 pt-2">
                            <input
                                type="range"
                                min={0}
                                max={totalDuration}
                                step={0.1}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentTime(0);
                                        if (hiddenAudioRef.current) hiddenAudioRef.current.currentTime = 0;
                                        drawCanvasFrame(0);
                                    }}
                                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-slate-100 rounded-full"
                                    title="Phát lại từ đầu"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="w-11 h-11 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Big Export Button */}
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <button
                                type="button"
                                disabled={isRendering || clips.length === 0}
                                onClick={handleExportVideo}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-[0.99] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRendering ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang dựng video: {renderProgress}%...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>XUẤT VIDEO TỰ ĐỘNG (MP4/WEBM)</span>
                                    </>
                                )}
                            </button>
                            <p className="text-[11px] text-center text-gray-400">
                                ✓ Xử lý trực tiếp trên máy tính của bạn • 0đ chi phí máy chủ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden media elements for canvas sync */}
            <video ref={hiddenVideoRef} playsInline muted className="hidden" crossOrigin="anonymous" />
            <audio ref={hiddenAudioRef} src={selectedVoiceAudioUrl || ""} className="hidden" />
        </div>
    );
}
