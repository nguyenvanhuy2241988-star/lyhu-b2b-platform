import React from "react";
import { FileText, Film, Tag, Music, Bot, CheckCircle2 } from "lucide-react";
import { StudioStep } from "../../types";

interface StudioStepperProps {
    activeStudioStep: StudioStep;
    setActiveStudioStep: (step: StudioStep) => void;
    clipsCount: number;
    hasScript: boolean;
    hasVoice: boolean;
    isExportReady: boolean;
}

export const StudioStepper: React.FC<StudioStepperProps> = ({
    activeStudioStep,
    setActiveStudioStep,
    clipsCount,
    hasScript,
    hasVoice,
    isExportReady
}) => {
    const steps: {
        step: StudioStep;
        num: string;
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        badge: string;
        isDone: boolean;
    }[] = [
        {
            step: "step_script",
            num: "1",
            title: "Kịch Bản & Giọng AI",
            icon: FileText,
            badge: hasVoice ? "Đã có giọng" : hasScript ? "Đã có lời" : "Gemini 3.8",
            isDone: hasScript && hasVoice
        },
        {
            step: "step_clips",
            num: "2",
            title: "Chọn Cảnh & B-Roll",
            icon: Film,
            badge: `${clipsCount} cảnh`,
            isDone: clipsCount > 0
        },
        {
            step: "step_visuals",
            num: "3",
            title: "Tiêu Đề & Huy Hiệu",
            icon: Tag,
            badge: "Viral Badges",
            isDone: clipsCount > 0
        },
        {
            step: "step_audio_export",
            num: "4",
            title: "Âm Thanh & Xuất",
            icon: Music,
            badge: isExportReady ? "Sẵn sàng" : "60 FPS",
            isDone: false
        }
    ];

    return (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {steps.map((s) => {
                        const isCurrent = activeStudioStep === s.step;
                        return (
                            <button
                                key={s.step}
                                type="button"
                                onClick={() => setActiveStudioStep(s.step)}
                                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                                    isCurrent
                                        ? "bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/20"
                                        : s.isDone
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-slate-50 border border-slate-200/80"
                                }`}
                            >
                                <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                                        isCurrent
                                            ? "bg-white text-teal-800"
                                            : s.isDone
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-200 text-slate-700"
                                    }`}
                                >
                                    {s.isDone && !isCurrent ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                        s.num
                                    )}
                                </span>
                                <span>{s.title}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                        isCurrent
                                            ? "bg-teal-700/60 text-teal-100"
                                            : s.isDone
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-slate-200/70 text-slate-600"
                                    }`}
                                >
                                    {s.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Copilot Autonomous Assistant */}
                <button
                    type="button"
                    onClick={() => setActiveStudioStep("copilot")}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-center ${
                        activeStudioStep === "copilot"
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400"
                            : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                    }`}
                >
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>Trợ Lý Đạo Diễn AI</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-800 font-bold">
                        Auto
                    </span>
                </button>
            </div>
        </div>
    );
};
