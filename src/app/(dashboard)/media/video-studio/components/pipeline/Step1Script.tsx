import React from "react";
import {
    FileText,
    CheckCircle2,
    Radio,
    Sparkles,
    Wand2,
    Loader2,
    Mic,
    Square,
    Volume2,
    Pause,
    Camera,
    Copy,
    ArrowRight
} from "lucide-react";
import { LyhuTemplate } from "../../types";
import { LYHU_TEMPLATES } from "../../lib/constants";

interface Step1ScriptProps {
    selectedVoiceAudioUrl: string | null;
    voiceDuration: number;
    scriptInputMode: "ai_prompt" | "clone_link" | "templates";
    setScriptInputMode: (mode: "ai_prompt" | "clone_link" | "templates") => void;
    cloneTopic: string;
    setCloneTopic: (val: string) => void;
    handleCloneStyle: (topic: string, link: string) => void;
    isAnalyzingClone: boolean;
    isSynthesizingVoice: boolean;
    analyzingStepText: string;
    cloneLink: string;
    setCloneLink: (val: string) => void;
    activeTemplateId: string | null;
    setActiveTemplateId: (val: string | null) => void;
    handleApplyTemplate: (tpl: LyhuTemplate) => void;
    selectedVoiceText: string;
    setSelectedVoiceText: (val: string) => void;
    selectedVoiceEngine: "gemini" | "edge" | "elevenlabs";
    setSelectedVoiceEngine: (val: "gemini" | "edge" | "elevenlabs") => void;
    selectedVoiceStyleId: string;
    setSelectedVoiceStyleId: (val: string) => void;
    voiceSpeedMultiplier: number;
    setVoiceSpeedMultiplier: (val: number) => void;
    generateSpeechForText: (text: string, voiceId?: string, engine?: any) => Promise<string | null>;
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
    selectedVoiceAudioUrl,
    voiceDuration,
    scriptInputMode,
    setScriptInputMode,
    cloneTopic,
    setCloneTopic,
    handleCloneStyle,
    isAnalyzingClone,
    isSynthesizingVoice,
    analyzingStepText,
    cloneLink,
    setCloneLink,
    activeTemplateId,
    setActiveTemplateId,
    handleApplyTemplate,
    selectedVoiceText,
    setSelectedVoiceText,
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
    const wordCount = selectedVoiceText.split(/\s+/).filter(Boolean).length;
    const estDuration = Math.round(wordCount / 3.2);

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                        <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Bước 1: Kịch Bản Bán Buôn & Giọng Đọc AI Đồng Bộ</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                                Gemini 3.8 Flash + Edge Neural
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Tự động viết lời thoại hấp dẫn chuẩn TikTok & thu âm giọng đọc tự nhiên trong 3 giây.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedVoiceAudioUrl ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã có giọng đọc ({voiceDuration.toFixed(1)}s)</span>
                        </span>
                    ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                            <Radio className="w-3.5 h-3.5 text-amber-600" />
                            <span>Chưa thu âm giọng đọc</span>
                        </span>
                    )}
                </div>
            </div>

            {/* 3-in-1 AI Script Creation Suite */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/70 via-slate-50 to-white border border-teal-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <label className="text-xs font-bold text-teal-950">
                            Chọn Phương Thức Tạo Kịch Bản:
                        </label>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-teal-200/80 shadow-sm self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("ai_prompt")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                scriptInputMode === "ai_prompt"
                                    ? "bg-teal-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                            }`}
                        >
                            ✨ AI Theo Chủ Đề
                        </button>
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("clone_link")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                scriptInputMode === "clone_link"
                                    ? "bg-teal-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                            }`}
                        >
                            🔗 Phân Tích Link Mẫu
                        </button>
                        <button
                            type="button"
                            onClick={() => setScriptInputMode("templates")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                scriptInputMode === "templates"
                                    ? "bg-teal-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                            }`}
                        >
                            📋 Mẫu Chuẩn LYHU
                        </button>
                    </div>
                </div>

                {/* TAB 1: AI Viết Theo Sản Phẩm / Ý Tưởng */}
                {scriptInputMode === "ai_prompt" && (
                    <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <input
                                type="text"
                                value={cloneTopic}
                                onChange={(e) => setCloneTopic(e.target.value)}
                                placeholder="Nhập chủ đề video (VD: Khoai môn CVT về kho, Bột phô mai Boyo lắc khoai, Kẹo UHi Hàn Quốc...)"
                                className="sm:col-span-8 px-3.5 py-2.5 text-xs rounded-xl border border-teal-200 bg-white focus:outline-none focus:border-teal-500 font-medium text-slate-800 shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => handleCloneStyle(cloneTopic, "")}
                                disabled={isAnalyzingClone || isSynthesizingVoice}
                                className="sm:col-span-4 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {isAnalyzingClone || isSynthesizingVoice ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{analyzingStepText || "Đang xử lý..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 text-amber-300" />
                                        <span>✨ AI Viết Kịch Bản & Thu Giọng</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Quick topic pills for all 4 LYHU products */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                            <span className="text-[11px] text-slate-400 font-medium">Gợi ý 4 sản phẩm LYHU:</span>
                            {[
                                {
                                    label: "🧀 Bột Phô Mai BOYO 1kg",
                                    topic: "Bột phô mai BOYO 1kg cho quán khoai tây lắc và gà rán giòn rụm"
                                },
                                {
                                    label: "🍠 Khoai Môn CVT Độc Quyền",
                                    topic: "Thanh khoai môn CVT tẩm vị trứng cua và nấm truffle nhập khẩu độc quyền cho quán Karaoke và siêu thị"
                                },
                                {
                                    label: "🍬 Kẹo UHi Hàn Quốc",
                                    topic: "Kẹo hoa quả UHi nhập khẩu độc quyền Hàn Quốc cho chuỗi siêu thị và mini mart"
                                },
                                {
                                    label: "🍘 Bánh Tráng Abi Snack",
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
                                    className="px-2.5 py-1 rounded-lg bg-white border border-teal-200/90 text-teal-800 hover:bg-teal-600 hover:text-white transition-all text-[11px] font-semibold cursor-pointer shadow-2xs"
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
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <input
                                type="url"
                                value={cloneLink}
                                onChange={(e) => setCloneLink(e.target.value)}
                                placeholder="Dán link video TikTok / Douyin / Reels / Shorts mẫu vào đây..."
                                className="sm:col-span-8 px-3.5 py-2.5 text-xs rounded-xl border border-teal-200 bg-white focus:outline-none focus:border-teal-500 font-medium text-slate-800 shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => handleCloneStyle(cloneTopic, cloneLink)}
                                disabled={isAnalyzingClone || isSynthesizingVoice || !cloneLink.trim()}
                                className="sm:col-span-4 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {isAnalyzingClone || isSynthesizingVoice ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{analyzingStepText || "Đang clone phong cách..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 text-amber-300" />
                                        <span>🔗 Phân Tích & Viết Kịch Bản</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            💡 AI sẽ phân tích cấu trúc hook, nhịp nói, từ khóa kêu gọi hành động của video link và áp dụng cho sản phẩm công ty LYHU (BOYO, CVT, UHi, Abi Snack).
                        </p>
                    </div>
                )}

                {/* TAB 3: Chọn Từ Kho Kịch Bản Mẫu Sẵn Có */}
                {scriptInputMode === "templates" && (
                    <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-600">
                            Chọn 1 mẫu kịch bản chuẩn bán sỉ LYHU:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {LYHU_TEMPLATES.map((tpl) => {
                                const isActive = activeTemplateId === tpl.id;
                                return (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => handleApplyTemplate(tpl)}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                            isActive
                                                ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
                                                : "bg-white hover:bg-slate-50 border-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-bold text-teal-800">
                                                {tpl.badge}
                                            </span>
                                            {isActive ? (
                                                <span className="text-[9px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-bold">
                                                    ĐANG DÙNG
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-400 group-hover:text-teal-600">
                                                    Áp dụng
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                                            {tpl.hookTitle}
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                                            {tpl.title}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Script Text Editor */}
            <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-800">
                            🎙️ Lời thoại kịch bản:
                        </label>
                        {activeTemplateId ? (
                            <span className="text-[10px] bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
                                Đang dùng mẫu: {LYHU_TEMPLATES.find((t) => t.id === activeTemplateId)?.badge || activeTemplateId}
                            </span>
                        ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                                ✨ Kịch bản tùy chỉnh / AI tạo riêng
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono font-medium">
                        {wordCount} từ • ~{estDuration}s đọc
                    </span>
                </div>
                <textarea
                    rows={4}
                    value={selectedVoiceText}
                    onChange={(e) => {
                        setSelectedVoiceText(e.target.value);
                        setActiveTemplateId(null);
                    }}
                    placeholder="Nhập hoặc để AI tạo nội dung lời thoại kịch bản..."
                    className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none leading-relaxed text-slate-800 font-medium bg-slate-50/50 focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                    💡 Bạn có thể chỉnh sửa lời thoại trực tiếp ở trên. Bấm <strong>"🎙️ Thu Lại Giọng AI"</strong> để cập nhật âm thanh mới.
                </p>
            </div>

            {/* Voiceover Synthesis & Engine Controls */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Công nghệ AI */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Công nghệ AI TTS:</label>
                        <select
                            value={selectedVoiceEngine}
                            onChange={(e) => setSelectedVoiceEngine(e.target.value as any)}
                            className="w-full px-2.5 py-2 text-xs font-semibold rounded-lg border border-teal-300 bg-white text-teal-950 outline-none focus:border-teal-500 font-bold"
                        >
                            <option value="gemini">✨ Google Gemini Flash Audio (Kore, Aoede, Puck, Fenrir - Đỉnh Cao AI)</option>
                            <option value="elevenlabs">🧬 ElevenLabs Voice Cloning (Giọng Nhân Bản AI)</option>
                            <option value="edge">🎙️ Microsoft Edge Neural (Dự Phòng)</option>
                        </select>
                    </div>

                    {/* Giọng đọc */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Giọng đọc tiếng Việt:</label>
                        <select
                            value={selectedVoiceStyleId}
                            onChange={(e) => setSelectedVoiceStyleId(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500 font-medium"
                        >
                            <option value="female-genz">🌸 Nữ Gen Z (Kore - Vui tươi, cuốn hút, chuẩn TikTok)</option>
                            <option value="female-sweet">🎀 Nữ Dịu Dàng (Aoede - Ấm áp, tâm sự, truyền cảm)</option>
                            <option value="female-pro">💎 Nữ Chuyên Nghiệp (Leda - Rõ ràng, tin cậy, đĩnh đạc)</option>
                            <option value="male-genz">⚡ Nam Gen Z (Puck - Năng động, dứt khoát, bắt tai)</option>
                            <option value="male-pro">👔 Nam Chuyên Nghiệp (Fenrir - Trầm ấm, uy tín, phát thanh viên)</option>
                        </select>
                    </div>

                    {/* Tốc độ đọc */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Tốc độ nhịp nói ({voiceSpeedMultiplier}x):</label>
                        <div className="grid grid-cols-4 gap-1">
                            {[
                                { speed: 0.85, label: "0.85x" },
                                { speed: 1.0, label: "1.0x" },
                                { speed: 1.15, label: "1.15x 🔥" },
                                { speed: 1.25, label: "1.25x" }
                            ].map((item) => (
                                <button
                                    key={item.speed}
                                    type="button"
                                    onClick={() => setVoiceSpeedMultiplier(item.speed)}
                                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${
                                        voiceSpeedMultiplier === item.speed
                                            ? "bg-teal-600 text-white shadow-sm"
                                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80">
                    <div className="flex items-center gap-2">
                        {/* Mic Recording */}
                        {isRecordingMic ? (
                            <button
                                type="button"
                                onClick={handleStopMicRecording}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 animate-pulse cursor-pointer shadow-sm"
                            >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Dừng thu mic ({recordingSeconds}s)</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStartMicRecording}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs border border-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Tự thu giọng thật qua micro"
                            >
                                <Mic className="w-3.5 h-3.5 text-rose-500" />
                                <span>Thu Mic Trực Tiếp</span>
                            </button>
                        )}

                        {/* Upload MP3 */}
                        <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs border border-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
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
                        {/* Audition */}
                        <button
                            type="button"
                            onClick={handleToggleAuditionVoice}
                            disabled={isSynthesizingVoice}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border cursor-pointer ${
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
                                    <span>Nghe thử giọng</span>
                                </>
                            )}
                        </button>

                        {/* Re-Synthesize */}
                        <button
                            type="button"
                            onClick={() => generateSpeechForText(selectedVoiceText, selectedVoiceStyleId, selectedVoiceEngine)}
                            disabled={isSynthesizingVoice}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {isSynthesizingVoice ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang thu giọng...</span>
                                </>
                            ) : (
                                <>
                                    <Radio className="w-3.5 h-3.5" />
                                    <span>🎙️ Thu Lại Giọng AI</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Storyboard shotlist guide */}
            {cloneStoryboard.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-teal-600" />
                            <span>Gợi ý 5 góc quay điện ảnh (2.5s - 3s/cảnh):</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyDirectorShotlist}
                            className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <Copy className="w-3 h-3" />
                            <span>Copy gửi Zalo</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {cloneStoryboard.map((shot, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-0.5">
                                <div className="font-bold text-teal-700 text-[10px]">CẢNH {idx + 1}</div>
                                <div className="text-slate-600 line-clamp-3 leading-snug">{shot}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation to Next Step */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Bước 1 / 4 • Tiếp theo: Chọn góc quay & Footage B-roll
                </span>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer transition-all active:scale-95"
                >
                    <span>Tiếp tục: Bước 2 - Chọn Cảnh & B-Roll</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
