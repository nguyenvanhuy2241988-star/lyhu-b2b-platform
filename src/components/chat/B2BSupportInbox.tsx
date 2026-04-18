'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, Search, Send, Loader2, User, Phone, Mail, Clock, CheckCircle, X, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SupportRoom {
    id: string;
    customer_id: string | null;
    guest_session_id: string | null;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    status: 'open' | 'closed';
    last_message: string | null;
    last_message_at: string | null;
    unread_admin: number;
    created_at: string;
}

interface SupportMessage {
    id: string;
    room_id: string;
    sender_type: 'customer' | 'admin';
    sender_name: string;
    content: string;
    created_at: string;
}

interface B2BSupportInboxProps {
    currentUser: any;
}

export function B2BSupportInbox({ currentUser }: B2BSupportInboxProps) {
    const [rooms, setRooms] = useState<SupportRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch all support rooms
    const fetchRooms = useCallback(async () => {
        const { data, error } = await supabase
            .from('b2b_support_rooms')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (data) setRooms(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Subscribe to new rooms
    useEffect(() => {
        const channel = supabase
            .channel('b2b-support-rooms-admin')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'b2b_support_rooms'
            }, () => {
                fetchRooms();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchRooms]);

    // Load messages when room selected
    useEffect(() => {
        if (!activeRoomId) return;

        const loadMessages = async () => {
            const { data } = await supabase
                .from('b2b_support_messages')
                .select('*')
                .eq('room_id', activeRoomId)
                .order('created_at', { ascending: true });
            if (data) setMessages(data);
        };
        loadMessages();

        // Clear unread for this room
        supabase
            .from('b2b_support_rooms')
            .update({ unread_admin: 0 })
            .eq('id', activeRoomId)
            .then();

    }, [activeRoomId]);

    // Realtime messages for active room
    useEffect(() => {
        if (!activeRoomId) return;

        const channel = supabase
            .channel(`b2b-admin-room-${activeRoomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'b2b_support_messages',
                filter: `room_id=eq.${activeRoomId}`
            }, (payload: any) => {
                const newMsg = payload.new as SupportMessage;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeRoomId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (activeRoomId) setTimeout(() => inputRef.current?.focus(), 200);
    }, [activeRoomId]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !activeRoomId || isSending) return;

        setIsSending(true);
        const senderName = currentUser?.full_name || currentUser?.email || 'Admin';

        // Optimistic
        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, {
            id: tempId,
            room_id: activeRoomId,
            sender_type: 'admin',
            sender_name: senderName,
            content: text,
            created_at: new Date().toISOString()
        }]);
        setInput('');

        try {
            const { error } = await supabase
                .from('b2b_support_messages')
                .insert({
                    room_id: activeRoomId,
                    sender_type: 'admin',
                    sender_name: senderName,
                    content: text
                });

            if (error) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setInput(text);
                console.error(error);
            }

            // Update room
            await supabase
                .from('b2b_support_rooms')
                .update({ last_message: text, last_message_at: new Date().toISOString() })
                .eq('id', activeRoomId);

        } finally {
            setIsSending(false);
        }
    };

    const handleCloseRoom = async (roomId: string) => {
        if (!confirm('Đóng phòng chat hỗ trợ này?')) return;
        await supabase
            .from('b2b_support_rooms')
            .update({ status: 'closed' })
            .eq('id', roomId);
        fetchRooms();
        if (activeRoomId === roomId) setActiveRoomId(null);
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
        if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const filteredRooms = rooms.filter(r =>
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.customer_phone || '').includes(searchTerm) ||
        (r.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    const totalUnread = rooms.reduce((sum, r) => sum + (r.unread_admin || 0), 0);

    return (
        <div className="flex h-full bg-white rounded-lg overflow-hidden">
            {/* Sidebar - Room List */}
            <div className="w-72 border-r border-slate-200 flex flex-col shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-teal-600" />
                            <h3 className="font-bold text-slate-800 text-sm">Hỗ trợ B2B</h3>
                            {totalUnread > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{totalUnread}</span>
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm khách hàng..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                        />
                    </div>
                </div>

                {/* Room List */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                            <p className="text-xs">Chưa có khách hàng nào</p>
                        </div>
                    ) : (
                        filteredRooms.map(room => (
                            <div
                                key={room.id}
                                onClick={() => setActiveRoomId(room.id)}
                                className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${activeRoomId === room.id ? 'bg-teal-50 border-l-2 border-l-teal-500' : ''}`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${room.status === 'open' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {room.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-bold text-xs text-slate-800 truncate">{room.customer_name}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                                                {room.last_message_at ? formatTime(room.last_message_at) : ''}
                                            </span>
                                        </div>
                                        {room.customer_phone && (
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                                                <Phone className="w-2.5 h-2.5" />{room.customer_phone}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-slate-500 truncate">{room.last_message || 'Chưa có tin nhắn'}</p>
                                    </div>
                                    {(room.unread_admin || 0) > 0 && (
                                        <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-1">
                                            {room.unread_admin}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {!activeRoomId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <ShoppingBag className="w-12 h-12 text-slate-200 mb-4" />
                        <h4 className="font-bold text-slate-600 mb-1">Hỗ trợ khách hàng B2B</h4>
                        <p className="text-xs max-w-[250px] text-center">Chọn một cuộc hội thoại bên trái để bắt đầu trả lời khách hàng</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                                    {activeRoom?.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800">{activeRoom?.customer_name}</h4>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                        {activeRoom?.customer_phone && (
                                            <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{activeRoom.customer_phone}</span>
                                        )}
                                        {activeRoom?.customer_email && (
                                            <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{activeRoom.customer_email}</span>
                                        )}
                                        <span className="flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {activeRoom?.created_at ? new Date(activeRoom.created_at).toLocaleDateString('vi-VN') : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {activeRoom?.status === 'open' && (
                                    <button
                                        onClick={() => handleCloseRoom(activeRoomId)}
                                        className="px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-1"
                                        title="Đóng phòng chat"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        Đóng
                                    </button>
                                )}
                                {activeRoom?.status === 'closed' && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-lg">Đã đóng</span>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50" style={{ scrollbarWidth: 'thin' }}>
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                                            msg.sender_type === 'admin'
                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-md'
                                        }`}
                                    >
                                        {msg.sender_type === 'customer' && (
                                            <p className="text-[10px] font-bold text-teal-600 mb-0.5">{msg.sender_name}</p>
                                        )}
                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                        <p className={`text-[9px] mt-1 ${msg.sender_type === 'admin' ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        {activeRoom?.status === 'open' ? (
                            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        placeholder="Nhập phản hồi..."
                                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                        disabled={isSending}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isSending}
                                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 border-t border-slate-200 bg-gray-50 text-center text-xs text-gray-400">
                                Phòng chat đã đóng
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
