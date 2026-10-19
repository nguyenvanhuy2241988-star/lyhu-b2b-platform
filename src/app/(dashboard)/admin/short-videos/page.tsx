"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Upload, Trash2, Edit, Plus, Video, CheckCircle, XCircle, Share2, Copy, X, 
    Download, Eye, Link2, Search, ArrowUpDown, Sparkles, LayoutGrid, LayoutList, 
    Check, Save, RefreshCw, Play, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabaseClient';
import TikTokPublishModal from '@/components/tiktok/TikTokPublishModal';

const supabase = getSupabase();

interface ShortVideo {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string | null;
    caption?: string | null;
    category?: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

const CATEGORIES: { key: string; label: string }[] = [
    { key: 'lyhu', label: 'LYHU' },
    { key: 'cvt', label: 'CVT' },
    { key: 'uhi', label: 'UHI' },
    { key: 'abi', label: 'ABI SNACK' },
    { key: 'boyo', label: 'BOYO' },
    { key: 'tin-tuc', label: 'Tin tức LYHU' },
];

const copyText = async (text: string, okMsg: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(okMsg);
    } catch {
        toast.error('Không sao chép được, hãy bôi đen và copy thủ công.');
    }
};

export default function ShortVideosAdmin() {
    const [videos, setVideos] = useState<ShortVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [tikTokTarget, setTikTokTarget] = useState<{ url: string; title: string; category?: string } | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'order' | 'title'>('newest');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [savedCatId, setSavedCatId] = useState<string | null>(null);

    // Modal state for preview & edit
    const [preview, setPreview] = useState<ShortVideo | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalCategory, setModalCategory] = useState('lyhu');
    const [modalCaption, setModalCaption] = useState('');
    const [isSavingModal, setIsSavingModal] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    useEffect(() => {
        if (preview) {
            setModalTitle(preview.title || '');
            setModalCategory(preview.category || 'lyhu');
            setModalCaption(preview.caption || '');
        }
    }, [preview]);

    const handleSaveModal = async () => {
        if (!preview) return;
        setIsSavingModal(true);
        try {
            const { error } = await supabase
                .from('wholesale_short_videos')
                .update({ 
                    title: modalTitle.trim(),
                    category: modalCategory,
                    caption: modalCaption.trim()
                })
                .eq('id', preview.id);
            if (error) throw error;

            setVideos(vs => vs.map(v => v.id === preview.id ? { 
                ...v, 
                title: modalTitle.trim(), 
                category: modalCategory, 
                caption: modalCaption.trim() 
            } : v));

            setPreview(prev => prev ? { 
                ...prev, 
                title: modalTitle.trim(), 
                category: modalCategory, 
                caption: modalCaption.trim() 
            } : null);

            toast.success('Đã lưu tất cả thay đổi thành công!');
        } catch (e: any) {
            toast.error('Lỗi khi lưu: ' + e.message);
        } finally {
            setIsSavingModal(false);
        }
    };

    const handleGenerateAICaption = async () => {
        if (!preview) return;
        setIsGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/generate-tiktok-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoTitle: modalTitle || preview.title,
                    brandCategory: modalCategory || preview.category || 'LYHU'
                })
            });
            const data = await res.json();
            if (data.caption) {
                let cap = data.caption;
                if (!cap.includes('#Shorts')) cap += ' #Shorts';
                if (!cap.includes('#Reels')) cap += ' #Reels';
                setModalCaption(cap);
                toast.success('✨ AI đã sáng tạo Caption & Hashtags thành công!');
            } else {
                throw new Error(data.error || 'Không tạo được caption');
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi gọi AI');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const fetchVideos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wholesale_short_videos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(error);
        } else if (data) {
            setVideos(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVideos();

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const connected = params.get('tiktok_connected');
            const error = params.get('error');

            if (connected === 'true') {
                toast.success('Kết nối kênh TikTok thành công! Giờ bạn có thể đăng video.');
                window.history.replaceState({}, '', '/admin/short-videos');
            } else if (error) {
                toast.error('Lỗi kết nối TikTok: ' + decodeURIComponent(error));
                window.history.replaceState({}, '', '/admin/short-videos');
            }
        }
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 20MB
        if (file.size > 20 * 1024 * 1024) {
            toast.error("Video quá lớn. Vui lòng chọn video dưới 20MB.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const fileName = `video_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('short_videos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // If bucket doesn't exist, try media bucket as fallback
                console.log("Failed to upload to short_videos bucket, trying media bucket...", uploadError);
                const { data: fallbackData, error: fallbackError } = await supabase.storage
                    .from('media')
                    .upload(`short-videos/${fileName}`, file);
                    
                if (fallbackError) throw fallbackError;
                
                const { data: urlData } = supabase.storage.from('media').getPublicUrl(`short-videos/${fileName}`);
                await createVideoRecord(file.name, urlData.publicUrl);
            } else {
                const { data: urlData } = supabase.storage.from('short_videos').getPublicUrl(fileName);
                await createVideoRecord(file.name, urlData.publicUrl);
            }

            toast.success("Tải video lên thành công!");
            fetchVideos();
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Lỗi tải video: " + error.message);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const createVideoRecord = async (title: string, video_url: string) => {
        const defaultCategory = filter !== 'all' ? filter : 'lyhu';
        const { error } = await supabase
            .from('wholesale_short_videos')
            .insert({
                title: title.split('.')[0],
                video_url,
                category: defaultCategory,
                sort_order: 0,
                is_active: true
            });
            
        if (error) throw error;
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('wholesale_short_videos')
            .update({ is_active: !currentStatus })
            .eq('id', id);
            
        if (!error) {
            setVideos(videos.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
            toast.success("Đã cập nhật trạng thái");
        }
    };

    const deleteVideo = async (id: string, video_url: string) => {
        if (!confirm("Bạn có chắc muốn xóa video này?")) return;
        
        // Try to delete from storage if possible
        try {
            const urlObj = new URL(video_url);
            const pathParts = urlObj.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            
            if (video_url.includes('short_videos')) {
                await supabase.storage.from('short_videos').remove([fileName]);
            } else if (video_url.includes('media')) {
                await supabase.storage.from('media').remove([`short-videos/${fileName}`]);
            }
        } catch (e) {
            console.warn("Could not delete physical file", e);
        }

        const { error } = await supabase
            .from('wholesale_short_videos')
            .delete()
            .eq('id', id);
            
        if (!error) {
            setVideos(videos.filter(v => v.id !== id));
            toast.success("Đã xóa video");
        }
    };

    const updateSortOrder = async (id: string, newOrder: number) => {
        const { error } = await supabase
            .from('wholesale_short_videos')
            .update({ sort_order: newOrder })
            .eq('id', id);
            
        if (!error) {
            fetchVideos();
            toast.success("Đã cập nhật thứ tự");
        }
    };

    const updateCategory = async (id: string, category: string) => {
        const { error } = await supabase
            .from('wholesale_short_videos')
            .update({ category })
            .eq('id', id);
        if (!error) {
            setVideos(vs => vs.map(v => (v.id === id ? { ...v, category } : v)));
            setSavedCatId(id);
            setTimeout(() => setSavedCatId(null), 3000);
            const label = CATEGORIES.find(c => c.key === category)?.label || category;
            toast.success(`✓ Đã lưu: chuyển video sang "${label}"`);
        } else {
            toast.error('Không cập nhật được phân loại: ' + error.message);
        }
    };

    const countOf = (k: string) => (k === 'all' ? videos.length : videos.filter(v => (v.category || 'lyhu') === k).length);

    // Filter & Sort list
    const filteredAndSortedVideos = useMemo(() => {
        let list = [...videos];

        // 1. Filter by category
        if (filter !== 'all') {
            list = list.filter(v => (v.category || 'lyhu') === filter);
        }

        // 2. Filter by status
        if (statusFilter === 'active') {
            list = list.filter(v => v.is_active);
        } else if (statusFilter === 'inactive') {
            list = list.filter(v => !v.is_active);
        }

        // 3. Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(v => 
                (v.title || '').toLowerCase().includes(q) ||
                (v.caption || '').toLowerCase().includes(q) ||
                (v.video_url || '').toLowerCase().includes(q)
            );
        }

        // 4. Sort
        list.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
            if (sortBy === 'oldest') {
                return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            }
            if (sortBy === 'order') {
                return (a.sort_order ?? 0) - (b.sort_order ?? 0);
            }
            if (sortBy === 'title') {
                return (a.title || '').localeCompare(b.title || '');
            }
            return 0;
        });

        return list;
    }, [videos, filter, searchQuery, sortBy, statusFilter]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span>Quản lý Short Videos</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00ABA9]/10 text-[#00ABA9] border border-[#00ABA9]/20">
                            {videos.length} video
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Video ngắn hiển thị trên Trang chủ, Trang đại lý B2B & Phát sóng đa kênh (TikTok, Reels, Shorts).
                    </p>
                </div>
                <div>
                    <label className="bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-primary-700 cursor-pointer flex items-center gap-2 transition-all shadow-sm active:scale-95">
                        {isUploading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Đang tải lên ({uploadProgress}%)...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                <span>Tải video mới (Max 20MB)</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            accept="video/mp4,video/quicktime,video/webm" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            {/* Brand Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
                {[{ key: 'all', label: 'Tất cả' }, ...CATEGORIES].map(c => {
                    const isActive = filter === c.key;
                    const count = countOf(c.key);
                    return (
                        <button
                            key={c.key}
                            onClick={() => setFilter(c.key)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                isActive 
                                    ? 'bg-[#00ABA9] border-[#00ABA9] text-white shadow-xs' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#00ABA9] hover:text-[#00ABA9]'
                            }`}
                        >
                            <span>{c.label}</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[260px] max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm video theo tiêu đề, caption, tên file..."
                        className="w-full text-xs pl-9 pr-8 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00ABA9]/20 focus:border-[#00ABA9] transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Controls (Sort, Status, View mode) */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Sort selector */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-500 hidden sm:inline">Sắp xếp:</span>
                        <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="bg-transparent font-semibold text-gray-800 outline-none cursor-pointer"
                        >
                            <option value="newest">Mới nhất trước (Mặc định)</option>
                            <option value="oldest">Cũ nhất trước</option>
                            <option value="order">Theo thứ tự hiển thị</option>
                            <option value="title">Tên video (A-Z)</option>
                        </select>
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
                        <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className="bg-transparent font-semibold text-gray-800 outline-none cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Chỉ video đang bật</option>
                            <option value="inactive">Chỉ video đang tắt</option>
                        </select>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-0.5">
                        <button
                            onClick={() => setViewMode('table')}
                            title="Xem dạng bảng"
                            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                                viewMode === 'table' ? 'bg-white text-[#00ABA9] shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <LayoutList className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Bảng</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Xem dạng lưới video 9:16"
                            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                                viewMode === 'grid' ? 'bg-white text-[#00ABA9] shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Lưới</span>
                        </button>
                    </div>

                    {/* Counter */}
                    <span className="text-xs text-gray-400 pl-1">
                        (Hiển thị {filteredAndSortedVideos.length}/{videos.length})
                    </span>
                </div>
            </div>

            {/* Content List: Table or Grid View */}
            {viewMode === 'table' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Video</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tiêu đề & Thương hiệu</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center w-28">Thứ tự</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center w-28">Trạng thái</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right min-w-[460px]">Thao tác nhanh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải danh sách video...</td></tr>
                            ) : filteredAndSortedVideos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-gray-500">
                                        Không tìm thấy video nào phù hợp với bộ lọc / từ khóa.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedVideos.map(video => (
                                    <tr key={video.id} className="hover:bg-gray-50/80 transition-colors">
                                        {/* Video preview thumbnail */}
                                        <td className="px-5 py-4">
                                            <div 
                                                onClick={() => setPreview(video)} 
                                                title="Bấm để xem video & sửa thông tin" 
                                                className="w-16 h-24 bg-gray-900 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative cursor-pointer group shadow-2xs"
                                            >
                                                <video src={video.video_url} poster={video.thumbnail_url || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform" muted />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                                    <Play className="w-5 h-5 text-white fill-white drop-shadow" />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Title, Brand Selector & Caption */}
                                        <td className="px-5 py-4">
                                            <div 
                                                onClick={() => setPreview(video)} 
                                                className="font-bold text-gray-900 text-sm line-clamp-2 cursor-pointer hover:text-[#00ABA9] transition-colors"
                                            >
                                                {video.title}
                                            </div>
                                            
                                            {/* Caption preview */}
                                            {video.caption ? (
                                                <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-[420px] bg-gray-50 p-1.5 rounded border border-gray-100" title={video.caption}>
                                                    <span className="font-semibold text-gray-700">Caption: </span>{video.caption}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-amber-600/90 italic mt-0.5">
                                                    (Chưa có caption - Bấm nút "Xem/Sửa" để thêm hoặc dùng AI tạo)
                                                </div>
                                            )}

                                            {/* Brand Category Dropdown with Auto-Save Indicator */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-gray-500 font-medium">Thương hiệu:</span>
                                                    <select
                                                        value={video.category || 'lyhu'}
                                                        onChange={(e) => updateCategory(video.id, e.target.value)}
                                                        className="text-xs border border-gray-300 rounded-lg px-2.5 py-1 bg-white text-gray-800 font-semibold outline-none focus:ring-2 focus:ring-[#00ABA9]/20 focus:border-[#00ABA9] shadow-2xs"
                                                        title="Chọn thương hiệu (hệ thống sẽ tự động lưu ngay lập tức)"
                                                    >
                                                        {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                                    </select>
                                                </div>

                                                {/* Visual Save Feedback */}
                                                {savedCatId === video.id ? (
                                                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-in fade-in flex items-center gap-1 shadow-2xs">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        Đã lưu
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">
                                                        (Tự động lưu khi chọn)
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-[11px] text-gray-400 mt-1 truncate max-w-[200px]" title={video.video_url}>
                                                {video.video_url.split('/').pop()}
                                            </div>
                                        </td>

                                        {/* Sort order */}
                                        <td className="px-4 py-4 text-center">
                                            <input 
                                                type="number" 
                                                defaultValue={video.sort_order}
                                                onBlur={(e) => updateSortOrder(video.id, parseInt(e.target.value) || 0)}
                                                className="w-16 p-1 text-center text-xs font-semibold border rounded-lg"
                                            />
                                        </td>

                                        {/* Status toggle */}
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => toggleActive(video.id, video.is_active)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                    video.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {video.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                {video.is_active ? 'Đang bật' : 'Đang tắt'}
                                            </button>
                                        </td>

                                        {/* All External Action Buttons */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end flex-wrap gap-2">
                                                {/* 1. Tải video MP4 */}
                                                <a 
                                                    href={`/api/media/download?url=${encodeURIComponent(video.video_url)}&filename=${encodeURIComponent((video.title || 'video_lyhu') + '.mp4')}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
                                                    title="Tải video MP4 chất lượng gốc về máy (để đăng Facebook cá nhân, Zalo...)"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Tải video
                                                </a>

                                                {/* 2. Sao chép caption */}
                                                <button
                                                    onClick={() => copyText(video.caption || video.title || '', video.caption ? 'Đã sao chép caption' : 'Video chưa có caption, đã sao chép tiêu đề!')}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00ABA9] text-white hover:bg-[#008f8d] transition-all shadow-xs"
                                                    title={video.caption ? 'Sao chép caption bài đăng' : 'Chưa có caption - Bấm để sao chép tiêu đề'}
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                    Sao chép caption
                                                </button>

                                                {/* 3. Sao chép link video */}
                                                <button
                                                    onClick={() => copyText(video.video_url, 'Đã sao chép liên kết video')}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-[#00ABA9] transition-all shadow-xs"
                                                    title="Sao chép link video"
                                                >
                                                    <Link2 className="w-3.5 h-3.5 text-gray-400" />
                                                    Sao chép link
                                                </button>

                                                {/* 4. Phát sóng MXH */}
                                                <button 
                                                    onClick={() => setTikTokTarget({ url: video.video_url, title: video.caption || video.title, category: video.category || undefined })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black text-white hover:bg-gray-800 transition-all shadow-sm"
                                                    title="Phát sóng lên TikTok, Facebook Reels, YouTube Shorts"
                                                >
                                                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                                                    Phát sóng MXH
                                                </button>

                                                {/* 5. Xem trước & Sửa */}
                                                <button
                                                    onClick={() => setPreview(video)}
                                                    className="p-1.5 text-gray-600 hover:text-[#00ABA9] hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                                                    title="Xem trước video & sửa Tiêu đề, Caption, Thương hiệu"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* 6. Xóa video */}
                                                <button 
                                                    onClick={() => deleteVideo(video.id, video.video_url)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa video"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Grid View (TikTok Cards) */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-gray-500">Đang tải danh sách video...</div>
                    ) : filteredAndSortedVideos.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">Không tìm thấy video nào.</div>
                    ) : (
                        filteredAndSortedVideos.map(video => (
                            <div key={video.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
                                {/* Video Thumbnail / Player */}
                                <div 
                                    onClick={() => setPreview(video)}
                                    className="relative aspect-[9/16] bg-black cursor-pointer overflow-hidden"
                                >
                                    <video 
                                        src={video.video_url} 
                                        poster={video.thumbnail_url || undefined}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        muted
                                        loop
                                        playsInline
                                        onMouseEnter={(e) => e.currentTarget.play()}
                                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                    {/* Brand Badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-md border border-white/20">
                                            {CATEGORIES.find(c => c.key === (video.category || 'lyhu'))?.label}
                                        </span>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${video.is_active ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-gray-400'}`} />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                        <Play className="w-8 h-8 text-white fill-white" />
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                                    <div>
                                        <h4 
                                            onClick={() => setPreview(video)} 
                                            className="font-bold text-xs text-gray-900 line-clamp-2 hover:text-[#00ABA9] cursor-pointer"
                                        >
                                            {video.title}
                                        </h4>
                                        {video.caption && (
                                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-1">
                                                {video.caption}
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="pt-2 border-t border-gray-100 space-y-1.5">
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <a 
                                                href={`/api/media/download?url=${encodeURIComponent(video.video_url)}&filename=${encodeURIComponent((video.title || 'video_lyhu') + '.mp4')}`}
                                                className="inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                                title="Tải video MP4"
                                            >
                                                <Download className="w-3 h-3" /> Tải về
                                            </a>
                                            <button
                                                onClick={() => copyText(video.caption || video.title || '', 'Đã sao chép caption')}
                                                className="inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                                                title="Sao chép caption"
                                            >
                                                <Copy className="w-3 h-3" /> Copy
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setTikTokTarget({ url: video.video_url, title: video.caption || video.title, category: video.category || undefined })}
                                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
                                        >
                                            <Share2 className="w-3 h-3 text-amber-400" /> Phát sóng MXH
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal xem trước & Chỉnh sửa toàn diện (Preview & Full Edit Modal) */}
            {preview && (
                <div className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setPreview(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col sm:flex-row shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        {/* Video Player */}
                        <div className="bg-black sm:w-[320px] shrink-0 flex items-center justify-center max-h-[50vh] sm:max-h-[92vh]">
                            <video
                                key={preview.id}
                                src={preview.video_url}
                                poster={preview.thumbnail_url || undefined}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full max-h-[50vh] sm:max-h-[92vh] aspect-[9/16] object-contain bg-black"
                            />
                        </div>

                        {/* Full Edit Form */}
                        <div className="p-5 flex-1 overflow-y-auto flex flex-col justify-between space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3 border-b pb-3">
                                    <div>
                                        <span className="text-xs font-bold text-[#00ABA9] uppercase tracking-wider">
                                            Chỉnh sửa & Xem trước
                                        </span>
                                        <h3 className="text-base font-bold text-gray-900 mt-0.5 line-clamp-1">
                                            {preview.title}
                                        </h3>
                                    </div>
                                    <button onClick={() => setPreview(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors" aria-label="Đóng">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Tiêu đề video */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Tiêu đề video
                                    </label>
                                    <input
                                        type="text"
                                        value={modalTitle}
                                        onChange={(e) => setModalTitle(e.target.value)}
                                        placeholder="Nhập tiêu đề video..."
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#00ABA9]/20 focus:border-[#00ABA9]"
                                    />
                                </div>

                                {/* Thương hiệu / Phân loại (Category) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Thương hiệu / Phân loại
                                    </label>
                                    <select
                                        value={modalCategory}
                                        onChange={(e) => setModalCategory(e.target.value)}
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg font-semibold bg-white outline-none focus:ring-2 focus:ring-[#00ABA9]/20 focus:border-[#00ABA9]"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c.key} value={c.key}>Thương hiệu {c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Caption & AI Generator */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Caption & Hashtags</label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateAICaption}
                                            disabled={isGeneratingAI}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors shadow-2xs"
                                        >
                                            <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                                            {isGeneratingAI ? 'AI đang viết...' : '✨ AI viết Caption & Hashtags'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={modalCaption}
                                        onChange={(e) => setModalCaption(e.target.value)}
                                        placeholder="Nhập nội dung caption và hashtag cho video này..."
                                        rows={5}
                                        className="w-full text-xs border border-gray-300 rounded-xl p-3 text-gray-800 bg-white focus:ring-2 focus:ring-[#00ABA9]/20 focus:border-[#00ABA9] outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-3 border-t">
                                {/* Save All Button */}
                                <button
                                    onClick={handleSaveModal}
                                    disabled={isSavingModal}
                                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                                >
                                    {isSavingModal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu tất cả thay đổi (Tiêu đề, Thương hiệu, Caption)
                                </button>

                                {/* External Quick Actions */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <a
                                        href={`/api/media/download?url=${encodeURIComponent(preview.video_url)}&filename=${encodeURIComponent((modalTitle || preview.title || 'video_lyhu') + '.mp4')}`}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                        title="Tải video MP4"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Tải video MP4
                                    </a>
                                    <button
                                        onClick={() => copyText(modalCaption || modalTitle || preview.title, 'Đã sao chép caption')}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#00ABA9]/10 text-[#00ABA9] hover:bg-[#00ABA9]/20 border border-[#00ABA9]/30 transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> Copy caption
                                    </button>
                                </div>

                                <button
                                    onClick={() => { 
                                        setTikTokTarget({ 
                                            url: preview.video_url, 
                                            title: modalCaption || modalTitle || preview.title, 
                                            category: modalCategory || preview.category || undefined 
                                        }); 
                                        setPreview(null); 
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                                    Phát sóng lên TikTok • FB Reels • YouTube Shorts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đăng video lên TikTok */}
            <TikTokPublishModal
                isOpen={!!tikTokTarget}
                onClose={() => setTikTokTarget(null)}
                videoUrl={tikTokTarget?.url || ''}
                defaultTitle={tikTokTarget?.title || ''}
                brandCategory={tikTokTarget?.category}
            />
        </div>
    );
}
