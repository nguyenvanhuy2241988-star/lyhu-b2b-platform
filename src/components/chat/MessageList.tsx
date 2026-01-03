"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { Message } from "@/lib/chatStore";
import { Download, Smile, Reply } from "lucide-react";
import { ForwardModal } from "./ForwardModal";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { MessageItem } from "./MessageItem";
import { CHAT_CONSTANTS } from "@/lib/chatConstants";
import React from "react";

export interface MessageListRef {
    scrollToIndex: (index: number) => void;
    scrollToBottom: () => void;
    getMessages: () => Message[];
}

interface MessageListProps {
    messages: Message[];
    currentUser: any;
    users: any[];
    activeConversationType?: 'direct' | 'group' | 'channel';

    // Pagination
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMoreMessages: () => void;

    // Seen Status
    seenByUsers: string[];

    // Typing Status
    activeTypingUsers: string[];
    typingNames: string;

    // Actions
    onReply: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onDelete: (msgId: string) => void;
    onPin: (msgId: string) => void;
    onUnpin: (msgId: string) => void;
    onImageClick: (url: string) => void;
}

const MessageList = React.memo(forwardRef<MessageListRef, MessageListProps>(({
    messages,
    currentUser,
    users,
    activeConversationType,
    hasMore,
    isLoadingMore,
    loadMoreMessages,
    seenByUsers,
    activeTypingUsers,
    typingNames,
    onReply,
    onEdit,
    onDelete,
    onPin,
    onUnpin,
    onImageClick
}, ref) => {
    // Removed spam logging

    // Forwarding State
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [selectedMessageForForward, setSelectedMessageForForward] = useState<Message | null>(null);

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    // Track previous message length to detect new messages for auto-scroll
    const prevMessagesLength = useRef(messages.length);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        scrollToIndex: (index: number) => {
            virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
        },
        scrollToBottom: () => {
            virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'smooth' });
        },
        getMessages: () => messages
    }));

    const handleForward = useCallback((msg: Message) => {
        setSelectedMessageForForward(msg);
        setForwardModalOpen(true);
    }, []);

    useEffect(() => {
        // Auto-scroll logic:
        if (messages.length > prevMessagesLength.current) {
            const lastMsg = messages[messages.length - 1];
            const isMe = lastMsg?.sender_id === currentUser?.id;

            // Force scroll if it's me OR if we are properly following output
            if (!showScrollBottom || isMe) {
                // Use a slight delay to ensure virtualizer has calculated sizes
                setTimeout(() => {
                    virtuosoRef.current?.scrollToIndex({
                        index: messages.length - 1,
                        align: 'end',
                        behavior: 'smooth'
                    });
                }, CHAT_CONSTANTS.SCROLL_DELAY_MS);
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages.length, currentUser?.id, showScrollBottom]);

    return (
        <div className="flex-1 min-h-0 bg-slate-50 flex flex-col relative">
            {/* Main Virtualized List */}
            {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Smile className="w-8 h-8 text-slate-300" />
                    </div>
                    <p>Chưa có tin nhắn nào</p>
                    <p className="text-xs">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
            ) : (
                <Virtuoso
                    ref={virtuosoRef}
                    style={{ height: '100%' }}
                    data={messages}
                    initialTopMostItemIndex={messages.length - 1}
                    followOutput={"auto"}
                    atBottomStateChange={(atBottom) => setShowScrollBottom(!atBottom)}
                    atTopStateChange={(atTop) => {
                        if (atTop && hasMore && !isLoadingMore) {
                            loadMoreMessages();
                        }
                    }}
                    itemContent={(index, msg) => (
                        <MessageItem
                            key={msg.id}
                            msg={msg}
                            index={index}
                            messages={messages}
                            currentUser={currentUser}
                            users={users}
                            activeConversationType={activeConversationType}
                            virtuosoRef={virtuosoRef}
                            seenByUsers={seenByUsers}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onPin={onPin}
                            onUnpin={onUnpin}
                            handleForward={handleForward}
                            onImageClick={onImageClick}
                        />
                    )}
                    className="custom-scrollbar"
                    components={{
                        Header: () => isLoadingMore ? (
                            <div className="flex justify-center py-2">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : null
                    }}
                />
            )}

            {/* Scroll to bottom button */}
            {showScrollBottom && (
                <button
                    onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'smooth' })}
                    className="absolute bottom-12 right-4 z-20 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105 animate-in fade-in zoom-in"
                >
                    <div className="rotate-180"><div className="rotate-180"><Reply className="w-5 h-5 rotate-180" /></div></div>
                    <span className="text-xs font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white">↓</span>
                </button>
            )}

            {/* Overlays (Typing) */}
            {activeTypingUsers.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-transparent text-xs text-slate-400 px-4 pointer-events-none">
                    <div className="animate-pulse">{typingNames} đang soạn tin...</div>
                </div>
            )}

            {forwardModalOpen && selectedMessageForForward && (
                <ForwardModal
                    isOpen={forwardModalOpen}
                    onClose={() => {
                        setForwardModalOpen(false);
                        setSelectedMessageForForward(null);
                    }}
                    message={selectedMessageForForward}
                    users={users}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}), (prevProps: Readonly<MessageListProps>, nextProps: Readonly<MessageListProps>) => {
    // Custom comparison: skip re-render if fundamental props haven't changed
    return (
        prevProps.messages?.length === nextProps.messages?.length &&
        prevProps.messages?.[prevProps.messages.length - 1]?.id === nextProps.messages?.[nextProps.messages.length - 1]?.id &&
        prevProps.currentUser?.id === nextProps.currentUser?.id &&
        prevProps.isLoadingMore === nextProps.isLoadingMore &&
        prevProps.activeTypingUsers?.length === nextProps.activeTypingUsers?.length &&
        prevProps.seenByUsers?.length === nextProps.seenByUsers?.length
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
