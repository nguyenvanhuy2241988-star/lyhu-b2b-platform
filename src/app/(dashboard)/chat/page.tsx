"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/chatStore";
import { supabase } from "@/lib/supabaseClient";
import { X, Check } from "lucide-react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

import { useAuth } from "@/components/auth/AuthProvider";

export default function ChatPage() {
    const { user, session, isLoading: isAuthLoading } = useAuth();

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
        subscribeToNewConversations, unsubscribeFromNewConversations
    } = useChatStore();

    // Use user directly from context instead of duplicate state
    const currentUser = user;
    const [users, setUsers] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    // Feature States
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Wait for auth and mounting
        if (!user || !mounted) return;

        // Fetch initial data
        fetchConversations(user.id);

        // Subscribe to NEW conversations (sidebar sync)
        subscribeToNewConversations(user.id);

        const fetchProfiles = async () => {
            console.log("[ChatPage] 1. Starting profile fetch...");

            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            console.log("[ChatPage] 2. Env vars check:", {
                hasUrl: !!SUPABASE_URL,
                hasKey: !!SUPABASE_KEY,
                urlPreview: SUPABASE_URL?.substring(0, 30)
            });

            if (!SUPABASE_URL || !SUPABASE_KEY) {
                console.error("[ChatPage] Missing Supabase env vars");
                return;
            }

            // Use session token if available, otherwise use anon key
            let token = SUPABASE_KEY;
            if (session?.access_token) {
                token = session.access_token;
                console.log("[ChatPage] 3. Using session token");
            } else {
                console.log("[ChatPage] 3. Using anon key (no session token)");
            }

            const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,role,email`;
            console.log("[ChatPage] 4. Fetching from:", url);

            try {
                const res = await fetch(url, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log("[ChatPage] 5. Response received:", res.status);

                const data = await res.json();
                console.log("[ChatPage] 6. Data parsed:", {
                    count: Array.isArray(data) ? data.length : 0,
                    isArray: Array.isArray(data),
                    sample: Array.isArray(data) ? data.slice(0, 2) : data
                });

                if (res.ok && Array.isArray(data) && data.length > 0) {
                    setUsers(data);
                    console.log(`[ChatPage] ✓ SUCCESS: Set ${data.length} users`);
                } else if (!res.ok) {
                    console.error("[ChatPage] REST API error:", res.status, data);
                } else {
                    console.warn("[ChatPage] Empty profiles array");
                }
            } catch (e: any) {
                console.error("[ChatPage] Fetch error:", e.message || e);
            }
        };

        fetchProfiles();

        return () => {
            unsubscribeFromNewConversations(); // Assuming this is the intended cleanup for new conversations
        };
    }, [user, session?.access_token, fetchConversations, subscribeToNewConversations, unsubscribeFromNewConversations]);

    // Polling and Realtime are handled internally by selectConversation in chatStore.ts
    // No need for redundant useEffect here to avoid duplicate intervals/channels.

    useEffect(() => {
        // Mark as read when messages update
        if (activeConversationId && currentUser && messages.length > 0) {
            markRead(activeConversationId, currentUser.id);
        }
    }, [messages, activeConversationId, currentUser, markRead]);

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
            selectConversation(id);
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
            selectConversation(id);
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
        selectConversation(id);
        setShowMobileSidebar(false); // Mobile: Hide sidebar when chat selected
    };


    if (isAuthLoading || !currentUser) {
        return (
            <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex font-sans">
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
                />
            </div>
        </div>
    );
}
