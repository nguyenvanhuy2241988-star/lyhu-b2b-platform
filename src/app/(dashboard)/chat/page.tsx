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

    // Feature States
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        // Wait for auth
        if (!user) return;

        // Fetch initial data
        fetchConversations(user.id);

        // Subscribe to NEW conversations (sidebar sync)
        subscribeToNewConversations(user.id);

        const fetchProfiles = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, email')
                    .order('full_name', { ascending: true });

                if (error) {
                    console.error("[ChatPage] Failed to fetch profiles via client:", error);
                    // Fallback attempt if a column is missing (e.g. full_name)
                    const { data: fallbackData } = await supabase
                        .from('profiles')
                        .select('id, role, email')
                        .limit(100);
                    if (fallbackData) setUsers(fallbackData);
                } else {
                    console.log(`[ChatPage] Fetched ${data.length} profiles successfully`);
                    setUsers(data);
                }
            } catch (e) {
                console.error("[ChatPage] Error fetching profiles:", e);
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
        if (!currentUser) return;
        try {
            const id = await createDirectConversation(currentUser.id, targetUserId);
            selectConversation(id);
        } catch (e) {
            console.error(e);
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
