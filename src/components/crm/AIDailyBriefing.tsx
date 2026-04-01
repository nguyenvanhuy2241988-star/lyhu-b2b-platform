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
                className="flex items-center gap-2 text-xs text-purple-500 hover:text-purple-700 transition-colors mb-2"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Xem gợi ý AI hôm nay
            </button>
        );
    }

    if (!content && !isLoading) return null;

    return (
        <div className="relative bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/60 rounded-2xl overflow-hidden shadow-sm mb-4 transition-all">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-tr-full pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-purple-900">
                            AI Gợi ý hôm nay
                        </h3>
                        {generatedAt && (
                            <span className="text-[10px] text-purple-400">
                                {isCached ? 'Cached' : 'Fresh'} • {new Date(generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-400 hover:text-purple-600 transition-colors"
                        title="Tạo lại gợi ý mới"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-400 hover:text-purple-600 transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-400 hover:text-purple-600 transition-colors"
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
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-purple-500">AI đang phân tích dữ liệu...</span>
                        </div>
                    ) : content ? (
                        <div className="prose prose-sm prose-purple max-w-none text-slate-700 leading-relaxed">
                            {renderMarkdown(content)}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
