"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    X, Send, CheckCircle, AlertCircle, RefreshCw, Lock, Globe, Users, 
    Sparkles, Plus, Trash2, CheckSquare, Square, Tag, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

interface TikTokAccountItem {
    open_id: string;
    union_id?: string;
    display_name: string;
    avatar_url?: string;
    brand_tag?: string;
    connected_at?: string;
    expires_at?: number;
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
    const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('SELF_ONLY');
    const [disableComment, setDisableComment] = useState(false);
    const [disableDuet, setDisableDuet] = useState(false);
    const [disableStitch, setDisableStitch] = useState(false);

    const [accounts, setAccounts] = useState<TikTokAccountItem[]>([]);
    const [selectedOpenIds, setSelectedOpenIds] = useState<string[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [changingBrandOpenId, setChangingBrandOpenId] = useState<string | null>(null);

    // Map brandCategory prop to readable brand tag
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

    const fetchAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const res = await fetch('/api/tiktok/status');
            const data = await res.json();
            if (data.connected && Array.isArray(data.accounts) && data.accounts.length > 0) {
                setAccounts(data.accounts);
                
                // Tự động tích chọn kênh phù hợp với thương hiệu video
                if (normalizedCategory) {
                    const matched = data.accounts.filter(
                        (a: TikTokAccountItem) => 
                            (a.brand_tag || 'Tất cả') === normalizedCategory || 
                            (a.brand_tag || 'Tất cả') === 'Tất cả'
                    );
                    if (matched.length > 0) {
                        setSelectedOpenIds(matched.map((m: TikTokAccountItem) => m.open_id));
                    } else {
                        setSelectedOpenIds(data.accounts.map((a: TikTokAccountItem) => a.open_id));
                    }
                } else {
                    setSelectedOpenIds(data.accounts.map((a: TikTokAccountItem) => a.open_id));
                }
            } else {
                setAccounts([]);
                setSelectedOpenIds([]);
            }
        } catch (err) {
            console.error('Failed to load TikTok accounts', err);
            setAccounts([]);
        } finally {
            setLoadingAccounts(false);
        }
    }, [normalizedCategory]);

    useEffect(() => {
        if (isOpen) {
            setTitle(defaultTitle);
            fetchAccounts();
        }
    }, [isOpen, defaultTitle, fetchAccounts]);

    const handleConnectMore = () => {
        window.location.href = '/api/tiktok/auth';
    };

    const handleToggleAccount = (openId: string) => {
        setSelectedOpenIds(prev => 
            prev.includes(openId) 
                ? prev.filter(id => id !== openId) 
                : [...prev, openId]
        );
    };

    const handleSelectAll = () => {
        if (selectedOpenIds.length === accounts.length) {
            setSelectedOpenIds([]);
        } else {
            setSelectedOpenIds(accounts.map(a => a.open_id));
        }
    };

    const handleDisconnectAccount = async (openId: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn ngắt kết nối kênh "${name}"?`)) return;

        try {
            const res = await fetch(`/api/tiktok/status?open_id=${encodeURIComponent(openId)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Đã ngắt kết nối kênh ${name}`);
                setAccounts(prev => prev.filter(a => a.open_id !== openId));
                setSelectedOpenIds(prev => prev.filter(id => id !== openId));
            } else {
                throw new Error(data.error || 'Lỗi khi ngắt kết nối');
            }
        } catch (err: any) {
            toast.error(err.message || 'Không thể ngắt kết nối');
        }
    };

    const handleUpdateBrand = async (openId: string, newBrand: string) => {
        try {
            const res = await fetch('/api/tiktok/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ open_id: openId, brand_tag: newBrand })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã gán thương hiệu cho kênh');
                setAccounts(prev => prev.map(a => a.open_id === openId ? { ...a, brand_tag: newBrand } : a));
                setChangingBrandOpenId(null);
            }
        } catch (err: any) {
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
                setTitle(data.caption);
                toast.success('✨ AI đã sáng tạo caption & hashtag chuẩn viral!');
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
        if (selectedOpenIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 kênh TikTok để đăng!');
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
                    disableStitch,
                    targetOpenIds: selectedOpenIds
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Đăng video thất bại');
            }

            toast.success(data.message || `Đã gửi đăng thành công lên ${data.successCount || selectedOpenIds.length} kênh!`);
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
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-base leading-tight">Đăng video đa kênh TikTok</h3>
                            <p className="text-xs text-gray-400">Đăng 1 chạm lên nhiều kênh TikTok cùng lúc</p>
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
                    
                    {/* Multi-channel selector section */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                                    Kênh đăng ({selectedOpenIds.length}/{accounts.length})
                                </span>
                                {normalizedCategory && (
                                    <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                        Video: {normalizedCategory}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {accounts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        {selectedOpenIds.length === accounts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleConnectMore}
                                    className="inline-flex items-center gap-1 text-xs font-medium bg-black text-white px-2.5 py-1 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm kênh
                                </button>
                            </div>
                        </div>

                        {loadingAccounts ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Đang tải danh sách kênh TikTok...
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-center space-y-2">
                                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                                <p className="text-xs font-medium text-amber-900">Chưa có kênh TikTok nào được liên kết!</p>
                                <p className="text-[11px] text-amber-700">Hãy bấm nút kết nối để ủy quyền đăng video tự động.</p>
                                <button
                                    type="button"
                                    onClick={handleConnectMore}
                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Kết nối kênh TikTok ngay
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {accounts.map(account => {
                                    const isSelected = selectedOpenIds.includes(account.open_id);
                                    const isEditingBrand = changingBrandOpenId === account.open_id;

                                    return (
                                        <div 
                                            key={account.open_id}
                                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                                                isSelected 
                                                    ? 'bg-white border-black/30 shadow-xs' 
                                                    : 'bg-white/50 border-gray-200 opacity-60'
                                            }`}
                                        >
                                            <div 
                                                className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                                                onClick={() => handleToggleAccount(account.open_id)}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-black shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                                )}

                                                {account.avatar_url ? (
                                                    <img 
                                                        src={account.avatar_url} 
                                                        alt={account.display_name} 
                                                        className="w-8 h-8 rounded-full border border-gray-200 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                                                        TT
                                                    </div>
                                                )}

                                                <div className="truncate">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-gray-900 truncate">
                                                            {account.display_name}
                                                        </span>
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500">Đã liên kết</p>
                                                </div>
                                            </div>

                                            {/* Brand tag badge & Disconnect */}
                                            <div className="flex items-center gap-1.5 ml-2">
                                                {isEditingBrand ? (
                                                    <select
                                                        autoFocus
                                                        value={account.brand_tag || 'Tất cả'}
                                                        onChange={(e) => handleUpdateBrand(account.open_id, e.target.value)}
                                                        onBlur={() => setChangingBrandOpenId(null)}
                                                        className="text-[11px] py-0.5 px-2 rounded border border-black bg-white"
                                                    >
                                                        {BRAND_OPTIONS.map(b => (
                                                            <option key={b.key} value={b.key}>{b.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setChangingBrandOpenId(account.open_id)}
                                                        title="Bấm để đổi thương hiệu gán cho kênh"
                                                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Tag className="w-2.5 h-2.5 text-gray-500" />
                                                        {account.brand_tag || 'Tất cả'}
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleDisconnectAccount(account.open_id, account.display_name)}
                                                    title="Hủy liên kết kênh này"
                                                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
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
                                <label className="block text-xs font-medium text-gray-700">
                                    Tiêu đề & Hashtags (Caption) <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateAICaption}
                                    disabled={isGeneratingCaption}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors border border-amber-200 shadow-xs"
                                >
                                    <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                                    {isGeneratingCaption ? 'AI đang viết...' : '✨ AI viết Caption & Hashtag'}
                                </button>
                            </div>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                rows={4}
                                placeholder="Nhập caption cho video hoặc bấm 'AI viết Caption & Hashtag'..."
                                className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Privacy Level */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Quyền riêng tư của video
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
                                    Chỉ mình tôi (Test)
                                </button>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500 italic">
                                * Lưu ý: Trong lúc app TikTok đang duyệt kiểm duyệt chính thức, TikTok yêu cầu đăng ở chế độ riêng tư (Chỉ mình tôi). Khi app được duyệt xong, bạn có thể chọn Công khai hoàn toàn.
                            </p>
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                    <span className="text-xs text-gray-500">
                        {selectedOpenIds.length > 0 
                            ? `Đang chọn ${selectedOpenIds.length} kênh` 
                            : 'Chưa chọn kênh'}
                    </span>
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
                            disabled={publishing || selectedOpenIds.length === 0}
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                        >
                            {publishing ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Đang phát sóng lên TikTok...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    {selectedOpenIds.length > 1 
                                        ? `Đăng lên ${selectedOpenIds.length} kênh TikTok` 
                                        : 'Đăng lên TikTok'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
