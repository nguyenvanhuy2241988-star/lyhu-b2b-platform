"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";

interface Props {
    userId: string;
    userName?: string;
}

export default function AIDailyBriefing({ userId, userName }: Props) {
    const [content, setContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);

    const fetchBriefing = async (forceRefresh = false) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ai/daily-briefing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, forceRefresh }),
            });
            const data = await res.json();
            if (data.success) {
                setContent(data.content);
                setGeneratedAt(data.generatedAt);
                setIsCached(data.cached);
                setIsDismissed(false);
                setIsCollapsed(false);
            }
        } catch (err) {
            console.error("[AI Briefing] Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            // Check if dismissed today
            const dismissKey = `ai_briefing_dismissed_${new Date().toISOString().split('T')[0]}`;
            if (localStorage.getItem(dismissKey)) {
                setIsDismissed(true);
                return;
            }
            fetchBriefing();
        }
    }, [userId]);

    const handleDismiss = () => {
        setIsDismissed(true);
        const dismissKey = `ai_briefing_dismissed_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(dismissKey, 'true');
    };

    const handleRefresh = () => {
        fetchBriefing(true);
    };

    // Simple markdown renderer
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Bold
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Bullet points
            if (line.startsWith('- ')) {
                return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
            }
            if (/^\d+\.\s/.test(line)) {
                return <li key={i} className="ml-4 text-sm list-decimal" dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />;
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: line }} />;
        });
    };

    if (isDismissed) {
        return (
            <button
                onClick={() => { setIsDismissed(false); fetchBriefing(); }}
                className="flex items-center gap-2 text-xs text-[#00AFA9] hover:text-[#009690] transition-colors mb-2"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Xem gợi ý AI hôm nay
            </button>
        );
    }

    if (!content && !isLoading) return null;

    return (
        <div className="relative bg-teal-50/60 border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00AFA9] rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            AI Gợi ý hôm nay
                        </h3>
                        {generatedAt && (
                            <span className="text-[10px] text-slate-400">
                                {isCached ? 'Cached' : 'Fresh'} • {new Date(generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-teal-100/60 rounded-lg text-slate-400 hover:text-[#00AFA9] transition-colors"
                        title="Tạo lại gợi ý mới"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 hover:bg-teal-100/60 rounded-lg text-slate-400 hover:text-[#00AFA9] transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 hover:bg-teal-100/60 rounded-lg text-slate-400 hover:text-[#00AFA9] transition-colors"
                        title="Ẩn"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isCollapsed && (
                <div className="px-4 pb-4 relative z-10">
                    {isLoading ? (
                        <div className="flex items-center gap-3 py-4">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-[#00AFA9] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-[#00AFA9] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-[#00AFA9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-[#00AFA9]">AI đang phân tích dữ liệu...</span>
                        </div>
                    ) : content ? (
                        <div className="prose prose-sm prose-teal max-w-none text-slate-700 leading-relaxed">
                            {renderMarkdown(content)}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
