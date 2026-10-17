"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Sparkles, Clock } from "lucide-react";

export interface VideoStoryItem {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string | null;
    video_url?: string | null;
    published_at?: string | null;
    created_at?: string;
    brand_tag?: string;
    duration?: string;
    headline?: string;
    badge_color?: string;
}

interface VideoStoryCarouselProps {
    items: VideoStoryItem[];
}

// Brand color palette inspired by the design
const BRAND_STYLES: Record<string, { bg: string; text: string; badgeBg: string }> = {
    CVT: { bg: "bg-[#00ABA9]", text: "text-white", badgeBg: "bg-white/20 text-white" },
    LYHU: { bg: "bg-[#8DC63F]", text: "text-white", badgeBg: "bg-white/20 text-white" },
    UHi: { bg: "bg-amber-400", text: "text-amber-950", badgeBg: "bg-black/15 text-amber-950" },
    ABI: { bg: "bg-orange-500", text: "text-white", badgeBg: "bg-white/20 text-white" },
    NPP: { bg: "bg-slate-800", text: "text-white", badgeBg: "bg-white/20 text-white" },
};

export default function VideoStoryCarousel({ items }: VideoStoryCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!items || items.length === 0) return null;

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = direction === "left" ? -320 : 320;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    };

    return (
        <section className="mb-10 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#00ABA9] rounded-full inline-block" />
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span>Báo hình LYHU</span>
                            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Xem nhanh dưới 1 phút
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/tin-tuc?type=video"
                        className="text-xs font-semibold text-[#00ABA9] hover:underline hidden sm:inline-block mr-2"
                    >
                        Xem tất cả video →
                    </Link>
                    <button
                        onClick={() => scroll("left")}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-sm"
                        aria-label="Cuộn trái"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-sm"
                        aria-label="Cuộn phải"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {items.map((item, idx) => {
                    // Detect brand or style from title or tag
                    const brand = item.brand_tag || (item.title.includes("CVT") ? "CVT" : item.title.includes("BOYO") ? "LYHU" : item.title.includes("UHi") ? "UHi" : "LYHU");
                    const style = BRAND_STYLES[brand] || BRAND_STYLES.LYHU;

                    return (
                        <Link
                            key={item.id || idx}
                            href={`/tin-tuc/${item.slug}`}
                            className="group relative flex-shrink-0 w-[160px] sm:w-[180px] aspect-[9/16] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 snap-start bg-black"
                        >
                            {/* Background Image / Poster */}
                            {item.thumbnail_url ? (
                                <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className={`w-full h-full ${style.bg} p-4 flex flex-col justify-between`} />
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 group-hover:from-black/95 transition-colors" />

                            {/* Top Badge: Brand & Duration */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm ${style.badgeBg || "bg-black/40 text-white"}`}>
                                    {brand}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/60 text-white/90 backdrop-blur-sm flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {item.duration || "0:30"}
                                </span>
                            </div>

                            {/* Center Play Button (hover state) */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#00ABA9] group-hover:border-transparent transition-all duration-300 shadow-lg">
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                            </div>

                            {/* Bottom Title & Date */}
                            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                                <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-teal-200 transition-colors">
                                    {item.title}
                                </h3>
                                <div className="text-[10px] text-gray-300 mt-1 flex items-center gap-1.5">
                                    <span>
                                        {item.published_at
                                            ? new Date(item.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                                            : "Mới cập nhật"}
                                    </span>
                                    <span>•</span>
                                    <span className="text-teal-300 font-medium">Báo hình</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
