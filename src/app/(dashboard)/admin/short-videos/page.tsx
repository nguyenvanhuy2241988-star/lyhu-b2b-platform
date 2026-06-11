"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, Trash2, Edit, Plus, Video, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Safe Env Vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnon);

interface ShortVideo {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export default function ShortVideosAdmin() {
    const [videos, setVideos] = useState<ShortVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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
                        ) : videos.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có video nào. Hãy tải lên video đầu tiên!</td></tr>
                        ) : (
                            videos.map(video => (
                                <tr key={video.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="w-16 h-24 bg-gray-100 rounded border flex items-center justify-center overflow-hidden relative">
                                            <video src={video.video_url} className="w-full h-full object-cover" muted />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <Video className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 line-clamp-2">{video.title}</div>
                                        <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={video.video_url}>
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
                                        <button 
                                            onClick={() => deleteVideo(video.id, video.video_url)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa video"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
