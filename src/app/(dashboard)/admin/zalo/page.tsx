"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
        return items;
    }, [messages, selectedAccount]);

    const conversations = useMemo(() => {
        const groups: Record<string, any> = {};

        filteredMessages.forEach(msg => {
            // Identify Partner Name (Key)
            // If incoming: Sender Name
            // If outgoing: Receiver Name
            // Fallback to "Unknown"
            const partnerName = msg.direction === 'incoming'
                ? (msg.sender_name || "Unknown")
                : (msg.receiver_name || "Unknown");

            // Skip if this message doesn't have a valid partner name to group by
            if (!partnerName) return;

            if (!groups[partnerName]) {
                groups[partnerName] = {
                    name: partnerName,
                    avatar: msg.direction === 'incoming' ? msg.sender_avatar : '', // Try to capture avatar from incoming msg
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

        // Convert to array and sort by last message timestamp
        return Object.values(groups).sort((a: any, b: any) =>
            new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
        );
    }, [filteredMessages]);

    // Select first contact by default if none selected
    useEffect(() => {
        if (!selectedContact && conversations.length > 0) {
            setSelectedContact(conversations[0].name);
        }
    }, [conversations, selectedContact]);

    const currentChat = selectedContact ? conversations.find(c => c.name === selectedContact) : null;

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100 overflow-hidden">
            {/* Header / Filter Bar */}
            <div className="bg-white border-b h-14 flex items-center px-4 justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <h1 className="font-bold text-gray-700 text-lg">Zalo Sync Center</h1>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        <option value="all">Tất cả tài khoản ({accounts.length})</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    {/* Search placeholder */}
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="bg-gray-100 text-sm rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Conversations */}
                <div className="w-80 bg-white border-r flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        {conversations.map((conv: any) => (
                            <div
                                key={conv.name}
                                onClick={() => setSelectedContact(conv.name)}
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors ${selectedContact === conv.name ? 'bg-blue-50' : ''}`}
                            >
                                <div className="relative">
                                    {conv.avatar ? (
                                        <img src={conv.avatar} alt="avt" className="w-12 h-12 rounded-full object-cover border" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                            {conv.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">{conv.name}</h3>
                                        <span className="text-xs text-gray-500">{format(new Date(conv.lastMessage.timestamp), 'HH:mm', { locale: vi })}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate flex items-center">
                                        {conv.lastMessage.direction === 'outgoing' && <span className="mr-1">Bạn:</span>}
                                        {conv.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {conversations.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm mt-10">Chưa có cuộc hội thoại nào</div>
                        )}
                    </div>
                </div>

                {/* Center: Chat Window */}
                <div className="flex-1 flex flex-col bg-[#eef0f1] relative">
                    {currentChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 bg-white border-b flex items-center px-4 justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        {currentChat.avatar ? <img src={currentChat.avatar} className="w-full h-full rounded-full" /> : currentChat.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{currentChat.name}</div>
                                        <div className="text-xs text-green-500 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
                                {currentChat.messages.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] relative group`}>
                                            {/* Sender Name for incoming group context (optional, simplified here) */}

                                            <div className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed relative ${msg.direction === 'outgoing'
                                                    ? 'bg-[#E5EFFF] text-gray-800 rounded-2xl rounded-tr-sm'
                                                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm'
                                                }`}>
                                                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                                                {/* Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-2 text-xs italic bg-black/5 p-2 rounded border border-black/5">
                                                        📎 {msg.attachments.length} tệp đính kèm
                                                    </div>
                                                )}

                                                {/* Timestamp inside bubble */}
                                                <div className={`text-[10px] opacity-50 mt-1 text-right`}>
                                                    {format(new Date(msg.timestamp), 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Input (Read-only for now) */}
                            <div className="p-4 bg-white border-t">
                                <div className="bg-gray-100 rounded-xl p-3 text-center text-gray-500 text-sm">
                                    Tính năng trả lời đang được phát triển...
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Chọn một cuộc hội thoại để xem
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
