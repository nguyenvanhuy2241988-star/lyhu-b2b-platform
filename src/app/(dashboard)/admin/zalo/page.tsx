"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";

// Helper function to format date labels
function getDateLabel(date: Date): string {
    if (isToday(date)) return "Hôm nay";
    if (isYesterday(date)) return "Hôm qua";
    return format(date, "dd/MM/yyyy");
}

export default function AdminZaloPage() {
    const supabase = createClient();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>("all");
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Fetch Initial Data
    useEffect(() => {
        fetchAccounts();
        fetchMessages();

        // Realtime Subscription for Accounts
        const accChannel = supabase.channel('zalo-accounts-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'zalo_sync_accounts' }, fetchAccounts)
            .subscribe();

        // Realtime Subscription for Messages (Global)
        const msgChannel = supabase.channel('zalo-messages-global')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'zalo_messages' }, (payload: any) => {
                setMessages(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(accChannel);
            supabase.removeChannel(msgChannel);
        };
    }, []);

    async function fetchAccounts() {
        const { data } = await supabase.from("zalo_sync_accounts").select("*").order("last_synced_at", { ascending: false });
        if (data) setAccounts(data);
    }

    async function fetchMessages() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/zalo/messages`);
            const data = await res.json();
            if (Array.isArray(data)) setMessages(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }

    // 2. Filter & Group Logic
    const filteredMessages = useMemo(() => {
        let items = messages;
        if (selectedAccount !== "all") {
            items = items.filter(m => m.account_id === selectedAccount);
        }
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            items = items.filter(m =>
                (m.content?.toLowerCase().includes(lowerSearch)) ||
                (m.sender_name?.toLowerCase().includes(lowerSearch)) ||
                (m.receiver_name?.toLowerCase().includes(lowerSearch))
            );
        }
        return items;
    }, [messages, selectedAccount, searchTerm]);

    const conversations = useMemo(() => {
        const groups: Record<string, any> = {};

        filteredMessages.forEach(msg => {
            // Identify Partner Name (Key)
            const partnerName = msg.direction === 'incoming'
                ? (msg.sender_name || "Unknown")
                : (msg.receiver_name || "Unknown");

            // Filter out 'Unknown' if we have good data, usually caused by legacy sync
            // but if we ONLY have unknown, we keep it.
            // For now, let's group them.

            if (!partnerName) return;

            if (!groups[partnerName]) {
                groups[partnerName] = {
                    name: partnerName,
                    avatar: msg.direction === 'incoming' ? msg.sender_avatar : '',
                    lastMessage: msg,
                    messages: [],
                    unreadCount: 0
                };
            }

            groups[partnerName].messages.push(msg);

            // Update avatar if newer message has it
            if (msg.direction === 'incoming' && msg.sender_avatar && !groups[partnerName].avatar) {
                groups[partnerName].avatar = msg.sender_avatar;
            }
        });

        return Object.values(groups).sort((a: any, b: any) =>
            new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
        );
    }, [filteredMessages]);

    // Select first contact by default
    useEffect(() => {
        if (!selectedContact && conversations.length > 0) {
            setSelectedContact(conversations[0].name);
        }
    }, [conversations, selectedContact]);

    const currentChat = selectedContact ? conversations.find(c => c.name === selectedContact) : null;

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden font-sans">
            {/* TOP HEADER BAR */}
            <div className="h-14 bg-[#0068FF] text-white flex items-center px-6 justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold tracking-wide">Zalo Sync Center</h1>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="bg-white/20 text-white border border-white/30 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                        <option value="all" className="text-gray-800">Tất cả tài khoản ({accounts.length})</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="text-gray-800">{acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-md px-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-white/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR: Conversations List */}
                <div className="w-[340px] border-r border-gray-200 flex flex-col bg-white">
                    {/* Sidebar Header with count */}
                    <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100 shrink-0 bg-gray-50">
                        <span className="text-sm font-medium text-gray-600">Cuộc hội thoại</span>
                        <span className="text-xs text-gray-400">{conversations.length} liên hệ</span>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((conv: any) => (
                            <div
                                key={conv.name}
                                onClick={() => setSelectedContact(conv.name)}
                                className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${selectedContact === conv.name ? 'bg-[#E5EFFF]' : 'hover:bg-[#F1F1F1]'}`}
                            >
                                <div className="relative shrink-0">
                                    {conv.avatar ? (
                                        <img src={conv.avatar} alt="avt" className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg select-none">
                                            {conv.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="text-[15px] font-medium text-gray-900 truncate">{conv.name}</h3>
                                        <span className="text-[11px] text-gray-500 font-medium">
                                            {format(new Date(conv.lastMessage.timestamp), 'HH:mm')}
                                        </span>
                                    </div>
                                    <p className={`text-[13px] truncate ${selectedContact === conv.name ? 'text-gray-600' : 'text-gray-500'}`}>
                                        {conv.lastMessage.direction === 'outgoing' && <span className="mr-1">Bạn:</span>}
                                        {conv.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {conversations.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">Chưa có cuộc hội thoại nào</div>
                        )}
                    </div>
                </div>

                {/* CENTER: Chat Window */}
                <div className="flex-1 flex flex-col bg-[#d1d7db85] relative"> {/* Zalo-like light gray bg */}
                    {currentChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-5 justify-between shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold select-none">
                                        {currentChat.avatar ? <img src={currentChat.avatar} className="w-full h-full rounded-full object-cover" /> : currentChat.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-[16px]">{currentChat.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <span className="text-gray-400 text-[10px]"> Truy cập vừa xong</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Header Actions (Visual Only) */}
                                <div className="flex items-center gap-4 text-gray-500">
                                    <button className="hover:bg-gray-100 p-2 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                                    <button className="hover:bg-gray-100 p-2 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 flex flex-col-reverse bg-[#EEF0F1]">
                                {currentChat.messages.map((msg: any, index: number) => {
                                    const currentDate = new Date(msg.timestamp);
                                    const prevMsg = currentChat.messages[index - 1];
                                    const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;

                                    // Show date separator if this is first message or date changed
                                    const showDateSeparator = !prevDate ||
                                        currentDate.toDateString() !== prevDate.toDateString();

                                    return (
                                        <div key={msg.id}>
                                            {/* Date Separator */}
                                            {showDateSeparator && (
                                                <div className="flex items-center justify-center my-4">
                                                    <div className="bg-gray-200/80 text-gray-600 text-xs px-4 py-1.5 rounded-full font-medium shadow-sm">
                                                        {getDateLabel(currentDate)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div className={`flex w-full mb-1 ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[65%] relative group flex flex-col ${msg.direction === 'outgoing' ? 'items-end' : 'items-start'}`}>

                                                    <div className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words ${msg.direction === 'outgoing'
                                                        ? 'bg-[#E5EFFF] text-gray-800 rounded-l-xl rounded-tr-xl rounded-br-sm border border-[#cbe2ff]'
                                                        : 'bg-white text-gray-800 rounded-r-xl rounded-tl-xl rounded-bl-sm border border-gray-100'
                                                        }`}>
                                                        <div className="whitespace-pre-wrap">{msg.content}</div>

                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="mt-2 text-xs italic bg-black/5 p-2 rounded border border-black/5">
                                                                📎 {msg.attachments.length} tệp đính kèm
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={`text-[10px] text-gray-400 mt-1 px-1 select-none ${msg.direction === 'outgoing' ? 'text-right' : 'text-left'}`}>
                                                        {format(new Date(msg.timestamp), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Chat Input Placeholder */}
                            <div className="h-16 bg-white border-t border-gray-200 px-4 flex items-center gap-3 shrink-0">
                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>

                                <div className="flex-1 bg-gray-50 h-10 rounded-full flex items-center px-4 text-gray-400 text-sm border border-gray-100 cursor-not-allowed">
                                    Nhập tin nhắn tới {currentChat.name}...
                                </div>

                                <button className="text-blue-500 hover:text-blue-600"><svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p>Chọn một cuộc hội thoại để bắt đầu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
