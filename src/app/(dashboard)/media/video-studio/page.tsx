"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
    Film,
    Upload,
    Play,
    Pause,
    Download,
    Sparkles,
    Trash2,
    RotateCcw,
    Plus,
    MoveUp,
    MoveDown,
    Eye,
    Radio,
    FileVideo,
    CheckCircle2,
    Wand2,
    DollarSign,
    TrendingDown,
    Palette,
    Zap,
    Monitor,
    Smartphone,
    Square,
    Edit3,
    Volume2,
    Music,
    Loader2
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
    muted: boolean;
}

interface SubtitleCue {
    start: number; // seconds
    end: number;   // seconds
    text: string;
}

// Preset local royalty-free BGM tracks
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
        name: "🔇 Không dùng nhạc nền (Chỉ giữ giọng đọc)",
        url: ""
    }
];

interface LyhuTemplate {
    id: string;
    badge: string;
    title: string;
    hookTitle: string;
    script: string;
    pacing: number;
    transition: "auto" | "crossfade" | "slide_left" | "white_flash" | "hard_cut";
    bgm: string;
    textColor: string;
    subtitleStyle: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow";
}

const LYHU_TEMPLATES: LyhuTemplate[] = [
    {
        id: "kho_dem",
        badge: "🌙 Chuyện Kho Đêm",
        title: "Kể chuyện đóng hàng sỉ xuyên đêm (Chuẩn phong cách 24Zone)",
        hookTitle: "🌙 11H ĐÊM KHO SỈ LYHU VẪN ĐÓNG HÀNG!",
        script: "Nhiều người bảo giờ này chỉ có đi ngủ, nhưng ở tổng kho sỉ LYHU thì bọn mình vẫn đang kiểm từng kiện hàng để sáng mai kịp giao cho các chủ quán. Nào là thanh khoai môn sấy trứng cua, da cá hoàng kim, bánh tráng Abi với bột phô mai Boyo. Khách đặt cả trăm thùng thì dù khuya mấy bọn mình cũng đóng gói cẩn thận. Cần mẫu thử hay bảng giá sỉ cứ nhắn bọn mình nha!",
        pacing: 2.5,
        transition: "auto",
        bgm: "trending_upbeat",
        textColor: "#FACC15",
        subtitleStyle: "tiktok_stroke"
    },
    {
        id: "khoai_mon_trung_cua",
        badge: "🦀 Review Món Hot",
        title: "Thanh khoai môn sấy trứng cua & Truffle (Kén khách nhưng siêu ngon)",
        hookTitle: "🦀 THANH KHOAI MÔN TRỨNG CUA CÓ GÌ MÀ HOT?",
        script: "Nhiều người bảo snack khoai môn sấy trên thị trường thiếu gì, sao LYHU lại mang dòng trứng cua với nấm truffle này về bán sỉ? Nói thật là vì vị nó quá cuốn! Sấy thăng hoa giòn rụm, phủ lớp trứng cua béo ngậy mằn mặn, ăn là dính. Quán cafe hay quán trà sữa để món này lên quầy là khách gọi lai rai suốt buổi. Ai muốn lấy thử thùng sỉ trải nghiệm nhắn LYHU gửi liền nha!",
        pacing: 2.5,
        transition: "crossfade",
        bgm: "food_review",
        textColor: "#22D3EE",
        subtitleStyle: "neon_glow"
    },
    {
        id: "bot_pho_mai_boyo",
        badge: "🧀 Bột Phô Mai BOYO",
        title: "Bột phô mai BOYO tận xưởng cho quán F&B (Mở bán rộn ràng)",
        hookTitle: "🧀 BỘT PHÔ MAI BOYO GIÁ SỈ TẬN XƯỞNG!",
        script: "500 anh em chủ quán ăn vặt và F&B ơi! Lô bột phô mai Boyo chính hãng mới về ngập kho LYHU rồi nè! Hạt mịn màng, thơm nức mũi, vị mặn ngọt béo ngậy chuẩn công thức cho quán gà rán, khoai tây lắc. Lấy bao 1kg tiết kiệm chi phí tối đa, bao đổi trả nếu không chuẩn vị. Cần bảng giá sỉ sập sàn để lại bình luận cho bọn mình nhé!",
        pacing: 2.5,
        transition: "slide_left",
        bgm: "trending_upbeat",
        textColor: "#FACC15",
        subtitleStyle: "tiktok_stroke"
    }
];

// Demo video clips for instant testing
const DEMO_CLIPS = [
    {
        name: "Tổng kho sỉ đồ ăn vặt & Đóng hàng",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        name: "Thanh khoai môn sấy & Bột phô mai",
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
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // ── STEP 2: Voiceover & Audio State ──
    const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
    const [selectedVoiceAudioUrl, setSelectedVoiceAudioUrl] = useState<string | null>(null);
    const [selectedVoiceText, setSelectedVoiceText] = useState<string>(
        "Nhiều người bảo giờ này chỉ có đi ngủ, nhưng ở tổng kho sỉ LYHU thì bọn mình vẫn đang kiểm từng kiện hàng để sáng mai kịp giao cho các chủ quán. Nào là thanh khoai môn sấy trứng cua, da cá hoàng kim, bánh tráng Abi với bột phô mai Boyo. Cần mẫu thử hay bảng giá sỉ cứ nhắn bọn mình nha!"
    );
    const [voiceDuration, setVoiceDuration] = useState<number>(30);
    const [isEditingText, setIsEditingText] = useState(false);

    // ── STEP 3: Subtitles & Brand Typography ──
    const [enableSubtitles, setEnableSubtitles] = useState(true);
    const [fontFamily, setFontFamily] = useState<string>("'Be Vietnam Pro', Montserrat, sans-serif");
    const [fontSize, setFontSize] = useState<number>(28);
    const [textColor, setTextColor] = useState<string>("#FACC15"); // Bright yellow
    const [textPosition, setTextPosition] = useState<"bottom" | "center" | "top">("bottom");
    const [subtitleStyle, setSubtitleStyle] = useState<"tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow">("tiktok_stroke");
    const [customHookTitle, setCustomHookTitle] = useState("🔥 TỔNG KHO ĂN VẶT & BỘT PHÔ MAI BOYO GIÁ SỈ!");
    const [showHookTitle, setShowHookTitle] = useState(true);

    // ── STEP 4: Transitions & Pacing ──
    const [transitionEffect, setTransitionEffect] = useState<"auto" | "crossfade" | "slide_left" | "white_flash" | "hard_cut">("auto");
    const [clipSwitchInterval, setClipSwitchInterval] = useState<number>(2.5); // 2.5s per shot (Nhịp cắt 24Zone)
    const [showWatermark, setShowWatermark] = useState(true);
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>("kho_dem");

    // ── STEP 5: Background Music (BGM) ──
    const [bgmChoice, setBgmChoice] = useState<string>("trending_upbeat");
    const [bgmCustomUrl, setBgmCustomUrl] = useState<string | null>(null);
    const [bgmVolume, setBgmVolume] = useState<number>(0.15); // 15% volume
    const [enableAudioDucking, setEnableAudioDucking] = useState(true);

    // ── AI STYLE CLONE STATE ──
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(true);
    const [cloneRefUrl, setCloneRefUrl] = useState("https://www.tiktok.com/@tra.my.24zone/video/7653479957431061778");
    const [cloneTopic, setCloneTopic] = useState("Hàng khoai môn CVT container về buổi đêm date mới tinh");
    const [isAnalyzingClone, setIsAnalyzingClone] = useState(false);
    const [cloneStoryboard, setCloneStoryboard] = useState<string[]>([]);

    // ── FINANCIAL / USAGE TRACKER ──
    const [totalVideosCreated, setTotalVideosCreated] = useState<number>(0);
    const [totalCostSpent, setTotalCostSpent] = useState<number>(0);

    // ── PLAYBACK STATE (Throttled for Smooth 60FPS UI) ──
    const [isPlaying, setIsPlaying] = useState(false);
    const [displayTime, setDisplayTime] = useState(0); // Only updated ~5 times/sec for UI
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);
    const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
    const [renderedFormat, setRenderedFormat] = useState<string>("mp4");

    // ── REFS (Avoid React Re-renders on high-speed loops) ──
    const currentTimeRef = useRef<number>(0);
    const lastActiveClipIdRef = useRef<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hiddenAudioRef = useRef<HTMLAudioElement | null>(null);
    const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
    const videoElementsRef = useRef<{ [key: string]: HTMLVideoElement | null }>({});
    const animationFrameRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const bgmInputRef = useRef<HTMLInputElement | null>(null);
    const isExportingRef = useRef(false);
    const lastUiUpdateRef = useRef<number>(0);

    // Inject Google Brand Fonts
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

    // Load History & Financials on mount
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
    const aiAnalysisCost = 35;
    const ttsCost = Math.round(wordCount * 0.4);
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

    // Project Total Duration
    const totalDuration = voiceDuration > 0 ? voiceDuration : (clips.length > 0 ? clips.reduce((acc, c) => acc + c.duration, 0) : 30);

    // ── ROBUST VIDEO UPLOAD PROCESSOR (With timeout & drag-drop) ──
    const processVideoFiles = async (fileList: FileList | File[]) => {
        if (!fileList || fileList.length === 0) return;
        setIsUploadingVideo(true);

        const newClips: VideoClip[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|avi|mkv|m4v)$/i)) {
                continue;
            }

            const url = URL.createObjectURL(file);

            // Extract metadata with strict timeout to prevent hangs
            const meta = await new Promise<{ duration: number; width: number; height: number }>((resolve) => {
                let resolved = false;
                const vid = document.createElement("video");
                vid.src = url;
                vid.preload = "metadata";

                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve({ duration: 15, width: 1080, height: 1920 });
                    }
                }, 1200);

                vid.onloadedmetadata = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve({
                            duration: vid.duration && !isNaN(vid.duration) && vid.duration > 0 ? vid.duration : 15,
                            width: vid.videoWidth || 1080,
                            height: vid.videoHeight || 1920
                        });
                    }
                };

                vid.onerror = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve({ duration: 15, width: 1080, height: 1920 });
                    }
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

        if (newClips.length > 0) {
            setClips(prev => [...prev, ...newClips]);
        }
        setIsUploadingVideo(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await processVideoFiles(e.target.files);
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            await processVideoFiles(e.dataTransfer.files);
        }
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

    const handleApplyTemplate = (tpl: LyhuTemplate) => {
        setActiveTemplateId(tpl.id);
        setCustomHookTitle(tpl.hookTitle);
        setSelectedVoiceText(tpl.script);
        setClipSwitchInterval(tpl.pacing);
        setTransitionEffect(tpl.transition);
        setBgmChoice(tpl.bgm);
        setTextColor(tpl.textColor);
        setSubtitleStyle(tpl.subtitleStyle);
        setFontFamily("'Be Vietnam Pro', Montserrat, sans-serif");
        setVoiceDuration(32);
        setShowHookTitle(true);
        setEnableSubtitles(true);

        if (clips.length === 0) {
            const demoFormatted: VideoClip[] = DEMO_CLIPS.map((demo, idx) => ({
                id: `demo-${idx}-${Date.now()}`,
                url: demo.url,
                name: demo.name,
                duration: demo.duration,
                width: demo.width,
                height: demo.height,
                muted: true
            }));
            setClips(demoFormatted);
        }

        currentTimeRef.current = 0;
        setDisplayTime(0);
        setTimeout(() => {
            drawCanvasFrame(0);
        }, 50);
    };

    const handleCloneStyle = async () => {
        if (!cloneTopic.trim()) {
            alert("Vui lòng nhập chủ đề sản phẩm của bạn!");
            return;
        }

        setIsAnalyzingClone(true);
        try {
            const res = await fetch("/api/ai/clone-video-style", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    referenceUrl: cloneRefUrl.trim(),
                    userTopic: cloneTopic.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                setCustomHookTitle(data.hookTitle || customHookTitle);
                setSelectedVoiceText(data.script || selectedVoiceText);
                setClipSwitchInterval(data.pacing || 2.5);
                setTransitionEffect(data.transition || "auto");
                setTextColor(data.textColor || "#FACC15");
                setSubtitleStyle(data.subtitleStyle || "tiktok_stroke");
                setFontFamily("'Be Vietnam Pro', Montserrat, sans-serif");
                setVoiceDuration(45);
                setShowHookTitle(true);
                setEnableSubtitles(true);
                if (data.storyboard && data.storyboard.length > 0) {
                    setCloneStoryboard(data.storyboard);
                }
                if (clips.length === 0) {
                    handleLoadDemoClips();
                }
                alert("✨ AI đã học phong cách video mẫu thành công! Kịch bản, tiêu đề hook và nhịp dựng đã được nạp tự động vào Studio.");
            } else {
                alert("Không thể phân tích: " + (data.error || "Lỗi không xác định"));
            }
        } catch (e: any) {
            alert("Lỗi khi kết nối AI: " + e.message);
        } finally {
            setIsAnalyzingClone(false);
        }
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
        if (audioInputRef.current) audioInputRef.current.value = "";
    };

    const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setBgmCustomUrl(url);
        setBgmChoice("custom");
        if (bgmInputRef.current) bgmInputRef.current.value = "";
    };

    // ── DRAW FRAME ON CANVAS (Hardware-accelerated) ──
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

        if (clips.length === 0) {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, cw, ch);
            ctx.fillStyle = "#64748b";
            ctx.font = "bold 20px 'Be Vietnam Pro', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Chưa có video quay thô", cw / 2, ch / 2 - 12);
            ctx.font = "14px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("Nhấp '+ Tải video từ máy' hoặc '+ Dùng 2 clip mẫu'", cw / 2, ch / 2 + 16);
            return;
        }

        const switchSec = Math.max(2, clipSwitchInterval);
        const clipIdx = Math.floor(time / switchSec) % clips.length;
        const currentClip = clips[clipIdx];
        const nextClipIdx = (clipIdx + 1) % clips.length;
        const nextClip = clips[nextClipIdx];

        const timeInInterval = time % switchSec;
        const transitionWindow = 0.45;
        const isNearTransition = switchSec - timeInInterval <= transitionWindow && clips.length > 1;
        const transitionFactor = isNearTransition ? (switchSec - timeInInterval) / transitionWindow : 1.0;

        const currentVid = videoElementsRef.current[currentClip.id];
        const nextVid = videoElementsRef.current[nextClip.id];

        // Active transition effect
        let activeTrans = transitionEffect;
        if (activeTrans === "auto") {
            const transPool: ("crossfade" | "white_flash" | "slide_left" | "crossfade")[] = [
                "crossfade",
                "slide_left",
                "white_flash",
                "crossfade"
            ];
            activeTrans = transPool[clipIdx % transPool.length];
        }

        // Draw cover video helper
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

        const zoomProgress = (time % clipSwitchInterval) / clipSwitchInterval;
        const dynamicScale = 1.0 + zoomProgress * 0.04;

        // Render with Transition
        if (isNearTransition && clips.length > 1) {
            if (activeTrans === "crossfade") {
                if (nextVid) drawVideoCover(nextVid, 0, 1.0, 1.0);
                if (currentVid) drawVideoCover(currentVid, 0, transitionFactor, dynamicScale);

            } else if (activeTrans === "slide_left") {
                const slideOffset = (1 - transitionFactor) * cw;
                if (currentVid) drawVideoCover(currentVid, -slideOffset, 1.0, dynamicScale);
                if (nextVid) drawVideoCover(nextVid, cw - slideOffset, 1.0, 1.0);

            } else if (activeTrans === "white_flash") {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                const flashAlpha = Math.sin((1 - transitionFactor) * Math.PI) * 0.85;
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(0, 0, cw, ch);
                ctx.restore();

            } else {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
            }
        } else {
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

            const grad = ctx.createLinearGradient(badgeX, hookY, badgeX + badgeW, hookY);
            grad.addColorStop(0, "#DC2626");
            grad.addColorStop(1, "#EA580C");
            ctx.fillStyle = grad;
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.roundRect(badgeX, hookY - badgeH / 2, badgeW, badgeH, 10);
            ctx.fill();

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
        if (enableSubtitles) {
            const activeSub = subtitleCues.find(cue => time >= cue.start && time <= cue.end);
            if (activeSub) {
                ctx.save();
                const text = activeSub.text;

                let subY = ch * 0.82;
                if (textPosition === "center") subY = ch * 0.52;
                if (textPosition === "top") subY = ch * 0.28;

                ctx.font = `900 ${fontSize}px ${fontFamily}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                if (subtitleStyle === "tiktok_stroke") {
                    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
                    ctx.shadowBlur = 12;
                    ctx.lineWidth = 7;
                    ctx.strokeStyle = "#000000";
                    ctx.lineJoin = "round";
                    ctx.strokeText(text, cw / 2, subY);

                    ctx.fillStyle = textColor;
                    ctx.fillText(text, cw / 2, subY);

                } else if (subtitleStyle === "neon_glow") {
                    ctx.shadowColor = textColor;
                    ctx.shadowBlur = 16;
                    ctx.lineWidth = 5;
                    ctx.strokeStyle = "#000000";
                    ctx.lineJoin = "round";
                    ctx.strokeText(text, cw / 2, subY);

                    ctx.fillStyle = textColor;
                    ctx.fillText(text, cw / 2, subY);

                } else if (subtitleStyle === "pill_dark") {
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
        }
    }, [
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
        subtitleCues
    ]);

    // ── HIGH-PERFORMANCE PREVIEW PLAYBACK LOOP (0 STUTTER) ──
    const startPlayback = () => {
        if (clips.length === 0) return;
        setIsPlaying(true);

        const currentT = currentTimeRef.current;

        // 1. Play Voice Audio
        if (hiddenAudioRef.current && selectedVoiceAudioUrl) {
            hiddenAudioRef.current.currentTime = currentT;
            hiddenAudioRef.current.play().catch(() => {});
        }

        // 2. Play BGM Audio
        if (bgmAudioRef.current && activeBgmUrl) {
            const bgm = bgmAudioRef.current;
            bgm.currentTime = currentT % (bgm.duration || 60);
            bgm.volume = bgmVolume;
            bgm.play().catch(() => {});
        }

        // 3. Play Active Video Clip
        const switchSec = Math.max(2, clipSwitchInterval);
        const clipIdx = Math.floor(currentT / switchSec) % clips.length;
        const activeClip = clips[clipIdx];
        const activeVid = videoElementsRef.current[activeClip.id];
        if (activeVid) {
            const localT = (currentT % switchSec) % Math.max(1, activeClip.duration);
            activeVid.currentTime = localT;
            activeVid.play().catch(() => {});
            lastActiveClipIdRef.current = activeClip.id;
        }
    };

    const pausePlayback = () => {
        setIsPlaying(false);
        if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
        if (bgmAudioRef.current) bgmAudioRef.current.pause();
        clips.forEach(c => {
            const vid = videoElementsRef.current[c.id];
            if (vid && !vid.paused) vid.pause();
        });
    };

    const togglePlay = () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlayback();
        }
    };

    const handleSeek = (newTime: number) => {
        currentTimeRef.current = newTime;
        setDisplayTime(newTime);

        if (hiddenAudioRef.current) {
            hiddenAudioRef.current.currentTime = newTime;
        }
        if (bgmAudioRef.current) {
            bgmAudioRef.current.currentTime = newTime % (bgmAudioRef.current.duration || 60);
        }

        if (clips.length > 0) {
            const switchSec = Math.max(2, clipSwitchInterval);
            const clipIdx = Math.floor(newTime / switchSec) % clips.length;
            const activeClip = clips[clipIdx];
            const activeVid = videoElementsRef.current[activeClip.id];

            clips.forEach(c => {
                const v = videoElementsRef.current[c.id];
                if (v && c.id !== activeClip.id && !v.paused) v.pause();
            });

            if (activeVid) {
                const localT = (newTime % switchSec) % Math.max(1, activeClip.duration);
                activeVid.currentTime = localT;
                if (isPlaying && activeVid.paused) activeVid.play().catch(() => {});
            }
            lastActiveClipIdRef.current = activeClip.id;
        }

        drawCanvasFrame(newTime);
    };

    // Main 60FPS RequestAnimationFrame Animation Loop
    useEffect(() => {
        if (!isPlaying || isExportingRef.current) return;

        let lastTime = performance.now();

        const loop = (now: number) => {
            if (!isPlaying || isExportingRef.current) return;

            const delta = (now - lastTime) / 1000;
            lastTime = now;

            const nextTime = currentTimeRef.current + delta;
            currentTimeRef.current = nextTime;

            // Loop back when totalDuration ends
            if (nextTime >= totalDuration) {
                pausePlayback();
                currentTimeRef.current = 0;
                setDisplayTime(0);
                drawCanvasFrame(0);
                return;
            }

            // Throttle UI React state update to ~5 times per second to prevent stutter
            if (now - lastUiUpdateRef.current > 180) {
                setDisplayTime(nextTime);
                lastUiUpdateRef.current = now;
            }

            // Dynamic Smooth Audio Ducking
            if (bgmAudioRef.current && activeBgmUrl) {
                const isSpeaking = voiceDuration > 0 && nextTime < voiceDuration;
                const targetVol = enableAudioDucking && isSpeaking ? bgmVolume * 0.22 : bgmVolume;
                bgmAudioRef.current.volume += (targetVol - bgmAudioRef.current.volume) * 0.15;
            }

            // Seamless clip switching
            if (clips.length > 1) {
                const switchSec = Math.max(2, clipSwitchInterval);
                const clipIdx = Math.floor(nextTime / switchSec) % clips.length;
                const currentClip = clips[clipIdx];
                const nextClipIdx = (clipIdx + 1) % clips.length;
                const nextClip = clips[nextClipIdx];
                const timeInInterval = nextTime % switchSec;

                // Pre-roll next clip 0.45s before switch
                if (switchSec - timeInInterval <= 0.45) {
                    const nextVid = videoElementsRef.current[nextClip.id];
                    if (nextVid && nextVid.paused) {
                        nextVid.currentTime = 0;
                        nextVid.play().catch(() => {});
                    }
                }

                // If active clip transitioned, pause previous
                if (currentClip.id !== lastActiveClipIdRef.current) {
                    if (lastActiveClipIdRef.current) {
                        const prevVid = videoElementsRef.current[lastActiveClipIdRef.current];
                        if (prevVid && !prevVid.paused) prevVid.pause();
                    }
                    const activeVid = videoElementsRef.current[currentClip.id];
                    if (activeVid && activeVid.paused) {
                        activeVid.play().catch(() => {});
                    }
                    lastActiveClipIdRef.current = currentClip.id;
                }
            }

            drawCanvasFrame(nextTime);
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, totalDuration, clips, clipSwitchInterval, activeBgmUrl, bgmVolume, enableAudioDucking, voiceDuration, drawCanvasFrame]);

    // Re-draw canvas on aspect ratio or styling change
    useEffect(() => {
        drawCanvasFrame(currentTimeRef.current);
    }, [drawCanvasFrame, aspectRatio]);

    // ── HIGH-FIDELITY MP4 / WEBM VIDEO EXPORT (Real-time Recording) ──
    const handleExportVideo = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (clips.length === 0) {
            alert("Vui lòng tải lên ít nhất 1 video quay thô hoặc bấm '+ Dùng 2 clip mẫu' để dựng video!");
            return;
        }

        pausePlayback();
        setIsRendering(true);
        setRenderProgress(0);
        isExportingRef.current = true;

        try {
            // Setup Web Audio Context for audio mixing
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const destNode = audioCtx.createMediaStreamDestination();

            // 1. Voiceover Source
            let voiceAudioEl: HTMLAudioElement | null = null;
            if (selectedVoiceAudioUrl) {
                voiceAudioEl = new Audio(selectedVoiceAudioUrl);
                voiceAudioEl.crossOrigin = "anonymous";
                const voiceSrc = audioCtx.createMediaElementSource(voiceAudioEl);
                voiceSrc.connect(destNode);
                voiceAudioEl.currentTime = 0;
            }

            // 2. BGM Source with Ducking Gain
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

            // Capture 30FPS canvas stream + mixed audio stream
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
                videoBitsPerSecond: 6500000 // 6.5 Mbps crisp
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

                if (voiceAudioEl) voiceAudioEl.pause();
                if (bgmAudioEl) bgmAudioEl.pause();
                clips.forEach(c => {
                    const v = videoElementsRef.current[c.id];
                    if (v && !v.paused) v.pause();
                });
                audioCtx.close().catch(() => {});

                updateFinancialTracker();

                // Instant download trigger
                const a = document.createElement("a");
                a.href = finalUrl;
                a.download = `LYHU_${aspectRatio.replace(":", "-")}_${Date.now()}.${finalExt}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            // Start Audio
            if (voiceAudioEl) voiceAudioEl.play().catch(() => {});
            if (bgmAudioEl) bgmAudioEl.play().catch(() => {});

            // Start First Video Clip
            const firstVid = videoElementsRef.current[clips[0].id];
            if (firstVid) {
                firstVid.currentTime = 0;
                firstVid.play().catch(() => {});
            }

            recorder.start(100);

            let exportTime = 0;
            const startTime = performance.now();

            const renderTimer = setInterval(() => {
                exportTime = (performance.now() - startTime) / 1000;
                currentTimeRef.current = exportTime;

                // Sync video clips for export
                if (clips.length > 1) {
                    const switchSec = Math.max(2, clipSwitchInterval);
                    const clipIdx = Math.floor(exportTime / switchSec) % clips.length;
                    const curClip = clips[clipIdx];
                    const nxtClip = clips[(clipIdx + 1) % clips.length];
                    const timeInInt = exportTime % switchSec;

                    if (switchSec - timeInInt <= 0.45) {
                        const nxtVid = videoElementsRef.current[nxtClip.id];
                        if (nxtVid && nxtVid.paused) {
                            nxtVid.currentTime = 0;
                            nxtVid.play().catch(() => {});
                        }
                    }

                    const activeVid = videoElementsRef.current[curClip.id];
                    if (activeVid && activeVid.paused) {
                        activeVid.play().catch(() => {});
                    }
                }

                // Dynamic Audio Ducking in export
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
                    clearInterval(renderTimer);
                    recorder.stop();
                }
            }, 1000 / 30);

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

            {/* 🎬 LYHU BRAND & 24ZONE STYLE TEMPLATES SELECTOR */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-purple-800/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-white">
                                    Định Hình Phong Cách Video LYHU (Chuẩn Trà My 24Zone)
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                                    1-Click Setup
                                </span>
                            </div>
                            <p className="text-xs text-purple-200/80">
                                AI tự động cấu hình: Nhịp cắt 2.5s Jump-cut, Hook đập mắt, kịch bản ăn vặt sỉ mộc mạc & nhạc nền Audio Ducking.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCloneModalOpen(!isCloneModalOpen)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold text-xs hover:opacity-95 transition-all flex items-center gap-2 shadow-sm self-start sm:self-center"
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{isCloneModalOpen ? "Ẩn công cụ học mẫu" : "🤖 Nạp Link TikTok / Học Mẫu Video"}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {LYHU_TEMPLATES.map((tpl) => {
                        const isActive = activeTemplateId === tpl.id;
                        return (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => handleApplyTemplate(tpl)}
                                className={`p-3 rounded-xl border text-left transition-all relative group ${
                                    isActive
                                        ? "bg-white/15 border-amber-400 ring-2 ring-amber-400 shadow-lg text-white"
                                        : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                        {tpl.badge}
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-black">
                                            ĐANG CHỌN
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs font-semibold text-white mb-1 line-clamp-1">
                                    {tpl.hookTitle}
                                </div>
                                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                                    {tpl.title}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* 🤖 AI CLONE STYLE & STORYBOARD GENERATOR PANEL */}
                {isCloneModalOpen && (
                    <div className="mt-4 p-4 rounded-xl bg-black/40 border border-purple-500/40 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                                    Nạp Video Mẫu / Link TikTok để AI Học Phong Cách & Viết Kịch Bản Cho LYHU
                                </h4>
                            </div>
                            <span className="text-[10px] font-semibold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                                Gemini AI Engine
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-300 flex items-center justify-between">
                                    <span>Link TikTok tham khảo mẫu:</span>
                                    <span className="text-[10px] text-purple-300">TikTok / Reels URL</span>
                                </label>
                                <input
                                    type="text"
                                    value={cloneRefUrl}
                                    onChange={(e) => setCloneRefUrl(e.target.value)}
                                    placeholder="https://www.tiktok.com/@tra.my.24zone/video/..."
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-300 flex items-center justify-between">
                                    <span>Chủ đề / Sản phẩm LYHU muốn làm:</span>
                                    <span className="text-[10px] text-purple-300">Ăn vặt & Gia vị sỉ</span>
                                </label>
                                <input
                                    type="text"
                                    value={cloneTopic}
                                    onChange={(e) => setCloneTopic(e.target.value)}
                                    placeholder="VD: Hàng khoai môn CVT container về buổi đêm date mới tinh"
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
                                />
                            </div>
                        </div>

                        {/* Quick topic pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-gray-400">Gợi ý chủ đề nhanh:</span>
                            {[
                                "Hàng khoai môn CVT container về buổi đêm date mới tinh",
                                "Bột phô mai BOYO 1kg cho quán khoai tây lắc",
                                "Da cá trứng muối & Bánh tráng Abi Snack giá sỉ"
                            ].map((topic, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCloneTopic(topic)}
                                    className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-purple-200 border border-white/10 transition-colors"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
                            <p className="text-[11px] text-gray-300">
                                AI sẽ phân tích: Nhịp cắt 2.5s, Hook giật tít, phong cách phụ đề, và tạo <strong>Kịch bản thoại + 5 góc quay gợi ý</strong>.
                            </p>
                            <button
                                type="button"
                                onClick={handleCloneStyle}
                                disabled={isAnalyzingClone}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-md"
                            >
                                {isAnalyzingClone ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>AI Đang Phân Tích Video Mẫu...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>✨ AI Học Phong Cách & Cấu Hình Studio</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Storyboard guide display if available */}
                        {cloneStoryboard.length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-purple-950/70 border border-purple-500/40 space-y-2">
                                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <Film className="w-3.5 h-3.5" />
                                    <span>Gợi ý 5 góc quay bằng điện thoại cho chủ đề này (Quay mỗi đoạn 2-3s):</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                    {cloneStoryboard.map((shot, idx) => (
                                        <div key={idx} className="p-2 rounded bg-black/50 border border-white/10 text-[11px] space-y-1">
                                            <div className="font-bold text-amber-400 text-[10px]">CẢNH {idx + 1}</div>
                                            <div className="text-gray-200 line-clamp-3 leading-snug">{shot}</div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-300 italic">
                                    💡 Sau khi quay bằng điện thoại, bạn bấm "Nạp video thô" ở Bước 1 bên dưới để Studio tự động cắt ghép khớp hoàn hảo theo nhịp thoại!
                                </p>
                            </div>
                        )}
                    </div>
                )}
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
                                className="text-xs text-purple-600 hover:text-purple-800 hover:underline font-semibold"
                            >
                                + Dùng 2 clip mẫu Tổng kho LYHU
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

                        {/* Upload Dropzone & Button */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                                isDragging
                                    ? "border-purple-500 bg-purple-50 scale-[1.01]"
                                    : "border-gray-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/20"
                            }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                {isUploadingVideo ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                                        <p className="text-xs font-semibold text-purple-700">Đang nạp video vào bộ nhớ...</p>
                                    </div>
                                ) : (
                                    <>
                                        <span className="p-2.5 rounded-full bg-white shadow-sm border border-gray-100">
                                            <Upload className="w-5 h-5 text-purple-600" />
                                        </span>
                                        <p className="text-xs font-bold text-gray-800">
                                            Kéo thả hoặc nhấp để nạp video quay thô
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            Hỗ trợ MP4, MOV, WebM • Chọn nhiều góc quay cùng lúc
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="mt-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm"
                                        >
                                            + Chọn file video từ máy
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hidden Native File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,.mp4,.mov,.webm,.m4v,.mkv"
                            multiple
                            onChange={handleVideoUpload}
                            className="hidden"
                        />

                        {/* Clip list */}
                        {clips.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-600">Thứ tự các góc quay ({clips.length} clip):</span>
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

                        {/* Pick from Voice History */}
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
                                    placeholder="VD: 🔥 TỔNG KHO ĂN VẶT & BỘT PHÔ MAI BOYO GIÁ SỈ!"
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
                                        accept="audio/*,.mp3,.m4a,.wav"
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
                                {displayTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
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
                                value={displayTime}
                                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                                className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSeek(0)}
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
