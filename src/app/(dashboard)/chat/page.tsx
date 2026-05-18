"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useChatStore } from "@/lib/chatStore";
import { supabase } from "@/lib/supabaseClient";
import { X, Check, ShoppingBag, MessageSquare } from "lucide-react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { B2BSupportInbox } from "@/components/chat/B2BSupportInbox";

import { useAuth } from "@/components/auth/AuthProvider";

export default function ChatPage() {
    const { user, session, role, isLoading: isAuthLoading } = useAuth();

    // Ensure we don't render until auth is ready or user is present
    // This prevents null crashes in child components

    const {
        conversations, messages, activeConversationId,
        fetchConversations, selectConversation, sendMessage, editMessage, deleteMessage, createDirectConversation, createGroupConversation, markRead,
        onlineUsers, typingUsers, sendTyping,
        pinMessage, unpinMessage,
        loadMoreMessages, hasMore, isLoadingMore,
        searchMessages,
        startPolling, stopPolling,
        subscribeToNewConversations, unsubscribeFromNewConversations,
        deleteConversation, leaveConversation
    } = useChatStore();

    // Inject role into currentUser for easy checking down the tree
    const currentUser = useMemo(() => user ? { ...user, role } : null, [user, role]);
    const [users, setUsers] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    // Feature States
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Tab state: internal chat vs B2B support
    const [chatMode, setChatMode] = useState<'internal' | 'b2b'>('internal');

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchProfiles = useCallback(async () => {
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) return;

        let token = session?.access_token || SUPABASE_KEY;
        const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,role,email`;

        try {
            const res = await fetch(url, {
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
            console.error("[ChatPage] Profile fetch failed", e);
        }
    }, [session?.access_token]);

    useEffect(() => {
        // Wait for auth and mounting
        if (!user || !mounted) return;

        // Fetch initial data
        fetchConversations(user.id);

        // Subscribe to NEW conversations (sidebar sync)
        subscribeToNewConversations(user.id);

        fetchProfiles();

        // Force B2B mode for customers
        if (currentUser?.role === 'customer') {
            setChatMode('b2b');
        }

        return () => {
            unsubscribeFromNewConversations();
        };
    }, [user, mounted, fetchConversations, subscribeToNewConversations, unsubscribeFromNewConversations, fetchProfiles, currentUser]);

    // Polling and Realtime are handled internally by selectConversation in chatStore.ts
    // No need for redundant useEffect here to avoid duplicate intervals/channels.

    useEffect(() => {
        // Mark as read when messages update
        if (activeConversationId && currentUser && messages.length > 0) {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (conv && (conv.unread_count || 0) > 0) {
                markRead(activeConversationId, currentUser.id);
            }
        }
    }, [messages, activeConversationId, currentUser, markRead, conversations]);

    const handleStartChat = async (targetUserId: string) => {
        console.log("[ChatPage] handleStartChat called:", { targetUserId, currentUserId: currentUser?.id });
        if (!currentUser) {
            console.error("[ChatPage] No currentUser, aborting");
            return;
        }
        try {
            console.log("[ChatPage] Creating direct conversation...");
            // Pass the token explicitly to avoid hangs in the store
            const id = await createDirectConversation(currentUser.id, targetUserId, session?.access_token);
            console.log("[ChatPage] Conversation created:", id);
            if (!id) {
                alert('Không thể tạo cuộc hội thoại. Vui lòng thử lại.');
                return;
            }
            selectConversation(id, currentUser?.id);
            console.log("[ChatPage] Conversation selected:", id);
        } catch (e: any) {
            console.error("[ChatPage] handleStartChat error:", e.message || e);
            alert(`Không thể bắt đầu chat: ${e.message || 'Lỗi không xác định'}`);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0 || !currentUser) return;
        try {
            const id = await createGroupConversation(currentUser.id, groupName, selectedUsers);
            selectConversation(id, currentUser.id);
            setShowCreateGroup(false);
            setGroupName("");
            setSelectedUsers([]);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);


    const [showMobileSidebar, setShowMobileSidebar] = useState(true);

    const handleSelectConversation = (id: string) => {
        selectConversation(id, currentUser?.id);
        setShowMobileSidebar(false); // Mobile: Hide sidebar when chat selected
    };


    if (isAuthLoading) {
        return (
            <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p className="text-sm text-slate-500 animate-pulse">Đang kết nối bảo mật...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Tab Switcher */}
            {currentUser?.role !== 'customer' && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-t-lg px-2 py-1.5 shrink-0">
                    <button
                        onClick={() => setChatMode('internal')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            chatMode === 'internal'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat nội bộ
                    </button>
                    <button
                        onClick={() => setChatMode('b2b')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            chatMode === 'b2b'
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Hỗ trợ B2B
                    </button>
                </div>
            )}

            {/* B2B Support Mode */}
            {chatMode === 'b2b' ? (
                <div className="flex-1 border border-t-0 border-slate-200 rounded-b-lg overflow-hidden">
                    <B2BSupportInbox currentUser={currentUser} />
                </div>
            ) : (
            /* Internal Chat Mode */
        <div className="flex-1 bg-white rounded-b-lg shadow-sm border border-t-0 border-slate-200 overflow-hidden flex font-sans">
            {/* Sidebar: Hidden on mobile if chat is open */}
            <ChatSidebar
                currentUser={currentUser}
                users={users}
                activeConversationId={activeConversationId}
                onlineUsers={onlineUsers}
                onSelectConversation={handleSelectConversation}
                onStartChat={handleStartChat}
                onShowCreateGroup={() => setShowCreateGroup(true)}
                className={`w-full md:w-72 ${showMobileSidebar ? 'flex' : 'hidden md:flex'}`}
            />

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Tạo nhóm chat mới</h3>
                            <button onClick={() => setShowCreateGroup(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tên nhóm</label>
                            <input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded text-sm mb-4 focus:outline-none focus:border-blue-500"
                                placeholder="Nhập tên nhóm..."
                            />

                            <label className="block text-xs font-bold text-slate-600 mb-2">Chọn thành viên ({selectedUsers.length})</label>
                            <div className="space-y-1">
                                {users.filter(u => u.id !== currentUser?.id).map(u => {
                                    const isSelected = selectedUsers.includes(u.id);
                                    return (
                                        <div key={u.id} onClick={() => toggleUserSelection(u.id)} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'}`}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] uppercase font-bold text-slate-600">{u.email?.charAt(0)}</div>
                                            <div className="text-sm truncate flex-1">{u.full_name || u.email}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setShowCreateGroup(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || selectedUsers.length === 0}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tạo nhóm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Window: Hidden on mobile if sidebar is open */}
            <div className={`flex-1 ${!showMobileSidebar ? 'flex' : 'hidden md:flex'}`}>
                <ChatWindow
                    currentUser={currentUser}
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
                    onBack={() => setShowMobileSidebar(true)}
                    searchMessages={searchMessages}
                    onDeleteGroup={async () => {
                        if (!activeConversationId) return;
                        if (!confirm("Bạn có chắc chắn muốn xóa nhóm chat này?")) return;
                        await deleteConversation(activeConversationId);
                    }}
                    onLeaveGroup={async () => {
                        if (!activeConversationId || !currentUser) return;
                        if (!confirm("Bạn có chắc chắn muốn rời nhóm?")) return;
                        await leaveConversation(activeConversationId, currentUser.id);
                    }}
                />
            </div>
        </div>
        )}
        </div>
    );
}
