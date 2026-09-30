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
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";

// ── COLOR LUT PRESETS FOR VIDEO GRADING ──
const VIDEO_FILTERS = [
    { id: "none", name: "Gốc", filter: "none" },
    { id: "vibrant", name: "🔥 Rực Rỡ TikTok", filter: "saturate(1.3) contrast(1.08) brightness(1.03)" },
    { id: "crispy", name: "✨ Bánh Giòn Rụm", filter: "sepia(0.18) saturate(1.25) contrast(1.12) brightness(1.04)" },
    { id: "cinematic", name: "🎬 Điện Ảnh Sâu", filter: "contrast(1.18) brightness(0.96) saturate(1.08)" },
    { id: "cool_storage", name: "❄️ Sáng Kho Hàng", filter: "brightness(1.06) contrast(1.1) saturate(0.95)" }
];

// ── 1-CLICK VIRAL HOOK PRESETS FOR SNACKS ──
const VIRAL_HOOK_PRESETS = [
    { label: "🔥 Bóc giá sỉ tận kho", text: "🔥 BÓC GIÁ SỈ TẬN KHO LYHU: LÃI GẤP ĐÔI CHO CHỦ QUÁN!" },
    { label: "⚠️ Cảnh báo cháy hàng", text: "⚠️ CẢNH BÁO CHỦ QUÁN: MÓN ĂN VẶT NÀY VỪA VỀ ĐÃ CHÁY HÀNG!" },
    { label: "💸 1 vốn 4 lời", text: "💸 1 VỐN 4 LỜI: TOP MÓN ĂN VẶT CỨU DOANH THU QUÁN MÙA NÀY!" },
    { label: "📦 Đập hộp 100kg sỉ", text: "📦 ĐẬP HỘP KIỆN HÀNG 100KG ĂN VẶT GIÁ SỈ TẬN XƯỞNG!" },
    { label: "🚀 Bí quyết đông khách", text: "🚀 BÍ QUYẾT QUÁN TRÀ SỮA ĐÔNG KHÁCH NHỜ MÓN ĂN VẶT NÀY!" },
    { label: "✨ Xả kho giá gốc", text: "✨ XẢ KHO GIÁ GỐC: CHỈ DÀNH CHO 50 ĐỐI TÁC SỈ ĐẦU TIÊN!" }
];

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
    words?: {
        word: string;
        start: number;
        end: number;
    }[];
}

interface TikTokTrendingSound {
    id: string;
    title: string;
    author: string;
    tag: string;
    url: string;
    duration: string;
    useCase: string;
    isHot?: boolean;
}

const TIKTOK_TRENDING_SOUNDS: TikTokTrendingSound[] = [
    {
        id: "tt_tramy_1",
        title: "âm thanh gốc - Trà My 24Zone (Kể chuyện kho đêm)",
        author: "Trà My 24Zone",
        tag: "🔥 Đang Hot",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:51",
        useCase: "Video kể chuyện kho hàng đêm, đóng hàng sỉ, tự sự chân thật",
        isHot: true
    },
    {
        id: "tt_banhang_remix",
        title: "Beat Chốt Đơn Sôi Động (Speed-up TikTok 2026)",
        author: "TikTok Viral Sounds",
        tag: "⚡ Bán Hàng Mạnh",
        url: "/audio/bgm/trending.mp3",
        duration: "0:45",
        useCase: "Khuyến mãi, xả kho, thông báo hàng mới về cần đẩy số lượng lớn",
        isHot: true
    },
    {
        id: "tt_food_asmr",
        title: "Vui Tươi Ăn Vặt & Review Ẩm Thực (Ngon miệng)",
        author: "Foodie Daily Sound",
        tag: "🍜 Review Đồ Ăn",
        url: "/audio/bgm/food_review.mp3",
        duration: "0:42",
        useCase: "Review thanh khoai môn trứng cua, da cá hoàng kim, bánh tráng bơ",
        isHot: true
    },
    {
        id: "tt_lofi_pack",
        title: "Lofi Nhẹ Nhàng Thư Giãn (Đóng Gói Đơn Hàng)",
        author: "Chill Packing BGM",
        tag: "📦 Đóng Hàng / Logistics",
        url: "/audio/bgm/warehouse_flow.mp3",
        duration: "0:48",
        useCase: "Quay công nhân đóng thùng hàng, kiểm tem nhãn, in hóa đơn giao khách"
    },
    {
        id: "tt_vinahouse_drop",
        title: "Vinahouse Bass Căng (Nhạc Nền TikTok Hot)",
        author: "Hot TikTok Vietnam",
        tag: "🎧 Năng Lượng / Chốt Đơn",
        url: "/audio/bgm/trending.mp3",
        duration: "0:38",
        useCase: "Video ngắn dưới 20 giây giật tít giảm giá sâu hoặc khai trương chi nhánh"
    }
];

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
        id: "tt_tramy_1",
        name: "🎧 Âm thanh gốc - Trà My 24Zone (Kể chuyện kho đêm)",
        url: "/audio/bgm/warehouse_flow.mp3"
    },
    {
        id: "tt_banhang_remix",
        name: "⚡ Beat Chốt Đơn Sôi Động (Speed-up TikTok 2026)",
        url: "/audio/bgm/trending.mp3"
    },
    {
        id: "tt_food_asmr",
        name: "🥢 Beat Review Ẩm Thực Vui Tươi (Ngon miệng)",
        url: "/audio/bgm/food_review.mp3"
    },
    {
        id: "custom",
        name: "📁 Tự tải file nhạc nền MP3 riêng từ máy tính...",
        url: ""
    },
    {
        id: "none",
        name: "🔇 Không dùng nhạc nền (Chỉ giữ giọng đọc - Chuẩn đăng TikTok)",
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

// ── AI B-ROLL CINEMATIC FOOTAGE LIBRARY ──
const AI_BROLL_LIBRARY = [
    {
        id: "broll_warehouse",
        name: "📦 Kho hàng LYHU & Đóng gói kiện sỉ",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        tag: "Kho Hàng B2B",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_snack",
        name: "🍟 Cận cảnh thanh khoai môn sấy giòn rụm",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        tag: "Sản Phẩm Hot",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_delivery",
        name: "🚚 Xe container xuất hàng & Giao sỉ tận quán",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        tag: "Logistics",
        duration: 12,
        width: 1280,
        height: 720
    },
    {
        id: "broll_joy",
        name: "😋 Khách hàng thưởng thức & Đánh giá 5 sao",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
        tag: "Review Ẩm Thực",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_meltdown",
        name: "🧀 Bột phô mai Boyo rắc phủ vàng ươm",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        tag: "Nguyên Liệu Sỉ",
        duration: 15,
        width: 1280,
        height: 720
    },
    {
        id: "broll_container",
        name: "🌙 Đêm container bốc hàng tại tổng kho",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        tag: "Chuyện Kho Đêm",
        duration: 15,
        width: 1280,
        height: 720
    }
];

const DEMO_CLIPS = AI_BROLL_LIBRARY.slice(0, 3);

// ── HIGH-FIDELITY WEB AUDIO SOUND DESIGN ENGINE (0ms Latency Synthesis) ──
function playWebAudioSfx(
    type: "whoosh" | "ding" | "kaching" | "boom" | "pop",
    audioCtx: AudioContext,
    destNode?: AudioNode,
    volume = 0.35
) {
    try {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.gain.value = volume;
        gain.connect(destNode || audioCtx.destination);

        if (type === "whoosh") {
            const bufferSize = Math.floor(audioCtx.sampleRate * 0.32);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(320, now);
            filter.frequency.exponentialRampToValueAtTime(3400, now + 0.16);
            filter.frequency.exponentialRampToValueAtTime(450, now + 0.32);
            filter.Q.value = 3.2;

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.14);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.32);

            noise.connect(filter);
            filter.connect(gain);
            noise.start(now);
            noise.stop(now + 0.32);

        } else if (type === "ding") {
            const osc = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            osc.type = "sine";
            osc2.type = "sine";
            osc.frequency.setValueAtTime(1480, now);
            osc2.frequency.setValueAtTime(2960, now);

            gain.gain.setValueAtTime(volume * 0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

            osc.connect(gain);
            osc2.connect(gain);
            osc.start(now);
            osc2.start(now);
            osc.stop(now + 0.65);
            osc2.stop(now + 0.65);

        } else if (type === "kaching") {
            [1760, 2340, 3120].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                const coinGain = audioCtx.createGain();
                coinGain.gain.setValueAtTime(0, now + idx * 0.07);
                coinGain.gain.linearRampToValueAtTime(volume * 0.75, now + idx * 0.07 + 0.01);
                coinGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.38);
                osc.connect(coinGain);
                coinGain.connect(destNode || audioCtx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.38);
            });

        } else if (type === "boom") {
            const osc = audioCtx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 0.55);

            gain.gain.setValueAtTime(volume * 1.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.7);

        } else if (type === "pop") {
            const osc = audioCtx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.05);

            gain.gain.setValueAtTime(volume * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        console.warn("SFX error:", e);
    }
}

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
    const [hookBannerTheme, setHookBannerTheme] = useState<"red_orange" | "black_gold" | "teal_lyhu">("red_orange");
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
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>("kho_dem");
    const [videoFilterPreset, setVideoFilterPreset] = useState<string>("vibrant");

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

    // ── AI STYLE CLONE STATE ──
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(true);
    const [cloneRefUrl, setCloneRefUrl] = useState("https://www.tiktok.com/@tra.my.24zone/video/7653479957431061778");
    const [cloneTopic, setCloneTopic] = useState("Hàng khoai môn CVT container về buổi đêm date mới tinh");
    const [isAnalyzingClone, setIsAnalyzingClone] = useState(false);
    const [cloneStoryboard, setCloneStoryboard] = useState<string[]>([]);
    // ── STUDIO TAB NAVIGATION & AI SUPERPOWERS ──
    const [activeStudioTab, setActiveStudioTab] = useState<"copilot" | "script" | "clips" | "music" | "ai_superpowers">("copilot");
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
                    rate: "+8%"
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

        const cleanText = normalizeVietnamesePhonetics(textToSpeak.trim());
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

    const handleCloneStyle = async () => {
        if (!cloneTopic.trim()) {
            alert("Vui lòng nhập chủ đề sản phẩm của bạn!");
            return;
        }

        setIsAnalyzingClone(true);
        setAnalyzingStepText("1/2 Đạo diễn AI đang phân tích kịch bản & 5 góc quay...");
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
                    const audioUrl = await generateSpeechForText(newScript, selectedVoiceStyleId);
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
                        appliedLabels.push("Cập nhật kịch bản");
                        if (act.payload.triggerTTS !== false) {
                            generateSpeechForText(act.payload.script, selectedVoiceStyleId);
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
                        generateSpeechForText(selectedVoiceText, act.payload.voiceStyle);
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

        const switchSec = Math.max(2, clipSwitchInterval || 2.5);
        const validTime = (typeof time === "number" && isFinite(time) && time >= 0) ? time : 0;
        const rawIdx = Math.floor(validTime / switchSec);
        const clipIdx = (isFinite(rawIdx) && clips.length > 0) ? (Math.abs(rawIdx) % clips.length) : 0;
        const currentClip = clips[clipIdx] || clips[0];
        if (!currentClip) return;
        const nextClipIdx = clips.length > 0 ? (clipIdx + 1) % clips.length : 0;
        const nextClip = clips[nextClipIdx] || currentClip;

        const timeInInterval = validTime % switchSec;
        const transitionWindow = 0.45;
        const isNearTransition = switchSec - timeInInterval <= transitionWindow && clips.length > 1;
        const transitionFactor = isNearTransition ? (switchSec - timeInInterval) / transitionWindow : 1.0;

        const currentVid = currentClip?.id ? videoElementsRef.current[currentClip.id] : null;
        const nextVid = nextClip?.id ? videoElementsRef.current[nextClip.id] : null;

        // Active transition effect
        let activeTrans = transitionEffect;
        if (activeTrans === "auto") {
            const transPool: ("crossfade" | "zoom_in" | "slide_left" | "white_flash")[] = [
                "crossfade",
                "zoom_in",
                "slide_left",
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
            if (videoFilterPreset !== "none") {
                const foundFilter = VIDEO_FILTERS.find(f => f.id === videoFilterPreset);
                if (foundFilter && foundFilter.filter !== "none") {
                    ctx.filter = foundFilter.filter;
                }
            }
            ctx.drawImage(videoEl, dx, dy, dw, dh);
            ctx.restore();
        };

        const zoomProgress = (validTime % switchSec) / switchSec;
        const dynamicScale = 1.0 + zoomProgress * 0.04;

        const isNextVidReady = nextVid && nextVid.readyState >= 2;
        // Smooth S-curve easing factor from 0.0 to 1.0
        const progress = Math.max(0, Math.min(1, 1.0 - transitionFactor));
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

        // Render with Transition (ZERO-JERK & ZERO BLACK-FRAME)
        if (isNearTransition && clips.length > 1) {
            if (activeTrans === "crossfade") {
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                if (isNextVidReady) {
                    drawVideoCover(nextVid, 0, ease, 1.0);
                }

            } else if (activeTrans === "zoom_in") {
                const curScale = dynamicScale * (1.0 + ease * 0.08);
                if (currentVid) drawVideoCover(currentVid, 0, 1.0, curScale);
                if (isNextVidReady) {
                    const nxtScale = 0.94 + ease * 0.06;
                    drawVideoCover(nextVid, 0, ease, nxtScale);
                }

            } else if (activeTrans === "slide_left") {
                if (isNextVidReady) {
                    const slideOffset = ease * cw;
                    if (currentVid) drawVideoCover(currentVid, -slideOffset, 1.0, dynamicScale);
                    drawVideoCover(nextVid, cw - slideOffset, 1.0, 1.0);
                } else {
                    if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                }

            } else if (activeTrans === "white_flash") {
                if (progress < 0.5) {
                    if (currentVid) drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                } else {
                    if (isNextVidReady) {
                        drawVideoCover(nextVid, 0, 1.0, 1.0);
                    } else if (currentVid) {
                        drawVideoCover(currentVid, 0, 1.0, dynamicScale);
                    }
                }
                const flashAlpha = Math.sin(progress * Math.PI) * 0.65;
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

        // 2. Draw Hook Title (First 3.5s with Auto-Wrap & 100% Frame-Safe Fit)
        if (showHookTitle && time <= hookDuration && customHookTitle.trim()) {
            ctx.save();

            // Pop-in bounce animation in first 0.25s
            let hookScale = 1.0;
            if (time < 0.25) {
                const t = time / 0.25;
                hookScale = 0.85 + 0.15 * Math.sin(t * Math.PI * 0.5);
            }

            const hookCenterY = ch * 0.165;
            const maxBadgeW = Math.min(cw * 0.90, cw - 32); // Safe width boundary
            const maxContentW = maxBadgeW - 36; // Inner text padding

            // Auto-scale font size based on text length
            const textRaw = customHookTitle.trim();
            let baseFontSize = 23;
            if (textRaw.length > 55) baseFontSize = 17;
            else if (textRaw.length > 36) baseFontSize = 19.5;

            ctx.font = `900 ${baseFontSize}px ${fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Multi-line word-wrapping (Guarantees text never clips horizontally)
            const words = textRaw.split(/\s+/);
            const lines: string[] = [];
            let currentLine = "";

            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
                const testW = ctx.measureText(testLine).width;
                if (testW > maxContentW && currentLine) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            // Re-measure max line width
            let maxLineW = 0;
            lines.forEach((l) => {
                const lw = ctx.measureText(l).width;
                if (lw > maxLineW) maxLineW = lw;
            });

            const lineHeight = baseFontSize * 1.38;
            const badgeW = Math.min(maxBadgeW, Math.max(160, maxLineW + 36));
            const badgeH = Math.max(46, lines.length * lineHeight + 20);
            const badgeX = (cw - badgeW) / 2;
            const badgeY = hookCenterY - badgeH / 2;

            // Apply scale from center
            ctx.translate(cw / 2, hookCenterY);
            ctx.scale(hookScale, hookScale);
            ctx.translate(-cw / 2, -hookCenterY);

            // Badge Background Gradient (Configurable High-Impact Themes)
            const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
            if (hookBannerTheme === "black_gold") {
                grad.addColorStop(0, "#18181B");
                grad.addColorStop(1, "#27272A");
            } else if (hookBannerTheme === "teal_lyhu") {
                grad.addColorStop(0, "#0F766E");
                grad.addColorStop(1, "#00AFA9");
            } else {
                grad.addColorStop(0, "#DC2626");
                grad.addColorStop(0.5, "#E11D48");
                grad.addColorStop(1, "#EA580C");
            }

            ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
            ctx.shadowBlur = 16;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
            ctx.fill();

            // Inner glowing border
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = hookBannerTheme === "black_gold" ? "#FACC15" : "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw each line of text with bold outline stroke + crisp fill
            const startTextY = badgeY + (badgeH - (lines.length - 1) * lineHeight) / 2;
            lines.forEach((lineText, idx) => {
                const lineY = startTextY + idx * lineHeight;

                // Strong dark stroke for 100% legibility on any background
                ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
                ctx.lineWidth = 4.5;
                ctx.lineJoin = "round";
                ctx.strokeText(lineText, cw / 2, lineY);

                // High contrast text
                ctx.fillStyle = hookBannerTheme === "black_gold" ? "#FEF08A" : "#FFFFFF";
                ctx.fillText(lineText, cw / 2, lineY);
            });

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

        // 3.5. Draw Active Animated Sales Callout Sticker / Live Badge
        if (activeSalesSticker && activeSalesSticker !== "none") {
            ctx.save();
            const pulse = 1.0 + Math.sin(validTime * 5) * 0.04;

            const STICKER_CONFIGS: Record<string, { title: string; subtitle: string; icon: string; bg: string; border: string; textCol: string }> = {
                freeship: {
                    title: "FREESHIP TẬN QUÁN",
                    subtitle: "Giao nhanh nội thành & các tỉnh",
                    icon: "🚚",
                    bg: "#059669",
                    border: "#34D399",
                    textCol: "#FFFFFF"
                },
                si_1_thung: {
                    title: "SỈ TỪ 1 THÙNG",
                    subtitle: "Giá tận xưởng bao lời x2",
                    icon: "🏷️",
                    bg: "#D97706",
                    border: "#FDE68A",
                    textCol: "#111827"
                },
                san_kho: {
                    title: "SẴN KHO 1.000 THÙNG",
                    subtitle: "Date mới tinh xuất ngay",
                    icon: "📦",
                    bg: "#2563EB",
                    border: "#93C5FD",
                    textCol: "#FFFFFF"
                },
                lai_x2: {
                    title: "LÃI GẤP ĐÔI TẬN GỐC",
                    subtitle: "Chiết khấu tối đa cho đại lý",
                    icon: "💰",
                    bg: "#DC2626",
                    border: "#FCA5A5",
                    textCol: "#FFFFFF"
                },
                inbox_cta: {
                    title: "INBOX NHẬN MẪU THỬ",
                    subtitle: "Gửi mẫu ăn thử miễn phí",
                    icon: "📲",
                    bg: "#7C3AED",
                    border: "#C4B5FD",
                    textCol: "#FFFFFF"
                }
            };

            const cfg = STICKER_CONFIGS[activeSalesSticker] || STICKER_CONFIGS["freeship"];
            let stickerX = cw - 130;
            let stickerY = 90;
            if (stickerPosition === "top_left") {
                stickerX = 130;
                stickerY = 90;
            } else if (stickerPosition === "bottom_right") {
                stickerX = cw - 130;
                stickerY = ch - 200;
            }

            ctx.translate(stickerX, stickerY);
            ctx.scale(pulse, pulse);

            const badgeW = 205;
            const badgeH = 44;

            ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
            ctx.shadowBlur = 12;

            ctx.fillStyle = cfg.bg;
            ctx.beginPath();
            ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 12);
            ctx.fill();

            ctx.strokeStyle = cfg.border;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Circle Icon
            ctx.beginPath();
            ctx.arc(-badgeW / 2 + 20, 0, 13, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.font = "15px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cfg.icon, -badgeW / 2 + 20, 1);

            // Title & Subtitle
            ctx.fillStyle = cfg.textCol;
            ctx.font = "900 11.5px 'Be Vietnam Pro', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(cfg.title, -badgeW / 2 + 40, -3);

            ctx.fillStyle = activeSalesSticker === "si_1_thung" ? "#374151" : "rgba(255, 255, 255, 0.88)";
            ctx.font = "600 8.5px 'Be Vietnam Pro', sans-serif";
            ctx.fillText(cfg.subtitle, -badgeW / 2 + 40, 11);

            ctx.restore();
        }

        // 4. Draw Animated Subtitle with Kinetic Typography & Creative Effects
        if (enableSubtitles) {
            const activeSub = subtitleCues.find(cue => time >= cue.start && time <= cue.end);
            if (activeSub) {
                ctx.save();
                const text = activeSub.text;
                const cueDur = Math.max(0.1, activeSub.end - activeSub.start);
                const cueElapsed = time - activeSub.start;

                let subY = ch * 0.82;
                if (textPosition === "center") subY = ch * 0.52;
                if (textPosition === "top") subY = ch * 0.28;

                // Check for Power Words in current phrase
                const uppercaseText = text.toUpperCase();
                const matchedPowerWord = keyPowerWords.find(pw => pw && uppercaseText.includes(pw.toUpperCase()));

                // Overall phrase transforms
                let phraseScale = 1.0;
                let shakeX = 0;
                let shakeY = 0;

                if (textAnimationEffect === "tiktok_pop") {
                    // Elastic pop-in bounce on phrase entry (first 0.18s)
                    if (cueElapsed < 0.18) {
                        const t = cueElapsed / 0.18;
                        phraseScale = 1.0 + Math.sin(t * Math.PI) * 0.22;
                    }
                } else if (textAnimationEffect === "fire_shake") {
                    // Slam-down impact on entrance (first 0.12s) + dynamic shake for power words
                    if (cueElapsed < 0.12) {
                        const t = cueElapsed / 0.12;
                        phraseScale = 1.35 - 0.35 * Math.sin(t * Math.PI * 0.5);
                    }
                    if (matchedPowerWord) {
                        shakeX = Math.sin(time * 36) * 3;
                        shakeY = Math.cos(time * 28) * 2.5;
                    }
                }

                ctx.translate(cw / 2 + shakeX, subY + shakeY);
                ctx.scale(phraseScale, phraseScale);

                const maxAllowedSubW = cw - 56;
                let activeFontSize = fontSize;
                ctx.font = `900 ${fontSize}px ${fontFamily}`;
                const rawMeasure = ctx.measureText(text).width;
                if (rawMeasure > maxAllowedSubW) {
                    activeFontSize = Math.max(16, Math.floor(fontSize * (maxAllowedSubW / rawMeasure)));
                    ctx.font = `900 ${activeFontSize}px ${fontFamily}`;
                }
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Words array with timestamps
                const wordsList = activeSub.words || text.split(" ").map((w, idx, arr) => ({
                    word: w,
                    start: activeSub.start + (idx / arr.length) * cueDur,
                    end: activeSub.start + ((idx + 1) / arr.length) * cueDur
                }));

                // Calculate horizontal word layout
                const spaceW = ctx.measureText(" ").width;
                const wordWidths = wordsList.map(w => ctx.measureText(w.word).width);
                const totalLineW = wordWidths.reduce((a, b) => a + b, 0) + (wordsList.length - 1) * spaceW;

                // ── STYLE 1: TIKTOK_POP (CapCut Viral Word-by-Word Bounce & Highlight) ──
                if (textAnimationEffect === "tiktok_pop") {
                    let curX = -totalLineW / 2;
                    wordsList.forEach((wObj, idx) => {
                        const isSpeaking = time >= wObj.start && time <= wObj.end;
                        const hasSpoken = time > wObj.end;
                        const wWidth = wordWidths[idx];
                        const wordCenter = curX + wWidth / 2;

                        ctx.save();
                        ctx.translate(wordCenter, 0);

                        let wScale = 1.0;
                        let wColor = textColor || "#FFFFFF";
                        if (isSpeaking) {
                            // Active word jumps 1.25x and turns radiant yellow/gold
                            const wProgress = (time - wObj.start) / Math.max(0.05, wObj.end - wObj.start);
                            wScale = 1.0 + Math.sin(Math.min(1, wProgress) * Math.PI) * 0.28;
                            wColor = "#FFE600";
                            ctx.shadowColor = "rgba(255, 230, 0, 0.9)";
                            ctx.shadowBlur = 18;
                        } else if (hasSpoken) {
                            wColor = "#FFFFFF";
                            ctx.shadowColor = "rgba(0,0,0,0.95)";
                            ctx.shadowBlur = 10;
                        } else {
                            wColor = "rgba(255, 255, 255, 0.85)";
                            ctx.shadowColor = "rgba(0,0,0,0.8)";
                            ctx.shadowBlur = 8;
                        }

                        ctx.scale(wScale, wScale);
                        ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.24));
                        ctx.strokeStyle = "#000000";
                        ctx.lineJoin = "round";
                        ctx.strokeText(wObj.word, 0, 0);

                        ctx.fillStyle = wColor;
                        ctx.fillText(wObj.word, 0, 0);
                        ctx.restore();

                        curX += wWidth + spaceW;
                    });

                // ── STYLE 2: KARAOKE_GLOW (Vệt sáng Neon lướt theo từng âm tiết) ──
                } else if (textAnimationEffect === "karaoke_glow") {
                    let curX = -totalLineW / 2;
                    wordsList.forEach((wObj, idx) => {
                        const isSpeaking = time >= wObj.start && time <= wObj.end;
                        const hasSpoken = time > wObj.end;
                        const wWidth = wordWidths[idx];
                        const wordCenter = curX + wWidth / 2;

                        ctx.save();
                        ctx.translate(wordCenter, 0);

                        ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.22));
                        ctx.strokeStyle = "#000000";
                        ctx.lineJoin = "round";

                        if (isSpeaking) {
                            ctx.shadowColor = "#00F2FE";
                            ctx.shadowBlur = 24;
                            ctx.strokeText(wObj.word, 0, 0);
                            ctx.fillStyle = "#00F2FE";
                            ctx.fillText(wObj.word, 0, 0);

                            // Glowing dot beneath active word
                            ctx.beginPath();
                            ctx.arc(0, activeFontSize * 0.65, 4, 0, Math.PI * 2);
                            ctx.fillStyle = "#00F2FE";
                            ctx.fill();
                        } else if (hasSpoken) {
                            ctx.shadowColor = "rgba(0,0,0,0.85)";
                            ctx.shadowBlur = 8;
                            ctx.strokeText(wObj.word, 0, 0);
                            ctx.fillStyle = "#FFFFFF";
                            ctx.fillText(wObj.word, 0, 0);
                        } else {
                            ctx.shadowColor = "rgba(0,0,0,0.6)";
                            ctx.shadowBlur = 6;
                            ctx.strokeText(wObj.word, 0, 0);
                            ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
                            ctx.fillText(wObj.word, 0, 0);
                        }
                        ctx.restore();

                        curX += wWidth + spaceW;
                    });

                // ── STYLE 3: BICOLOR_PUNCH (CapCut 2 Màu Tương Phản Thời Thượng) ──
                } else if (textAnimationEffect === "bicolor_punch") {
                    let curX = -totalLineW / 2;
                    wordsList.forEach((wObj, idx) => {
                        const wWidth = wordWidths[idx];
                        const wordCenter = curX + wWidth / 2;
                        const isPower = matchedPowerWord && wObj.word.toUpperCase().includes(matchedPowerWord.toUpperCase());
                        const isSpeaking = time >= wObj.start && time <= wObj.end;

                        ctx.save();
                        ctx.translate(wordCenter, 0);
                        if (isSpeaking) {
                            ctx.scale(1.15, 1.15);
                        }

                        // Thick 3D drop shadow
                        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
                        ctx.shadowBlur = 12;
                        ctx.shadowOffsetX = 3;
                        ctx.shadowOffsetY = 4;

                        ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.22));
                        ctx.strokeStyle = "#000000";
                        ctx.lineJoin = "round";
                        ctx.strokeText(wObj.word, 0, 0);

                        // Dual tone: odd words or power words get vibrant yellow/orange, even words white
                        ctx.fillStyle = isPower ? "#FF4500" : (idx % 2 === 0 ? "#FFE600" : "#FFFFFF");
                        ctx.fillText(wObj.word, 0, 0);
                        ctx.restore();

                        curX += wWidth + spaceW;
                    });

                // ── STYLE 4: BOX_PILL (Hộp bo góc CapCut Pro Gen Z) ──
                } else if (subtitleStyle === "pill_dark" || textAnimationEffect === "box_pill") {
                    const pillW = totalLineW + 44;
                    const pillH = activeFontSize + 26;

                    // Frosted dark pill background
                    ctx.save();
                    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
                    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 14);
                    ctx.fill();

                    // Golden/Cyan accent rim
                    ctx.strokeStyle = matchedPowerWord ? "#FACC15" : "rgba(255, 255, 255, 0.35)";
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                    ctx.restore();

                    let curX = -totalLineW / 2;
                    wordsList.forEach((wObj, idx) => {
                        const isSpeaking = time >= wObj.start && time <= wObj.end;
                        const wWidth = wordWidths[idx];
                        const wordCenter = curX + wWidth / 2;

                        ctx.save();
                        ctx.translate(wordCenter, 0);
                        if (isSpeaking) {
                            ctx.scale(1.12, 1.12);
                            ctx.fillStyle = "#FFE600";
                            ctx.shadowColor = "#FFE600";
                            ctx.shadowBlur = 12;
                        } else {
                            ctx.fillStyle = "#FFFFFF";
                        }
                        ctx.fillText(wObj.word, 0, 0);
                        ctx.restore();

                        curX += wWidth + spaceW;
                    });

                // ── STYLE 5: FIRE_SHAKE / CLEAN_FADE (Viền đen nét căng dứt khoát) ──
                } else {
                    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
                    ctx.shadowBlur = 12;
                    ctx.lineWidth = Math.max(6, Math.round(activeFontSize * 0.24));
                    ctx.strokeStyle = "#000000";
                    ctx.lineJoin = "round";
                    ctx.strokeText(text, 0, 0);

                    ctx.fillStyle = matchedPowerWord ? "#FFE600" : (textColor || "#FFFFFF");
                    ctx.fillText(text, 0, 0);
                }

                // If Power Word matched in this phrase, render top mini badge
                if (matchedPowerWord && textAnimationEffect !== "box_pill") {
                    ctx.save();
                    ctx.font = `900 ${Math.max(10, Math.round(activeFontSize * 0.38))}px ${fontFamily}`;
                    ctx.fillStyle = "#DC2626";
                    ctx.shadowColor = "rgba(220, 38, 38, 0.8)";
                    ctx.shadowBlur = 10;
                    const tagText = `🔥 ${matchedPowerWord}`;
                    const tagW = ctx.measureText(tagText).width + 16;
                    const tagH = Math.max(18, Math.round(activeFontSize * 0.6));
                    ctx.beginPath();
                    ctx.roundRect(-tagW / 2, -activeFontSize - tagH + 2, tagW, tagH, 6);
                    ctx.fill();

                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillText(tagText, 0, -activeFontSize - tagH / 2 + 2);
                    ctx.restore();
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
        textAnimationEffect,
        keyPowerWords,
        customHookTitle,
        showHookTitle,
        hookBannerTheme,
        hookDuration,
        showWatermark,
        enableSubtitles,
        subtitleCues,
        videoFilterPreset
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

            {/* 🎬 LYHU AI STUDIO CREATOR CARD (Clean LYHU Brand) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-teal-500/30 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-500 text-white shadow-sm">
                            <Sparkles className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">
                                    Tạo Kịch Bản & Đồng Bộ Giọng Đọc 1-Click
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                    Google Gemini AI Engine
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                AI tự động: Viết kịch bản bán buôn → Thu giọng đọc AI tiếng Việt → Cắt nhịp 2.5s Jump-cut & Đồng bộ phụ đề 100%.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCloneModalOpen(!isCloneModalOpen)}
                        className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors self-start sm:self-center"
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{isCloneModalOpen ? "Thu gọn 3 phong cách" : "Xem 3 phong cách mẫu"}</span>
                    </button>
                </div>

                {/* Form input row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                    <div className="lg:col-span-6 space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>1. Chủ đề / Sản phẩm LYHU muốn làm video:</span>
                            <span className="text-[11px] text-teal-600 font-normal">Khoai môn CVT • Bột phô mai • Bánh tráng</span>
                        </label>
                        <input
                            type="text"
                            value={cloneTopic}
                            onChange={(e) => setCloneTopic(e.target.value)}
                            placeholder="Ví dụ: Hàng khoai môn CVT container về buổi đêm date mới tinh"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none text-xs text-slate-900 font-medium transition-colors"
                        />
                    </div>

                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>2. Link TikTok mẫu (tùy chọn):</span>
                            <span className="text-[11px] text-slate-400">Trà My 24Zone</span>
                        </label>
                        <input
                            type="text"
                            value={cloneRefUrl}
                            onChange={(e) => setCloneRefUrl(e.target.value)}
                            placeholder="https://www.tiktok.com/@tra.my.24zone/video/..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none text-xs text-slate-800 font-mono transition-colors"
                        />
                    </div>

                    <div className="lg:col-span-3">
                        <button
                            type="button"
                            onClick={handleCloneStyle}
                            disabled={isAnalyzingClone || isSynthesizingVoice}
                            className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-none disabled:opacity-60 transition-colors cursor-pointer"
                        >
                            {isAnalyzingClone || isSynthesizingVoice ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                                    <span className="truncate">{analyzingStepText || "AI Đang Xử Lý..."}</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 text-amber-300" />
                                    <span>✨ AI Viết Kịch Bản & Thu Giọng</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick topic pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">Gợi ý chủ đề nhanh:</span>
                    {[
                        "Hàng khoai môn CVT container về buổi đêm date mới tinh",
                        "Bột phô mai BOYO 1kg cho quán khoai tây lắc",
                        "Da cá trứng muối & Bánh tráng Abi Snack giá sỉ",
                        "Chuyện kiểm hàng kho sỉ LYHU xuyên đêm kịp giao sáng mai"
                    ].map((topic, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setCloneTopic(topic)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 text-[11px] text-slate-600 border border-slate-200 transition-colors"
                        >
                            {topic}
                        </button>
                    ))}
                </div>

                {/* 3 Quick template style cards */}
                {isCloneModalOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {LYHU_TEMPLATES.map((tpl) => {
                            const isActive = activeTemplateId === tpl.id;
                            return (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => handleApplyTemplate(tpl)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        isActive
                                            ? "bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
                                            : "bg-slate-50/50 hover:bg-slate-100/70 border-slate-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-teal-800 flex items-center gap-1">
                                            {tpl.badge}
                                        </span>
                                        {isActive && (
                                            <span className="text-[10px] bg-teal-600 text-white px-2 py-0.2 rounded font-bold">
                                                ĐANG CHỌN
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-800 mb-0.5 line-clamp-1">
                                        {tpl.hookTitle}
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                        {tpl.title}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Controls & Setup (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                    {/* STUDIO WORKSPACE TAB NAVIGATION */}
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveStudioTab("copilot")}
                            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeStudioTab === "copilot"
                                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <Bot className="w-4 h-4 shrink-0" />
                            <span>Siêu Đạo Diễn AI</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${
                                activeStudioTab === "copilot" ? "bg-white/20 text-white" : "bg-teal-50 text-teal-700"
                            }`}>
                                Auto
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStudioTab("script")}
                            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeStudioTab === "script"
                                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span>Kịch Bản & Giọng AI</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${
                                activeStudioTab === "script" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                                Sync
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStudioTab("clips")}
                            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeStudioTab === "clips"
                                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <FileVideo className="w-4 h-4 shrink-0" />
                            <span>Góc Quay & Clip Thô</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeStudioTab === "clips" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                                {clips.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStudioTab("music")}
                            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeStudioTab === "music"
                                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <Music className="w-4 h-4 shrink-0" />
                            <span>Âm Thanh & Nhạc Trend</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeStudioTab === "music" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                            }`}>
                                🔥 Hot
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStudioTab("ai_superpowers")}
                            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeStudioTab === "ai_superpowers"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>Vũ Khí AI Đỉnh Cao</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeStudioTab === "ai_superpowers" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                            }`}>
                                ⚡ Pro
                            </span>
                        </button>
                    </div>

                    {/* TAB 1: SIÊU AI ĐẠO DIỄN COPILOT */}
                    {activeStudioTab === "copilot" && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
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
                                <button
                                    type="button"
                                    onClick={() => handleSendCopilotMessage("Em hãy tối ưu lại toàn bộ kịch bản và nhịp cắt cho video này để đạt chuẩn viral TikTok nhé!")}
                                    disabled={isCopilotThinking}
                                    className="px-3.5 py-2 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span>Tự Động Tối Ưu Video</span>
                                </button>
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

                    {/* TAB 3: VIDEO QUAY THÔ & TỈ LỆ KHUNG HÌNH */}
                    {activeStudioTab === "clips" && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <FileVideo className="w-4 h-4 text-teal-600" />
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
                                    {clips.map((c, idx) => {
                                        if (!c?.id) return null;
                                        return (
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
                                    );
                                })}
                                </div>
                            </div>
                        )}

                        {/* Pacing & Transitions */}
                        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-slate-700">Thời gian mỗi góc quay (Nhịp cắt):</label>
                                    <span className="font-mono text-teal-600 font-bold">{clipSwitchInterval}s / cảnh</span>
                                </div>
                                <input
                                    type="range"
                                    min={1.5}
                                    max={6}
                                    step={0.5}
                                    value={clipSwitchInterval}
                                    onChange={(e) => setClipSwitchInterval(parseFloat(e.target.value))}
                                    className="w-full accent-teal-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>1.5s (Dồn dập)</span>
                                    <span>2.5s (Chuẩn TikTok)</span>
                                    <span>5s (Chậm rãi)</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-semibold text-slate-700">Hiệu ứng chuyển cảnh:</label>
                                <select
                                    value={transitionEffect}
                                    onChange={(e) => setTransitionEffect(e.target.value as any)}
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none text-xs font-semibold"
                                >
                                    <option value="auto">✨ Tự động luân phiên (Khuyên dùng)</option>
                                    <option value="crossfade">🌫️ Mờ chồng (Crossfade - Mượt mà)</option>
                                    <option value="zoom_in">🔍 Zoom đẩy khung hình (Zoom Push - Hút mắt)</option>
                                    <option value="slide_left">➡️ Trượt ngang (Slide Left - Năng động)</option>
                                    <option value="white_flash">💥 Chớp sáng (White Flash - Nổi bật)</option>
                                    <option value="hard_cut">⚡ Cắt nhanh (Hard Cut - Chuẩn TikTok)</option>
                                </select>
                            </div>
                        </div>

                        {/* Video Color Grading Filters (LUT Presets) */}
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Bộ lọc màu Video (LUT Color Grading):</span>
                                </label>
                                <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                    {VIDEO_FILTERS.find(f => f.id === videoFilterPreset)?.name}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                {VIDEO_FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setVideoFilterPreset(f.id as any)}
                                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                                            videoFilterPreset === f.id
                                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                    >
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* TAB 2: KỊCH BẢN, GIỌNG ĐỌC AI & TYPOGRAPHY */}
                    {activeStudioTab === "script" && (
                    <div className="space-y-4">
                        {/* BƯỚC 2: KỊCH BẢN & GIỌNG ĐỌC AI ĐỒNG BỘ (100% KHỚP LỜI NÓI & CHỮ) */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-teal-600" />
                                2. Kịch bản & Giọng đọc AI đồng bộ (100% Khớp lời nói & Chữ)
                            </h2>
                            <div className="flex items-center gap-2">
                                {selectedVoiceAudioUrl ? (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Đã khớp tiếng & chữ ({voiceDuration.toFixed(1)}s)</span>
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                        <span>Chưa có giọng đọc</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick AI Script Generator Bar */}
                        <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-2">
                            <label className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                <span>Tạo kịch bản viral TikTok tự động theo sản phẩm LYHU:</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={cloneTopic}
                                    onChange={(e) => setCloneTopic(e.target.value)}
                                    placeholder="Ví dụ: Hàng khoai môn CVT container về buổi đêm date mới tinh..."
                                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-teal-200 bg-white focus:outline-none focus:border-teal-500 font-medium text-slate-800"
                                />
                                <button
                                    type="button"
                                    onClick={handleCloneStyle}
                                    disabled={isAnalyzingClone}
                                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                                >
                                    {isAnalyzingClone ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Đang tạo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-3.5 h-3.5" />
                                            <span>Tạo Kịch Bản</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tiêu đề Hook đập mắt 3.5s đầu */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white border border-amber-200/90 shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                    <span>🎯 Tiêu đề giật tít Hook ({hookDuration}s đầu để giữ chân TikTok):</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePreviewHookOnly}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                        title="Bấm để phát lại 3.5 giây đầu và xem hiệu ứng chữ Hook"
                                    >
                                        <Play className="w-3 h-3 fill-current" />
                                        <span>Xem thử Hook</span>
                                    </button>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showHookTitle}
                                            onChange={(e) => setShowHookTitle(e.target.checked)}
                                            className="accent-amber-600 rounded"
                                        />
                                        <span>Hiển thị</span>
                                    </label>
                                </div>
                            </div>

                            {showHookTitle && (
                                <>
                                    <div className="space-y-1">
                                        <textarea
                                            rows={2}
                                            value={customHookTitle}
                                            onChange={(e) => handleHookTitleChange(e.target.value)}
                                            placeholder="Nhập tiêu đề giật tít Hook 3s đầu, ví dụ: 🔥 CONTAINER KHOAI MÔN CVT VỀ ĐÊM DATE MỚI TINH!"
                                            className="w-full p-2.5 text-xs font-bold text-amber-950 bg-white border border-amber-300 rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none leading-relaxed transition-all shadow-inner"
                                        />
                                        <div className="flex items-center justify-between text-[10px] text-amber-700 font-medium">
                                            <span>💡 Nhập sửa trực tiếp ở đây — màn hình bên phải sẽ cập nhật ngay lập tức!</span>
                                            <span className="font-mono">{customHookTitle.length} ký tự • Tự động xuống dòng vừa khung 9:16</span>
                                        </div>
                                    </div>

                                    {/* Gợi ý giật tít nhanh */}
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Gợi ý giật tít bán lẻ / bán buôn (Nhấp chọn ăn liền):
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                "🔥 KHOAI MÔN SẤY CVT NGON GIÒN TẠI KHO LYHU!",
                                                "🌙 11H ĐÊM KHO SỈ LYHU VẪN ĐÓNG HÀNG!",
                                                "🧀 BỘT PHÔ MAI BOYO GIÁ SỈ TẬN XƯỞNG!",
                                                "🦀 THANH KHOAI MÔN TRỨNG CUA CÓ GÌ MÀ HOT?",
                                                "⚡ CẬP BẾN CONTAINER TOÀN DATE MỚI TINH!"
                                            ].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => handleHookTitleChange(preset)}
                                                    className="px-2 py-1 bg-white hover:bg-amber-100/70 border border-amber-200/90 rounded-lg text-[10px] font-semibold text-slate-700 hover:text-amber-950 transition-colors cursor-pointer text-left line-clamp-1"
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tùy chỉnh màu sắc banner & thời lượng */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold text-slate-600">Màu nền Banner:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setHookBannerTheme("red_orange")}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                                        hookBannerTheme === "red_orange"
                                                            ? "bg-red-600 text-white shadow-sm"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    Đỏ Cam TikTok
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHookBannerTheme("black_gold")}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                                        hookBannerTheme === "black_gold"
                                                            ? "bg-zinc-900 text-yellow-400 shadow-sm"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    Đen Viền Vàng
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHookBannerTheme("teal_lyhu")}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                                        hookBannerTheme === "teal_lyhu"
                                                            ? "bg-teal-600 text-white shadow-sm"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    Xanh LYHU
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-semibold text-slate-600">Thời lượng hiện:</span>
                                            <select
                                                value={hookDuration}
                                                onChange={(e) => setHookDuration(parseFloat(e.target.value))}
                                                className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[11px] font-bold text-amber-900 outline-none cursor-pointer"
                                            >
                                                <option value={3.0}>3.0 giây</option>
                                                <option value={3.5}>3.5 giây (Chuẩn)</option>
                                                <option value={4.0}>4.0 giây</option>
                                                <option value={5.0}>5.0 giây</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Lời thoại kịch bản AI (Hiển thị trực tiếp) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700">
                                    🎙️ Lời thoại kịch bản AI (Hiển thị phụ đề & Đọc thành tiếng):
                                </label>
                                <span className="text-[11px] text-gray-400 font-mono">
                                    {selectedVoiceText.split(/\s+/).filter(Boolean).length} từ • ~{Math.round(selectedVoiceText.split(/\s+/).filter(Boolean).length / 3.2)}s đọc
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                value={selectedVoiceText}
                                onChange={(e) => setSelectedVoiceText(e.target.value)}
                                placeholder="Nhập hoặc để AI tạo nội dung lời thoại kịch bản..."
                                className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none leading-relaxed text-gray-800 font-medium bg-slate-50/50 focus:bg-white transition-colors"
                            />
                            <p className="text-[11px] text-gray-400">
                                💡 Bạn có thể sửa lời thoại trực tiếp ở trên. Sau khi sửa, bấm <strong>"🎙️ Thu Lại Giọng Đọc AI"</strong> bên dưới để giọng nói khớp ngay lập tức!
                            </p>
                        </div>

                        {/* Bảng điều khiển Giọng đọc AI & Đồng bộ (Pure Flat LYHU Style) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Bộ máy giọng đọc */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-700">Công nghệ:</span>
                                        <select
                                            value={selectedVoiceEngine}
                                            onChange={(e) => setSelectedVoiceEngine(e.target.value as any)}
                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500"
                                        >
                                            <option value="gemini">✨ Gemini 3.8 Flash (Omni & Flow Speech AI)</option>
                                            <option value="elevenlabs">🧬 ElevenLabs (Giọng nhân bản AI)</option>
                                        </select>
                                    </div>

                                    {/* Nhân vật giọng đọc */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-700">Giọng:</span>
                                        <select
                                            value={selectedVoiceStyleId}
                                            onChange={async (e) => {
                                                const newStyle = e.target.value;
                                                setSelectedVoiceStyleId(newStyle);
                                                if (auditionAudioRef.current) {
                                                    auditionAudioRef.current.pause();
                                                }
                                                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                                    window.speechSynthesis.cancel();
                                                }
                                                setIsAuditionPlaying(false);
                                                // Tự động thu âm giọng đọc mới với Gemini 3.8 Flash và phát nghe thử
                                                if (selectedVoiceText && selectedVoiceText.trim()) {
                                                    const url = await generateSpeechForText(selectedVoiceText, newStyle, selectedVoiceEngine);
                                                    if (url && auditionAudioRef.current) {
                                                        auditionAudioRef.current.src = url;
                                                        auditionAudioRef.current.currentTime = 0;
                                                        auditionAudioRef.current.play().then(() => setIsAuditionPlaying(true)).catch(() => {});
                                                    }
                                                }
                                            }}
                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500"
                                        >
                                            <option value="female-genz">🌸 Nữ Gen Z (Kore - Vui tươi, chuẩn TikTok)</option>
                                            <option value="female-sweet">🎀 Nữ Dịu Dàng (Aoede - Ấm áp, tâm sự)</option>
                                            <option value="female-pro">💎 Nữ Chuyên Nghiệp (Leda - Tự tin, quảng cáo)</option>
                                            <option value="male-genz">⚡ Nam Gen Z (Puck - Năng động, trẻ trung)</option>
                                            <option value="male-pro">👔 Nam Chuyên Nghiệp (Fenrir - Trầm ấm, uy tín)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Microphone Live Recording */}
                                    {isRecordingMic ? (
                                        <button
                                            type="button"
                                            onClick={handleStopMicRecording}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
                                        >
                                            <Square className="w-3.5 h-3.5 fill-current" />
                                            <span>Dừng thu mic ({recordingSeconds}s)</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleStartMicRecording}
                                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs border border-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                            title="Tự thu giọng thật của bạn qua micro"
                                        >
                                            <Mic className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Thu Mic</span>
                                        </button>
                                    )}

                                    {/* Audition Button */}
                                    <button
                                        type="button"
                                        onClick={handleToggleAuditionVoice}
                                        disabled={isSynthesizingVoice}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                                            isAuditionPlaying
                                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                                        }`}
                                    >
                                        {isAuditionPlaying ? (
                                            <>
                                                <Pause className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Tạm dừng</span>
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                                                <span>Nghe thử</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Re-Synthesize Button */}
                                    <button
                                        type="button"
                                        onClick={() => generateSpeechForText(selectedVoiceText, selectedVoiceStyleId, selectedVoiceEngine)}
                                        disabled={isSynthesizingVoice}
                                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-none disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSynthesizingVoice ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Đang thu giọng...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Radio className="w-3.5 h-3.5" />
                                                <span>Thu Lại Giọng AI</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Upload MP3 Option */}
                                    <button
                                        type="button"
                                        onClick={() => audioInputRef.current?.click()}
                                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs border border-slate-200 font-medium"
                                        title="Nạp file âm thanh MP3 từ máy tính"
                                    >
                                        Tải MP3 từ máy
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
                        </div>

                        {/* Storyboard Guide (5 góc quay thực chiến tại kho LYHU) */}
                        {cloneStoryboard.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Gợi ý 5 góc quay bằng điện thoại (Quay mỗi đoạn 2.5s - 3s):</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyDirectorShotlist}
                                        className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" />
                                        <span>Copy gửi Zalo</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                    {cloneStoryboard.map((shot, idx) => (
                                        <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1">
                                            <div className="font-bold text-teal-700 text-[10px]">CẢNH {idx + 1}</div>
                                            <div className="text-slate-600 line-clamp-3 leading-snug">{shot}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

                            {/* Kinetic Typography Dropdown */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-gray-700 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Hiệu ứng chữ sáng tạo (Kinetic Typography):</span>
                                    </span>
                                    <span className="text-[10px] text-purple-600 font-bold">Chuẩn Viral TikTok</span>
                                </label>
                                <select
                                    value={textAnimationEffect}
                                    onChange={(e) => setTextAnimationEffect(e.target.value as any)}
                                    className="w-full p-2.5 border border-purple-200 rounded-lg bg-purple-50/40 outline-none text-xs font-bold text-purple-900 shadow-sm"
                                >
                                    <option value="tiktok_pop">🔥 Nảy chữ từng từ CapCut (TikTok Pop Bounce - Khuyên dùng)</option>
                                    <option value="karaoke_glow">🌟 Karaoke Neon Glow (Tô sáng & Chấm nhịp theo giọng đọc)</option>
                                    <option value="bicolor_punch">🎨 CapCut 2 Màu Tương Phản (Vàng Chanh + Trắng Sành Điệu)</option>
                                    <option value="fire_shake">⚡ Dynamic Slam & Shake (Đập dứt khoát & Rung năng lượng)</option>
                                    <option value="box_pill">🏷️ Gen Z Dark Badge (Hộp bo góc CapCut Pro viền vàng)</option>
                                    <option value="clean_fade">✨ Chữ nét căng viền đen dày (Classic Bold Stroke)</option>
                                </select>
                            </div>

                            {/* Power Words Highlight Tags */}
                            <div className="space-y-2 sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Từ khóa đắt giá (AI tự động gắn Badge & làm nổi bật chữ):</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleScanPowerWords}
                                        className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-lg transition-colors"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        <span>AI Quét Từ Khóa</span>
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {keyPowerWords.map((pw, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black flex items-center gap-1 shadow-sm"
                                        >
                                            <span>🔥 {pw}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Subtitle Sync Offset Slider & Quick Nudge Buttons */}
                            <div className="space-y-2 sm:col-span-2 p-3 rounded-xl bg-purple-50/40 border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-purple-900 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Khớp giọng đọc chính xác (Độ trễ phụ đề +/- Offset):</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                                            {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(2)}s` : `${subtitleOffset.toFixed(2)}s`}
                                        </span>
                                        {subtitleOffset !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSubtitleOffset(0)}
                                                className="text-[10px] text-purple-600 hover:underline font-semibold"
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
                                    className="w-full accent-purple-600"
                                />
                                <div className="flex items-center justify-between text-[10px] text-gray-400">
                                    <span>-2.0s (Chữ hiện sớm)</span>
                                    <span>0.0s (Chuẩn đồng bộ AI)</span>
                                    <span>+2.0s (Chữ hiện trễ)</span>
                                </div>
                                {/* Quick Nudge Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-purple-800 font-bold mr-1">Chỉnh nhanh:</span>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.max(-2, +(prev - 0.2).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện sớm hơn 0.2s"
                                    >
                                        -0.2s
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.max(-2, +(prev - 0.1).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện sớm hơn 0.1s"
                                    >
                                        -0.1s
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(0)}
                                        className="px-2.5 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700"
                                    >
                                        0s (Chuẩn AI)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.min(2, +(prev + 0.1).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện trễ hơn 0.1s"
                                    >
                                        +0.1s
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubtitleOffset(prev => Math.min(2, +(prev + 0.2).toFixed(2)))}
                                        className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                        title="Chữ hiện trễ hơn 0.2s"
                                    >
                                        +0.2s
                                    </button>
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
                        <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Tiêu đề giật tít Hook (Hiện ở {hookDuration}s đầu để giữ chân):</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePreviewHookOnly}
                                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                        <span>Xem thử Hook</span>
                                    </button>
                                    <input
                                        type="checkbox"
                                        checked={showHookTitle}
                                        onChange={(e) => setShowHookTitle(e.target.checked)}
                                        className="accent-amber-600 rounded"
                                    />
                                </div>
                            </div>
                            {showHookTitle && (
                                <div className="space-y-2">
                                    <textarea
                                        rows={2}
                                        value={customHookTitle}
                                        onChange={(e) => handleHookTitleChange(e.target.value)}
                                        placeholder="VD: 🔥 TỔNG KHO ĂN VẶT & BỘT PHÔ MAI BOYO GIÁ SỈ!"
                                        className="w-full p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg outline-none font-bold text-amber-950 text-xs focus:border-amber-500"
                                    />

                                    {/* 1-Click Viral Hook Presets */}
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-600" />
                                            <span>Gợi ý Hook Triệu View (Bấm để áp dụng ngay):</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {VIRAL_HOOK_PRESETS.map((v, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleHookTitleChange(v.text)}
                                                    className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                                                        customHookTitle === v.text
                                                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                                                            : "bg-white hover:bg-amber-50 text-slate-700 border-amber-200"
                                                    }`}
                                                >
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500">Màu banner:</span>
                                            <button
                                                type="button"
                                                onClick={() => setHookBannerTheme("red_orange")}
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hookBannerTheme === "red_orange" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
                                            >
                                                Đỏ Cam
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setHookBannerTheme("black_gold")}
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hookBannerTheme === "black_gold" ? "bg-zinc-900 text-yellow-400" : "bg-gray-100 text-gray-700"}`}
                                            >
                                                Đen Vàng
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setHookBannerTheme("teal_lyhu")}
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hookBannerTheme === "teal_lyhu" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
                                            >
                                                Xanh LYHU
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500">Thời lượng:</span>
                                            <select
                                                value={hookDuration}
                                                onChange={(e) => setHookDuration(parseFloat(e.target.value))}
                                                className="px-1.5 py-0.5 border border-gray-200 rounded text-[10px] font-bold"
                                            >
                                                <option value={3.0}>3.0s</option>
                                                <option value={3.5}>3.5s</option>
                                                <option value={4.0}>4.0s</option>
                                                <option value={5.0}>5.0s</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                    )}

                    {/* TAB 4: ÂM THANH & NHẠC NỀN VIDEO (TIKTOK DUAL-MODE) */}
                    {activeStudioTab === "music" && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Music className="w-4 h-4 text-teal-600" />
                                    <span>Âm thanh & Nhạc nền Video (2 Lựa chọn Chuyên Nghiệp)</span>
                                </h2>
                                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                                    {bgmMode === "ai_smart" ? "🤖 AI Tự Động Phối Nhạc" : "🔥 Radar Trend TikTok"}
                                </span>
                            </div>

                        {/* DUAL MODE SELECTOR BUTTONS */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setBgmMode("ai_smart")}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                                    bgmMode === "ai_smart"
                                        ? "border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm ring-1 ring-teal-500"
                                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                    <Wand2 className="w-4 h-4 text-teal-600" />
                                    <span>Lựa chọn A: AI Tự Phối Nhạc</span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                    AI quét nội dung kịch bản & tự chọn nhạc hợp mood
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setBgmMode("manual_trend")}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                                    bgmMode === "manual_trend"
                                        ? "border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm ring-1 ring-teal-500"
                                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                    <span>Lựa chọn B: Radar Trend TikTok</span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                    Bảng xếp hạng âm thanh viral & công cụ bóc tách nhạc
                                </span>
                            </button>
                        </div>

                        {/* SUB-SECTION 1: AI SMART SOUND MATCHING */}
                        {bgmMode === "ai_smart" && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 border border-teal-200/80 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                            <Bot className="w-4 h-4 text-teal-600" />
                                            <span>Thuật Toán AI Smart Sound Match:</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            AI tự động phân tích tâm trạng kịch bản hiện tại ({selectedVoiceText.length} ký tự), nhận diện các yếu tố: <em>kho hàng đêm, sỉ số lượng lớn, ẩm thực giòn rụm</em> để đề xuất bản nhạc giữ chân người xem tốt nhất.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAiMatchMusic}
                                        className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>Quét & Phối Nhạc Ngay</span>
                                    </button>
                                </div>

                                {/* Current Selected Track Preview */}
                                <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
                                            <Music className="w-4 h-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase">Đang áp dụng vào video:</div>
                                            <div className="text-xs font-bold text-slate-800 truncate">
                                                {BGM_PRESETS.find(b => b.id === bgmChoice)?.name || TIKTOK_TRENDING_SOUNDS.find(b => b.id === bgmChoice)?.title || bgmChoice}
                                            </div>
                                        </div>
                                    </div>
                                    <select
                                        value={bgmChoice}
                                        onChange={(e) => setBgmChoice(e.target.value)}
                                        className="p-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 outline-none max-w-[200px]"
                                    >
                                        {BGM_PRESETS.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                        {TIKTOK_TRENDING_SOUNDS.map(b => (
                                            <option key={b.id} value={b.id}>{b.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* SUB-SECTION 2: RADAR TREND TIKTOK & BÓC TÁCH LINK */}
                        {bgmMode === "manual_trend" && (
                            <div className="space-y-3">
                                {/* TOOL 1: EXTRACT SOUND FROM ANY TIKTOK URL */}
                                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 shadow-sm">
                                    <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            <span>Bóc tách âm thanh trực tiếp từ link TikTok:</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400">Trích xuất MP3</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={tiktokExtractUrl}
                                            onChange={(e) => setTiktokExtractUrl(e.target.value)}
                                            placeholder="Dán link TikTok (VD: https://www.tiktok.com/@tra.my.24zone/video/...)"
                                            className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleExtractTikTokSound()}
                                            disabled={isExtractingTikTokSound}
                                            className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs whitespace-nowrap flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                                        >
                                            {isExtractingTikTokSound ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Đang tách...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-3.5 h-3.5 fill-black" />
                                                    <span>Tách Nhạc</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* TOOL 2: RADAR TIKTOK TRENDING SOUNDS LIST */}
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-amber-500" />
                                            <span>Top Âm Thanh Đang Viral Cho Bán Hàng & Đồ Ăn Vặt:</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400">Nghe thử & Gắn nhanh</span>
                                    </div>

                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {TIKTOK_TRENDING_SOUNDS.map((sound) => {
                                            const isPlayingThis = previewingSoundUrl === sound.url;
                                            const isSelected = bgmChoice === sound.id;
                                            return (
                                                <div
                                                    key={sound.id}
                                                    className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                                        isSelected
                                                            ? "bg-teal-50 border-teal-500 text-teal-950 shadow-sm"
                                                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-800"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePreviewSound(sound.url)}
                                                            className={`p-2 rounded-full shrink-0 transition-colors ${
                                                                isPlayingThis
                                                                    ? "bg-teal-600 text-white animate-pulse"
                                                                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                                                            }`}
                                                            title={isPlayingThis ? "Tạm dừng" : "Nghe thử"}
                                                        >
                                                            {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                                                    {sound.tag}
                                                                </span>
                                                                <span className="font-semibold text-xs truncate text-slate-900">
                                                                    {sound.title}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 truncate">
                                                                {sound.useCase} • <span className="font-mono text-slate-400">{sound.duration}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopySoundTitle(sound.title)}
                                                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-[10px] font-medium text-slate-600 flex items-center gap-1 border border-slate-200"
                                                            title="Copy tên âm thanh để tìm trên ứng dụng TikTok"
                                                        >
                                                            {copiedSoundTitle === sound.title ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                            <span>{copiedSoundTitle === sound.title ? "Đã chép" : "Copy tên"}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApplyTikTokSound(sound)}
                                                            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                                                isSelected
                                                                    ? "bg-teal-600 text-white"
                                                                    : "bg-slate-200 hover:bg-teal-600 hover:text-white text-slate-800"
                                                            }`}
                                                        >
                                                            {isSelected ? "Đang chọn" : "+ Gắn vào video"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ALGORITHM PRO-TIP BANNER */}
                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-900 leading-relaxed">
                                    <strong>💡 Bí quyết đẩy Xu Hướng TikTok (Kênh Trà My 24Zone):</strong>
                                    <p className="mt-0.5 text-slate-700 text-[10px]">
                                        Nếu đăng lên TikTok, bạn nên chọn <strong>"🔇 Không dùng nhạc nền"</strong> trong Studio để xuất video sạch chỉ có giọng nói. Sau đó, khi đăng video trên điện thoại, bấm nút <strong>"Thêm âm thanh"</strong> của TikTok, dán tên bài hát vừa Copy ở trên, và chỉnh âm lượng nhạc còn 10-15%. Thuật toán TikTok sẽ đẩy video vào luồng xu hướng của bài hát đó và 100% không bị tắt tiếng bản quyền!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* BGM Volume Slider */}
                        {bgmChoice !== "none" && (
                            <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <label className="font-semibold text-slate-700">Âm lượng nhạc nền:</label>
                                    <span className="font-mono text-teal-600 font-bold">{Math.round(bgmVolume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0.05}
                                    max={0.5}
                                    step={0.02}
                                    value={bgmVolume}
                                    onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                                    className="w-full accent-teal-600"
                                />
                            </div>
                        )}

                        {/* Audio Ducking & Watermark */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enableAudioDucking}
                                    onChange={(e) => setEnableAudioDucking(e.target.checked)}
                                    className="accent-teal-600 rounded"
                                />
                                <span className="text-slate-700 font-medium">Tự động giảm nhạc nền khi có tiếng nói (Audio Ducking)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showWatermark}
                                    onChange={(e) => setShowWatermark(e.target.checked)}
                                    className="accent-teal-600 rounded"
                                />
                                <span className="text-slate-700 font-medium">Gắn logo LYHU! Tổng Kho Sỉ B2B</span>
                            </label>
                        </div>
                    </div>
                    )}

                    {/* TAB 5: VŨ KHÍ AI STUDIO ĐỈNH CAO THẾ GIỚI */}
                    {activeStudioTab === "ai_superpowers" && (
                        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-sm space-y-6">
                            {/* Pro Banner */}
                            <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Zap className="w-5 h-5 text-amber-300" />
                                        </span>
                                        <h2 className="font-black text-sm tracking-tight">Vũ Khí AI Studio Đỉnh Cao (Pro AI Superpowers)</h2>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                                            Pro CapCut & Runway AI
                                        </span>
                                    </div>
                                    <p className="text-xs text-purple-100 max-w-xl leading-relaxed">
                                        Bộ công cụ AI thế hệ mới: Kho B-Roll điện ảnh, Bộ âm thanh Foley SFX 0ms độ trễ, Huy hiệu livestream chốt đơn, và Trợ lý tối ưu giữ chân thuật toán TikTok & Reels.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleBoostVirality}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-900/30 whitespace-nowrap self-start sm:self-center transition-all transform active:scale-95 cursor-pointer"
                                >
                                    <Flame className="w-4 h-4 fill-slate-950" />
                                    <span>1-Click Lên 99 Điểm Xu Hướng</span>
                                </button>
                            </div>

                            {/* TOOL 1: 🎥 AI B-ROLL & CINEMATIC FOOTAGE LIBRARY */}
                            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Film className="w-4 h-4 text-purple-600" />
                                            <h3 className="font-bold text-xs text-slate-900">
                                                Kho B-Roll Điện Ảnh & Phóng Sự Kho Hàng B2B ({AI_BROLL_LIBRARY.length} Cảnh)
                                            </h3>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Clip độ phân giải cao chuẩn kho sỉ LYHU, xe container xuất hàng, và cận cảnh giòn rụm giúp giữ chân người xem.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGenerateAIBRoll}
                                        disabled={isGeneratingBRoll}
                                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer self-start sm:self-auto"
                                    >
                                        {isGeneratingBRoll ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>AI Đang Nạp Cảnh...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                                <span>+ Thêm Trọn Bộ B-Roll</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {AI_BROLL_LIBRARY.map((item) => {
                                        const isAlreadyAdded = clips.some(c => c.url === item.url);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 bg-white ${
                                                    isAlreadyAdded ? "border-purple-300 ring-1 ring-purple-200 shadow-sm" : "border-slate-200 hover:border-purple-200"
                                                }`}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                                            {item.tag}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {item.duration}s • HD
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                                                        {item.name}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={isAlreadyAdded}
                                                    onClick={() => {
                                                        const newClip: VideoClip = {
                                                            id: `broll_${Date.now()}_${item.id}`,
                                                            name: item.name,
                                                            url: item.url,
                                                            duration: item.duration,
                                                            width: item.width,
                                                            height: item.height,
                                                            muted: true
                                                        };
                                                        setClips(prev => [...prev, newClip]);
                                                    }}
                                                    className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                                                        isAlreadyAdded
                                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                            : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                                                    }`}
                                                >
                                                    {isAlreadyAdded ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-purple-600" />
                                                            <span>Đã Thêm Vào Dàn Cảnh</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5 text-purple-600" />
                                                            <span>Thêm Cảnh Này</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TOOL 2: 🔊 STUDIO SOUND DESIGN & FOLEY FX ENGINE */}
                            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 bg-slate-50/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Volume2 className="w-4 h-4 text-purple-600" />
                                            <h3 className="font-bold text-xs text-slate-900">
                                                Hệ Thống Hiệu Ứng Âm Thanh Foley (Web Audio 0ms Latency)
                                            </h3>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Bộ âm thanh Whoosh vút gió, Ding chuông giật mắt, Kaching keng tiền bán buôn. Tổng hợp tức thì không sợ lỗi tải file.
                                        </p>
                                    </div>

                                    {/* SFX Volume slider */}
                                    <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                                        <span className="font-bold text-slate-600">Âm lượng SFX:</span>
                                        <input
                                            type="range"
                                            min={0.1}
                                            max={0.8}
                                            step={0.05}
                                            value={sfxVolume}
                                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                                            className="w-20 accent-purple-600"
                                        />
                                        <span className="font-mono font-bold text-purple-700 w-8 text-right">
                                            {Math.round(sfxVolume * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                    {/* Foley 1: Whoosh */}
                                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <span>💨 Whoosh Chuyển Cảnh</span>
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={enableSfxWhoosh}
                                                    onChange={(e) => setEnableSfxWhoosh(e.target.checked)}
                                                    className="accent-purple-600 rounded cursor-pointer"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                Âm vút gió điện ảnh khớp mỗi lần nhảy góc quay 2.5s.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAuditionSfx("whoosh")}
                                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Volume2 className="w-3 h-3 text-purple-600" />
                                            <span>Nghe Thử</span>
                                        </button>
                                    </div>

                                    {/* Foley 2: Hook Ding */}
                                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <span>🔔 Ding Giật Mắt 0.3s</span>
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={enableSfxDing}
                                                    onChange={(e) => setEnableSfxDing(e.target.checked)}
                                                    className="accent-purple-600 rounded cursor-pointer"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                Chuông ngân pha lê ở 0.3s đầu giữ chân ngón tay lướt.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAuditionSfx("ding")}
                                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Volume2 className="w-3 h-3 text-purple-600" />
                                            <span>Nghe Thử</span>
                                        </button>
                                    </div>

                                    {/* Foley 3: Kaching */}
                                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <span>💰 Kaching Keng Tiền</span>
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={enableSfxKaching}
                                                    onChange={(e) => setEnableSfxKaching(e.target.checked)}
                                                    className="accent-purple-600 rounded cursor-pointer"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                Keng máy đếm tiền khi có từ khóa: LÃI, SỈ, GIÁ GỐC, FREESHIP.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAuditionSfx("kaching")}
                                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Volume2 className="w-3 h-3 text-purple-600" />
                                            <span>Nghe Thử</span>
                                        </button>
                                    </div>

                                    {/* Foley 4: Boom Bass Drop */}
                                    <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <span>💥 Boom Bass Drop</span>
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={enableSfxBoom}
                                                    onChange={(e) => setEnableSfxBoom(e.target.checked)}
                                                    className="accent-purple-600 rounded cursor-pointer"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                Trầm uy lực dằn xuống khi hé lộ bí mật nhập sỉ tận gốc.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAuditionSfx("boom")}
                                            className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Volume2 className="w-3 h-3 text-purple-600" />
                                            <span>Nghe Thử</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* TOOL 3: 🏷️ HUY HIỆU LIVESTREAM CHỐT ĐƠN & SALES CALLOUT STICKERS */}
                            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-purple-600" />
                                            <h3 className="font-bold text-xs text-slate-900">
                                                Huy Hiệu Chốt Đơn Trực Tiếp Trên Video (Live Sales Sticker)
                                            </h3>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Sticker động chớp nháy màu cam/vàng/đỏ chuẩn phong cách TikTok Shop, kích thích chủ quán bấm inbox ngay.
                                        </p>
                                    </div>

                                    {/* Position Selector */}
                                    <div className="flex items-center gap-1 text-[11px]">
                                        <span className="text-slate-500 font-medium">Vị trí:</span>
                                        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => setStickerPosition("top_right")}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                                    stickerPosition === "top_right" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                Trên Phải
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStickerPosition("top_left")}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                                    stickerPosition === "top_left" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                Trên Trái
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStickerPosition("bottom_right")}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                                    stickerPosition === "bottom_right" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                Dưới Phải
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                                    {[
                                        { id: "freeship", label: "🚚 FREESHIP TẬN QUÁN", sub: "Miễn phí ship", color: "border-amber-500 bg-amber-50 text-amber-900" },
                                        { id: "si_1_thung", label: "📦 SỈ TỪ 1 THÙNG", sub: "Giá gốc xưởng", color: "border-yellow-500 bg-yellow-50 text-yellow-900" },
                                        { id: "san_kho", label: "🏭 SẴN KHO 1000 THÙNG", sub: "Giao ngay 2h", color: "border-rose-500 bg-rose-50 text-rose-900" },
                                        { id: "lai_x2", label: "📈 LÃI GẤP ĐÔI", sub: "Bán chạy nhất", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
                                        { id: "inbox_cta", label: "💬 NHẬN MẪU THỬ", sub: "Thử miễn phí", color: "border-teal-500 bg-teal-50 text-teal-900" },
                                        { id: "none", label: "🚫 TẮT HUY HIỆU", sub: "Không gắn", color: "border-slate-300 bg-slate-50 text-slate-600" }
                                    ].map((stk) => {
                                        const isSelected = activeSalesSticker === stk.id;
                                        return (
                                            <button
                                                key={stk.id}
                                                type="button"
                                                onClick={() => setActiveSalesSticker(stk.id)}
                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? `${stk.color} ring-2 ring-purple-500 font-bold shadow-sm`
                                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                                }`}
                                            >
                                                <div className="text-[11px] font-bold line-clamp-1">{stk.label}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">{stk.sub}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TOOL 4: 📊 AI VIRALITY & RETENTION INSPECTOR */}
                            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 bg-slate-50/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                                    <div className="flex items-center gap-2">
                                        <Gauge className="w-4 h-4 text-purple-600" />
                                        <h3 className="font-bold text-xs text-slate-900">
                                            Bộ Máy Kiểm Tra Điểm Giữ Chân Thuật Toán (Virality & Retention Radar)
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        Tổng Điểm AI: {viralityScore.overall}/100 🌟
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                                        <div className="text-[11px] text-slate-500 font-medium">Hook 3.5s Đầu</div>
                                        <div className="text-xl font-black text-purple-700 mt-0.5">{viralityScore.hook}%</div>
                                        <div className="text-[9px] text-emerald-600 font-bold">Cực Kì Thu Hút</div>
                                    </div>

                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                                        <div className="text-[11px] text-slate-500 font-medium">Nhịp Cắt 2.5s</div>
                                        <div className="text-xl font-black text-teal-700 mt-0.5">{viralityScore.pacing}%</div>
                                        <div className="text-[9px] text-emerald-600 font-bold">Chuẩn Dopamine</div>
                                    </div>

                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                                        <div className="text-[11px] text-slate-500 font-medium">Tỷ Lệ Inbox Sỉ</div>
                                        <div className="text-xl font-black text-amber-600 mt-0.5">{viralityScore.conversion}%</div>
                                        <div className="text-[9px] text-amber-700 font-bold">Chốt Đơn Cao</div>
                                    </div>

                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                                        <div className="text-[11px] text-slate-500 font-medium">Dự Báo Lượt Xem</div>
                                        <div className="text-sm font-black text-slate-900 mt-1.5">{viralityScore.estimatedViews}</div>
                                        <div className="text-[9px] text-purple-600 font-bold">Thuật Toán Đẩy Xu Hướng</div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Gợi ý độc quyền từ AI Đạo Diễn:</span>
                                    </div>
                                    <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px]">
                                        {viralityScore.insights.map((insight, idx) => (
                                            <li key={idx} className="leading-relaxed">{insight}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* TOOL 5: ⚡ TURBO VOICE SPEED SELECTOR */}
                            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                        <h3 className="font-bold text-xs text-slate-900">
                                            Tốc Độ Đọc Turbo Pace (Chuẩn Nhịp Giữ Chân TikTok)
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono font-bold text-purple-700">
                                        Đang chọn: {voiceSpeedMultiplier}x
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {[
                                        { speed: 0.85, label: "0.85x", desc: "Chậm rãi, phóng sự sâu lắng" },
                                        { speed: 1.0, label: "1.0x (Chuẩn)", desc: "Tự nhiên, nhịp điệu gốc" },
                                        { speed: 1.15, label: "1.15x 🔥 TikTok", desc: "Tăng 35% tỷ lệ xem hết" },
                                        { speed: 1.25, label: "1.25x ⚡ Thần Tốc", desc: "Dồn dập xả kho chốt đơn" }
                                    ].map((item) => {
                                        const isSelected = voiceSpeedMultiplier === item.speed;
                                        return (
                                            <button
                                                key={item.speed}
                                                type="button"
                                                onClick={() => {
                                                    setVoiceSpeedMultiplier(item.speed);
                                                    if (hiddenAudioRef.current) {
                                                        hiddenAudioRef.current.playbackRate = item.speed;
                                                    }
                                                }}
                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-400 font-bold shadow-sm"
                                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                                }`}
                                            >
                                                <div className="text-xs font-bold">{item.label}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
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

            {/* MODAL 1: SỔ TAY KỊCH BẢN & LỊCH SỬ DỰ ÁN VIDEO (PERSISTENT STORE) */}
            {isProjectHistoryOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                    <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
                                    <FolderOpen className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">
                                        Sổ Tay Kịch Bản & Lịch Sử Dự Án Video
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Lưu trữ an toàn trên máy ({videoProjects.length} dự án) • Không bao giờ mất kịch bản khi F5!
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsProjectHistoryOpen(false)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Project List */}
                        <div className="overflow-y-auto p-4 sm:p-5 space-y-3 flex-1">
                            {videoProjects.length === 0 ? (
                                <div className="text-center py-12 space-y-3">
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <FolderOpen className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm text-gray-800">Chưa có dự án nào được lưu</p>
                                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                                            Khi bạn bấm "✨ AI Học Phong Cách & Cấu Hình Studio", "Lưu Dự Án" hoặc xuất video, kịch bản và bảng phân cảnh sẽ tự động lưu vào đây.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleManualSaveProject}
                                        className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
                                    >
                                        Lưu Kịch Bản Hiện Tại
                                    </button>
                                </div>
                            ) : (
                                videoProjects.map((proj) => (
                                    <div
                                        key={proj.id}
                                        onClick={() => handleLoadProject(proj)}
                                        className="p-4 rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white group space-y-2.5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
                                                    {proj.title}
                                                </span>
                                                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                                                    {proj.aspectRatio}
                                                </span>
                                                {proj.directorGuide?.shots?.length ? (
                                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                        <Clapperboard className="w-2.5 h-2.5" /> 5 Shot Đạo Diễn
                                                    </span>
                                                ) : null}
                                                {proj.renderedVideoUrl && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Có file video
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-gray-400">
                                                    {new Date(proj.createdAt).toLocaleDateString("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteProject(proj.id, e)}
                                                    className="p-1 text-gray-300 hover:text-red-600 transition-colors rounded-lg"
                                                    title="Xóa dự án"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            "{proj.script}"
                                        </p>

                                        <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-1">
                                            <div className="flex items-center gap-2">
                                                <span>Nhịp cắt: <strong>{proj.clipSwitchInterval}s</strong></span>
                                                <span>•</span>
                                                <span>Chữ: <strong className="capitalize">{proj.textAnimationEffect || "Pop"}</strong></span>
                                                <span>•</span>
                                                <span>Màu: <span className="inline-block w-3 h-3 rounded-full align-middle border border-gray-300" style={{ backgroundColor: proj.textColor }} /></span>
                                            </div>
                                            <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-1">
                                                Nhấn để dựng lại dự án này →
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleManualSaveProject}
                                disabled={isSavingProject}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <Save className="w-3.5 h-3.5 text-amber-400" />
                                <span>Lưu kịch bản đang mở</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsProjectHistoryOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: BẢNG PHÂN CẢNH & CHỈ ĐẠO QUAY CỦA ĐẠO DIỄN AI (DIRECTOR'S SCRIPTBOOK) */}
            {isDirectorHubOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                    <div className="max-w-4xl w-full bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-amber-500/40 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/60">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-md">
                                    <Clapperboard className="w-6 h-6" />
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white text-base sm:text-lg">
                                            Bảng Phân Cảnh & Chỉ Đạo Quay Của Đạo Diễn AI
                                        </h3>
                                        <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded font-black tracking-wide">
                                            24ZONE STYLE
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-200/80">
                                        Chỉ đạo đội quay Smartphone tại kho LYHU • 5 góc quay nhịp 2.5s Jump-cut • Giữ chân người xem 100%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyDirectorShotlist}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold text-xs rounded-xl hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Gửi Zalo</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDirectorHubOpen(false)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs">
                            {/* Hook Section (3s đầu quyết định ăn đề xuất) */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-amber-400 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        <span>QUY TẮC 3 GIÂY ĐẦU (VISUAL & SPOKEN HOOK ĐẬP MẮT):</span>
                                    </div>
                                    <span className="text-[10px] text-amber-300 font-mono">Giữ chân 70%+ người xem</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                                        <div className="text-[11px] font-bold text-amber-300">🎯 Hình ảnh đập mắt (Visual Hook):</div>
                                        <div className="text-gray-200 leading-relaxed">
                                            {directorGuide?.hookVisual || "Cận cảnh mở bao/thùng hàng, hoặc hành động xé bọc, đổ sản phẩm giòn rụm ngay 1 giây đầu."}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                                        <div className="text-[11px] font-bold text-amber-300">🎙️ Câu thoại mở màn (Spoken Hook):</div>
                                        <div className="text-gray-200 italic leading-relaxed">
                                            "{directorGuide?.spokenHook || customHookTitle || "Hàng mới về đêm qua date mới tinh, đừng vội mua chỗ khác!"}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5-Shot Storyboard Grid */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-amber-400" />
                                        <span>BẢNG 5 GÓC MÁY QUAY BẰNG ĐIỆN THOẠI (Quay mỗi đoạn 2.5 - 3s):</span>
                                    </h4>
                                    <span className="text-[11px] text-gray-400 font-mono">Nhịp cắt: {directorGuide?.pacingSpeed || `${clipSwitchInterval}s`}</span>
                                </div>

                                <div className="space-y-3">
                                    {directorGuide && directorGuide.shots && directorGuide.shots.length > 0 ? (
                                        directorGuide.shots.map((shot) => (
                                            <div
                                                key={shot.shotNumber}
                                                className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition-colors space-y-2"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black text-xs">
                                                            CẢNH {shot.shotNumber}
                                                        </span>
                                                        <span className="font-bold text-white">
                                                            [{shot.shotType}]
                                                        </span>
                                                        <span className="text-gray-400 text-[11px]">
                                                            • Chuyển động: <strong className="text-amber-300">{shot.cameraMovement}</strong>
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                                                        Âm thanh: {shot.sfx}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                    <div className="p-2 rounded bg-black/30 border border-white/5">
                                                        <span className="text-gray-400 font-semibold">🎬 Thao tác nhân sự kho: </span>
                                                        <span className="text-gray-200">{shot.action}</span>
                                                    </div>
                                                    <div className="p-2 rounded bg-black/30 border border-white/5">
                                                        <span className="text-gray-400 font-semibold">🎙️ Lời thoại khớp hình: </span>
                                                        <span className="text-amber-200 italic">"{shot.dialogueSnippet}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        /* Default 5 shots for LYHU warehouse operations */
                                        [
                                            {
                                                shotNumber: 1,
                                                shotType: "Cận Cảnh (Close-up)",
                                                cameraMovement: "Zoom in từ từ",
                                                action: "Tay xé seal thùng hàng hoặc bẻ đôi củ khoai môn / xé gói snack giòn rụm trước ống kính.",
                                                dialogueSnippet: customHookTitle || "Hàng mới về đêm qua date mới tinh...",
                                                sfx: "Tiếng xé bọc / giòn rụm 'Rắc'"
                                            },
                                            {
                                                shotNumber: 2,
                                                shotType: "Toàn Cảnh (Wide)",
                                                cameraMovement: "Lia máy ngang (Pan)",
                                                action: "Quay container hoặc các kệ pallet hàng chất cao ngập lối tại tổng kho LYHU.",
                                                dialogueSnippet: "Container vừa đáp kho lúc nửa đêm, nguyên đai nguyên kiện...",
                                                sfx: "Tiếng còi xe nâng / tiếng kho rộn ràng"
                                            },
                                            {
                                                shotNumber: 3,
                                                shotType: "Cực Cận (Macro)",
                                                cameraMovement: "Cố định (Static)",
                                                action: "Soi rõ nhãn mác NSX, HSD mới tinh năm 2026, màu sắc tươi ngon không vụn vỡ.",
                                                dialogueSnippet: "Hàng date mới toanh, chất lượng bao test từng kiện...",
                                                sfx: "Tiếng sột soạt kiểm hàng"
                                            },
                                            {
                                                shotNumber: 4,
                                                shotType: "Trung Cảnh (Medium)",
                                                cameraMovement: "Góc thấp hất lên (Low Angle)",
                                                action: "Nhân sự dán băng keo niêm phong thùng LYHU, xếp lên xe chuyển phát nhanh giao sỉ.",
                                                dialogueSnippet: "Anh em NPP lấy bao nhiêu kiện cứ chốt số lượng là đi ngay trong ngày...",
                                                sfx: "Tiếng kéo băng dính 'Rẹt rẹt'"
                                            },
                                            {
                                                shotNumber: 5,
                                                shotType: "Cận Cảnh (Call to action)",
                                                cameraMovement: "Chĩa thẳng sản phẩm",
                                                action: "Giơ sản phẩm về phía người xem, vẫy tay hoặc chỉ vào phần nhắn tin nhận bảng giá sỉ.",
                                                dialogueSnippet: "Nhắn liền LYHU để nhận mẫu thử & giá sỉ tận gốc nha cả nhà!",
                                                sfx: "Tiếng ting ting chốt đơn"
                                            }
                                        ].map((shot) => (
                                            <div
                                                key={shot.shotNumber}
                                                className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition-colors space-y-2"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black text-xs">
                                                            CẢNH {shot.shotNumber}
                                                        </span>
                                                        <span className="font-bold text-white">
                                                            [{shot.shotType}]
                                                        </span>
                                                        <span className="text-gray-400 text-[11px]">
                                                            • Chuyển động: <strong className="text-amber-300">{shot.cameraMovement}</strong>
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                                                        Âm thanh: {shot.sfx}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                    <div className="p-2 rounded bg-black/30 border border-white/5">
                                                        <span className="text-gray-400 font-semibold">🎬 Thao tác nhân sự kho: </span>
                                                        <span className="text-gray-200">{shot.action}</span>
                                                    </div>
                                                    <div className="p-2 rounded bg-black/30 border border-white/5">
                                                        <span className="text-gray-400 font-semibold">🎙️ Lời thoại khớp hình: </span>
                                                        <span className="text-amber-200 italic">"{shot.dialogueSnippet}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Practical Shooting Tips for LYHU Staff */}
                            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/30 space-y-2">
                                <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span>3 MẸO QUAY THỰC CHIẾN BẰNG SMARTPHONE TẠI TỔNG KHO LYHU:</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                        <div className="font-bold text-white text-[11px]">1. Lau sạch camera & Quay dọc 9:16</div>
                                        <p className="text-gray-300 text-[10px] leading-relaxed">
                                            Dùng camera sau, lau sạch mồ hôi/bụi trên kính máy. Luôn quay dọc khung hình 9:16 để video TikTok nét nhất.
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                        <div className="font-bold text-white text-[11px]">2. Quay cận cảnh 30-50cm & Chạm lấy nét</div>
                                        <p className="text-gray-300 text-[10px] leading-relaxed">
                                            Đưa camera gần sản phẩm để thấy rõ thớ khoai môn hoặc date in trên thùng. Giữ tay chắc không run.
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                        <div className="font-bold text-white text-[11px]">3. Bấm quay 3 giây rồi đổi góc</div>
                                        <p className="text-gray-300 text-[10px] leading-relaxed">
                                            Không cần lia máy dài dòng! Cứ quay mỗi góc 3s, nạp vào Studio này AI sẽ tự động Jump-cut cắt nhịp 2.5s chuẩn TikTok.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="p-3.5 rounded-xl bg-slate-800 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <span className="text-[11px] text-gray-400 font-semibold block">LỜI KÊU GỌI HÀNH ĐỘNG (CTA KẾT VIDEO):</span>
                                    <span className="text-xs font-bold text-amber-300">
                                        {directorGuide?.callToAction || "Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ!"}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyDirectorShotlist}
                                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Gửi Zalo Cho Đội Quay</span>
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                                💡 Sau khi quay xong các clip, nạp vào <strong>Bước 1</strong> để Studio tự động cắt ghép!
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsDirectorHubOpen(false)}
                                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                                Đã Hiểu & Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
