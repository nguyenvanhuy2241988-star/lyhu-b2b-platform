import React, { useState, useRef, useEffect } from "react";
import {
    FileText,
    Sparkles,
    CheckCircle2,
    Radio,
    Wand2,
    Loader2,
    Copy,
    Mic,
    Square,
    Volume2,
    Pause,
    ArrowRight,
    Camera,
    Zap,
    MessageSquare,
    Send,
    Bot,
    User,
    Check,
    RotateCcw
} from "lucide-react";
import { LYHU_TEMPLATES } from "../../lib/constants";

interface Step1ScriptProps {
    selectedVoiceText: string;
    setSelectedVoiceText: (text: string) => void;
    customHookTitle?: string;
    setCustomHookTitle?: (val: string) => void;
    voiceDuration: number;
    selectedVoiceAudioUrl: string | null;
    scriptInputMode: "ai_chat" | "ai_prompt" | "clone_link" | "templates";
    setScriptInputMode: (mode: "ai_chat" | "ai_prompt" | "clone_link" | "templates") => void;
    cloneTopic: string;
    setCloneTopic: (topic: string) => void;
    handleCloneStyle: (topic: string, link: string) => void;
    isAnalyzingClone: boolean;
    analyzingStepText: string;
    cloneLink?: string;
    setCloneLink?: (link: string) => void;
    cloneRefLink?: string;
    setCloneRefLink?: (link: string) => void;
    activeTemplateId?: string | null;
    setActiveTemplateId?: (id: string | null) => void;
    handleApplyTemplate?: (template: any) => void;
    onOneClickProduction?: (templateId: string) => void;
    isOneClickBuilding?: boolean;
    isSynthesizingVoice: boolean;
    selectedVoiceEngine: "gemini" | "edge" | "elevenlabs";
    setSelectedVoiceEngine: (val: "gemini" | "edge" | "elevenlabs") => void;
    selectedVoiceStyleId: string;
    setSelectedVoiceStyleId: (val: string) => void;
    voiceSpeedMultiplier: number;
    setVoiceSpeedMultiplier: (val: number) => void;
    generateSpeechForText: (text: string, style?: string, engine?: "gemini" | "edge" | "elevenlabs") => void;
    isRecordingMic: boolean;
    recordingSeconds: number;
    handleStartMicRecording: () => void;
    handleStopMicRecording: () => void;
    handleVoiceUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    audioInputRef: React.RefObject<any>;
    isAuditionPlaying: boolean;
    handleToggleAuditionVoice: () => void;
    cloneStoryboard: string[];
    handleCopyDirectorShotlist: () => void;
    onNext: () => void;
}

export const Step1Script: React.FC<Step1ScriptProps> = ({
    selectedVoiceText,
    setSelectedVoiceText,
    customHookTitle,
    setCustomHookTitle,
    voiceDuration,
    selectedVoiceAudioUrl,
    scriptInputMode,
    setScriptInputMode,
    cloneTopic,
    setCloneTopic,
    handleCloneStyle,
    isAnalyzingClone,
    analyzingStepText,
    cloneLink,
    setCloneLink,
    cloneRefLink,
    setCloneRefLink,
    activeTemplateId,
    setActiveTemplateId,
    handleApplyTemplate,
    onOneClickProduction,
    isOneClickBuilding = false,
    isSynthesizingVoice,
    selectedVoiceEngine,
    setSelectedVoiceEngine,
    selectedVoiceStyleId,
    setSelectedVoiceStyleId,
    voiceSpeedMultiplier,
    setVoiceSpeedMultiplier,
    generateSpeechForText,
    isRecordingMic,
    recordingSeconds,
    handleStartMicRecording,
    handleStopMicRecording,
    handleVoiceUpload,
    audioInputRef,
    isAuditionPlaying,
    handleToggleAuditionVoice,
    cloneStoryboard,
    handleCopyDirectorShotlist,
    onNext
}) => {
    const effectiveCloneLink = cloneLink ?? cloneRefLink ?? "";
    const handleUpdateCloneLink = (val: string) => {
        setCloneLink?.(val);
        setCloneRefLink?.(val);
    };
    const wordCount = selectedVoiceText.split(/\s+/).filter(Boolean).length;
    const estDuration = Math.round(wordCount / 3.2);

    // ── AI CHAT CO-WRITER STATE ──
    interface ChatMessage {
        id: string;
        role: "user" | "assistant";
        content: string;
        scriptDraft?: {
            hookTitle: string;
            script: string;
            estimatedSeconds?: number;
            pacing?: number;
            scenes?: Array<{ visual: string; audio: string }>;
        } | null;
        timestamp: string;
    }

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: "msg_welcome",
            role: "assistant",
            content: "Xin chào! Tôi là AI Đạo Diễn & Biên Kịch kịch bản video ngắn triệu view của LYHU. Hãy trò chuyện với tôi về ý tưởng hoặc sản phẩm bạn muốn làm video (Khoai môn CVT, Bột phô mai BOYO, Kẹo UHi, Bánh tráng Abi...). Tôi sẽ cùng bạn trao đổi, điều chỉnh câu chữ và chốt kịch bản ưng ý nhất!",
            scriptDraft: null,
            timestamp: "Mới"
        }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [isChatSending, setIsChatSending] = useState(false);
    const [appliedChatId, setAppliedChatId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scriptInputMode === "ai_chat") {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, scriptInputMode]);

    const handleSendChatMessage = async (userPromptText?: string) => {
        const textToSend = (userPromptText || chatInput).trim();
        if (!textToSend || isChatSending) return;

        const userMsg: ChatMessage = {
            id: `user_${Date.now()}`,
            role: "user",
            content: textToSend,
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };

        const newHistory = [...chatMessages, userMsg];
        setChatMessages(newHistory);
        setChatInput("");
        setIsChatSending(true);

        try {
            const payloadMessages = newHistory.map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await fetch("/api/ai/script-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: payloadMessages,
                    currentScript: selectedVoiceText,
                    currentHookTitle: customHookTitle
                })
            });

            const data = await res.json();
            if (data.success) {
                const aiMsg: ChatMessage = {
                    id: `ai_${Date.now()}`,
                    role: "assistant",
                    content: data.reply || "Dưới đây là phương án kịch bản tối ưu dành cho bạn:",
                    scriptDraft: data.scriptDraft || null,
                    timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                };
                setChatMessages(prev => [...prev, aiMsg]);
            } else {
                throw new Error(data.error || "Không thể nhận phản hồi từ AI");
            }
        } catch (err: any) {
            setChatMessages(prev => [
                ...prev,
                {
                    id: `err_${Date.now()}`,
                    role: "assistant",
                    content: `⚠️ Có lỗi xảy ra: ${err?.message || "Không thể kết nối đến AI Biên Kịch"}. Vui lòng thử lại!`,
                    scriptDraft: null,
                    timestamp: "Lỗi"
                }
            ]);
        } finally {
            setIsChatSending(false);
        }
    };

    const handleApplyScriptDraft = (draft: { hookTitle: string; script: string }, msgId: string) => {
        setSelectedVoiceText(draft.script);
        if (setCustomHookTitle && draft.hookTitle) {
            setCustomHookTitle(draft.hookTitle);
        }
        setAppliedChatId(msgId);
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 1: Kịch Bản Bán Buôn & Lồng Tiếng AI</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                                Chuẩn LYHU B2B
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Viết lời thoại bán hàng chuẩn TikTok/Reels và tạo giọng đọc tự nhiên.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedVoiceAudioUrl ? (
                        <span className="text-[11px] font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-3 py-1 rounded-md flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                            <span>Đã có giọng đọc ({voiceDuration.toFixed(1)}s)</span>
                        </span>
                    ) : (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-slate-400" />
                            <span>Chưa thu âm giọng đọc</span>
                        </span>
                    )}
                </div>
            </div>

            {/* ⚡ 1-CLICK PRODUCTION QUICK LAUNCH BAR */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-teal-500/10 via-primary-500/10 to-emerald-500/10 border border-primary-200 space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-primary-600 text-white shadow-xs">
                            <Zap className="w-4 h-4" />
                        </span>
                        <div>
                            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>⚡ Tạo Nhanh Video 1-Chạm (LYHU Quick Production)</span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-primary-100 text-primary-800">
                                    Siêu Tốc 15s
                                </span>
                            </h3>
                            <p className="text-[11px] text-slate-600">
                                Tự động nạp kịch bản sỉ + clip B-roll + lồng tiếng Gemini 3.8 Flash TTS + cắt gọt khớp 100%!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LYHU_TEMPLATES.map((tpl) => (
                        <button
                            key={tpl.id}
                            type="button"
                            onClick={() => onOneClickProduction ? onOneClickProduction(tpl.id) : handleApplyTemplate?.(tpl)}
                            disabled={isOneClickBuilding || isSynthesizingVoice}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 bg-white hover:border-primary-400 hover:shadow-xs ${
                                activeTemplateId === tpl.id ? "border-primary-500 ring-2 ring-primary-100" : "border-slate-200"
                            } disabled:opacity-60`}
                        >
                            <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{tpl.badge}</span>
                            <span className="text-[10px] text-primary-700 font-semibold flex items-center gap-1">
                                {isOneClickBuilding ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin text-primary-600" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3 h-3 text-primary-600" />
                                        <span>Tạo 1-chạm</span>
                                    </>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Script Creation Suite */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary-600" />
                        <label className="text-xs font-bold text-slate-800">
                            Phương thức soạn kịch bản:
                        </label>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("ai_chat")}
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                scriptInputMode === "ai_chat"
                                    ? "bg-primary-500 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat AI Biên Kịch</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("ai_prompt")}
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                scriptInputMode === "ai_prompt"
                                    ? "bg-primary-500 text-white"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            AI Theo Chủ Đề
                        </button>
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("clone_link")}
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                scriptInputMode === "clone_link"
                                    ? "bg-primary-500 text-white"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Phân Tích Link Mẫu
                        </button>
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("templates")}
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                scriptInputMode === "templates"
                                    ? "bg-primary-500 text-white"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Mẫu Chuẩn LYHU
                        </button>
                    </div>
                </div>

                {/* TAB 0: CHAT 2 CHIỀU VỚI AI BIÊN KỊCH (CHATGPT / GEMINI) */}
                {scriptInputMode === "ai_chat" && (
                    <div className="space-y-3">
                        {/* Quick Prompts Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 font-medium">Gợi ý nhanh:</span>
                            {[
                                {
                                    label: "🔥 Khoai Môn CVT Trứng Cua",
                                    prompt: "Viết kịch bản video TikTok 25s cho sản phẩm Khoai môn sấy CVT vị trứng cua & nấm truffle, nhắm đến quán karaoke, beer club nhập sỉ. Phong cách giòn rụm bắt mắt, chốt sỉ tận gốc."
                                },
                                {
                                    label: "🧀 Bột Phô Mai BOYO 1kg",
                                    prompt: "Viết kịch bản video TikTok 20s cho Bột phô mai BOYO 1kg, nhắm đến chủ quán khoai lắc và gà rán. Nhấn mạnh thơm nồng béo ngậy, 1 vốn 4 lời, giao nhanh."
                                },
                                {
                                    label: "🍬 Kẹo UHi Hàn Quốc",
                                    prompt: "Viết kịch bản video ngắn cho Kẹo hoa quả UHi nhập khẩu độc quyền Hàn Quốc, date mới toanh cho chuỗi siêu thị và mini mart."
                                },
                                {
                                    label: "📦 Bánh Tráng Abi Snack Sỉ",
                                    prompt: "Viết kịch bản xả kho sỉ 100 thùng bánh tráng Abi bơ mỡ hành và da cá hoàng kim, chiết khấu sâu cho đại lý sỉ đồ ăn vặt."
                                }
                            ].map((chip, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSendChatMessage(chip.prompt)}
                                    disabled={isChatSending}
                                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        {/* Chat Messages Log */}
                        <div className="bg-white rounded-xl border border-slate-200 p-3 max-h-[360px] min-h-[180px] overflow-y-auto space-y-3 shadow-inner">
                            {chatMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2.5 ${
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed space-y-2 ${
                                            msg.role === "user"
                                                ? "bg-primary-600 text-white rounded-tr-xs"
                                                : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-xs"
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.content}</p>

                                        {/* If Assistant proposed a script draft */}
                                        {msg.scriptDraft && (
                                            <div className="mt-2.5 p-3 rounded-lg bg-white border border-primary-200 shadow-xs space-y-2 text-slate-900">
                                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                                    <span className="text-[10px] uppercase font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                                                        🎯 Kịch bản đề xuất
                                                    </span>
                                                    {msg.scriptDraft.estimatedSeconds && (
                                                        <span className="text-[10px] text-slate-500 font-medium">
                                                            ~{msg.scriptDraft.estimatedSeconds}s đọc
                                                        </span>
                                                    )}
                                                </div>

                                                {msg.scriptDraft.hookTitle && (
                                                    <div className="bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded text-[11px] font-bold text-amber-900">
                                                        {msg.scriptDraft.hookTitle}
                                                    </div>
                                                )}

                                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-medium text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                                                    {msg.scriptDraft.script}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyScriptDraft(msg.scriptDraft!, msg.id)}
                                                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                                        appliedChatId === msg.id
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-primary-500 hover:bg-primary-600 text-white"
                                                    }`}
                                                >
                                                    {appliedChatId === msg.id ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            <span>✓ Đã Áp Dụng Vào Kịch Bản Video</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-4 h-4" />
                                                            <span>⚡ Chốt & Áp Dụng Kịch Bản Này Vào Video</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        <div
                                            className={`text-[9px] text-right ${
                                                msg.role === "user" ? "text-primary-100" : "text-slate-400"
                                            }`}
                                        >
                                            {msg.timestamp}
                                        </div>
                                    </div>

                                    {msg.role === "user" && (
                                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isChatSending && (
                                <div className="flex gap-2.5 items-center text-xs text-primary-700 bg-primary-50 border border-primary-200 p-2.5 rounded-lg w-fit">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
                                    <span>AI Đạo Diễn đang soạn kịch bản theo phản hồi của bạn...</span>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input Bar */}
                        <div className="space-y-1.5">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendChatMessage();
                                }}
                                className="flex gap-2 items-center"
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Trao đổi với AI (VD: Sửa câu đầu giật gân hơn, rút ngắn còn 20s, thêm giá sỉ...)"
                                    disabled={isChatSending}
                                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary-500 text-slate-800 font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isChatSending}
                                    className="py-2 px-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                                >
                                    {isChatSending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                    <span>Gửi</span>
                                </button>
                            </form>

                            {/* Quick refinement suggestions */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-slate-500">
                                <span>Phản hồi nhanh:</span>
                                {[
                                    "✂️ Rút ngắn kịch bản còn 20 giây",
                                    "🔥 Viết câu mở đầu giật gân hơn nữa",
                                    "📦 Nhấn mạnh giá sỉ tận xưởng & miễn phí ship",
                                    "😄 Đổi sang phong cách vui nhộn, hài hước",
                                    "🎯 Thêm lời kêu gọi inbox nhận mẫu thử"
                                ].map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendChatMessage(prompt)}
                                        disabled={isChatSending}
                                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 1: AI Viết Theo Sản Phẩm / Ý Tưởng */}
                {scriptInputMode === "ai_prompt" && (
                    <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                                type="text"
                                value={cloneTopic}
                                onChange={(e) => setCloneTopic(e.target.value)}
                                placeholder="Nhập chủ đề video (VD: Khoai môn CVT về kho, Bột phô mai Boyo lắc khoai, Kẹo UHi Hàn Quốc...)"
                                className="sm:col-span-8 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary-500 font-medium text-slate-800"
                            />
                            <button
                                type="button"
                                onClick={() => handleCloneStyle(cloneTopic, "")}
                                disabled={isAnalyzingClone || isSynthesizingVoice}
                                className="sm:col-span-4 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {isAnalyzingClone || isSynthesizingVoice ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>{analyzingStepText || "Đang xử lý..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>AI Viết Kịch Bản & Thu Giọng</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Quick topic pills for all 4 LYHU products */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                            <span className="text-[11px] text-slate-500 font-medium">Sản phẩm LYHU:</span>
                            {[
                                {
                                    label: "Bột Phô Mai BOYO 1kg",
                                    topic: "Bột phô mai BOYO 1kg cho quán khoai tây lắc và gà rán giòn rụm"
                                },
                                {
                                    label: "Khoai Môn CVT Độc Quyền",
                                    topic: "Thanh khoai môn CVT tẩm vị trứng cua và nấm truffle nhập khẩu độc quyền cho quán Karaoke và siêu thị"
                                },
                                {
                                    label: "Kẹo UHi Hàn Quốc",
                                    topic: "Kẹo hoa quả UHi nhập khẩu độc quyền Hàn Quốc cho chuỗi siêu thị và mini mart"
                                },
                                {
                                    label: "Bánh Tráng Abi Snack",
                                    topic: "Bánh tráng Abi Snack bơ mỡ hành và da cá hoàng kim giá sỉ miền Bắc"
                                }
                            ].map((pill, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setCloneTopic(pill.topic);
                                        handleCloneStyle(pill.topic, "");
                                    }}
                                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 transition-colors text-[11px] font-medium cursor-pointer"
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: Phân Tích & Học Phong Cách Từ Link Video Mẫu */}
                {scriptInputMode === "clone_link" && (
                    <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                                type="url"
                                value={effectiveCloneLink}
                                onChange={(e) => handleUpdateCloneLink(e.target.value)}
                                placeholder="Dán link video TikTok / Douyin / Reels / Shorts bạn muốn học phong cách..."
                                className="sm:col-span-8 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-primary-500 font-medium text-slate-800"
                            />
                            <button
                                type="button"
                                onClick={() => handleCloneStyle(cloneTopic || "Sỉ đồ ăn vặt LYHU", effectiveCloneLink)}
                                disabled={isAnalyzingClone || isSynthesizingVoice || !effectiveCloneLink.trim()}
                                className="sm:col-span-4 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {isAnalyzingClone ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Đang bóc tách video...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Học Phong Cách & Viết Kịch Bản</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Hệ thống sẽ bóc tách nhịp điệu, cấu trúc Hook 3s đầu và chuyển đổi sang phiên bản B2B của công ty LYHU.
                        </p>
                    </div>
                )}

                {/* TAB 3: Kho Kịch Bản Mẫu Bán Buôn LYHU */}
                {scriptInputMode === "templates" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {LYHU_TEMPLATES.map((tmpl) => {
                            const isSelected = activeTemplateId === tmpl.id;
                            return (
                                <button
                                    key={tmpl.id}
                                    type="button"
                                    onClick={() => {
                                        if (handleApplyTemplate) {
                                            handleApplyTemplate(tmpl);
                                        } else {
                                            setSelectedVoiceText(tmpl.script);
                                            generateSpeechForText(tmpl.script, selectedVoiceStyleId, selectedVoiceEngine);
                                        }
                                        setActiveTemplateId?.(tmpl.id);
                                    }}
                                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer group ${
                                        isSelected
                                            ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                                            : "border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className={`font-bold ${isSelected ? "text-primary-800" : "text-slate-800 group-hover:text-primary-800"}`}>
                                            {tmpl.title}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {tmpl.badge}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                        {tmpl.script}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Script Text Area */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Lời thoại kịch bản:</span>
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {wordCount} từ • ước tính ~{estDuration}s đọc
                        </span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                        Có thể chỉnh sửa trực tiếp nội dung bên dưới
                    </span>
                </div>

                <textarea
                    rows={4}
                    value={selectedVoiceText}
                    onChange={(e) => setSelectedVoiceText(e.target.value)}
                    placeholder="Nhập nội dung lời thoại kịch bản video..."
                    className="w-full p-3 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 leading-relaxed font-normal"
                />
            </div>

            {/* TTS & Voice Settings Controls */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Voice Engine */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Công nghệ AI TTS:</label>
                        <select
                            value={selectedVoiceEngine}
                            onChange={(e) => setSelectedVoiceEngine(e.target.value as any)}
                            className="w-full px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-primary-500"
                        >
                            <option value="gemini">Google Gemini Omni Audio (Kore, Aoede, Puck, Fenrir - Đỉnh cao cảm xúc)</option>
                            <option value="elevenlabs">ElevenLabs Multilingual v2 (Flow Engine - Nhân bản giọng nói)</option>
                            <option value="edge">Microsoft Studio Neural (Hoài My & Nam Minh - Dự phòng kết nối)</option>
                        </select>
                    </div>

                    {/* Voice Personas */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Giọng đọc tiếng Việt:</label>
                        <select
                            value={selectedVoiceStyleId}
                            onChange={(e) => {
                                const newStyle = e.target.value;
                                setSelectedVoiceStyleId(newStyle);
                                if (selectedVoiceText && selectedVoiceText.trim()) {
                                    generateSpeechForText(selectedVoiceText, newStyle, selectedVoiceEngine);
                                }
                            }}
                            className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-primary-500"
                        >
                            <option value="female-genz">Nữ Gen Z (Kore - Cuốn hút, tự nhiên chuẩn TikTok Creator)</option>
                            <option value="female-sweet">Nữ Dịu Dàng (Aoede - Ấm áp, tâm sự, truyền cảm xúc)</option>
                            <option value="female-pro">Nữ Chuyên Nghiệp (Leda - Rõ ràng, tin cậy, bán buôn B2B)</option>
                            <option value="male-genz">Nam Gen Z (Puck - Năng động, hài hước, dứt khoát)</option>
                            <option value="male-pro">Nam Chuyên Nghiệp (Fenrir - Trầm ấm, uy tín, phát thanh viên)</option>
                        </select>
                    </div>

                    {/* Speaking Speed */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Tốc độ nhịp nói ({voiceSpeedMultiplier}x):</label>
                        <div className="grid grid-cols-4 gap-1">
                            {[
                                { speed: 0.85, label: "0.85x" },
                                { speed: 1.0, label: "1.0x" },
                                { speed: 1.15, label: "1.15x" },
                                { speed: 1.25, label: "1.25x" }
                            ].map((item) => (
                                <button
                                    key={item.speed}
                                    type="button"
                                    onClick={() => setVoiceSpeedMultiplier(item.speed)}
                                    className={`py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors text-center border cursor-pointer ${
                                        voiceSpeedMultiplier === item.speed
                                            ? "bg-primary-500 text-white border-primary-500"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Audio Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                        {isRecordingMic ? (
                            <button
                                type="button"
                                onClick={handleStopMicRecording}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Dừng thu mic ({recordingSeconds}s)</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStartMicRecording}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs border border-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Mic className="w-3.5 h-3.5 text-primary-600" />
                                <span>Thu Mic Trực Tiếp</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs border border-slate-200 font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>Tải MP3 từ máy</span>
                        </button>
                        <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*,.mp3,.m4a,.wav"
                            onChange={handleVoiceUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleToggleAuditionVoice}
                            disabled={isSynthesizingVoice || !selectedVoiceAudioUrl}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                                isAuditionPlaying
                                    ? "bg-primary-50 text-primary-800 border-primary-300"
                                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                            }`}
                        >
                            {isAuditionPlaying ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 text-primary-600" />
                                    <span>Tạm dừng</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-3.5 h-3.5 text-primary-600" />
                                    <span>Nghe thử giọng</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => generateSpeechForText(selectedVoiceText, selectedVoiceStyleId, selectedVoiceEngine)}
                            disabled={isSynthesizingVoice}
                            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
                    </div>
                </div>
            </div>

            {/* Storyboard shotlist guide */}
            {cloneStoryboard.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-primary-600" />
                            <span>Gợi ý phân cảnh quay (2.5s - 3s/cảnh):</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyDirectorShotlist}
                            className="text-[11px] font-semibold text-primary-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <Copy className="w-3 h-3" />
                            <span>Sao chép kịch bản</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {cloneStoryboard.map((shot, idx) => (
                            <div key={idx} className="p-2 rounded-md bg-white border border-slate-200 text-[11px] space-y-0.5">
                                <div className="font-bold text-primary-700 text-[10px]">CẢNH {idx + 1}</div>
                                <div className="text-slate-600 line-clamp-3 leading-snug">{shot}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation to Next Step */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Bước 1 / 4 • Tiếp theo: Chọn góc quay & B-roll
                </span>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                    <span>Tiếp tục: Bước 2 - Chọn Cảnh & B-Roll</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
