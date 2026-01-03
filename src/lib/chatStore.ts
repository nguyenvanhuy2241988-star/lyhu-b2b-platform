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
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            if (typeof window !== "undefined") {
                localStorage.setItem("lyhu_access_token", session.access_token);
            }
            return session.access_token;
        }
    } catch (e) {
        console.warn("[ChatStore] getRealtimeToken background error", e);
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
        'Prefer': 'return=representation'
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
    sender?: any;
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
    conversations: Conversation[];
    messages: Message[];
    activeConversationId: string | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    pollingInterval: NodeJS.Timeout | null;
    realtimeChannel: any;
    globalChannel: any;
    participantsChannel: any;
    onlineUsers: string[];
    typingUsers: Record<string, string[]>;

    fetchConversations: (userId: string) => Promise<void>;
    selectConversation: (conversationId: string, userId?: string) => Promise<void>;
    sendMessage: (content: string, userId: string, file?: File, replyToId?: string) => Promise<void>;
    syncMessages: (conversationId: string, isInitial?: boolean, userId?: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    markRead: (conversationId: string, userId: string) => Promise<void>;
    createDirectConversation: (myId: string, theirId: string, token?: string) => Promise<string>;
    createGroupConversation: (myId: string, name: string, members: string[]) => Promise<string>;
    editMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    pinMessage: (messageId: string) => Promise<void>;
    unpinMessage: (messageId: string) => Promise<void>;
    searchMessages: (query: string, conversationId?: string) => Promise<Message[]>;
    forwardMessage: (message: Message, conversationIds: string[]) => Promise<void>;
    updateConversationName: (conversationId: string, name: string) => Promise<void>;
    addParticipants: (conversationId: string, userIds: string[]) => Promise<void>;
    leaveConversation: (conversationId: string, userId: string) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    removeReaction: (messageId: string, emoji: string) => Promise<void>;
    getChatMedia: (conversationId: string) => Promise<Message[]>;
    startPolling: (conversationId: string) => void;
    stopPolling: () => void;
    subscribeToGlobalMessages: (userId: string, callback: (msg: any) => void) => void;
    unsubscribeFromGlobalMessages: () => void;
    subscribeToNewConversations: (userId: string) => void;
    unsubscribeFromNewConversations: () => void;
    sendTyping: (conversationId: string, isTyping: boolean) => void;
    initPresence: (userId: string) => void;
    cleanupPresence: () => void;
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
    onlineUsers: [],
    typingUsers: {},

    fetchConversations: async (userId: string) => {
        if (!userId) return;
        try {
            const token = await getRealtimeToken();
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_conversations_with_unread`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY || '',
                    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_user_id: userId })
            });

            if (!res.ok) throw new Error("Sync conversations failed");
            const data = await res.json();
            if (Array.isArray(data)) {
                set({ conversations: data.map((c: any) => ({ ...c, internal_participants: c.participants || [] })) });
            }
        } catch (e) {
            console.error(e);
        } finally {
            set({ isLoading: false });
        }
    },

    startPolling: (conversationId: string) => {
        get().stopPolling();
        const interval = setInterval(() => get().syncMessages(conversationId), 5000);
        set({ pollingInterval: interval });
    },

    stopPolling: () => {
        const { pollingInterval, realtimeChannel } = get();
        if (pollingInterval) clearInterval(pollingInterval);
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        set({ pollingInterval: null, realtimeChannel: null });
    },

    deleteConversation: async (conversationId: string) => {
        const { error } = await supabase.from('internal_conversations').delete().eq('id', conversationId);
        if (error) throw error;
        set(state => ({
            conversations: state.conversations.filter(c => c.id !== conversationId),
            activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
        }));
    },

    selectConversation: async (conversationId: string, userId?: string) => {
        get().stopPolling();
        set({ activeConversationId: conversationId, messages: [], isLoading: true, hasMore: true });

        await get().syncMessages(conversationId, true, userId);
        set({ isLoading: false });

        // Enable Realtime
        const token = await getRealtimeToken();
        if (token) supabase.realtime.setAuth(token);

        const channel = supabase.channel(`room-${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload: any) => {
                const newMsg = payload.new as Message;
                if (newMsg.conversation_id !== conversationId) return;
                set(state => {
                    if (state.messages.some(m => m.id === newMsg.id)) return state;
                    return { messages: [...state.messages, newMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) };
                });
            })
            .subscribe((status: any) => {
                if (status === 'SUBSCRIBED') get().syncMessages(conversationId, false, userId);
            });

        set({ realtimeChannel: channel });
    },

    syncMessages: async (conversationId: string, isInitial?: boolean, userId?: string) => {
        if (isInitial) set({ isLoading: true });
        try {
            const token = await getRealtimeToken();
            let url = `${SUPABASE_URL}/rest/v1/internal_messages?conversation_id=eq.${conversationId}&select=*,reactions:internal_message_reactions(emoji,user_id)`;
            const { messages } = get();

            if (isInitial || messages.length === 0) {
                url += `&order=created_at.desc&limit=50`;
            } else {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg?.created_at) {
                    url += `&created_at=gt.${encodeURIComponent(safeDate(lastMsg.created_at))}&order=created_at.asc`;
                }
            }

            const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY || '', 'Authorization': `Bearer ${token || SUPABASE_KEY}` } });
            if (!res.ok) return;

            let data = await res.json();
            if (isInitial || messages.length === 0) data = data.reverse();

            set(state => {
                if (state.activeConversationId !== conversationId) return state;
                const existing = new Map(state.messages.map(m => [m.id, m]));
                data.forEach((m: Message) => existing.set(m.id, m));
                return {
                    messages: Array.from(existing.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
                    isLoading: false
                };
            });
        } finally {
            if (isInitial) set({ isLoading: false });
        }
    },

    loadMoreMessages: async () => {
        const { messages, activeConversationId, hasMore, isLoadingMore } = get();
        if (!activeConversationId || !hasMore || isLoadingMore || messages.length === 0) return;
        set({ isLoadingMore: true });
        const oldest = messages[0];
        const token = await getRealtimeToken();
        const url = `${SUPABASE_URL}/rest/v1/internal_messages?conversation_id=eq.${activeConversationId}&created_at=lt.${encodeURIComponent(safeDate(oldest.created_at))}&select=*,reactions:internal_message_reactions(emoji,user_id)&order=created_at.desc&limit=20`;

        try {
            const res = await robustFetch(url, token);
            if (res.ok) {
                const data = (await res.json()).reverse();
                set(state => ({ messages: [...data, ...state.messages], isLoadingMore: false, hasMore: data.length === 20 }));
            }
        } finally {
            set({ isLoadingMore: false });
        }
    },

    sendMessage: async (content: string, userId: string, file?: File, replyToId?: string) => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;

        const tempId = crypto.randomUUID();
        const payload: any = {
            conversation_id: activeConversationId,
            sender_id: userId,
            content: content.trim(),
        };
        const optimistic: Message = {
            id: tempId,
            conversation_id: payload.conversation_id,
            sender_id: payload.sender_id,
            content: payload.content,
            created_at: new Date().toISOString(),
            status: 'sending'
        };
        set(state => ({ messages: [...state.messages, optimistic] }));

        try {
            let attachment_url, attachment_type, attachment_name;
            if (file) {
                const path = `${activeConversationId}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
                await supabase.storage.from('chat-attachments').upload(path, file);
                attachment_url = supabase.storage.from('chat-attachments').getPublicUrl(path).data.publicUrl;
                attachment_type = file.type.startsWith('image/') ? 'image' : 'file';
                attachment_name = file.name;
            }

            const messagePayload = {
                conversation_id: activeConversationId,
                sender_id: userId,
                content,
                reply_to_id: replyToId,
                attachment_url,
                attachment_type,
                attachment_name
            };

            const [data] = await sendRequest<Message[]>('internal_messages', 'POST', messagePayload);
            updateStatusInStore(tempId, 'sent');
            set(state => ({ messages: state.messages.map(m => m.id === tempId ? { ...data, status: 'sent' } : m) }));
        } catch (error) {
            console.error("Failed to send message:", error);
            updateStatusInStore(tempId, 'error');
        }
    },

    createDirectConversation: async (myId: string, theirId: string, providedToken?: string) => {
        const token = providedToken || await getRealtimeToken();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_or_create_direct_conversation`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY || '', 'Authorization': `Bearer ${token || SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_user_id: theirId })
        });
        if (!res.ok) throw new Error("Failed to create conversation");
        const convId = await res.json();
        await get().fetchConversations(myId);
        get().selectConversation(convId, myId);
        return convId;
    },

    createGroupConversation: async (myId: string, name: string, members: string[]) => {
        const { data, error } = await supabase.from('internal_conversations').insert({ type: 'group', name, created_by: myId }).select().single();
        if (error) throw error;
        const participants = [myId, ...members].map(uid => ({ conversation_id: data.id, user_id: uid }));
        await supabase.from('internal_participants').insert(participants);
        return data.id;
    },

    markRead: async (conversationId: string, userId: string) => {
        await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId, p_user_id: userId });
    },

    editMessage: async (messageId: string, content: string) => {
        set(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, content } : m) }));
        await supabase.from('internal_messages').update({ content }).eq('id', messageId);
    },

    deleteMessage: async (messageId: string) => {
        set(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, is_deleted: true, content: 'Tin nhắn đã bị xóa' } : m) }));
        await supabase.from('internal_messages').update({ is_deleted: true }).eq('id', messageId);
    },

    pinMessage: async (messageId: string) => {
        await supabase.from('internal_messages').update({ is_pinned: true, pinned_at: new Date().toISOString() }).eq('id', messageId);
    },

    unpinMessage: async (messageId: string) => {
        await supabase.from('internal_messages').update({ is_pinned: false, pinned_at: null }).eq('id', messageId);
    },

    searchMessages: async (query: string, conversationId?: string) => {
        const token = await getRealtimeToken();
        let url = `${SUPABASE_URL}/rest/v1/internal_messages?content=ilike.*${encodeURIComponent(query)}*&limit=20`;
        if (conversationId) url += `&conversation_id=eq.${conversationId}`;
        const res = await robustFetch(url, token);
        return res.ok ? await res.json() : [];
    },

    forwardMessage: async (message: Message, conversationIds: string[]) => {
        const token = await getRealtimeToken();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        for (const cid of conversationIds) {
            await fetch(`${SUPABASE_URL}/rest/v1/internal_messages`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_KEY || '', 'Authorization': `Bearer ${token || SUPABASE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: cid, sender_id: user.id, content: message.content, attachment_url: message.attachment_url, attachment_type: message.attachment_type, attachment_name: message.attachment_name })
            });
        }
    },

    updateConversationName: async (conversationId: string, name: string) => {
        await supabase.from('internal_conversations').update({ name }).eq('id', conversationId);
        set(state => ({ conversations: state.conversations.map(c => c.id === conversationId ? { ...c, name } : c) }));
    },

    addParticipants: async (conversationId: string, userIds: string[]) => {
        await supabase.from('internal_participants').insert(userIds.map(uid => ({ conversation_id: conversationId, user_id: uid })));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) get().fetchConversations(user.id);
    },

    leaveConversation: async (conversationId: string, userId: string) => {
        await supabase.from('internal_participants').delete().eq('conversation_id', conversationId).eq('user_id', userId);
        set(state => ({ conversations: state.conversations.filter(c => c.id !== conversationId), activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId }));
    },

    addReaction: async (messageId: string, emoji: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        set(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), { emoji, user_id: user.id }] } : m) }));
        const { data: msg } = await supabase.from('internal_messages').select('reactions').eq('id', messageId).single();
        await supabase.from('internal_messages').update({ reactions: [...(msg?.reactions || []), { emoji, user_id: user.id }] }).eq('id', messageId);
    },

    removeReaction: async (messageId: string, emoji: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        set(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => !(r.emoji === emoji && r.user_id === user.id)) } : m) }));
        const { data: msg } = await supabase.from('internal_messages').select('reactions').eq('id', messageId).single();
        await supabase.from('internal_messages').update({ reactions: (msg?.reactions || []).filter((r: any) => !(r.emoji === emoji && r.user_id === user.id)) }).eq('id', messageId);
    },

    getChatMedia: async (conversationId: string) => {
        const { data } = await supabase.from('internal_messages').select('*').eq('conversation_id', conversationId).not('attachment_url', 'is', null).order('created_at', { ascending: false });
        return data || [];
    },

    sendTyping: () => { },
    initPresence: () => { },
    cleanupPresence: () => { },

    subscribeToGlobalMessages: (userId: string, callback: (payload: any) => void) => {
        const channel = supabase.channel(`global-${userId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload: any) => callback(payload.new)).subscribe();
        set({ globalChannel: channel });
    },

    unsubscribeFromGlobalMessages: () => {
        const { globalChannel } = get();
        if (globalChannel) supabase.removeChannel(globalChannel);
        set({ globalChannel: null });
    },

    subscribeToNewConversations: (userId) => {
        const channel = supabase.channel(`participants-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'internal_participants', filter: `user_id=eq.${userId}` }, () => get().fetchConversations(userId)).subscribe();
        set({ participantsChannel: channel });
    },

    unsubscribeFromNewConversations: () => {
        const { participantsChannel } = get();
        if (participantsChannel) supabase.removeChannel(participantsChannel);
        set({ participantsChannel: null });
    },

    getTotalUnreadCount: () => get().conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
}));
// --- Helpers for cleaner code ---
async function sendRequest<T>(path: string, method: string, payload: any = null): Promise<T> {
    const token = await getRealtimeToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY || '',
        'Authorization': `Bearer ${token || SUPABASE_KEY}`,
        'Prefer': 'return=representation'
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Request failed');
    }
    return res.json();
}

function updateStatusInStore(messageId: string, status: 'sending' | 'sent' | 'error') {
    useChatStore.setState((state) => ({
        messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, status } : m
        ),
    }));
}
