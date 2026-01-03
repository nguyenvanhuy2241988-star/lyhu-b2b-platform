"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/lib/chatStore";
import { Users, Settings, Pin, UploadCloud, ChevronLeft, Search, X, Info } from "lucide-react";
import MessageList, { MessageListRef } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSettingsModal } from "@/components/chat/ChatSettingsModal";
import { ChatInfoPanel } from "@/components/chat/ChatInfoPanel";
import { Lightbox } from "@/components/ui/Lightbox";
import { format } from "date-fns";

interface ChatWindowProps {
    currentUser: any;
    users: any[];
    activeConversationId: string | null;
    conversations: any[];
    activeConversation: any;
    messages: Message[];
    onlineUsers: string[];
    typingUsers: Record<string, string[]>;

    // Pagination
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMoreMessages: () => void;

    // Actions
    sendMessage: (content: string, userId: string, file?: File, replyToId?: string) => Promise<void>;
    editMessage: (msgId: string, content: string) => Promise<void>;
    deleteMessage: (msgId: string) => Promise<void>;
    pinMessage: (msgId: string) => Promise<void>;
    unpinMessage: (msgId: string) => Promise<void>;
    sendTyping: (convId: string, isTyping: boolean) => void;
    markRead: (convId: string, userId: string) => void;
    onBack?: () => void;
    searchMessages: (query: string, conversationId?: string) => Promise<Message[]>;
}

export function ChatWindow(props: ChatWindowProps) {
    const {
        currentUser,
        users,
        activeConversationId,
        activeConversation,
        messages,
        onlineUsers,
        typingUsers,
        hasMore,
        isLoadingMore,
        loadMoreMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        pinMessage,
        unpinMessage,
        sendTyping,
        onBack,
        markRead,
        searchMessages
    } = props;

    const messageListRef = useRef<MessageListRef>(null);

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);

    // Search State
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    // Search Effect
    useEffect(() => {
        if (!searchTerm || !activeConversationId) {
            setSearchResults([]);
            return;
        }
        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchMessages(searchTerm, activeConversationId);
                setSearchResults(results);
            } catch (e) { console.error(e); }
            finally { setIsSearching(false); }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, activeConversationId, searchMessages]);

    // Cleanup Search & Info Panel on Conversation Change
    useEffect(() => {
        setShowSearch(false);
        setSearchTerm("");
        setShowInfoPanel(false);
    }, [activeConversationId]);

    // Derived State
    const pinnedMessages = messages.filter(m => m.is_pinned && !m.is_deleted);

    const activeTargetUser = activeConversation && (activeConversation.type === 'direct' || !activeConversation.type)
        ? users.find(u => activeConversation.internal_participants?.find((p: any) => p.user_id === u.id && u.id !== currentUser?.id))
        : null;

    const getDisplayName = (conv: any) => {
        if (!conv) return "";
        if (conv.name) return conv.name;
        if (conv.type === 'direct' || !conv.type) {
            const other = conv.internal_participants?.find((p: any) => p.user_id !== currentUser?.id);
            if (other) {
                // Priority 1: RPC provided data
                if (other.full_name) return other.full_name;
                if (other.email) return other.email;

                // Priority 2: Secondary users lookup
                const u = users.find(u => u.id === other.user_id);
                return u?.full_name || u?.email || "Người dùng";
            }
        }
        return "Cuộc hội thoại";
    };

    const activeTypingUsers = activeConversationId ? (typingUsers[activeConversationId] || []) : [];
    const typingNames = activeTypingUsers
        .map(id => users.find(u => u.id === id)?.full_name || users.find(u => u.id === id)?.email)
        .filter(Boolean)
        .join(", ");

    const lastMessage = messages[messages.length - 1];
    const seenByUsers = activeConversation?.internal_participants
        ?.filter((p: any) =>
            p.user_id !== currentUser?.id &&
            lastMessage &&
            p.last_read_at &&
            (new Date(p.last_read_at || 0).getTime() >= new Date(lastMessage.created_at || 0).getTime())
        )
        .map((p: any) => p.user_id) || [];

    // Handlers
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setPendingFile(file);
        }
    };

    const handleDelete = async (msgId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
            await deleteMessage(msgId);
        }
    };

    const handleCancelAction = () => {
        setReplyingTo(null);
        setEditingMessage(null);
        setPendingFile(null);
    };

    const scrollToMessage = (messageId: string) => {
        const index = messages.findIndex(m => m.id === messageId);
        if (index !== -1 && messageListRef.current) {
            messageListRef.current.scrollToIndex(index);
        } else {
            // Fallback if not loaded
            if (!hasMore) {
                alert("Tin nhắn không tìm thấy trong danh sách đã tải.");
            } else {
                alert("Tin nhắn cũ chưa được tải. Vui lòng tải thêm tin nhắn cũ hơn.");
                // Ideally trigger loadMoreMessages until found, but simpler for V1 to just alert.
            }
        }
    };

    return (
        <div
            className="flex-1 flex flex-col bg-white overflow-hidden relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-blue-500 border-dashed m-4 rounded-xl flex items-center justify-center backdrop-blur-sm pointer-events-none">
                    <div className="bg-white p-6 rounded-full shadow-xl">
                        <UploadCloud className="w-10 h-10 text-blue-600 animate-bounce" />
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && <Lightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {/* Empty State when no conversation selected */}
            {!activeConversationId && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                        <Search className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Chào mừng bạn đến với Chat</h3>
                    <p className="max-w-xs text-sm leading-relaxed">
                        Hãy chọn một cuộc hội thoại ở bên trái hoặc bắt đầu trò chuyện với đồng nghiệp để bắt đầu.
                    </p>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mt-6 md:hidden bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-lg shadow-blue-200"
                        >
                            Xem danh sách chat
                        </button>
                    )}
                </div>
            )}

            {activeConversationId && (
                <>
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-10 h-16 shadow-sm shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Back Button (Mobile) */}
                            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {activeTargetUser ? (
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-slate-200">
                                        {getDisplayName(activeConversation).charAt(0).toUpperCase()}
                                    </div>
                                    {onlineUsers.includes(activeTargetUser.id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                                </div>
                            ) : activeConversation?.type === 'group' ? (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-slate-200">
                                    <Users className="w-5 h-5" />
                                </div>
                            ) : null}
                            <div>
                                <h3 className="font-bold text-slate-800">{getDisplayName(activeConversation)}</h3>
                                {activeConversation?.type === 'group' && <span className="text-xs text-slate-500">{activeConversation.internal_participants?.length} thành viên</span>}
                                {activeTargetUser && <span className="text-xs text-slate-500">{onlineUsers.includes(activeTargetUser.id) ? 'Đang hoạt động' : 'Offline'}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Search Toggle */}
                            {showSearch ? (
                                <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 animate-in fade-in slide-in-from-right-4">
                                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                                    <input
                                        autoFocus
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent border-none text-sm focus:ring-0 w-32 md:w-48 placeholder:text-slate-400"
                                        placeholder="Tìm trong tin nhắn..."
                                    />
                                    <button onClick={() => { setShowSearch(false); setSearchTerm(""); }} className="ml-1 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button onClick={() => setShowSearch(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Tìm kiếm tin nhắn">
                                    <Search className="w-5 h-5" />
                                </button>
                            )}

                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            {/* Settings / Info Toggle */}
                            {activeConversation?.type === 'group' && !showInfoPanel && (
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Cài đặt nhóm"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            )}

                            {/* Chat Info Panel Toggle */}
                            <button
                                onClick={() => setShowInfoPanel(!showInfoPanel)}
                                className={`p-2 rounded-full transition-colors ${showInfoPanel ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                title="Thông tin hội thoại"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Layout: Chat + Info Panel */}
                    <div className="flex-1 flex overflow-hidden relative">

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white">
                            {/* In-Chat Search Bar Results Overlay */}
                            {showSearch && searchTerm && (
                                <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-md p-0 flex flex-col max-h-64">
                                    <div className="p-2 border-b flex justify-between items-center text-xs text-slate-500">
                                        <span>Kết quả tìm kiếm cho "{searchTerm}"</span>
                                        <button onClick={() => { setShowSearch(false); setSearchTerm('') }} className="text-blue-500">Đóng</button>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar flex-1">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-xs text-slate-500">Đang tìm kiếm...</div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {searchResults.map(msg => {
                                                    const sender = users.find(u => u.id === msg.sender_id);
                                                    const safeDate = (d: any) => {
                                                        const date = new Date(d);
                                                        return isNaN(date.getTime()) ? new Date() : date;
                                                    };
                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            onClick={() => scrollToMessage(msg.id)}
                                                            className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                                        >
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <span className="text-xs font-bold text-slate-700">{sender?.full_name || "Unknown"}</span>
                                                                <span className="text-[10px] text-slate-400">{format(safeDate(msg.created_at), 'dd/MM HH:mm')}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-600 truncate">{msg.content}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-xs text-slate-500">Không tìm thấy kết quả.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pinned Messages Banner */}
                            {pinnedMessages.length > 0 && (
                                <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 shrink-0 z-10">
                                    <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" />
                                    <div className="flex-1 overflow-hidden">
                                        {pinnedMessages.map(pm => (
                                            <div key={pm.id} className="text-xs text-slate-700 truncate cursor-pointer hover:underline" onClick={() => scrollToMessage(pm.id)}>
                                                <span className="font-bold">{users.find(u => u.id === pm.sender_id)?.full_name}:</span> {pm.content}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <MessageList
                                ref={messageListRef}
                                messages={messages}
                                currentUser={currentUser}
                                users={users}
                                activeConversationType={activeConversation?.type}
                                hasMore={hasMore}
                                isLoadingMore={isLoadingMore}
                                loadMoreMessages={loadMoreMessages}
                                seenByUsers={seenByUsers}
                                activeTypingUsers={activeTypingUsers}
                                typingNames={typingNames}
                                onReply={(msg) => {
                                    setReplyingTo(msg);
                                    setEditingMessage(null);
                                }}
                                onEdit={(msg) => {
                                    setEditingMessage(msg);
                                    setReplyingTo(null);
                                }}
                                onDelete={handleDelete}
                                onPin={(id) => pinMessage(id)}
                                onUnpin={(id) => unpinMessage(id)}
                                onImageClick={(url) => setLightboxUrl(url)}
                            />

                            <ChatInput
                                currentUser={currentUser}
                                users={users}
                                activeConversationId={activeConversationId}
                                replyingTo={replyingTo}
                                editingMessage={editingMessage}
                                pendingFile={pendingFile}
                                onSetPendingFile={setPendingFile}
                                onSend={async (content, file) => {
                                    await sendMessage(content, currentUser.id, file, replyingTo?.id);
                                    setReplyingTo(null);
                                    setPendingFile(null);
                                    // Auto scroll to bottom handled by message list new message detection
                                }}
                                onEdit={async (msgId, content) => {
                                    await editMessage(msgId, content);
                                    setEditingMessage(null);
                                }}
                                onCancelAction={handleCancelAction}
                                onTyping={(isTyping) => {
                                    if (activeConversationId) sendTyping(activeConversationId, isTyping);
                                }}
                            />
                        </div>

                        {/* Right Sidebar: Info Panel */}
                        {showInfoPanel && (
                            <ChatInfoPanel
                                conversation={activeConversation}
                                users={users}
                                onClose={() => setShowInfoPanel(false)}
                            />
                        )}
                    </div>

                    {/* Settings Modal */}
                    {showSettings && activeConversation && (
                        <ChatSettingsModal
                            conversation={activeConversation}
                            currentUser={currentUser}
                            users={users}
                            onClose={() => setShowSettings(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
}
