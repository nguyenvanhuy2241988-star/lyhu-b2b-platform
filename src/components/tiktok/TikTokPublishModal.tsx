"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle, RefreshCw, Lock, Globe, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface TikTokPublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    defaultTitle?: string;
}

export default function TikTokPublishModal({
    isOpen,
    onClose,
    videoUrl,
    defaultTitle = ''
}: TikTokPublishModalProps) {
    const [title, setTitle] = useState(defaultTitle);
    const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('PUBLIC_TO_EVERYONE');
    const [disableComment, setDisableComment] = useState(false);
    const [disableDuet, setDisableDuet] = useState(false);
    const [disableStitch, setDisableStitch] = useState(false);

    const [accountInfo, setAccountInfo] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(defaultTitle);
            checkAccountStatus();
        }
    }, [isOpen, defaultTitle]);

    const checkAccountStatus = async () => {
        setLoadingAccount(true);
        try {
            const res = await fetch('/api/tiktok/status');
            const data = await res.json();
            if (data.connected) {
                setIsConnected(true);
                setAccountInfo(data.user);
            } else {
                setIsConnected(false);
                setAccountInfo(null);
            }
        } catch (err) {
            console.error('Failed to check TikTok status', err);
            setIsConnected(false);
        } finally {
            setLoadingAccount(false);
        }
    };

    const handleConnectTikTok = () => {
        window.location.href = '/api/tiktok/auth';
    };

    const handleGenerateAICaption = async () => {
        setIsGeneratingCaption(true);
        try {
            const res = await fetch('/api/ai/generate-tiktok-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoTitle: title || defaultTitle })
            });
            const data = await res.json();
            if (data.caption) {
                setTitle(data.caption);
                toast.success('✨ AI đã tạo caption & hashtag thành công!');
            } else {
                throw new Error(data.error || 'Không tạo được caption');
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi gọi AI');
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error('Vui lòng nhập tiêu đề hoặc caption cho video!');
            return;
        }

        if (!videoUrl) {
            toast.error('Không tìm thấy đường dẫn video!');
            return;
        }

        setPublishing(true);
        try {
            const res = await fetch('/api/tiktok/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    videoUrl: videoUrl,
                    privacyLevel: privacyLevel,
                    disableComment,
                    disableDuet,
                    disableStitch
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Đăng video thất bại');
            }

            toast.success(data.message || 'Đã gửi yêu cầu đăng video lên kênh TikTok thành công!');
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Lỗi khi gửi video lên TikTok');
        } finally {
            setPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                        </svg>
                        <h3 className="font-semibold text-base">Đăng video lên kênh TikTok</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Account status */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        {loadingAccount ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Đang kiểm tra kết nối TikTok...
                            </div>
                        ) : isConnected ? (
                            <div className="flex items-center gap-3">
                                {accountInfo?.avatar_url ? (
                                    <img src={accountInfo.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                                        TT
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-1.5 font-medium text-gray-900 text-sm">
                                        {accountInfo?.display_name || 'Kênh TikTok đã kết nối'}
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-xs text-emerald-600">Sẵn sàng đăng video tự động</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Chưa liên kết kênh TikTok</p>
                                    <p className="text-xs text-gray-500">Ủy quyền để app LYHU tự động đăng video</p>
                                </div>
                            </div>
                        )}

                        {!loadingAccount && !isConnected && (
                            <button
                                onClick={handleConnectTikTok}
                                className="px-3.5 py-1.5 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                            >
                                Kết nối ngay
                            </button>
                        )}
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-medium text-gray-700">
                                    Tiêu đề & Hashtags (Caption) <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateAICaption}
                                    disabled={isGeneratingCaption}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors border border-amber-200 shadow-xs"
                                >
                                    <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                                    {isGeneratingCaption ? 'AI đang viết...' : '✨ AI viết Caption & Hashtag'}
                                </button>
                            </div>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                rows={4}
                                placeholder="Nhập mô tả video và hashtag (hoặc bấm nút AI viết Caption ở trên)..."
                                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Privacy Level */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Quyền riêng tư
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPrivacyLevel('PUBLIC_TO_EVERYONE')}
                                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                                        privacyLevel === 'PUBLIC_TO_EVERYONE'
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <Globe className="w-4 h-4" />
                                    Công khai
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPrivacyLevel('MUTUAL_FOLLOW_FRIENDS')}
                                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                                        privacyLevel === 'MUTUAL_FOLLOW_FRIENDS'
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <Users className="w-4 h-4" />
                                    Bạn bè
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPrivacyLevel('SELF_ONLY')}
                                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                                        privacyLevel === 'SELF_ONLY'
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <Lock className="w-4 h-4" />
                                    Chỉ mình tôi
                                </button>
                            </div>
                        </div>

                        {/* Interactive toggles */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!disableComment}
                                    onChange={(e) => setDisableComment(!e.target.checked)}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                Cho phép bình luận
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!disableDuet}
                                    onChange={(e) => setDisableDuet(!e.target.checked)}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                Cho phép Duet
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!disableStitch}
                                    onChange={(e) => setDisableStitch(!e.target.checked)}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                Cho phép Stitch
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={publishing}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing || !isConnected}
                        className="px-5 py-2 rounded-xl text-xs font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                    >
                        {publishing ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Đang tải lên TikTok...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Đăng lên TikTok
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
