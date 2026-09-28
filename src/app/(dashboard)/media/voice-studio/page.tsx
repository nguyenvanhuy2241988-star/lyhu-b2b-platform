"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    Mic, 
    Play, 
    Pause, 
    Download, 
    Sparkles, 
    Volume2, 
    RotateCcw, 
    Copy, 
    Check, 
    FileText, 
    Sliders, 
    Headphones, 
    Film,
    Flame,
    Zap,
    Clock,
    AlertCircle,
    Upload,
    Radio,
    Sparkle,
    Smile,
    Heart,
    UserCheck,
    Dna,
    Wand2,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";

interface VoiceStyleOption {
    id: string;
    name: string;
    gender: "female" | "male";
    category: "genz" | "sweet" | "energetic" | "news" | "male_genz";
    description: string;
    tag: string;
    avatar: string;
    pitchVal: number;       // Web Speech API pitch (0.5 to 2.0, default 1.0)
    pitchStr: string;       // Server pitch string (+15Hz, +20%, etc.)
    recommendedSpeed: number; // e.g. 1.15
    color: string;
    border: string;
}

const VOICE_STYLES: VoiceStyleOption[] = [
    {
        id: "female-genz",
        name: "Nữ Gen Z Bắt Trend",
        gender: "female",
        category: "genz",
        description: "Giọng nữ tươi vui, nhí nhảnh, nhịp điệu cuốn hút chuẩn TikTok Vlogger.",
        tag: "Khuyên dùng: TikTok, Review bánh kẹo Sa Giang, Đồ ăn vặt, Video ngắn",
        avatar: "🎀",
        pitchVal: 1.25,        // Cao độ thanh thoát, trẻ trung
        pitchStr: "+20Hz",
        recommendedSpeed: 1.15,
        color: "from-pink-500/10 to-purple-500/10 text-pink-700",
        border: "border-pink-300"
    },
    {
        id: "female-sweet",
        name: "Nữ Ngọt Ngào & Tình Cảm",
        gender: "female",
        category: "sweet",
        description: "Giọng nhẹ nhàng, nịnh tai, chia sẻ chân thành, tâm sự gần gũi.",
        tag: "Khuyên dùng: Review làm đẹp, Ẩm thực gia đình, Mẹo vặt siêu thị",
        avatar: "🍬",
        pitchVal: 1.12,
        pitchStr: "+10Hz",
        recommendedSpeed: 1.05,
        color: "from-rose-500/10 to-orange-500/10 text-rose-700",
        border: "border-rose-300"
    },
    {
        id: "female-sales",
        name: "Nữ Năng Động Bán Hàng",
        gender: "female",
        category: "energetic",
        description: "Hào hứng, dứt khoát, kêu gọi hành động, tạo cảm giác khan hiếm và ưu đãi.",
        tag: "Khuyên dùng: Chào sỉ đại lý, Giới thiệu khuyến mãi lớn, Xả kho",
        avatar: "⚡",
        pitchVal: 1.15,
        pitchStr: "+12Hz",
        recommendedSpeed: 1.15,
        color: "from-amber-500/10 to-yellow-500/10 text-amber-700",
        border: "border-amber-300"
    },
    {
        id: "male-genz",
        name: "Nam Gen Z Năng Động",
        gender: "male",
        category: "male_genz",
        description: "Giọng nam trẻ trung, vui vẻ, thân thiện như bạn bè đang trò chuyện.",
        tag: "Khuyên dùng: Video trải nghiệm thực tế, Ăn thử món ngon, Hậu trường xưởng",
        avatar: "🧢",
        pitchVal: 1.05,
        pitchStr: "+6Hz",
        recommendedSpeed: 1.15,
        color: "from-sky-500/10 to-indigo-500/10 text-sky-700",
        border: "border-sky-300"
    },
    {
        id: "female-news",
        name: "Nữ MC Thời Sự Chuẩn Đài",
        gender: "female",
        category: "news",
        description: "Đĩnh đạc, rõ từng âm tiết, chuẩn mực biên tập viên truyền hình.",
        tag: "Khuyên dùng: Tin tức doanh nghiệp, Báo cáo thành tựu, Pháp lý",
        avatar: "🎙️",
        pitchVal: 0.98,
        pitchStr: "+0Hz",
        recommendedSpeed: 1.0,
        color: "from-slate-500/10 to-gray-500/10 text-slate-700",
        border: "border-slate-300"
    },
    {
        id: "male-pro",
        name: "Nam Trầm Ấm Chuyên Nghiệp",
        gender: "male",
        category: "news",
        description: "Trầm dày, nam tính, uy tín và đáng tin cậy. Phù hợp phim doanh nghiệp, phóng sự.",
        tag: "Khuyên dùng: Phim giới thiệu công ty LYHU, Phóng sự xưởng sản xuất",
        avatar: "👨‍💼",
        pitchVal: 0.90,
        pitchStr: "-5Hz",
        recommendedSpeed: 1.0,
        color: "from-blue-500/10 to-cyan-500/10 text-blue-700",
        border: "border-blue-300"
    },
    {
        id: "female-pro",
        name: "Nữ Chuyên Nghiệp & Tự Tin",
        gender: "female",
        category: "energetic",
        description: "Giọng nữ chuyên nghiệp, rõ ràng, tự tin. Phù hợp video giới thiệu sản phẩm và quảng cáo.",
        tag: "Khuyên dùng: Video quảng cáo, Giới thiệu sản phẩm, Landing page",
        avatar: "💎",
        pitchVal: 1.0,
        pitchStr: "+0Hz",
        recommendedSpeed: 1.05,
        color: "from-violet-500/10 to-fuchsia-500/10 text-violet-700",
        border: "border-violet-300"
    }
];

const SAMPLE_SCRIPTS = [
    {
        title: "Kịch bản 1: Giới thiệu Bánh phồng tôm Sa Giang (TikTok Review)",
        text: "Mở gói bánh phồng tôm Sa Giang vuông thượng hạng này ra là thấy thơm nức mũi luôn cả nhà ơi! Miếng bánh giòn tan rụm rụm, vị tôm ngọt đậm đà tự nhiên chứ không hề bị ngấy dầu nha. Chuẩn món ăn vặt quốc dân cho cả gia đình, nhâm nhi xem phim hay làm mồi nhậu thì hết nước chấm! Khách sỉ và siêu thị mini liên hệ LYHU ngay để nhận giá tận xưởng cực sốc nhé!"
    },
    {
        title: "Kịch bản 2: Chào hàng sỉ Siêu thị mini & Đại lý",
        text: "Chào các anh chị chủ siêu thị mini và đại lý tạp hóa trên toàn quốc! Tổng kho phân phối sỉ LYHU đang triển khai chương trình đồng hành cùng điểm bán mới: Chiết khấu cực cao, đơn thử nghiệm chỉ từ 2 triệu đồng, hỗ trợ 100% đổi trả nếu cận date và miễn phí giao hàng tận nơi. Nhấn liên hệ hoặc nhắn Zalo ngay để nhận bảng giá sỉ chi tiết nhé!"
    },
    {
        title: "Kịch bản 3: Hàng về xưởng ngập kho LYHU",
        text: "Hàng mới về ngập kho xưởng LYHU hôm nay rồi các bác ơi! Đầy đủ các mã hàng tiêu dùng, bánh kẹo và nông sản sấy đặc sản phục vụ mùa cao điểm. Đóng gói chuẩn chỉ từng kiện, hạn sử dụng mới tinh tươm. Bác nào cần nguồn hàng chất lượng, pháp lý VAT đầy đủ thì liên hệ bên em ngay trong hôm nay nhé!"
    }
];

export default function VoiceStudioPage() {
    const [activeTab, setActiveTab] = useState<"tts" | "cloning">("tts");

    // TTS Form state
    const [text, setText] = useState("");
    const [selectedStyleId, setSelectedStyleId] = useState("female-genz");
    const [speedRate, setSpeedRate] = useState<number>(1.15); // Slider: 0.75x to 1.5x

    // Output & Playback state
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);

    // Voice Cloning state
    const [cloningFile, setCloningFile] = useState<File | null>(null);
    const [cloningVoiceName, setCloningVoiceName] = useState("Giọng Chị Nhà (Chính Chủ)");
    const [cloningStatus, setCloningStatus] = useState<"idle" | "uploading" | "ready">("idle");
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const selectedStyle = VOICE_STYLES.find(s => s.id === selectedStyleId) || VOICE_STYLES[0];

    // Clean up audio URL
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    // Apply speed changes to audio player
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speedRate;
        }
    }, [speedRate, audioUrl]);

    // Word count & estimated duration
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const estimatedSeconds = Math.round(wordCount / (2.5 * speedRate));

    // Instant Browser Speech Preview with selected style & speed
    const speakWithBrowser = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        
        if (isBrowserSpeaking) {
            window.speechSynthesis.cancel();
            setIsBrowserSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();

        // 1. Chuẩn hóa ngữ âm: LYHU -> Ly Hu, cận date -> cận hạn sử dụng...
        const phoneticText = normalizeVietnamesePhonetics(text.trim());
        const utterance = new SpeechSynthesisUtterance(phoneticText);
        utterance.lang = "vi-VN";
        utterance.rate = speedRate;
        utterance.pitch = selectedStyle.pitchVal;

        const isFemale = selectedStyle.gender === "female";
        const allVoices = window.speechSynthesis.getVoices();
        const viVoices = allVoices.filter(v => 
            v.lang.toLowerCase().startsWith("vi") || 
            v.lang.toLowerCase().includes("vn") || 
            v.name.toLowerCase().includes("vietnamese")
        );

        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (isFemale) {
            chosenVoice = viVoices.find(v => {
                const n = v.name.toLowerCase();
                return n.includes("hoaimy") || n.includes("female") || n.includes("google") || n.includes("linh") || (n.includes("natural") && !n.includes("namminh"));
            }) || viVoices.find(v => {
                const n = v.name.toLowerCase();
                return !n.includes("nam") && !n.includes("an") && !n.includes("male");
            });
        } else {
            chosenVoice = viVoices.find(v => {
                const n = v.name.toLowerCase();
                return n.includes("namminh") || n.includes("male") || n.includes("an") || n.includes("nam");
            });
        }

        if (!chosenVoice && viVoices.length > 0) {
            chosenVoice = viVoices[0];
        }

        if (chosenVoice) {
            utterance.voice = chosenVoice;
        }

        utterance.onend = () => setIsBrowserSpeaking(false);
        utterance.onerror = () => setIsBrowserSpeaking(false);

        setIsBrowserSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    // Generate MP3 File via Server
    const handleGenerateVoice = async () => {
        if (!text.trim()) {
            setErrorMessage("Vui lòng nhập lời thoại hoặc kịch bản cần lồng tiếng.");
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const phoneticText = normalizeVietnamesePhonetics(text.trim());

            // Convert speedRate to percentage string
            const speedPercentNum = Math.round((speedRate - 1.0) * 100);
            const rateStr = speedPercentNum >= 0 ? `+${speedPercentNum}%` : `${speedPercentNum}%`;

            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: phoneticText,
                    voice: selectedStyle.gender === "female" ? "vi-VN-HoaiMyNeural" : "vi-VN-NamMinhNeural",
                    style: selectedStyle.id,
                    rate: rateStr,
                    pitch: selectedStyle.pitchStr
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Lỗi máy chủ (${res.status}). Vui lòng thử lại.`);
            }

            const blob = await res.blob();
            if (blob.size < 100) {
                throw new Error("Dữ liệu âm thanh không hợp lệ. Vui lòng thử lại.");
            }

            if (audioUrl) URL.revokeObjectURL(audioUrl);

            const newUrl = URL.createObjectURL(blob);
            setAudioUrl(newUrl);

            // Auto play preview
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.playbackRate = speedRate;
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                }
            }, 100);

        } catch (err: any) {
            console.error("TTS Error:", err);
            setErrorMessage(err.message || "Có lỗi xảy ra khi tạo giọng đọc.");
        } finally {
            setLoading(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        const a = document.createElement("a");
        a.href = audioUrl;
        const styleName = selectedStyle.id;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `voiceover_LYHU_${styleName}_${speedRate}x_${dateStr}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const copyText = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs)) return "00:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Voice Cloning Mock Handlers
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCloningFile(file);
            setCloningStatus("ready");
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            setCloningStatus("ready");
        } else {
            setIsRecording(true);
            setRecordingSeconds(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-teal-50 text-[#00AFA9]">
                            <Mic className="w-6 h-6" />
                        </span>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Studio Lồng Tiếng AI (Text to Voice)
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Sparkle className="w-3 h-3" /> Gen Z & TikTok Edition
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 pl-11">
                        Tùy chọn đa chất giọng Gen Z trẻ trung, thanh trượt tốc độ kéo thả → Xuất MP3 ghép CapCut không cần tự thu âm!
                    </p>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setActiveTab("tts")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === "tts"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Wand2 className="w-3.5 h-3.5 text-[#00AFA9]" />
                        Studio Giọng Đọc AI
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("cloning")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === "cloning"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Dna className="w-3.5 h-3.5 text-purple-600" />
                        Nhân Bản Giọng Nói Thật
                        <span className="px-1.5 py-0.2 text-[10px] bg-purple-100 text-purple-700 rounded-full font-bold">
                            Mới
                        </span>
                    </button>
                </div>
            </div>

            {/* TAB 1: STUDIO TEXT TO SPEECH */}
            {activeTab === "tts" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Input & Configurations (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                        {/* Voice Style Selection */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Smile className="w-4 h-4 text-[#00AFA9]" />
                                    1. Chọn Phong cách & Chất giọng (Trẻ trung / Gen Z / Bán hàng)
                                </label>
                                <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                                    {selectedStyle.name}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {VOICE_STYLES.map((v) => {
                                    const isSelected = selectedStyleId === v.id;
                                    return (
                                        <div
                                            key={v.id}
                                            onClick={() => {
                                                setSelectedStyleId(v.id);
                                                setSpeedRate(v.recommendedSpeed);
                                            }}
                                            className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all relative ${
                                                isSelected 
                                                    ? `border-[#00AFA9] bg-teal-50/20 shadow-sm ring-2 ring-[#00AFA9]/20` 
                                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <span className="text-2xl">{v.avatar}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-bold text-gray-900 text-sm">
                                                            {v.name}
                                                        </h3>
                                                        {isSelected && (
                                                            <span className="w-2.5 h-2.5 rounded-full bg-[#00AFA9]" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {v.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-[#00AFA9] truncate">
                                                    {v.tag.split(":")[0]}
                                                </span>
                                                <span className="text-gray-400 text-[10px]">
                                                    {v.recommendedSpeed}x
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Drag-and-Drop Speed Slider */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-[#00AFA9]" />
                                    2. Tốc độ nói (Kéo thả thanh trượt)
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-[#00AFA9] border border-teal-200 text-sm">
                                        {speedRate.toFixed(2)}x
                                    </span>
                                </div>
                            </div>

                            {/* Interactive Slider up to 2.5x */}
                            <div className="space-y-2 pt-2">
                                <input
                                    type="range"
                                    min="0.50"
                                    max="2.50"
                                    step="0.05"
                                    value={speedRate}
                                    onChange={(e) => setSpeedRate(parseFloat(e.target.value))}
                                    className="w-full accent-[#00AFA9] h-2 bg-gray-200 rounded-lg cursor-pointer"
                                />

                                {/* Ruler / Markers */}
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-400 font-mono pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(0.80)}
                                        className={`hover:text-[#00AFA9] ${speedRate === 0.80 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        0.8x
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(1.0)}
                                        className={`hover:text-[#00AFA9] ${speedRate === 1.0 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        1.0x (Chuẩn)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(1.15)}
                                        className={`flex items-center gap-0.5 hover:text-[#00AFA9] ${speedRate === 1.15 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        <Flame className="w-3 h-3 text-amber-500" />
                                        1.15x (TikTok)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(1.35)}
                                        className={`hover:text-[#00AFA9] ${speedRate === 1.35 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        1.35x (Nhanh)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(1.60)}
                                        className={`hover:text-[#00AFA9] ${speedRate === 1.60 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        1.60x (Siêu tốc)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(2.00)}
                                        className={`hover:text-[#00AFA9] ${speedRate === 2.00 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        2.0x (Gấp đôi)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpeedRate(2.50)}
                                        className={`hover:text-[#00AFA9] ${speedRate === 2.50 ? "text-[#00AFA9] font-bold underline" : ""}`}
                                    >
                                        2.5x (Max)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Text Editor Box */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#00AFA9]" />
                                    3. Lời thoại / Kịch bản lồng tiếng
                                </label>

                                <div className="flex items-center gap-2">
                                    {text && (
                                        <button
                                            type="button"
                                            onClick={() => setText("")}
                                            className="px-2.5 py-1 text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                        >
                                            Xóa hết
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Sample Scripts */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
                                <span className="text-gray-400 whitespace-nowrap">Mẫu nhanh:</span>
                                {SAMPLE_SCRIPTS.map((s, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setText(s.text)}
                                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-[#00AFA9] text-gray-600 whitespace-nowrap transition-colors border border-transparent hover:border-teal-200"
                                    >
                                        {s.title.split(":")[0]}
                                    </button>
                                ))}
                            </div>

                            {/* Textarea */}
                            <div className="relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={7}
                                    placeholder="Nhập hoặc dán lời thoại kịch bản video vào đây... Tên thương hiệu LYHU sẽ được tự động phát âm chuẩn là 'Ly Hu' tự nhiên!"
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#00AFA9] focus:ring-2 focus:ring-[#00AFA9]/20 outline-none text-gray-800 text-sm leading-relaxed transition-all resize-y placeholder:text-gray-400"
                                />
                            </div>

                            {/* Metrics & Cost Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 pt-1 gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span>{text.length} ký tự</span>
                                    <span>•</span>
                                    <span>{wordCount} từ</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-[#00AFA9] font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        Video: ~{estimatedSeconds}s
                                    </span>
                                    <span>•</span>
                                    {/* Cost Estimation Badge */}
                                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200" title="Chi phí Gemini API tính theo token audio output ($9/1M tokens). Rất rẻ!">
                                        💰 Ước tính: ~{Math.max(15, Math.round(wordCount * 0.25))}đ
                                        <span className="text-[10px] text-emerald-600">(~0.001$)</span>
                                    </span>
                                </div>

                                {text && (
                                    <button
                                        type="button"
                                        onClick={copyText}
                                        className="text-gray-400 hover:text-gray-600 flex items-center gap-1 self-end sm:self-auto"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Đã chép" : "Chép lời thoại"}
                                    </button>
                                )}
                            </div>

                            {/* Error Alert */}
                            {errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleGenerateVoice}
                                    disabled={loading || !text.trim()}
                                    className="flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-[#00AFA9] hover:bg-[#009690] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Đang tạo giọng đọc AI (Gemini Studio)...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>TẠO FILE AUDIO & NGHE THỬ (GEMINI AI)</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={speakWithBrowser}
                                    disabled={!text.trim()}
                                    className={`py-3.5 px-4 rounded-xl font-semibold border transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                                        isBrowserSpeaking 
                                            ? "bg-amber-500 text-white border-amber-600 animate-pulse shadow-md" 
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                    title="Nghe bằng giọng mặc định trên máy tính (chất lượng thấp hơn file AI thật)"
                                >
                                    <Volume2 className="w-4 h-4" />
                                    <span>{isBrowserSpeaking ? "Dừng" : "Đọc nhanh (Máy tính)"}</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 italic">
                                * Lưu ý: Nút "TẠO FILE AUDIO" sẽ sinh giọng AI Gemini chất lượng như thật. Nút "Đọc nhanh (Máy tính)" chỉ để soát nhanh chính tả bằng giọng mặc định của Windows.
                            </p>
                        </div>
                    </div>

                    {/* Right: Audio Player & CapCut Guide (5 cols) */}
                    <div className="lg:col-span-5 space-y-5">
                        {/* Audio Player Card */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-[#00AFA9]" />
                                    Kết quả lồng tiếng (Studio Audio)
                                </h2>
                                {audioUrl && (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                        Đã sẵn sàng
                                    </span>
                                )}
                            </div>

                            {/* Audio Preview Area */}
                            {audioUrl ? (
                                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <audio
                                        ref={audioRef}
                                        src={audioUrl}
                                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                        onEnded={() => setIsPlaying(false)}
                                        className="hidden"
                                    />

                                    {/* Waveform animation */}
                                    <div className="flex items-center justify-center gap-1 h-12 bg-white rounded-lg px-4 border border-slate-200 overflow-hidden">
                                        {Array.from({ length: 28 }).map((_, i) => {
                                            const heights = [20, 45, 75, 30, 90, 60, 40, 85, 95, 50, 30, 70, 80, 40, 65, 85, 55, 35, 90, 75, 45, 60, 30, 80, 65, 40, 25, 50];
                                            const h = heights[i % heights.length];
                                            return (
                                                <div
                                                    key={i}
                                                    style={{ height: `${h}%` }}
                                                    className={`w-1 rounded-full transition-all ${
                                                        isPlaying 
                                                            ? "bg-[#00AFA9] animate-pulse" 
                                                            : "bg-slate-300"
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Controls */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                                            <span>{formatTime(currentTime)}</span>
                                            <span className="text-[#00AFA9] font-bold">{speedRate.toFixed(2)}x</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            value={currentTime}
                                            onChange={(e) => {
                                                const t = parseFloat(e.target.value);
                                                setCurrentTime(t);
                                                if (audioRef.current) audioRef.current.currentTime = t;
                                            }}
                                            className="w-full accent-[#00AFA9] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={togglePlay}
                                            className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                        >
                                            {isPlaying ? (
                                                <>
                                                    <Pause className="w-4 h-4 fill-white" />
                                                    <span>Tạm dừng</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 fill-white" />
                                                    <span>Phát nghe thử</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (audioRef.current) {
                                                    audioRef.current.currentTime = 0;
                                                    audioRef.current.play();
                                                    setIsPlaying(true);
                                                }
                                            }}
                                            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
                                            title="Phát lại từ đầu"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Download MP3 Button */}
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>TẢI FILE MP3 VỀ MÁY (ĐỂ GHÉP CAPCUT)</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4 bg-slate-50/70 rounded-xl border border-dashed border-gray-200 space-y-3">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 text-[#00AFA9] flex items-center justify-center">
                                        <Headphones className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-gray-800 text-sm">
                                            Chưa có file MP3 nào
                                        </h3>
                                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                            Dán lời thoại vào khung bên trái rồi bấm <strong>"TẠO FILE MP3 ĐỂ GHÉP VIDEO"</strong> để nghe và tải về.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Guide Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                <Film className="w-4 h-4" />
                                <span>Hướng dẫn lồng tiếng video 3 bước cho Chị nhà:</span>
                            </div>

                            <div className="space-y-3 text-xs text-slate-300">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-white/10 font-bold text-white flex items-center justify-center shrink-0 text-[11px]">
                                        1
                                    </span>
                                    <div>
                                        <strong className="text-white">Chọn chất giọng:</strong> Bấm chọn thẻ <em>Nữ Gen Z Bắt Trend</em> để giọng trẻ trung, nhí nhảnh chuẩn TikTok.
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-white/10 font-bold text-white flex items-center justify-center shrink-0 text-[11px]">
                                        2
                                    </span>
                                    <div>
                                        <strong className="text-white">Kéo thanh tốc độ:</strong> Kéo thanh trượt đến mức <em>1.15x</em> hoặc <em>1.20x</em> để nhịp điệu nhanh và cuốn hút hơn.
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-white/10 font-bold text-white flex items-center justify-center shrink-0 text-[11px]">
                                        3
                                    </span>
                                    <div>
                                        <strong className="text-white">Tải file MP3 & Kéo vào CapCut:</strong> Bấm tải file MP3 về → Mở CapCut chọn <em>Thêm âm thanh</em> → Ghép vào video là hoàn tất!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: VOICE CLONING (NHÂN BẢN GIỌNG NÓI THẬT) */}
            {activeTab === "cloning" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <Dna className="w-6 h-6" />
                            </span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Nhân Bản Giọng Nói Chính Chủ (AI Voice Cloning)
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Tải đoạn thu âm giọng thật của Chị nhà hoặc Anh Huy lên để AI học và phát ra đúng 100% âm sắc, ngữ điệu của anh chị!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Upload or Record Audio */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                <Upload className="w-4 h-4 text-purple-600" />
                                Bước 1: Nạp mẫu giọng nói thật (15 giây - 1 phút)
                            </h3>

                            {/* Dropzone */}
                            <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/20 hover:bg-purple-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 block">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        {cloningFile ? cloningFile.name : "Kéo thả file âm thanh hoặc bấm để tải lên"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hỗ trợ MP3, M4A, WAV (ghi âm bằng điện thoại hoặc ứng dụng ghi âm)
                                    </p>
                                </div>
                            </label>

                            <div className="flex items-center justify-center gap-3">
                                <span className="text-xs text-gray-400 font-medium">HOẶC THU ÂM TRỰC TIẾP:</span>
                                <button
                                    type="button"
                                    onClick={toggleRecording}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                        isRecording 
                                            ? "bg-rose-600 text-white animate-pulse" 
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    }`}
                                >
                                    <Radio className="w-4 h-4" />
                                    <span>{isRecording ? `Đang ghi âm (${recordingSeconds}s)... Bấm để dừng` : "Bật Micro thu âm 30 giây"}</span>
                                </button>
                            </div>

                            {/* Voice Name Input */}
                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-semibold text-gray-700">
                                    Đặt tên cho giọng nhân bản:
                                </label>
                                <input
                                    type="text"
                                    value={cloningVoiceName}
                                    onChange={(e) => setCloningVoiceName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                                />
                            </div>
                        </div>

                        {/* Right: Technical Explanation & Integration */}
                        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Cơ chế hoạt động của Voice Cloning:
                            </h3>

                            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                                <p>
                                    <strong className="text-gray-900">1. Trích xuất âm sắc độc quyền:</strong> Khác với các giọng đọc mẫu có sẵn của hệ thống, tính năng Nhân Bản Giọng Nói sử dụng công nghệ Deep Learning để phân tích tần số giọng, ngữ điệu, cách ngắt nhịp và âm hưởng tự nhiên của chính bạn.
                                </p>
                                <p>
                                    <strong className="text-gray-900">2. Kết nối API chuyên sâu (ElevenLabs / FPT AI):</strong> Để nhân bản giọng nói với chất lượng phòng thu cao nhất, hệ thống có thể kết nối với dịch vụ <strong>ElevenLabs Instant Voice Cloning</strong>. Bạn chỉ cần dán mã API Key vào là kích hoạt được ngay.
                                </p>
                                <p>
                                    <strong className="text-gray-900">3. Sử dụng lâu dài:</strong> Sau khi nhân bản xong, giọng đọc của bạn sẽ xuất hiện vĩnh viễn trong danh sách chọn giọng để bạn viết kịch bản và xuất voice bất cứ lúc nào!
                                </p>
                            </div>

                            <div className="pt-3 border-t border-slate-200">
                                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                                    <span className="text-purple-800 font-medium">
                                        Trạng thái: <strong>Sẵn sàng nạp giọng mẫu</strong>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold text-[10px]">
                                        ElevenLabs Ready
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
