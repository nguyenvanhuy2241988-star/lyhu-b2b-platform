"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { format } from "date-fns";

export default function AdminZaloPage() {
    const supabase = createClient();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch Accounts
    useEffect(() => {
        fetchAccounts();

        // Realtime Subscription for new Accounts
        const channel = supabase
            .channel('zalo-accounts-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'zalo_sync_accounts' }, () => {
                fetchAccounts();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // 2. Fetch Messages when Account Selected
    useEffect(() => {
        if (!selectedAccount) return;
        fetchMessages(selectedAccount.id);

        // Realtime Subscription for new Messages
        const channel = supabase
            .channel(`zalo-messages-${selectedAccount.id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'zalo_messages', filter: `account_id=eq.${selectedAccount.id}` },
                (payload: any) => {
                    setMessages((prev) => [payload.new, ...prev]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedAccount]);

    async function fetchAccounts() {
        const { data } = await supabase.from("zalo_sync_accounts").select("*").order("last_synced_at", { ascending: false });
        if (data) setAccounts(data);
    }

    async function fetchMessages(accountId: string) {
        setIsLoading(true);
        console.log("Fetching messages (RPC) for account:", accountId);

        // Use RPC to bypass RLS
        const { data, error } = await supabase.rpc('get_zalo_messages', {
            p_account_id: accountId
        });

        console.log("Messages Data (RPC):", data);
        if (error) console.error("Messages Error (RPC):", error);

        if (data) setMessages(data);
        setIsLoading(false);
    }

    return (
        <div className="p-6 h-[calc(100vh-100px)] flex flex-col">
            <h1 className="text-2xl font-bold mb-4">Giám sát Zalo (Sync Center)</h1>

            <div className="flex flex-1 gap-4 border rounded-lg bg-white overflow-hidden shadow-sm">
                {/* Check if Database is empty */}
                {accounts.length === 0 && (
                    <div className="p-10 w-full text-center text-gray-500">
                        Chưa có dữ liệu. Vui lòng cài đặt Extension và đăng nhập Zalo Web để bắt đầu đồng bộ.
                    </div>
                )}

                {/* Left Sidebar: Accounts */}
                {accounts.length > 0 && (
                    <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
                        <div className="p-4 font-semibold text-gray-700 border-b">Nhân viên ({accounts.length})</div>
                        {accounts.map(acc => (
                            <div
                                key={acc.id}
                                onClick={() => setSelectedAccount(acc)}
                                className={`p-4 cursor-pointer hover:bg-gray-100 border-b flex items-center gap-3 ${selectedAccount?.id === acc.id ? 'bg-blue-50' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                    {acc.avatar_url ? <img src={acc.avatar_url} className="rounded-full" /> : acc.name?.substring(0, 2)}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{acc.name}</div>
                                    <div className="text-xs text-gray-500">
                                        Cập nhật: {acc.last_synced_at ? format(new Date(acc.last_synced_at), 'HH:mm dd/MM') : 'Chưa sync'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Right Content: Messages */}
                {selectedAccount && (
                    <div className="flex-1 flex flex-col bg-slate-50">
                        <div className="p-4 border-b bg-white shadow-sm font-semibold">
                            Lịch sử Chat: {selectedAccount.name}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse"> {/* Reverse layout for chat */}
                            {isLoading ? (
                                <div className="text-center p-4">Đang tải tin nhắn...</div>
                            ) : messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${msg.direction === 'outgoing' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'
                                        }`}>
                                        <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                            <span>{msg.direction === 'outgoing' ? 'Nhân viên' : msg.sender_name || 'Khách hàng'}</span>
                                            <span>{format(new Date(msg.timestamp), 'HH:mm')}</span>
                                        </div>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                        {/* Attachments placeholder */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 text-xs italic bg-black/10 p-1 rounded">Có {msg.attachments.length} file đính kèm</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && <div className="text-center text-gray-400 my-10">Chưa có tin nhắn nào được đồng bộ.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
