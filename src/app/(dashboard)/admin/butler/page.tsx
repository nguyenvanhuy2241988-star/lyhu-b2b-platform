"use client";

import { useState, useRef, useEffect } from "react";
import {
    Bot,
    Send,
    Sparkles,
    User,
    Loader2,
    RefreshCw,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Tag,
    Building2,
    CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Array<{ title: string; source_table: string }>;
    timestamp: Date;
}

const SAMPLE_QUESTIONS = [
    {
        label: "Văn hóa & Sứ mệnh",
        icon: Building2,
        query: "Giá trị cốt lõi và triết lý kinh doanh của LYHU là gì?"
    },
    {
        label: "Thông tin sản phẩm",
        icon: BookOpen,
        query: "Thanh khoai môn sấy tẩm vị trứng cua 180g đóng gói thế nào, hạn sử dụng bao lâu?"
    },
    {
        label: "Báo giá sản phẩm",
        icon: Tag,
        query: "Báo giá các sản phẩm Bột phô mai và Bột xí muội BOYO?"
    },
    {
        label: "Kịch bản tư vấn",
        icon: HelpCircle,
        query: "Kịch bản tư vấn khi khách hàng hỏi về giá sản phẩm?"
    }
];

export default function AdminButlerPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Xin chào Quản trị viên! Tôi là **Quản gia LYHU**, trợ lý AI nội bộ của công ty.\n\nTôi nắm rõ toàn bộ văn hóa doanh nghiệp, danh mục sản phẩm, quy cách đóng gói và chính sách bán hàng từ hệ thống. Bạn có thể hỏi tôi bất kỳ điều gì về hoạt động của LYHU!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (questionText?: string) => {
        const text = (questionText || input).trim();
        if (!text || loading) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: new Date()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            // Chuyển lịch sử hội thoại dạng { role, content } cho Edge Function
            const apiMessages = newMessages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch(`${supabaseUrl}/functions/v1/ai-butler`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
                },
                body: JSON.stringify({ messages: apiMessages })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || "Không thể kết nối với Quản gia.");
            }

            const botMsg: Message = {
                id: `bot-${Date.now()}`,
                role: "assistant",
                content: data.answer || "Dạ em đã ghi nhận.",
                sources: data.sources || [],
                timestamp: new Date()
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err: any) {
            console.error("Lỗi gọi Quản gia AI:", err);
            const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: `❌ **Đã xảy ra lỗi:** ${err.message || "Không thể nhận phản hồi từ AI."}\n\nVui lòng thử lại sau giây lát.`,
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: "Đã làm mới cuộc trò chuyện. Bạn muốn tìm hiểu thông tin gì về LYHU?",
                timestamp: new Date()
            }
        ]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-110px)] max-w-5xl mx-auto p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00ABA9] to-[#8DC63F] flex items-center justify-center text-white shadow-md">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-gray-900">Quản gia LYHU</h1>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online • Thử nghiệm Admin
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00ABA9]" />
                            Bảo mật dữ liệu thời gian thực theo Supabase RLS
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={clearChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Làm mới hội thoại"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Xóa lịch sử chat
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* Suggestions Pills if only 1 welcome message */}
                {messages.length === 1 && (
                    <div className="my-6 p-4 rounded-2xl bg-gradient-to-br from-teal-50/60 to-emerald-50/40 border border-teal-100">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#00ABA9] uppercase tracking-wider mb-3">
                            <Sparkles className="w-4 h-4" />
                            Gợi ý câu hỏi thử nghiệm nhanh:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SAMPLE_QUESTIONS.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(item.query)}
                                        className="flex items-start gap-2.5 p-3 text-left rounded-xl bg-white hover:bg-teal-50/50 border border-gray-200 hover:border-[#00ABA9] transition-all shadow-sm group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-teal-50 text-[#00ABA9] group-hover:bg-[#00ABA9] group-hover:text-white transition-colors shrink-0 mt-0.5">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-800">{item.label}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{item.query}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                            {!isUser && (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ABA9] to-[#8DC63F] flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                isUser
                                    ? "bg-[#00ABA9] text-white rounded-tr-none"
                                    : "bg-white text-gray-900 border border-gray-200 rounded-tl-none"
                            }`}>
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                </div>

                                {/* Sources badge if any */}
                                {!isUser && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                                        <span className="font-semibold text-gray-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-[#00ABA9]" />
                                            Nguồn dữ liệu:
                                        </span>
                                        {msg.sources.map((s, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px]"
                                            >
                                                {s.title}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className={`text-[10px] mt-1 text-right ${isUser ? "text-teal-100" : "text-gray-400"}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>

                            {isUser && (
                                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700 shrink-0 shadow-sm mt-1">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex gap-3 justify-start items-center">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ABA9] to-[#8DC63F] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-gray-500 flex items-center gap-2 shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-[#00ABA9]" />
                            <span>Quản gia đang tra cứu tài liệu và chuẩn bị câu trả lời...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-gray-200">
                <div className="relative flex items-end gap-2 bg-white rounded-2xl border border-gray-300 focus-within:border-[#00ABA9] focus-within:ring-2 focus-within:ring-[#00ABA9]/20 p-2 shadow-sm transition-all">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Hỏi Quản gia về sản phẩm, quy chế, văn hóa công ty, kịch bản bán hàng..."
                        disabled={loading}
                        className="flex-1 max-h-32 min-h-[40px] px-2 py-2 text-sm bg-transparent border-0 focus:outline-none resize-none text-gray-900 placeholder-gray-400"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="h-10 w-10 rounded-xl bg-[#00ABA9] hover:bg-[#008d8b] disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
                        title="Gửi câu hỏi"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <div className="text-[11px] text-gray-400 text-center mt-2">
                    Nhấn <strong>Enter</strong> để gửi • <strong>Shift + Enter</strong> để xuống dòng • Câu trả lời được kiểm soát quyền bởi Supabase RLS
                </div>
            </div>
        </div>
    );
}
