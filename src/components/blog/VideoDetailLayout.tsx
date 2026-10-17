"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
    Play,
    Pause,
    Clock,
    Share2,
    Check,
    Copy,
    Phone,
    ShoppingCart,
    ArrowLeft,
    FileText,
    CheckCircle2,
    Sparkles,
    Tag,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import VideoStoryCarousel, { VideoStoryItem } from "./VideoStoryCarousel";

interface Chapter {
    time: string;
    sec: number;
    title: string;
}

interface ProductItem {
    id: string;
    name: string;
    brand?: string;
    price?: number;
    image_url?: string;
    unit?: string;
}

interface VideoDetailLayoutProps {
    post: {
        id: string;
        title: string;
        slug: string;
        content: string;
        ai_summary?: string | null;
        video_url?: string | null;
        thumbnail_url?: string | null;
        published_at?: string | null;
        category?: { id: string; name: string; slug: string } | null;
        author?: { full_name?: string; avatar_url?: string } | null;
        faq_data?: any;
    };
    products?: ProductItem[];
    relatedVideos?: VideoStoryItem[];
}

export default function VideoDetailLayout({
    post,
    products = [],
    relatedVideos = []
}: VideoDetailLayoutProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [copied, setCopied] = useState(false);
    const [activeSec, setActiveSec] = useState<number | null>(null);

    // Parse chapters from faq_data or fallback
    let chapters: Chapter[] = [];
    if (Array.isArray(post.faq_data) && post.faq_data.length > 0) {
        chapters = post.faq_data.map((item: any, i: number) => ({
            time: item.time || `0:${(i * 10).toString().padStart(2, "0")}`,
            sec: Number(item.sec) || i * 10,
            title: item.title || item.question || `Mục ${i + 1}`
        }));
    } else {
        // Default smart chapters for FMCG video
        chapters = [
            { time: "0:00", sec: 0, title: "Tổng quan & Điểm tin chính" },
            { time: "0:08", sec: 8, title: "Chi tiết biến động thị trường & nguồn hàng" },
            { time: "0:18", sec: 18, title: "Phân tích số liệu và tác động tới điểm bán" },
            { time: "0:25", sec: 25, title: "Lời khuyên thực chiến cho tiệm & đại lý" }
        ];
    }

    const seekTo = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            videoRef.current.play().catch(() => {});
            setActiveSec(seconds);
        }
    };

    const handleCopy = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const postUrl = typeof window !== "undefined" ? window.location.href : `https://lyhu.com.vn/tin-tuc/${post.slug}`;

    return (
        <article className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
                <Link href="/" className="hover:text-primary-600 transition-colors">
                    Trang chủ
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <Link href="/tin-tuc" className="hover:text-primary-600 transition-colors">
                    Tin tức
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <Link href="/tin-tuc?type=video" className="text-[#00ABA9] font-medium hover:underline">
                    Báo hình (Video)
                </Link>
                {post.category && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        <Link
                            href={`/tin-tuc?category=${post.category.slug}`}
                            className="hover:text-primary-600 transition-colors"
                        >
                            {post.category.name}
                        </Link>
                    </>
                )}
            </nav>

            {/* Main Video Section: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                {/* LEFT COLUMN: 9:16 Vertical Video Player (Col 5) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-200 relative group">
                        {post.video_url ? (
                            <video
                                ref={videoRef}
                                src={post.video_url}
                                poster={post.thumbnail_url || undefined}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/60">
                                <span>Chưa có đường dẫn video</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Social Share Under Video */}
                    <div className="w-full max-w-sm mt-4 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                        <span className="font-semibold text-gray-600 flex items-center gap-1.5 pl-1">
                            <Share2 className="w-3.5 h-3.5 text-[#00ABA9]" />
                            Chia sẻ:
                        </span>
                        <div className="flex items-center gap-1.5">
                            <a
                                href={`https://zalo.me/share?url=${encodeURIComponent(postUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold transition-colors"
                            >
                                Zalo
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold transition-colors"
                            >
                                Facebook
                            </a>
                            <button
                                onClick={handleCopy}
                                className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold flex items-center gap-1 transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? "Đã chép" : "Sao chép"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Video Metadata, Chapters, Products, CTA (Col 7) */}
                <div className="lg:col-span-7 flex flex-col space-y-6">
                    {/* Header Badges */}
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#00ABA9] text-white shadow-sm">
                                <Play className="w-3 h-3 fill-current" />
                                Video Báo hình
                            </span>
                            {post.category && (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                    {post.category.name}
                                </span>
                            )}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {post.published_at
                                    ? new Date(post.published_at).toLocaleDateString("vi-VN", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric"
                                      })
                                    : "Vừa đăng"}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                            {post.title}
                        </h1>

                        {post.ai_summary && (
                            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed border-l-4 border-[#00ABA9] pl-3 py-0.5 bg-gray-50/70 rounded-r-lg">
                                {post.ai_summary}
                            </p>
                        )}
                    </div>

                    {/* Chapters / Timeline Box */}
                    {chapters.length > 0 && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-100 shadow-sm">
                            <h3 className="text-xs font-bold text-[#00ABA9] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" />
                                Nội dung chính (Bấm mốc thời gian để xem ngay):
                            </h3>
                            <div className="space-y-2">
                                {chapters.map((ch, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => seekTo(ch.sec)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs sm:text-sm transition-all border ${
                                            activeSec === ch.sec
                                                ? "bg-white border-[#00ABA9] shadow-md text-[#00ABA9] font-bold"
                                                : "bg-white/80 hover:bg-white border-transparent hover:border-teal-200 text-gray-700 font-medium"
                                        }`}
                                    >
                                        <span className="px-2 py-0.5 rounded-md bg-[#00ABA9] text-white font-mono text-xs font-bold shrink-0">
                                            {ch.time}
                                        </span>
                                        <span className="flex-1 truncate">{ch.title}</span>
                                        <Play className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#00ABA9] shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tagged Products in Video */}
                    {products.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <ShoppingCart className="w-4 h-4 text-[#8DC63F]" />
                                Sản phẩm xuất hiện trong video:
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {products.slice(0, 2).map((prod) => (
                                    <div
                                        key={prod.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#00ABA9] transition-colors"
                                    >
                                        {prod.image_url && (
                                            <img
                                                src={prod.image_url}
                                                alt={prod.name}
                                                className="w-12 h-12 object-cover rounded-lg bg-white shrink-0 border border-gray-200"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-900 truncate">
                                                {prod.name}
                                            </div>
                                            <div className="text-[11px] text-gray-500">
                                                {prod.brand || "LYHU"}
                                            </div>
                                            {prod.price != null && prod.price > 0 && (
                                                <div className="text-xs font-extrabold text-[#00ABA9]">
                                                    {prod.price.toLocaleString("vi-VN")} đ/{prod.unit || "gói"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Banner CTA Nhận báo giá NPP */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00ABA9] to-[#8DC63F] text-white shadow-md flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase tracking-wider font-semibold text-teal-100">
                                Chính sách Đại lý & Nhà Phân Phối
                            </div>
                            <div className="text-base font-bold">
                                Muốn nhận báo giá sỉ & chiết khấu NPP?
                            </div>
                            <div className="text-xs text-teal-50 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3.5 h-3.5" />
                                Hotline / Zalo: <strong>0969 069 798</strong>
                            </div>
                        </div>
                        <a
                            href="https://zalo.me/0969069798"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-teal-50 transition-colors shadow-sm shrink-0"
                        >
                            Nhận báo giá ngay →
                        </a>
                    </div>
                </div>
            </div>

            {/* LOWER SECTION: Transcript (SEO & Text Content) */}
            <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-[#00ABA9]" />
                        <h2 className="text-lg font-bold text-gray-900">
                            Lời thoại trong video (Bản tin tóm tắt)
                        </h2>
                    </div>
                    <div className="p-5 sm:p-6 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm leading-relaxed text-gray-800">
                        <div
                            className="prose prose-sm max-w-none prose-p:mb-3 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-gray-900"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2 italic">
                        Bản chữ đầy đủ được trích xuất từ video giúp bạn đọc lướt nhanh và tối ưu tìm kiếm thông tin.
                    </p>
                </div>
            </div>

            {/* Related Videos Carousel */}
            {relatedVideos.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <VideoStoryCarousel items={relatedVideos} />
                </div>
            )}
        </article>
    );
}
