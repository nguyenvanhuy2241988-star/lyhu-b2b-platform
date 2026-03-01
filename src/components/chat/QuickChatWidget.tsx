"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { useChatStore, Message } from "@/lib/chatStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";

interface QuickChat {
    conversationId: string;
    name: string;
    messages: Message[];
    minimized: boolean;
}

export default function QuickChatWidget() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [quickChats, setQuickChats] = useState<QuickChat[]>([]);
    const [newMessageAlert, setNewMessageAlert] = useState<{ convId: string; senderName: string; content: string } | null>(null);
    const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        conversations,
        subscribeToGlobalMessages,
        unsubscribeFromGlobalMessages,
        fetchConversations,
        getTotalUnreadCount,
    } = useChatStore();

    const unreadCount = getTotalUnreadCount();

    const isOnChatPage = pathname === '/chat';

    // Handle new message from global subscription → show popup
    const handleNewMessage = useCallback((msg: any) => {
        if (isOnChatPage) return;
        if (msg.sender_id === user?.id) return;

        // Find the conversation
        const conv = conversations.find(c => c.id === msg.conversation_id);
        if (!conv) return;

        // Get sender name
        let senderName = "Ai đó";
        if (conv.internal_participants) {
            const sender = conv.internal_participants.find((p: any) => p.user_id === msg.sender_id);
            if (sender?.profiles) {
                senderName = sender.profiles.full_name || sender.profiles.email?.split('@')[0] || "Ai đó";
            }
        }

        // Determine conversation display name
        let convName = conv.name;
        if (!convName && (conv.type === 'direct' || !conv.type)) {
            convName = senderName;
        }

        // Show alert toast
        setNewMessageAlert({
            convId: msg.conversation_id,
            senderName: senderName,
            content: msg.content?.substring(0, 80) || "Tin nhắn mới",
        });

        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => setNewMessageAlert(null), 5000);
    }, [isOnChatPage, user?.id, conversations]);

    // Listen for global messages (for popup alerts only, NOT for routing)
    useEffect(() => {
        if (user?.id) {
            fetchConversations(user.id);
            subscribeToGlobalMessages(user.id, handleNewMessage);
        }
        return () => {
            unsubscribeFromGlobalMessages();
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        };
    }, [user?.id]);

    const dismissAlert = () => {
        setNewMessageAlert(null);
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };

    const goToChat = () => {
        dismissAlert();
        window.location.href = `/chat${newMessageAlert ? `?conv=${newMessageAlert.convId}` : ''}`;
    };

    if (isOnChatPage) return null;

    return (
        <>
            {/* Floating Alert Popup */}
            {newMessageAlert && (
                <div className="fixed bottom-20 right-6 z-[9999] animate-in slide-in-from-right-5 fade-in duration-300">
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow"
                        onClick={goToChat}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-white" />
                                <span className="text-white text-xs font-semibold">Tin nhắn mới</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); dismissAlert(); }}
                                className="text-white/70 hover:text-white p-0.5 rounded transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-3 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-600 text-sm font-bold uppercase">
                                    {newMessageAlert.senderName.charAt(0)}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {newMessageAlert.senderName}
                                </p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {newMessageAlert.content}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-3 flex items-center gap-2">
                            <button
                                className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium py-2 rounded-lg transition-colors"
                                onClick={goToChat}
                            >
                                Mở cuộc trò chuyện →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Chat Badge (always visible when there are unread messages) */}
            {unreadCount > 0 && !newMessageAlert && (
                <div className="fixed bottom-6 right-6 z-[9998]">
                    <button
                        onClick={() => { window.location.href = '/chat'; }}
                        className="relative w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                        title="Tin nhắn nội bộ"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </button>
                </div>
            )}
        </>
    );
}
