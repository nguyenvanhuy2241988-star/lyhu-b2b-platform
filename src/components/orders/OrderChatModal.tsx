"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import {
    OrderMessage,
    fetchOrderMessages,
    sendMessage,
    uploadChatImage,
    subscribeToOrderMessages,
    markChatAsRead
} from "@/lib/orderChatStore";
import { useAuth } from "@/components/auth/AuthProvider";

interface OrderChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderReadableId: string;
    onMarkAsRead?: () => void; // Callback to refresh badge
}

export function OrderChatModal({ isOpen, onClose, orderId, orderReadableId, onMarkAsRead }: OrderChatModalProps) {
    const { user, session } = useAuth();
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load messages and subscribe
    useEffect(() => {
        if (!isOpen || !orderId) return;

        const loadMessages = async () => {
            setIsLoading(true);
            const data = await fetchOrderMessages(orderId, session?.access_token);
            setMessages(data);
            setIsLoading(false);
            setTimeout(scrollToBottom, 100);

            // Mark as read when opening chat
            markChatAsRead(orderId);
            onMarkAsRead?.();
        };

        loadMessages();

        // Subscribe to new messages
        const unsubscribe = subscribeToOrderMessages(orderId, (newMsg) => {
            setMessages(prev => {
                // Check if message already exists (by ID or similar temp ID)
                const exists = prev.some(m =>
                    m.id === newMsg.id ||
                    (m.id.startsWith('temp-') && m.content === newMsg.content && m.senderId === newMsg.senderId)
                );
                if (exists) {
                    // Replace temp message with real one
                    return prev.map(m =>
                        (m.id.startsWith('temp-') && m.content === newMsg.content && m.senderId === newMsg.senderId)
                            ? newMsg
                            : m
                    );
                }
                return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
        }, session?.access_token);

        return () => unsubscribe();
    }, [isOpen, orderId, session?.access_token, onMarkAsRead]);

    // Send text message
    const handleSend = async () => {
        if (!newMessage.trim()) return;

        // Get user info from auth or localStorage
        let senderId = user?.id;
        let senderName = user?.name || user?.email || "User";
        let senderRole = user?.role || "user";

        // Fallback 1: Try Supabase auth directly
        if (!senderId) {
            try {
                const { createClient } = await import("@/lib/supabaseClient");
                const supabase = createClient();
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (supaUser) {
                    senderId = supaUser.id;
                    senderName = supaUser.user_metadata?.name || supaUser.email || "User";
                    senderRole = supaUser.user_metadata?.role || "admin";
                }
            } catch (e) { /* ignore */ }
        }

        // Fallback 2: Try localStorage (for mock users)
        if (!senderId && typeof window !== "undefined") {
            const mockUserStr = localStorage.getItem("lyhu_user");
            if (mockUserStr) {
                try {
                    const mockUser = JSON.parse(mockUserStr);
                    senderId = mockUser.id || mockUser.uid || mockUser.user_id;
                    senderName = mockUser.name || mockUser.email || "User";
                    senderRole = mockUser.role || "user";
                } catch (e) { /* ignore */ }
            }
        }

        console.log("[Chat] Sending message:", { orderId, senderId, senderName, senderRole, newMessage });

        if (!senderId) {
            console.error("[Chat] No user ID found!");
            alert("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
            return;
        }

        setIsSending(true);
        const tempMessage: OrderMessage = {
            id: `temp-${Date.now()}`,
            orderId,
            senderId,
            senderName,
            senderRole,
            content: newMessage,
            imageUrl: null,
            createdAt: new Date().toISOString()
        };

        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage("");
        setTimeout(scrollToBottom, 100);

        const result = await sendMessage(
            orderId,
            senderId,
            senderName,
            senderRole,
            newMessage,
            undefined, // imageUrl
            session?.access_token
        );

        console.log("[Chat] Send result:", result);

        if (!result.success) {
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
            alert("Gửi tin nhắn thất bại: " + (result.error || "Lỗi không xác định"));
        }

        setIsSending(false);
    };

    // Send image
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);

        const uploadResult = await uploadChatImage(file, orderId);
        if (!uploadResult.success || !uploadResult.url) {
            alert("Upload ảnh thất bại!");
            setIsUploading(false);
            return;
        }

        await sendMessage(
            orderId,
            user.id,
            user.name || user.email || "User",
            user.role || "user",
            "",
            uploadResult.url,
            session?.access_token
        );

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                    <h3 className="font-semibold text-slate-900">
                        💬 Chat - Đơn #{orderReadableId}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                            Chưa có tin nhắn. Bắt đầu cuộc trò chuyện!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <ChatBubble
                                key={msg.id}
                                message={msg}
                                isOwn={msg.senderId === user?.id}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <div className="flex items-center gap-2">
                        {/* Image upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ImageIcon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Text input */}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || isSending}
                            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Chat bubble component
function ChatBubble({ message, isOwn }: { message: OrderMessage; isOwn: boolean }) {
    const roleColors: Record<string, string> = {
        admin: "text-red-600",
        telesales: "text-blue-600",
        accountant: "text-purple-600",
        warehouse: "text-green-600",
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[80%] rounded-lg p-3 ${isOwn
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-900"
                    }`}
            >
                {/* Sender info */}
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${roleColors[message.senderRole] || "text-slate-600"}`}>
                            {message.senderName}
                        </span>
                        <span className="text-xs text-slate-400">
                            ({message.senderRole})
                        </span>
                    </div>
                )}

                {/* Image */}
                {message.imageUrl && (
                    <div className="relative w-full h-60 min-h-[150px] mb-2">
                        <Image
                            src={message.imageUrl}
                            alt={`Ảnh từ ${message.senderName || 'Người gửi'}`}
                            fill
                            className="rounded-lg object-cover cursor-pointer"
                            onClick={() => window.open(message.imageUrl!, '_blank')}
                        />
                    </div>
                )}

                {/* Content */}
                {message.content && (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Time */}
                <div className={`text-xs mt-1 ${isOwn ? "text-primary-200" : "text-slate-400"}`}>
                    {formatTime(message.createdAt)}
                </div>
            </div>
        </div>
    );
}
