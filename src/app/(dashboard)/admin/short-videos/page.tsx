"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Edit, Plus, Video, CheckCircle, XCircle, Share2, Copy, X, Download, Eye, Link2 } from 'lucide-react';
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
    const [preview, setPreview] = useState<ShortVideo | null>(null);
    const [captionText, setCaptionText] = useState('');
    const [savingCaption, setSavingCaption] = useState(false);

    useEffect(() => {
        if (preview) {
            setCaptionText(preview.caption || '');
        }
    }, [preview]);

    const saveCaption = async () => {
        if (!preview) return;
        setSavingCaption(true);
        try {
            const { error } = await supabase
                .from('wholesale_short_videos')
                .update({ caption: captionText })
                .eq('id', preview.id);
            if (error) throw error;
            setVideos(vs => vs.map(v => v.id === preview.id ? { ...v, caption: captionText } : v));
            setPreview({ ...preview, caption: captionText });
            toast.success('Đã lưu caption thành công!');
        } catch (e: any) {
            toast.error('Lỗi khi lưu caption: ' + e.message);
        } finally {
            setSavingCaption(false);
        }
    };

    const fetchVideos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wholesale_short_videos')
            .select('*')
            .order('sort_order', { ascending: true });
        
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
        const { error } = await supabase
            .from('wholesale_short_videos')
            .insert({
                title: title.split('.')[0],
                video_url,
                sort_order: videos.length,
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
            toast.success('Đã cập nhật phân loại');
        } else {
            toast.error('Không cập nhật được phân loại');
        }
    };

    const countOf = (k: string) => (k === 'all' ? videos.length : videos.filter(v => (v.category || 'lyhu') === k).length);
    const shown = filter === 'all' ? videos : videos.filter(v => (v.category || 'lyhu') === filter);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Short Videos</h1>
                    <p className="text-sm text-gray-500">Hiển thị dưới phần Voucher trang chủ. Giới hạn 20MB/video.</p>
                </div>
                <div>
                    <label className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 cursor-pointer flex items-center gap-2 transition-colors">
                        {isUploading ? (
                            <span className="animate-pulse">Đang tải lên...</span>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Tải video mới (Max 20MB)
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

            <div className="flex flex-wrap gap-2 mb-4">
                {[{ key: 'all', label: 'Tất cả' }, ...CATEGORIES].map(c => (
                    <button
                        key={c.key}
                        onClick={() => setFilter(c.key)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            filter === c.key ? 'bg-[#00ABA9] border-[#00ABA9] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#00ABA9]'
                        }`}
                    >
                        {c.label} <span className={filter === c.key ? 'text-white/80' : 'text-gray-400'}>({countOf(c.key)})</span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Video</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tiêu đề</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Thứ tự hiển thị</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Trạng thái</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : shown.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có video nào. Hãy tải lên video đầu tiên!</td></tr>
                        ) : (
                            shown.map(video => (
                                <tr key={video.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div onClick={() => setPreview(video)} title="Bấm để xem video" className="w-16 h-24 bg-gray-100 rounded border flex items-center justify-center overflow-hidden relative cursor-pointer">
                                            <video src={video.video_url} poster={video.thumbnail_url || undefined} className="w-full h-full object-cover" muted />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <Video className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div onClick={() => setPreview(video)} className="font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-[#00ABA9]">{video.title}</div>
                                        {video.caption ? (
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-[420px]" title={video.caption}>
                                                <span className="font-medium text-gray-600">Caption: </span>{video.caption}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-400 italic mt-0.5">
                                                (Chưa có caption - bấm xem video để thêm)
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <select
                                                value={video.category || 'lyhu'}
                                                onChange={(e) => updateCategory(video.id, e.target.value)}
                                                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 font-medium"
                                            >
                                                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="text-[11px] text-gray-400 mt-1 truncate max-w-[200px]" title={video.video_url}>
                                            {video.video_url.split('/').pop()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input 
                                            type="number" 
                                            defaultValue={video.sort_order}
                                            onBlur={(e) => updateSortOrder(video.id, parseInt(e.target.value) || 0)}
                                            className="w-16 p-1 text-center border rounded-md"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => toggleActive(video.id, video.is_active)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                                video.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {video.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            {video.is_active ? 'Đang bật' : 'Đang tắt'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end flex-wrap gap-2">
                                            {/* 1. Tải video MP4 */}
                                            <a 
                                                href={`/api/media/download?url=${encodeURIComponent(video.video_url)}&filename=${encodeURIComponent((video.title || 'video_lyhu') + '.mp4')}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
                                                title="Tải video MP4 về máy (để đăng Zalo, Facebook cá nhân...)"
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
                                                <Copy className="w-3.5 h-3.5 text-gray-400" />
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

                                            {/* 5. Xem trước & Sửa caption */}
                                            <button
                                                onClick={() => setPreview(video)}
                                                className="p-1.5 text-gray-600 hover:text-[#00ABA9] hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                                                title="Xem trước video & sửa caption"
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

            {/* Xem video + caption */}
            {preview && (
                <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col sm:flex-row" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-black sm:w-[300px] shrink-0 flex items-center justify-center">
                            <video
                                key={preview.id}
                                src={preview.video_url}
                                poster={preview.thumbnail_url || undefined}
                                controls
                                autoPlay
                                playsInline
                                className="w-full max-h-[70vh] sm:max-h-[92vh] aspect-[9/16] object-contain bg-black"
                            />
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold text-[#00ABA9] uppercase tracking-wide">
                                        {CATEGORIES.find(c => c.key === (preview.category || 'lyhu'))?.label}
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 mt-1">{preview.title}</h2>
                                </div>
                                <button onClick={() => setPreview(null)} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Đóng">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4 mb-1">
                                <label className="text-sm font-semibold text-gray-700">Caption bài đăng</label>
                                <button
                                    onClick={saveCaption}
                                    disabled={savingCaption}
                                    className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs"
                                >
                                    {savingCaption ? 'Đang lưu...' : 'Lưu caption'}
                                </button>
                            </div>
                            <textarea
                                value={captionText}
                                onChange={(e) => setCaptionText(e.target.value)}
                                placeholder="Nhập hoặc chỉnh sửa caption cho video này..."
                                rows={6}
                                className="w-full text-sm border border-gray-200 rounded-lg p-3 text-gray-800 bg-white focus:ring-1 focus:ring-[#00ABA9] focus:border-[#00ABA9] outline-none"
                            />

                            <div className="flex flex-wrap gap-2 mt-3">
                                <a
                                    href={`/api/media/download?url=${encodeURIComponent(preview.video_url)}&filename=${encodeURIComponent((preview.title || 'video_lyhu') + '.mp4')}`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                    title="Tải video MP4 về máy để đăng Zalo, Facebook cá nhân..."
                                >
                                    <Download className="w-4 h-4" /> Tải video về máy
                                </a>
                                <button
                                    onClick={() => copyText(captionText || preview.title || '', 'Đã sao chép caption')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-[#00ABA9] text-white hover:bg-[#008f8d] transition-colors"
                                >
                                    <Copy className="w-4 h-4" /> Sao chép caption
                                </button>
                                <button
                                    onClick={() => copyText(preview.video_url, 'Đã sao chép liên kết video')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:border-[#00ABA9]"
                                >
                                    <Copy className="w-4 h-4" /> Sao chép link video
                                </button>
                                <button
                                    onClick={() => { setTikTokTarget({ url: preview.video_url, title: captionText || preview.caption || preview.title, category: preview.category || undefined }); setPreview(null); }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
                                >
                                    <Share2 className="w-4 h-4 text-amber-400" />
                                    Phát sóng (TikTok • FB • YouTube)
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
