"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
    Edit3,
    CheckCheck,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { getVoiceHistory, VoiceHistoryItem } from "@/lib/voiceHistoryStore";

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

// Preset local royalty-free BGM tracks (100% reliable, zero CORS)
const BGM_PRESETS = [
    {
        id: "trending_upbeat",
        name: "🔥 TikTok Trend Bán Hàng (Sôi động, kích thích chốt đơn)",
        url: "/audio/bgm/trending.mp3"
    },
    {
        id: "food_review",
        name: "🍜 Review Đồ Ăn & Ẩm Thực (Vui tươi, nhẹ nhàng, ngon miệng)",
        url: "/audio/bgm/food_review.mp3"
    },
    {
        id: "warehouse_flow",
        name: "📦 Kho Hàng & Đóng Gói Sỉ B2B (Hiện đại, uy tín doanh nghiệp)",
        url: "/audio/bgm/warehouse_flow.mp3"
    },
    {
        id: "custom",
        name: "📁 Tự tải file nhạc nền MP3 riêng từ máy tính...",
        url: ""
    },
    {
        id: "none",
        name: "🔇 Không dùng nhạc nền (Chỉ giữ giọng đọc thuyết minh)",
        url: ""
    }
];

// Demo video clips for instant testing
const DEMO_CLIPS = [
    {
        name: "Cận cảnh Bánh Phồng Tôm chiên giòn",
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
    const [exportFormat, setExportFormat] = useState<"mp4" | "webm">("mp4");

    // ── STEP 2: Voiceover & Audio State ──
    const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
    const [selectedVoiceAudioUrl, setSelectedVoiceAudioUrl] = useState<string | null>(null);
    const [selectedVoiceText, setSelectedVoiceText] = useState<string>("");
    const [voiceDuration, setVoiceDuration] = useState<number>(0);
    const [isEditingText, setIsEditingText] = useState(false);

    // ── STEP 3: Subtitles & Brand Typography ──
    const [enableSubtitles, setEnableSubtitles] = useState(true);
    const [fontFamily, setFontFamily] = useState<string>("'Be Vietnam Pro', Montserrat, sans-serif");
    const [fontSize, setFontSize] = useState<number>(28);
    const [textColor, setTextColor] = useState<string>("#FACC15"); // Bright yellow
    const [textPosition, setTextPosition] = useState<"bottom" | "center" | "top">("bottom");
    const [subtitleStyle, setSubtitleStyle] = useState<"tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow">("tiktok_stroke");
    const [customHookTitle, setCustomHookTitle] = useState("🔥 XẢ KHO BÁNH PHỒNG TÔM GIÁ SỈ TẬN GỐC!");
    const [showHookTitle, setShowHookTitle] = useState(true);

    // ── STEP 4: Transitions & Pacing ──
    const [transitionEffect, setTransitionEffect] = useState<"auto" | "hard_cut" | "crossfade" | "white_flash" | "slide_left">("auto");
    const [clipSwitchInterval, setClipSwitchInterval] = useState<number>(3.5); // 3.5s per shot
    const [showWatermark, setShowWatermark] = useState(true);

    // ── STEP 5: Background Music (BGM) ──
    const [bgmChoice, setBgmChoice] = useState<string>("trending_upbeat");
    const [bgmCustomUrl, setBgmCustomUrl] = useState<string | null>(null);
    const [bgmVolume, setBgmVolume] = useState<number>(0.15); // 15% volume
    const [enableAudioDucking, setEnableAudioDucking] = useState(true);

    // ── FINANCIAL / USAGE TRACKER ──
    const [totalVideosCreated, setTotalVideosCreated] = useState<number>(0);
    const [totalCostSpent, setTotalCostSpent] = useState<number>(0);

    // ── PLAYBACK & RENDER STATE ──
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);
    const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
    const [renderedFormat, setRenderedFormat] = useState<string>("mp4");

    // ── REFS ──
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hiddenAudioRef = useRef<HTMLAudioElement | null>(null);
    const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
    const videoElementsRef = useRef<{ [key: string]: HTMLVideoElement | null }>({});
    const animationFrameRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const bgmInputRef = useRef<HTMLInputElement | null>(null);
    const isExportingRef = useRef(false);

    // Inject Google Brand Fonts on Mount
    useEffect(() => {
        const fontId = "lyhu-google-brand-fonts";
        if (!document.getElementById(fontId)) {
            const link = document.createElement("link");
            link.id = fontId;
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,700;0,900;1,700&family=Montserrat:wght@800;900&family=Roboto:wght@700;900&display=swap";
            document.head.appendChild(link);
        }
    }, []);

    // Load Financial Tracker & Voice History on mount
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

    // Calculate dynamic cost
    const wordCount = selectedVoiceText.trim() ? selectedVoiceText.trim().split(/\s+/).length : 0;
    const aiAnalysisCost = 35; // Gemini Flash 2.5 analysis ~35đ
    const ttsCost = Math.round(wordCount * 0.4); // Gemini TTS ~40đ/100 words
    const estimatedCurrentVideoCost = aiAnalysisCost + (ttsCost > 0 ? ttsCost : 40);
    const commercialSaasEquivalentCost = (totalVideosCreated > 0 ? totalVideosCreated : 1) * 25000;
    const totalSavings = Math.max(0, commercialSaasEquivalentCost - totalCostSpent);

    // Active BGM Track URL
    const activeBgmUrl = useMemo(() => {
        if (bgmChoice === "none") return null;
        if (bgmChoice === "custom") return bgmCustomUrl;
        const found = BGM_PRESETS.find(b => b.id === bgmChoice);
        return found?.url || null;
    }, [bgmChoice, bgmCustomUrl]);

    // Subtitle cues generation
    const subtitleCues = useMemo<SubtitleCue[]>(() => {
        if (!selectedVoiceText.trim() || voiceDuration <= 0) return [];

        const sentences = selectedVoiceText.split(/(?<=[.!?,;:\n])\s+/).filter(s => s.trim().length > 0);
        const phrases: string[] = [];

        sentences.forEach(s => {
            const words = s.trim().split(/\s+/);
            if (words.length <= 5) {
                phrases.push(words.join(" "));
            } else {
                for (let i = 0; i < words.length; i += 4) {
                    phrases.push(words.slice(i, i + 4).join(" "));
                }
            }
        });

        if (phrases.length === 0) return [];

        const totalWords = selectedVoiceText.trim().split(/\s+/).length;
        const secondsPerWord = voiceDuration / Math.max(1, totalWords);

        let currentStartTime = 0;
        return phrases.map(phrase => {
            const wCount = phrase.split(/\s+/).length;
            const duration = Math.max(1.1, wCount * secondsPerWord);
            const cue: SubtitleCue = {
                start: currentStartTime,
                end: Math.min(voiceDuration, currentStartTime + duration),
                text: phrase
            };
            currentStartTime += duration;
            return cue;
        });
    }, [selectedVoiceText, voiceDuration]);

    // Active Subtitle at current playback time
    const activeSubtitle = useMemo(() => {
        if (!enableSubtitles) return null;
        return subtitleCues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
    }, [subtitleCues, currentTime, enableSubtitles]);

    // Project Total Duration
    const totalDuration = voiceDuration > 0 ? voiceDuration : (clips.length > 0 ? clips.reduce((acc, c) => acc + c.duration, 0) : 30);

    // Upload Video Clips
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
                id: `clip-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
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
            id: `demo-${idx}-${Date.now()}`,
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
        delete videoElementsRef.current[id];
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

    // Current Clip & Transition Calculation
    const currentClipInfo = useMemo(() => {
        if (clips.length === 0) return null;
        const switchSec = Math.max(2, clipSwitchInterval);
        const clipIdx = Math.floor(currentTime / switchSec) % clips.length;
        const clip = clips[clipIdx];
        const clipTime = (currentTime % switchSec) % Math.max(1, clip.duration);

        const nextClipIdx = (clipIdx + 1) % clips.length;
        const nextClip = clips[nextClipIdx];

        const timeInInterval = currentTime % switchSec;
        const transitionWindow = 0.45; // 0.45s transition
        const isNearTransition = switchSec - timeInInterval <= transitionWindow;
        const transitionProgress = isNearTransition ? (switchSec - timeInInterval) / transitionWindow : 1.0;

        return {
            clip,
            clipIdx,
            clipTime,
            nextClip,
            nextClipIdx,
            isNearTransition,
            transitionProgress
        };
    }, [clips, currentTime, clipSwitchInterval]);

    // ── DRAW FRAME ON CANVAS ──
    const drawCanvasFrame = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const cw = canvas.width;
        const ch = canvas.height;

        // Clear canvas
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, cw, ch);

        if (!currentClipInfo || clips.length === 0) {
            // Placeholder when no video clips
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, cw, ch);

            ctx.fillStyle = "#64748b";
            ctx.font = "bold 20px 'Be Vietnam Pro', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Chưa có video quay thô", cw / 2, ch / 2 - 12);
            ctx.font = "14px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("Tải lên video hoặc bấm '+ Dùng clip mẫu'", cw / 2, ch / 2 + 16);
            return;
        }

        const currentVid = videoElementsRef.current[currentClipInfo.clip.id];
        const nextVid = videoElementsRef.current[currentClipInfo.nextClip.id];

        // Determine active transition effect
        let activeTrans = transitionEffect;
        if (activeTrans === "auto") {
            const transPool: ("crossfade" | "white_flash" | "slide_left" | "hard_cut")[] = [
                "crossfade",
                "white_flash",
                "slide_left",
                "crossfade"
            ];
            activeTrans = transPool[currentClipInfo.clipIdx % transPool.length];
        }

        // Helper to draw a video scaled (Cover fit) with Ken Burns zoom
        const drawVideoCover = (
            videoEl: HTMLVideoElement,
            offsetX = 0,
            alpha = 1.0,
            scaleMultiplier = 1.0
        ) => {
            if (!videoEl || videoEl.readyState < 2) return;

            const vw = videoEl.videoWidth || cw;
            const vh = videoEl.videoHeight || ch;
            const baseScale = Math.max(cw / vw, ch / vh) * scaleMultiplier;
            const dw = vw * baseScale;
            const dh = vh * baseScale;
            const dx = (cw - dw) / 2 + offsetX;
            const dy = (ch - dh) / 2;

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.drawImage(videoEl, dx, dy, dw, dh);
            ctx.restore();
        };

        // Ken Burns subtle zoom
        const zoomProgress = (time % clipSwitchInterval) / clipSwitchInterval;
        const dynamicScale = 1.0 + zoomProgress * 0.04;

        // Render Video with Selected Transition
        if (currentClipInfo.isNearTransition && clips.length > 1) {
            const factor = currentClipInfo.transitionProgress; // 1.0 -> 0.0

            if (activeTrans === "crossfade") {
                // Draw next clip underneath
                if (nextVid) drawVideoCover(nextVid, 0, 1.0, 1.0);
                // Draw current clip on top fading out
                if (currentVid) drawVideoCover(currentVid, 0, factor, dynamicScale);

            } else if (activeTrans === "slide_left") {
                // Slide out current clip to the left, slide in next clip from the right
                const slideOffset = (1 - factor) * cw;
                if (currentVid) drawVideoCover(currentVid, -slideOffset, 1.0, dynamicScale);
                if (nextVid) drawVideoCover(nextVid, cw - slideOffset, 1.0, 1.0);

            } else if (activeTrans === "white_flash") {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                // Flash overlay peaking at transition midpoint
                const flashAlpha = Math.sin((1 - factor) * Math.PI) * 0.85;
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(0, 0, cw, ch);
                ctx.restore();

            } else {
                // Hard Cut
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            }
        } else {
            // Normal frame playback
            if (currentVid) {
                drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            }
        }

        // 2. Draw Hook Title (First 3.5s)
        if (showHookTitle && time <= 3.5 && customHookTitle.trim()) {
            ctx.save();
            const hookY = ch * 0.16;
            ctx.font = `900 23px ${fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const titleWidth = ctx.measureText(customHookTitle).width;
            const badgeW = titleWidth + 32;
            const badgeH = 44;
            const badgeX = (cw - badgeW) / 2;

            // Red gradient pill
            const grad = ctx.createLinearGradient(badgeX, hookY, badgeX + badgeW, hookY);
            grad.addColorStop(0, "#DC2626");
            grad.addColorStop(1, "#EA580C");
            ctx.fillStyle = grad;
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.roundRect(badgeX, hookY - badgeH / 2, badgeW, badgeH, 10);
            ctx.fill();

            // Text
            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 4;
            ctx.fillStyle = "#ffffff";
            ctx.fillText(customHookTitle, cw / 2, hookY);
            ctx.restore();
        }

        // 3. Draw Brand Watermark
        if (showWatermark) {
            ctx.save();
            ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
            const badgeW = 168;
            const badgeH = 34;
            const badgeX = 20;
            const badgeY = 24;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
            ctx.fill();

            ctx.fillStyle = "#00AFA9";
            ctx.font = "900 13px 'Be Vietnam Pro', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("LYHU!", badgeX + 16, badgeY + 22);

            ctx.fillStyle = "#ffffff";
            ctx.font = "600 11.5px 'Be Vietnam Pro', sans-serif";
            ctx.fillText("• Tổng Kho Sỉ B2B", badgeX + 54, badgeY + 22);
            ctx.restore();
        }

        // 4. Draw Animated Subtitle with Typography & Styles
        if (enableSubtitles && activeSubtitle) {
            ctx.save();
            const text = activeSubtitle.text;

            let subY = ch * 0.82;
            if (textPosition === "center") subY = ch * 0.52;
            if (textPosition === "top") subY = ch * 0.28;

            ctx.font = `900 ${fontSize}px ${fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (subtitleStyle === "tiktok_stroke") {
                // TikTok Thick Outline Style with Drop Shadow
                ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
                ctx.shadowBlur = 12;
                ctx.lineWidth = 7;
                ctx.strokeStyle = "#000000";
                ctx.lineJoin = "round";
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = textColor;
                ctx.fillText(text, cw / 2, subY);

            } else if (subtitleStyle === "neon_glow") {
                // Neon Glow Style
                ctx.shadowColor = textColor;
                ctx.shadowBlur = 16;
                ctx.lineWidth = 5;
                ctx.strokeStyle = "#000000";
                ctx.lineJoin = "round";
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = textColor;
                ctx.fillText(text, cw / 2, subY);

            } else if (subtitleStyle === "pill_dark") {
                // Modern Frosted Pill Badge
                const textWidth = ctx.measureText(text).width;
                const pillW = textWidth + 36;
                const pillH = fontSize + 20;
                ctx.fillStyle = "rgba(10, 15, 30, 0.75)";
                ctx.beginPath();
                ctx.roundRect((cw - pillW) / 2, subY - pillH / 2, pillW, pillH, 14);
                ctx.fill();

                ctx.fillStyle = textColor;
                ctx.fillText(text, cw / 2, subY);

            } else {
                // Clean Shadow Minimalist Style
                ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = 8;
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#000000";
                ctx.strokeText(text, cw / 2, subY);

                ctx.fillStyle = textColor;
                ctx.fillText(text, cw / 2, subY);
            }

            ctx.restore();
        }
    }, [
        currentClipInfo,
        clips,
        clipSwitchInterval,
        transitionEffect,
        fontFamily,
        fontSize,
        textColor,
        textPosition,
        subtitleStyle,
        customHookTitle,
        showHookTitle,
        showWatermark,
        enableSubtitles,
        activeSubtitle
    ]);

    // Keep hidden video elements synchronized to currentTime
    useEffect(() => {
        if (!currentClipInfo) return;

        const currentVid = videoElementsRef.current[currentClipInfo.clip.id];
        if (currentVid) {
            // Keep current video playing and in sync
            if (isPlaying && currentVid.paused) {
                currentVid.play().catch(() => {});
            } else if (!isPlaying && !currentVid.paused) {
                currentVid.pause();
            }

            // Sync seek if drifting by > 0.3s
            if (Math.abs(currentVid.currentTime - currentClipInfo.clipTime) > 0.35) {
                currentVid.currentTime = currentClipInfo.clipTime;
            }
        }

        // Pause other video elements that are not currently in the transition window
        clips.forEach(c => {
            if (c.id !== currentClipInfo.clip.id && (!currentClipInfo.isNearTransition || c.id !== currentClipInfo.nextClip.id)) {
                const vid = videoElementsRef.current[c.id];
                if (vid && !vid.paused) {
                    vid.pause();
                }
            }
        });

        // Pre-roll next clip during transition
        if (currentClipInfo.isNearTransition && currentClipInfo.nextClip) {
            const nextVid = videoElementsRef.current[currentClipInfo.nextClip.id];
            if (nextVid && isPlaying && nextVid.paused) {
                nextVid.currentTime = 0;
                nextVid.play().catch(() => {});
            }
        }
    }, [currentClipInfo, isPlaying, clips]);

    // Handle BGM volume & Audio Ducking during preview
    useEffect(() => {
        const bgmEl = bgmAudioRef.current;
        if (!bgmEl) return;

        if (activeBgmUrl) {
            if (bgmEl.src !== window.location.origin + activeBgmUrl && !bgmEl.src.includes(activeBgmUrl)) {
                bgmEl.src = activeBgmUrl;
                bgmEl.load();
            }

            // Dynamic Audio Ducking: lower BGM when voice is active
            const isVoiceSpeaking = voiceDuration > 0 && currentTime < voiceDuration;
            const targetVolume = enableAudioDucking && isVoiceSpeaking
                ? bgmVolume * 0.22
                : bgmVolume;

            bgmEl.volume = Math.max(0, Math.min(1, targetVolume));

            if (isPlaying) {
                bgmEl.play().catch(() => {});
            } else {
                bgmEl.pause();
            }
        } else {
            bgmEl.pause();
        }
    }, [activeBgmUrl, bgmVolume, enableAudioDucking, currentTime, voiceDuration, isPlaying]);

    // Main Animation / Playback Loop
    useEffect(() => {
        let lastTimestamp = performance.now();

        const tick = (now: number) => {
            if (!isPlaying || isExportingRef.current) return;

            const delta = (now - lastTimestamp) / 1000;
            lastTimestamp = now;

            setCurrentTime(prev => {
                const next = prev + delta;
                if (next >= totalDuration) {
                    setIsPlaying(false);
                    if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
                    if (bgmAudioRef.current) bgmAudioRef.current.pause();
                    return 0;
                }
                return next;
            });

            drawCanvasFrame(currentTime);
            animationFrameRef.current = requestAnimationFrame(tick);
        };

        if (isPlaying) {
            lastTimestamp = performance.now();
            animationFrameRef.current = requestAnimationFrame(tick);

            // Play voiceover
            if (hiddenAudioRef.current && selectedVoiceAudioUrl) {
                hiddenAudioRef.current.currentTime = currentTime;
                hiddenAudioRef.current.play().catch(() => {});
            }
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
            if (bgmAudioRef.current) bgmAudioRef.current.pause();
            drawCanvasFrame(currentTime);
        }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, totalDuration, drawCanvasFrame, currentTime, selectedVoiceAudioUrl]);

    // Re-draw canvas whenever styling / aspect ratio changes
    useEffect(() => {
        drawCanvasFrame(currentTime);
    }, [drawCanvasFrame, currentTime, aspectRatio]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (hiddenAudioRef.current) hiddenAudioRef.current.currentTime = newTime;
        if (bgmAudioRef.current) bgmAudioRef.current.currentTime = newTime % (bgmAudioRef.current.duration || 60);
        drawCanvasFrame(newTime);
    };

    // ── HIGH-FIDELITY MP4 / WEBM VIDEO EXPORT ──
    const handleExportVideo = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (clips.length === 0) {
            alert("Vui lòng nạp ít nhất 1 video quay thô hoặc bấm '+ Dùng clip mẫu' để xuất video!");
            return;
        }

        setIsRendering(true);
        setRenderProgress(0);
        setIsPlaying(false);
        isExportingRef.current = true;

        try {
            // Setup Web Audio Context for synchronous track mixing
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const destNode = audioCtx.createMediaStreamDestination();

            // 1. Connect Voiceover Track
            let voiceAudioEl: HTMLAudioElement | null = null;
            if (selectedVoiceAudioUrl) {
                voiceAudioEl = new Audio(selectedVoiceAudioUrl);
                voiceAudioEl.crossOrigin = "anonymous";
                const voiceSrc = audioCtx.createMediaElementSource(voiceAudioEl);
                voiceSrc.connect(destNode);
                voiceAudioEl.currentTime = 0;
            }

            // 2. Connect BGM Track with Audio Ducking
            let bgmAudioEl: HTMLAudioElement | null = null;
            let bgmGainNode: GainNode | null = null;
            if (activeBgmUrl) {
                bgmAudioEl = new Audio(activeBgmUrl);
                bgmAudioEl.crossOrigin = "anonymous";
                bgmAudioEl.loop = true;
                const bgmSrc = audioCtx.createMediaElementSource(bgmAudioEl);
                bgmGainNode = audioCtx.createGain();
                bgmGainNode.gain.value = enableAudioDucking ? bgmVolume * 0.22 : bgmVolume;
                bgmSrc.connect(bgmGainNode);
                bgmGainNode.connect(destNode);
                bgmAudioEl.currentTime = 0;
            }

            // Combine Canvas Video Track & Mixed Audio Tracks
            const canvasStream = canvas.captureStream(30);
            const combinedTracks = [
                ...canvasStream.getVideoTracks(),
                ...destNode.stream.getAudioTracks()
            ];
            const combinedStream = new MediaStream(combinedTracks);

            // Determine MIME type with MP4 priority
            let chosenMime = "";
            let finalExt = "mp4";

            if (exportFormat === "mp4") {
                const mp4Candidates = [
                    "video/mp4;codecs=avc1,mp4a.40.2",
                    "video/mp4;codecs=avc1",
                    "video/mp4;codecs=h264",
                    "video/mp4"
                ];
                for (const candidate of mp4Candidates) {
                    if (MediaRecorder.isTypeSupported(candidate)) {
                        chosenMime = candidate;
                        finalExt = "mp4";
                        break;
                    }
                }
            }

            // Fallback to WebM if MP4 is unsupported or WebM is chosen
            if (!chosenMime) {
                const webmCandidates = [
                    "video/webm;codecs=vp9,opus",
                    "video/webm;codecs=vp8,opus",
                    "video/webm"
                ];
                for (const candidate of webmCandidates) {
                    if (MediaRecorder.isTypeSupported(candidate)) {
                        chosenMime = candidate;
                        finalExt = "webm";
                        break;
                    }
                }
            }

            if (!chosenMime) {
                chosenMime = "video/webm";
                finalExt = "webm";
            }

            setRenderedFormat(finalExt);

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: chosenMime,
                videoBitsPerSecond: 6000000 // Crisp 6 Mbps
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const finalBlob = new Blob(chunks, { type: chosenMime });
                const finalUrl = URL.createObjectURL(finalBlob);
                setRenderedVideoUrl(finalUrl);
                setIsRendering(false);
                setRenderProgress(100);
                isExportingRef.current = false;

                // Stop media elements
                if (voiceAudioEl) voiceAudioEl.pause();
                if (bgmAudioEl) bgmAudioEl.pause();
                clips.forEach(c => {
                    const v = videoElementsRef.current[c.id];
                    if (v) v.pause();
                });
                audioCtx.close().catch(() => {});

                // Record financial stats
                updateFinancialTracker();

                // Trigger Instant Download
                const a = document.createElement("a");
                a.href = finalUrl;
                a.download = `LYHU_${aspectRatio.replace(":", "-")}_${Date.now()}.${finalExt}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            // Start playing audio
            if (voiceAudioEl) voiceAudioEl.play().catch(() => {});
            if (bgmAudioEl) bgmAudioEl.play().catch(() => {});

            recorder.start(100);

            // Step through rendering synchronously
            let exportTime = 0;
            const fps = 30;
            const step = 1 / fps;

            const renderInterval = setInterval(() => {
                exportTime += step;
                setCurrentTime(exportTime);

                // Sync video elements for active clip
                const switchSec = Math.max(2, clipSwitchInterval);
                const clipIdx = Math.floor(exportTime / switchSec) % clips.length;
                const activeClip = clips[clipIdx];
                const activeVid = videoElementsRef.current[activeClip.id];
                if (activeVid) {
                    const localTime = (exportTime % switchSec) % Math.max(1, activeClip.duration);
                    if (Math.abs(activeVid.currentTime - localTime) > 0.2) {
                        activeVid.currentTime = localTime;
                    }
                    if (activeVid.paused) {
                        activeVid.play().catch(() => {});
                    }
                }

                // Dynamic Audio Ducking during export
                if (bgmGainNode) {
                    const isSpeaking = voiceDuration > 0 && exportTime < voiceDuration;
                    bgmGainNode.gain.value = enableAudioDucking && isSpeaking
                        ? bgmVolume * 0.22
                        : bgmVolume;
                }

                drawCanvasFrame(exportTime);

                const progress = Math.min(99, Math.round((exportTime / totalDuration) * 100));
                setRenderProgress(progress);

                if (exportTime >= totalDuration) {
                    clearInterval(renderInterval);
                    recorder.stop();
                }
            }, 1000 / fps);

        } catch (err: any) {
            console.error("Render error:", err);
            alert("Có lỗi khi render video: " + err.message);
            setIsRendering(false);
            isExportingRef.current = false;
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
                            ✦ MP4 Pro & TikTok Edition
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 pl-11">
                        Cắt ghép góc quay tự động, khớp nhịp giọng đọc, phụ đề động thương hiệu & xuất MP4 chỉ với ~85đ/video!
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
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-teal-800 font-semibold">
                        <span>Chi phí dựng video này:</span>
                        <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
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

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                        <span>Tiết kiệm so với thuê ngoài / SaaS:</span>
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" /> 98.5%
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
                {/* LEFT: Controls & Setup (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    
                    {/* BƯỚC 1: VIDEO QUAY THÔ & TỈ LỆ KHUNG HÌNH */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <FileVideo className="w-4 h-4 text-purple-600" />
                                1. Nạp video thô & Tỉ lệ khung hình ({clips.length} clip)
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
                                        ? "border-purple-600 bg-purple-50/60 text-purple-900 shadow-sm ring-1 ring-purple-500"
                                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                                }`}
                            >
                                <Smartphone className="w-5 h-5" />
                                <div className="text-center">
                                    <div className="font-bold text-xs">9:16 (Dọc)</div>
                                    <div className="text-[10px] text-gray-400">TikTok / Reels / Shorts</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAspectRatio("16:9")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                    aspectRatio === "16:9"
                                        ? "border-purple-600 bg-purple-50/60 text-purple-900 shadow-sm ring-1 ring-purple-500"
                                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                                }`}
                            >
                                <Monitor className="w-5 h-5" />
                                <div className="text-center">
                                    <div className="font-bold text-xs">16:9 (Ngang)</div>
                                    <div className="text-[10px] text-gray-400">YouTube / Web / TV</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAspectRatio("1:1")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                    aspectRatio === "1:1"
                                        ? "border-purple-600 bg-purple-50/60 text-purple-900 shadow-sm ring-1 ring-purple-500"
                                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                                }`}
                            >
                                <Square className="w-5 h-5" />
                                <div className="text-center">
                                    <div className="font-bold text-xs">1:1 (Vuông)</div>
                                    <div className="text-[10px] text-gray-400">Facebook / Instagram Feed</div>
                                </div>
                            </button>
                        </div>

                        {/* Upload Dropzone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 hover:border-purple-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-purple-50/20 group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="p-2.5 rounded-full bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5 text-purple-600" />
                                </span>
                                <p className="text-xs font-semibold text-gray-700">
                                    Nhấp để tải lên các đoạn video quay thô (MP4, MOV, WebM)
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    Có thể chọn nhiều file cùng lúc • Hệ thống tự cắt và ghép nhịp nhàng
                                </p>
                            </div>
                        </div>

                        {/* Clip list */}
                        {clips.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-600">Thứ tự góc quay phát trong video:</span>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {clips.map((c, idx) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-gray-100 text-xs"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium text-gray-800 truncate">{c.name}</span>
                                                <span className="text-[10px] text-gray-400 font-mono shrink-0">({c.duration.toFixed(1)}s)</span>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => moveClip(idx, "up")}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-white rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                                >
                                                    <MoveUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveClip(idx, "down")}
                                                    disabled={idx === clips.length - 1}
                                                    className="p-1 hover:bg-white rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                                >
                                                    <MoveDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeClip(c.id)}
                                                    className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BƯỚC 2: GIỌNG ĐỌC AI & KỊCH BẢN THUYẾT MINH */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-teal-600" />
                                2. Giọng đọc thuyết minh & Phụ đề ({voiceHistory.length} giọng sẵn có)
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsEditingText(!isEditingText)}
                                className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                {isEditingText ? "Đóng sửa lời" : "Sửa lời thoại"}
                            </button>
                        </div>

                        {/* Pick from Voice Studio History */}
                        {voiceHistory.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {voiceHistory.slice(0, 6).map((item) => {
                                    const isSel = selectedVoiceId === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => selectVoiceItem(item)}
                                            className={`p-3 rounded-xl border text-left transition-all relative ${
                                                isSel
                                                    ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 text-teal-900"
                                                    : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                <span>{item.styleName || item.title || "Giọng đọc AI"}</span>
                                                <span className="font-mono text-[10px] text-gray-400">
                                                    ~{item.estimatedSeconds || 15}s
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                                {item.text}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                Chưa có file giọng đọc nào được lưu. Bạn có thể sang <strong>Studio Lồng Tiếng</strong> để tạo giọng AI, hoặc bấm tải file MP3 bên dưới.
                            </div>
                        )}

                        {/* Edit Script Textarea */}
                        {isEditingText && (
                            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                <label className="text-xs font-semibold text-gray-700">Nội dung phụ đề / lời thoại:</label>
                                <textarea
                                    rows={3}
                                    value={selectedVoiceText}
                                    onChange={(e) => setSelectedVoiceText(e.target.value)}
                                    placeholder="Nhập nội dung lời thoại để AI tự sinh phụ đề..."
                                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:border-teal-500 outline-none leading-relaxed"
                                />
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

                    {/* BƯỚC 3: FONT CHỮ THƯƠNG HIỆU & PHỤ ĐỀ ĐỘNG */}
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
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs font-semibold"
                                >
                                    <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro (Chuẩn Thương Hiệu LYHU)</option>
                                    <option value="Montserrat, sans-serif">Montserrat (Hiện đại TikTok & Reels)</option>
                                    <option value="'Arial Black', Impact, sans-serif">Arial Black / Impact (Dày dặn, bán hàng mạnh)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Chuẩn đài truyền hình, đĩnh đạc)</option>
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
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs font-semibold"
                                    >
                                        <option value="tiktok_stroke">Viền đen đậm (TikTok Viral)</option>
                                        <option value="neon_glow">Phát sáng Neon (Gen Z)</option>
                                        <option value="pill_dark">Hộp nền tối mờ (Chuyên nghiệp)</option>
                                        <option value="clean_shadow">Đổ bóng mờ tối giản</option>
                                    </select>
                                    {/* Color Picker */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <input
                                            type="color"
                                            value={textColor}
                                            onChange={(e) => setTextColor(e.target.value)}
                                            className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
                                            title="Tự chọn màu chữ tùy ý"
                                        />
                                    </div>
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

                        {/* Hook Title (3.5s đầu) */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-gray-700">Tiêu đề giật tít Hook (Hiện ở 3.5 giây đầu để giữ chân):</label>
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
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs font-semibold"
                                >
                                    <option value="auto">✨ Tự động luân phiên (Khuyên dùng)</option>
                                    <option value="crossfade">🌫️ Mờ chồng (Crossfade - Mượt mà)</option>
                                    <option value="slide_left">➡️ Trượt ngang (Slide Left - Năng động)</option>
                                    <option value="white_flash">💥 Chớp sáng (White Flash - Nổi bật)</option>
                                    <option value="hard_cut">⚡ Cắt nhanh (Hard Cut - Chuẩn TikTok)</option>
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
                                    step={0.5}
                                    value={clipSwitchInterval}
                                    onChange={(e) => setClipSwitchInterval(parseFloat(e.target.value))}
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
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-slate-50 outline-none text-xs font-semibold"
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

                            {/* BGM Volume Slider */}
                            {bgmChoice !== "none" && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-gray-700">Âm lượng nhạc nền:</label>
                                        <span className="font-mono text-purple-600 font-bold">{Math.round(bgmVolume * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.05}
                                        max={0.5}
                                        step={0.02}
                                        value={bgmVolume}
                                        onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                                        className="w-full accent-purple-600"
                                    />
                                </div>
                            )}
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
                                <span className="text-gray-700 font-medium">Tự động giảm nhạc nền khi có tiếng nói (Audio Ducking)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showWatermark}
                                    onChange={(e) => setShowWatermark(e.target.checked)}
                                    className="accent-teal-600 rounded"
                                />
                                <span className="text-gray-700 font-medium">Gắn logo LYHU! Tổng Kho Sỉ B2B</span>
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

                        {/* Device Frame */}
                        <div className={`relative mx-auto bg-slate-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-slate-800 transition-all ${
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

                                {/* Render progress overlay */}
                                {isRendering && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white text-center z-20">
                                        <div className="w-12 h-12 border-4 border-purple-400 border-t-white rounded-full animate-spin mb-3" />
                                        <div className="font-black text-xl font-mono">{renderProgress}%</div>
                                        <div className="text-xs font-semibold text-purple-200 mt-1">
                                            Đang xuất video {exportFormat.toUpperCase()}...
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
                                            Khớp khung hình, lồng tiếng & nhạc nền tự động
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Playback Scrubbing & Controls */}
                        <div className="space-y-2 pt-2">
                            <input
                                type="range"
                                min={0}
                                max={Math.max(1, totalDuration)}
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
                                        if (bgmAudioRef.current) bgmAudioRef.current.currentTime = 0;
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

                        {/* Export Format Selection */}
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">Định dạng xuất video:</span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat("mp4")}
                                        className={`px-2.5 py-1 rounded-lg border font-bold text-xs transition-colors ${
                                            exportFormat === "mp4"
                                                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                                : "bg-slate-50 text-gray-600 border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        MP4 (Chuẩn phổ thông)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat("webm")}
                                        className={`px-2.5 py-1 rounded-lg border font-bold text-xs transition-colors ${
                                            exportFormat === "webm"
                                                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                                : "bg-slate-50 text-gray-600 border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        WEBM (Nhẹ)
                                    </button>
                                </div>
                            </div>

                            {/* Export Button */}
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
                                        <span>XUẤT VIDEO {exportFormat.toUpperCase()} TỰ ĐỘNG (~{estimatedCurrentVideoCost}đ)</span>
                                    </>
                                )}
                            </button>

                            {/* Download Ready Banner */}
                            {renderedVideoUrl && !isRendering && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold truncate">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Video {renderedFormat.toUpperCase()} đã sẵn sàng!</span>
                                    </div>
                                    <a
                                        href={renderedVideoUrl}
                                        download={`LYHU_${aspectRatio.replace(":", "-")}_${Date.now()}.${renderedFormat}`}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Tải lại</span>
                                    </a>
                                </div>
                            )}

                            <p className="text-[11px] text-center text-gray-400">
                                ✓ Tương thích 100% TikTok, Facebook Reels, Shorts & Zalo
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden media elements for canvas sync */}
            <div className="hidden">
                {clips.map((clip) => (
                    <video
                        key={clip.id}
                        ref={(el) => {
                            videoElementsRef.current[clip.id] = el;
                        }}
                        src={clip.url}
                        playsInline
                        muted
                        preload="auto"
                        crossOrigin="anonymous"
                    />
                ))}
                <audio ref={hiddenAudioRef} src={selectedVoiceAudioUrl || ""} />
                <audio ref={bgmAudioRef} src={activeBgmUrl || ""} loop />
            </div>
        </div>
    );
}
