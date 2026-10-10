'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Pause, Volume2, Printer, Share2, Clock, Calendar, Check, ChevronRight } from 'lucide-react';
import BlogProductGrid from './BlogProductGrid';

interface EmagazineLayoutProps {
    post: any;
    products: any[];
    readingTime: number;
}

export default function EmagazineLayout({ post, products, readingTime }: EmagazineLayoutProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [copied, setCopied] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);

    // Audio SpeechSynthesis integration
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleBeforeUnload = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const toggleAudio = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            alert('Trình duyệt của bạn không hỗ trợ tính năng đọc giọng nói tự động.');
            return;
        }

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setAudioProgress(0);
        } else {
            window.speechSynthesis.cancel();

            // Extract plain text from post content
            const plainText = (post.title + '. ' + (post.ai_summary || '') + '. ' + post.content)
                .replace(/<[^>]*>?/gm, ' ')
                .replace(/\[PULL_QUOTE:[^\]]+\]/g, ' ')
                .replace(/\[STAT_BOX:[^\]]+\]/g, ' ')
                .replace(/\[PHOTO_[^\]]+\]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const utterance = new SpeechSynthesisUtterance(plainText.substring(0, 4000));
            utterance.lang = 'vi-VN';
            utterance.rate = playbackRate;

            utterance.onend = () => {
                setIsPlaying(false);
                setAudioProgress(100);
            };

            utterance.onerror = () => {
                setIsPlaying(false);
            };

            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    const handleSpeedChange = () => {
        const nextRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1.0;
        setPlaybackRate(nextRate);
        if (isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }
    };

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    // Parse custom eMagazine blocks from HTML content
    const renderContentBlocks = (htmlContent: string) => {
        // Xóa sạch tag [EMAGAZINE] nếu nó nằm ở đầu nội dung
        const cleanedHtml = htmlContent.replace(/\[EMAGAZINE\]\s*/gi, '').trim();

        // Split content by custom shortcode tags
        const parts = cleanedHtml.split(/(\[PULL_QUOTE:[^\]]+\]|\[STAT_BOX:[^\]]+\]|\[PHOTO_DUO:[^\]]+\]|\[PHOTO_FULL:[^\]]+\])/gi);

        return parts.map((part, index) => {
            const trimmed = part.trim();
            if (!trimmed) return null;

            // 1. PULL QUOTE BLOCK
            if (trimmed.startsWith('[PULL_QUOTE:')) {
                // Tách nội dung và tác giả
                const contentMatch = trimmed.replace(/\[PULL_QUOTE:\s*|\]/gi, '');
                let quoteText = '';
                let authorText = 'LYHU';

                if (contentMatch.includes('|')) {
                    const splitIdx = contentMatch.indexOf('|');
                    quoteText = contentMatch.substring(0, splitIdx).trim();
                    authorText = contentMatch.substring(splitIdx + 1).replace(/Tác giả:\s*/i, '').trim();
                } else {
                    quoteText = contentMatch;
                }

                quoteText = quoteText.replace(/^["'“”]|["'“”]$/g, '').trim();
                authorText = authorText.replace(/^["'“”]|["'“”]$/g, '').trim();

                return (
                    <figure key={`pull-quote-${index}`} className="my-12 p-8 sm:p-10 bg-gradient-to-r from-teal-50/70 to-emerald-50/30 border-l-[6px] border-primary-500 rounded-r-2xl relative shadow-xs">
                        <span className="text-6xl sm:text-7xl text-primary-300/40 font-serif absolute -top-3 left-4 select-none leading-none">“</span>
                        <blockquote className="relative z-10 pl-2 sm:pl-4">
                            <p className="text-xl sm:text-2xl font-serif text-slate-800 leading-relaxed italic font-medium">
                                {quoteText}
                            </p>
                            {authorText && (
                                <figcaption className="mt-6 text-xs sm:text-sm font-bold text-primary-700 tracking-wider uppercase flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-primary-500 inline-block"></span>
                                    {authorText}
                                </figcaption>
                            )}
                        </blockquote>
                    </figure>
                );
            }

            // 2. STAT BOX BLOCK
            if (trimmed.startsWith('[STAT_BOX:')) {
                const rawItems = trimmed.replace(/\[STAT_BOX:\s*|\]/gi, '').split('|');
                const stats = rawItems.map(item => {
                    const parts = item.split('-');
                    const val = parts[0]?.trim() || '';
                    const label = parts.slice(1).join('-').trim() || '';
                    return { value: val, label: label };
                }).filter(s => s.value);

                return (
                    <div key={`stat-box-${index}`} className="my-14 p-8 sm:p-10 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800">
                        <div className="text-center text-xs font-bold text-secondary-400 uppercase tracking-widest mb-8 flex items-center justify-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-secondary-400 inline-block"></span>
                            SỐ LIỆU CỐT LÕI VẬN HÀNH
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
                            {stats.map((st, sIdx) => (
                                <div key={sIdx} className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                        {st.value}
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-300 font-medium leading-snug">
                                        {st.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // 3. PHOTO DUO BLOCK (Ảnh đôi phóng sự Zing/CafeF)
            if (trimmed.startsWith('[PHOTO_DUO:')) {
                const raw = trimmed.replace(/\[PHOTO_DUO:\s*|\]/gi, '').split('|').map(s => s.trim());
                const img1 = raw[0];
                const cap1 = raw[1] || '';
                const img2 = raw[2];
                const cap2 = raw[3] || '';

                return (
                    <div key={`photo-duo-${index}`} className="my-14 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <figure className="space-y-2 group">
                                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                                    <img src={img1} alt={cap1} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                {cap1 && <figcaption className="text-center text-xs sm:text-sm text-slate-500 italic px-2">{cap1}</figcaption>}
                            </figure>
                            <figure className="space-y-2 group">
                                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                                    <img src={img2} alt={cap2} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                {cap2 && <figcaption className="text-center text-xs sm:text-sm text-slate-500 italic px-2">{cap2}</figcaption>}
                            </figure>
                        </div>
                    </div>
                );
            }

            // 4. PHOTO FULL BLOCK (Ảnh toàn màn hình)
            if (trimmed.startsWith('[PHOTO_FULL:')) {
                const [imgUrl, caption] = trimmed.replace(/\[PHOTO_FULL:\s*|\]/gi, '').split('|').map(s => s.trim());
                return (
                    <figure key={`photo-full-${index}`} className="my-14 space-y-2 group">
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                            <img src={imgUrl} alt={caption || post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        {caption && <figcaption className="text-center text-xs sm:text-sm text-slate-500 italic px-4">{caption}</figcaption>}
                    </figure>
                );
            }

            // Regular HTML Content
            return (
                <div 
                    key={`html-${index}`} 
                    dangerouslySetInnerHTML={{ __html: trimmed }} 
                    className="emagazine-prose"
                />
            );
        });
    };

    return (
        <article className="min-h-screen bg-white">
            {/* 1. HERO COVER TOÀN MÀN HÌNH CHUẨN CAFEF / ZNEWS */}
            <div className="relative w-full min-h-[75vh] flex items-end justify-center bg-slate-950 overflow-hidden">
                {/* Background Hero Image */}
                {post.thumbnail_url && (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={post.thumbnail_url} 
                            alt={post.title} 
                            className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
                    </div>
                )}

                {/* Hero Title Container */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center text-white space-y-6">
                    {/* Badge eMagazine / Longform */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/20 text-secondary-300 border border-secondary-400/30 text-xs font-bold tracking-widest uppercase">
                        <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse"></span>
                        eMagazine • Phóng Sự Doanh Nghiệp & Thị Trường
                    </div>

                    {/* Headline */}
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight leading-[1.25] text-white text-balance drop-shadow-md">
                        {post.title}
                    </h1>

                    {/* Sapo / Standfirst */}
                    {post.ai_summary && (
                        <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-slate-200 font-serif italic leading-relaxed text-balance">
                            {post.ai_summary}
                        </p>
                    )}

                    {/* Metadata & Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-4 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium">{post.author?.full_name || 'LYHU Editorial'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <time dateTime={post.published_at || post.created_at}>
                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                            </time>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{readingTime} phút đọc</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. THANH TIỆN ÍCH: GIỌNG ĐỌC AI & CHIA SẺ / IN BÀI VIẾT */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-xs">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                    {/* Audio Player Bar */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAudio}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                isPlaying 
                                    ? 'bg-primary-600 text-white' 
                                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                            }`}
                        >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>{isPlaying ? 'Tạm Dừng Nghe' : 'Nghe Bài Viết (AI)'}</span>
                        </button>

                        <button 
                            onClick={handleSpeedChange} 
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 rounded"
                            title="Đổi tốc độ đọc"
                        >
                            {playbackRate}x
                        </button>
                    </div>

                    {/* Right Tools: Share & Print */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="In hoặc Lưu file PDF"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Đã Copy' : 'Chia Sẻ'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. THÂN BÀI VIẾT NGHỆ THUẬT (Focus Reading Canvas) */}
            <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
                <style jsx global>{`
                    .emagazine-prose {
                        font-family: var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        color: #1e293b;
                        line-height: 1.95;
                        font-size: 1.15rem;
                        letter-spacing: -0.01em;
                    }
                    .emagazine-prose p {
                        margin-bottom: 1.75rem;
                        color: #334155;
                    }
                    .emagazine-prose h2 {
                        font-family: var(--font-merriweather), Georgia, Cambria, "Times New Roman", Times, serif;
                        font-size: 1.85rem;
                        font-weight: 800;
                        color: #0f172a;
                        margin-top: 3.5rem;
                        margin-bottom: 1.5rem;
                        line-height: 1.4;
                        letter-spacing: -0.02em;
                        border-bottom: 2px solid #f1f5f9;
                        padding-bottom: 0.85rem;
                    }
                    .emagazine-prose h3 {
                        font-family: var(--font-inter), sans-serif;
                        font-size: 1.35rem;
                        font-weight: 700;
                        color: #007b77;
                        margin-top: 2.25rem;
                        margin-bottom: 1rem;
                        line-height: 1.4;
                    }
                    .emagazine-prose strong {
                        color: #0f172a;
                        font-weight: 700;
                    }
                    .emagazine-prose em {
                        color: #475569;
                    }
                    .emagazine-prose ul {
                        margin-bottom: 1.75rem;
                        list-style-type: disc;
                        padding-left: 1.75rem;
                    }
                    .emagazine-prose li {
                        margin-bottom: 0.65rem;
                        line-height: 1.8;
                    }
                `}</style>

                {renderContentBlocks(post.content)}

                {/* 4. CHỮ KÝ ĐÓNG ĐINH THƯƠNG HIỆU */}
                <div className="mt-16 pt-8 border-t-2 border-primary-500 text-center space-y-2">
                    <div className="text-xl sm:text-2xl font-serif font-black text-primary-800 tracking-wide uppercase">
                        LYHU: KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 italic max-w-xl mx-auto">
                        Chúng tôi kiến tạo giải pháp phân phối thực phẩm chính ngạch, đồng hành và bảo vệ sự phát triển lâu dài của mọi điểm bán lẻ.
                    </p>
                </div>

                {/* 5. KHỐI 4 SẢN PHẨM CHỦ LỰC XOAY TUA + 4 CAM KẾT VÀNG + HOTLINE ZALO */}
                <BlogProductGrid products={products} />
            </div>
        </article>
    );
}
