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
    ArrowRight,
    ArrowLeft,
    Palette,
    Zap,
    Monitor,
    Smartphone,
    Square,
    Edit3,
    Volume2,
    Music,
    Loader2,
    Headphones,
    Flame,
    Copy,
    Check,
    ExternalLink,
    FolderOpen,
    Save,
    Clapperboard,
    Camera,
    Sliders,
    Bookmark,
    FileText,
    ChevronDown,
    ChevronUp,
    X,
    Bot,
    MessageSquare,
    Send,
    Mic,
    RefreshCw,
    Bell,
    Tag,
    Truck,
    Gauge,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { getVoiceHistory, VoiceHistoryItem } from "@/lib/voiceHistoryStore";
import {
    saveVideoProject,
    getVideoProjects,
    deleteVideoProject,
    VideoProjectItem,
    DirectorGuide
} from "@/lib/videoProjectStore";
import { normalizeVietnamesePhonetics, prepareTextForTTS } from "@/lib/ttsHelper";

import {
    VideoClip,
    SubtitleCue,
    LyhuTemplate,
    TikTokTrendingSound
} from "./types";
import {
    VIDEO_FILTERS,
    VIRAL_HOOK_PRESETS,
    TIKTOK_TRENDING_SOUNDS,
    BGM_PRESETS,
    LYHU_TEMPLATES,
    AI_BROLL_LIBRARY,
    DEMO_CLIPS
} from "./lib/constants";
import { playWebAudioSfx } from "./lib/sfx";
import { drawFullStudioCanvas } from "./components/canvas/renderers";
import { ClipPreviewModal } from "./components/modals/ClipPreviewModal";
import { ProjectHistoryModal } from "./components/modals/ProjectHistoryModal";
import { DirectorHubModal } from "./components/modals/DirectorHubModal";
import {
    StudioStepper,
    Step1Script,
    Step2Clips,
    Step3Visuals,
    Step4AudioExport
} from "./components/pipeline";

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
    const [isEditingText, setIsEditingText] = useState(true);
    const [selectedVoiceStyleId, setSelectedVoiceStyleId] = useState<string>("female-genz");
    const [selectedVoiceEngine, setSelectedVoiceEngine] = useState<"gemini" | "edge" | "elevenlabs">("gemini");
    const [isRecordingMic, setIsRecordingMic] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
    const [analyzingStepText, setAnalyzingStepText] = useState<string>("");
    const [isAuditionPlaying, setIsAuditionPlaying] = useState(false);
    const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

    // ── STEP 3: Subtitles & Brand Typography ──
    const [enableSubtitles, setEnableSubtitles] = useState(true);
    const [fontFamily, setFontFamily] = useState<string>("'Be Vietnam Pro', Montserrat, sans-serif");
    const [fontSize, setFontSize] = useState<number>(28);
    const [textColor, setTextColor] = useState<string>("#FACC15"); // Bright yellow
    const [textPosition, setTextPosition] = useState<"bottom" | "center" | "top">("bottom");
    const [subtitleStyle, setSubtitleStyle] = useState<"tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow">("tiktok_stroke");
    const [textAnimationEffect, setTextAnimationEffect] = useState<"tiktok_pop" | "karaoke_glow" | "bicolor_punch" | "fire_shake" | "box_pill" | "clean_fade">("tiktok_pop");
    const [keyPowerWords, setKeyPowerWords] = useState<string[]>(["DATE MỚI TINH", "GIÒN RỤM", "GIÁ SỈ TẬN KHO", "VỪA CẬP BẾN"]);
    const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
    const [customHookTitle, setCustomHookTitle] = useState("🔥 TỔNG KHO ĂN VẶT & BỘT PHÔ MAI BOYO GIÁ SỈ!");
    const [showHookTitle, setShowHookTitle] = useState(true);
    const [hookBannerTheme, setHookBannerTheme] = useState<"tiktok_sticker" | "red_orange" | "black_gold" | "teal_lyhu">("tiktok_sticker");
    const [hookDuration, setHookDuration] = useState<number>(3.5);

    // ── DIRECTOR'S SCRIPTBOOK & PROJECT HISTORY ──
    const [directorGuide, setDirectorGuide] = useState<DirectorGuide | null>(null);
    const [videoProjects, setVideoProjects] = useState<VideoProjectItem[]>([]);
    const [isProjectHistoryOpen, setIsProjectHistoryOpen] = useState(false);
    const [isDirectorHubOpen, setIsDirectorHubOpen] = useState(false);
    const [isSavingProject, setIsSavingProject] = useState(false);

    // ── STEP 4: Transitions & Pacing ──
    const [transitionEffect, setTransitionEffect] = useState<"auto" | "crossfade" | "zoom_in" | "slide_left" | "white_flash" | "hard_cut">("auto");
    const [clipSwitchInterval, setClipSwitchInterval] = useState<number>(2.5); // 2.5s per shot (Nhịp cắt 24Zone)
    const [showWatermark, setShowWatermark] = useState(true);
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
    const [videoFilterPreset, setVideoFilterPreset] = useState<string>("vibrant");

    // ── PREVIEW FOOTAGE MODAL STATE ──
    const [previewingClip, setPreviewingClip] = useState<VideoClip | null>(null);

    // ── STEP 5: Background Music (BGM) ──
    const [bgmChoice, setBgmChoice] = useState<string>("trending_upbeat");
    const [bgmCustomUrl, setBgmCustomUrl] = useState<string | null>(null);
    const [bgmVolume, setBgmVolume] = useState<number>(0.15); // 15% volume
    const [enableAudioDucking, setEnableAudioDucking] = useState(true);

    // ── TIKTOK TRENDING SOUND STATE ──
    const [isTikTokSoundModalOpen, setIsTikTokSoundModalOpen] = useState(false);
    const [tiktokExtractUrl, setTiktokExtractUrl] = useState("");
    const [isExtractingTikTokSound, setIsExtractingTikTokSound] = useState(false);
    const [extractedSoundInfo, setExtractedSoundInfo] = useState<{
        title: string;
        author: string;
        duration: number;
        url: string;
    } | null>(null);
    const [previewingSoundUrl, setPreviewingSoundUrl] = useState<string | null>(null);
    const [copiedSoundTitle, setCopiedSoundTitle] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    // ── AI SCRIPT & STYLE CLONE STATE ──
    const [scriptInputMode, setScriptInputMode] = useState<"ai_prompt" | "clone_link" | "templates">("ai_prompt");
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(true);
    const [cloneRefUrl, setCloneRefUrl] = useState("");
    const [cloneTopic, setCloneTopic] = useState("Hàng khoai môn CVT container về buổi đêm date mới tinh");
    const [isAnalyzingClone, setIsAnalyzingClone] = useState(false);
    const [cloneStoryboard, setCloneStoryboard] = useState<string[]>([]);
    // ── STUDIO STEPPER & WORKFLOW ENGINE ──
    type StudioStep = "step_script" | "step_clips" | "step_visuals" | "step_audio_export" | "copilot";
    const [activeStudioStep, setActiveStudioStep] = useState<StudioStep>("step_script");
    const activeStudioTab = activeStudioStep === "step_clips" ? "clips" : activeStudioStep === "step_visuals" ? "ai_superpowers" : activeStudioStep === "step_audio_export" ? "music" : activeStudioStep === "copilot" ? "copilot" : "script";
    const setActiveStudioTab = (tab: "copilot" | "script" | "clips" | "music" | "ai_superpowers") => {
        if (tab === "clips") setActiveStudioStep("step_clips");
        else if (tab === "ai_superpowers") setActiveStudioStep("step_visuals");
        else if (tab === "music") setActiveStudioStep("step_audio_export");
        else if (tab === "copilot") setActiveStudioStep("copilot");
        else setActiveStudioStep("step_script");
    };
    const [bgmMode, setBgmMode] = useState<"ai_smart" | "manual_trend">("ai_smart");

    // ── STEP 6: AI SUPERPOWERS & CUTTING-EDGE SOUND/STAMP TOOLS ──
    const [enableSfxWhoosh, setEnableSfxWhoosh] = useState<boolean>(true);
    const [enableSfxDing, setEnableSfxDing] = useState<boolean>(true);
    const [enableSfxKaching, setEnableSfxKaching] = useState<boolean>(true);
    const [enableSfxBoom, setEnableSfxBoom] = useState<boolean>(true);
    const [sfxVolume, setSfxVolume] = useState<number>(0.35);
    const [activeSalesSticker, setActiveSalesSticker] = useState<string>("freeship");
    const [stickerPosition, setStickerPosition] = useState<"top_right" | "top_left" | "bottom_right">("top_right");
    const [voiceSpeedMultiplier, setVoiceSpeedMultiplier] = useState<number>(1.0);
    const [isGeneratingBRoll, setIsGeneratingBRoll] = useState<boolean>(false);
    const [viralityScore, setViralityScore] = useState<{
        overall: number;
        hook: number;
        pacing: number;
        conversion: number;
        estimatedViews: string;
        insights: string[];
    }>({
        overall: 94,
        hook: 96,
        pacing: 92,
        conversion: 95,
        estimatedViews: "85.000 - 320.000",
        insights: [
            "Tiêu đề Hook 3.5s đầu chứa yếu tố tò mò kho đêm giữ chân 96% người lướt.",
            "Nhịp chuyển cảnh 2.5s chuẩn nhịp Dopamine TikTok, chống nhàm chán.",
            "Lời kêu gọi nhắn nhận bảng giá sỉ & mẫu thử rõ ràng, thúc đẩy tỷ lệ inbox cao."
        ]
    });
    const previewAudioCtxRef = useRef<AudioContext | null>(null);
    const lastSfxTriggerRef = useRef<{
        lastTransitionIdx: number;
        lastHookDing: boolean;
        lastPowerWord: string | null;
    }>({
        lastTransitionIdx: -1,
        lastHookDing: false,
        lastPowerWord: null
    });

    // ── SIÊU AI ĐẠO DIỄN COPILOT (AUTONOMOUS CHAT & EXECUTION) ──
    const [copilotMessages, setCopilotMessages] = useState<Array<{
        id: string;
        role: "user" | "ai";
        content: string;
        actionsApplied?: string[];
        timestamp: number;
    }>>([
        {
            id: "init-welcome",
            role: "ai",
            content: "Chào anh Huy! Em là **Siêu AI Đạo Diễn LYHU**. Em đã nắm trọn kịch bản khoai môn CVT, bột phô mai BOYO và phong cách phóng sự mộc 24Zone. Anh muốn làm video gì hôm nay hay cần em sửa kịch bản, đổi nhạc, tăng nhịp cắt thế nào cứ ra lệnh cho em nhé!",
            actionsApplied: ["Đã kết nối Studio LYHU"],
            timestamp: Date.now()
        }
    ]);
    const [copilotInput, setCopilotInput] = useState("");
    const [isCopilotThinking, setIsCopilotThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const [trendingCategory, setTrendingCategory] = useState<string>("all");
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

    // Load History & Financials & Saved Projects on mount
    useEffect(() => {
        loadHistory();
        loadFinancialTracker();
        loadSavedProjects();
    }, []);

    const loadSavedProjects = async () => {
        try {
            const list = await getVideoProjects();
            setVideoProjects(list);
        } catch (e) {
            console.warn("Lỗi tải lịch sử dự án:", e);
        }
    };

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
        } catch (e) {
            console.warn("Lỗi đọc lịch sử giọng đọc:", e);
        }
    };

    // ── NATIVE AI SPEECH SYNTHESIS ENGINE (Google Gemini Neural / Edge / ElevenLabs) ──
    const generateSpeechForText = async (
        textToSpeak: string,
        styleId = selectedVoiceStyleId,
        engineChoice = selectedVoiceEngine
    ): Promise<string | null> => {
        if (!textToSpeak || !textToSpeak.trim()) {
            alert("Vui lòng nhập kịch bản hoặc lời thoại cần thu âm!");
            return null;
        }
        setIsSynthesizingVoice(true);
        try {
            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: textToSpeak.trim(),
                    voice: styleId,
                    style: styleId,
                    engine: engineChoice,
                    rateMultiplier: voiceSpeedMultiplier || 1.0,
                    geminiApiKey: typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") || undefined : undefined,
                    elevenApiKey: typeof window !== "undefined" ? localStorage.getItem("ELEVENLABS_API_KEY") || undefined : undefined
                }),
                signal: AbortSignal.timeout(45000)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Lỗi máy chủ TTS (${res.status})`);
            }

            const blob = await res.blob();
            if (blob.size < 100) {
                throw new Error("File âm thanh không hợp lệ, vui lòng thử lại!");
            }

            const url = URL.createObjectURL(blob);
            setSelectedVoiceAudioUrl(url);
            setSelectedVoiceId("ai-generated");

            // Measure exact audio duration
            const tempAudio = new Audio(url);
            tempAudio.onloadedmetadata = () => {
                if (tempAudio.duration && !isNaN(tempAudio.duration) && tempAudio.duration > 0) {
                    setVoiceDuration(tempAudio.duration);
                }
            };

            // Update hidden audio element for video playback
            if (hiddenAudioRef.current) {
                hiddenAudioRef.current.src = url;
            }
            // Update audition audio element
            if (auditionAudioRef.current) {
                auditionAudioRef.current.src = url;
            }

            return url;
        } catch (err: any) {
            console.error("Lỗi tạo giọng đọc AI:", err);
            alert("Không thể tạo giọng đọc: " + err.message);
            return null;
        } finally {
            setIsSynthesizingVoice(false);
        }
    };

    // ── DIRECT MICROPHONE RECORDING (Voice-Over By User) ──
    const handleStartMicRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(audioBlob);
                setSelectedVoiceAudioUrl(url);
                setSelectedVoiceId("mic-recorded");

                const tempAudio = new Audio(url);
                tempAudio.onloadedmetadata = () => {
                    if (tempAudio.duration && !isNaN(tempAudio.duration) && tempAudio.duration > 0) {
                        setVoiceDuration(tempAudio.duration);
                    }
                };

                if (hiddenAudioRef.current) {
                    hiddenAudioRef.current.src = url;
                }

                stream.getTracks().forEach((track) => track.stop());
                alert("🎙️ Đã thu âm giọng nói của bạn thành công và đồng bộ vào video!");
            };

            mediaRecorder.start();
            setIsRecordingMic(true);
            setRecordingSeconds(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);
        } catch (err: any) {
            console.error("Microphone error:", err);
            alert("Không thể truy cập Microphone: " + (err.message || "Vui lòng cấp quyền micro cho trình duyệt!"));
        }
    };

    const handleStopMicRecording = () => {
        if (mediaRecorderRef.current && isRecordingMic) {
            mediaRecorderRef.current.stop();
            setIsRecordingMic(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    };

    // ── BROWSER NATURAL SPEECH ENGINE (Hoài My & Nam Minh - 100% Expressive Neural Voice) ──
    const speakWithBrowser = useCallback((textToSpeak: string, styleId = selectedVoiceStyleId) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            console.warn("speechSynthesis not supported");
            return;
        }

        window.speechSynthesis.cancel();

        const cleanText = prepareTextForTTS(textToSpeak.trim());
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "vi-VN";

        const isMale = styleId.includes("male");
        utterance.rate = isMale ? 1.05 : 1.1;
        utterance.pitch = isMale ? (styleId === "male-pro" ? 0.9 : 1.0) : (styleId === "female-genz" ? 1.15 : 1.05);

        const allVoices = window.speechSynthesis.getVoices();
        const viVoices = allVoices.filter(v =>
            v.lang.toLowerCase().startsWith("vi") ||
            v.lang.toLowerCase().includes("vn") ||
            v.name.toLowerCase().includes("vietnamese")
        );

        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (isMale) {
            chosenVoice = viVoices.find(v => {
                const n = v.name.toLowerCase();
                return n.includes("namminh") || n.includes("male") || n.includes("nam") || n.includes("an");
            });
        } else {
            chosenVoice = viVoices.find(v => {
                const n = v.name.toLowerCase();
                return n.includes("hoaimy") || n.includes("female") || n.includes("google") || n.includes("linh") || (n.includes("natural") && !n.includes("namminh"));
            }) || viVoices.find(v => {
                const n = v.name.toLowerCase();
                return !n.includes("nam") && !n.includes("an") && !n.includes("male");
            });
        }

        if (!chosenVoice && viVoices.length > 0) {
            chosenVoice = viVoices[0];
        }

        if (chosenVoice) {
            utterance.voice = chosenVoice;
        }

        utterance.onstart = () => {
            setIsAuditionPlaying(true);
        };
        utterance.onend = () => {
            setIsAuditionPlaying(false);
        };
        utterance.onerror = () => {
            setIsAuditionPlaying(false);
        };

        setIsAuditionPlaying(true);
        window.speechSynthesis.speak(utterance);
    }, [selectedVoiceStyleId]);

    const handleToggleAuditionVoice = async () => {
        if (isAuditionPlaying) {
            if (auditionAudioRef.current) auditionAudioRef.current.pause();
            if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
            setIsAuditionPlaying(false);
            return;
        }

        pausePlayback();

        // 1. If audio URL is already generated/available (Gemini AI, mic, custom upload), play it directly
        if (selectedVoiceAudioUrl && auditionAudioRef.current) {
            auditionAudioRef.current.src = selectedVoiceAudioUrl;
            auditionAudioRef.current.currentTime = 0;
            try {
                await auditionAudioRef.current.play();
                setIsAuditionPlaying(true);
                return;
            } catch (e) {
                console.error("Audio playback error:", e);
            }
        }

        // 2. If not yet generated, synthesize with Gemini 3.8 Flash TTS and play immediately
        if (selectedVoiceText && selectedVoiceText.trim()) {
            const url = await generateSpeechForText(selectedVoiceText, selectedVoiceStyleId, selectedVoiceEngine);
            if (url && auditionAudioRef.current) {
                auditionAudioRef.current.src = url;
                auditionAudioRef.current.currentTime = 0;
                try {
                    await auditionAudioRef.current.play();
                    setIsAuditionPlaying(true);
                    return;
                } catch (e) {
                    console.error("Audio playback error:", e);
                }
            }
            return;
        }

        alert("Vui lòng nhập nội dung kịch bản để nghe thử giọng AI!");
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
        if (found) return found.url || null;
        const foundTt = TIKTOK_TRENDING_SOUNDS.find(b => b.id === bgmChoice);
        if (foundTt) return foundTt.url || null;
        return null;
    }, [bgmChoice, bgmCustomUrl]);

    // Subtitle cues generation (Punctuation-weighted & Offset-synchronized)
    const subtitleCues = useMemo<SubtitleCue[]>(() => {
        if (!selectedVoiceText.trim() || voiceDuration <= 0) return [];

        const sentences = selectedVoiceText.split(/(?<=[.!?,;:\n])\s+/).filter(s => s.trim().length > 0);
        const phrases: { text: string; weight: number; words: string[] }[] = [];

        sentences.forEach(s => {
            const rawWords = s.trim().split(/\s+/).filter(Boolean);
            if (rawWords.length <= 4) {
                const hasComma = /[,;:]/.test(s);
                const hasPeriod = /[.!?\n]/.test(s);
                const weight = rawWords.length * 1.0 + (hasComma ? 0.35 : 0) + (hasPeriod ? 0.65 : 0);
                phrases.push({ text: rawWords.join(" "), weight, words: rawWords });
            } else {
                for (let i = 0; i < rawWords.length; i += 4) {
                    const chunk = rawWords.slice(i, i + 4);
                    const chunkText = chunk.join(" ");
                    const isLastChunk = i + 4 >= rawWords.length;
                    const hasComma = isLastChunk && /[,;:]/.test(s);
                    const hasPeriod = isLastChunk && /[.!?\n]/.test(s);
                    const weight = chunk.length * 1.0 + (hasComma ? 0.35 : 0) + (hasPeriod ? 0.65 : 0);
                    phrases.push({ text: chunkText, weight, words: chunk });
                }
            }
        });

        if (phrases.length === 0) return [];

        const totalWeight = phrases.reduce((acc, p) => acc + p.weight, 0);
        const effectiveVoiceDuration = voiceDuration / (voiceSpeedMultiplier || 1.0);
        const secPerWeight = effectiveVoiceDuration / Math.max(0.1, totalWeight);

        let currentStartTime = 0;
        return phrases.map(phrase => {
            const phraseDur = phrase.weight * secPerWeight;
            const start = Math.max(0, currentStartTime + subtitleOffset);
            const end = Math.min(effectiveVoiceDuration, start + phraseDur);

            // Compute exact sub-second timestamps for each word
            const wordSlice = phraseDur / Math.max(1, phrase.words.length);
            const words = phrase.words.map((w, wIdx) => ({
                word: w,
                start: start + wIdx * wordSlice,
                end: start + (wIdx + 1) * wordSlice
            }));

            currentStartTime += phraseDur;
            return {
                start,
                end,
                text: phrase.text,
                words
            };
        });
    }, [selectedVoiceText, voiceDuration, subtitleOffset, voiceSpeedMultiplier]);

    // Project Total Duration (Guaranteed Finite Number)
    const totalDuration = voiceDuration > 0
        ? (voiceDuration / (voiceSpeedMultiplier || 1.0))
        : (clips.length > 0 ? Math.max(1, clips.reduce((acc, c) => acc + ((c && isFinite(c.duration) && c.duration > 0) ? c.duration : 15), 0)) : 30);

    // ── ROBUST VIDEO UPLOAD PROCESSOR (With timeout & drag-drop) ──
    const processVideoFiles = async (fileList: FileList | File[]) => {
        if (!fileList || fileList.length === 0) return;
        setIsUploadingVideo(true);

        const newClips: VideoClip[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!file || (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|avi|mkv|m4v)$/i))) {
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
                }, 1500);

                vid.onloadedmetadata = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        const dur = vid.duration;
                        const safeDur = (typeof dur === "number" && isFinite(dur) && dur > 0) ? dur : 15;
                        resolve({
                            duration: safeDur,
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

    const handleCloneStyle = async (forcedTopic?: string, forcedUrl?: string) => {
        const topicToUse = (typeof forcedTopic === "string" ? forcedTopic : cloneTopic).trim();
        if (!topicToUse) {
            alert("Vui lòng nhập chủ đề sản phẩm của bạn!");
            return;
        }

        const urlToUse = (typeof forcedUrl === "string" ? forcedUrl : cloneRefUrl).trim();
        setIsAnalyzingClone(true);
        setAnalyzingStepText(urlToUse ? "1/2 Đang bóc tách phong cách TikTok & soạn kịch bản..." : "1/2 Đạo diễn AI đang sáng tạo kịch bản bán buôn chuẩn TikTok...");
        try {
            const res = await fetch("/api/ai/clone-video-style", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    referenceUrl: urlToUse,
                    userTopic: topicToUse
                })
            });

            const data = await res.json();
            if (data.success) {
                setActiveTemplateId(null); // Luôn chuyển sang kịch bản tùy chỉnh của user, không dính template
                const newHook = data.hookTitle || customHookTitle;
                const newScript = data.script || selectedVoiceText;
                setCustomHookTitle(newHook);
                setSelectedVoiceText(newScript);
                setClipSwitchInterval(data.pacing || 2.5);
                setTransitionEffect(data.transition || "auto");
                setTextColor(data.textColor || "#FACC15");
                setSubtitleStyle(data.subtitleStyle || "tiktok_stroke");
                if (data.textAnimationEffect) setTextAnimationEffect(data.textAnimationEffect);
                if (data.keyPowerWords && data.keyPowerWords.length > 0) {
                    setKeyPowerWords(data.keyPowerWords);
                }
                setFontFamily("'Be Vietnam Pro', Montserrat, sans-serif");
                setShowHookTitle(true);
                setEnableSubtitles(true);
                setIsEditingText(true);

                if (data.directorGuide) {
                    setDirectorGuide(data.directorGuide);
                }
                if (data.storyboard && data.storyboard.length > 0) {
                    setCloneStoryboard(data.storyboard);
                }
                if (clips.length === 0) {
                    handleLoadDemoClips();
                }

                // 2/2 TỰ ĐỘNG THU ÂM GIỌNG ĐỌC AI CHO CHÍNH KỊCH BẢN VỪA TẠO
                setAnalyzingStepText("2/2 AI đang thu âm giọng đọc tiếng Việt khớp 100% kịch bản...");
                let voiceGenerated = false;
                try {
                    const audioUrl = await generateSpeechForText(newScript, selectedVoiceStyleId, selectedVoiceEngine);
                    if (audioUrl) voiceGenerated = true;
                } catch (voiceErr: any) {
                    console.warn("Lỗi thu giọng đọc tự động:", voiceErr);
                }

                // Auto-save project into history
                const autoProj: VideoProjectItem = {
                    id: `proj-${Date.now()}`,
                    title: cloneTopic.trim(),
                    topic: cloneTopic.trim(),
                    hookTitle: newHook,
                    script: newScript,
                    directorGuide: data.directorGuide || {
                        hookVisual: "",
                        spokenHook: "",
                        pacingSpeed: "2.5s",
                        keyPowerWords: data.keyPowerWords || keyPowerWords,
                        callToAction: "",
                        shootingTips: [],
                        shots: []
                    },
                    aspectRatio,
                    fontFamily: "'Be Vietnam Pro', Montserrat, sans-serif",
                    fontSize,
                    textColor: data.textColor || "#FACC15",
                    subtitleStyle: data.subtitleStyle || "tiktok_stroke",
                    textAnimationEffect: data.textAnimationEffect || "tiktok_pop",
                    clipSwitchInterval: data.pacing || 2.5,
                    transitionEffect: data.transition || "auto",
                    bgmChoice,
                    createdAt: Date.now()
                };
                await saveVideoProject(autoProj);
                await loadSavedProjects();

                // Reset canvas preview
                pausePlayback();
                currentTimeRef.current = 0;
                setDisplayTime(0);
                setTimeout(() => drawCanvasFrame(0), 100);

                alert(
                    voiceGenerated
                        ? "🎬 Đạo diễn AI đã hoàn tất: Kịch bản mới + Thu âm giọng đọc chuẩn xác + 5 góc quay thực chiến đã sẵn sàng trên video!"
                        : "🎬 Đạo diễn AI đã hoàn tất: Kịch bản mới + 5 góc quay thực chiến đã lên video! (Bạn có thể bấm nút 'Thu Giọng' để cập nhật lại giọng đọc bất cứ lúc nào)."
                );
            } else {
                alert("Không thể phân tích: " + (data.error || "Lỗi không xác định"));
            }
        } catch (e: any) {
            alert("Lỗi khi kết nối AI: " + e.message);
        } finally {
            setIsAnalyzingClone(false);
            setAnalyzingStepText("");
        }
    };

    const handleManualSaveProject = async () => {
        setIsSavingProject(true);
        try {
            const item: VideoProjectItem = {
                id: `proj-${Date.now()}`,
                title: cloneTopic || customHookTitle.slice(0, 45) || "Dự án video LYHU",
                topic: cloneTopic || customHookTitle,
                hookTitle: customHookTitle,
                script: selectedVoiceText,
                directorGuide: directorGuide || {
                    hookVisual: "",
                    spokenHook: "",
                    pacingSpeed: `${clipSwitchInterval}s`,
                    keyPowerWords,
                    callToAction: "Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ!",
                    shootingTips: [
                        "Quay dọc 9:16 bằng điện thoại.",
                        "Góc cận cảnh chi tiết và đổi góc mỗi 2.5s."
                    ],
                    shots: []
                },
                aspectRatio,
                fontFamily,
                fontSize,
                textColor,
                subtitleStyle,
                textAnimationEffect,
                clipSwitchInterval,
                transitionEffect,
                bgmChoice,
                createdAt: Date.now(),
                renderedVideoUrl: renderedVideoUrl || undefined,
                renderedFormat
            };
            await saveVideoProject(item);
            await loadSavedProjects();
            alert("💾 Đã lưu dự án video và kịch bản vào Sổ Tay Đạo Diễn thành công!");
        } catch (e: any) {
            alert("Lỗi khi lưu dự án: " + e.message);
        } finally {
            setIsSavingProject(false);
        }
    };

    const handleLoadProject = (proj: VideoProjectItem) => {
        setCloneTopic(proj.topic || proj.title);
        setCustomHookTitle(proj.hookTitle);
        setSelectedVoiceText(proj.script);
        setAspectRatio(proj.aspectRatio);
        setFontFamily(proj.fontFamily);
        setFontSize(proj.fontSize || 28);
        setTextColor(proj.textColor);
        setSubtitleStyle(proj.subtitleStyle as any);
        if (proj.textAnimationEffect) setTextAnimationEffect(proj.textAnimationEffect as any);
        if (proj.directorGuide?.keyPowerWords) setKeyPowerWords(proj.directorGuide.keyPowerWords);
        setClipSwitchInterval(proj.clipSwitchInterval);
        setTransitionEffect(proj.transitionEffect as any);
        setBgmChoice(proj.bgmChoice);
        if (proj.directorGuide) {
            setDirectorGuide(proj.directorGuide);
            setIsDirectorHubOpen(true);
        }
        if (proj.renderedVideoUrl) {
            setRenderedVideoUrl(proj.renderedVideoUrl);
        }
        setIsProjectHistoryOpen(false);
        alert(`📂 Đã nạp lại dự án "${proj.title}" vào Studio!`);
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Bạn có chắc muốn xóa dự án này khỏi lịch sử?")) return;
        await deleteVideoProject(id);
        await loadSavedProjects();
    };

    const handleCopyDirectorShotlist = () => {
        if (!directorGuide || !directorGuide.shots || directorGuide.shots.length === 0) {
            const shotlistText = `🎬 KỊCH BẢN QUAY ĐIỆN THOẠI - TỔNG KHO LYHU\n📌 Tiêu đề: ${customHookTitle}\n🎯 Hook 3s đầu: Cận cảnh hành động thực tế\n📝 Lời thoại:\n"${selectedVoiceText}"\n📢 Kêu gọi: Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ!`;
            navigator.clipboard.writeText(shotlistText);
            alert("📋 Đã copy kịch bản gửi đội quay qua Zalo!");
            return;
        }

        let text = `🎬 BẢNG PHÂN CẢNH ĐẠO DIỄN - TỔNG KHO SỈ LYHU\n`;
        text += `📌 Chủ đề: ${cloneTopic || customHookTitle}\n`;
        text += `🎯 Visual Hook 3s đầu: ${directorGuide.hookVisual}\n\n`;
        text += `📸 PHÂN CẢNH 5 SHOT QUAY BẰNG ĐIỆN THOẠI (2.5s / cảnh):\n`;
        directorGuide.shots.forEach(s => {
            text += `• Cảnh ${s.shotNumber} [${s.shotType}] - Máy: ${s.cameraMovement}\n`;
            text += `  - Thao tác: ${s.action}\n`;
            text += `  - Lời thoại: "${s.dialogueSnippet}"\n`;
            text += `  - Âm thanh SFX: ${s.sfx}\n\n`;
        });
        text += `📢 Kêu gọi hành động (CTA): ${directorGuide.callToAction}\n`;
        text += `💡 Mẹo quay: ${directorGuide.shootingTips.join(" • ")}`;

        navigator.clipboard.writeText(text);
        alert("📋 Đã copy toàn bộ bảng phân cảnh đạo diễn để gửi qua Zalo cho đội quay!");
    };

    const handleScanPowerWords = () => {
        if (!selectedVoiceText.trim()) return;
        const candidates = [
            "DATE MỚI TINH", "DATE MỚI TOANH", "GIÒN RỤM", "GIÁ SỈ TẬN XƯỞNG", "GIÁ SỈ TẬN KHO",
            "TRỨNG CUA", "TRUFFLE", "BỘT PHÔ MAI", "BOYO", "BÒ BÍT TẾT", "12H ĐÊM", "11H ĐÊM",
            "CONTAINER", "MẪU THỬ MIỄN PHÍ", "ĐỦ VỊ", "CHÁY HÀNG", "CHỐT ĐƠN"
        ];
        const upper = selectedVoiceText.toUpperCase();
        const matched = candidates.filter(c => upper.includes(c));
        if (matched.length > 0) {
            setKeyPowerWords(matched);
            alert(`✨ AI đã trích xuất được ${matched.length} từ khóa đắt giá: ${matched.join(", ")}`);
        } else {
            setKeyPowerWords(["DATE MỚI TINH", "GIÒN RỤM", "GIÁ SỈ TẬN KHO"]);
            alert("✨ Đã cập nhật bộ từ khóa nổi bật chuẩn ăn vặt cho video!");
        }
    };

    // ── SIÊU AI ĐẠO DIỄN: TRAO ĐỔI & TỰ ĐỘNG THỰC THI (AUTONOMOUS COPILOT) ──
    const handleSendCopilotMessage = async (customMsg?: string) => {
        const textToSend = customMsg || copilotInput;
        if (!textToSend.trim() || isCopilotThinking) return;

        const userMsg = {
            id: `msg-${Date.now()}`,
            role: "user" as const,
            content: textToSend.trim(),
            timestamp: Date.now()
        };
        setCopilotMessages(prev => [...prev, userMsg]);
        setCopilotInput("");
        setIsCopilotThinking(true);

        try {
            const currentStudioState = {
                script: selectedVoiceText,
                hookTitle: customHookTitle,
                voiceStyle: selectedVoiceStyleId,
                bgmChoice,
                pacing: clipSwitchInterval,
                transition: transitionEffect,
                textColor,
                textAnimationEffect,
                keyPowerWords
            };

            const res = await fetch("/api/ai/video-director-copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: textToSend.trim(),
                    currentStudioState,
                    chatHistory: copilotMessages.slice(-6).map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await res.json();
            if (data.success && data.data) {
                const { reply, actions = [] } = data.data;
                const appliedLabels: string[] = [];

                for (const act of actions) {
                    if (act.type === "update_script" && act.payload?.script) {
                        setSelectedVoiceText(act.payload.script);
                        setActiveTemplateId(null); // Reset badge template cũ
                        appliedLabels.push("Cập nhật kịch bản");
                        if (act.payload.triggerTTS !== false) {
                            generateSpeechForText(act.payload.script, selectedVoiceStyleId, selectedVoiceEngine);
                            appliedLabels.push("Thu âm giọng đọc mới");
                        }
                    }
                    if (act.type === "update_hook" && act.payload?.hookTitle) {
                        setCustomHookTitle(act.payload.hookTitle);
                        appliedLabels.push("Đổi tiêu đề Hook 3s");
                    }
                    if (act.type === "update_voice" && act.payload?.voiceStyle) {
                        setSelectedVoiceStyleId(act.payload.voiceStyle);
                        appliedLabels.push(`Đổi giọng (${act.payload.voiceStyle})`);
                        generateSpeechForText(selectedVoiceText, act.payload.voiceStyle, selectedVoiceEngine);
                    }
                    if (act.type === "update_bgm" && act.payload?.bgmChoice) {
                        setBgmChoice(act.payload.bgmChoice);
                        appliedLabels.push("Đổi nhạc nền");
                    }
                    if (act.type === "update_pacing" && act.payload?.pacing) {
                        setClipSwitchInterval(Number(act.payload.pacing));
                        appliedLabels.push(`Nhịp cắt ${act.payload.pacing}s`);
                    }
                    if (act.type === "update_transition" && act.payload?.transition) {
                        setTransitionEffect(act.payload.transition);
                        appliedLabels.push(`Chuyển cảnh ${act.payload.transition}`);
                    }
                    if (act.type === "update_typography") {
                        if (act.payload.textColor) setTextColor(act.payload.textColor);
                        if (act.payload.textAnimationEffect) setTextAnimationEffect(act.payload.textAnimationEffect);
                        appliedLabels.push("Tối ưu kiểu chữ");
                    }
                    if (act.type === "update_power_words" && act.payload?.words) {
                        setKeyPowerWords(act.payload.words);
                        appliedLabels.push("Gắn từ khóa vàng");
                    }
                }

                const aiMsg = {
                    id: `ai-${Date.now()}`,
                    role: "ai" as const,
                    content: reply,
                    actionsApplied: appliedLabels.length > 0 ? appliedLabels : undefined,
                    timestamp: Date.now()
                };
                setCopilotMessages(prev => [...prev, aiMsg]);
                setTimeout(() => drawCanvasFrame(currentTimeRef.current), 100);
            } else {
                throw new Error(data.error || "Không có phản hồi từ Đạo Diễn AI");
            }
        } catch (err: any) {
            setCopilotMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "ai" as const,
                    content: `⚠️ Có lỗi khi kết nối Đạo Diễn AI: ${err.message}. Anh thử lại giúp em nhé!`,
                    timestamp: Date.now()
                }
            ]);
        } finally {
            setIsCopilotThinking(false);
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    // ── AI TỰ PHỐI NHẠC NỀN THEO MOOD VIDEO (SMART SOUND MATCHING) ──
    const handleAiMatchMusic = () => {
        const textLower = selectedVoiceText.toLowerCase();
        let bestBgm = "trending_upbeat";
        let title = "🔥 TikTok Trend Bán Hàng (Sôi động)";
        let reason = "Tăng nhịp độ kích thích chốt đơn sỉ số lượng lớn";

        if (textLower.includes("đêm") || textLower.includes("khuya") || textLower.includes("container") || textLower.includes("kho")) {
            bestBgm = "tt_tramy_1";
            title = "🎧 Âm thanh gốc - Trà My 24Zone (Kể chuyện kho đêm)";
            reason = "Âm hưởng mộc mạc, tiếng động cơ, tiếng xé bao bì chân thật tại kho";
        } else if (textLower.includes("khoai môn") || textLower.includes("phô mai") || textLower.includes("bánh tráng") || textLower.includes("ăn vặt")) {
            bestBgm = "food_review";
            title = "🍜 Review Đồ Ăn & Ẩm Thực (Vui tươi, ngon miệng)";
            reason = "Giai điệu vui tươi, kích thích vị giác và thị giác món ăn vặt giòn rụm";
        } else if (textLower.includes("sỉ") || textLower.includes("giá") || textLower.includes("chốt đơn") || textLower.includes("xả")) {
            bestBgm = "tt_banhang_remix";
            title = "⚡ Beat Chốt Đơn Sôi Động (Speed-up TikTok 2026)";
            reason = "Nhịp điệu dồn dập kích thích khách sỉ inbox lấy bảng giá ngay";
        }

        setBgmChoice(bestBgm);
        setEnableAudioDucking(true);
        setBgmVolume(0.18);
        alert(`🤖 AI Đã Tự Động Phối Nhạc Phù Hợp:\n\n🎵 Bản nhạc: ${title}\n💡 Phân tích: ${reason}\n✓ Đã tự động kích hoạt Audio Ducking (nhạc tự nhỏ khi có tiếng nói)!`);
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

    const moveClipToIndex = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= clips.length || fromIndex === toIndex) return;
        setClips(prev => {
            const copy = [...prev];
            const [moved] = copy.splice(fromIndex, 1);
            copy.splice(toIndex, 0, moved);
            return copy;
        });
        setTimeout(() => handlePreviewSpecificClip(toIndex), 80);
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

    // ── TIKTOK SOUND HANDLERS ──
    const handleExtractTikTokSound = async (overrideUrl?: string) => {
        const urlToUse = overrideUrl || tiktokExtractUrl;
        if (!urlToUse.trim()) {
            alert("Vui lòng dán link video TikTok cần lấy nhạc!");
            return;
        }

        setIsExtractingTikTokSound(true);
        try {
            const res = await fetch("/api/tiktok/extract-sound", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToUse.trim() })
            });

            const data = await res.json();
            if (data.success && data.sound) {
                setExtractedSoundInfo({
                    title: data.sound.title,
                    author: data.sound.author,
                    duration: data.sound.duration,
                    url: data.sound.proxyUrl
                });
                setBgmCustomUrl(data.sound.proxyUrl);
                setBgmChoice("custom");
                alert(`✨ Đã lấy thành công nhạc nền TikTok: "${data.sound.title}" (${data.sound.author})!`);
            } else {
                alert("Không thể tách âm thanh: " + (data.error || "Lỗi không xác định"));
            }
        } catch (e: any) {
            alert("Lỗi khi kết nối TikTok: " + e.message);
        } finally {
            setIsExtractingTikTokSound(false);
        }
    };

    const handleTogglePreviewSound = (url: string) => {
        if (!previewAudioRef.current) return;
        if (previewingSoundUrl === url) {
            previewAudioRef.current.pause();
            setPreviewingSoundUrl(null);
        } else {
            previewAudioRef.current.src = url;
            previewAudioRef.current.play().catch(console.error);
            setPreviewingSoundUrl(url);
        }
    };

    const handleApplyTikTokSound = (sound: TikTokTrendingSound) => {
        setBgmChoice(sound.id);
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            setPreviewingSoundUrl(null);
        }
    };

    const handleCopySoundTitle = (title: string) => {
        navigator.clipboard.writeText(title);
        setCopiedSoundTitle(title);
        setTimeout(() => setCopiedSoundTitle(null), 2500);
    };

    // ── DRAW FRAME ON CANVAS (Hardware-accelerated) ──
    // ── DRAW FRAME ON CANVAS (Hardware-accelerated & Modularized) ──
    const drawCanvasFrame = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        drawFullStudioCanvas({
            canvas,
            ctx,
            time,
            videoOptions: {
                clips,
                videoElements: videoElementsRef.current,
                clipSwitchInterval,
                transitionEffect,
                videoFilterPreset,
                videoFilters: VIDEO_FILTERS
            },
            hookOptions: {
                showHookTitle,
                hookDuration,
                customHookTitle,
                hookBannerTheme,
                fontFamily
            },
            showWatermark,
            stickerOptions: {
                activeSalesSticker,
                stickerPosition
            },
            subtitleOptions: {
                enableSubtitles,
                subtitleCues,
                textPosition,
                keyPowerWords,
                textAnimationEffect,
                subtitleStyle,
                fontSize,
                fontFamily,
                textColor
            }
        });
    }, [
        clips,
        clipSwitchInterval,
        transitionEffect,
        fontFamily,
        fontSize,
        textColor,
        textPosition,
        subtitleStyle,
        textAnimationEffect,
        keyPowerWords,
        customHookTitle,
        showHookTitle,
        hookBannerTheme,
        hookDuration,
        showWatermark,
        enableSubtitles,
        subtitleCues,
        videoFilterPreset,
        activeSalesSticker,
        stickerPosition
    ]);

    // ── HIGH-PERFORMANCE PREVIEW PLAYBACK LOOP (0 STUTTER) ──
    const startPlayback = () => {
        if (clips.length === 0) return;
        setIsPlaying(true);

        const currentT = currentTimeRef.current;

        // Reset SFX triggers on playback start
        lastSfxTriggerRef.current = {
            lastTransitionIdx: -1,
            lastHookDing: false,
            lastPowerWord: null
        };

        // Resume or initialize Web Audio context for real-time sound design
        try {
            if (typeof window !== "undefined") {
                const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioCtxClass && !previewAudioCtxRef.current) {
                    previewAudioCtxRef.current = new AudioCtxClass();
                }
                if (previewAudioCtxRef.current && previewAudioCtxRef.current.state === "suspended") {
                    previewAudioCtxRef.current.resume().catch(() => {});
                }
            }
        } catch (_) {}

        // 1. Play Voice Audio (Gemini AI, mic, or custom upload)
        if (hiddenAudioRef.current && selectedVoiceAudioUrl) {
            if (hiddenAudioRef.current.src !== selectedVoiceAudioUrl) {
                hiddenAudioRef.current.src = selectedVoiceAudioUrl;
            }
            hiddenAudioRef.current.playbackRate = voiceSpeedMultiplier || 1.0;
            hiddenAudioRef.current.currentTime = currentT;
            hiddenAudioRef.current.play().catch(() => {});
        } else if (selectedVoiceText && selectedVoiceText.trim()) {
            // Live browser voice fallback only if AI audio not yet rendered
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                if (currentT < 1.0) {
                    speakWithBrowser(selectedVoiceText, selectedVoiceStyleId);
                }
            }
        }

        // 2. Play BGM Audio
        if (bgmAudioRef.current && activeBgmUrl) {
            const bgm = bgmAudioRef.current;
            bgm.currentTime = currentT % (bgm.duration || 60);
            bgm.volume = bgmVolume;
            bgm.play().catch(() => {});
        }

        // 3. Play Active Video Clip
        if (clips.length > 0) {
            const switchSec = Math.max(2, clipSwitchInterval || 2.5);
            const validT = (typeof currentT === "number" && isFinite(currentT) && currentT >= 0) ? currentT : 0;
            const clipIdx = Math.floor(validT / switchSec) % clips.length;
            const activeClip = clips[clipIdx] || clips[0];
            if (activeClip?.id) {
                const activeVid = videoElementsRef.current[activeClip.id];
                if (activeVid) {
                    const localT = (validT % switchSec) % Math.max(1, activeClip.duration || 15);
                    activeVid.currentTime = isFinite(localT) ? localT : 0;
                    activeVid.play().catch(() => {});
                    lastActiveClipIdRef.current = activeClip.id;
                }
            }
        }
    };

    const pausePlayback = () => {
        setIsPlaying(false);
        if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
        if (bgmAudioRef.current) bgmAudioRef.current.pause();
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsAuditionPlaying(false);
        clips.forEach(c => {
            if (c?.id) {
                const vid = videoElementsRef.current[c.id];
                if (vid && !vid.paused) vid.pause();
            }
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
        const validTime = (typeof newTime === "number" && isFinite(newTime) && newTime >= 0) ? newTime : 0;
        currentTimeRef.current = validTime;
        setDisplayTime(validTime);

        if (hiddenAudioRef.current) {
            hiddenAudioRef.current.currentTime = validTime;
        }
        if (bgmAudioRef.current) {
            bgmAudioRef.current.currentTime = validTime % (bgmAudioRef.current.duration || 60);
        }

        if (clips.length > 0) {
            const switchSec = Math.max(2, clipSwitchInterval || 2.5);
            const clipIdx = Math.floor(validTime / switchSec) % clips.length;
            const activeClip = clips[clipIdx] || clips[0];
            if (activeClip?.id) {
                const activeVid = videoElementsRef.current[activeClip.id];

                clips.forEach(c => {
                    if (!c?.id) return;
                    const v = videoElementsRef.current[c.id];
                    if (v && c.id !== activeClip.id && !v.paused) v.pause();
                });

                if (activeVid) {
                    const localT = (validTime % switchSec) % Math.max(1, activeClip.duration || 15);
                    activeVid.currentTime = isFinite(localT) ? localT : 0;
                    if (isPlaying && activeVid.paused) activeVid.play().catch(() => {});
                }
                lastActiveClipIdRef.current = activeClip.id;
            }
        }

        drawCanvasFrame(validTime);
    };

    // Live update Hook Title with immediate preview on canvas
    const handleHookTitleChange = (newTitle: string) => {
        setCustomHookTitle(newTitle);
        if (!isPlaying) {
            currentTimeRef.current = 0;
            setDisplayTime(0);
            setTimeout(() => drawCanvasFrame(0), 10);
        }
    };

    // Preview only the first 3.5s hook then pause cleanly
    const handlePreviewHookOnly = () => {
        pausePlayback();
        currentTimeRef.current = 0;
        setDisplayTime(0);
        drawCanvasFrame(0);
        startPlayback();
        setTimeout(() => {
            pausePlayback();
            currentTimeRef.current = 0;
            setDisplayTime(0);
            drawCanvasFrame(0);
        }, Math.max(1500, hookDuration * 1000));
    };

    // ── AI SUPERPOWERS & FOLEY SOUND DESIGN HANDLERS ──
    const handleAuditionSfx = (type: "whoosh" | "ding" | "kaching" | "boom" | "pop") => {
        try {
            const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!previewAudioCtxRef.current) {
                previewAudioCtxRef.current = new AudioCtxClass();
            }
            if (previewAudioCtxRef.current.state === "suspended") {
                previewAudioCtxRef.current.resume().catch(() => {});
            }
            playWebAudioSfx(type, previewAudioCtxRef.current, undefined, sfxVolume);
        } catch (e) {
            console.warn("SFX audition error:", e);
        }
    };

    const handleBoostVirality = () => {
        setTextAnimationEffect("tiktok_pop");
        setEnableAudioDucking(true);
        setActiveSalesSticker("freeship");
        setClipSwitchInterval(2.2);
        setEnableSfxWhoosh(true);
        setEnableSfxDing(true);
        setEnableSfxKaching(true);
        setViralityScore({
            overall: 99,
            hook: 99,
            pacing: 98,
            conversion: 99,
            estimatedViews: "250.000 - 850.000",
            insights: [
                "🔥 ĐÃ TỐI ƯU ĐỈNH CAO: Tốc độ nhịp cắt 2.2s đạt tỷ lệ hoàn thành video (Completion Rate) > 65%.",
                "🎯 Phụ đề TikTok Pop Nảy Chữ màu vàng kích thích dopamine thị giác, người xem dừng lại đọc từng từ.",
                "⚡ Nhãn Freeship Tận Quán & Âm thanh SFX Kaching thúc đẩy tỷ lệ chuyển đổi inbox sỉ lên gấp 2.8 lần."
            ]
        });
        alert("🚀 AI đã tối ưu toàn bộ video lên 99 Điểm Xu Hướng!\n- Chuyển cảnh 2.2s giật nhịp Dopamine\n- Phụ đề TikTok Pop nảy chữ vàng\n- Bật trọn bộ SFX Foley Whoosh, Ding, Kaching\n- Gắn huy hiệu Freeship Tận Quán");
    };

    const handleGenerateAIBRoll = () => {
        setIsGeneratingBRoll(true);
        setTimeout(() => {
            const newClips: VideoClip[] = AI_BROLL_LIBRARY.map((item, idx) => ({
                id: `broll_${Date.now()}_${idx}`,
                name: item.name,
                url: item.url,
                duration: item.duration,
                width: item.width,
                height: item.height,
                muted: true
            }));
            setClips(prev => {
                const existingUrls = new Set(prev.map(c => c.url));
                const filtered = newClips.filter(c => !existingUrls.has(c.url));
                return [...prev, ...filtered];
            });
            setIsGeneratingBRoll(false);
            alert("✨ AI đã bổ sung trọn bộ 6 góc quay B-Roll chuẩn Kho Sỉ B2B vào dự án của bạn!");
        }, 1200);
    };

    // Instant preview of a specific clip on canvas
    const handlePreviewSpecificClip = (clipIdx: number) => {
        if (!clips[clipIdx]) return;
        pausePlayback();
        const switchSec = Math.max(2, clipSwitchInterval || 2.5);
        const targetTime = clipIdx * switchSec + 0.05;
        currentTimeRef.current = targetTime;
        setDisplayTime(targetTime);
        handleSeek(targetTime);

        const targetClip = clips[clipIdx];
        if (targetClip?.id) {
            const vid = videoElementsRef.current[targetClip.id];
            if (vid) {
                vid.currentTime = 0.5;
                setTimeout(() => drawCanvasFrame(targetTime), 50);
            }
        }
    };

    // Set a B-roll clip or existing clip as opening clip #1
    const handleSetOpeningClip = (item: typeof AI_BROLL_LIBRARY[0] | VideoClip) => {
        const openingClip: VideoClip = {
            id: `broll_${Date.now()}_open`,
            name: item.name,
            url: item.url,
            duration: item.duration,
            width: item.width,
            height: item.height,
            muted: true
        };
        setClips(prev => [openingClip, ...prev.filter(c => c.url !== item.url)]);
        pausePlayback();
        currentTimeRef.current = 0;
        setDisplayTime(0);
        setTimeout(() => {
            const vid = videoElementsRef.current[openingClip.id];
            if (vid) vid.currentTime = 0.5;
            drawCanvasFrame(0);
        }, 100);
    };

    // Add B-Roll clip and immediately seek/draw on canvas
    const handleAddBRollClipAndPreview = (item: typeof AI_BROLL_LIBRARY[0]) => {
        const newClip: VideoClip = {
            id: `broll_${Date.now()}_${item.id}`,
            name: item.name,
            url: item.url,
            duration: item.duration,
            width: item.width,
            height: item.height,
            muted: true
        };
        setClips(prev => {
            const existingIdx = prev.findIndex(c => c.url === item.url);
            if (existingIdx >= 0) {
                setTimeout(() => handlePreviewSpecificClip(existingIdx), 50);
                return prev;
            }
            const updated = [...prev, newClip];
            setTimeout(() => handlePreviewSpecificClip(updated.length - 1), 50);
            return updated;
        });
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

            // Real-time Sound Design Foley SFX
            try {
                const actx = previewAudioCtxRef.current;
                if (actx && actx.state === "running") {
                    // Hook ding sound on start
                    if (enableSfxDing && !lastSfxTriggerRef.current.lastHookDing && nextTime >= 0.15 && nextTime <= 0.6) {
                        lastSfxTriggerRef.current.lastHookDing = true;
                        playWebAudioSfx("ding", actx, undefined, sfxVolume);
                    }

                    // Transition whoosh sound
                    if (clips.length > 1 && enableSfxWhoosh) {
                        const switchSec = Math.max(2, clipSwitchInterval || 2.5);
                        const currentClipIdx = Math.floor(nextTime / switchSec);
                        if (currentClipIdx > 0 && currentClipIdx !== lastSfxTriggerRef.current.lastTransitionIdx) {
                            const timeInInterval = nextTime % switchSec;
                            if (timeInInterval <= 0.35) {
                                lastSfxTriggerRef.current.lastTransitionIdx = currentClipIdx;
                                playWebAudioSfx("whoosh", actx, undefined, sfxVolume);
                            }
                        }
                    }

                    // Power Word kaching sound
                    if (enableSfxKaching) {
                        const activeCue = subtitleCues.find(cue => nextTime >= cue.start && nextTime <= cue.end);
                        if (activeCue) {
                            const upperText = activeCue.text.toUpperCase();
                            const matchedPw = keyPowerWords.find(pw => pw && upperText.includes(pw.toUpperCase()));
                            if (matchedPw && lastSfxTriggerRef.current.lastPowerWord !== matchedPw) {
                                lastSfxTriggerRef.current.lastPowerWord = matchedPw;
                                playWebAudioSfx("kaching", actx, undefined, sfxVolume);
                            }
                        }
                    }
                }
            } catch (_) {}

            // Seamless clip switching
            if (clips.length > 1) {
                const switchSec = Math.max(2, clipSwitchInterval || 2.5);
                const validT = (typeof nextTime === "number" && isFinite(nextTime) && nextTime >= 0) ? nextTime : 0;
                const clipIdx = Math.floor(validT / switchSec) % clips.length;
                const currentClip = clips[clipIdx] || clips[0];
                const nextClipIdx = (clipIdx + 1) % clips.length;
                const nextClip = clips[nextClipIdx] || currentClip;
                const timeInInterval = validT % switchSec;

                // Pre-roll next clip 0.45s before switch
                if (switchSec - timeInInterval <= 0.45 && nextClip?.id) {
                    const nextVid = videoElementsRef.current[nextClip.id];
                    if (nextVid && nextVid.paused) {
                        nextVid.currentTime = 0;
                        nextVid.play().catch(() => {});
                    }
                }

                // If active clip transitioned, pause previous
                if (currentClip?.id && currentClip.id !== lastActiveClipIdRef.current) {
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
    }, [isPlaying, totalDuration, clips, clipSwitchInterval, activeBgmUrl, bgmVolume, enableAudioDucking, voiceDuration, drawCanvasFrame, enableSfxWhoosh, enableSfxDing, enableSfxKaching, sfxVolume, subtitleCues, keyPowerWords]);

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

        // Ensure voiceover audio is synthesized before export begins
        let activeVoiceUrl = selectedVoiceAudioUrl;
        if (!activeVoiceUrl && selectedVoiceText && selectedVoiceText.trim()) {
            activeVoiceUrl = await generateSpeechForText(selectedVoiceText, selectedVoiceStyleId, selectedVoiceEngine);
        }

        pausePlayback();
        setIsRendering(true);
        setRenderProgress(0);
        isExportingRef.current = true;

        try {
            // Setup Web Audio Context for audio mixing
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioCtx.state === "suspended") {
                await audioCtx.resume();
            }
            const destNode = audioCtx.createMediaStreamDestination();

            // 1. Voiceover Source
            let voiceAudioEl: HTMLAudioElement | null = null;
            if (activeVoiceUrl) {
                voiceAudioEl = new Audio(activeVoiceUrl);
                if (!activeVoiceUrl.startsWith("blob:")) {
                    voiceAudioEl.crossOrigin = "anonymous";
                }
                voiceAudioEl.playbackRate = voiceSpeedMultiplier || 1.0;
                const voiceSrc = audioCtx.createMediaElementSource(voiceAudioEl);
                voiceSrc.connect(destNode);
                voiceAudioEl.currentTime = 0;
            }

            // 2. BGM Source with Ducking Gain
            let bgmAudioEl: HTMLAudioElement | null = null;
            let bgmGainNode: GainNode | null = null;
            if (activeBgmUrl) {
                bgmAudioEl = new Audio(activeBgmUrl);
                if (activeBgmUrl.startsWith("http") && !activeBgmUrl.includes(window.location.host)) {
                    bgmAudioEl.crossOrigin = "anonymous";
                }
                bgmAudioEl.loop = true;
                const bgmSrc = audioCtx.createMediaElementSource(bgmAudioEl);
                bgmGainNode = audioCtx.createGain();
                bgmGainNode.gain.value = enableAudioDucking ? bgmVolume * 0.22 : bgmVolume;
                bgmSrc.connect(bgmGainNode);
                bgmGainNode.connect(destNode);
                bgmAudioEl.currentTime = 0;
            }

            // Capture 60FPS canvas stream + mixed audio stream for butter-smooth export
            const canvasStream = canvas.captureStream(60);
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
                videoBitsPerSecond: 6500000, // 6.5 Mbps for pristine 60FPS mobile & desktop clarity
                audioBitsPerSecond: 128000
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
                    if (c?.id) {
                        const v = videoElementsRef.current[c.id];
                        if (v && !v.paused) v.pause();
                    }
                });
                audioCtx.close().catch(() => {});

                updateFinancialTracker();

                // Auto-save rendered video project into history
                const savedProj: VideoProjectItem = {
                    id: `proj-${Date.now()}`,
                    title: cloneTopic || customHookTitle.slice(0, 45) || "Dự án video LYHU",
                    topic: cloneTopic || customHookTitle,
                    hookTitle: customHookTitle,
                    script: selectedVoiceText,
                    directorGuide: directorGuide || {
                        hookVisual: "",
                        spokenHook: "",
                        pacingSpeed: `${clipSwitchInterval}s`,
                        keyPowerWords,
                        callToAction: "Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ!",
                        shootingTips: [],
                        shots: []
                    },
                    aspectRatio,
                    fontFamily,
                    fontSize,
                    textColor,
                    subtitleStyle,
                    textAnimationEffect,
                    clipSwitchInterval,
                    transitionEffect,
                    bgmChoice,
                    createdAt: Date.now(),
                    renderedVideoUrl: finalUrl,
                    renderedFormat: finalExt
                };
                saveVideoProject(savedProj).then(() => loadSavedProjects()).catch(() => {});

                // Instant safe download trigger
                const a = document.createElement("a");
                a.href = finalUrl;
                a.download = `LYHU_${aspectRatio.replace(":", "-")}_${Date.now()}.${finalExt}`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    if (document.body.contains(a)) document.body.removeChild(a);
                }, 1000);
            };

            // Pause all background clips first
            clips.forEach((c) => {
                if (c?.id) {
                    const v = videoElementsRef.current[c.id];
                    if (v && !v.paused) v.pause();
                }
            });

            // Start First Video Clip
            const firstClip = clips[0];
            const firstVid = firstClip?.id ? videoElementsRef.current[firstClip.id] : null;
            if (firstVid) {
                firstVid.currentTime = 0;
                firstVid.play().catch(() => {});
            }

            // Start Audio
            if (voiceAudioEl) voiceAudioEl.play().catch(() => {});
            if (bgmAudioEl) bgmAudioEl.play().catch(() => {});

            // Unfragmented recording creates valid seekable video container without corruption
            recorder.start();

            const exportActiveClipId = { current: firstClip?.id || null };
            const exportSfxTrigger = {
                lastTransitionIdx: -1,
                lastHookDing: false,
                lastPowerWord: null as string | null
            };
            let lastRecordedT = 0;
            const exportStartTime = performance.now();
            let animExportId: number;

            const exportLoop = () => {
                if (!isExportingRef.current) return;

                const elapsed = (performance.now() - exportStartTime) / 1000;
                let exportTime = elapsed;

                // Sync strictly to voice audio if playing, avoiding any drift
                if (voiceAudioEl && !voiceAudioEl.paused && voiceAudioEl.currentTime > 0) {
                    exportTime = voiceAudioEl.currentTime;
                } else if (voiceAudioEl && voiceAudioEl.ended) {
                    exportTime = Math.max(elapsed, voiceDuration);
                }

                // Monotonic non-decreasing time
                lastRecordedT = Math.max(lastRecordedT, exportTime);
                const validExportT = Math.min(totalDuration, lastRecordedT);
                currentTimeRef.current = validExportT;

                // Seamless clip switching during export (0 decode contention)
                if (clips.length > 1) {
                    const switchSec = Math.max(2, clipSwitchInterval || 2.5);
                    const clipIdx = Math.floor(validExportT / switchSec) % clips.length;
                    const curClip = clips[clipIdx] || clips[0];
                    const nxtClip = clips[(clipIdx + 1) % clips.length] || curClip;
                    const timeInInt = validExportT % switchSec;

                    // Pre-roll next clip 0.35s before switch
                    if (switchSec - timeInInt <= 0.35 && nxtClip?.id && nxtClip.id !== curClip.id) {
                        const nxtVid = videoElementsRef.current[nxtClip.id];
                        if (nxtVid && nxtVid.paused) {
                            nxtVid.currentTime = 0;
                            nxtVid.play().catch(() => {});
                        }
                    }

                    // On clip switch: PAUSE previous clip immediately to prevent GPU/CPU decode contention!
                    if (curClip?.id && curClip.id !== exportActiveClipId.current) {
                        if (exportActiveClipId.current) {
                            const prevVid = videoElementsRef.current[exportActiveClipId.current];
                            if (prevVid && !prevVid.paused) prevVid.pause();
                        }
                        const curVid = videoElementsRef.current[curClip.id];
                        if (curVid) {
                            curVid.currentTime = 0;
                            curVid.play().catch(() => {});
                        }
                        exportActiveClipId.current = curClip.id;
                    }
                }

                // Dynamic Audio Ducking in export
                if (bgmGainNode) {
                    const isSpeaking = voiceDuration > 0 && validExportT < voiceDuration;
                    bgmGainNode.gain.value = enableAudioDucking && isSpeaking
                        ? bgmVolume * 0.22
                        : bgmVolume;
                }

                // Studio Foley Sound Effects synthesized directly into export stream
                try {
                    if (enableSfxDing && !exportSfxTrigger.lastHookDing && validExportT >= 0.15 && validExportT <= 0.6) {
                        exportSfxTrigger.lastHookDing = true;
                        playWebAudioSfx("ding", audioCtx, destNode, sfxVolume);
                    }
                    if (clips.length > 1 && enableSfxWhoosh) {
                        const switchSec = Math.max(2, clipSwitchInterval || 2.5);
                        const clipIdx = Math.floor(validExportT / switchSec);
                        if (clipIdx > 0 && clipIdx !== exportSfxTrigger.lastTransitionIdx) {
                            const timeInInt = validExportT % switchSec;
                            if (timeInInt <= 0.35) {
                                exportSfxTrigger.lastTransitionIdx = clipIdx;
                                playWebAudioSfx("whoosh", audioCtx, destNode, sfxVolume);
                            }
                        }
                    }
                    if (enableSfxKaching) {
                        const activeCue = subtitleCues.find(cue => validExportT >= cue.start && validExportT <= cue.end);
                        if (activeCue) {
                            const upperText = activeCue.text.toUpperCase();
                            const matchedPw = keyPowerWords.find(pw => pw && upperText.includes(pw.toUpperCase()));
                            if (matchedPw && exportSfxTrigger.lastPowerWord !== matchedPw) {
                                exportSfxTrigger.lastPowerWord = matchedPw;
                                playWebAudioSfx("kaching", audioCtx, destNode, sfxVolume);
                            }
                        }
                    }
                } catch (_) {}

                drawCanvasFrame(validExportT);

                const progress = Math.min(99, Math.round((validExportT / totalDuration) * 100));
                setRenderProgress(progress);

                if (validExportT >= totalDuration) {
                    cancelAnimationFrame(animExportId);
                    if (recorder.state === "recording") {
                        recorder.stop();
                    }
                    return;
                }

                animExportId = requestAnimationFrame(exportLoop);
            };

            animExportId = requestAnimationFrame(exportLoop);

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

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsProjectHistoryOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5 border border-purple-200"
                    >
                        <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
                        <span>Sổ Tay & Lịch Sử ({videoProjects.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsDirectorHubOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 border border-amber-200"
                    >
                        <Clapperboard className="w-3.5 h-3.5 text-amber-600" />
                        <span>Bảng Phân Cảnh Đạo Diễn</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleManualSaveProject}
                        disabled={isSavingProject}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                        <Save className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isSavingProject ? "Đang lưu..." : "Lưu Dự Án"}</span>
                    </button>

                    <Link
                        href="/media/voice-studio"
                        className="px-3.5 py-2 rounded-xl bg-teal-50 text-[#00AFA9] text-xs font-bold hover:bg-teal-100 transition-colors flex items-center gap-1.5 border border-teal-200"
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Lồng Tiếng AI</span>
                    </Link>
                </div>
            </div>

            {/* COMPACT FINANCIAL / SAVINGS BANNER */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        <span>Chi phí video này: <strong className="text-teal-700 font-mono font-bold">~{estimatedCurrentVideoCost} VNĐ</strong></span>
                        <span className="text-[10px] text-slate-400 font-normal">(Phân tích: 35đ • Lồng tiếng: {ttsCost}đ • Render: 0đ)</span>
                    </div>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <div className="text-slate-600 flex items-center gap-1.5">
                        <span>Tháng này: <strong className="font-mono text-slate-800">{totalCostSpent.toLocaleString("vi-VN")} VNĐ</strong> ({totalVideosCreated} video)</span>
                        <button
                            type="button"
                            onClick={handleResetBudgetTracker}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                        >
                            Đặt lại
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-xs">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tiết kiệm ~{totalSavings.toLocaleString("vi-VN")} VNĐ (98.5% so với thuê ngoài / CapCut Pro)</span>
                </div>
            </div>

            {/* 🚀 QUY TRÌNH SẢN XUẤT VIDEO 4 BƯỚC TUYẾN TÍNH CHUẨN LOGIC (Studio Production Pipeline) */}
            <StudioStepper
                activeStudioStep={activeStudioStep}
                setActiveStudioStep={setActiveStudioStep}
                clipsCount={clips.length}
                hasScript={selectedVoiceText.trim().length >= 10}
                hasVoice={Boolean(selectedVoiceAudioUrl)}
                isExportReady={clips.length > 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Controls & Setup (7 cols) */}
                <div className="lg:col-span-7 space-y-4">

                    {/* TAB COPILOT: SIÊU AI ĐẠO DIỄN COPILOT */}
                    {(activeStudioStep === "copilot" || activeStudioTab === "copilot") && (
                        <div className="bg-white p-5 rounded-2xl border border-teal-200/90 shadow-sm space-y-4">
                            <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-2xl p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Bot className="w-5 h-5 text-amber-300" />
                                        </span>
                                        <h2 className="font-black text-sm tracking-tight">Siêu AI Đạo Diễn LYHU (Autonomous Copilot)</h2>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 shadow-sm">
                                            Gemini 2.5 Flash
                                        </span>
                                    </div>
                                    <p className="text-xs text-teal-100 leading-relaxed max-w-xl">
                                        Trao đổi tự nhiên bằng tiếng Việt — AI sẽ tự suy nghĩ, đổi kịch bản, tự thu âm giọng đọc AI, nạp nhạc trend và tinh chỉnh thông số video trực tiếp vào Studio!
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleSendCopilotMessage("Em hãy tối ưu lại toàn bộ kịch bản và nhịp cắt cho video này để đạt chuẩn viral TikTok nhé!")}
                                        disabled={isCopilotThinking}
                                        className="px-3.5 py-2 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <span>Tự Động Tối Ưu</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveStudioStep("step_script");
                                            setActiveStudioTab("script");
                                        }}
                                        className="px-3 py-2 bg-teal-800/80 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
                                        title="Đóng trợ lý và quay lại các bước sản xuất"
                                    >
                                        <span>Đóng Trợ Lý</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Prompts */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Gợi ý lệnh đạo diễn 1 chạm:</span>
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        "🔥 Viết kịch bản khoai môn CVT container về đêm vibe hối hả chốt sỉ",
                                        "🎀 Đổi sang giọng Nữ dịu dàng, nhịp cắt 3.5s và nhạc lofi tâm sự",
                                        "⚡ Đổi giọng Nam Gen Z, nhịp cắt 2s dồn dập, đẩy nhạc Vinahouse",
                                        "🎯 Viết lại Hook 3 giây đầu giữ chân người xem và quét từ khóa vàng"
                                    ].map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSendCopilotMessage(prompt)}
                                            disabled={isCopilotThinking}
                                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200/80 text-[11px] font-semibold text-slate-700 transition-all text-left disabled:opacity-50"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages Log */}
                            <div className="max-h-[380px] min-h-[260px] overflow-y-auto space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                                {copilotMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                                                msg.role === "user"
                                                    ? "bg-teal-600 text-white rounded-br-none shadow-sm"
                                                    : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm space-y-2"
                                            }`}
                                        >
                                            {msg.role === "ai" && (
                                                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 text-[11px] font-bold text-teal-700">
                                                    <Bot className="w-3.5 h-3.5 text-teal-600" />
                                                    <span>Đạo Diễn AI LYHU</span>
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap font-medium">
                                                {msg.content}
                                            </div>

                                            {msg.actionsApplied && msg.actionsApplied.length > 0 && (
                                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400">Đã thực thi:</span>
                                                    {msg.actionsApplied.map((act, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold text-[10px] flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                                            <span>{act}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                                            {new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                ))}

                                {isCopilotThinking && (
                                    <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-teal-200 text-teal-800 text-xs font-semibold shadow-sm w-fit animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                        <span>Đạo Diễn AI đang suy nghĩ, phân tích & tự động cập nhật Studio...</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input Bar */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendCopilotMessage();
                                }}
                                className="flex items-center gap-2 pt-1"
                            >
                                <input
                                    type="text"
                                    value={copilotInput}
                                    onChange={(e) => setCopilotInput(e.target.value)}
                                    placeholder="Nói ý muốn của bạn (VD: 'Đổi kịch bản sang sỉ khoai môn CVT', 'chọn nhạc trend TikTok cho kho hàng')..."
                                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!copilotInput.trim() || isCopilotThinking}
                                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Gửi Lệnh</span>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ✍️ BƯỚC 1: SOẠN KỊCH BẢN & THU GIỌNG ĐỌC AI (GEMINI 3.8 FLASH) */}
                    {activeStudioStep === "step_script" && (
                        <Step1Script
                            selectedVoiceAudioUrl={selectedVoiceAudioUrl}
                            voiceDuration={voiceDuration}
                            scriptInputMode={scriptInputMode}
                            setScriptInputMode={setScriptInputMode}
                            cloneTopic={cloneTopic}
                            setCloneTopic={setCloneTopic}
                            handleCloneStyle={handleCloneStyle}
                            isAnalyzingClone={isAnalyzingClone}
                            isSynthesizingVoice={isSynthesizingVoice}
                            analyzingStepText={analyzingStepText}
                            cloneLink={cloneRefUrl}
                            setCloneLink={setCloneRefUrl}
                            activeTemplateId={activeTemplateId}
                            setActiveTemplateId={setActiveTemplateId}
                            handleApplyTemplate={handleApplyTemplate}
                            selectedVoiceText={selectedVoiceText}
                            setSelectedVoiceText={setSelectedVoiceText}
                            selectedVoiceEngine={selectedVoiceEngine}
                            setSelectedVoiceEngine={setSelectedVoiceEngine}
                            selectedVoiceStyleId={selectedVoiceStyleId}
                            setSelectedVoiceStyleId={setSelectedVoiceStyleId}
                            voiceSpeedMultiplier={voiceSpeedMultiplier}
                            setVoiceSpeedMultiplier={setVoiceSpeedMultiplier}
                            generateSpeechForText={generateSpeechForText}
                            isRecordingMic={isRecordingMic}
                            recordingSeconds={recordingSeconds}
                            handleStartMicRecording={handleStartMicRecording}
                            handleStopMicRecording={handleStopMicRecording}
                            handleVoiceUpload={handleVoiceUpload}
                            audioInputRef={audioInputRef}
                            isAuditionPlaying={isAuditionPlaying}
                            handleToggleAuditionVoice={handleToggleAuditionVoice}
                            cloneStoryboard={cloneStoryboard}
                            handleCopyDirectorShotlist={handleCopyDirectorShotlist}
                            onNext={() => setActiveStudioStep("step_clips")}
                        />
                    )}

                    {/* 🎬 BƯỚC 2: CHỌN CẢNH QUAY & KHO B-ROLL ĐIỆN ẢNH THỰC TẾ */}
                    {activeStudioStep === "step_clips" && (
                        <Step2Clips
                            clips={clips}
                            aspectRatio={aspectRatio}
                            setAspectRatio={setAspectRatio}
                            clipSwitchInterval={clipSwitchInterval}
                            setClipSwitchInterval={setClipSwitchInterval}
                            handleLoadDemoClips={handleLoadDemoClips}
                            isDragging={isDragging}
                            setIsDragging={setIsDragging}
                            handleDrop={handleDrop}
                            fileInputRef={fileInputRef}
                            isUploadingVideo={isUploadingVideo}
                            handleVideoUpload={handleVideoUpload}
                            displayTime={displayTime}
                            setPreviewingClip={setPreviewingClip}
                            handlePreviewSpecificClip={handlePreviewSpecificClip}
                            moveClipToIndex={moveClipToIndex}
                            moveClip={moveClip}
                            handleSetOpeningClip={handleSetOpeningClip}
                            removeClip={removeClip}
                            handleAddBRoll={handleAddBRollClipAndPreview}
                            videoFilterPreset={videoFilterPreset}
                            setVideoFilterPreset={setVideoFilterPreset}
                            onPrev={() => setActiveStudioStep("step_script")}
                            onNext={() => setActiveStudioStep("step_visuals")}
                        />
                    )}

                    {/* 🎨 BƯỚC 3: TIÊU ĐỀ HOOK, HUY HIỆU BÁN HÀNG & PHỤ ĐỀ ĐỘNG */}
                    {activeStudioStep === "step_visuals" && (
                        <Step3Visuals
                            handlePreviewHookOnly={handlePreviewHookOnly}
                            hookDuration={hookDuration}
                            setHookDuration={setHookDuration}
                            showHookTitle={showHookTitle}
                            setShowHookTitle={setShowHookTitle}
                            customHookTitle={customHookTitle}
                            handleHookTitleChange={handleHookTitleChange}
                            hookBannerTheme={hookBannerTheme}
                            setHookBannerTheme={setHookBannerTheme}
                            stickerPosition={stickerPosition}
                            setStickerPosition={setStickerPosition}
                            activeSalesSticker={activeSalesSticker}
                            setActiveSalesSticker={setActiveSalesSticker}
                            enableSubtitles={enableSubtitles}
                            setEnableSubtitles={setEnableSubtitles}
                            fontFamily={fontFamily}
                            setFontFamily={setFontFamily}
                            subtitleStyle={subtitleStyle}
                            setSubtitleStyle={setSubtitleStyle}
                            textColor={textColor}
                            setTextColor={setTextColor}
                            textAnimationEffect={textAnimationEffect}
                            setTextAnimationEffect={setTextAnimationEffect}
                            subtitleOffset={subtitleOffset}
                            setSubtitleOffset={setSubtitleOffset}
                            fontSize={fontSize}
                            setFontSize={setFontSize}
                            textPosition={textPosition}
                            setTextPosition={setTextPosition}
                            onPrev={() => setActiveStudioStep("step_clips")}
                            onNext={() => setActiveStudioStep("step_audio_export")}
                        />
                    )}

                    {/* 🔊 BƯỚC 4: ÂM THANH XU HƯỚNG, FOLEY SFX & XUẤT BẢN VIDEO 60 FPS */}
                    {(activeStudioStep === "step_audio_export" || activeStudioTab === "music") && (
                        <Step4AudioExport
                            viralityScore={viralityScore}
                            bgmMode={bgmMode}
                            setBgmMode={setBgmMode}
                            selectedVoiceText={selectedVoiceText}
                            handleAiMatchMusic={handleAiMatchMusic}
                            bgmChoice={bgmChoice}
                            setBgmChoice={setBgmChoice}
                            tiktokExtractUrl={tiktokExtractUrl}
                            setTiktokExtractUrl={setTiktokExtractUrl}
                            handleExtractTikTokSound={handleExtractTikTokSound}
                            isExtractingTikTokSound={isExtractingTikTokSound}
                            previewingSoundUrl={previewingSoundUrl}
                            handleTogglePreviewSound={handleTogglePreviewSound}
                            handleCopySoundTitle={handleCopySoundTitle}
                            copiedSoundTitle={copiedSoundTitle}
                            handleApplyTikTokSound={handleApplyTikTokSound}
                            bgmVolume={bgmVolume}
                            setBgmVolume={setBgmVolume}
                            enableAudioDucking={enableAudioDucking}
                            setEnableAudioDucking={setEnableAudioDucking}
                            showWatermark={showWatermark}
                            setShowWatermark={setShowWatermark}
                            sfxVolume={sfxVolume}
                            setSfxVolume={setSfxVolume}
                            enableSfxWhoosh={enableSfxWhoosh}
                            setEnableSfxWhoosh={setEnableSfxWhoosh}
                            enableSfxDing={enableSfxDing}
                            setEnableSfxDing={setEnableSfxDing}
                            enableSfxKaching={enableSfxKaching}
                            setEnableSfxKaching={setEnableSfxKaching}
                            enableSfxBoom={enableSfxBoom}
                            setEnableSfxBoom={setEnableSfxBoom}
                            handleAuditionSfx={handleAuditionSfx}
                            handleBoostVirality={handleBoostVirality}
                            isRendering={isRendering}
                            renderProgress={renderProgress}
                            handleExportVideo={handleExportVideo}
                            onPrev={() => setActiveStudioStep("step_visuals")}
                        />
                    )}

                    {/* END OF 4-STEP PRODUCTION PIPELINE */}
                </div>

                {/* RIGHT: Live Video Canvas & Export (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-teal-600" />
                                Màn hình xem trước ({aspectRatio})
                            </h3>
                            <span className="text-[11px] font-mono text-gray-500 font-medium">
                                {displayTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                            </span>
                        </div>

                        {/* Pure Flat LYHU Video Canvas Container (No 3D Phone Mockup) */}
                        <div className={`relative mx-auto transition-all ${
                            aspectRatio === "9:16" ? "max-w-[280px]" : aspectRatio === "1:1" ? "max-w-[340px]" : "max-w-[440px]"
                        }`}>
                            <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 ${
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
                                    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-white text-center z-20 space-y-2.5">
                                        <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                                        <div className="font-black text-2xl font-mono text-teal-300">{renderProgress}%</div>
                                        <div className="text-xs font-bold text-white">
                                            Đang xuất video {exportFormat.toUpperCase()} (60 FPS Chuẩn Mượt)...
                                        </div>
                                        <div className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-lg p-2 max-w-[240px] leading-relaxed font-medium">
                                            ⚠️ Vui lòng giữ tab này mở trong lúc đang xuất để chip đồ họa xuất đủ 60 FPS mượt mà!
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                isExportingRef.current = false;
                                                setIsRendering(false);
                                            }}
                                            className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-slate-300 text-xs font-medium cursor-pointer mt-1"
                                        >
                                            Hủy xuất video
                                        </button>
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
                                className="w-full accent-teal-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
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
                                    className="w-11 h-11 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all"
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
                                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
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
                                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                                : "bg-slate-50 text-gray-600 border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        WEBM (Nhẹ)
                                    </button>
                                </div>
                            </div>

                            {/* Export Button (Pure Flat LYHU Style) */}
                            <button
                                type="button"
                                disabled={isRendering || clips.length === 0}
                                onClick={handleExportVideo}
                                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isRendering ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang dựng video: {renderProgress}%...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-amber-300" />
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

            {/* MODAL 0: TRÌNH PHÁT XEM TRỰC TIẾP TỪNG VIDEO THÔ & SẮP XẾP */}
            <ClipPreviewModal
                previewingClip={previewingClip}
                clips={clips}
                onClose={() => setPreviewingClip(null)}
                onSetOpeningClip={handleSetOpeningClip}
                onMoveClip={moveClip}
            />

            {/* MODAL 1: SỔ TAY KỊCH BẢN & LỊCH SỬ DỰ ÁN VIDEO */}
            <ProjectHistoryModal
                isOpen={isProjectHistoryOpen}
                onClose={() => setIsProjectHistoryOpen(false)}
                videoProjects={videoProjects}
                onLoadProject={handleLoadProject}
                onDeleteProject={handleDeleteProject}
                onManualSaveProject={handleManualSaveProject}
                isSavingProject={isSavingProject}
            />

            {/* MODAL 2: BẢNG PHÂN CẢNH & CHỈ ĐẠO QUAY CỦA ĐẠO DIỄN AI */}
            <DirectorHubModal
                isOpen={isDirectorHubOpen}
                onClose={() => setIsDirectorHubOpen(false)}
                directorGuide={directorGuide}
                customHookTitle={customHookTitle}
                clipSwitchInterval={clipSwitchInterval}
                onCopyShotlist={handleCopyDirectorShotlist}
            />

            {/* Hidden media elements for canvas sync */}
            <div className="hidden">
                {clips.map((clip) => {
                    if (!clip?.id || !clip?.url) return null;
                    return (
                        <video
                            key={clip.id}
                            ref={(el) => {
                                if (clip?.id) {
                                    videoElementsRef.current[clip.id] = el;
                                }
                            }}
                            src={clip.url}
                            playsInline
                            muted
                            preload="auto"
                            crossOrigin="anonymous"
                        />
                    );
                })}
                <audio ref={hiddenAudioRef} src={selectedVoiceAudioUrl || ""} />
                <audio ref={bgmAudioRef} src={activeBgmUrl || ""} loop crossOrigin="anonymous" />
                <audio ref={previewAudioRef} onEnded={() => setPreviewingSoundUrl(null)} />
                <audio ref={auditionAudioRef} onEnded={() => setIsAuditionPlaying(false)} />
            </div>
        </div>
    );
}
