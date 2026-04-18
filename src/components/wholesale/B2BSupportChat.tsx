'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Phone, User, Image as ImageIcon, Paperclip, Smile, ShoppingBag, HelpCircle, Truck, CreditCard, RotateCcw } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

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

interface B2BSupportChatProps {
    user: any;
}

// Quick reply suggestions
const QUICK_REPLIES = [
    { icon: ShoppingBag, text: 'Tôi muốn báo giá sỉ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { icon: Truck, text: 'Chính sách giao hàng', color: 'bg-green-50 text-green-700 border-green-200' },
    { icon: CreditCard, text: 'Phương thức thanh toán', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { icon: RotateCcw, text: 'Chính sách đổi trả', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { icon: HelpCircle, text: 'Tôi cần tư vấn sản phẩm', color: 'bg-teal-50 text-teal-700 border-teal-200' },
];

// Simple emoji picker
const EMOJI_LIST = ['😊', '👍', '🙏', '❤️', '😍', '🤔', '😅', '🎉', '✅', '📦', '💰', '🔥', '⭐', '💪', '🤝', '👋'];

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

    // Enhanced features
    const [showEmoji, setShowEmoji] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [pendingProductShare, setPendingProductShare] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
            if (data) {
                setMessages(data);
                if (data.length > 0) setShowQuickReplies(false);
            }
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
                if (newMsg.sender_type === 'admin' && !isOpen) {
                    setUnreadCount(prev => prev + 1);
                    // Play notification sound
                    try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+LkZeYl5KNiIaBfXx8fn+Bg4SGh4eGhYOBf317eXh4eXp7fX+BgoODg4KBf316eHZ1dXV2d3l7fX+Ag4OEhIOCgH57eXd2dnZ3eHp7fX9/gIGBgYB/fnx7enl5eXl6ent8fX5/f4B/f39+fXx7enp5');
                        audio.volume = 0.3;
                        audio.play().catch(() => {});
                    } catch {}
                }
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
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

    // Listen for product share events from WholesaleStore
    useEffect(() => {
        const handleShareProduct = (e: any) => {
            const { name, price, image_url, brand } = e.detail;
            const productMsg = `📦 Tôi quan tâm sản phẩm này:\n\n🏷️ ${name}\n💰 Giá: ₫${new Intl.NumberFormat('vi-VN').format(price)}\n🏢 Thương hiệu: ${brand || 'LYHU'}\n\nVui lòng tư vấn thêm cho tôi!`;

            // If guest hasn't provided info yet, save message and show form
            if (!user && !guestName) {
                setPendingProductShare(productMsg);
                setShowGuestForm(true);
                setIsOpen(true);
                return;
            }

            setIsOpen(true);
            setShowQuickReplies(false);
            // Small delay to ensure room subscription is ready
            setTimeout(() => handleSend(productMsg), 300);
        };

        window.addEventListener('b2b-share-product', handleShareProduct);
        return () => window.removeEventListener('b2b-share-product', handleShareProduct);
    }, [user, guestName, roomId]);

    // Send pending product share after guest form is completed
    useEffect(() => {
        if (pendingProductShare && !showGuestForm && guestName) {
            setTimeout(() => handleSend(pendingProductShare), 300);
            setPendingProductShare(null);
        }
    }, [pendingProductShare, showGuestForm, guestName]);

    const ensureRoomExists = async (): Promise<string | null> => {
        if (roomId) return roomId;

        let newRoomId: string | null = null;
        if (user) {
            const name = user.user_metadata?.full_name || user.email || 'Khách hàng';
            newRoomId = await createRoom(name);
        } else {
            newRoomId = await createRoom(guestName, guestPhone);
        }
        if (newRoomId) setRoomId(newRoomId);
        return newRoomId;
    };

    const handleSend = async (text?: string) => {
        const content = (text || input).trim();
        if (!content || isSending) return;

        setIsSending(true);
        setShowQuickReplies(false);
        setShowEmoji(false);

        try {
            const currentRoomId = await ensureRoomExists();
            if (!currentRoomId) { setIsSending(false); return; }

            const senderName = user
                ? (user.user_metadata?.full_name || user.email || 'Khách hàng')
                : (guestName || 'Khách hàng');

            // Optimistic update
            const tempId = crypto.randomUUID();
            const tempMsg: SupportMessage = {
                id: tempId, room_id: currentRoomId, sender_type: 'customer',
                sender_name: senderName, content, created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);
            setInput('');

            const { error } = await supabase
                .from('b2b_support_messages')
                .insert({ room_id: currentRoomId, sender_type: 'customer', sender_name: senderName, content });

            if (error) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setInput(content);
            }

            await supabase.from('b2b_support_rooms').update({
                last_message: content, last_message_at: new Date().toISOString(), unread_admin: 1
            }).eq('id', currentRoomId);
        } finally {
            setIsSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isSending) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Chỉ hỗ trợ gửi hình ảnh (jpg, png, gif)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Hình ảnh tối đa 5MB');
            return;
        }

        setIsUploading(true);
        setShowQuickReplies(false);

        try {
            const currentRoomId = await ensureRoomExists();
            if (!currentRoomId) { setIsUploading(false); return; }

            // Upload to Supabase Storage
            const path = `b2b-support/${currentRoomId}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(path, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path);
            const imageUrl = urlData.publicUrl;

            const senderName = user
                ? (user.user_metadata?.full_name || user.email || 'Khách hàng')
                : (guestName || 'Khách hàng');

            // Optimistic
            const tempId = crypto.randomUUID();
            setMessages(prev => [...prev, {
                id: tempId, room_id: currentRoomId, sender_type: 'customer',
                sender_name: senderName, content: '📷 Hình ảnh',
                attachment_url: imageUrl, attachment_type: 'image',
                created_at: new Date().toISOString()
            }]);

            await supabase.from('b2b_support_messages').insert({
                room_id: currentRoomId, sender_type: 'customer', sender_name: senderName,
                content: '📷 Hình ảnh', attachment_url: imageUrl, attachment_type: 'image'
            });

            await supabase.from('b2b_support_rooms').update({
                last_message: '📷 Hình ảnh', last_message_at: new Date().toISOString(), unread_admin: 1
            }).eq('id', currentRoomId);

        } catch (err) {
            console.error('Upload failed:', err);
            alert('Gửi ảnh thất bại, vui lòng thử lại');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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

    const formatDateSeparator = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hôm nay';
        if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const shouldShowDateSeparator = (msg: SupportMessage, idx: number) => {
        if (idx === 0) return true;
        const prevDate = new Date(messages[idx - 1].created_at).toDateString();
        const currDate = new Date(msg.created_at).toDateString();
        return prevDate !== currDate;
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />

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
                    <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20"></span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-5 z-[70] w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Chat với LYHU</h3>
                                <p className="text-[10px] text-teal-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block animate-pulse"></span>
                                    Trực tuyến • Phản hồi nhanh
                                </p>
                            </div>
                        </div>
                        <button onClick={() => { setIsOpen(false); setShowEmoji(false); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
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
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50/50" style={{ scrollbarWidth: 'thin' }}>
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        {/* Welcome Message */}
                                        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-3">
                                            <MessageCircle className="w-7 h-7 text-teal-300" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">Xin chào! 👋</p>
                                        <p className="text-[11px] text-center mt-1 max-w-[240px] text-gray-500">
                                            LYHU luôn sẵn sàng hỗ trợ bạn về đơn hàng sỉ, báo giá, chính sách giao hàng và nhiều hơn nữa.
                                        </p>

                                        {/* Quick Reply Buttons - First Time */}
                                        {showQuickReplies && (
                                            <div className="mt-4 w-full space-y-1.5 px-2">
                                                <p className="text-[10px] text-gray-400 text-center font-medium mb-2">Chọn chủ đề hoặc nhập tin nhắn</p>
                                                {QUICK_REPLIES.map((qr, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSend(qr.text)}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium hover:shadow-sm transition-all ${qr.color}`}
                                                    >
                                                        <qr.icon className="w-3.5 h-3.5 shrink-0" />
                                                        {qr.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, idx) => (
                                            <React.Fragment key={msg.id}>
                                                {/* Date Separator */}
                                                {shouldShowDateSeparator(msg, idx) && (
                                                    <div className="flex items-center gap-2 py-2">
                                                        <div className="flex-1 h-px bg-gray-200"></div>
                                                        <span className="text-[10px] text-gray-400 font-medium px-2 bg-gray-50 rounded-full">
                                                            {formatDateSeparator(msg.created_at)}
                                                        </span>
                                                        <div className="flex-1 h-px bg-gray-200"></div>
                                                    </div>
                                                )}

                                                <div className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'} mb-1`}>
                                                    {/* Admin Avatar */}
                                                    {msg.sender_type === 'admin' && (
                                                        <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center mr-1.5 mt-1 shrink-0">
                                                            <span className="text-[10px] font-bold text-teal-700">L</span>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                                                            msg.sender_type === 'customer'
                                                                ? 'bg-teal-500 text-white rounded-br-md'
                                                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                                                        }`}
                                                    >
                                                        {msg.sender_type === 'admin' && (
                                                            <p className="text-[10px] font-bold text-teal-600 mb-0.5">{msg.sender_name}</p>
                                                        )}

                                                        {/* Image Attachment */}
                                                        {msg.attachment_url && msg.attachment_type === 'image' && (
                                                            <img
                                                                src={msg.attachment_url}
                                                                alt="Hình đính kèm"
                                                                className="rounded-lg mb-1.5 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                                style={{ maxHeight: '180px' }}
                                                                onClick={() => window.open(msg.attachment_url, '_blank')}
                                                            />
                                                        )}

                                                        {/* Hide text-only content if just image placeholder */}
                                                        {!(msg.attachment_url && msg.content === '📷 Hình ảnh') && (
                                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                        )}

                                                        <p className={`text-[9px] mt-1 ${msg.sender_type === 'customer' ? 'text-teal-200' : 'text-gray-400'} text-right`}>
                                                            {formatTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        ))}

                                        {/* Quick Replies After Messages (show if last message was from admin) */}
                                        {messages.length > 0 && messages[messages.length - 1].sender_type === 'admin' && (
                                            <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
                                                {QUICK_REPLIES.slice(0, 3).map((qr, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSend(qr.text)}
                                                        className="px-2.5 py-1 rounded-full border border-teal-200 text-[10px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                                                    >
                                                        {qr.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Emoji Picker */}
                            {showEmoji && (
                                <div className="border-t border-gray-100 bg-white px-3 py-2 shrink-0">
                                    <div className="grid grid-cols-8 gap-1">
                                        {EMOJI_LIST.map((emoji, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setInput(prev => prev + emoji);
                                                    inputRef.current?.focus();
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                                {/* Upload Progress */}
                                {isUploading && (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                                        <span className="text-[11px] text-gray-500">Đang tải ảnh lên...</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5">
                                    {/* Attachment Button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading || isSending}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                                        title="Gửi hình ảnh"
                                    >
                                        <ImageIcon className="w-4.5 h-4.5" />
                                    </button>

                                    {/* Emoji Button */}
                                    <button
                                        onClick={() => setShowEmoji(!showEmoji)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${showEmoji ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'}`}
                                        title="Emoji"
                                    >
                                        <Smile className="w-4.5 h-4.5" />
                                    </button>

                                    {/* Input */}
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        onFocus={() => setShowEmoji(false)}
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors min-w-0"
                                        disabled={isSending || isUploading}
                                    />

                                    {/* Send Button */}
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isSending || isUploading}
                                        className="w-9 h-9 bg-teal-500 text-white rounded-xl flex items-center justify-center hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
