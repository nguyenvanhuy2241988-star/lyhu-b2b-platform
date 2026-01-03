"use client";

import { useState, useEffect } from "react";
import { Search, Users, Hash, Plus, Check } from "lucide-react";
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

    // DMs: Show if (type=direct OR null) AND (current user is participant)
    const directMessages = conversations.filter(c => {
        const isDM = c.type === 'direct' || !c.type;
        return isDM;
    });

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
                    className="p-1.5 bg-white border border-slate-200 text-blue-600 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                    title="Tạo nhóm chat"
                >
                    <Users className="w-4 h-4" />
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">

                {/* Default View (No search or Search People) */}

                {/* Channels */}
                {filteredChannels.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between px-2 mb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Kênh</h4>
                        </div>
                        <div className="space-y-0.5">
                            {filteredChannels.map(ch => {
                                const isActive = ch.id === activeConversationId;
                                const unread = ch.unread_count || 0;
                                return (
                                    <div
                                        key={ch.id}
                                        onClick={() => onSelectConversation(ch.id)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-slate-200/50 text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        <Hash className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <div className="min-w-0 flex-1 flex justify-between items-center">
                                            <span className={`truncate ${unread > 0 ? 'font-bold text-slate-900' : ''}`}>{ch.name || 'Channel'}</span>
                                            {unread > 0 && (
                                                <span className="min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-1">
                                                    {unread > 99 ? '99+' : unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Groups */}
                {filteredGroups.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between px-2 mb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Nhóm</h4>
                        </div>
                        <div className="space-y-0.5">
                            {filteredGroups.map(ch => {
                                const isActive = ch.id === activeConversationId;
                                return (
                                    <div
                                        key={ch.id}
                                        onClick={() => onSelectConversation(ch.id)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-slate-200/50 text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        {/* Stacked Avatars V6 */}
                                        <div className="relative w-8 h-8 flex -space-x-2 overflow-hidden flex-shrink-0">
                                            {ch.internal_participants?.slice(0, 3).map((p: any, i: number) => {
                                                const pUser = users.find(u => u.id === p.user_id);
                                                return (
                                                    <div key={p.user_id} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase ${i === 0 ? 'bg-blue-500 z-30' : i === 1 ? 'bg-indigo-500 z-20' : 'bg-slate-400 z-10'}`}>
                                                        {pUser?.email?.charAt(0) || "?"}
                                                    </div>
                                                );
                                            })}
                                            {(!ch.internal_participants || ch.internal_participants.length === 0) && (
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white text-slate-500">
                                                    <Users className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 flex justify-between items-center">
                                            <span className={`truncate ${(ch.unread_count || 0) > 0 ? 'font-bold text-slate-900' : ''}`}>{ch.name || 'Group'}</span>
                                            {(ch.unread_count || 0) > 0 && (
                                                <span className="min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-1">
                                                    {(ch.unread_count || 0) > 99 ? '99+' : ch.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* DMs */}
                {filteredDMs.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between px-2 mb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tin nhắn trực tiếp</h4>
                        </div>
                        <div className="space-y-0.5">
                            {filteredDMs.map((conv: any) => {
                                const isActive = conv.id === activeConversationId;
                                const displayName = getDisplayNameForDM(conv);
                                const isOnline = conv.internal_participants?.some((p: any) => p.user_id !== currentUser?.id && isUserOnline(p.user_id));

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => onSelectConversation(conv.id)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-slate-200/50 text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="relative">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] uppercase font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {(displayName || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                        </div>
                                        <span className={`truncate flex-1 ${(conv.unread_count || 0) > 0 ? 'font-bold text-slate-900' : ''}`}>{displayName}</span>
                                        {(conv.unread_count || 0) > 0 && (
                                            <span className="min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {(conv.unread_count || 0) > 99 ? '99+' : conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Always Visible: Colleague List (Simplified) */}
                {!searchTerm && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="px-2 mb-2 flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Đồng nghiệp</h4>
                            <Plus className="w-3 h-3 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            {users.filter(u => u.id !== currentUser?.id).slice(0, 15).map(u => (
                                <div key={u.id} onClick={() => onStartChat(u.id)} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100 Group text-sm text-slate-600 transition-colors">
                                    <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-[10px] text-blue-500 uppercase font-bold border border-blue-100">
                                        {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate flex-1">{u.full_name || u.email}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline(u.id) ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                </div>
                            ))}
                        </div>

                        {filteredChannels.length === 0 && filteredGroups.length === 0 && filteredDMs.length === 0 && (
                            <div className="mt-8 px-4 text-center">
                                <p className="text-[11px] text-slate-400 italic">Chọn một đồng nghiệp để bắt đầu trò chuyện</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Global Search Results (Other Users) */}
                {searchTerm && searchResults.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between px-2 mb-1 mt-4 border-t border-slate-100 pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết quả tìm kiếm</h4>
                        </div>
                        <div className="space-y-0.5">
                            {searchResults.map((u) => {
                                const displayName = u.full_name || u.email || "No Name";
                                const isOnline = isUserOnline(u.id);
                                return (
                                    <div key={u.id} onClick={() => onStartChat(u.id)} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100/80 text-sm text-slate-600 transition-colors">
                                        <div className="relative">
                                            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 uppercase font-bold border border-blue-200">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                            {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                                        </div>
                                        <span className="truncate flex-1 font-medium">{displayName}</span>
                                        <Plus className="w-3 h-3 text-slate-400" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Message Search Results */}
                {searchTerm && (
                    <div>
                        <div className="flex items-center justify-between px-2 mb-1 mt-4 border-t border-slate-100 pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tin nhắn</h4>
                        </div>
                        {isSearchingMessages ? (
                            <div className="px-2 text-xs text-slate-400 italic">Đang tìm kiếm...</div>
                        ) : messageSearchResults.length > 0 ? (
                            <div className="space-y-0.5">
                                {messageSearchResults.map((msg) => {
                                    const conv = conversations.find(c => c.id === msg.conversation_id);
                                    if (!conv) return null; // Skip if conversation not found locally

                                    const sender = users.find(u => u.id === msg.sender_id);
                                    const senderName = sender?.full_name || sender?.email || "Người dùng";
                                    const isMe = currentUser?.id === msg.sender_id;
                                    const displayName = isMe ? "Bạn" : senderName;

                                    // Conv Name
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
                )}
            </div>
        </div>
    );
}
