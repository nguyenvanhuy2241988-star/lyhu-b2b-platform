"use client";

import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";

interface ChatSidebarProps {
    currentUser: any;
    users: any[];
    activeConversationId: string | null;
    onlineUsers: string[];
    onSelectConversation: (id: string) => void;
    onStartChat: (targetUserId: string) => void;
    onShowCreateGroup: () => void;
    className?: string; // Enhancement: Mobile Responsive
}

export function ChatSidebar({
    currentUser,
    users,
    activeConversationId,
    onlineUsers,
    onSelectConversation,
    onStartChat,
    onShowCreateGroup,
    className = ""
}: ChatSidebarProps) {
    const { conversations, searchMessages } = useChatStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchMode, setSearchMode] = useState<'people' | 'messages'>('people');
    const [isSearchingMessages, setIsSearchingMessages] = useState(false);
    const [messageSearchResults, setMessageSearchResults] = useState<any[]>([]);

    useEffect(() => {
        if (!searchTerm) {
            setMessageSearchResults([]);
            return;
        }

        const controller = new AbortController();

        const timeoutId = setTimeout(async () => {
            setIsSearchingMessages(true);
            try {
                const results = await searchMessages(searchTerm, undefined, controller.signal);
                setMessageSearchResults(results);
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("Search failed", error);
                }
            } finally {
                setIsSearchingMessages(false);
            }
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchTerm, searchMessages]);

    const isUserOnline = (userId: string) => onlineUsers.includes(userId);

    // Filter Logic
    const channels = conversations.filter(c => c.type === 'channel');
    const groupChats = conversations.filter(c => c.type === 'group');

    // DMs: Show if (type=direct OR null), deduplicated by other participant
    const directMessages = (() => {
        const allDMs = conversations.filter(c => c.type === 'direct' || !c.type);
        // Dedup: keep only one DM per other-user (the most recently active one)
        const seen = new Map<string, any>();
        for (const dm of allDMs) {
            const otherP = dm.internal_participants?.find((p: any) => p.user_id !== currentUser?.id);
            const key = otherP?.user_id || dm.id; // fallback to id if no other participant (self-chat)
            const existing = seen.get(key);
            if (!existing) {
                seen.set(key, dm);
            } else {
                // Keep the one with more recent activity
                const existingTime = existing.last_message_at ? new Date(existing.last_message_at).getTime() : 0;
                const newTime = dm.last_message_at ? new Date(dm.last_message_at).getTime() : 0;
                if (newTime > existingTime) seen.set(key, dm);
            }
        }
        return Array.from(seen.values());
    })();

    // Helper: Display Name for DMs
    function getDisplayNameForDM(conv: any) {
        if (conv.name) return conv.name;
        if (conv.type === 'group') return conv.name || "Nhóm chưa đặt tên";

        const otherParticipant = conv.internal_participants?.find((p: any) => p.user_id !== currentUser?.id);
        const otherUserId = otherParticipant?.user_id;

        // Self-chat detection
        if (!otherParticipant) {
            return "Gửi cho chính mình (Lưu trữ)";
        }

        // Try using the already provided name/email from RPC first
        let displayName = otherParticipant.full_name || otherParticipant.email;
        if (displayName) return displayName;

        console.warn(`[ChatSidebar] No name/email in participant object for DM ${conv.id}. 
                      Data:`, otherParticipant,
            "Users count:", users.length,
            "Found user:", users.find(u => u.id === otherUserId));

        // Fallback to secondary users lookup
        displayName = "Cuộc hội thoại";
        if (otherUserId && users.length > 0) {
            const foundUser = users.find(u => u.id === otherUserId);
            if (foundUser) displayName = foundUser.full_name || foundUser.email;
        }
        return displayName;
    }

    // --- Search Logic ---
    const lowerTerm = searchTerm.toLowerCase();

    // Local filter for Channels/Groups/DMs
    const filteredChannels = channels.filter(c => (c.name || "").toLowerCase().includes(lowerTerm));
    const filteredGroups = groupChats.filter(c => (c.name || "").toLowerCase().includes(lowerTerm));
    const filteredDMs = directMessages.filter(c => getDisplayNameForDM(c).toLowerCase().includes(lowerTerm));

    // Other Users Search
    const searchResults = users.filter(u => {
        if (u.id === currentUser?.id) return false;
        return (u.full_name || u.email || "").toLowerCase().includes(lowerTerm);
    });

    return (
        <div className={`bg-slate-50 border-r border-slate-200 flex flex-col h-full ${className}`}>
            {/* ... */}
            {/* User Profile (Moved to Top) */}
            <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {currentUser?.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                        {users.find(u => u.id === currentUser?.id)?.full_name || "Tôi"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5" title={currentUser?.email}>
                        {currentUser?.email}
                    </p>
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Đang hoạt động
                    </p>
                </div>
            </div>

            {/* Header / Search Input */}
            <div className="p-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <div className="relative flex-1">
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                        placeholder="Tìm kiếm..."
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
                <button
                    onClick={onShowCreateGroup}
                    className="p-1.5 bg-white border border-slate-200 text-primary-600 rounded-full hover:bg-primary-50 transition-colors shadow-sm"
                    title="Tạo nhóm chat"
                >
                    <Users className="w-4 h-4" />
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">

                {/* Active Conversations (Groups + DMs merged, no channels) */}
                {(() => {
                    const activeConvs = [...filteredGroups, ...filteredDMs]
                        .sort((a, b) => {
                            const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                            const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                            return timeB - timeA;
                        });

                    return activeConvs.length > 0 ? (
                        <div className="space-y-0.5">
                            {activeConvs.map((conv: any) => {
                                const isActive = conv.id === activeConversationId;
                                const isGroup = conv.type === 'group';
                                const displayName = isGroup ? (conv.name || 'Nhóm') : getDisplayNameForDM(conv);
                                const unread = conv.unread_count || 0;
                                const isOnline = !isGroup && conv.internal_participants?.some((p: any) => p.user_id !== currentUser?.id && isUserOnline(p.user_id));

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => onSelectConversation(conv.id)}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm ${isActive
                                            ? 'bg-teal-50 text-teal-700 font-medium border border-teal-200'
                                            : 'hover:bg-slate-100 text-slate-700'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            {isGroup ? (
                                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                                    <Users className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-teal-500'}`} />
                                                </div>
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs uppercase font-bold ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {(displayName || "?").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {!isGroup && (
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                            )}
                                        </div>

                                        {/* Name + last message preview */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className={`truncate text-sm ${unread > 0 ? 'font-bold text-slate-900' : ''}`}>
                                                    {displayName}
                                                </span>
                                                {unread > 0 && (
                                                    <span className="min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-1">
                                                        {unread > 99 ? '99+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                            {conv.last_message && (
                                                <p className="text-xs text-slate-400 truncate mt-0.5">{conv.last_message}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : !searchTerm ? (
                        <div className="px-4 py-6 text-center">
                            <p className="text-xs text-slate-400 italic">Chưa có cuộc trò chuyện nào</p>
                        </div>
                    ) : null;
                })()}

                {/* All Users - flat list (exclude users already in DM list above) */}
                {(() => {
                    // Collect user IDs that are already shown in the conversations list as DMs
                    const dmUserIds = new Set(
                        directMessages.flatMap(c =>
                            (c.internal_participants || [])
                                .filter((p: any) => p.user_id !== currentUser?.id)
                                .map((p: any) => p.user_id)
                        )
                    );

                    const userList = (searchTerm ? searchResults : users.filter(u => u.id !== currentUser?.id))
                        .filter(u => !dmUserIds.has(u.id));

                    return userList.length > 0 ? (
                        <div className={`${!searchTerm ? 'pt-3 border-t border-slate-100' : ''}`}>
                            <div className="space-y-0.5">
                                {userList.map(u => {
                                    const isOnline = isUserOnline(u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => onStartChat(u.id)}
                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-slate-100 text-sm text-slate-600 transition-colors"
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 uppercase font-bold border border-slate-200">
                                                    {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-[1.5px] border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                            </div>
                                            <span className="truncate flex-1">{u.full_name || u.email}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null;
                })()}

                {/* Message Search Results */}
                {
                    searchTerm && (
                        <div>
                            <div className="flex items-center justify-between px-2 mb-1 mt-2 border-t border-slate-100 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tin nhắn</h4>
                            </div>
                            {isSearchingMessages ? (
                                <div className="px-2 text-xs text-slate-400 italic">Đang tìm kiếm...</div>
                            ) : messageSearchResults.length > 0 ? (
                                <div className="space-y-0.5">
                                    {messageSearchResults.map((msg) => {
                                        const conv = conversations.find(c => c.id === msg.conversation_id);
                                        if (!conv) return null;

                                        const sender = users.find(u => u.id === msg.sender_id);
                                        const senderName = sender?.full_name || sender?.email || "Người dùng";
                                        const isMe = currentUser?.id === msg.sender_id;
                                        const displayName = isMe ? "Bạn" : senderName;

                                        let convName = conv.name;
                                        if (!convName && (conv.type === 'direct' || !conv.type)) {
                                            convName = getDisplayNameForDM(conv);
                                        }

                                        return (
                                            <div
                                                key={msg.id}
                                                onClick={() => onSelectConversation(conv.id)}
                                                className="flex flex-col gap-1 px-2 py-2 rounded cursor-pointer hover:bg-slate-100 text-sm text-slate-600 hover:text-slate-900 transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-[11px] text-slate-500 truncate max-w-[70%]">{convName}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {(() => {
                                                            const d = new Date(msg.created_at);
                                                            return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="text-xs truncate">
                                                    <span className="font-semibold">{displayName}: </span>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-2 text-xs text-slate-400 italic">Không tìm thấy tin nhắn nào.</div>
                            )}
                        </div>
                    )
                }
            </div>
        </div>
    );
}
