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
    RefreshCw,
    History,
    Trash2,
    Search,
    FileUp,
    ListMusic,
    ArrowUpRight,
    Scissors,
    Sparkles as SparklesIcon
} from "lucide-react";
import Link from "next/link";
import { 
    normalizeVietnamesePhonetics, 
    removeEmojis, 
    optimizeBreathPauses, 
    generateSmartFileName 
} from "@/lib/ttsHelper";
import { 
    VoiceHistoryItem, 
    getVoiceHistory, 
    saveVoiceHistory, 
    deleteVoiceHistoryItem, 
    clearVoiceHistory 
} from "@/lib/voiceHistoryStore";

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
        pitchVal: 1.25,
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
        title: "Kịch bản 1: Bánh phồng tôm Sa Giang (TikTok Review)",
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
    const [speedRate, setSpeedRate] = useState<number>(1.15); // Slider: 0.50x to 2.50x
    const [customFileName, setCustomFileName] = useState("");

    // Output & Playback state
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);

    // Voice History State
    const [historyList, setHistoryList] = useState<VoiceHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [historySearch, setHistorySearch] = useState("");
    const [historyPlayingId, setHistoryPlayingId] = useState<string | null>(null);
    const historyAudioRef = useRef<HTMLAudioElement | null>(null);

    // Voice Cloning state
    const [cloningFile, setCloningFile] = useState<File | null>(null);
    const [cloningVoiceName, setCloningVoiceName] = useState("Giọng Chị Nhà (Chính Chủ)");
    const [cloningStatus, setCloningStatus] = useState<"idle" | "uploading" | "ready">("idle");
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Custom cloned voices state
    const [customVoices, setCustomVoices] = useState<VoiceStyleOption[]>([]);
    const [cloningApiKey, setCloningApiKey] = useState("");
    const [cloningLoading, setCloningLoading] = useState(false);
    const [showKeyGuide, setShowKeyGuide] = useState(false);

    const allVoiceStyles = [...customVoices, ...VOICE_STYLES];
    const selectedStyle = allVoiceStyles.find(s => s.id === selectedStyleId) || allVoiceStyles[0];

    // Nạp lịch sử từ IndexedDB, API key và custom voices
    useEffect(() => {
        loadHistory();

        if (typeof window !== "undefined") {
            const savedKey = localStorage.getItem("lyhu_eleven_key") || "";
            if (savedKey) setCloningApiKey(savedKey);

            const savedVoices = localStorage.getItem("lyhu_custom_voices");
            if (savedVoices) {
                try {
                    const parsed = JSON.parse(savedVoices);
                    if (Array.isArray(parsed)) setCustomVoices(parsed);
                } catch (e) {}
            }

            // Kiểm tra xem có kịch bản chuyển từ /media/scripts/[id] qua không
            const imported = sessionStorage.getItem("lyhu_voice_import");
            if (imported) {
                try {
                    const parsed = JSON.parse(imported);
                    if (parsed.text) setText(parsed.text);
                    if (parsed.title) setCustomFileName(parsed.title);
                    sessionStorage.removeItem("lyhu_voice_import");
                } catch (e) {
                    setText(imported);
                    sessionStorage.removeItem("lyhu_voice_import");
                }
            }
        }
    }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const items = await getVoiceHistory();
            setHistoryList(items);
        } catch (e) {
            console.warn("Lỗi tải lịch sử:", e);
        } finally {
            setLoadingHistory(false);
        }
    };

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

        // Chuẩn hóa ngữ âm
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

    // Generate Audio File via Server (Gemini 3.8 Flash TTS)
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

            const isCustom = selectedStyle.id.startsWith("custom-");
            const customVoiceId = isCustom ? selectedStyle.id.replace("custom-", "") : undefined;
            const keyToUse = isCustom ? (cloningApiKey || localStorage.getItem("lyhu_eleven_key") || undefined) : undefined;

            const isGeminiCloned = selectedStyle.id.startsWith("gemini-cloned-");
            const sampleBase64 = isGeminiCloned ? (localStorage.getItem("lyhu_voice_sample_" + selectedStyle.id) || undefined) : undefined;

            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: phoneticText,
                    voice: selectedStyle.gender === "female" ? "vi-VN-HoaiMyNeural" : "vi-VN-NamMinhNeural",
                    style: selectedStyle.id,
                    rate: rateStr,
                    pitch: selectedStyle.pitchStr,
                    voiceId: customVoiceId,
                    elevenApiKey: keyToUse,
                    voiceSampleBase64: sampleBase64
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

            // Lưu tự động vào Lịch sử (IndexedDB)
            const cleanSnippet = text.trim().slice(0, 48).replace(/\s+/g, " ");
            const newHistoryItem: VoiceHistoryItem = {
                id: Date.now().toString(),
                text: text.trim(),
                title: cleanSnippet + (text.length > 48 ? "..." : ""),
                styleId: selectedStyle.id,
                styleName: selectedStyle.name,
                styleAvatar: selectedStyle.avatar,
                speedRate: speedRate,
                wordCount: wordCount,
                estimatedSeconds: estimatedSeconds,
                createdAt: Date.now(),
                audioBlob: blob,
                audioUrl: newUrl
            };

            await saveVoiceHistory(newHistoryItem);
            setHistoryList(prev => [newHistoryItem, ...prev]);

            // Tự động phát âm thanh vừa sinh
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

    const handleDownload = (targetUrl?: string, targetName?: string) => {
        const urlToUse = targetUrl || audioUrl;
        if (!urlToUse) return;

        let fileName = targetName;
        if (!fileName) {
            if (customFileName.trim()) {
                const cleanCustom = customFileName.trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/Đ/g, "D")
                    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
                    .replace(/\s+/g, "_");
                fileName = `${cleanCustom}_${speedRate}x.mp3`;
            } else {
                fileName = generateSmartFileName(text, selectedStyle.id, speedRate);
            }
        }

        const a = document.createElement("a");
        a.href = urlToUse;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Tải lại kịch bản từ lịch sử lên màn hình chính
    const handleRestoreFromHistory = (item: VoiceHistoryItem) => {
        setText(item.text);
        setSelectedStyleId(item.styleId);
        setSpeedRate(item.speedRate);
        if (item.audioUrl) {
            setAudioUrl(item.audioUrl);
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.playbackRate = item.speedRate;
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                }
            }, 100);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Xóa 1 bản ghi lịch sử
    const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteVoiceHistoryItem(id);
        setHistoryList(prev => prev.filter(item => item.id !== id));
    };

    // Xóa tất cả lịch sử
    const handleClearAllHistory = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử các file âm thanh đã tạo?")) {
            await clearVoiceHistory();
            setHistoryList([]);
        }
    };

    // Phát âm thanh trong lịch sử
    const handlePlayHistoryAudio = (item: VoiceHistoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (historyPlayingId === item.id) {
            if (historyAudioRef.current) {
                historyAudioRef.current.pause();
            }
            setHistoryPlayingId(null);
            return;
        }

        if (item.audioUrl) {
            if (historyAudioRef.current) {
                historyAudioRef.current.pause();
            }
            const audio = new Audio(item.audioUrl);
            audio.playbackRate = item.speedRate;
            historyAudioRef.current = audio;
            audio.play();
            setHistoryPlayingId(item.id);
            audio.onended = () => setHistoryPlayingId(null);
            audio.onerror = () => setHistoryPlayingId(null);
        }
    };

    // Tiện ích xử lý văn bản: Tải file .txt từ máy tính
    const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === "string") {
                setText(content);
                const titleGuess = file.name.replace(/\.[^/.]+$/, "");
                setCustomFileName(titleGuess);
            }
        };
        reader.readAsText(file);
    };

    // Tiện ích xử lý văn bản: Tối ưu ngắt nhịp thở
    const handleOptimizePauses = () => {
        if (!text.trim()) return;
        const optimized = optimizeBreathPauses(text);
        setText(optimized);
    };

    // Tiện ích xử lý văn bản: Lọc emoji & icon
    const handleCleanEmojis = () => {
        if (!text.trim()) return;
        const cleaned = removeEmojis(text);
        setText(cleaned);
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

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} - ${d.getDate()}/${d.getMonth() + 1}`;
    };

    // Lọc lịch sử theo từ khóa tìm kiếm
    const filteredHistory = historyList.filter(item => {
        if (!historySearch.trim()) return true;
        const s = historySearch.toLowerCase();
        return item.text.toLowerCase().includes(s) || 
               item.styleName.toLowerCase().includes(s) ||
               (item.title && item.title.toLowerCase().includes(s));
    });

    // Voice Cloning file upload handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCloningFile(file);
        }
    };

    const handleStartCloning = async () => {
        if (!cloningFile) {
            alert("Vui lòng tải lên file âm thanh mẫu của Chị nhà.");
            return;
        }

        if (!cloningApiKey.trim()) {
            setShowKeyGuide(true);
            alert("Vui lòng nhập mã ElevenLabs API Key để kết nối AI nhân bản giọng nói. Hãy xem hướng dẫn bên dưới ô nhập để lấy mã hoàn toàn miễn phí trong 30 giây!");
            return;
        }

        setCloningLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", cloningFile);
            formData.append("name", cloningVoiceName || "Giọng Chị Nhà");
            formData.append("apiKey", cloningApiKey.trim());

            const res = await fetch("/api/ai/voice-clone", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Không thể nhân bản giọng nói. Vui lòng kiểm tra lại API Key.");
            }

            // Lưu API Key trên máy
            localStorage.setItem("lyhu_eleven_key", cloningApiKey.trim());

            const newCustomVoice: VoiceStyleOption = {
                id: `custom-${data.voiceId}`,
                name: `${cloningVoiceName || "Giọng Chị Nhà"} (Chính Chủ)`,
                gender: "female",
                category: "sweet",
                description: "Giọng thật chính chủ của Chị nhà, phát âm chuẩn 100% ngữ điệu thực tế.",
                tag: "Chính chủ: Video TikTok, Reels, Shorts",
                avatar: "👑",
                pitchVal: 1.0,
                pitchStr: "+0Hz",
                recommendedSpeed: 1.15,
                color: "from-purple-500/10 to-indigo-500/10 text-purple-700",
                border: "border-purple-300"
            };

            const updatedVoices = [newCustomVoice, ...customVoices.filter(v => v.id !== newCustomVoice.id)];
            setCustomVoices(updatedVoices);
            localStorage.setItem("lyhu_custom_voices", JSON.stringify(updatedVoices));

            setSelectedStyleId(newCustomVoice.id);
            setActiveTab("tts");
            alert(`🎉 Chúc mừng! Đã nhân bản thành công "${newCustomVoice.name}". Giọng đọc đã được thêm vào danh sách và sẵn sàng tạo kịch bản!`);
        } catch (err: any) {
            alert(err.message || "Có lỗi xảy ra khi nhân bản giọng nói.");
        } finally {
            setCloningLoading(false);
        }
    };

    // Lưu mẫu âm thanh của Chị nhà trực tiếp vào hệ thống để Gemini AI xử lý (Miễn phí 100%)
    const handleSaveGeminiVoiceSample = async () => {
        if (!cloningFile) {
            alert("Vui lòng tải lên file âm thanh mẫu của Chị nhà.");
            return;
        }

        setCloningLoading(true);
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64Data = result.includes(",") ? result.split(",")[1] : result;
                    resolve(base64Data);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(cloningFile);
            const base64Audio = await base64Promise;

            const voiceId = "gemini-cloned-" + Date.now();
            const voiceName = (cloningVoiceName || "Giọng Chị Nhà").trim();

            localStorage.setItem("lyhu_voice_sample_" + voiceId, base64Audio);

            const newCustomVoice: VoiceStyleOption = {
                id: voiceId,
                name: `${voiceName} (Chính Chủ)`,
                gender: "female",
                category: "sweet",
                description: "Giọng thật của Chị nhà được xử lý trực tiếp bởi Gemini AI siêu rẻ (~20đ/video).",
                tag: "Chính chủ: Gemini AI xử lý, không tốn phí duy trì",
                avatar: "👑",
                pitchVal: 1.0,
                pitchStr: "+0Hz",
                recommendedSpeed: 1.15,
                color: "from-teal-500/10 to-emerald-500/10 text-teal-700",
                border: "border-teal-300"
            };

            const updatedVoices = [newCustomVoice, ...customVoices.filter(v => v.id !== newCustomVoice.id)];
            setCustomVoices(updatedVoices);
            localStorage.setItem("lyhu_custom_voices", JSON.stringify(updatedVoices));

            setSelectedStyleId(newCustomVoice.id);
            setActiveTab("tts");
            alert(`🎉 Tuyệt vời! Đã lưu giọng của Chị nhà vào hệ thống. Bây giờ Chị nhà có thể viết kịch bản và xuất giọng đọc bằng Gemini AI với giá chỉ ~20đ/video mà không mất bất kỳ khoản phí duy trì nào!`);
        } catch (err: any) {
            alert(err.message || "Có lỗi xảy ra khi lưu giọng.");
        } finally {
            setCloningLoading(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        } else {
            setIsRecording(true);
            setRecordingSeconds(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingSeconds(prev => {
                    if (prev >= 60) {
                        setIsRecording(false);
                        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-teal-50 text-[#00AFA9]">
                            <Mic className="w-6 h-6" />
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Studio Lồng Tiếng AI (Text to Voice)
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm">
                            ✦ Gen Z & TikTok Edition
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
                <div className="space-y-6">
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
                                    <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                        {selectedStyle.name}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {allVoiceStyles.map((v) => {
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
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-2xl">{v.avatar}</span>
                                                        <div>
                                                            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                                                {v.name}
                                                                {v.category === "genz" && (
                                                                    <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-1.5 py-0.2 rounded-full">
                                                                        HOT
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                                {v.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[#00AFA9] ring-4 ring-teal-100 shrink-0 mt-1" />
                                                    )}
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                                                    <span className="text-[#00AFA9] font-medium truncate max-w-[200px]">
                                                        {v.tag.split(":")[0]}
                                                    </span>
                                                    <span>{v.recommendedSpeed}x</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Speed Slider Card */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-[#00AFA9]" />
                                        2. Tốc độ nói (Kéo thả thanh trượt)
                                    </label>
                                    <span className="text-xs font-mono font-bold text-[#00AFA9] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                                        {speedRate.toFixed(2)}x
                                    </span>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <input
                                        type="range"
                                        min={0.50}
                                        max={2.50}
                                        step={0.05}
                                        value={speedRate}
                                        onChange={(e) => setSpeedRate(parseFloat(e.target.value))}
                                        className="w-full accent-[#00AFA9] h-2 bg-gray-200 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                                        <span>0.5x</span>
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
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#00AFA9]" />
                                        3. Lời thoại / Kịch bản lồng tiếng
                                    </label>

                                    {/* Text Processing Utilities */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* Upload .txt */}
                                        <input 
                                            ref={fileInputRef} 
                                            type="file" 
                                            accept=".txt" 
                                            onChange={handleTxtFileUpload} 
                                            className="hidden" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                                            title="Tải nội dung từ file text (.txt)"
                                        >
                                            <FileUp className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Nạp file .txt</span>
                                        </button>

                                        {/* Auto Breath pause */}
                                        <button
                                            type="button"
                                            onClick={handleOptimizePauses}
                                            disabled={!text.trim()}
                                            className="px-2 py-1 text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
                                            title="Tự động thêm dấu ngắt nghỉ lấy hơi cho AI"
                                        >
                                            <SparklesIcon className="w-3.5 h-3.5 text-[#00AFA9]" />
                                            <span>Ngắt nhịp thở</span>
                                        </button>

                                        {/* Clean Emojis */}
                                        <button
                                            type="button"
                                            onClick={handleCleanEmojis}
                                            disabled={!text.trim()}
                                            className="px-2 py-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
                                            title="Lọc sạch icon emoji để AI đọc không bị vấp"
                                        >
                                            <Scissors className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Lọc Emoji</span>
                                        </button>

                                        {text && (
                                            <button
                                                type="button"
                                                onClick={() => setText("")}
                                                className="px-2 py-1 text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
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

                                {/* Smart Filename Input */}
                                <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    <span className="text-gray-500 whitespace-nowrap font-medium">📁 Tên file khi tải về:</span>
                                    <input
                                        type="text"
                                        value={customFileName}
                                        onChange={(e) => setCustomFileName(e.target.value)}
                                        placeholder={`Tự động (VD: ${generateSmartFileName(text || "kịch bản", selectedStyle.id, speedRate)})`}
                                        className="flex-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 outline-none focus:border-[#00AFA9]"
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
                                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
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
                                    * Lưu ý: Nút "TẠO FILE AUDIO" sẽ sinh giọng AI Gemini chất lượng như thật và tự động lưu vào Lịch sử bên dưới. Nút "Đọc nhanh (Máy tính)" chỉ để soát nhanh chính tả bằng giọng mặc định của Windows.
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
                                            onClick={() => handleDownload()}
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
                                                Chưa có file âm thanh nào
                                            </h3>
                                            <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                                Dán lời thoại vào khung bên trái rồi bấm <strong>"TẠO FILE AUDIO & NGHE THỬ"</strong> để nghe và tải về.
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

                    {/* SECTION: VOICE HISTORY & LIBRARY (LỊCH SỬ LỒNG TIẾNG ĐÃ TẠO) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                    <History className="w-5 h-5" />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        Kho File Lồng Tiếng Đã Tạo (Lịch Sử)
                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                            {historyList.length} file
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Tự động lưu trữ nội dung và file âm thanh trên trình duyệt. Không sợ mất khi chuyển kịch bản hoặc F5 tải lại trang.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Search in history */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo từ khóa..."
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-purple-400 w-44"
                                    />
                                </div>

                                {historyList.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllHistory}
                                        className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 border border-rose-200"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Xóa tất cả</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* History Items Grid / List */}
                        {loadingHistory ? (
                            <div className="py-8 text-center text-xs text-gray-400">
                                Đang tải kho âm thanh đã tạo...
                            </div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-slate-50/50 rounded-xl border border-dashed border-gray-200 space-y-2">
                                <ListMusic className="w-8 h-8 text-gray-300 mx-auto" />
                                <p className="text-xs text-gray-500 font-medium">
                                    {historySearch ? "Không tìm thấy kịch bản nào khớp từ khóa" : "Chưa có file âm thanh nào trong lịch sử"}
                                </p>
                                <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                                    Mỗi lần bạn bấm "TẠO FILE AUDIO & NGHE THỬ", file âm thanh và lời thoại sẽ được lưu trữ tự động tại đây để bạn nghe lại và tải về bất cứ lúc nào.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredHistory.map((item) => {
                                    const isPlayingThis = historyPlayingId === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm bg-white transition-all space-y-3 flex flex-col justify-between"
                                        >
                                            <div className="space-y-2">
                                                {/* Header of Item */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                                                        <span>{item.styleAvatar}</span>
                                                        <span className="truncate max-w-[130px]">{item.styleName}</span>
                                                        <span className="text-[10px] px-1.5 py-0.2 bg-teal-50 text-[#00AFA9] font-mono rounded">
                                                            {item.speedRate}x
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-gray-400">
                                                        {formatDate(item.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Snippet text */}
                                                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    {item.text}
                                                </p>

                                                {/* Word count & duration */}
                                                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                                    <span>{item.wordCount} từ</span>
                                                    <span>•</span>
                                                    <span>~{item.estimatedSeconds}s</span>
                                                </div>
                                            </div>

                                            {/* Action bar for History Item */}
                                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    {/* Play / Stop Mini */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handlePlayHistoryAudio(item, e)}
                                                        className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                                                            isPlayingThis 
                                                                ? "bg-rose-50 text-rose-600 border border-rose-200" 
                                                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                        }`}
                                                        title={isPlayingThis ? "Dừng phát" : "Nghe nhanh file này"}
                                                    >
                                                        {isPlayingThis ? <Pause className="w-3.5 h-3.5 fill-rose-600" /> : <Play className="w-3.5 h-3.5 fill-slate-700" />}
                                                    </button>

                                                    {/* Download MP3 */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(item.audioUrl, generateSmartFileName(item.text, item.styleId, item.speedRate))}
                                                        className="p-2 rounded-lg text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center gap-1"
                                                        title="Tải file MP3 này về máy"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Tải MP3</span>
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {/* Restore Script */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreFromHistory(item)}
                                                        className="px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1 border border-teal-200"
                                                        title="Nạp lại nội dung kịch bản và cài đặt này lên màn hình chính để sửa"
                                                    >
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        <span>Dùng lại</span>
                                                    </button>

                                                    {/* Delete this item */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Xóa khỏi lịch sử"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: VOICE CLONING (NHÂN BẢN GIỌNG NÓI THẬT) */}
            {activeTab === "cloning" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                                <Dna className="w-6 h-6" />
                            </span>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                    Nhân Bản Giọng Nói Chính Chủ (AI Voice Cloning)
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Tải 1 đoạn thu âm giọng thật của Chị nhà lên để AI sao chép đúng 100% âm sắc, ngữ điệu thực tế!
                                </p>
                            </div>
                        </div>

                        {/* Quick switch to Tab 1 banner button */}
                        <button
                            type="button"
                            onClick={() => setActiveTab("tts")}
                            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-[#00AFA9] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-teal-200 self-start sm:self-auto"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Dùng ngay 7 giọng AI có sẵn (Miễn phí)</span>
                        </button>
                    </div>

                    {/* Notice Banner */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-amber-900">
                                💡 Lời khuyên cho Chị nhà khi làm video TikTok / CapCut:
                            </p>
                            <p className="leading-relaxed">
                                Nếu chỉ cần lồng tiếng video bán hàng nhanh, bạn nên dùng <strong>Tab "Studio Giọng Đọc AI"</strong> bên cạnh vì đã có sẵn <strong>7 chất giọng Gen Z cực chuẩn và hoàn toàn miễn phí</strong>. Tính năng <em>Nhân bản giọng thật</em> này chỉ cần thiết khi bạn muốn AI nói ra <strong>chính xác 100% âm sắc giọng của chính Chị nhà</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Step 1 & Audio Preview */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                <Upload className="w-4 h-4 text-purple-600" />
                                Bước 1: Nạp file âm thanh mẫu (15 giây - 1 phút)
                            </h3>

                            {/* Dropzone */}
                            {!cloningFile ? (
                                <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/20 hover:bg-purple-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 block">
                                    <input
                                        type="file"
                                        accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">
                                            Kéo thả file âm thanh hoặc bấm để chọn file
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Hỗ trợ MP3, M4A, WAV (ghi âm bằng iPhone hoặc điện thoại)
                                        </p>
                                    </div>
                                </label>
                            ) : (
                                /* File Preview Card */
                                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                                🎵
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                                                    {cloningFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(cloningFile.size / (1024 * 1024)).toFixed(2)} MB • File mẫu sẵn sàng
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setCloningFile(null)}
                                            className="text-xs text-rose-600 hover:text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-rose-200"
                                        >
                                            Đổi file khác
                                        </button>
                                    </div>

                                    {/* Native Audio Preview */}
                                    <audio 
                                        controls 
                                        src={URL.createObjectURL(cloningFile)}
                                        className="w-full h-9 rounded-lg"
                                    />
                                    <p className="text-[11px] text-gray-500 italic">
                                        ✓ Hãy bấm nút Play ở trên để nghe thử xem giọng Chị nhà có trong trẻo, không bị ồn không.
                                    </p>
                                </div>
                            )}

                            {/* Voice Name Input */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Đặt tên cho giọng nhân bản này:
                                </label>
                                <input
                                    type="text"
                                    value={cloningVoiceName}
                                    onChange={(e) => setCloningVoiceName(e.target.value)}
                                    placeholder="VD: Giọng Chị Nhà (Chính Chủ)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                                />
                            </div>
                        </div>

                        {/* Right: Step 2 - Action & Integration */}
                        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    Bước 2: Kích hoạt Nhân Bản Giọng Nói
                                </h3>

                                <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200">
                                    <p className="font-semibold text-gray-800">
                                        Hệ thống hỗ trợ 2 phương thức nhân bản:
                                    </p>
                                    <div className="space-y-1.5 pl-2">
                                        <div className="flex items-start gap-1.5">
                                            <span className="font-bold text-purple-600">•</span>
                                            <span>
                                                <strong>ElevenLabs Instant Cloning (Tốt nhất thế giới):</strong> Chỉ cần đoạn âm thanh 1 phút của Chị nhà, AI học xong trong 15 giây. Giọng đọc ra y hệt 100%.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <span className="font-bold text-teal-600">•</span>
                                            <span>
                                                <strong>Google Gemini Voice Replication:</strong> Công nghệ của Google DeepMind, yêu cầu thêm câu tuyên thệ bản quyền trên Google AI Studio.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                                    <span className="text-gray-600">
                                        Tình trạng file: <strong className={cloningFile ? "text-emerald-600" : "text-amber-600"}>{cloningFile ? "Đã nạp file mẫu" : "Chưa chọn file"}</strong>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                        Instant Cloning
                                    </span>
                                </div>

                                {/* API Key Input with Guide */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                        <span>Mã ElevenLabs API Key:</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowKeyGuide(!showKeyGuide)}
                                            className="text-purple-600 hover:text-purple-800 text-[11px] underline"
                                        >
                                            {showKeyGuide ? "Ẩn hướng dẫn" : "Lấy key miễn phí (30 giây)"}
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={cloningApiKey}
                                        onChange={(e) => {
                                            setCloningApiKey(e.target.value);
                                            localStorage.setItem("lyhu_eleven_key", e.target.value);
                                        }}
                                        placeholder="Dán mã API key (dạng sk_...) vào đây"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:border-purple-500 bg-white"
                                    />
                                    {showKeyGuide && (
                                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-950 space-y-1.5 leading-relaxed">
                                            <p className="font-bold text-purple-900">👉 3 bước lấy API Key miễn phí (cho 10,000 ký tự):</p>
                                            <ol className="list-decimal pl-4 space-y-1 text-purple-800">
                                                <li>Truy cập <a href="https://elevenlabs.io/sign-up" target="_blank" rel="noreferrer" className="underline font-bold text-purple-900">elevenlabs.io</a> và đăng ký bằng tài khoản Google.</li>
                                                <li>Bấm vào biểu tượng ảnh đại diện ở góc dưới cùng bên trái → Chọn <strong>API Keys</strong>.</li>
                                                <li>Bấm nút <strong>Create Key</strong> → Sao chép mã và dán vào ô bên trên.</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-3">
                                {/* Option A: Gemini AI Voice Processing (Recommended - 100% Free / Pay-as-you-go) */}
                                <button
                                    type="button"
                                    disabled={!cloningFile || cloningLoading}
                                    onClick={handleSaveGeminiVoiceSample}
                                    className="w-full py-3.5 px-4 bg-[#00AFA9] hover:bg-[#009690] active:scale-[0.99] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {cloningLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Đang lưu mẫu & nạp vào Gemini AI...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>LƯU MẪU GIỌNG ĐỂ GEMINI XỬ LÝ (MIỄN PHÍ ~20Đ/VIDEO)</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-[11px] text-center text-teal-700 font-medium">
                                    ✓ Đúng như bạn mong muốn: Mẫu giọng được lưu vào hệ thống, Gemini AI tự xử lý đọc kịch bản chỉ ~20đ/video, KHÔNG tốn phí thuê bao hàng tháng!
                                </p>

                                {/* Option B: ElevenLabs Instant Cloning (Optional if user bought $6 plan) */}
                                <div className="pt-2 border-t border-slate-200">
                                    <button
                                        type="button"
                                        disabled={!cloningFile || cloningLoading}
                                        onClick={handleStartCloning}
                                        className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-purple-200"
                                    >
                                        <span>Hoặc: Nhân bản chuyên sâu qua ElevenLabs (nếu có gói $6/tháng)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
