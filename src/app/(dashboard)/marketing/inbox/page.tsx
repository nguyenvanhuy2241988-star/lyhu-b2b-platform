"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    fetchConversations,
    fetchMessages,
    sendSocialReply,
    fetchFacebookPages,
    SocialConversation,
    SocialMessage,
    FacebookPage,
    fetchInboxCounts
} from '@/lib/marketingStore';
import { MessageSquare, Send, User, Search, RefreshCw, Loader2, DownloadCloud, Filter, Calendar, X } from 'lucide-react';
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
    const [replyText, setReplyText] = useState('');
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

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            counts.forEach(c => map[c.page_id] = c.unread_conversations);
            setPageCounts(map);
        });
    };

    const loadMessages = async (convId: string) => {
        const msgs = await fetchMessages(convId, session?.access_token);
        setMessages(msgs);
        setTimeout(() => scrollToBottom(), 100);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleRealtimeConversation = (payload: any) => {
        if (payload.eventType === 'INSERT') {
            const newConv = payload.new as SocialConversation;
            setConversations(prev => [newConv, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SocialConversation;
            setConversations(prev => {
                const exists = prev.find(c => c.id === updated.id);
                if (exists) {
                    // Update and Move to top if new message
                    const others = prev.filter(c => c.id !== updated.id);
                    return [updated, ...others];
                }
                return [updated, ...prev];
            });
        }
    };

    useEffect(() => {
        if (session?.access_token) {
            loadConversations();
            fetchFacebookPages(session.access_token).then(data => setPages(data));

            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${session?.access_token}`
                        }
                    }
                }
            );
            const channel = supabase
                .channel('social-conversations-list-global')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'social_conversations'
                }, handleRealtimeConversation)
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [session, filterPageId, filterUnread, filterDate]);

    useEffect(() => {
        if (selectedConvId) {
            loadMessages(selectedConvId);

            // Subscribe to new messages for this conversation
            const supabase = createClient();
            const channel = supabase
                .channel(`social-messages-${selectedConvId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'social_messages',
                    filter: `conversation_id=eq.${selectedConvId}`
                }, (payload: any) => {
                    const newMsg = payload.new as SocialMessage;
                    setMessages(prev => [...prev, newMsg]);
                    setTimeout(scrollToBottom, 100);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConvId]);

    const handleSend = async () => {
        if (!replyText.trim() || !selectedConvId) return;

        // Find current conversation to get recipient ID (external_id usually sender_id)
        const currentConv = conversations.find(c => c.id === selectedConvId);
        if (!currentConv) return;

        // Find Page Token (Assuming first connected page for now, or use mapped page_id)
        // Ideally fetch page linked to conversation
        const pageToken = pages.find(p => p.is_connected)?.access_token;
        if (!pageToken) {
            alert("Chưa kết nối Fanpage nào có Token!");
            return;
        }

        setIsSending(true);
        try {
            // Recipient ID needed. In Conversation, external_id is THREAD ID if Facebook, 
            // OR sender_psid if it's a direct message object.
            // Simplified: we assume we can reply to 'external_id' or we need to look up last message sender.
            // Let's assume external_id IS valid recipient_id for now for simplicity of MVP.
            // If external_id is thread_id (t_...), we might need sender_id from last message.

            // Getting sender_id from last message from customer
            const lastCustomerMsg = [...messages].reverse().find(m => !m.is_from_page);
            const recipientId = lastCustomerMsg?.sender_id || currentConv.external_id;

            await sendSocialReply(recipientId, replyText, pageToken);
            setReplyText('');
            // Optimistic update handled by Realtime or refetch
            // For now manual append or wait for Realtime
        } catch (error) {
            alert("Lỗi gửi tin nhắn");
        } finally {
            setIsSending(false);
        }
    };

    const handleSync = async () => {
        if (!filterPageId) {
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
                        <input className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm outline-none" placeholder="Tìm kiếm..." />
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
                    {conversations.map(conv => (
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
                                    {(conv.referral_source === 'ADS' || conv.ad_id) && (
                                        <div className="mt-1 inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-100">
                                            <span>QC</span>
                                            {conv.ad_id && <span className="max-w-[80px] truncate">#{conv.ad_id}</span>}
                                        </div>
                                    )}
                                    {/* Tags Mini Badge */}
                                    {conv.tags && conv.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {conv.tags.slice(0, 2).map(t => (
                                                <span key={t} className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded">{t}</span>
                                            ))}
                                            {conv.tags.length > 2 && <span className="text-[10px] text-slate-400">+{conv.tags.length - 2}</span>}
                                        </div>
                                    )}
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

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.is_from_page ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${msg.is_from_page
                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-tl-none'
                                        }`}>
                                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                        <div className={`text-[10px] mt-1 ${msg.is_from_page ? 'text-primary-100' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 h-[50px]"
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim() || isSending}
                                    className="px-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
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
                    conversation={selectedConv}
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
