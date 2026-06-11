"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Volume2, VolumeX, Pause } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

const supabase = getSupabase();

interface ShortVideo {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string;
    sort_order: number;
}

export default function ShortVideosList() {
    const [videos, setVideos] = useState<ShortVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<ShortVideo | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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
                <span className="w-1.5 h-5 bg-primary-600 rounded-full inline-block"></span>
                Video Nổi Bật
            </h3>
            
            {/* Horizontal Scroll List */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x">
                {videos.map((video) => (
                    <div 
                        key={video.id} 
                        onClick={() => setSelectedVideo(video)}
                        className="snap-start shrink-0 w-[120px] aspect-[9/16] bg-gray-100 rounded-xl relative overflow-hidden cursor-pointer group shadow-sm border border-gray-200"
                    >
                        <video 
                            src={video.video_url} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            loop
                            playsInline
                            // Optional: can play on hover
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium line-clamp-2 leading-tight">
                            {video.title}
                        </div>
                        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1">
                            <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-4 right-4 z-[110] p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Video Container */}
                    <div className="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-xl overflow-hidden mx-4 shadow-2xl">
                        <video
                            ref={videoRef}
                            src={selectedVideo.video_url}
                            className="w-full h-full object-cover cursor-pointer"
                            loop
                            playsInline
                            muted={isMuted}
                            onClick={togglePlay}
                        />

                        {/* Overlays */}
                        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                            <h2 className="text-white text-lg font-bold mb-2 drop-shadow-md">{selectedVideo.title}</h2>
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                className="w-10 h-10 bg-black/40 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Center Play/Pause indicator (temporary flash) */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
