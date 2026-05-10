"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, X, Minimize2, Maximize2, ChevronLeft, Users, Check } from "lucide-react";
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
    const [showSidebar, setShowSidebar] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);
    const [newMessageAlert, setNewMessageAlert] = useState<{ convId: string; senderName: string; content: string } | null>(null);
    const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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
        deleteConversation,
        leaveConversation,
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

    // Initialize data
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

    // --- Handlers ---
    const handleSelectConversation = (id: string) => {
        selectConversation(id, user?.id);
        setShowSidebar(false);
    };

    const handleStartChat = async (targetUserId: string) => {
        if (!user) return;
        try {
            const id = await createDirectConversation(user.id, targetUserId, session?.access_token);
            if (id) {
                selectConversation(id, user.id);
                setShowSidebar(false);
            }
        } catch (e) {
            console.error("[QuickChat] Start chat error:", e);
        }
    };

    const handleQuickSwitch = (convId: string) => {
        selectConversation(convId, user?.id);
        setShowSidebar(false);
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleCreateGroup = async () => {
        if (!user || !groupName.trim() || selectedUsers.length === 0) return;
        try {
            const id = await createGroupConversation(user.id, groupName, selectedUsers);
            if (id) {
                selectConversation(id, user.id);
                setShowSidebar(false);
            }
            setShowCreateGroup(false);
            setGroupName("");
            setSelectedUsers([]);
        } catch (e) {
            console.error("[QuickChat] Create group error:", e);
        }
    };

    const handleDeleteGroup = async () => {
        if (!activeConversationId) return;
        if (!confirm("Bạn có chắc chắn muốn xóa nhóm chat này? Tất cả tin nhắn sẽ bị mất.")) return;
        try {
            await deleteConversation(activeConversationId);
            setShowSidebar(true);
        } catch (e) {
            console.error("[QuickChat] Delete group error:", e);
        }
    };

    const handleLeaveGroup = async () => {
        if (!activeConversationId || !user) return;
        if (!confirm("Bạn có chắc chắn muốn rời nhóm chat này?")) return;
        try {
            await leaveConversation(activeConversationId, user.id);
            setShowSidebar(true);
        } catch (e) {
            console.error("[QuickChat] Leave group error:", e);
        }
    };

    const dismissAlert = () => {
        setNewMessageAlert(null);
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };

    const openFromAlert = () => {
        if (newMessageAlert) {
            selectConversation(newMessageAlert.convId, user?.id);
            setShowSidebar(false);
        }
        dismissAlert();
        setIsOpen(true);
    };

    // --- Derived data ---
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Recent conversations for quick-switch tabs (top 8, no channels, sorted by last_message_at)
    const recentConvs = [...conversations]
        .filter(c => c.last_message_at && c.type !== 'channel')
        .sort((a, b) => {
            const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return timeB - timeA;
        })
        .slice(0, 8);

    // Helper to get display name for a conversation
    const getConvDisplayName = (conv: any): string => {
        if (conv.name) return conv.name;
        if (conv.type === 'group') return conv.name || 'Nhóm';
        const other = conv.internal_participants?.find((p: any) => p.user_id !== user?.id);
        if (other) {
            const u = users.find(u => u.id === other.user_id);
            return other.full_name || other.email?.split('@')[0] || u?.full_name || u?.email?.split('@')[0] || 'User';
        }
        return 'Chat';
    };

    const getConvInitial = (conv: any): string => {
        return getConvDisplayName(conv).charAt(0).toUpperCase();
    };

    const isConvOnline = (conv: any): boolean => {
        if (conv.type === 'group') return false;
        const other = conv.internal_participants?.find((p: any) => p.user_id !== user?.id);
        return other ? onlineUsers.includes(other.user_id) : false;
    };

    // Don't show on /chat page
    if (isOnChatPage) return null;
    if (!user) return null;

    const panelWidth = isExpanded ? 'w-[calc(100vw-32px)] sm:w-[800px]' : 'w-[calc(100vw-32px)] sm:w-[420px]';
    const panelHeight = isExpanded ? 'h-[75vh] sm:h-[600px]' : 'h-[65vh] sm:h-[520px]';

    return (
        <>
            {/* Floating Alert Popup (only when widget is closed) */}
            {!isOpen && newMessageAlert && (
                <div className="fixed bottom-[150px] lg:bottom-24 right-4 lg:right-6 z-[9999] animate-in slide-in-from-right-5 fade-in duration-300">
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
                <div className={`fixed bottom-[150px] lg:bottom-24 right-4 lg:right-6 z-[9998] ${panelWidth} ${panelHeight} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-3 zoom-in-95 fade-in duration-200`}>
                    {/* Panel Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-2.5 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            {/* Back button when in chat view (compact mode) */}
                            {!isExpanded && !showSidebar && (
                                <button
                                    onClick={() => setShowSidebar(true)}
                                    className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Quay lại danh sách"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <MessageCircle className="w-4 h-4 text-white" />
                            <span className="text-white font-semibold text-sm">
                                {!isExpanded && !showSidebar && activeConversation
                                    ? getConvDisplayName(activeConversation)
                                    : 'Tin nhắn nội bộ'
                                }
                            </span>
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

                    {/* Quick Switch Tabs (compact mode, when in chat view) */}
                    {!isExpanded && !showSidebar && recentConvs.length > 1 && (
                        <div className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto flex-shrink-0 custom-scrollbar">
                            {/* Back to list button */}
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                title="Tất cả tin nhắn"
                            >
                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            </button>

                            <div className="w-px h-6 bg-slate-200 flex-shrink-0 mx-0.5"></div>

                            {/* Recent conversation avatars */}
                            {recentConvs.map(conv => {
                                const isActive = conv.id === activeConversationId;
                                const isGroup = conv.type === 'group';
                                const online = isConvOnline(conv);
                                const convUnread = conv.unread_count || 0;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => handleQuickSwitch(conv.id)}
                                        className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive
                                            ? 'ring-2 ring-teal-500 ring-offset-1 scale-110'
                                            : 'hover:scale-105'
                                            } ${isGroup
                                                ? 'bg-teal-100 text-teal-600'
                                                : 'bg-slate-200 text-slate-600'
                                            }`}
                                        title={getConvDisplayName(conv)}
                                    >
                                        {isGroup ? (
                                            <Users className="w-3.5 h-3.5" />
                                        ) : (
                                            <span className="uppercase">{getConvInitial(conv)}</span>
                                        )}
                                        {/* Online indicator */}
                                        {online && !isGroup && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                                        )}
                                        {/* Unread badge */}
                                        {convUnread > 0 && !isActive && (
                                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                                                {convUnread > 9 ? '9+' : convUnread}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

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
                                onShowCreateGroup={() => setShowCreateGroup(true)}
                                className={`${isExpanded ? 'w-64 flex-shrink-0' : 'w-full'} border-r border-slate-200`}
                            />
                        )}

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
                                    onDeleteGroup={handleDeleteGroup}
                                    onLeaveGroup={handleLeaveGroup}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl w-[360px] max-h-[70vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Tạo nhóm chat mới</h3>
                            <button onClick={() => { setShowCreateGroup(false); setGroupName(""); setSelectedUsers([]); }}>
                                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tên nhóm</label>
                            <input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                placeholder="Nhập tên nhóm..."
                            />
                            <label className="block text-xs font-bold text-slate-600 mb-2">
                                Chọn thành viên ({selectedUsers.length})
                            </label>
                            <div className="space-y-1">
                                {users.filter(u => u.id !== user?.id).map(u => {
                                    const isSelected = selectedUsers.includes(u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleUserSelection(u.id)}
                                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-300 bg-white'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] uppercase font-bold text-slate-600">
                                                {(u.full_name || u.email || "?").charAt(0)}
                                            </div>
                                            <div className="text-sm truncate flex-1 text-slate-700">{u.full_name || u.email}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                            <button
                                onClick={() => { setShowCreateGroup(false); setGroupName(""); setSelectedUsers([]); }}
                                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || selectedUsers.length === 0}
                                className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Tạo nhóm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button (always visible) */}
            <div className="fixed bottom-[84px] lg:bottom-6 right-4 lg:right-6 z-[9997]">
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
