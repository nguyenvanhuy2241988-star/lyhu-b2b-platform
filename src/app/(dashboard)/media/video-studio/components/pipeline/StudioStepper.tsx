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
            title: "Kịch Bản & Lồng Tiếng",
            icon: FileText,
            badge: hasVoice ? "Đã có giọng" : hasScript ? "Đã có kịch bản" : "AI Studio",
            isDone: hasScript && hasVoice
        },
        {
            step: "step_clips",
            num: "2",
            title: "Góc Quay & B-Roll",
            icon: Film,
            badge: `${clipsCount} cảnh`,
            isDone: clipsCount > 0
        },
        {
            step: "step_visuals",
            num: "3",
            title: "Tiêu Đề & Phụ Đề",
            icon: Tag,
            badge: "Huy hiệu sỉ",
            isDone: clipsCount > 0
        },
        {
            step: "step_audio_export",
            num: "4",
            title: "Âm Thanh & Xuất Video",
            icon: Music,
            badge: isExportReady ? "Sẵn sàng" : "60 FPS",
            isDone: false
        }
    ];

    return (
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                {/* 4 Pipeline Steps */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {steps.map((s) => {
                        const isCurrent = activeStudioStep === s.step;
                        return (
                            <button
                                key={s.step}
                                type="button"
                                onClick={() => setActiveStudioStep(s.step)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border ${
                                    isCurrent
                                        ? "bg-primary-500 text-white border-primary-500 font-bold"
                                        : s.isDone
                                        ? "bg-primary-50 text-primary-800 border-primary-200 hover:bg-primary-100"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        isCurrent
                                            ? "bg-white text-primary-700"
                                            : s.isDone
                                            ? "bg-primary-600 text-white"
                                            : "bg-slate-100 text-slate-600 border border-slate-300"
                                    }`}
                                >
                                    {s.isDone && !isCurrent ? (
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    ) : (
                                        s.num
                                    )}
                                </span>
                                <span>{s.title}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                                        isCurrent
                                            ? "bg-primary-600 text-primary-50"
                                            : s.isDone
                                            ? "bg-primary-100 text-primary-800"
                                            : "bg-slate-100 text-slate-500"
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
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                        activeStudioStep === "copilot"
                            ? "bg-primary-500 text-white border-primary-500"
                            : "bg-white text-primary-700 border-primary-300 hover:bg-primary-50"
                    }`}
                >
                    <Bot className="w-3.5 h-3.5 text-primary-600" />
                    <span>Trợ Lý Đạo Diễn AI</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary-100 text-primary-800 font-semibold">
                        Auto
                    </span>
                </button>
            </div>
        </div>
    );
};
