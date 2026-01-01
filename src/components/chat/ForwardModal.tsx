
import { useState, useEffect } from 'react';
import { useChatStore, Conversation, Message } from '@/lib/chatStore';
import { X, Search, Check, Send } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ForwardModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: Message;
    users: any[];
    currentUser: any;
}

export function ForwardModal({ isOpen, onClose, message, users, currentUser }: ForwardModalProps) {
    const { conversations, fetchConversations, forwardMessage, createDirectConversation } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser?.id) {
            fetchConversations(currentUser.id);
            setSelectedIds([]);
            setSearchQuery('');
        }
    }, [isOpen, fetchConversations, currentUser]);

    if (!isOpen) return null;

    const filteredConversations = conversations.filter(c => {
        let name = c.name;
        if (!name && c.type === 'direct') {
            const otherUser = c.internal_participants?.find(p => p.user_id !== currentUser?.id)?.users;
            name = otherUser?.full_name || otherUser?.email || 'Unknown User';
        }
        name = name || 'Unknown Conversation';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredUsers = users.filter(u => {
        if (u.id === currentUser?.id) return false;
        // Exclude users we already have a DM with (optional, but good for cleanliness)
        // Actually, if we have a DM, it should appear in filteredConversations. 
        // We only want to show Users who DO NOT have a visible DM in filteredConversations.
        // Or simpler: Show both, but dedupe.
        // Let's just show users that match search, and if picked, we ensure DM exists.
        return (u.full_name || u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    });

    // We need a unified list of selectable items.
    // Item can be { type: 'conversation', data: Conversation } OR { type: 'user', data: User }
    // But forwardMessage expects conversationIds.
    // So if user selects a 'user' item, we need to resolve it to a conversationId (create if needed).

    // Helper to get conversation name/avatar
    const getConversationMeta = (c: Conversation) => {
        let name = c.name;
        let avatar = (c as any).image_url;

        if (!name && c.type === 'direct') {
            const otherUser = c.internal_participants?.find(p => p.user_id !== currentUser?.id)?.users;
            name = otherUser?.full_name || otherUser?.email;
            avatar = otherUser?.avatar_url;
        }

        return { name: name || 'Trò chuyện chưa đặt tên', avatar };
    };

    // State for selections now needs to track TYPE + ID to be distinguishing
    // Actually, let's keep selectedIds as just strings.
    // If string starts with 'user:', it's a user. If normal UUID, it's conversation.
    // Wait, user ID is also UUID.
    // Let's use prefix 'user_' for user IDs in selection.

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (selectedIds.length === 0) return;
        setSending(true);
        try {
            const finalConversationIds: string[] = [];

            for (const id of selectedIds) {
                if (id.startsWith('user_')) {
                    const userId = id.replace('user_', '');
                    // Create/Get DM
                    const convId = await createDirectConversation(currentUser.id, userId);
                    if (convId) finalConversationIds.push(convId);
                } else {
                    finalConversationIds.push(id);
                }
            }

            if (finalConversationIds.length > 0) {
                await forwardMessage(message, finalConversationIds);
            }
            onClose();
        } catch (error) {
            console.error("Failed to forward", error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Chuyển tiếp tin nhắn</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-50 sticky top-0 bg-white z-10">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm người hoặc nhóm..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {/* Conversations */}
                    {filteredConversations.map(c => {
                        const { name, avatar } = getConversationMeta(c);
                        const isSelected = selectedIds.includes(c.id);
                        return (
                            <button
                                key={c.id}
                                onClick={() => toggleSelection(c.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                        {avatar ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={avatar}
                                                    alt={name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                                                {name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-900 truncate">{name}</div>
                                    <div className="text-xs text-slate-500 truncate">
                                        {c.last_message_at ? (() => {
                                            const d = new Date(c.last_message_at);
                                            return format(isNaN(d.getTime()) ? new Date() : d, 'HH:mm dd/MM', { locale: vi });
                                        })() : 'Chưa có tin nhắn'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {/* Users (Only show if search active to avoid clutter?) Or always? User requested ability to find users. */}
                    {/* Filter out users that are already essentially represented by a DM conversation above? */}
                    {filteredUsers.map(u => {
                        // Check if we already have a DM with this user in filteredConversations
                        // To avoid duplicates
                        const hasDM = filteredConversations.some(c => c.type === 'direct' && c.internal_participants?.some(p => p.user_id === u.id));
                        if (hasDM) return null;

                        const selectionId = `user_${u.id}`;
                        const isSelected = selectedIds.includes(selectionId);

                        return (
                            <button
                                key={u.id}
                                onClick={() => toggleSelection(selectionId)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium uppercase">
                                            {u.email?.[0]}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-900 truncate">{u.full_name || u.email}</div>
                                    <div className="text-xs text-slate-500 truncate">
                                        Người dùng mới
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {filteredConversations.length === 0 && filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Không tìm thấy kết quả nào
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
                    <div className="text-sm text-slate-500">
                        {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length}` : ''}
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={selectedIds.length === 0 || sending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
                    >
                        {sending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        <span>Gửi</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
