import { create } from 'zustand';
import { supabase } from './supabaseClient';

// ============================================
// 1. ROBUST HELPERS (CORE STABILITY)
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[ChatStore] CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.");
}

// Fail-safe Token Retrieval (Prioritizes LocalStorage)
const getRealtimeToken = async (): Promise<string | null> => {
    // Try fresh session first to avoid stale tokens
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.warn("[ChatStore] getSession error:", error.message);
        }
        if (session?.access_token) {
            console.log("[ChatStore] Fetched fresh token from session");
            if (typeof window !== "undefined") {
                localStorage.setItem("lyhu_access_token", session.access_token);
            }
            return session.access_token;
        }
    } catch (e) {
        console.warn("[ChatStore] Auth session fetch failed, falling back to storage", e);
    }

    if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("lyhu_access_token");
        if (localToken) {
            console.log("[ChatStore] Using fallback token from localStorage");
            return localToken;
        }
    }
    console.error("[ChatStore] NO ACCESS TOKEN FOUND. Realtime and REST calls may fail.");
    return null;
};

// Robust Fetch Wrapper
const robustFetch = async (url: string, token: string | null) => {
    const headers: any = {
        'apikey': SUPABASE_KEY || '',
        'Authorization': `Bearer ${token || SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // Useful for inserts
    };
    return fetch(url, { headers });
};

// Safe Date Parsing
const safeDate = (dateVal: any): string => {
    if (!dateVal) return new Date().toISOString();
    try {
        return new Date(dateVal).toISOString();
    } catch {
        return new Date().toISOString();
    }
};

// ============================================
// 2. TYPES
// ============================================

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_system?: boolean;
    attachment_url?: string;
    attachment_type?: 'image' | 'file';
    attachment_name?: string;
    reply_to_id?: string;
    is_deleted?: boolean;
    is_pinned?: boolean;
    pinned_at?: string;
    is_forwarded?: boolean;
    reactions?: { emoji: string; user_id: string }[];
    status?: 'sending' | 'sent' | 'error' | 'read'; // Frontend only
    sender?: any; // Expanded sender
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'channel';
    name?: string;
    last_message?: string;
    last_message_at?: string;
    unread_count?: number;
    internal_participants?: any[];
    is_joined?: boolean;
}

interface ChatState {
    // State
    conversations: Conversation[];
    messages: Message[];
    activeConversationId: string | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;

    // Polling & Realtime Refs
    pollingInterval: NodeJS.Timeout | null;
    realtimeChannel: any;
    globalChannel: any;
    participantsChannel: any;

    // Actions
    fetchConversations: (userId: string) => Promise<void>;
    selectConversation: (conversationId: string) => Promise<void>;

    // Core Messaging
    sendMessage: (content: string, userId: string, file?: File, replyToId?: string) => Promise<void>;
    syncMessages: (conversationId: string, isInitial?: boolean) => Promise<void>;

    // Placeholders for UI compatibility (can be implemented as needed)
    loadMoreMessages: () => Promise<void>;
    markRead: (conversationId: string, userId: string) => Promise<void>;
    createDirectConversation: (myId: string, theirId: string) => Promise<string>;
    createGroupConversation: (myId: string, name: string, members: string[]) => Promise<string>;
    editMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    pinMessage: (messageId: string) => Promise<void>;
    unpinMessage: (messageId: string) => Promise<void>;
    searchMessages: (query: string, conversationId?: string) => Promise<Message[]>;
    forwardMessage: (message: Message, conversationIds: string[]) => Promise<void>;

    // Group Management
    updateConversationName: (conversationId: string, name: string) => Promise<void>;
    addParticipants: (conversationId: string, userIds: string[]) => Promise<void>;
    leaveConversation: (conversationId: string, userId: string) => Promise<void>;

    // Cleanup
    startPolling: (conversationId: string) => void;
    stopPolling: () => void;

    // Global Notifications (Topbar)
    subscribeToGlobalMessages: (userId: string, callback: (msg: any) => void) => void;
    unsubscribeFromGlobalMessages: () => void;

    // Sidebar Sync (New Conversations)
    subscribeToNewConversations: (userId: string) => void;
    unsubscribeFromNewConversations: () => void;

    // Presence & Typing (Placeholder for Stability)
    onlineUsers: string[];
    typingUsers: Record<string, string[]>;
    sendTyping: (conversationId: string, isTyping: boolean) => void;
    initPresence: (userId: string) => void;
    cleanupPresence: () => void;

    // Selectors
    getTotalUnreadCount: () => number;
}

// ============================================
// 3. STORE IMPLEMENTATION
// ============================================

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    activeConversationId: null,
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    pollingInterval: null,
    realtimeChannel: null,
    globalChannel: null,
    participantsChannel: null,

    // Default Empty State for UI Comp
    onlineUsers: [],
    typingUsers: {},

    // --- Actions ---

    // --- Actions ---

    fetchConversations: async (userId: string) => {
        console.log(`[ChatStore] Fetching conversations (with unread) for: ${userId}`);

        try {
            // Use RPC for atomic fetch of conversations + unread counts + participants
            const { data, error } = await supabase.rpc('get_conversations_with_unread', {
                p_user_id: userId
            });

            if (error) {
                console.error("[ChatStore] RPC fetchConversations failed:", error.message);

                // Fallback to legacy fetch if RPC fails (e.g. not migrated yet)
                const token = await getRealtimeToken();
                const step1Url = `${SUPABASE_URL}/rest/v1/internal_participants?select=conversation_id&user_id=eq.${userId}`;
                const res1 = await robustFetch(step1Url, token);
                if (res1.ok) {
                    const myConvs = await res1.json();
                    const ids = myConvs.map((r: any) => r.conversation_id).join(',');
                    // Enhanced legacy fetch with participant details
                    const step2Url = `${SUPABASE_URL}/rest/v1/internal_conversations?select=*,internal_participants(user_id,profiles(full_name,email))&id=in.(${ids})&order=last_message_at.desc`;
                    const res2 = await robustFetch(step2Url, token);
                    if (res2.ok) {
                        const dataLegacy = await res2.json();
                        // Flatten profiles into participant object
                        const processed = dataLegacy.map((c: any) => ({
                            ...c,
                            unread_count: 0,
                            internal_participants: c.internal_participants?.map((p: any) => ({
                                user_id: p.user_id,
                                full_name: p.profiles?.full_name,
                                email: p.profiles?.email
                            }))
                        }));
                        set({ conversations: processed });
                    }
                }
                return;
            }

            if (data) {
                console.log(`[ChatStore] Fetched ${data.length} conversations via RPC`);
                if (data.length > 0 && data[0].participants) {
                    console.log("[ChatStore] Sample participant data from RPC:", data[0].participants[0]);
                }
                // Adapt RPC data to local Conversation interface
                const mapped = data.map((c: any) => ({
                    ...c,
                    internal_participants: c.participants || []
                }));
                set({ conversations: mapped });
            }
        } catch (e) {
            console.error("Fetch conversations error", e);
        }
    },

    startPolling: (conversationId: string) => {
        const { pollingInterval } = get();
        if (pollingInterval) clearInterval(pollingInterval);

        // Initial sync is done by selectConversation, so we just loop
        const interval = setInterval(() => {
            get().syncMessages(conversationId);
        }, 3000); // 3s polling for stability
        set({ pollingInterval: interval });
    },

    stopPolling: () => {
        const { pollingInterval, realtimeChannel } = get();
        if (pollingInterval) {
            console.log("[ChatStore] Stopping polling interval");
            clearInterval(pollingInterval);
        }
        if (realtimeChannel) {
            console.log("[ChatStore] Removing realtime channel");
            try {
                supabase.removeChannel(realtimeChannel);
            } catch (e) {
                console.warn("[ChatStore] Error removing channel", e);
            }
        }
        set({ pollingInterval: null, realtimeChannel: null });
    },

    selectConversation: async (conversationId: string) => {
        const current = get();

        // 1. Cleanup previous
        current.stopPolling();

        set({
            activeConversationId: conversationId,
            messages: [], // Clear old messages
            isLoading: true,
            hasMore: true
        });

        // 2. Initial Fetch (Robust)
        console.log(`[ChatStore] SELECT -> Conversation: ${conversationId}`);
        await get().syncMessages(conversationId, true);
        set({ isLoading: false });

        // 3. Setup Polling (2s Interval) - Backup
        const interval = setInterval(() => {
            get().syncMessages(conversationId, false);
        }, 2000);
        set({ pollingInterval: interval });

        // 4. Enable Realtime Subscription (Primary)
        const channel = supabase.channel(`room-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'internal_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload: any) => {
                    // Optimized: Add directly to state
                    const newMsg = payload.new as Message;
                    console.log(`[Realtime] New message in ${conversationId}:`, newMsg.id);

                    set(state => {
                        // Avoid duplicates if polling caught it
                        if (state.messages.some(m => m.id === newMsg.id)) {
                            console.log(`[Realtime] Message ${newMsg.id} already exists (skipping)`);
                            return state;
                        }

                        // Add and Sort to ensure correct order
                        const updated = [...state.messages, newMsg].sort((a, b) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                        return { messages: updated };
                    });
                }
            );

        // Explicitly set token for this subscription to be extra safe
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("lyhu_access_token");
            if (token) {
                console.log(`[Realtime] Manually setting auth for channel room-${conversationId}`);
                supabase.realtime.setAuth(token);
            }
        }

        channel.subscribe((status: any, err?: any) => {
            console.log(`[Realtime] Subscription status for ${conversationId}:`, status);
            if (err) console.error(`[Realtime] Subscription error for ${conversationId}:`, err);

            if (status === 'CHANNEL_ERROR') {
                console.warn("[Realtime] Channel error detected. This usually means RLS is blocking the subscription or the token is invalid.");
            }
        });

        set({ realtimeChannel: channel });
    },

    syncMessages: async (conversationId: string, isInitial: boolean = false) => {
        const { messages, activeConversationId } = get();
        if (activeConversationId !== conversationId) return;

        const token = await getRealtimeToken();
        const userId = (await supabase.auth.getUser()).data.user?.id;
        console.log(`[ChatStore] Syncing messages for ${conversationId}. Project: ${SUPABASE_URL}. User: ${userId}. Token present: ${!!token}`);

        let url = `${SUPABASE_URL}/rest/v1/internal_messages?conversation_id=eq.${conversationId}&select=*,reactions:internal_message_reactions(emoji,user_id)`;

        // Strategy: 
        // - Initial: Fetch latest 50 (desc) -> reverse
        // - Poll: Fetch newer than last msg (asc)

        let isBackfill = false;

        if (isInitial || messages.length === 0) {
            url += `&order=created_at.desc&limit=50`;
            isBackfill = true;
        } else {
            // Append mode
            // Filter out optimistic/sending messages to get the last REAL server message
            const confirmedMessages = messages.filter(m => !m.status || m.status === 'sent' || m.status === 'read');
            const lastMsg = confirmedMessages[confirmedMessages.length - 1];

            if (lastMsg && lastMsg.created_at) {
                // Encode Timestamp!
                const safeTime = encodeURIComponent(safeDate(lastMsg.created_at));
                url += `&created_at=gt.${safeTime}&order=created_at.asc`;
            } else {
                // Fallback if no confirmed messages yet
                url += `&order=created_at.desc&limit=50`;
                isBackfill = true;
            }
        }

        try {
            const res = await robustFetch(url, token);
            if (!res.ok) {
                console.error(`[ChatStore] Sync failed for ${conversationId}. Status: ${res.status}. Error: ${await res.text()}`);
                return;
            }

            let data = await res.json();
            console.log(`[ChatStore] Sync result for ${conversationId}: ${data?.length || 0} messages. (Initial: ${isInitial})`);
            if (!data || data.length === 0) return;

            if (isBackfill) {
                data = data.reverse();
            }

            // Upsert / Dedupe Logic
            set(state => {
                if (state.activeConversationId !== conversationId) return state;

                const existingById = new Map(state.messages.map(m => [m.id, m]));

                data.forEach((msg: Message) => {
                    // Update or Add
                    existingById.set(msg.id, msg);
                });

                // Convert back to array and Sort
                const merged = Array.from(existingById.values()).sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );

                return { messages: merged };
            });

        } catch (e) {
            console.error("Sync error:", e);
        }
    },

    loadMoreMessages: async () => {
        const { messages, activeConversationId, hasMore, isLoadingMore } = get();
        if (!activeConversationId || !hasMore || isLoadingMore || messages.length === 0) return;

        set({ isLoadingMore: true });

        const oldestMsg = messages[0];
        const token = await getRealtimeToken();
        const safeTime = encodeURIComponent(safeDate(oldestMsg.created_at));

        // Fetch 20 older messages
        const url = `${SUPABASE_URL}/rest/v1/internal_messages?conversation_id=eq.${activeConversationId}&created_at=lt.${safeTime}&select=*,reactions:internal_message_reactions(emoji,user_id)&order=created_at.desc&limit=20`;

        try {
            const res = await robustFetch(url, token);
            if (res.ok) {
                let data = await res.json();
                if (data && data.length > 0) {
                    data = data.reverse(); // New old messages [Oldest -> Newest]
                    // Prepend
                    set(state => ({
                        messages: [...data, ...state.messages],
                        isLoadingMore: false,
                        hasMore: data.length === 20 // If less than limit, no more
                    }));
                } else {
                    set({ hasMore: false, isLoadingMore: false });
                }
            } else {
                set({ isLoadingMore: false });
            }
        } catch (error) {
            console.error(error);
            set({ isLoadingMore: false });
        }
    },

    sendMessage: async (content, userId, file, replyToId) => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;

        // Optimistic UI
        const tempId = crypto.randomUUID();
        const now = new Date().toISOString();

        const optimisticMsg: Message = {
            id: tempId,
            conversation_id: activeConversationId,
            sender_id: userId,
            content: content,
            created_at: now,
            is_system: false,
            status: 'sending',
            attachment_url: file ? URL.createObjectURL(file) : undefined,
            attachment_type: file ? (file.type.startsWith('image/') ? 'image' : 'file') : undefined,
            attachment_name: file?.name
        };

        set(state => ({ messages: [...state.messages, optimisticMsg] }));

        // Real Send via Direct REST (Avoids Supabase Client Hangs)
        try {
            let attachment_url = undefined;
            let attachment_type = undefined;
            let attachment_name = undefined;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;
                const filePath = `${activeConversationId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(filePath);

                attachment_url = publicUrl;
                attachment_type = (file.type.startsWith('image/') ? 'image' : 'file') as any;
                attachment_name = file.name;
            }

            const token = await getRealtimeToken();
            const url = `${SUPABASE_URL}/rest/v1/internal_messages`;

            const payload = {
                conversation_id: activeConversationId,
                sender_id: userId,
                content: content,
                reply_to_id: replyToId,
                attachment_url,
                attachment_type,
                attachment_name
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY || '',
                    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            const dataArr = await res.json();
            const data = dataArr[0]; // representation returns array

            if (data) {
                set(state => {
                    const withoutTemp = state.messages.filter(m => m.id !== tempId);
                    const realMsg = { ...data, status: 'sent' };
                    const exists = withoutTemp.find(m => m.id === realMsg.id);
                    if (exists) return { messages: withoutTemp };

                    return {
                        messages: [...withoutTemp, realMsg].sort((a, b) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        )
                    };
                });
            }
        } catch (error) {
            console.error("Send failed", error);
            set(state => ({
                messages: state.messages.map(m => m.id === tempId ? { ...m, status: 'error' } : m)
            }));
        }
    },

    createDirectConversation: async (myId, theirId) => {
        // RPC Call: get_or_create_direct_conversation(target_user_id)
        // Note: The RPC internally uses auth.uid() for the current user.
        // We shouldn't pass myId if the RPC infers it, BUT
        // strict RPCs usually take params by name.
        // Let's match the SQL signature: target_user_id

        const { data, error } = await supabase
            .rpc('get_or_create_direct_conversation', {
                target_user_id: theirId
            });
        if (error) throw error;
        get().selectConversation(data);
        return data; // conv ID
    },

    createGroupConversation: async (myId, name, members) => {
        const { data, error } = await supabase
            .from('internal_conversations')
            .insert({
                type: 'group',
                name: name,
                created_by: myId
            })
            .select()
            .single();

        if (error) throw error;
        const convId = data.id;

        // Add participants
        const participants = [myId, ...members].map(uid => ({
            conversation_id: convId,
            user_id: uid
        }));
        console.log("[ChatStore] Adding participants:", participants);

        await supabase.from('internal_participants').insert(participants);
        return convId;
    },

    markRead: async (conversationId, userId) => {
        await supabase.rpc('mark_conversation_read', {
            p_conversation_id: conversationId,
            p_user_id: userId
        });
    },

    // --- Added Implementations for UI Compatibility ---

    editMessage: async (messageId: string, newContent: string) => {
        set(state => ({
            messages: state.messages.map(m => m.id === messageId ? { ...m, content: newContent } : m)
        }));
        await supabase.from('internal_messages').update({ content: newContent }).eq('id', messageId);
    },

    deleteMessage: async (messageId: string) => {
        set(state => ({
            messages: state.messages.map(m => m.id === messageId ? { ...m, is_deleted: true, content: 'Tin nhắn đã bị xóa' } : m)
        }));
        await supabase.from('internal_messages').update({ is_deleted: true }).eq('id', messageId);
    },

    pinMessage: async (messageId: string) => {
        await supabase.from('internal_messages').update({ is_pinned: true, pinned_at: new Date().toISOString() }).eq('id', messageId);
    },

    unpinMessage: async (messageId: string) => {
        await supabase.from('internal_messages').update({ is_pinned: false, pinned_at: null }).eq('id', messageId);
    },

    searchMessages: async (query: string, conversationId?: string) => {
        const q = supabase.from('internal_messages').select('*').ilike('content', `%${query}%`).limit(20);
        if (conversationId) q.eq('conversation_id', conversationId);
        const { data } = await q;
        return data || [];
    },

    forwardMessage: async (message: Message, conversationIds: string[]) => {
        const token = await getRealtimeToken();
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;

        for (const convId of conversationIds) {
            const payload = {
                conversation_id: convId,
                sender_id: userId,
                content: message.content, // Basic text forward
                attachment_url: message.attachment_url,
                attachment_type: message.attachment_type,
                attachment_name: message.attachment_name
            };

            await fetch(`${SUPABASE_URL}/rest/v1/internal_messages`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY || '',
                    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }
    },

    updateConversationName: async (conversationId: string, name: string) => {
        const { error } = await supabase
            .from('internal_conversations')
            .update({ name })
            .eq('id', conversationId);
        if (error) throw error;
        set(state => ({
            conversations: state.conversations.map(c => c.id === conversationId ? { ...c, name } : c)
        }));
    },

    addParticipants: async (conversationId: string, userIds: string[]) => {
        const participants = userIds.map(uid => ({
            conversation_id: conversationId,
            user_id: uid
        }));
        const { error } = await supabase.from('internal_participants').insert(participants);
        if (error) throw error;
        // Refresh conversations to get new participants list
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) get().fetchConversations(userId);
    },

    leaveConversation: async (conversationId: string, userId: string) => {
        const { error } = await supabase
            .from('internal_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        if (error) throw error;
        set(state => ({
            conversations: state.conversations.filter(c => c.id !== conversationId),
            activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
        }));
    },

    sendTyping: (conversationId: string, isTyping: boolean) => {
        // No-op for stability first
    },

    // --- Global Notifications ---
    subscribeToGlobalMessages: (userId: string, callback: (msg: any) => void) => {
        const { globalChannel } = get();
        if (globalChannel) return;

        const ch = supabase.channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'internal_messages'
                },
                (payload: any) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        set({ globalChannel: ch });
    },

    unsubscribeFromGlobalMessages: () => {
        const { globalChannel } = get();
        if (globalChannel) {
            supabase.removeChannel(globalChannel);
            set({ globalChannel: null });
        }
    },

    // --- Presence (Stub for Stability) ---
    initPresence: (userId: string) => {
        // We will implement full presence later if needed.
        // For now, kep it compatible with AuthProvider.
        // Maybe minimal tracking? No, keeping it clean implementation plan A.
        console.log('[Presence] Init stub for', userId);
    },

    cleanupPresence: () => {
        console.log('[Presence] Cleanup stub');
    },

    // --- Sidebar Sync Implementation ---
    subscribeToNewConversations: (userId: string) => {
        const { participantsChannel } = get();
        if (participantsChannel) return;

        console.log(`[ChatStore] Subscribing to new conversations for: ${userId}`);
        const ch = supabase.channel(`user-participants-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'internal_participants',
                    filter: `user_id=eq.${userId}`
                },
                (payload: any) => {
                    console.log("[ChatStore] Added to new conversation! Refreshing sidebar...");
                    get().fetchConversations(userId);
                }
            )
            .subscribe((status: any) => {
                console.log(`[ChatStore] Participant subscription status: ${status}`);
            });

        set({ participantsChannel: ch });
    },

    unsubscribeFromNewConversations: () => {
        const { participantsChannel } = get();
        if (participantsChannel) {
            console.log("[ChatStore] Removing participant channel");
            supabase.removeChannel(participantsChannel);
            set({ participantsChannel: null });
        }
    },

    getTotalUnreadCount: () => {
        return get().conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    }

}));
