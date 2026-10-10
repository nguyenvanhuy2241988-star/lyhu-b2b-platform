'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Pause, Volume2, Printer, Share2, Clock, Calendar, Check, ChevronRight, Bookmark, ArrowDown } from 'lucide-react';
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
    const [activeSection, setActiveSection] = useState('');
    const [scrollProgress, setScrollProgress] = useState(0);

    // Track scroll progress & active sections
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                const current = (window.scrollY / totalHeight) * 100;
                setScrollProgress(Math.min(100, Math.max(0, current)));
            }

            // Detect active chapter
            const headings = document.querySelectorAll('.emagazine-prose h2');
            headings.forEach((heading: any) => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 200 && rect.bottom >= 0) {
                    setActiveSection(heading.innerText);
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        } else {
            window.speechSynthesis.cancel();

            // Extract plain text from post content
            const plainText = (post.title + '. ' + (post.ai_summary || '') + '. ' + post.content)
                .replace(/<[^>]*>?/gm, ' ')
                .replace(/\[PULL_QUOTE:[^\]]+\]/g, ' ')
                .replace(/\[STAT_BOX:[^\]]+\]/g, ' ')
                .replace(/\[PHOTO_[^\]]+\]/g, ' ')
                .replace(/\[TIMELINE:[^\]]+\]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const utterance = new SpeechSynthesisUtterance(plainText.substring(0, 4000));
            utterance.lang = 'vi-VN';
            utterance.rate = playbackRate;

            utterance.onend = () => {
                setIsPlaying(false);
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

    const scrollToContent = () => {
        const element = document.getElementById('emagazine-body');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Parse custom eMagazine blocks from HTML content
    const renderContentBlocks = (htmlContent: string) => {
        const cleanedHtml = htmlContent.replace(/\[EMAGAZINE\]\s*/gi, '').trim();

        // Split content by shortcode tags
        const parts = cleanedHtml.split(/(\[PULL_QUOTE:[^\]]+\]|\[STAT_BOX:[^\]]+\]|\[PHOTO_DUO:[^\]]+\]|\[PHOTO_FULL:[^\]]+\]|\[TIMELINE:[^\]]+\])/gi);

        return parts.map((part, index) => {
            const trimmed = part.trim();
            if (!trimmed) return null;

            // 1. PULL QUOTE BLOCK
            if (trimmed.startsWith('[PULL_QUOTE:')) {
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
                    <figure key={`pull-quote-${index}`} className="my-16 relative py-6 px-8 sm:px-12 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-transparent border-l-4 border-primary-500 rounded-r-2xl">
                        <span className="text-7xl sm:text-8xl text-primary-300/30 font-serif absolute -top-4 left-4 select-none leading-none">“</span>
                        <blockquote className="relative z-10 pl-2 sm:pl-4">
                            <p className="text-xl sm:text-2xl md:text-3xl font-serif text-slate-800 leading-relaxed italic font-normal">
                                {quoteText}
                            </p>
                            {authorText && (
                                <figcaption className="mt-6 text-xs sm:text-sm font-bold text-primary-800 tracking-wider uppercase flex items-center gap-3">
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
                    <div key={`stat-box-${index}`} className="my-16 p-8 sm:p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl shadow-2xl border border-slate-800/80 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="text-center text-xs font-bold text-secondary-400 uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-secondary-400 animate-pulse inline-block"></span>
                            SỐ LIỆU CỐT LÕI VẬN HÀNH & BẢO HÀNH ĐỐI TÁC
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center relative z-10">
                            {stats.map((st, sIdx) => (
                                <div key={sIdx} className="space-y-3 p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:border-primary-400/50 transition-colors">
                                    <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-serif">
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

            // 3. PHOTO DUO BLOCK (Ảnh đôi phóng sự)
            if (trimmed.startsWith('[PHOTO_DUO:')) {
                const raw = trimmed.replace(/\[PHOTO_DUO:\s*|\]/gi, '').split('|').map(s => s.trim());
                const img1 = raw[0];
                const cap1 = raw[1] || '';
                const img2 = raw[2];
                const cap2 = raw[3] || '';

                return (
                    <div key={`photo-duo-${index}`} className="my-16 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <figure className="space-y-2 group">
                                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shadow-md">
                                    <img src={img1} alt={cap1} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                </div>
                                {cap1 && <figcaption className="text-center text-xs sm:text-sm text-slate-500 italic px-2 leading-relaxed">{cap1}</figcaption>}
                            </figure>
                            <figure className="space-y-2 group">
                                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shadow-md">
                                    <img src={img2} alt={cap2} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                </div>
                                {cap2 && <figcaption className="text-center text-xs sm:text-sm text-slate-500 italic px-2 leading-relaxed">{cap2}</figcaption>}
                            </figure>
                        </div>
                    </div>
                );
            }

            // 4. PHOTO FULL BLOCK (Ảnh toàn màn hình 100vw chuẩn Znews/CafeF)
            if (trimmed.startsWith('[PHOTO_FULL:')) {
                const [imgUrl, caption] = trimmed.replace(/\[PHOTO_FULL:\s*|\]/gi, '').split('|').map(s => s.trim());
                return (
                    <figure key={`photo-full-${index}`} className="my-16 -mx-4 sm:-mx-8 md:-mx-16 lg:-mx-28 group space-y-3">
                        <div className="aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden sm:rounded-2xl bg-slate-900 shadow-xl">
                            <img src={imgUrl} alt={caption || post.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out" />
                        </div>
                        {caption && <figcaption className="text-center text-xs sm:text-sm text-slate-500 italic px-4 font-serif">{caption}</figcaption>}
                    </figure>
                );
            }

            // Regular HTML Content with Drop Cap support
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
        <article className="min-h-screen bg-white selection:bg-teal-100 selection:text-teal-900">
            {/* 1. TOP PROGRESS BAR */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-lime-500 transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* 2. HERO COVER 100VH CINEMATIC COVER (CHUẨN CAFEF & ZNEWS ĐỈNH CAO) */}
            <section className="relative w-full h-screen min-h-[680px] flex items-center justify-center bg-slate-950 overflow-hidden">
                {/* Background Hero Image with Slow Ken-Burns Effect */}
                {post.thumbnail_url && (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={post.thumbnail_url} 
                            alt={post.title} 
                            className="w-full h-full object-cover opacity-50 scale-105 animate-pulse duration-[10000ms]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
                        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950" />
                    </div>
                )}

                {/* Hero Title Container */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center text-white space-y-8">
                    {/* Badge eMagazine / Longform */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary-500/20 text-secondary-300 border border-secondary-400/40 text-xs font-extrabold tracking-widest uppercase backdrop-blur-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary-400 animate-ping"></span>
                        eMagazine • Tạp Chí Phóng Sự Doanh Nghiệp
                    </div>

                    {/* Big Display Headline */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight leading-[1.2] text-white text-balance drop-shadow-lg">
                        {post.title}
                    </h1>

                    {/* Sapo / Standfirst */}
                    {post.ai_summary && (
                        <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-slate-200 font-serif italic leading-relaxed text-balance opacity-95">
                            {post.ai_summary}
                        </p>
                    )}

                    {/* Metadata & Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-300 pt-6 border-t border-white/15">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-400 inline-block"></span>
                            <span className="text-white font-bold">{post.author?.full_name || 'Ban Biên Tập LYHU'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary-400" />
                            <time dateTime={post.published_at || post.created_at}>
                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                            </time>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-400" />
                            <span>{readingTime} phút đọc chuyên sâu</span>
                        </div>
                    </div>

                    {/* Scroll Prompt Arrow */}
                    <div className="pt-6">
                        <button 
                            onClick={scrollToContent}
                            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all animate-bounce cursor-pointer"
                            aria-label="Cuộn xuống đọc bài viết"
                        >
                            <ArrowDown className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. STICKY UTILITY BAR: GIỌNG ĐỌC AI & CÔNG CỤ CHIA SẺ */}
            <div className="sticky top-1 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-xs">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                    {/* Audio Player Bar */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAudio}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                isPlaying 
                                    ? 'bg-primary-600 text-white animate-pulse' 
                                    : 'bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-200'
                            }`}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                            <span>{isPlaying ? 'Tạm Dừng Nghe' : 'Nghe Bài Báo (AI)'}</span>
                        </button>

                        <button 
                            onClick={handleSpeedChange} 
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            title="Đổi tốc độ đọc"
                        >
                            {playbackRate}x
                        </button>
                    </div>

                    {/* Right Tools: Share & Print */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="In hoặc Lưu file PDF"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                            <span>{copied ? 'Đã Copy Link' : 'Chia Sẻ'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. MAIN ARTICLE CANVAS */}
            <div id="emagazine-body" className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
                <style jsx global>{`
                    .emagazine-prose {
                        font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        color: #1e293b;
                        line-height: 2;
                        font-size: 1.18rem;
                        letter-spacing: -0.01em;
                    }
                    /* Drop Cap for the first paragraph */
                    .emagazine-prose:first-of-type p:first-of-type::first-letter {
                        font-family: var(--font-merriweather), Georgia, serif;
                        float: left;
                        font-size: 4.8rem;
                        line-height: 0.85;
                        font-weight: 900;
                        margin-top: 0.15rem;
                        margin-right: 0.85rem;
                        padding: 0.2rem;
                        color: #00afa9;
                    }
                    .emagazine-prose p {
                        margin-bottom: 2rem;
                        color: #334155;
                        text-align: justify;
                    }
                    .emagazine-prose h2 {
                        font-family: var(--font-merriweather), Georgia, serif;
                        font-size: 2.1rem;
                        font-weight: 900;
                        color: #0f172a;
                        margin-top: 4rem;
                        margin-bottom: 1.75rem;
                        line-height: 1.35;
                        letter-spacing: -0.025em;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 1rem;
                    }
                    .emagazine-prose h3 {
                        font-family: var(--font-inter), sans-serif;
                        font-size: 1.45rem;
                        font-weight: 800;
                        color: #007b77;
                        margin-top: 2.75rem;
                        margin-bottom: 1.25rem;
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
                        margin-bottom: 2rem;
                        list-style-type: disc;
                        padding-left: 2rem;
                    }
                    .emagazine-prose li {
                        margin-bottom: 0.75rem;
                        line-height: 1.85;
                        color: #334155;
                    }
                `}</style>

                {renderContentBlocks(post.content)}

                {/* 5. EDITORIAL SIGNATURE & EMBLEM */}
                <div className="mt-20 pt-10 border-t-2 border-primary-500 text-center space-y-3">
                    <div className="text-2xl sm:text-3xl font-serif font-black text-primary-800 tracking-wide uppercase">
                        LYHU: KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 italic max-w-2xl mx-auto leading-relaxed">
                        Chúng tôi kiến tạo giải pháp phân phối thực phẩm chính ngạch, đồng hành và bảo vệ sự phát triển lâu dài của mọi điểm bán lẻ trên khắp 63 tỉnh thành.
                    </p>
                </div>

                {/* 6. HERO PRODUCTS GRID & 4 CAM KẾT VÀNG */}
                <div className="mt-14">
                    <BlogProductGrid products={products} />
                </div>
            </div>
        </article>
    );
}
