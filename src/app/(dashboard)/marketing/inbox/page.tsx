"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    fetchConversations,
    fetchMessages,
    sendSocialReply,
    fetchFacebookPages,
    SocialConversation,
    SocialMessage,
    FacebookPage,
    fetchInboxCounts,
    updateConversationMetadata
} from '@/lib/marketingStore';
import { MessageSquare, Send, User, Search, RefreshCw, Loader2, DownloadCloud, Filter, Calendar, X, ImageIcon, Paperclip, Smile } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import InboxCustomerSidebar from '@/components/marketing/InboxCustomerSidebar';
import { CreateDealModal } from '@/components/telesales/CreateDealModal';
import { createDeal } from '@/lib/crmDealsStore';

export default function SocialInboxPage() {
    const { user, session } = useAuth();
    const [conversations, setConversations] = useState<SocialConversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SocialMessage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
    const [filterPageId, setFilterPageId] = useState<string>('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);
    const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD

    // Create Deal Modal State
    const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const selectedConvIdRef = useRef<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Keep ref in sync with state
    useEffect(() => {
        selectedConvIdRef.current = selectedConvId;
    }, [selectedConvId]);

    const loadConversations = async () => {
        setIsLoading(true);
        const filters: any = {};
        if (filterUnread) filters.unread = true;
        if (filterDate) {
            filters.startDate = new Date(filterDate);
            const end = new Date(filterDate);
            end.setDate(end.getDate() + 1);
            filters.endDate = end;
        }

        const data = await fetchConversations(session?.access_token, filterPageId, filters);
        setConversations(data);
        setIsLoading(false);
        // Load counts
        fetchInboxCounts(session?.access_token).then(counts => {
            const map: Record<string, number> = {};
            counts.forEach(c => map[c.page_id] = c.total_conversations);
            setPageCounts(map);
        });
    };

    // Vietnamese provinces/cities for auto-detection
    const VN_PROVINCES = [
        'Hà Nội', 'HN', 'Hồ Chí Minh', 'HCM', 'Sài Gòn', 'SG', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
        'An Giang', 'Bà Rịa', 'Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
        'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
        'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp',
        'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang',
        'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Nha Trang', 'Kiên Giang', 'Kon Tum',
        'Lai Châu', 'Lâm Đồng', 'Đà Lạt', 'Lạng Sơn', 'Lào Cai', 'Long An',
        'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
        'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
        'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
        'Thanh Hóa', 'Thừa Thiên Huế', 'Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
        'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái', 'Phú Quốc', 'Bắc Cạn',
    ];

    const loadMessages = async (convId: string) => {
        const msgs = await fetchMessages(convId, session?.access_token);
        setMessages(msgs);
        setTimeout(() => scrollToBottom(), 100);

        // Auto-detect phone and region from customer messages
        const phoneRegex = /(?<!\d)(0[35789]\d{8})(?!\d)/g;
        let detectedPhone = '';
        let detectedRegion = '';

        for (const msg of msgs) {
            if (!msg.is_from_page && msg.content) {
                // Phone detection
                if (!detectedPhone) {
                    const cleaned = msg.content.replace(/[\s\.\-]/g, '');
                    const phoneMatch = cleaned.match(phoneRegex);
                    if (phoneMatch) detectedPhone = phoneMatch[0];
                }
                // Region detection
                if (!detectedRegion) {
                    const contentLower = msg.content.toLowerCase();
                    for (const province of VN_PROVINCES) {
                        if (contentLower.includes(province.toLowerCase())) {
                            detectedRegion = province;
                            // Normalize common abbreviations
                            if (province === 'HCM' || province === 'SG' || province === 'Sài Gòn') detectedRegion = 'Hồ Chí Minh';
                            if (province === 'HN') detectedRegion = 'Hà Nội';
                            break;
                        }
                    }
                }
                if (detectedPhone && detectedRegion) break;
            }
        }

        // Auto-save detected info
        if (detectedPhone || detectedRegion) {
            setConversations(prev => {
                const conv = prev.find(c => c.id === convId);
                if (!conv) return prev;
                const updates: any = {};
                if (detectedPhone && !conv.customer_phone) updates.customer_phone = detectedPhone;
                if (detectedRegion && !conv.customer_region) updates.customer_region = detectedRegion;

                if (Object.keys(updates).length > 0) {
                    updateConversationMetadata(convId, updates, session?.access_token)
                        .then(() => console.log('Auto-saved:', updates))
                        .catch(e => console.error('Failed to save:', e));
                    return prev.map(c => c.id === convId ? { ...c, ...updates } : c);
                }
                return prev;
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleRealtimeConversation = (payload: any) => {
        console.log("Realtime Event:", payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as SocialConversation;
            setConversations(prev => {
                const index = prev.findIndex(c => c.id === updated.id);
                if (index !== -1) {
                    // Update existing and move to top
                    const newArr = [...prev];
                    newArr[index] = { ...newArr[index], ...updated };
                    // If it's a new message update (e.g. last_message_at changed), move to top
                    if (payload.eventType === 'UPDATE') {
                        const [item] = newArr.splice(index, 1);
                        return [item, ...newArr];
                    }
                    return newArr;
                }
                return [updated, ...prev];
            });

            // Auto-reload messages if this is the currently selected conversation
            if (updated.id === selectedConvIdRef.current && payload.eventType === 'UPDATE') {
                loadMessages(updated.id);
            }
        }
    };

    // Memoize the authenticated Supabase client to prevent multiple instances and socket disconnects
    const supabaseClient = useMemo(() => {
        if (!session?.access_token) return null;
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                accessToken: async () => session.access_token, // Explicitly provide token getter for Realtime
                global: {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                }
            }
        );
    }, [session?.access_token]);

    useEffect(() => {
        if (session?.access_token && supabaseClient) {
            loadConversations();
            fetchFacebookPages(session.access_token).then(data => setPages(data));

            // Explicitly set Auth token for Realtime WebSocket
            supabaseClient.realtime.setAuth(session.access_token);

            const channel = supabaseClient
                .channel('social-conversations-list-global')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'social_conversations'
                }, handleRealtimeConversation)
                .subscribe((status: any) => {
                    console.log("Global Channel Status:", status);
                    if (status === 'SUBSCRIBED') {
                        console.log("Successfully subscribed to conversations list");
                    }
                });

            return () => {
                supabaseClient.removeChannel(channel);
            };
        }
    }, [session, filterPageId, filterUnread, filterDate, supabaseClient]);

    useEffect(() => {
        if (selectedConvId && supabaseClient) {
            loadMessages(selectedConvId);

            // Subscribe to new messages for this conversation
            const channel = supabaseClient
                .channel(`social-messages-${selectedConvId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'social_messages',
                    filter: `conversation_id=eq.${selectedConvId}`
                }, (payload: any) => {
                    console.log("Message Realtime:", payload);
                    const newMsg = payload.new as SocialMessage;
                    setMessages(prev => [...prev, newMsg]);
                    setTimeout(scrollToBottom, 100);
                })
                .subscribe((status: any) => {
                    console.log("Message Channel Status:", status);
                });

            // Polling fallback: refresh messages every 5 seconds
            const pollInterval = setInterval(() => {
                fetchMessages(selectedConvId, session?.access_token).then(msgs => {
                    setMessages(prev => {
                        if (msgs.length !== prev.length) {
                            setTimeout(scrollToBottom, 100);
                            return msgs;
                        }
                        return prev;
                    });
                });
            }, 5000);

            return () => {
                supabaseClient.removeChannel(channel);
                clearInterval(pollInterval);
            };
        }
    }, [selectedConvId, supabaseClient]);

    const handleSend = async () => {
        const msgText = replyInputRef.current?.value?.trim() || '';
        if (!msgText || !selectedConvId) return;

        const currentConv = conversations.find(c => c.id === selectedConvId);
        if (!currentConv) return;

        // Optimistic UI: show message immediately BEFORE API call
        const optimisticMsg = {
            id: `optimistic_${Date.now()}`,
            conversation_id: selectedConvId,
            content: msgText,
            sender_id: 'page',
            sender_name: 'Page',
            is_from_page: true,
            created_at: new Date().toISOString()
        } as SocialMessage;
        setMessages(prev => [...prev, optimisticMsg]);
        if (replyInputRef.current) replyInputRef.current.value = '';
        setTimeout(scrollToBottom, 100);

        // Send in background (no await blocking UI)
        setIsSending(true);
        try {
            const lastCustomerMsg = [...messages].reverse().find(m => !m.is_from_page);
            const recipientId = lastCustomerMsg?.sender_id || currentConv.external_id;

            // Pass page_token directly to skip DB lookups in reply API
            const pageToken = pages.find(p => p.id === currentConv.page_id)?.access_token || '';
            await sendSocialReply(recipientId, msgText, pageToken, selectedConvId);
        } catch (error) {
            toast.error('Lỗi gửi tin nhắn');
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        } finally {
            setIsSending(false);
        }
    };

    // Handle file/image upload and send
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConvId) return;

        const currentConv = conversations.find(c => c.id === selectedConvId);
        if (!currentConv) return;

        const isImage = file.type.startsWith('image/');

        // Optimistic UI
        const previewUrl = isImage ? URL.createObjectURL(file) : '';
        const optimisticMsg = {
            id: `optimistic_${Date.now()}`,
            conversation_id: selectedConvId,
            content: isImage ? '' : `[${file.name}]`,
            attachments: [{ type: isImage ? 'image' : 'file', url: previewUrl, name: file.name }],
            sender_id: 'page',
            sender_name: 'Page',
            is_from_page: true,
            created_at: new Date().toISOString()
        } as SocialMessage;
        setMessages(prev => [...prev, optimisticMsg]);
        setTimeout(scrollToBottom, 100);

        setIsSending(true);
        try {
            // 1. Upload to our server
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/facebook/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadData.success) throw new Error(uploadData.error || 'Đăng tải thất bại');

            // 2. Send via Facebook
            const lastCustomerMsg = [...messages].reverse().find(m => !m.is_from_page);
            const recipientId = lastCustomerMsg?.sender_id || currentConv.external_id;
            const pageToken = pages.find(p => p.id === currentConv.page_id)?.access_token || '';

            await sendSocialReply(recipientId, '', pageToken, selectedConvId, uploadData.url, uploadData.type);

            // Update optimistic message with real URL
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id
                ? { ...m, attachments: [{ type: uploadData.type, url: uploadData.url, name: file.name }] }
                : m
            ));
        } catch (error: any) {
            toast.error(`Lỗi gửi: ${error.message}`);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        } finally {
            setIsSending(false);
            // Reset input
            e.target.value = '';
        }
    };

    const insertEmoji = (emoji: string) => {
        if (replyInputRef.current) {
            const start = replyInputRef.current.selectionStart;
            const end = replyInputRef.current.selectionEnd;
            const val = replyInputRef.current.value;
            replyInputRef.current.value = val.substring(0, start) + emoji + val.substring(end);
            replyInputRef.current.focus();
            replyInputRef.current.selectionStart = replyInputRef.current.selectionEnd = start + emoji.length;
        }
        setShowEmojiPicker(false);
    };

    const handleSync = async () => {
        if (!filterPageId || filterPageId === 'all') {
            toast.error("Vui lòng chọn Fanpage cụ thể để đồng bộ tin nhắn cũ");
            return;
        }

        setIsSyncing(true);
        try {
            const res = await fetch('/api/facebook/sync-conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_id: filterPageId })
            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            toast.success(data.message || "Đồng bộ thành công!");
            loadConversations();
        } catch (error: any) {
            console.error(error);
            toast.error("Lỗi đồng bộ: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const selectedConv = conversations.find(c => c.id === selectedConvId);

    // Filter conversations by search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.customer_name?.toLowerCase().includes(q) ||
            c.snippet?.toLowerCase().includes(q) ||
            c.customer_phone?.includes(q) ||
            c.tags?.some(t => t.toLowerCase().includes(q))
        );
    }, [conversations, searchQuery]);

    const handleUpdateConversation = (updates: Partial<SocialConversation>) => {
        if (!selectedConvId) return;
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ...updates } : c));
    };

    const handleCreateDealSave = async (dealData: any) => {
        if (!selectedConvId) return;
        setIsLoading(true); // Reuse loading or create new state? Reuse is fine but might flash list.
        try {
            await createDeal(dealData);
            toast.success("Đã tạo cơ hội thành công!");
            setIsCreateDealOpen(false);
            // Optional: Link deal to conversation or add a note/tag automatically
            handleUpdateConversation({ tags: [...(selectedConv?.tags || []), 'Có Deal'] });
        } catch (error: any) {
            console.error(error);
            toast.error("Lỗi tạo cơ hội: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50">
            {/* Sidebar List (Left) */}
            <div className="w-1/4 border-r bg-white flex flex-col min-w-[300px]">
                {/* ... existing List Code ... */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg">Hộp thư</h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing || !filterPageId}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-30"
                            title="Đồng bộ tin nhắn cũ từ Facebook"
                        >
                            <DownloadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                        </button>
                        <button onClick={loadConversations} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
                <div className="p-2 space-y-2">
                    <select
                        className="w-full p-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={filterPageId}
                        onChange={e => setFilterPageId(e.target.value)}
                    >
                        <option value="">Tất cả Fanpage ({Object.values(pageCounts).reduce((a, b) => a + b, 0)})</option>
                        {pages.map(p => (
                            <option key={p.id} value={p.id}>{p.name} {pageCounts[p.id] ? `(${pageCounts[p.id]})` : ''}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm outline-none"
                            placeholder="Tìm kiếm tên, SĐT, tag..."
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilterUnread(!filterUnread)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${filterUnread ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter className="w-3 h-3" />
                        {filterUnread ? 'Đang lọc: Chưa đọc' : 'Chưa đọc'}
                    </button>
                    <div className="relative flex items-center">
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${filterDate ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Calendar className="w-3 h-3" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none w-[85px] p-0 text-xs"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                            />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="ml-1 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 && !isLoading && (
                        <div className="text-center p-8 text-slate-400 text-sm">Chưa có tin nhắn nào</div>
                    )}
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`relative p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${selectedConvId === conv.id ? 'bg-primary-50 border-primary-100' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                    {conv.customer_avatar ? (
                                        <img src={conv.customer_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{conv.customer_name || 'Khách hàng'}</h3>
                                            {/* Page Icon */}
                                            {(() => {
                                                const page = pages.find(p => p.id === conv.page_id);
                                                return page ? (
                                                    <img src={page.avatar_url || "https://placehold.co/20x20"} className="w-4 h-4 rounded-full border border-slate-200" title={page.name} />
                                                ) : null;
                                            })()}
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(conv.last_message_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            <span className="mx-1"> </span>
                                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-black' : 'text-slate-500'}`}>
                                        {conv.snippet || 'Hình ảnh / Tệp tin'}
                                    </p>
                                    {/* Unread Badge */}
                                    {conv.unread_count > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                        </div>
                                    )}
                                    {/* Source Badges */}
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(conv.referral_source === 'ADS' || conv.ad_id) ? (
                                            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-100">
                                                <span>QC</span>
                                                {conv.ad_id && <span className="max-w-[80px] truncate">#{conv.ad_id}</span>}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded border border-slate-200">
                                                <span>Tự nhiên</span>
                                            </div>
                                        )}
                                        {/* Tags */}
                                        {conv.tags && conv.tags.length > 0 && (
                                            <>
                                                {conv.tags.slice(0, 2).map(t => (
                                                    <span key={t} className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded">{t}</span>
                                                ))}
                                                {conv.tags.length > 2 && <span className="text-[10px] text-slate-400">+{conv.tags.length - 2}</span>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle Chat Area */}
            <div className="flex-1 flex flex-col border-r">
                {selectedConv ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b bg-white flex items-center px-6 justify-between">
                            <div className="flex items-center gap-3">
                                <div className="font-bold">{selectedConv.customer_name}</div>
                                {selectedConv.platform === 'facebook' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Facebook</span>}
                            </div>
                        </div>

                        {/* Ad Context Banner */}
                        {(selectedConv.ad_id || selectedConv.referral_source === 'ADS') && (
                            <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 text-xs font-bold">QC</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-blue-800 font-medium">Trả lời quảng cáo</span>
                                    {selectedConv.ad_id && (
                                        <a
                                            href={`https://www.facebook.com/ads/manager/account/campaigns?act=&selected_ad_ids=${selectedConv.ad_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 text-blue-600 hover:underline text-xs"
                                        >
                                            Xem QC #{selectedConv.ad_id.slice(-6)}
                                        </a>
                                    )}
                                </div>
                                {selectedConv.ad_title && (
                                    <span className="text-xs text-blue-600 truncate max-w-[200px]">{selectedConv.ad_title}</span>
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.is_from_page ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${msg.is_from_page
                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-tl-none'
                                        }`}>
                                        {/* Attachments: images */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mb-2 space-y-2">
                                                {msg.attachments.map((att, idx) => (
                                                    att.type === 'image' ? (
                                                        <img key={idx} src={att.url} alt={att.name || 'image'}
                                                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                                                            onClick={() => window.open(att.url, '_blank')}
                                                        />
                                                    ) : att.type === 'video' ? (
                                                        <video key={idx} src={att.url} controls className="max-w-full rounded-lg" />
                                                    ) : (
                                                        <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
                                                            className={`flex items-center gap-2 p-2 rounded-lg border ${msg.is_from_page ? 'border-primary-400 text-primary-100 hover:bg-primary-500' : 'border-slate-200 text-blue-600 hover:bg-slate-50'}`}>
                                                            📎 {att.name || 'Tệp đính kèm'}
                                                        </a>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                        {/* Text content */}
                                        {msg.content && msg.content !== '[Hình ảnh]' && msg.content !== '[Tệp tin]' && (
                                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                        )}
                                        <div className={`text-[10px] mt-1 ${msg.is_from_page ? 'text-primary-100' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area with attachment buttons */}
                        <div className="p-3 bg-white border-t">
                            {/* Hidden file inputs */}
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt" className="hidden" onChange={handleFileUpload} />

                            <div className="flex items-end gap-2">
                                {/* Action buttons */}
                                <div className="flex gap-1 pb-1">
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isSending}
                                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                        title="Gửi ảnh"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending}
                                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                        title="Gửi file"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Emoji"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-10 left-0 bg-white border rounded-xl shadow-lg p-3 grid grid-cols-8 gap-1 z-50 w-[280px]">
                                                {['👍', '❤️', '😂', '😍', '🙏', '🎉', '🔥', '✨', '👏', '😊', '🙌', '💪', '👌', '🌟', '😉', '😜', '🤣', '😘', '😇', '🥰', '🥳', '🤩', '🤔', '😱', '💯', '✔️', '❌', '⚠️', '📦', '📱', '💻', '☎️'].map(e => (
                                                    <button key={e} onClick={() => insertEmoji(e)} className="text-xl hover:bg-slate-100 rounded p-1 transition-colors">{e}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Text input */}
                                <textarea
                                    ref={replyInputRef}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 h-[50px]"
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    onFocus={() => setShowEmojiPicker(false)}
                                />

                                {/* Send button */}
                                <button
                                    onClick={handleSend}
                                    disabled={isSending}
                                    className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 text-right">
                                Tự động lưu khi gửi
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>Chọn một hội thoại để bắt đầu chat</p>
                    </div>
                )}
            </div>

            {/* Right Customer Sidebar */}
            {selectedConv && (
                <InboxCustomerSidebar
                    conversation={{ ...selectedConv, fb_page_id: pages.find(p => p.id === selectedConv.page_id)?.page_id || '' } as any}
                    messages={messages}
                    onUpdate={handleUpdateConversation}
                    token={session?.access_token}
                    onCreateDeal={() => setIsCreateDealOpen(true)}
                />
            )}

            {selectedConv && (
                <CreateDealModal
                    isOpen={isCreateDealOpen}
                    onClose={() => setIsCreateDealOpen(false)}
                    onSave={handleCreateDealSave}
                    userId={user?.id}
                    initialData={{
                        title: `Cơ hội từ FB: ${selectedConv.customer_name}`,
                        source_category: 'MARKETING',
                        source_detail: `Facebook Page: ${pages.find(p => p.is_connected)?.name || 'Unknown'}`
                    }}
                    defaultNewCustomer={{
                        name: selectedConv?.customer_name || 'Khách hàng Facebook'
                    }}
                />
            )}
        </div>
    );
}
