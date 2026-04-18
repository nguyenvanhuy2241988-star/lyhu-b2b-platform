'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Phone, User } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

interface SupportMessage {
    id: string;
    room_id: string;
    sender_type: 'customer' | 'admin';
    sender_name: string;
    content: string;
    created_at: string;
}

interface B2BSupportChatProps {
    user: any; // Supabase auth user (null if guest)
}

export default function B2BSupportChat({ user }: B2BSupportChatProps) {
    const supabase = getSupabase();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Guest info form
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const channelRef = useRef<any>(null);

    // Generate or retrieve guest session ID
    useEffect(() => {
        if (!user) {
            let sid = localStorage.getItem('b2b_guest_session');
            if (!sid) {
                sid = crypto.randomUUID();
                localStorage.setItem('b2b_guest_session', sid);
            }
            setGuestSessionId(sid);

            // Restore guest info
            const savedName = localStorage.getItem('b2b_guest_name');
            const savedPhone = localStorage.getItem('b2b_guest_phone');
            if (savedName) setGuestName(savedName);
            if (savedPhone) setGuestPhone(savedPhone);
        }
    }, [user]);

    // Find existing room on mount
    useEffect(() => {
        const findRoom = async () => {
            if (user) {
                const { data } = await supabase
                    .from('b2b_support_rooms')
                    .select('id')
                    .eq('customer_id', user.id)
                    .eq('status', 'open')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (data) setRoomId(data.id);
            } else if (guestSessionId) {
                const savedRoomId = localStorage.getItem('b2b_support_room');
                if (savedRoomId) {
                    // Verify room still exists
                    const { data } = await supabase
                        .from('b2b_support_rooms')
                        .select('id')
                        .eq('id', savedRoomId)
                        .eq('status', 'open')
                        .single();
                    if (data) setRoomId(data.id);
                }
            }
        };
        findRoom();
    }, [user, guestSessionId, supabase]);

    // Load messages when room found
    useEffect(() => {
        if (!roomId) return;
        const loadMessages = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('b2b_support_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });
            if (data) setMessages(data);
            setIsLoading(false);
        };
        loadMessages();
    }, [roomId, supabase]);

    // Realtime subscription
    useEffect(() => {
        if (!roomId) return;

        const channel = supabase
            .channel(`b2b-support-${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'b2b_support_messages',
                filter: `room_id=eq.${roomId}`
            }, (payload: any) => {
                const newMsg = payload.new as SupportMessage;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                // If admin message and chat is closed, increment unread
                if (newMsg.sender_type === 'admin' && !isOpen) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase, isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear unread when opened
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const createRoom = async (name: string, phone?: string) => {
        const roomData: any = {
            customer_name: name,
            customer_phone: phone || null,
            status: 'open',
        };

        if (user) {
            roomData.customer_id = user.id;
            roomData.customer_email = user.email;
        } else if (guestSessionId) {
            roomData.guest_session_id = guestSessionId;
        }

        const { data, error } = await supabase
            .from('b2b_support_rooms')
            .insert(roomData)
            .select()
            .single();

        if (error) {
            console.error('Failed to create room:', error);
            return null;
        }

        if (!user) {
            localStorage.setItem('b2b_support_room', data.id);
        }
        return data.id;
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isSending) return;

        setIsSending(true);

        try {
            let currentRoomId = roomId;

            // Create room if doesn't exist
            if (!currentRoomId) {
                if (user) {
                    const name = user.user_metadata?.full_name || user.email || 'Khách hàng';
                    currentRoomId = await createRoom(name);
                } else {
                    // Should have guest info already (from form)
                    currentRoomId = await createRoom(guestName, guestPhone);
                }
                if (!currentRoomId) {
                    setIsSending(false);
                    return;
                }
                setRoomId(currentRoomId);
            }

            const senderName = user
                ? (user.user_metadata?.full_name || user.email || 'Khách hàng')
                : (guestName || 'Khách hàng');

            // Optimistic update
            const tempId = crypto.randomUUID();
            const tempMsg: SupportMessage = {
                id: tempId,
                room_id: currentRoomId,
                sender_type: 'customer',
                sender_name: senderName,
                content: text,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);
            setInput('');

            const { error } = await supabase
                .from('b2b_support_messages')
                .insert({
                    room_id: currentRoomId,
                    sender_type: 'customer',
                    sender_name: senderName,
                    content: text
                });

            if (error) {
                console.error('Send message failed:', error);
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setInput(text);
            }

            // Update room last_message
            await supabase
                .from('b2b_support_rooms')
                .update({
                    last_message: text,
                    last_message_at: new Date().toISOString(),
                    unread_admin: 1
                })
                .eq('id', currentRoomId);

        } finally {
            setIsSending(false);
        }
    };

    const handleGuestSubmit = () => {
        if (!guestName.trim() || !guestPhone.trim()) return;
        localStorage.setItem('b2b_guest_name', guestName);
        localStorage.setItem('b2b_guest_phone', guestPhone);
        setShowGuestForm(false);
    };

    const handleOpenChat = () => {
        if (!user && !guestName) {
            setShowGuestForm(true);
            setIsOpen(true);
        } else {
            setIsOpen(true);
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={handleOpenChat}
                    className="fixed bottom-24 right-5 z-[60] w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
                    id="b2b-chat-trigger"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                    {/* Pulse animation */}
                    <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20"></span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-5 z-[70] w-[340px] h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Chat với LYHU</h3>
                                <p className="text-[10px] text-teal-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block"></span>
                                    Trực tuyến
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Guest Info Form */}
                    {showGuestForm ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-teal-600" />
                            </div>
                            <h4 className="font-bold text-gray-800 mb-1">Xin chào! 👋</h4>
                            <p className="text-xs text-gray-500 mb-5 text-center">Vui lòng cho chúng tôi biết thông tin để hỗ trợ bạn tốt hơn</p>

                            <div className="w-full space-y-3">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Họ tên *"
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        placeholder="Số điện thoại *"
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                                    />
                                </div>
                                <button
                                    onClick={handleGuestSubmit}
                                    disabled={!guestName.trim() || !guestPhone.trim()}
                                    className="w-full py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Bắt đầu chat
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50" style={{ scrollbarWidth: 'thin' }}>
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-3">
                                            <MessageCircle className="w-7 h-7 text-teal-300" />
                                        </div>
                                        <p className="text-xs font-medium">Chào bạn! 👋</p>
                                        <p className="text-[11px] text-center mt-1 max-w-[200px]">LYHU luôn sẵn sàng hỗ trợ. Hãy gửi tin nhắn để bắt đầu!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                                                    msg.sender_type === 'customer'
                                                        ? 'bg-teal-500 text-white rounded-br-md'
                                                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                                                }`}
                                            >
                                                {msg.sender_type === 'admin' && (
                                                    <p className="text-[10px] font-bold text-teal-600 mb-0.5">{msg.sender_name}</p>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-[9px] mt-1 ${msg.sender_type === 'customer' ? 'text-teal-200' : 'text-gray-400'} text-right`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                                        disabled={isSending}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isSending}
                                        className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
