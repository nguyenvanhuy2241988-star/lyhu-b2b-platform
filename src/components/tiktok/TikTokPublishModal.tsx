"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    X, Send, CheckCircle, AlertCircle, RefreshCw, Lock, Globe, Users, 
    Sparkles, Plus, Trash2, CheckSquare, Square, Tag, ExternalLink,
    Video, Settings, HelpCircle, Share2, Download
} from 'lucide-react';
import { toast } from 'sonner';

export type SocialPlatform = 'tiktok' | 'facebook' | 'youtube';

export interface UnifiedChannelItem {
    id: string; // open_id, page_id, or channel_id
    platform: SocialPlatform;
    name: string;
    avatar_url?: string;
    brand_tag: string;
    category?: string;
    connected_at?: string;
}

interface TikTokPublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    defaultTitle?: string;
    brandCategory?: string;
}

const BRAND_OPTIONS = [
    { key: 'Tất cả', label: 'Tất cả thương hiệu' },
    { key: 'LYHU', label: 'LYHU Tổng kho' },
    { key: 'BOYO', label: 'BOYO Bánh Ống' },
    { key: 'CVT', label: 'CVT Thực phẩm' },
    { key: 'UHI', label: 'UHI Nước giải khát' },
    { key: 'ABI SNACK', label: 'ABI SNACK Bánh tráng' },
];

export default function TikTokPublishModal({
    isOpen,
    onClose,
    videoUrl,
    defaultTitle = '',
    brandCategory
}: TikTokPublishModalProps) {
    const [title, setTitle] = useState(defaultTitle);
    const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('PUBLIC_TO_EVERYONE');
    const [disableComment, setDisableComment] = useState(false);
    const [disableDuet, setDisableDuet] = useState(false);
    const [disableStitch, setDisableStitch] = useState(false);

    // Channels state
    const [channels, setChannels] = useState<UnifiedChannelItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'tiktok' | 'facebook' | 'youtube'>('all');
    const [loadingChannels, setLoadingChannels] = useState(true);

    // YouTube config modal state
    const [showYtConfigModal, setShowYtConfigModal] = useState(false);
    const [ytClientId, setYtClientId] = useState('');
    const [ytClientSecret, setYtClientSecret] = useState('');
    const [savingYtConfig, setSavingYtConfig] = useState(false);
    const [isYtConfigured, setIsYtConfigured] = useState(false);
    const [sharingToPersonalFb, setSharingToPersonalFb] = useState(false);
    const [showFbPersonalGuide, setShowFbPersonalGuide] = useState(false);

    const [publishing, setPublishing] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [changingBrandId, setChangingBrandId] = useState<string | null>(null);

    // Normalize brandCategory prop (e.g., 'boyo' -> 'BOYO')
    const normalizedCategory = useMemo(() => {
        if (!brandCategory) return null;
        const b = brandCategory.toLowerCase();
        if (b.includes('boyo')) return 'BOYO';
        if (b.includes('cvt')) return 'CVT';
        if (b.includes('uhi')) return 'UHI';
        if (b.includes('abi')) return 'ABI SNACK';
        if (b.includes('lyhu')) return 'LYHU';
        return null;
    }, [brandCategory]);

    // Load all channels across TikTok, Facebook, and YouTube
    const fetchAllChannels = useCallback(async () => {
        setLoadingChannels(true);
        const collected: UnifiedChannelItem[] = [];

        try {
            // 1. TikTok accounts
            try {
                const res = await fetch('/api/tiktok/status');
                const data = await res.json();
                if (data.connected && Array.isArray(data.accounts)) {
                    data.accounts.forEach((a: any) => {
                        collected.push({
                            id: a.open_id,
                            platform: 'tiktok',
                            name: a.display_name,
                            avatar_url: a.avatar_url,
                            brand_tag: a.brand_tag || 'Tất cả',
                            connected_at: a.connected_at
                        });
                    });
                }
            } catch (e) {
                console.warn('Lỗi tải kênh TikTok:', e);
            }

            // 2. Facebook pages
            try {
                const res = await fetch('/api/facebook/pages');
                const data = await res.json();
                if (data.connected && Array.isArray(data.pages)) {
                    data.pages.forEach((p: any) => {
                        collected.push({
                            id: p.page_id,
                            platform: 'facebook',
                            name: p.name,
                            avatar_url: p.avatar_url,
                            brand_tag: p.brand_tag || 'Tất cả',
                            category: p.category
                        });
                    });
                }
            } catch (e) {
                console.warn('Lỗi tải trang Facebook:', e);
            }

            // 3. YouTube channels
            try {
                const res = await fetch('/api/youtube/status');
                const data = await res.json();
                setIsYtConfigured(!!data.isConfigured);
                if (data.connected && Array.isArray(data.accounts)) {
                    data.accounts.forEach((a: any) => {
                        collected.push({
                            id: a.channel_id,
                            platform: 'youtube',
                            name: a.title,
                            avatar_url: a.avatar_url,
                            brand_tag: a.brand_tag || 'Tất cả',
                            connected_at: a.connected_at
                        });
                    });
                }
            } catch (e) {
                console.warn('Lỗi tải kênh YouTube:', e);
            }

            setChannels(collected);

            // Auto-select channels matching brand or tagged 'Tất cả'
            if (normalizedCategory) {
                const matched = collected.filter(
                    c => c.brand_tag === normalizedCategory || c.brand_tag === 'Tất cả'
                );
                if (matched.length > 0) {
                    setSelectedIds(matched.map(m => m.id));
                } else {
                    setSelectedIds(collected.map(c => c.id));
                }
            } else {
                setSelectedIds(collected.map(c => c.id));
            }

        } catch (err) {
            console.error('Failed to load channels', err);
        } finally {
            setLoadingChannels(false);
        }
    }, [normalizedCategory]);

    useEffect(() => {
        if (isOpen) {
            setTitle(defaultTitle);
            fetchAllChannels();
        }
    }, [isOpen, defaultTitle, fetchAllChannels]);

    // Filter channels based on active tab
    const filteredChannels = useMemo(() => {
        if (activeTab === 'all') return channels;
        return channels.filter(c => c.platform === activeTab);
    }, [channels, activeTab]);

    const counts = useMemo(() => ({
        all: channels.length,
        tiktok: channels.filter(c => c.platform === 'tiktok').length,
        facebook: channels.filter(c => c.platform === 'facebook').length,
        youtube: channels.filter(c => c.platform === 'youtube').length,
    }), [channels]);

    const handleToggleChannel = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleSelectAllVisible = () => {
        const visibleIds = filteredChannels.map(c => c.id);
        const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
        if (allVisibleSelected) {
            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleConnectTikTok = () => {
        window.location.href = '/api/tiktok/auth';
    };

    const handleConnectYouTube = () => {
        if (!isYtConfigured) {
            setShowYtConfigModal(true);
        } else {
            window.location.href = '/api/youtube/auth';
        }
    };

    const handleSaveYtConfig = async () => {
        if (!ytClientId || !ytClientSecret) {
            toast.error('Vui lòng nhập cả Client ID và Client Secret từ Google Cloud!');
            return;
        }
        setSavingYtConfig(true);
        try {
            const res = await fetch('/api/youtube/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: ytClientId,
                    client_secret: ytClientSecret
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã lưu cấu hình Google YouTube App!');
                setIsYtConfigured(true);
                setShowYtConfigModal(false);
                // Proceed to auth
                window.location.href = '/api/youtube/auth';
            } else {
                throw new Error(data.error || 'Lỗi lưu cấu hình');
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi lưu cấu hình YouTube');
        } finally {
            setSavingYtConfig(false);
        }
    };

    const handleShareToPersonalFacebook = async () => {
        if (!title.trim()) {
            toast.error('Vui lòng nhập tiêu đề hoặc caption cho video trước!');
            return;
        }

        setSharingToPersonalFb(true);
        try {
            // 1. Tự động sao chép caption & hashtags vào bộ nhớ tạm
            await navigator.clipboard.writeText(title.trim());
            toast.success('📋 Đã copy Caption & Hashtags vào bộ nhớ tạm!');

            // 2. Kích hoạt tải video MP4 trực tiếp về máy tính bằng proxy download attachment
            if (videoUrl) {
                const safeName = 'video_lyhu_fb.mp4';
                const downloadUrl = `/api/media/download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(safeName)}`;
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.setAttribute('download', safeName);
                document.body.appendChild(a);
                a.click();
                setTimeout(() => document.body.removeChild(a), 3000);
            }

            // 3. Mở Facebook trong tab mới
            window.open('https://www.facebook.com/', '_blank');

            // 4. Bật modal hướng dẫn các bước chi tiết
            setShowFbPersonalGuide(true);
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi chuẩn bị đăng video');
        } finally {
            setSharingToPersonalFb(false);
        }
    };

    const handleDisconnectChannel = async (channel: UnifiedChannelItem) => {
        if (!confirm(`Bạn có chắc muốn ngắt kết nối kênh "${channel.name}"?`)) return;

        try {
            if (channel.platform === 'tiktok') {
                await fetch(`/api/tiktok/status?open_id=${encodeURIComponent(channel.id)}`, { method: 'DELETE' });
            } else if (channel.platform === 'youtube') {
                await fetch(`/api/youtube/status?channel_id=${encodeURIComponent(channel.id)}`, { method: 'DELETE' });
            } else {
                toast.info('Trang Facebook được quản lý trong mục Cài đặt Fanpage.');
                return;
            }

            toast.success(`Đã ngắt kết nối kênh ${channel.name}`);
            setChannels(prev => prev.filter(c => c.id !== channel.id));
            setSelectedIds(prev => prev.filter(id => id !== channel.id));
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi ngắt kết nối');
        }
    };

    const handleUpdateBrand = async (channel: UnifiedChannelItem, newBrand: string) => {
        try {
            if (channel.platform === 'tiktok') {
                await fetch('/api/tiktok/status', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ open_id: channel.id, brand_tag: newBrand })
                });
            } else if (channel.platform === 'facebook') {
                await fetch('/api/facebook/pages', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page_id: channel.id, brand_tag: newBrand })
                });
            } else if (channel.platform === 'youtube') {
                await fetch('/api/youtube/status', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channel_id: channel.id, brand_tag: newBrand })
                });
            }

            setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, brand_tag: newBrand } : c));
            setChangingBrandId(null);
            toast.success('Đã cập nhật nhãn thương hiệu cho kênh');
        } catch {
            toast.error('Lỗi khi đổi nhãn thương hiệu');
        }
    };

    const handleGenerateAICaption = async () => {
        setIsGeneratingCaption(true);
        try {
            const res = await fetch('/api/ai/generate-tiktok-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    videoTitle: title || defaultTitle,
                    brandCategory: normalizedCategory || undefined 
                })
            });
            const data = await res.json();
            if (data.caption) {
                // Thêm tag #Shorts & #Reels nếu chưa có
                let cap = data.caption;
                if (!cap.includes('#Shorts')) cap += ' #Shorts';
                if (!cap.includes('#Reels')) cap += ' #Reels';
                setTitle(cap);
                toast.success('✨ AI đã sáng tạo caption & hashtag đa nền tảng (TikTok • Reels • Shorts)!');
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
        if (selectedIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 kênh để phát sóng!');
            return;
        }

        if (!title.trim()) {
            toast.error('Vui lòng nhập tiêu đề hoặc caption cho video!');
            return;
        }

        if (!videoUrl) {
            toast.error('Không tìm thấy file video!');
            return;
        }

        const selectedChannels = channels.filter(c => selectedIds.includes(c.id));
        const tiktokOpenIds = selectedChannels.filter(c => c.platform === 'tiktok').map(c => c.id);
        const facebookPageIds = selectedChannels.filter(c => c.platform === 'facebook').map(c => c.id);
        const youtubeChannelIds = selectedChannels.filter(c => c.platform === 'youtube').map(c => c.id);

        setPublishing(true);
        try {
            const res = await fetch('/api/social/publish-omni', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    videoUrl,
                    privacyLevel,
                    disableComment,
                    disableDuet,
                    disableStitch,
                    tiktokOpenIds,
                    facebookPageIds,
                    youtubeChannelIds
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Phát sóng video thất bại');
            }

            toast.success(data.message || `Đã phát sóng thành công lên ${data.successCount}/${data.total} kênh!`);
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Lỗi khi phát sóng video');
        } finally {
            setPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 via-gray-900 to-black text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center p-2">
                            <Video className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base leading-tight">Phát sóng Đa Nền tảng (Omni-Channel)</h3>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white border border-white/20 font-bold">TikTok</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">Facebook</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">YouTube</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400">Đăng 1 chạm lên TikTok • Facebook Reels • YouTube Shorts</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content body */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    
                    {/* Platform tabs & Channel section */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                        
                        {/* Tab header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'all'
                                            ? 'bg-black text-white shadow-xs'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    Tất cả ({counts.all})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('tiktok')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                        activeTab === 'tiktok'
                                            ? 'bg-black text-white shadow-xs'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    <span>🎵 TikTok</span> ({counts.tiktok})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('facebook')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                        activeTab === 'facebook'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                                    }`}
                                >
                                    <span>🔵 Facebook</span> ({counts.facebook})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('youtube')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                        activeTab === 'youtube'
                                            ? 'bg-red-600 text-white shadow-xs'
                                            : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
                                    }`}
                                >
                                    <span>🔴 YouTube</span> ({counts.youtube})
                                </button>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                {filteredChannels.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAllVisible}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                        Chọn/Bỏ tab này
                                    </button>
                                )}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleConnectTikTok}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-black text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors"
                                        title="Liên kết thêm kênh TikTok"
                                    >
                                        <Plus className="w-3 h-3" /> TikTok
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConnectYouTube}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition-colors"
                                        title="Liên kết thêm kênh YouTube Shorts"
                                    >
                                        <Plus className="w-3 h-3" /> YouTube
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status bar */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div>
                                Đang chọn: <span className="font-bold text-gray-900">{selectedIds.length}</span> / {channels.length} kênh
                                {normalizedCategory && (
                                    <span className="ml-2 text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                        Khuyên dùng cho: {normalizedCategory}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                                Phát đồng thời tới các nền tảng
                            </span>
                        </div>

                        {/* Channel items list */}
                        {loadingChannels ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                Đang tải danh sách mạng xã hội...
                            </div>
                        ) : filteredChannels.length === 0 ? (
                            <div className="p-4 rounded-lg bg-gray-100 text-center space-y-1">
                                <p className="text-xs font-semibold text-gray-700">Chưa có kênh nào trong mục này</p>
                                <p className="text-[11px] text-gray-500">Bấm nút thêm kênh ở góc trên để liên kết tài khoản.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {(activeTab === 'all' || activeTab === 'facebook') && (
                                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                                f
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-blue-950">
                                                        Facebook Cá Nhân (Trang của bạn)
                                                    </span>
                                                    <span className="text-[10px] font-semibold bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">
                                                        1 Chạm
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-blue-700">Tải file video MP4 gốc + Copy caption + Mở Facebook để dán và đăng</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleShareToPersonalFacebook}
                                            disabled={sharingToPersonalFb}
                                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                                            title="Tải video MP4 về máy, sao chép caption và mở Facebook"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            {sharingToPersonalFb ? 'Đang chuẩn bị...' : 'Tải & Đăng lên FB'}
                                        </button>
                                    </div>
                                )}

                                {filteredChannels.map(channel => {
                                    const isSelected = selectedIds.includes(channel.id);
                                    const isEditingBrand = changingBrandId === channel.id;

                                    return (
                                        <div 
                                            key={`${channel.platform}_${channel.id}`}
                                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                                isSelected 
                                                    ? 'bg-white border-black/30 shadow-xs' 
                                                    : 'bg-white/60 border-gray-200 opacity-60'
                                            }`}
                                        >
                                            <div 
                                                className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                                                onClick={() => handleToggleChannel(channel.id)}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-black shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                                )}

                                                {/* Platform icon badge on avatar */}
                                                <div className="relative shrink-0">
                                                    {channel.avatar_url ? (
                                                        <img 
                                                            src={channel.avatar_url} 
                                                            alt={channel.name} 
                                                            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                                                            {channel.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-black shadow-xs ${
                                                        channel.platform === 'tiktok' ? 'bg-black' :
                                                        channel.platform === 'facebook' ? 'bg-blue-600' : 'bg-red-600'
                                                    }`}>
                                                        {channel.platform === 'tiktok' ? 'TT' : channel.platform === 'facebook' ? 'f' : 'YT'}
                                                    </span>
                                                </div>

                                                <div className="truncate">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-gray-900 truncate">
                                                            {channel.name}
                                                        </span>
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 capitalize">
                                                        {channel.platform === 'facebook' ? 'Fanpage Facebook' :
                                                         channel.platform === 'tiktok' ? 'Kênh TikTok' : 'Kênh YouTube Shorts'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Brand tag badge & Controls */}
                                            <div className="flex items-center gap-1.5 ml-2">
                                                {isEditingBrand ? (
                                                    <select
                                                        autoFocus
                                                        value={channel.brand_tag || 'Tất cả'}
                                                        onChange={(e) => handleUpdateBrand(channel, e.target.value)}
                                                        onBlur={() => setChangingBrandId(null)}
                                                        className="text-[11px] py-0.5 px-2 rounded border border-black bg-white"
                                                    >
                                                        {BRAND_OPTIONS.map(b => (
                                                            <option key={b.key} value={b.key}>{b.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setChangingBrandId(channel.id)}
                                                        title="Gán nhãn thương hiệu cho kênh này"
                                                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Tag className="w-2.5 h-2.5 text-gray-500" />
                                                        {channel.brand_tag || 'Tất cả'}
                                                    </button>
                                                )}

                                                {channel.platform !== 'facebook' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDisconnectChannel(channel)}
                                                        title="Hủy liên kết kênh này"
                                                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Form caption */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-gray-800">
                                    Tiêu đề & Nội dung đăng (Caption & Hashtags) <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateAICaption}
                                    disabled={isGeneratingCaption}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg transition-colors border border-amber-300 shadow-xs"
                                >
                                    <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                                    {isGeneratingCaption ? 'AI đang viết...' : '✨ AI viết Caption & Hashtag Đa Kênh'}
                                </button>
                            </div>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                rows={4}
                                placeholder="Nhập tiêu đề hoặc caption kèm hashtag..."
                                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all resize-none font-sans"
                            />
                        </div>

                        {/* Privacy Level */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Chế độ hiển thị video
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
                                    Công khai (Tất cả)
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
                                    Bạn bè / Người theo dõi
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
                                    Chỉ mình tôi (Kiểm thử)
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
                                Cho phép Duet / Remix
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleShareToPersonalFacebook}
                            disabled={sharingToPersonalFb}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 shadow-xs"
                            title="Sao chép caption, tải video và mở trình tạo Reel trên Facebook cá nhân"
                        >
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">f</span>
                            {sharingToPersonalFb ? 'Đang chuẩn bị...' : '1 Chạm Đăng FB Cá Nhân'}
                        </button>
                        <span className="text-xs text-gray-500 hidden sm:inline">
                            (Đã chọn <strong className="text-gray-900">{selectedIds.length}</strong> kênh phát sóng)
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={publishing}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={publishing || selectedIds.length === 0}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                        >
                            {publishing ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                    Đang phát sóng lên các mạng xã hội...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    {selectedIds.length > 1 
                                        ? `Phát sóng lên ${selectedIds.length} kênh (TikTok • FB • YouTube)` 
                                        : 'Phát sóng video'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal cấu hình Google YouTube App */}
            {showYtConfigModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                                    YT
                                </div>
                                <h4 className="font-bold text-sm">Cấu hình YouTube Data API</h4>
                            </div>
                            <button onClick={() => setShowYtConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-600">
                            Nhập <strong>Client ID</strong> và <strong>Client Secret</strong> từ Google Cloud Console (OAuth 2.0 Web Application) để liên kết kênh YouTube Shorts:
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Google Client ID
                                </label>
                                <input
                                    type="text"
                                    value={ytClientId}
                                    onChange={(e) => setYtClientId(e.target.value)}
                                    placeholder="xxx.apps.googleusercontent.com"
                                    className="w-full text-xs p-2.5 border rounded-lg outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Google Client Secret
                                </label>
                                <input
                                    type="password"
                                    value={ytClientSecret}
                                    onChange={(e) => setYtClientSecret(e.target.value)}
                                    placeholder="GOCSPX-..."
                                    className="w-full text-xs p-2.5 border rounded-lg outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="p-2.5 rounded-lg bg-gray-50 border text-[11px] text-gray-500 space-y-1">
                                <p className="font-semibold text-gray-700">Redirect URI cần thêm trên Google Cloud:</p>
                                <code className="block bg-white p-1 rounded border text-[10px] break-all">
                                    https://www.lyhu.com.vn/api/youtube/callback
                                </code>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t">
                            <button
                                onClick={() => setShowYtConfigModal(false)}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveYtConfig}
                                disabled={savingYtConfig}
                                className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5"
                            >
                                {savingYtConfig && <RefreshCw className="w-3 h-3 animate-spin" />}
                                Lưu & Xác thực YouTube
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal hướng dẫn đăng video gốc lên Facebook Cá Nhân */}
            {showFbPersonalGuide && (
                <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                    f
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">Đăng Video Lên Facebook Cá Nhân</h4>
                                    <p className="text-[11px] text-emerald-600 font-semibold">✓ Đã copy Caption & đang tải video MP4</p>
                                </div>
                            </div>
                            <button onClick={() => setShowFbPersonalGuide(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-gray-700">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                                <div>
                                    <strong className="text-gray-900">File video MP4</strong> đang được tự động tải về máy của bạn (kiểm tra thư mục <em>Downloads</em>).
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                                <div>
                                    Trên tab Facebook vừa mở, bấm vào nút <strong>"Ảnh/video"</strong> (nút màu xanh lá trong ô tạo bài viết) và chọn file video vừa tải.
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                                <div>
                                    Nhấn <strong>Ctrl + V</strong> để dán Caption & Hashtags đã được copy sẵn, sau đó bấm <strong>Đăng</strong>!
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-500 italic bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                            💡 <strong>Mẹo:</strong> Video đăng theo cách này sẽ hiển thị dưới dạng <strong>Video Native / Reel</strong> chuẩn 100%, có nút xem video, tự động phát và tiếp cận tối đa bạn bè!
                        </p>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setShowFbPersonalGuide(false)}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            >
                                Đã hiểu & Sang Facebook đăng bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
