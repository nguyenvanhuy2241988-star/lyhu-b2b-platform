"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Paperclip, Smile, X, Edit2 } from "lucide-react";
import { Message } from "@/lib/chatStore";

interface ChatInputProps {
    currentUser: any;
    users: any[];
    activeConversationId: string | null;
    replyingTo: Message | null;
    editingMessage: Message | null;
    pendingFile: File | null; // Enhancement: Drag & Drop / Paste Support
    onSetPendingFile: (file: File | null) => void;
    onSend: (content: string, file?: File) => Promise<void>;
    onEdit: (msgId: string, content: string) => Promise<void>;
    onCancelAction: () => void;
    onTyping: (isTyping: boolean) => void;
}

export function ChatInput({
    currentUser,
    users,
    activeConversationId,
    replyingTo,
    editingMessage,
    pendingFile,
    onSetPendingFile,
    onSend,
    onEdit,
    onCancelAction,
    onTyping
}: ChatInputProps) {
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Upload Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Mentions State
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionCursorIndex, setMentionCursorIndex] = useState(0);

    // Typing Debounce
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Effect: Update input when editing
    useEffect(() => {
        if (editingMessage) {
            setInput(editingMessage.content);
            inputRef.current?.focus();
        } else if (!replyingTo && !pendingFile) {
            // Only clear if NOT replying AND NOT pending file
            if (input === (editingMessage as any)?.content) {
                setInput("");
            }
        }
    }, [editingMessage, replyingTo, pendingFile, input]);

    // Cleanup typing timeout
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        setInput(val);

        // Mention Logic
        const lastAt = val.lastIndexOf('@', cursorPosition - 1);
        if (lastAt !== -1) {
            const query = val.slice(lastAt + 1, cursorPosition);
            if (!query.includes(' ')) { // Only trigger if no spaces after @
                setShowMentionPopup(true);
                setMentionQuery(query);
                setMentionCursorIndex(lastAt);
            } else {
                setShowMentionPopup(false);
            }
        } else {
            setShowMentionPopup(false);
        }

        if (!activeConversationId || !currentUser) return;

        // Typing Indicator Logic
        onTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to turn OFF
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const insertMention = (user: any) => {
        const before = input.slice(0, mentionCursorIndex);
        const after = input.slice(mentionCursorIndex + mentionQuery.length + 1);
        const newValue = `${before}@${user.full_name || user.email.split('@')[0]} ${after}`;
        setInput(newValue);
        setShowMentionPopup(false);
        inputRef.current?.focus();
    };

    const handleSubmit = async (e: React.FormEvent, directFile?: File) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        // Use either directFile (from button) or pendingFile (from drag/paste)
        const fileToSend = directFile || pendingFile;

        if ((!input.trim() && !fileToSend) || !activeConversationId) return;

        setIsSubmitting(true);
        try {
            if (editingMessage) {
                await onEdit(editingMessage.id, input);
            } else {
                // Optimistic Clear: Don't wait for server
                onSend(input, fileToSend || undefined).catch(e => console.error("Send failed subtly:", e));
            }
            // Clear immediately
            setInput("");
            setShowEmojiPicker(false);
            onSetPendingFile(null);
        } catch (error) {
            console.error("Failed to edit:", error);
        } finally {
            setIsSubmitting(false);
            // Keep focus
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    };

    const handleCancel = () => {
        onCancelAction();
        onSetPendingFile(null);
    }

    return (
        <div className="relative p-4 border-t border-slate-200 bg-white">
            {/* Mention Popup */}
            {showMentionPopup && (
                <div className="absolute bottom-full left-4 mb-2 z-50 bg-white rounded-lg shadow-xl border border-slate-200 w-64 max-h-48 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100 text-xs font-semibold text-slate-500">Nhắc đến ai đó...</div>
                    {users
                        .filter(u =>
                            (u.full_name?.toLowerCase() || "").includes(mentionQuery.toLowerCase()) ||
                            (u.email?.toLowerCase() || "").includes(mentionQuery.toLowerCase())
                        )
                        .map(u => (
                            <div
                                key={u.id}
                                className="p-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                                onClick={() => insertMention(u)}
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="text-sm text-slate-700 truncate">{u.full_name || u.email}</div>
                            </div>
                        ))}
                </div>
            )}

            {/* Actions Banner (Replying / Editing / Pending File) */}
            {(replyingTo || editingMessage || pendingFile) && (
                <div className="flex items-center justify-between mb-2 px-4 py-2 bg-slate-50 border-l-4 border-blue-500 rounded-r text-sm text-slate-600">
                    <div>
                        {editingMessage && <span className="font-bold text-blue-600 block">Đang chỉnh sửa tin nhắn</span>}
                        {replyingTo && <span className="font-bold text-blue-600 block">Đang trả lời {users.find(u => u.id === replyingTo?.sender_id)?.full_name || '...'}</span>}
                        {pendingFile && <span className="font-bold text-green-600 block">Đang gửi tệp: {pendingFile.name}</span>}

                        <span className="truncate block opacity-80 max-w-xs">
                            {editingMessage ? "" : (replyingTo?.content || (pendingFile ? (pendingFile.type.startsWith('image/') ? '📷 Ảnh đang chờ gửi' : '📎 Tệp đang chờ gửi') : "[Đính kèm]"))}
                        </span>
                    </div>
                    <button onClick={handleCancel} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-50 grid grid-cols-6 gap-2 w-64">
                    {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '✨', '👋', '🙏', '🤝', '✅', '❌', '❤️', '💔', '💯', '🤔'].map(emoji => (
                        <button key={emoji} onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }} className="text-xl p-1 hover:bg-slate-100 rounded">{emoji}</button>
                    ))}
                </div>
            )}

            <form onSubmit={e => handleSubmit(e)} className="relative flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleSubmit(e as any, e.target.files[0]); }} />
                <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleSubmit(e as any, e.target.files[0]); }} />

                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Gửi hình ảnh"><ImageIcon className="w-5 h-5" /></button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Gửi tập tin"><Paperclip className="w-5 h-5" /></button>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors" title="Biểu tượng cảm xúc"><Smile className="w-5 h-5" /></button>

                <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onPaste={(e) => {
                        const items = e.clipboardData.items;
                        for (let i = 0; i < items.length; i++) {
                            if (items[i].kind === 'file') {
                                const file = items[i].getAsFile();
                                if (file) {
                                    onSetPendingFile(file);
                                    e.preventDefault(); // Prevent paste as text if it's a file
                                    return;
                                }
                            }
                        }
                    }}
                    className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder-slate-400"
                    placeholder={editingMessage ? "Sửa tin nhắn..." : "Nhắn tin (hoặc dán ảnh)..."}
                />
                <button
                    type="submit"
                    disabled={(!input.trim() && !pendingFile) || isSubmitting}
                    className={`p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${isSubmitting ? 'animate-pulse' : ''}`}
                >
                    {editingMessage ? <Edit2 className="w-4 h-4 ml-0.5" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
            </form>
        </div>
    );
}
