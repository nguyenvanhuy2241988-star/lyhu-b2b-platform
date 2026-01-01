"use client";

import { useEffect, useState } from "react";
import { X, Image as ImageIcon, FileText, Download } from "lucide-react";
import Image from "next/image";
import { useChatStore } from "@/lib/chatStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ChatInfoPanelProps {
    conversation: any;
    onClose: () => void;
    users: any[];
}

export function ChatInfoPanel({ conversation, onClose, users }: ChatInfoPanelProps) {
    const { getChatMedia } = useChatStore();
    const [activeTab, setActiveTab] = useState<'images' | 'files'>('images');
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedia = async () => {
            if (!conversation?.id) return;
            setLoading(true);
            try {
                const items = await getChatMedia(conversation.id);
                setMediaItems(items);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [conversation?.id, getChatMedia]);

    const images = mediaItems.filter(m => m.attachment_type === 'image');
    const files = mediaItems.filter(m => m.attachment_type !== 'image'); // 'file' or undefined but has url

    return (
        <div className="absolute inset-0 md:static md:w-80 md:inset-auto z-30 bg-white border-l border-slate-200 flex flex-col shadow-xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-800">Thông tin hội thoại</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Conversation Info (Optional summary) */}
            <div className="p-6 flex flex-col items-center border-b border-slate-100 shrink-0">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-200 overflow-hidden mb-3 relative">
                    {conversation.image_url ? (
                        <Image
                            src={conversation.image_url}
                            alt=""
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-semibold">
                            {conversation.name?.[0].toUpperCase()}
                        </div>
                    )}
                </div>
                <h4 className="font-bold text-lg text-center text-slate-900 line-clamp-1">
                    {conversation.name || "Cuộc trò chuyện"}
                </h4>
                <p className="text-sm text-slate-500">
                    {conversation.type === 'group' ? 'Nhóm trò chuyện' : 'Tin nhắn trực tiếp'}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
                <button
                    onClick={() => setActiveTab('images')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'images' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Ảnh ({images.length})
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <FileText className="w-4 h-4" />
                    File ({files.length})
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : activeTab === 'images' ? (
                    images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {images.map(img => (
                                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group border border-slate-100">
                                    <Image
                                        src={img.attachment_url}
                                        alt=""
                                        fill
                                        className="object-cover hover:scale-110 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={() => window.open(img.attachment_url, '_blank')}
                                            className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:text-primary-600 shadow-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 text-sm">Chưa có hình ảnh nào</div>
                    )
                ) : (
                    files.length > 0 ? (
                        <div className="space-y-2">
                            {files.map(file => (
                                <div key={file.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 hover:shadow-sm transition-shadow">
                                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-slate-800">{file.attachment_name || "File"}</p>
                                        <p className="text-xs text-slate-400">
                                            {(() => {
                                                const d = new Date(file.created_at);
                                                return format(isNaN(d.getTime()) ? new Date() : d, 'dd/MM/yyyy');
                                            })()}
                                        </p>
                                    </div>
                                    <a href={file.attachment_url} download target="_blank" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 text-sm">Chưa có tệp tin nào</div>
                    )
                )}
            </div>
        </div>
    );
}
