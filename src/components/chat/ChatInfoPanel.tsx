"use client";

import { useEffect, useState } from "react";
import { X, Image as ImageIcon, FileText, Download, Users, Crown, Trash2, LogOut } from "lucide-react";
import Image from "next/image";
import { useChatStore } from "@/lib/chatStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ChatInfoPanelProps {
    conversation: any;
    onClose: () => void;
    users: any[];
    currentUserId?: string;
    onDeleteGroup?: () => void;
    onLeaveGroup?: () => void;
}

export function ChatInfoPanel({ conversation, onClose, users, currentUserId, onDeleteGroup, onLeaveGroup }: ChatInfoPanelProps) {
    const { getChatMedia } = useChatStore();
    const [activeTab, setActiveTab] = useState<'members' | 'images' | 'files'>('members');
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
    const files = mediaItems.filter(m => m.attachment_type !== 'image');

    const isGroup = conversation?.type === 'group';
    const createdBy = conversation?.created_by;
    const isCreator = currentUserId && createdBy === currentUserId;

    // Get members from internal_participants
    const members = conversation?.internal_participants || [];

    // Default to members tab for groups, images for DMs
    useEffect(() => {
        if (isGroup) {
            setActiveTab('members');
        } else {
            setActiveTab('images');
        }
    }, [conversation?.id, isGroup]);

    return (
        <div className="absolute inset-0 md:static md:w-80 md:inset-auto z-30 bg-white border-l border-slate-200 flex flex-col shadow-xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-800">Thông tin hội thoại</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Conversation Info */}
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
                            {isGroup ? <Users className="w-8 h-8" /> : conversation.name?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <h4 className="font-bold text-lg text-center text-slate-900 line-clamp-1">
                    {conversation.name || "Cuộc trò chuyện"}
                </h4>
                <p className="text-sm text-slate-500">
                    {isGroup ? `Nhóm • ${members.length} thành viên` : 'Tin nhắn trực tiếp'}
                </p>
                {isGroup && createdBy && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Crown className="w-3 h-3" />
                        Tạo bởi: {users.find(u => u.id === createdBy)?.full_name || 'Unknown'}
                    </p>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
                {isGroup && (
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'members' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Users className="w-4 h-4" />
                        {members.length}
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('images')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'images' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <ImageIcon className="w-4 h-4" />
                    {images.length}
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'files' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <FileText className="w-4 h-4" />
                    {files.length}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                {activeTab === 'members' && isGroup ? (
                    <div className="space-y-1">
                        {members.map((p: any) => {
                            const member = users.find(u => u.id === p.user_id);
                            const isOwner = p.user_id === createdBy;
                            const displayName = p.full_name || p.email?.split('@')[0] || member?.full_name || member?.email?.split('@')[0] || 'User';

                            return (
                                <div key={p.user_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white transition-colors">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase ${isOwner ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {displayName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-medium text-slate-800 truncate">{displayName}</span>
                                            {isOwner && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                                                    <Crown className="w-2.5 h-2.5" />
                                                    Trưởng nhóm
                                                </span>
                                            )}
                                            {p.user_id === currentUserId && !isOwner && (
                                                <span className="text-[10px] text-slate-400">Bạn</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">{member?.role || 'Thành viên'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
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

            {/* Group Actions */}
            {isGroup && (
                <div className="p-3 border-t border-slate-200 shrink-0 space-y-2">
                    {!isCreator && (
                        <button
                            onClick={onLeaveGroup}
                            className="w-full flex items-center justify-center gap-2 text-sm text-orange-600 hover:bg-orange-50 py-2.5 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Rời nhóm
                        </button>
                    )}
                    {isCreator && (
                        <button
                            onClick={onDeleteGroup}
                            className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 py-2.5 rounded-lg transition-colors font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa nhóm chat
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
