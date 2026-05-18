'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, Search, Send, Loader2, Phone, Mail, Clock, CheckCircle, MessageCircle, Image as ImageIcon, Smile, Zap, X } from 'lucide-react';
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
    attachment_url?: string;
    attachment_type?: string;
    created_at: string;
}

interface B2BSupportInboxProps {
    currentUser: any;
}

// Quick response templates for admin
const QUICK_RESPONSES = [
    { label: '👋 Chào', text: 'Xin chào! Cảm ơn bạn đã liên hệ LYHU. Tôi có thể giúp gì cho bạn?' },
    { label: '💰 Báo giá', text: 'Dạ, để em kiểm tra và gửi bảng giá sỉ cho anh/chị ngay ạ. Anh/chị cần báo giá cho sản phẩm nào ạ?' },
    { label: '🚚 Giao hàng', text: 'LYHU hỗ trợ giao hàng toàn quốc:\n- Đơn từ 2 triệu: Miễn phí ship\n- Đơn dưới 2 triệu: Ship 30.000đ\n- Thời gian giao: 2-4 ngày làm việc' },
    { label: '💳 Thanh toán', text: 'LYHU hỗ trợ các hình thức thanh toán:\n- Chuyển khoản ngân hàng\n- COD (thu hộ khi giao hàng)\n- Công nợ (cho đại lý thân thiết)' },
    { label: '🔄 Đổi trả', text: 'Chính sách đổi trả LYHU:\n- Đổi trả trong 7 ngày nếu hàng lỗi\n- Hàng phải còn nguyên seal, chưa sử dụng\n- Liên hệ hotline: 0xxx.xxx.xxx' },
    { label: '✅ Xác nhận', text: 'Dạ em đã ghi nhận thông tin. Em sẽ xử lý và phản hồi anh/chị trong thời gian sớm nhất ạ!' },
    { label: '🙏 Cảm ơn', text: 'Cảm ơn anh/chị đã tin tưởng sử dụng sản phẩm LYHU! Nếu cần hỗ trợ thêm, đừng ngại nhắn tin cho chúng tôi nhé!' },
];

const EMOJI_LIST = ['😊', '👍', '🙏', '❤️', '😍', '✅', '📦', '💰', '🔥', '⭐', '💪', '🤝', '👋', '🎉', '😅', '🤔'];

export function B2BSupportInbox({ currentUser }: B2BSupportInboxProps) {
    const [rooms, setRooms] = useState<SupportRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Enhanced features
    const [showEmoji, setShowEmoji] = useState(false);
    const [showQuickResponses, setShowQuickResponses] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchRooms = useCallback(async () => {
        const { data } = await supabase.from('b2b_support_rooms').select('*').order('last_message_at', { ascending: false });
        if (data) setRooms(data);
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    // Subscribe to room changes
    useEffect(() => {
        const channel = supabase.channel('b2b-support-rooms-admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2b_support_rooms' }, () => fetchRooms())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchRooms]);

    // Load messages when room selected
    useEffect(() => {
        if (!activeRoomId) return;
        const loadMessages = async () => {
            const { data } = await supabase.from('b2b_support_messages').select('*').eq('room_id', activeRoomId).order('created_at', { ascending: true });
            if (data) setMessages(data);
        };
        loadMessages();
        supabase.from('b2b_support_rooms').update({ unread_admin: 0 }).eq('id', activeRoomId).then();
    }, [activeRoomId]);

    // Realtime messages
    useEffect(() => {
        if (!activeRoomId) return;
        const channel = supabase.channel(`b2b-admin-room-${activeRoomId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b2b_support_messages', filter: `room_id=eq.${activeRoomId}` }, (payload: any) => {
                const newMsg = payload.new as SupportMessage;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    
                    // Check for optimistic duplicate (same content + sender within 10s)
                    const optimisticIdx = prev.findIndex(m =>
                        m.sender_type === newMsg.sender_type &&
                        m.content === newMsg.content &&
                        Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 10000
                    );
                    
                    if (optimisticIdx >= 0) {
                        // Replace temp with real message
                        const updated = [...prev];
                        updated[optimisticIdx] = newMsg;
                        return updated;
                    }
                    
                    return [...prev, newMsg];
                });
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [activeRoomId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { if (activeRoomId) setTimeout(() => inputRef.current?.focus(), 200); }, [activeRoomId]);

    const sendMessageContent = async (content: string, attachmentUrl?: string, attachmentType?: string) => {
        if (!activeRoomId || isSending) return;
        setIsSending(true);
        const isCustomer = currentUser?.role === 'customer';
        const senderType = isCustomer ? 'customer' : 'admin';
        const senderName = currentUser?.full_name || currentUser?.email || (isCustomer ? 'Khách hàng' : 'Admin');

        const tempId = crypto.randomUUID();
        setMessages(prev => [...prev, {
            id: tempId, room_id: activeRoomId, sender_type: senderType, sender_name: senderName,
            content, attachment_url: attachmentUrl, attachment_type: attachmentType, created_at: new Date().toISOString()
        }]);
        setInput('');
        setShowQuickResponses(false);
        setShowEmoji(false);

        try {
            const insertData: any = { room_id: activeRoomId, sender_type: senderType, sender_name: senderName, content };
            if (attachmentUrl) { insertData.attachment_url = attachmentUrl; insertData.attachment_type = attachmentType; }

            const { error } = await supabase.from('b2b_support_messages').insert(insertData);
            if (error) { setMessages(prev => prev.filter(m => m.id !== tempId)); setInput(content); console.error(error); }
            await supabase.from('b2b_support_rooms').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', activeRoomId);
        } finally { setIsSending(false); }
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        sendMessageContent(text);
    };

    const handleQuickResponse = (text: string) => {
        sendMessageContent(text);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeRoomId) return;
        if (!file.type.startsWith('image/')) { alert('Chỉ hỗ trợ hình ảnh'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('Tối đa 5MB'); return; }

        setIsUploading(true);
        try {
            const path = `b2b-support/${activeRoomId}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(path, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path);
            await sendMessageContent('📷 Hình ảnh', urlData.publicUrl, 'image');
        } catch (err) { console.error(err); alert('Upload thất bại'); }
        finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleCloseRoom = async (roomId: string) => {
        if (!confirm('Đóng phòng chat hỗ trợ này?')) return;
        await supabase.from('b2b_support_rooms').update({ status: 'closed' }).eq('id', roomId);
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

    const formatDateSeparator = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Hôm nay';
        if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const shouldShowDateSeparator = (msg: SupportMessage, idx: number) => {
        if (idx === 0) return true;
        return new Date(messages[idx - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
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
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {/* Sidebar */}
            <div className="w-72 border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-teal-600" />
                            <h3 className="font-bold text-slate-800 text-sm">Hỗ trợ LYHU</h3>
                            {totalUnread > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{totalUnread}</span>}
                        </div>
                    </div>
                    {currentUser?.role !== 'customer' && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm khách hàng..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                            <p className="text-xs">Chưa có khách hàng nào</p>
                        </div>
                    ) : filteredRooms.map(room => (
                        <div key={room.id} onClick={() => setActiveRoomId(room.id)}
                            className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${activeRoomId === room.id ? 'bg-teal-50 border-l-2 border-l-teal-500' : ''}`}>
                            <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${room.status === 'open' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {room.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-xs text-slate-800 truncate">{room.customer_name}</span>
                                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">{room.last_message_at ? formatTime(room.last_message_at) : ''}</span>
                                    </div>
                                    {room.customer_phone && <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5"><Phone className="w-2.5 h-2.5" />{room.customer_phone}</p>}
                                    <p className="text-[11px] text-slate-500 truncate">{room.last_message || 'Chưa có tin nhắn'}</p>
                                </div>
                                {(room.unread_admin || 0) > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-1">{room.unread_admin}</span>}
                            </div>
                        </div>
                    ))}
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
                        {/* Header */}
                        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                                    {activeRoom?.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800">{activeRoom?.customer_name}</h4>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                        {activeRoom?.customer_phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{activeRoom.customer_phone}</span>}
                                        {activeRoom?.customer_email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{activeRoom.customer_email}</span>}
                                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{activeRoom?.created_at ? new Date(activeRoom.created_at).toLocaleDateString('vi-VN') : ''}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {currentUser?.role !== 'customer' && activeRoom?.status === 'open' && (
                                    <button onClick={() => handleCloseRoom(activeRoomId)} className="px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-1" title="Đóng phòng chat">
                                        <CheckCircle className="w-3 h-3" />Đóng
                                    </button>
                                )}
                                {activeRoom?.status === 'closed' && <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-lg">Đã đóng</span>}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/50" style={{ scrollbarWidth: 'thin' }}>
                            {messages.map((msg, idx) => (
                                <React.Fragment key={msg.id}>
                                    {shouldShowDateSeparator(msg, idx) && (
                                        <div className="flex items-center gap-2 py-2">
                                            <div className="flex-1 h-px bg-slate-200"></div>
                                            <span className="text-[10px] text-slate-400 font-medium px-2 bg-slate-50 rounded-full">{formatDateSeparator(msg.created_at)}</span>
                                            <div className="flex-1 h-px bg-slate-200"></div>
                                        </div>
                                    )}
                                    <div className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'} mb-1`}>
                                        {msg.sender_type === 'customer' && (
                                            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center mr-1.5 mt-1 shrink-0">
                                                <span className="text-[10px] font-bold text-teal-700">{activeRoom?.customer_name?.charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                                            msg.sender_type === 'admin' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-md'
                                        }`}>
                                            {msg.sender_type === 'customer' && <p className="text-[10px] font-bold text-teal-600 mb-0.5">{msg.sender_name}</p>}

                                            {/* Image attachment */}
                                            {msg.attachment_url && msg.attachment_type === 'image' && (
                                                <img src={msg.attachment_url} alt="Hình đính kèm" className="rounded-lg mb-1.5 max-w-full cursor-pointer hover:opacity-90" style={{ maxHeight: '200px' }} onClick={() => window.open(msg.attachment_url, '_blank')} />
                                            )}

                                            {!(msg.attachment_url && msg.content === '📷 Hình ảnh') && (
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            )}
                                            <p className={`text-[9px] mt-1 ${msg.sender_type === 'admin' ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                                                {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Responses Panel */}
                        {showQuickResponses && (
                            <div className="border-t border-slate-200 bg-white px-3 py-2 shrink-0 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-slate-500 font-medium">⚡ Mẫu trả lời nhanh</span>
                                    <button onClick={() => setShowQuickResponses(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {QUICK_RESPONSES.map((qr, i) => (
                                        <button key={i} onClick={() => handleQuickResponse(qr.text)}
                                            className="text-left px-2.5 py-2 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-[11px] text-slate-700 font-medium">
                                            {qr.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Emoji Panel */}
                        {showEmoji && (
                            <div className="border-t border-slate-200 bg-white px-3 py-2 shrink-0">
                                <div className="grid grid-cols-8 gap-1">
                                    {EMOJI_LIST.map((emoji, i) => (
                                        <button key={i} onClick={() => { setInput(prev => prev + emoji); inputRef.current?.focus(); }}
                                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-colors">{emoji}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        {activeRoom?.status === 'open' ? (
                            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                                {isUploading && (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                        <span className="text-[11px] text-slate-500">Đang tải ảnh lên...</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    {/* Quick Responses */}
                                    {currentUser?.role !== 'customer' && (
                                        <button onClick={() => { setShowQuickResponses(!showQuickResponses); setShowEmoji(false); }}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${showQuickResponses ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Mẫu trả lời nhanh">
                                            <Zap className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Image Upload */}
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0 disabled:opacity-40" title="Gửi hình ảnh">
                                        <ImageIcon className="w-4 h-4" />
                                    </button>
                                    {/* Emoji */}
                                    <button onClick={() => { setShowEmoji(!showEmoji); setShowQuickResponses(false); }}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${showEmoji ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Emoji">
                                        <Smile className="w-4 h-4" />
                                    </button>
                                    {/* Input */}
                                    <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        onFocus={() => { setShowEmoji(false); setShowQuickResponses(false); }}
                                        placeholder="Nhập phản hồi..." disabled={isSending || isUploading}
                                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors min-w-0" />
                                    {/* Send */}
                                    <button onClick={handleSend} disabled={!input.trim() || isSending || isUploading}
                                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 border-t border-slate-200 bg-gray-50 text-center text-xs text-gray-400">Phòng chat đã đóng</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
