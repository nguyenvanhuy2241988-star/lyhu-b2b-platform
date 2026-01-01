'use client';

import { useState } from 'react';
import { Search, Send, Image as ImageIcon, MoreVertical, Phone, MessageCircle } from 'lucide-react';
import Image from 'next/image';

const MOCK_CONVERSATIONS = [
    { id: 1, name: 'Nguyễn Văn A', channel: 'Shopee', lastMessage: 'Sản phẩm này còn hàng không shop?', time: '10:30', unread: 2, avatar: 'https://ui-avatars.com/api/?name=NV&background=orange&color=fff' },
    { id: 2, name: 'Trần Thị B', channel: 'Facebook', lastMessage: 'Mình muốn đặt 5 cái nhé', time: '09:15', unread: 0, avatar: 'https://ui-avatars.com/api/?name=TB&background=0084ff&color=fff' },
    { id: 3, name: 'Lê Văn C', channel: 'TikTok', lastMessage: 'Shop giao nhanh giúp mình nha', time: 'Yesterday', unread: 1, avatar: 'https://ui-avatars.com/api/?name=LC&background=000&color=fff' },
    { id: 4, name: 'Phạm Thị D', channel: 'Zalo', lastMessage: 'Đã chuyển khoản rồi ạ', time: 'Yesterday', unread: 0, avatar: 'https://ui-avatars.com/api/?name=PD&background=0068ff&color=fff' },
];

const MOCK_MESSAGES = [
    { id: 1, sender: 'customer', text: 'Chào shop, cho mình hỏi mẫu áo này còn size L không?', time: '10:28' },
    { id: 2, sender: 'shop', text: 'Dạ shop chào bạn ạ. Mẫu này bên mình còn size L bạn nhé ^^', time: '10:29' },
    { id: 3, sender: 'customer', text: 'Sản phẩm này còn hàng không shop?', time: '10:30' },
];

export default function EcommerceChatPage() {
    const [activeConv, setActiveConv] = useState(MOCK_CONVERSATIONS[0]);
    const [input, setInput] = useState('');

    return (
        <div className="flex h-[calc(100vh-100px)] -m-6 bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none" placeholder="Tìm khách hàng..." />
                    </div>
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                        {['All', 'Shopee', 'Facebook', 'TikTok', 'Zalo'].map(c => (
                            <button key={c} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 whitespace-nowrap transition">
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {MOCK_CONVERSATIONS.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setActiveConv(conv)}
                            className={`p-4 flex gap-3 hover:bg-slate-50 cursor-pointer transition ${activeConv.id === conv.id ? 'bg-violet-50/50' : ''}`}
                        >
                            <Image src={conv.avatar} alt={conv.name} width={40} height={40} className="rounded-full" />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-medium text-slate-900 truncate">{conv.name}</h4>
                                    <span className="text-xs text-slate-400">{conv.time}</span>
                                </div>
                                <p className="text-sm text-slate-500 truncate">{conv.lastMessage}</p>
                            </div>
                            {conv.unread > 0 && (
                                <div className="flex flex-col items-end gap-1">
                                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                                    <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">{conv.unread}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <Image src={activeConv.avatar} alt={activeConv.name} width={40} height={40} className="rounded-full" />
                        <div>
                            <h3 className="font-bold text-slate-900">{activeConv.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span className={`w-2 h-2 rounded-full ${activeConv.channel === 'Shopee' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                {activeConv.channel}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><Phone className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><MoreVertical className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    <div className="text-center text-xs text-slate-400 my-4">Today, 10:28 AM</div>
                    {MOCK_MESSAGES.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'shop' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender === 'shop' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white text-slate-800 shadow-sm rounded-tl-none border border-slate-100'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="flex gap-2 items-center bg-slate-100 px-4 py-2 rounded-full">
                        <button className="text-slate-400 hover:text-slate-600"><ImageIcon className="w-5 h-5" /></button>
                        <input
                            className="flex-1 bg-transparent focus:outline-none text-sm"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button className="p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Customer Info (Right Sidebar - Simplified) */}
            <div className="w-72 border-l border-slate-200 bg-white p-4 hidden xl:block">
                <div className="text-center mb-6">
                    <Image src={activeConv.avatar} alt={activeConv.name} width={80} height={80} className="rounded-full mx-auto mb-3" />
                    <h3 className="font-bold text-lg">{activeConv.name}</h3>
                    <p className="text-slate-500 text-sm">Khách hàng mới</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Đơn hàng gần nhất</p>
                        <div className="text-sm font-medium">#ORD-SHOPEE-123</div>
                        <div className="text-green-600 text-xs mt-1">Giao thành công</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Ghi chú</p>
                        <p className="text-sm text-slate-600">Khách hay hỏi size kỹ, thích màu sáng.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
