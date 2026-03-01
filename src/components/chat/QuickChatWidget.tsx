"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function QuickChatWidget() {
    const { user, session } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true); // For compact mode: sidebar vs chat toggle
    const [users, setUsers] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);
    const [newMessageAlert, setNewMessageAlert] = useState<{ convId: string; senderName: string; content: string } | null>(null);
    const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        conversations, messages, activeConversationId,
        fetchConversations, selectConversation, sendMessage, editMessage, deleteMessage,
        createDirectConversation, createGroupConversation, markRead,
        onlineUsers, typingUsers, sendTyping,
        pinMessage, unpinMessage,
        loadMoreMessages, hasMore, isLoadingMore,
        searchMessages,
        subscribeToNewConversations, unsubscribeFromNewConversations,
        subscribeToGlobalMessages, unsubscribeFromGlobalMessages,
        getTotalUnreadCount,
    } = useChatStore();

    const unreadCount = getTotalUnreadCount();
    const isOnChatPage = pathname === '/chat';

    useEffect(() => { setMounted(true); }, []);

    // Fetch user profiles
    const fetchProfiles = useCallback(async () => {
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!SUPABASE_URL || !SUPABASE_KEY) return;

        const token = session?.access_token || SUPABASE_KEY;
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,role,email`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setUsers(data);
            }
        } catch (e) {
            console.error("[QuickChat] Profile fetch failed", e);
        }
    }, [session?.access_token]);

    // Initialize data when widget opens
    useEffect(() => {
        if (!user?.id || !mounted) return;
        fetchConversations(user.id);
        fetchProfiles();
    }, [user?.id, mounted, fetchConversations, fetchProfiles]);

    // Subscribe to new conversations when widget is open
    useEffect(() => {
        if (!user?.id || !isOpen) return;
        subscribeToNewConversations(user.id);
        return () => { unsubscribeFromNewConversations(); };
    }, [user?.id, isOpen, subscribeToNewConversations, unsubscribeFromNewConversations]);

    // Global message subscription for popup alerts (only when widget is closed)
    useEffect(() => {
        if (!user?.id || isOnChatPage) return;
        subscribeToGlobalMessages(user.id, (msg: any) => {
            if (isOpen || isOnChatPage || msg.sender_id === user?.id) return;
            const conv = conversations.find(c => c.id === msg.conversation_id);
            if (!conv) return;

            let senderName = "Ai đó";
            if (conv.internal_participants) {
                const sender = conv.internal_participants.find((p: any) => p.user_id === msg.sender_id);
                if (sender?.profiles) {
                    senderName = sender.profiles.full_name || sender.profiles.email?.split('@')[0] || "Ai đó";
                }
            }

            setNewMessageAlert({
                convId: msg.conversation_id,
                senderName,
                content: msg.content?.substring(0, 80) || "Tin nhắn mới",
            });
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = setTimeout(() => setNewMessageAlert(null), 5000);
        });
        return () => {
            unsubscribeFromGlobalMessages();
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        };
    }, [user?.id, isOnChatPage, isOpen]);

    // Mark as read when messages update
    useEffect(() => {
        if (activeConversationId && user && messages.length > 0 && isOpen) {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (conv && (conv.unread_count || 0) > 0) {
                markRead(activeConversationId, user.id);
            }
        }
    }, [messages, activeConversationId, user, markRead, conversations, isOpen]);

    const handleSelectConversation = (id: string) => {
        selectConversation(id, user?.id);
        setShowSidebar(false); // In compact mode, switch to chat view
    };

    const handleStartChat = async (targetUserId: string) => {
        if (!user) return;
        try {
            const id = await createDirectConversation(user.id, targetUserId, session?.access_token);
            if (id) selectConversation(id, user.id);
        } catch (e) {
            console.error("[QuickChat] Start chat error:", e);
        }
    };

    const dismissAlert = () => {
        setNewMessageAlert(null);
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };

    const openFromAlert = () => {
        if (newMessageAlert) {
            selectConversation(newMessageAlert.convId, user?.id);
        }
        dismissAlert();
        setIsOpen(true);
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Don't show on /chat page
    if (isOnChatPage) return null;
    if (!user) return null;

    const panelWidth = isExpanded ? 'w-[800px]' : 'w-[420px]';
    const panelHeight = isExpanded ? 'h-[600px]' : 'h-[520px]';

    return (
        <>
            {/* Floating Alert Popup (only when widget is closed) */}
            {!isOpen && newMessageAlert && (
                <div className="fixed bottom-24 right-6 z-[9999] animate-in slide-in-from-right-5 fade-in duration-300">
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow"
                        onClick={openFromAlert}
                    >
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
                        <div className="px-4 py-3 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-600 text-sm font-bold uppercase">
                                    {newMessageAlert.senderName.charAt(0)}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate">{newMessageAlert.senderName}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{newMessageAlert.content}</p>
                            </div>
                        </div>
                        <div className="px-4 pb-3">
                            <button className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium py-2 rounded-lg transition-colors">
                                Trả lời ngay →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mini Chat Panel */}
            {isOpen && (
                <div className={`fixed bottom-24 right-6 z-[9998] ${panelWidth} ${panelHeight} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-3 zoom-in-95 fade-in duration-200`}>
                    {/* Panel Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-white" />
                            <span className="text-white font-semibold text-sm">Tin nhắn nội bộ</span>
                            {unreadCount > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Đóng"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Sidebar */}
                        {(isExpanded || showSidebar) && (
                            <ChatSidebar
                                currentUser={user}
                                users={users}
                                activeConversationId={activeConversationId}
                                onlineUsers={onlineUsers}
                                onSelectConversation={handleSelectConversation}
                                onStartChat={handleStartChat}
                                onShowCreateGroup={() => { }}
                                className={`${isExpanded ? 'w-64' : 'w-full'} border-r border-slate-200`}
                            />
                        )
                        }

                        {/* Chat Window */}
                        {activeConversationId && (isExpanded || !showSidebar) && (
                            <div className={`flex-1 flex flex-col min-w-0 ${!isExpanded ? 'w-full' : ''}`}>
                                <ChatWindow
                                    currentUser={user}
                                    users={users}
                                    activeConversationId={activeConversationId}
                                    activeConversation={activeConversation}
                                    conversations={conversations}
                                    messages={messages}
                                    onlineUsers={onlineUsers}
                                    typingUsers={typingUsers}
                                    hasMore={hasMore}
                                    isLoadingMore={isLoadingMore}
                                    loadMoreMessages={loadMoreMessages}
                                    sendMessage={sendMessage}
                                    editMessage={editMessage}
                                    deleteMessage={deleteMessage}
                                    pinMessage={pinMessage}
                                    unpinMessage={unpinMessage}
                                    sendTyping={sendTyping}
                                    markRead={markRead}
                                    onBack={isExpanded ? undefined : () => setShowSidebar(true)}
                                    searchMessages={searchMessages}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Button (always visible) */}
            <div className="fixed bottom-6 right-6 z-[9997]">
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        dismissAlert();
                    }}
                    className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all ${isOpen
                        ? 'bg-slate-600 shadow-slate-600/30'
                        : 'bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-500/30'
                        }`}
                    title="Tin nhắn nội bộ"
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <MessageCircle className="w-6 h-6 text-white" />
                    )}
                    {!isOpen && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </>
    );
}
