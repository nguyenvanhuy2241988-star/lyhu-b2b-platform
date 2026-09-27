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
    ChevronRight,
    Flame,
    Zap,
    Clock,
    AlertCircle
} from "lucide-react";
import Link from "next/link";

interface VoiceOption {
    id: string;
    name: string;
    gender: "female" | "male";
    description: string;
    tag: string;
    avatar: string;
    color: string;
}

const VOICES: VoiceOption[] = [
    {
        id: "vi-VN-HoaiMyNeural",
        name: "Hoài My (Nữ)",
        gender: "female",
        description: "Giọng Bắc ngọt ngào, truyền cảm, ngắt nghỉ tự nhiên.",
        tag: "Khuyên dùng: TikTok, Review sản phẩm, Đồ ăn vặt, Bán hàng sỉ",
        avatar: "👩‍💼",
        color: "from-pink-500/10 to-rose-500/10 border-pink-200 text-pink-700"
    },
    {
        id: "vi-VN-NamMinhNeural",
        name: "Nam Minh (Nam)",
        gender: "male",
        description: "Giọng Bắc trầm ấm, đĩnh đạc, rõ chữ, chuẩn phát thanh viên.",
        tag: "Khuyên dùng: Video phóng sự xưởng, Tin tức, Giới thiệu công ty, Hướng dẫn",
        avatar: "👨‍💼",
        color: "from-blue-500/10 to-cyan-500/10 border-blue-200 text-blue-700"
    }
];

const SPEED_PRESETS = [
    { label: "0.9x", value: "-10%", desc: "Chậm rãi, lắng đọng" },
    { label: "1.0x", value: "+0%", desc: "Tốc độ chuẩn" },
    { label: "1.15x", value: "+15%", desc: "Chuẩn TikTok triệu view", highlight: true },
    { label: "1.25x", value: "+25%", desc: "Nhanh & dồn dập" },
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
    const [text, setText] = useState("");
    const [selectedVoice, setSelectedVoice] = useState("vi-VN-HoaiMyNeural");
    const [selectedSpeed, setSelectedSpeed] = useState("+15%");
    const [pitch, setPitch] = useState("+0Hz");

    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Audio element ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Clean up object URL
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    // Word count & estimated duration calculation
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    // Average Vietnamese speech rate: ~140-160 words per minute at 1.0x (~2.5 words/sec)
    const estimatedSeconds = Math.round(wordCount / 2.6);

    const getSpeedMultiplier = (speed: string) => {
        if (speed === "-10%") return 0.9;
        if (speed === "+15%") return 1.15;
        if (speed === "+25%") return 1.25;
        return 1.0;
    };

    const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);

    const speakWithBrowser = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        if (isBrowserSpeaking) {
            window.speechSynthesis.cancel();
            setIsBrowserSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = "vi-VN";
        utterance.rate = getSpeedMultiplier(selectedSpeed);

        const voices = window.speechSynthesis.getVoices();
        const vnVoice = voices.find(v => v.lang.startsWith("vi"));
        if (vnVoice) utterance.voice = vnVoice;

        utterance.onend = () => setIsBrowserSpeaking(false);
        utterance.onerror = () => setIsBrowserSpeaking(false);

        setIsBrowserSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const handleGenerateVoice = async () => {
        if (!text.trim()) {
            setErrorMessage("Vui lòng nhập lời thoại hoặc kịch bản cần lồng tiếng.");
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text.trim(),
                    voice: selectedVoice,
                    rate: selectedSpeed,
                    pitch: pitch
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

            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }

            const newUrl = URL.createObjectURL(blob);
            setAudioBlob(blob);
            setAudioUrl(newUrl);

            // Auto play preview
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.playbackRate = getSpeedMultiplier(selectedSpeed);
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                }
            }, 100);

        } catch (err: any) {
            console.error("TTS Error:", err);
            setErrorMessage(err.message || "Có lỗi xảy ra khi tạo giọng đọc. Bạn cũng có thể bấm 'Nghe thử tức thì' để nghe bằng giọng máy tính.");
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
        const voiceName = selectedVoice.includes("HoaiMy") ? "Nu_HoaiMy" : "Nam_NamMinh";
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `voiceover_LYHU_${voiceName}_${dateStr}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePaste = async () => {
        try {
            const clip = await navigator.clipboard.readText();
            if (clip) setText(clip);
        } catch {
            // ignore
        }
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
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Chuẩn Video Creator
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 pl-11">
                        Gõ hoặc dán lời thoại $\rightarrow$ Bấm nút $\rightarrow$ Có ngay giọng đọc chuẩn phát thanh viên tải về ghép vào <strong>CapCut / TikTok</strong>!
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/media/scripts"
                        className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-[#00AFA9] bg-gray-50 hover:bg-teal-50/50 rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5"
                    >
                        <FileText className="w-4 h-4" />
                        Kịch bản Media
                    </Link>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Input & Configurations (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Voice Selection */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Headphones className="w-4 h-4 text-[#00AFA9]" />
                            1. Chọn Giọng đọc AI phù hợp
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {VOICES.map((v) => {
                                const isSelected = selectedVoice === v.id;
                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVoice(v.id)}
                                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                                            isSelected 
                                                ? "border-[#00AFA9] bg-teal-50/30 shadow-sm ring-2 ring-[#00AFA9]/20" 
                                                : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-3xl">{v.avatar}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-gray-900 text-sm">
                                                        {v.name}
                                                    </h3>
                                                    {isSelected && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[#00AFA9]" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {v.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2.5 pt-2 border-t border-gray-100/80">
                                            <span className="text-[11px] font-medium text-[#00AFA9] block">
                                                {v.tag}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Speed & Pitch Controls */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-[#00AFA9]" />
                                2. Tốc độ nói
                            </label>
                            <span className="text-xs text-gray-400">
                                Khuyên dùng 1.15x cho video TikTok/Reels để giữ chân người xem
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SPEED_PRESETS.map((p) => {
                                const isSelected = selectedSpeed === p.value;
                                return (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setSelectedSpeed(p.value)}
                                        className={`py-2.5 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                                            isSelected 
                                                ? "border-[#00AFA9] bg-teal-50 text-[#00AFA9] font-bold shadow-sm" 
                                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 text-sm">
                                            <span>{p.label}</span>
                                            {p.highlight && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {p.desc}
                                        </span>
                                    </button>
                                );
                            })}
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
                                <button
                                    type="button"
                                    onClick={handlePaste}
                                    className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Dán từ bộ nhớ tạm
                                </button>
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
                                placeholder="Nhập hoặc dán lời thoại kịch bản video vào đây... Ví dụ: Xin chào cả nhà, hôm nay kho LYHU lại cập bến thêm một lô bánh phồng tôm Sa Giang siêu ngon..."
                                className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#00AFA9] focus:ring-2 focus:ring-[#00AFA9]/20 outline-none text-gray-800 text-sm leading-relaxed transition-all resize-y placeholder:text-gray-400"
                            />
                        </div>

                        {/* Metrics Bar */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                            <div className="flex items-center gap-4">
                                <span>{text.length} ký tự</span>
                                <span>•</span>
                                <span>{wordCount} từ</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-[#00AFA9] font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    Ước tính video: ~{estimatedSeconds}s
                                </span>
                            </div>

                            {text && (
                                <button
                                    type="button"
                                    onClick={copyText}
                                    className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
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
                                        <span>Đang tạo file MP3...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>TẠO FILE MP3 ĐỂ GHÉP VIDEO</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={speakWithBrowser}
                                disabled={!text.trim()}
                                className={`py-3.5 px-4 rounded-xl font-semibold border transition-all flex items-center justify-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isBrowserSpeaking 
                                        ? "bg-amber-500 text-white border-amber-600 animate-pulse shadow-md" 
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                                title="Bấm để máy tính đọc ngay tức thì không cần đợi tạo file"
                            >
                                <Volume2 className="w-4 h-4" />
                                <span>{isBrowserSpeaking ? "Dừng đọc" : "Nghe thử tức thì"}</span>
                            </button>
                        </div>
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

                                {/* Waveform mock / visual */}
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

                                {/* Download MP3 Button (Huge & Prominent) */}
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
                                        Chưa có bản ghi âm nào
                                    </h3>
                                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                        Dán lời thoại vào khung bên trái rồi bấm <strong>"Tạo Giọng Đọc AI"</strong>. File âm thanh MP3 sẽ xuất hiện tại đây ngay tức thì.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* How to Dub Video with CapCut Guide */}
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
                                    <strong className="text-white">Viết lời thoại:</strong> Gõ nội dung muốn nói (ví dụ mô tả món ăn, khuyến mãi sỉ), chọn giọng Nữ Hoài My hoặc Nam Minh.
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-white/10 font-bold text-white flex items-center justify-center shrink-0 text-[11px]">
                                    2
                                </span>
                                <div>
                                    <strong className="text-white">Bấm "Tải file MP3":</strong> Nghe thử thấy vừa ý thì bấm tải file MP3 về máy tính hoặc điện thoại.
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-white/10 font-bold text-white flex items-center justify-center shrink-0 text-[11px]">
                                    3
                                </span>
                                <div>
                                    <strong className="text-white">Kéo vào CapCut:</strong> Mở CapCut $\rightarrow$ Thêm video đã quay $\rightarrow$ Bấm <em>"Thêm âm thanh (Audio)"</em> $\rightarrow$ Chọn file MP3 vừa tải $\rightarrow$ Khớp video là xong 1 video triệu view!
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Không tốn chi phí phòng thu</span>
                            <span className="text-teal-300 font-medium">100% Miễn phí trọn đời</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
