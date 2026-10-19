"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Volume2, VolumeX, Pause, ChevronLeft, ChevronRight, Download, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabaseClient';

const supabase = getSupabase();

interface ShortVideo {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string | null;
    caption?: string | null;
    sort_order: number;
}

export default function ShortVideosList() {
    const [videos, setVideos] = useState<ShortVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<ShortVideo | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchVideos = async () => {
            const { data, error } = await supabase
                .from('wholesale_short_videos')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (data && !error) {
                setVideos(data);
            }
        };
        fetchVideos();
    }, []);

    // Handle play/pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleCopy = async (text: string, msg: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(msg);
        } catch {
            toast.error('Không thể sao chép');
        }
    };

    // Auto play when modal opens
    useEffect(() => {
        if (selectedVideo && videoRef.current) {
            videoRef.current.play().catch(e => console.error("Autoplay failed:", e));
            setIsPlaying(true);
        }
    }, [selectedVideo]);

    if (videos.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#00AFA9] rounded-full inline-block"></span>
                Video Nổi Bật
            </h3>
            
            {/* Horizontal Scroll List with Navigation */}
            <div className="relative group/list">
                {/* Left Arrow */}
                <button 
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:text-[#00AFA9] hover:scale-110 transition-all opacity-0 group-hover/list:opacity-100 disabled:opacity-0"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div 
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {videos.map((video) => (
                        <div 
                            key={video.id} 
                            onClick={() => setSelectedVideo(video)}
                            className="snap-start shrink-0 w-[180px] aspect-[9/16] bg-gray-100 rounded-xl relative overflow-hidden cursor-pointer group shadow-sm border border-slate-200 transition-all hover:border-[#00AFA9]"
                        >
                            <video 
                                src={video.video_url} 
                                poster={video.thumbnail_url || undefined}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                onMouseEnter={(e) => e.currentTarget.play()}
                                onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                            />
                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1">
                                <Play className="w-3 h-3 text-white fill-white" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button 
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:text-[#00AFA9] hover:scale-110 transition-all opacity-0 group-hover/list:opacity-100"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4" 
                    onClick={() => setSelectedVideo(null)}
                >
                    <div 
                        className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col sm:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Video Player */}
                        <div className="relative bg-black flex items-center justify-center sm:w-[320px] shrink-0 max-h-[50vh] sm:max-h-[92vh]">
                            <video
                                ref={videoRef}
                                src={selectedVideo.video_url}
                                className="w-full h-full max-h-[50vh] sm:max-h-[92vh] aspect-[9/16] object-contain bg-black cursor-pointer"
                                loop
                                playsInline
                                controls
                                autoPlay
                                muted={isMuted}
                                onClick={togglePlay}
                            />
                        </div>

                        {/* Info & Download Sidebar */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-y-auto bg-neutral-900 text-white min-w-0">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <span className="text-[11px] font-bold text-[#00ABA9] uppercase tracking-wider bg-[#00ABA9]/10 px-2 py-0.5 rounded border border-[#00ABA9]/30">
                                            Video Nổi Bật
                                        </span>
                                        <h3 className="font-bold text-base sm:text-lg text-white mt-1.5 leading-snug line-clamp-2">
                                            {selectedVideo.title}
                                        </h3>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedVideo(null)}
                                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors shrink-0"
                                        title="Đóng"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Caption */}
                                {selectedVideo.caption ? (
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-xs font-semibold text-neutral-400">Caption bài đăng:</span>
                                        <div className="text-xs text-neutral-200 bg-neutral-800/80 p-3 rounded-xl max-h-36 overflow-y-auto leading-relaxed border border-neutral-700/60 whitespace-pre-wrap font-sans select-all">
                                            {selectedVideo.caption}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-neutral-500 italic py-2">
                                        Chưa có caption cho video này.
                                    </div>
                                )}
                            </div>

                            {/* Actions for Internal User & Agents */}
                            <div className="space-y-2 pt-4 border-t border-neutral-800 mt-4">
                                <a
                                    href={`/api/media/download?url=${encodeURIComponent(selectedVideo.video_url)}&filename=${encodeURIComponent((selectedVideo.title || 'video_lyhu') + '.mp4')}`}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-[0.98]"
                                    title="Tải video MP4 chất lượng gốc về máy"
                                >
                                    <Download className="w-4 h-4" />
                                    Tải video về máy (MP4)
                                </a>

                                <div className="grid grid-cols-2 gap-2">
                                    {selectedVideo.caption && (
                                        <button
                                            onClick={() => handleCopy(selectedVideo.caption!, 'Đã sao chép caption!')}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all active:scale-[0.98]"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-[#00ABA9]" />
                                            Copy Caption
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCopy(selectedVideo.video_url, 'Đã sao chép link video!')}
                                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all active:scale-[0.98] ${!selectedVideo.caption ? 'col-span-2' : ''}`}
                                    >
                                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                                        Copy Link
                                    </button>
                                </div>

                                <p className="text-[11px] text-neutral-400 text-center pt-1">
                                    💡 Tải file MP4 về máy để đăng lên Zalo, Facebook cá nhân, TikTok...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
