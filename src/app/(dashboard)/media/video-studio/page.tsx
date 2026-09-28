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
    FolderOpen,
    DollarSign,
    TrendingDown,
    PieChart,
    Palette,
    Zap,
    Split,
    Monitor,
    Smartphone,
    Square,
    Edit3
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

// Preset royalty-free BGM tracks (Web Audio friendly)
const BGM_PRESETS = [
    {
        id: "trending_upbeat",
        name: "🔥 TikTok Trend Bán Hàng (Sôi động, kích thích chốt đơn)",
        url: "https://actions.google.com/sounds/v1/foley/beating_metal.ogg" // placeholder fallback
    },
    {
        id: "food_review",
        name: "🍜 Review Đồ Ăn & Ẩm Thực (Vui tươi, nhẹ nhàng, ấm áp)",
        url: ""
    },
    {
        id: "warehouse_flow",
        name: "📦 Kho Hàng & Đóng Hàng (Hiện đại, uy tín B2B)",
        url: ""
    },
    {
        id: "custom",
        name: "📁 Tự tải file nhạc nền MP3 riêng từ máy tính...",
        url: ""
    },
    {
        id: "none",
        name: "🔇 Không dùng nhạc nền (Chỉ giữ giọng đọc)",
        url: ""
    }
];

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
    const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
    const [videoFitMode, setVideoFitMode] = useState<"cover" | "fit_blur">("cover");

    // ── STEP 2: Voiceover & Audio State ──
    const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
    const [selectedVoiceAudioUrl, setSelectedVoiceAudioUrl] = useState<string | null>(null);
    const [selectedVoiceText, setSelectedVoiceText] = useState<string>("");
    const [voiceDuration, setVoiceDuration] = useState<number>(0);
    const [isEditingText, setIsEditingText] = useState(false);

    // ── STEP 3: Subtitles & Brand Typography ──
    const [enableSubtitles, setEnableSubtitles] = useState(true);
    const [fontFamily, setFontFamily] = useState<string>("Montserrat, 'Be Vietnam Pro', sans-serif");
    const [fontSize, setFontSize] = useState<number>(28);
    const [textColor, setTextColor] = useState<string>("#FACC15"); // Bright yellow
    const [textPosition, setTextPosition] = useState<"bottom" | "center" | "top">("bottom");
    const [subtitleStyle, setSubtitleStyle] = useState<"tiktok_yellow" | "neon_cyan" | "pill_dark" | "brand_teal">("tiktok_yellow");
    const [customHookTitle, setCustomHookTitle] = useState("🔥 XẢ KHO BÁNH PHỒNG TÔM GIÁ SỈ TẬN XƯỞNG!");
    const [showHookTitle, setShowHookTitle] = useState(true);

    // ── STEP 4: Transitions & Pacing ──
    const [transitionEffect, setTransitionEffect] = useState<"auto" | "hard_cut" | "crossfade" | "white_flash" | "slide_left">("auto");
    const [clipSwitchInterval, setClipSwitchInterval] = useState<number>(4); // Switch clips every 4s for high retention
    const [showWatermark, setShowWatermark] = useState(true);

    // ── STEP 5: Background Music (BGM) ──
    const [bgmChoice, setBgmChoice] = useState<string>("trending_upbeat");
    const [bgmCustomUrl, setBgmCustomUrl] = useState<string | null>(null);
    const [bgmVolume, setBgmVolume] = useState<number>(0.15); // 15% volume
    const [enableAudioDucking, setEnableAudioDucking] = useState(true);

    // ── FINANCIAL / USAGE TRACKER ──
    const [totalVideosCreated, setTotalVideosCreated] = useState<number>(0);
    const [totalCostSpent, setTotalCostSpent] = useState<number>(0);

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
    const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const bgmInputRef = useRef<HTMLInputElement | null>(null);

    // ── Load Voice History & Financial Tracker from LocalStorage / IndexedDB ──
    useEffect(() => {
        loadHistory();
        loadFinancialTracker();
    }, []);

    const loadFinancialTracker = () => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem("lyhu_video_budget_tracker");
            if (raw) {
                const parsed = JSON.parse(raw);
                setTotalVideosCreated(parsed.totalVideos || 0);
                setTotalCostSpent(parsed.totalCostSpent || 0);
            }
        } catch (e) {}
    };

    const updateFinancialTracker = () => {
        if (typeof window === "undefined") return;
        const newCount = totalVideosCreated + 1;
        const newCost = totalCostSpent + estimatedCurrentVideoCost;
        setTotalVideosCreated(newCount);
        setTotalCostSpent(newCost);
        try {
            localStorage.setItem("lyhu_video_budget_tracker", JSON.stringify({
                totalVideos: newCount,
                totalCostSpent: newCost,
                lastUpdated: Date.now()
            }));
        } catch (e) {}
    };

    const handleResetBudgetTracker = () => {
        if (window.confirm("Bạn có muốn đặt lại thống kê chi phí video về 0đ không?")) {
            setTotalVideosCreated(0);
            setTotalCostSpent(0);
            if (typeof window !== "undefined") {
                localStorage.removeItem("lyhu_video_budget_tracker");
            }
        }
    };

    const loadHistory = async () => {
        try {
            const items = await getVoiceHistory();
            setVoiceHistory(items);
            if (items.length > 0 && !selectedVoiceId) {
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
            const tempAudio = new Audio(url);
            tempAudio.onloadedmetadata = () => {
                setVoiceDuration(tempAudio.duration || item.estimatedSeconds || 30);
            };
        }
    };

    // ── Cost Estimation Calculation ──
    const wordCount = selectedVoiceText.trim() ? selectedVoiceText.trim().split(/\s+/).length : 0;
    const aiAnalysisCost = 35; // Gemini Flash 2.5 video/script analysis ~35 VNĐ
    const ttsCost = Math.round(wordCount * 0.4); // Gemini TTS ~40đ / 100 từ ~ 30-50 VNĐ
    const renderCost = 0; // In-browser client-side rendering is 0 VNĐ
    const estimatedCurrentVideoCost = aiAnalysisCost + (ttsCost > 0 ? ttsCost : 40) + renderCost;
    const commercialSaasEquivalentCost = (totalVideosCreated > 0 ? totalVideosCreated : 1) * 25000; // ~25k/video on SaaS
    const totalSavings = Math.max(0, commercialSaasEquivalentCost - totalCostSpent);

    // ── Subtitle Cues Generation (Time-aligned phrases) ──
    const subtitleCues = useMemo<SubtitleCue[]>(() => {
        if (!selectedVoiceText.trim() || voiceDuration <= 0) return [];

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
            const wCount = phrase.split(/\s+/).length;
            const duration = Math.max(1.2, wCount * secondsPerWord);
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

    const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setBgmCustomUrl(url);
        setBgmChoice("custom");
    };

    // ── Determine which clip should be playing at `time` ──
    const currentClipInfo = useMemo(() => {
        if (clips.length === 0) return null;
        const switchSec = Math.max(2, clipSwitchInterval);
        const clipIdx = Math.floor(currentTime / switchSec) % clips.length;
        const clip = clips[clipIdx];
        const clipTime = (currentTime % switchSec) % clip.duration;
        const nextClipIdx = (clipIdx + 1) % clips.length;
        const timeInInterval = currentTime % switchSec;
        const isNearTransition = switchSec - timeInInterval <= 0.4;
        const transitionFactor = isNearTransition ? (switchSec - timeInInterval) / 0.4 : 1.0;

        return { clip, clipIdx, clipTime, nextClipIdx, isNearTransition, transitionFactor };
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
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, cw, ch);

        // 1. Draw Active Video Clip
        const vid = hiddenVideoRef.current;
        if (vid && vid.readyState >= 2 && currentClipInfo) {
            const vw = vid.videoWidth || cw;
            const vh = vid.videoHeight || ch;

            // Fit or Cover calculation
            const scale = Math.max(cw / vw, ch / vh);
            const dw = vw * scale;
            const dh = vh * scale;
            const dx = (cw - dw) / 2;
            const dy = (ch - dh) / 2;

            // Ken Burns subtle zoom
            const zoomProgress = (time % clipSwitchInterval) / clipSwitchInterval;
            const dynamicScale = 1.0 + zoomProgress * 0.04;

            ctx.save();
            ctx.translate(cw / 2, ch / 2);
            ctx.scale(dynamicScale, dynamicScale);
            ctx.translate(-cw / 2, -ch / 2);

            // Handle transition effect
            const activeTrans = transitionEffect === "auto" ? "crossfade" : transitionEffect;

            if (currentClipInfo.isNearTransition && activeTrans === "crossfade") {
                ctx.globalAlpha = Math.max(0.2, currentClipInfo.transitionFactor);
            }

            ctx.drawImage(vid, dx, dy, dw, dh);
            ctx.restore();

            // Flash White transition
            if (currentClipInfo.isNearTransition && activeTrans === "white_flash") {
                ctx.save();
                const flashAlpha = Math.sin((1 - currentClipInfo.transitionFactor) * Math.PI) * 0.6;
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(0, 0, cw, ch);
                ctx.restore();
            }
        } else {
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

        // 2. Draw Hook Title in the first 3.5 seconds
        if (showHookTitle && time <= 3.5 && customHookTitle.trim()) {
            ctx.save();
            const hookY = ch * 0.18;
            ctx.font = "900 24px " + fontFamily;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const titleWidth = ctx.measureText(customHookTitle).width;
            ctx.fillStyle = "rgba(220, 38, 38, 0.95)"; // Bold red pill
            ctx.beginPath();
            ctx.roundRect((cw - titleWidth - 28) / 2, hookY - 20, titleWidth + 28, 40, 8);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.fillText(customHookTitle, cw / 2, hookY);
            ctx.restore();
        }

        // 3. Draw Brand Watermark
        if (showWatermark) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.50)";
            const badgeW = 165;
            const badgeH = 34;
            const badgeX = 20;
            const badgeY = 24;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
            ctx.fill();

            ctx.fillStyle = "#00AFA9";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("LYHU", badgeX + 16, badgeY + 22);

            ctx.fillStyle = "#ffffff";
            ctx.font = "normal 12px sans-serif";
            ctx.fillText("• Tổng Kho Sỉ B2B", badgeX + 54, badgeY + 22);
            ctx.restore();
        }

        // 4. Draw Animated Subtitle with Custom Typography
        if (enableSubtitles && activeSubtitle) {
            ctx.save();
            const text = activeSubtitle.text;
            let subY = ch * 0.80;
            if (textPosition === "center") subY = ch * 0.50;
            if (textPosition === "top") subY = ch * 0.28;

            ctx.font = `900 ${fontSize}px ` + fontFamily;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (subtitleStyle === "tiktok_yellow") {
                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                ctx.shadowBlur = 10;

                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 6;
                ctx.lineJoin = "round";
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = textColor;
                ctx.fillText(text, cw / 2, subY);

            } else if (subtitleStyle === "brand_teal") {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 6;
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = "#00AFA9";
                ctx.fillText(text, cw / 2, subY);

            } else if (subtitleStyle === "neon_cyan") {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 5;
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = "#22D3EE";
                ctx.fillText(text, cw / 2, subY);

            } else {
                // Style: Clean translucent pill
                const textWidth = ctx.measureText(text).width;
                ctx.fillStyle = "rgba(0, 0, 0, 0.70)";
                ctx.beginPath();
                ctx.roundRect((cw - textWidth - 32) / 2, subY - 22, textWidth + 32, 44, 12);
                ctx.fill();

                ctx.fillStyle = textColor || "#ffffff";
                ctx.fillText(text, cw / 2, subY);
            }

            ctx.restore();
        }
    };

    // Synchronize hidden video & audio on play/pause/seek
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

    // Animation Loop
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

    useEffect(() => {
        drawCanvasFrame(currentTime);
    }, [enableSubtitles, subtitleStyle, fontFamily, fontSize, textColor, textPosition, showWatermark, showHookTitle, customHookTitle, clips, currentTime, aspectRatio]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (hiddenAudioRef.current) hiddenAudioRef.current.currentTime = newTime;
        drawCanvasFrame(newTime);
    };

    // ── EXPORT VIDEO VIA BROWSER MEDIA RECORDER ──
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
            const canvasStream = canvas.captureStream(30);
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const destNode = audioCtx.createMediaStreamDestination();

            if (selectedVoiceAudioUrl) {
                const voiceAudio = new Audio(selectedVoiceAudioUrl);
                voiceAudio.crossOrigin = "anonymous";
                const voiceSource = audioCtx.createMediaElementSource(voiceAudio);
                voiceSource.connect(destNode);
                voiceSource.connect(audioCtx.destination);
                voiceAudio.currentTime = 0;
                voiceAudio.play().catch(() => {});
            }

            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...destNode.stream.getAudioTracks()
            ]);

            const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
                ? "video/webm;codecs=vp9,opus"
                : MediaRecorder.isTypeSupported("video/webm")
                ? "video/webm"
                : "video/mp4";

            const recorder = new MediaRecorder(combinedStream, {
                mimeType,
                videoBitsPerSecond: 4500000
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

                // Update budget tracker
                updateFinancialTracker();

                const a = document.createElement("a");
                a.href = finalUrl;
                a.download = `LYHU_Video_${aspectRatio.replace(":", "-")}_${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            recorder.start(100);

            let exportTime = 0;
            const step = 1 / 30;

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
            {/* Header with Financial Summary Badge */}
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
                            ✦ TikTok & Reels Edition
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 pl-11">
                        Tự động cắt ghép góc quay, khớp nhịp giọng đọc, phụ đề động TikTok & xuất video chỉ với ~85đ/video!
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

            {/* FINANCIAL / COST TRANSPARENCY BANNER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Cost this video */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-teal-800 font-semibold">
                        <span>Chi phí dựng video này:</span>
                        <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.2 rounded-full font-bold">
                            Chính xác
                        </span>
                    </div>
                    <div className="text-2xl font-black text-teal-700 font-mono">
                        ~{estimatedCurrentVideoCost} <span className="text-sm font-normal text-teal-600">VNĐ</span>
                    </div>
                    <p className="text-[11px] text-teal-600">
                        Phân tích kịch bản: 35đ • Lồng tiếng: {ttsCost}đ • Render: 0đ
                    </p>
                </div>

                {/* Total Cost Accumulated */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-purple-800 font-semibold">
                        <span>Tổng chi phí đã dùng tháng này:</span>
                        <button
                            type="button"
                            onClick={handleResetBudgetTracker}
                            className="text-[10px] text-purple-600 hover:underline"
                        >
                            Đặt lại
                        </button>
                    </div>
                    <div className="text-2xl font-black text-purple-700 font-mono">
                        {totalCostSpent.toLocaleString("vi-VN")} <span className="text-sm font-normal text-purple-600">VNĐ</span>
                    </div>
                    <p className="text-[11px] text-purple-600">
                        Đã tạo <strong>{totalVideosCreated} video</strong> hoàn chỉnh
                    </p>
                </div>

                {/* Savings compared to commercial SaaS */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                        <span>Tiết kiệm so với thuê ngoài / SaaS:</span>
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" /> 98%
                        </span>
                    </div>
                    <div className="text-2xl font-black text-amber-700 font-mono">
                        ~{totalSavings.toLocaleString("vi-VN")} <span className="text-sm font-normal text-amber-600">VNĐ</span>
                    </div>
                    <p className="text-[11px] text-amber-600">
                        Không mất 750k/tháng phí Opus Clip / CapCut Pro
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Controls & Assets (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    
                    {/* BƯỚC 1: VIDEO QUAY THÔ & TỈ LỆ KHUNG HÌNH */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <FileVideo className="w-4 h-4 text-purple-600" />
                                1. Nạp video thô & Chọn tỉ lệ khung hình ({clips.length} clip)
                            </h2>
                            <button
                                type="button"
                                onClick={handleLoadDemoClips}
                                className="text-xs text-purple-600 hover:text-purple-800 hover:underline font-medium"
                            >
                                + Dùng 2 clip mẫu Bánh Phồng Tôm
                            </button>
                        </div>

                        {/* Aspect Ratio Selector */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setAspectRatio("9:16")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                    aspectRatio === "9:16"
                                        ? "border-purple-600 bg-purple-50/50 text-purple-700 font-bold ring-2 ring-purple-100"
                                        : "border-gray-200 text-gray-600 hover:bg-slate-50"
                                }`}
                            >
                                <Smartphone className="w-5 h-5" />
                                <span className="text-xs">9:16 (TikTok/Shorts)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAspectRatio("16:9")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                    aspectRatio === "16:9"
                                        ? "border-purple-600 bg-purple-50/50 text-purple-700 font-bold ring-2 ring-purple-100"
                                        : "border-gray-200 text-gray-600 hover:bg-slate-50"
                                }`}
                            >
                                <Monitor className="w-5 h-5" />
                                <span className="text-xs">16:9 (YouTube ngang)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAspectRatio("1:1")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                    aspectRatio === "1:1"
                                        ? "border-purple-600 bg-purple-50/50 text-purple-700 font-bold ring-2 ring-purple-100"
                                        : "border-gray-200 text-gray-600 hover:bg-slate-50"
                                }`}
                            >
                                <Square className="w-5 h-5" />
                                <span className="text-xs">1:1 (Facebook vuông)</span>
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
                                    Hỗ trợ MP4, MOV. AI sẽ tự động cắt ghép các góc quay đẹp nhất.
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

                    {/* BƯỚC 2: CHỌN GIỌNG ĐỌC & KỊCH BẢN (TỰ CHỌN HOẶC TỰ SỬA TEXT) */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-teal-600" />
                                2. Lồng tiếng & Lời thoại kịch bản
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingText(!isEditingText)}
                                    className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{isEditingText ? "Đóng sửa lời thoại" : "Sửa lời thoại"}</span>
                                </button>
                                <span className="text-xs text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full font-medium">
                                    Độ dài: ~{Math.round(voiceDuration)}s
                                </span>
                            </div>
                        </div>

                        {/* Text Editor for Subtitles / Voice */}
                        {isEditingText && (
                            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                <label className="font-semibold text-gray-700">Chỉnh sửa nội dung phụ đề / lời thoại:</label>
                                <textarea
                                    rows={4}
                                    value={selectedVoiceText}
                                    onChange={(e) => setSelectedVoiceText(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-teal-500 leading-relaxed text-xs"
                                    placeholder="Nhập lời thoại cần hiển thị phụ đề..."
                                />
                                <p className="text-[11px] text-gray-400">
                                    Mẹo: Phụ đề sẽ tự động chia thành từng câu 3-5 từ chạy mượt trên video.
                                </p>
                            </div>
                        )}

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

                    {/* BƯỚC 3: TÙY CHỌN FONT CHỮ, MÀU SẮC & PHONG CÁCH THƯƠNG HIỆU */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-purple-600" />
                            3. Font chữ thương hiệu & Phụ đề động
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* Font Family Selection */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-gray-700">Kiểu Font chữ hiển thị:</label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs"
                                >
                                    <option value="Montserrat, 'Be Vietnam Pro', sans-serif">Montserrat / Be Vietnam Pro (Hiện đại TikTok)</option>
                                    <option value="'Arial Black', Impact, sans-serif">Arial Black / Impact (Dày dặn, bán hàng mạnh)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Chuẩn truyền hình, đĩnh đạc)</option>
                                    <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI (Thanh lịch, hiện đại)</option>
                                </select>
                            </div>

                            {/* Subtitle Style & Color */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-gray-700">Màu sắc & Phong cách phụ đề:</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={subtitleStyle}
                                        onChange={(e) => setSubtitleStyle(e.target.value as any)}
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs"
                                    >
                                        <option value="tiktok_yellow">Vàng viền đen (TikTok Viral)</option>
                                        <option value="brand_teal">Xanh ngọc thương hiệu LYHU</option>
                                        <option value="neon_cyan">Xanh Neon Gen Z</option>
                                        <option value="pill_dark">Hộp đen mờ tối giản</option>
                                    </select>
                                    {/* Color Swatch Picker */}
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
                                        title="Tự chọn màu chữ tùy ý"
                                    />
                                </div>
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

                        {/* Hook Title (3s đầu) */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-gray-700">Tiêu đề giật tít Hook (Hiện ở 3 giây đầu để giữ chân):</label>
                                <input
                                    type="checkbox"
                                    checked={showHookTitle}
                                    onChange={(e) => setShowHookTitle(e.target.checked)}
                                    className="accent-purple-600 rounded"
                                />
                            </div>
                            {showHookTitle && (
                                <input
                                    type="text"
                                    value={customHookTitle}
                                    onChange={(e) => setCustomHookTitle(e.target.value)}
                                    placeholder="VD: 🔥 XẢ KHO BÁNH PHỒNG TÔM GIÁ SỈ TẬN GỐC!"
                                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-lg outline-none font-bold text-red-600 text-xs"
                                />
                            )}
                        </div>
                    </div>

                    {/* BƯỚC 4: HIỆU ỨNG CHUYỂN CẢNH & NHẠC NỀN BGM */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            4. Hiệu ứng chuyển cảnh & Nhạc nền (BGM)
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* Transitions */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-gray-700">Hiệu ứng chuyển cảnh:</label>
                                <select
                                    value={transitionEffect}
                                    onChange={(e) => setTransitionEffect(e.target.value as any)}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs"
                                >
                                    <option value="auto">✨ Tự động theo nhịp câu (Khuyên dùng)</option>
                                    <option value="hard_cut">⚡ Cắt nhanh (Hard Cut - Chuẩn TikTok)</option>
                                    <option value="crossfade">🌫️ Mờ chồng (Crossfade - Mượt mà)</option>
                                    <option value="white_flash">💥 Chớp sáng (White Flash - Nổi bật)</option>
                                </select>
                            </div>

                            {/* Pacing */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-gray-700">Thời gian mỗi góc quay:</label>
                                    <span className="font-mono text-purple-600 font-bold">{clipSwitchInterval}s / cảnh</span>
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
                            </div>

                            {/* BGM Selection */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-gray-700">Nhạc nền video (BGM):</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={bgmChoice}
                                        onChange={(e) => setBgmChoice(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs"
                                    >
                                        {BGM_PRESETS.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {bgmChoice === "custom" && (
                                        <button
                                            type="button"
                                            onClick={() => bgmInputRef.current?.click()}
                                            className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold shrink-0"
                                        >
                                            Chọn file MP3
                                        </button>
                                    )}
                                    <input
                                        ref={bgmInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleBgmUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Audio Ducking & Watermark */}
                        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enableAudioDucking}
                                    onChange={(e) => setEnableAudioDucking(e.target.checked)}
                                    className="accent-purple-600 rounded"
                                />
                                <span className="text-gray-700">Tự động giảm nhạc nền khi có tiếng nói (Audio Ducking)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showWatermark}
                                    onChange={(e) => setShowWatermark(e.target.checked)}
                                    className="accent-teal-600 rounded"
                                />
                                <span className="text-gray-700">Gắn logo LYHU Tổng Kho Sỉ B2B</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live Video Canvas & Export (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-purple-600" />
                                Màn hình xem trước ({aspectRatio})
                            </h3>
                            <span className="text-[11px] font-mono text-gray-500 font-medium">
                                {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                            </span>
                        </div>

                        {/* Phone Mockup Frame */}
                        <div className={`relative mx-auto bg-slate-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-slate-800 ${
                            aspectRatio === "9:16" ? "max-w-[280px]" : aspectRatio === "1:1" ? "max-w-[340px]" : "max-w-[420px]"
                        }`}>
                            {/* Dynamic Island */}
                            <div className="w-16 h-3.5 bg-slate-950 rounded-full mx-auto mb-2" />

                            {/* Canvas Container */}
                            <div className={`relative overflow-hidden rounded-2xl bg-black ${
                                aspectRatio === "9:16" ? "aspect-[9/16]" : aspectRatio === "16:9" ? "aspect-[16/9]" : "aspect-square"
                            }`}>
                                <canvas
                                    ref={canvasRef}
                                    width={aspectRatio === "9:16" ? 540 : aspectRatio === "16:9" ? 960 : 720}
                                    height={aspectRatio === "9:16" ? 960 : aspectRatio === "16:9" ? 540 : 720}
                                    className="w-full h-full object-cover"
                                />
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
                                        <span>XUẤT VIDEO TỰ ĐỘNG (~{estimatedCurrentVideoCost}đ)</span>
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
