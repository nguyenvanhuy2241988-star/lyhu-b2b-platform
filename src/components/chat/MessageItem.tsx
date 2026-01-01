"use client";

import { useSwipeable } from "react-swipeable";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { Pin, Paperclip, Reply, Edit2, Trash2, Forward, Download, Smile, PinOff } from "lucide-react";
import { Message } from "@/lib/chatStore";
import { MessageReaction } from "@/components/chat/MessageReaction";
import { LinkPreview } from "./LinkPreview";

interface MessageItemProps {
    msg: Message;
    index: number;
    messages: Message[];
    currentUser: any;
    users: any[];
    activeConversationType?: 'direct' | 'group' | 'channel';
    virtuosoRef: any; // Passed ref to scroll
    seenByUsers: string[];
    onReply: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onDelete: (msgId: string) => void;
    onPin: (msgId: string) => void;
    onUnpin: (msgId: string) => void;
    handleForward: (msg: Message) => void;
    onImageClick: (url: string) => void;
}

export function MessageItem({
    msg,
    index,
    messages,
    currentUser,
    users,
    activeConversationType,
    virtuosoRef,
    seenByUsers,
    onReply,
    onEdit,
    onDelete,
    onPin,
    onUnpin,
    handleForward,
    onImageClick
}: MessageItemProps) {
    const isMe = msg.sender_id === currentUser?.id;
    const prevMsg = messages[index - 1];

    // Robust Date Parsing (prevents crashes on invalid dates)
    const safeDate = (dateStr: any): Date => {
        if (!dateStr) return new Date(); // Fallback
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const msgDate = safeDate(msg.created_at);
    const prevMsgDate = prevMsg ? safeDate(prevMsg.created_at) : null;

    // Grouping & Logic
    const isConsecutive = prevMsg &&
        prevMsg.sender_id === msg.sender_id &&
        prevMsgDate &&
        isSameDay(prevMsgDate, msgDate) &&
        (msgDate.getTime() - prevMsgDate.getTime() < 300000); // 5 mins

    const showDateHeader = !prevMsg || !prevMsgDate || !isSameDay(prevMsgDate, msgDate);

    const senderName = isMe ? "Bạn" : (users.find(u => u.id === msg.sender_id)?.full_name || msg.sender_id);
    const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;

    // URL Preview
    const urlMatch = msg.content?.match(/(https?:\/\/[^\s]+)/);
    const firstUrl = urlMatch ? urlMatch[0] : null;

    // Swipe Handlers
    const handlers = useSwipeable({
        onSwipedRight: () => onReply(msg),
        trackMouse: true // Allow mouse swipe too for testing
    });

    return (
        <div {...handlers} className="touch-pan-y relative select-text pb-1">
            {showDateHeader && (
                <div className="flex justify-center my-4">
                    <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {isToday(msgDate)
                            ? "Hôm nay"
                            : isYesterday(msgDate)
                                ? "Hôm qua"
                                : format(msgDate, "dd/MM/yyyy", { locale: vi })
                        }
                    </span>
                </div>
            )}

            {msg.is_system ? (
                <div className="flex justify-center my-2">
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full italic">
                        <span className="font-bold">{senderName}</span> {msg.content}
                    </span>
                </div>
            ) : msg.is_deleted ? (
                <div className={`flex gap-3 mb-2 ${isMe ? 'flex-row-reverse' : ''} group`}>
                    {!isMe && (
                        <div className="w-8 flex-shrink-0 flex flex-col items-center">
                            {!isConsecutive && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                    {senderName.charAt(0)}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 italic text-sm">Tin nhắn đã bị thu hồi</div>
                </div>
            ) : (
                <div id={`msg-${msg.id}`} className={`group flex gap-2 px-4 hover:bg-slate-50/50 transition-colors ${isMe ? 'flex-row-reverse' : ''} ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}>
                    {/* Avatar */}
                    {!isMe && (
                        <div className="w-8 flex-shrink-0 flex flex-col items-center">
                            {!isConsecutive && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase" title={senderName}>
                                    {senderName.charAt(0)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sender Name if Group & First in block & Not Me */}
                        {activeConversationType === 'group' && !isMe && !isConsecutive && (
                            <span className="text-[10px] text-slate-500 ml-1 mb-1">{senderName}</span>
                        )}

                        {/* Reply Preview */}
                        {repliedMsg && (
                            <div className={`text-xs border-l-2 pl-2 mb-1 opacity-70 cursor-pointer ${isMe ? 'border-blue-300 text-right' : 'border-slate-300'}`} onClick={() => {
                                // With Virtuoso, scrolling to specific item ID works if we map IDs to indexes.
                                const replyIndex = messages.findIndex(m => m.id === repliedMsg.id);
                                if (replyIndex !== -1 && virtuosoRef.current) {
                                    virtuosoRef.current.scrollToIndex({ index: replyIndex, align: 'center', behavior: 'smooth' });
                                }
                            }}>
                                <span className="font-bold">{users.find(u => u.id === repliedMsg.sender_id)?.full_name}:</span> {repliedMsg.content.substring(0, 30)}...
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={`relative rounded-2xl px-4 py-2 text-sm shadow-sm group-hover:shadow-md transition-shadow
                                ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                                }
                            `}
                        >
                            {msg.is_forwarded && (
                                <div className={`text-[10px] italic mb-1 flex items-center gap-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                    <Forward className="w-3 h-3" />
                                    Đã chuyển tiếp
                                </div>
                            )}
                            {msg.pinned_at && <Pin className="w-3 h-3 absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-0.5 text-white" />}

                            {msg.attachment_url ? (
                                <div className="space-y-2">
                                    {msg.attachment_type === 'image' ? (
                                        <img
                                            src={msg.attachment_url}
                                            onClick={() => onImageClick(msg.attachment_url!)}
                                            alt={msg.attachment_name}
                                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 max-h-60 object-cover"
                                        />
                                    ) : (
                                        <div className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-black/5 ${isMe ? 'bg-blue-700/20' : 'bg-slate-100'}`}
                                            onClick={() => window.open(msg.attachment_url, '_blank')}
                                        >
                                            <Paperclip className="w-4 h-4" />
                                            <span className="underline truncate max-w-[150px]">{msg.attachment_name || "Tệp đính kèm"}</span>
                                        </div>
                                    )}
                                    {msg.content && <div>{msg.content}</div>}
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                            )}

                            <MessageReaction message={msg} currentUserId={currentUser?.id} />

                            {firstUrl && !msg.is_deleted && (
                                <LinkPreview url={firstUrl} />
                            )}
                        </div>

                        {/* Seen By (Read Receipts) */}
                        {messages[messages.length - 1].id === msg.id && seenByUsers.length > 0 && (
                            <div className={`flex items-center gap-0.5 mt-1 mx-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {seenByUsers.map((userId: string) => {
                                    const u = users.find((user: any) => user.id === userId);
                                    if (!u) return null;
                                    return (
                                        <div key={userId} className="w-3 h-3 rounded-full bg-slate-200 border border-white overflow-hidden shadow-sm" title={`Đã xem: ${u.full_name}`}>
                                            <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-slate-500 uppercase">
                                                {u.full_name?.charAt(0) || u.email?.charAt(0)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Timestamp & Status */}
                        <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : ''}`}>
                            <span>{format(msgDate, 'HH:mm')}</span>
                            {isMe && msg.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}

                            {/* Actions */}
                            <div className="flex gap-1 ml-2">
                                <button onClick={() => onReply(msg)} className="text-slate-400 hover:text-blue-500"><Reply className="w-3 h-3" /></button>
                                <button onClick={() => handleForward(msg)} className="text-slate-400 hover:text-blue-500" title="Chuyển tiếp"><Forward className="w-3 h-3" /></button>
                                {isMe && <button onClick={() => onEdit(msg)} className="text-slate-400 hover:text-green-500"><Edit2 className="w-3 h-3" /></button>}
                                {isMe && <button onClick={() => onDelete(msg.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                                <button onClick={() => msg.is_pinned ? onUnpin(msg.id) : onPin(msg.id)} className={`${msg.is_pinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}><Pin className="w-3 h-3" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
