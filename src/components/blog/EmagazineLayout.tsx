'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Pause, Printer, Share2, Clock, Calendar, Check, ArrowDown, ShieldCheck, Truck, Award, RefreshCw } from 'lucide-react';
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
    const [scrollProgress, setScrollProgress] = useState(0);

    // Scroll progress bar
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                const current = (window.scrollY / totalHeight) * 100;
                setScrollProgress(Math.min(100, Math.max(0, current)));
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Speech synthesis
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleBeforeUnload = () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
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
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);

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

    const scrollToContent = () => {
        const element = document.getElementById('emagazine-content-flow');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    // Parse custom eMagazine blocks
    const renderContentBlocks = (htmlContent: string) => {
        const cleanedHtml = htmlContent.replace(/\[EMAGAZINE\]\s*/gi, '').trim();
        const parts = cleanedHtml.split(/(\[PULL_QUOTE:[^\]]+\]|\[STAT_BOX:[^\]]+\]|\[PHOTO_DUO:[^\]]+\]|\[PHOTO_FULL:[^\]]+\])/gi);

        return parts.map((part, index) => {
            const trimmed = part.trim();
            if (!trimmed) return null;

            // 1. PULL QUOTE BLOCK (Flat minimalist, pure elegance)
            if (trimmed.startsWith('[PULL_QUOTE:')) {
                const contentMatch = trimmed.replace(/\[PULL_QUOTE:\s*|\]/gi, '');
                let quoteText = '';
                let authorText = 'Ban Lãnh Đạo LYHU';

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
                    <figure key={`pull-quote-${index}`} className="my-16 py-8 px-6 sm:px-10 bg-[#FAFAFA] border-l-4 border-[#00AFA9]">
                        <span className="text-6xl text-[#00AFA9] font-serif select-none leading-none block mb-2 opacity-60">“</span>
                        <blockquote className="space-y-4">
                            <p className="text-xl sm:text-2xl font-serif text-[#1E293B] leading-relaxed italic font-normal">
                                {quoteText}
                            </p>
                            {authorText && (
                                <figcaption className="text-xs sm:text-sm font-bold text-[#00AFA9] tracking-widest uppercase flex items-center gap-2 pt-2">
                                    <span className="w-6 h-[2px] bg-[#98C93C] inline-block"></span>
                                    {authorText}
                                </figcaption>
                            )}
                        </blockquote>
                    </figure>
                );
            }

            // 2. STAT BOX BLOCK (TỐI GIẢN PHẲNG - KHÔNG DARK GRADIENT - LÀM NỔI BẬT NHẬN DIỆN THƯƠNG HIỆU LYHU)
            if (trimmed.startsWith('[STAT_BOX:')) {
                const statCards = [
                    {
                        icon: ShieldCheck,
                        value: '100%',
                        label: 'Nguồn Gốc Chính Ngạch',
                        desc: 'Hóa đơn VAT điện tử & Hồ sơ công bố ATTP',
                        badgeColor: 'border-[#00AFA9] text-[#00AFA9]'
                    },
                    {
                        icon: Truck,
                        value: '24 - 48h',
                        label: 'Tốc Độ Giao Hàng',
                        desc: 'Kho bãi trung tâm, đóng pallet chuẩn chống móp méo',
                        badgeColor: 'border-[#98C93C] text-[#5E7D26]'
                    },
                    {
                        icon: Award,
                        value: '4 Trụ Cột',
                        label: 'Cam Kết Vàng',
                        desc: 'Đúng Chất Lượng • Đúng Chính Sách • Đúng Hẹn • Bền Vững',
                        badgeColor: 'border-[#00AFA9] text-[#00AFA9]'
                    },
                    {
                        icon: RefreshCw,
                        value: '0 Đồng',
                        label: 'Hỗ Trợ Đổi Trả Date',
                        desc: 'Đồng hành xử lý tồn kho & thu hồi sản phẩm lỗi',
                        badgeColor: 'border-[#98C93C] text-[#5E7D26]'
                    }
                ];

                return (
                    <section key={`stat-box-${index}`} className="my-20 p-8 sm:p-12 bg-white border-2 border-[#00AFA9] rounded-none">
                        {/* Header Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <img src="/logo-full.png" alt="LYHU" className="h-8 w-auto object-contain" />
                                <div className="h-5 w-[1px] bg-gray-300"></div>
                                <span className="text-xs sm:text-sm font-bold text-gray-800 tracking-wider uppercase">
                                    Bảo Chứng Vận Hành & Cam Kết Đối Tác
                                </span>
                            </div>
                            <span className="inline-block px-3 py-1 bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-semibold rounded-full w-fit">
                                Chuẩn Phân Phối FMCG Chính Ngạch
                            </span>
                        </div>

                        {/* Flat Minimal 4-Grid Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statCards.map((card, cIdx) => {
                                const IconComponent = card.icon;
                                return (
                                    <div 
                                        key={cIdx} 
                                        className="p-6 bg-[#FAFAFA] border border-gray-200 hover:border-[#00AFA9] transition-all flex flex-col justify-between"
                                    >
                                        <div className="space-y-4">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#00AFA9]">
                                                <IconComponent className="w-5 h-5 text-[#00AFA9]" />
                                            </div>
                                            <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-serif tracking-tight">
                                                {card.value}
                                            </div>
                                            <div className="text-sm font-bold text-[#007B77] uppercase tracking-wide">
                                                {card.label}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-200/80 text-xs text-gray-500 leading-relaxed">
                                            {card.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            }

            // 3. PHOTO DUO BLOCK (Ảnh đôi phóng sự tài liệu)
            if (trimmed.startsWith('[PHOTO_DUO:')) {
                const raw = trimmed.replace(/\[PHOTO_DUO:\s*|\]/gi, '').split('|').map(s => s.trim());
                const img1 = raw[0];
                const cap1 = raw[1] || '';
                const img2 = raw[2];
                const cap2 = raw[3] || '';

                return (
                    <div key={`photo-duo-${index}`} className="my-16 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <figure className="space-y-2">
                                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 border border-gray-200">
                                    <img src={img1} alt={cap1} className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
                                </div>
                                {cap1 && <figcaption className="text-center text-xs text-gray-500 italic px-2">{cap1}</figcaption>}
                            </figure>
                            <figure className="space-y-2">
                                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 border border-gray-200">
                                    <img src={img2} alt={cap2} className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
                                </div>
                                {cap2 && <figcaption className="text-center text-xs text-gray-500 italic px-2">{cap2}</figcaption>}
                            </figure>
                        </div>
                    </div>
                );
            }

            // 4. PHOTO FULL BLOCK (Ảnh phóng sự toàn khổ màn hình)
            if (trimmed.startsWith('[PHOTO_FULL:')) {
                const [imgUrl, caption] = trimmed.replace(/\[PHOTO_FULL:\s*|\]/gi, '').split('|').map(s => s.trim());
                return (
                    <figure key={`photo-full-${index}`} className="my-16 space-y-2">
                        <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={imgUrl} alt={caption || post.title} className="w-full h-full object-cover hover:scale-101 transition-transform duration-500" />
                        </div>
                        {caption && <figcaption className="text-center text-xs text-gray-500 italic px-4 font-serif">{caption}</figcaption>}
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
            {/* Top Reading Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
                <div 
                    className="h-full bg-[#00AFA9] transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* 1. HERO COVER TRANH BÌA TẠP CHÍ: 100VH FULL CẢ CHIỀU NGANG LẪN CHIỀU DỌC MÀN HÌNH */}
            <section className="relative w-screen h-screen min-h-screen flex items-center justify-center bg-white overflow-hidden left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                {/* Minimalist Bright Editorial Background (Flat & Clean) */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/emagazine/lyhu_wall.jpg" 
                        alt="LYHU Cover Art" 
                        className="w-full h-full object-cover opacity-90"
                    />
                    {/* Semi-transparent warm veil to enhance typography readability */}
                    <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]" />
                </div>

                {/* Hero Content Box */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8 py-12">
                    {/* Brand Pill */}
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white border border-[#00AFA9] text-[#00AFA9] text-xs font-bold tracking-widest uppercase shadow-xs">
                        <img src="/logo-full.png" alt="LYHU" className="h-4 w-auto object-contain" />
                        <span>• eMagazine Phóng Sự Doanh Nghiệp</span>
                    </div>

                    {/* Big Display Headline with Merriweather Serif */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight leading-[1.25] text-[#0F172A] text-balance">
                        {post.title}
                    </h1>

                    {/* Sapo / Standfirst */}
                    {post.ai_summary && (
                        <p className="max-w-2xl mx-auto text-base sm:text-xl font-serif italic text-[#334155] leading-relaxed text-balance">
                            {post.ai_summary}
                        </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-gray-500 pt-4 border-t border-gray-300/80">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#98C93C]"></span>
                            <span className="text-[#0F172A] font-bold">{post.author?.full_name || 'Ban Biên Tập LYHU'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <time dateTime={post.published_at || post.created_at}>
                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                            </time>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{readingTime} phút đọc chuyên sâu</span>
                        </div>
                    </div>

                    {/* Scroll prompt */}
                    <div className="pt-4">
                        <button 
                            onClick={scrollToContent}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:border-[#00AFA9] text-gray-600 hover:text-[#00AFA9] bg-white transition-all animate-bounce cursor-pointer shadow-xs"
                            aria-label="Cuộn xuống đọc bài viết"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. STICKY UTILITY BAR */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 py-3">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                    {/* Audio Player */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAudio}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                                isPlaying 
                                    ? 'bg-[#00AFA9] text-white border-[#00AFA9]' 
                                    : 'bg-white text-[#007B77] border-gray-300 hover:border-[#00AFA9]'
                            }`}
                        >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>{isPlaying ? 'Tạm Dừng Nghe' : 'Nghe Giọng Đọc (AI)'}</span>
                        </button>

                        <button 
                            onClick={handleSpeedChange} 
                            className="text-xs font-bold text-gray-700 hover:text-gray-900 px-2.5 py-1 bg-gray-100 rounded cursor-pointer"
                            title="Tốc độ đọc"
                        >
                            {playbackRate}x
                        </button>
                    </div>

                    {/* Share & Print */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="In hoặc Lưu file PDF"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                            <span>{copied ? 'Đã Copy Link' : 'Chia Sẻ'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. MAIN ARTICLE FLOW */}
            <div id="emagazine-content-flow" className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
                <style jsx global>{`
                    .emagazine-prose {
                        font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        color: #1e293b;
                        line-height: 2;
                        font-size: 1.15rem;
                    }
                    .emagazine-prose:first-of-type p:first-of-type::first-letter {
                        font-family: var(--font-merriweather), Georgia, serif;
                        float: left;
                        font-size: 4.5rem;
                        line-height: 0.85;
                        font-weight: 900;
                        margin-top: 0.2rem;
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
                        font-size: 2rem;
                        font-weight: 800;
                        color: #0f172a;
                        margin-top: 4rem;
                        margin-bottom: 1.5rem;
                        line-height: 1.35;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 0.75rem;
                    }
                    .emagazine-prose strong {
                        color: #0f172a;
                        font-weight: 700;
                    }
                    .emagazine-prose em {
                        color: #475569;
                    }
                `}</style>

                {renderContentBlocks(post.content)}

                {/* 4. CHỮ KÝ ĐÓNG DẤU THƯƠNG HIỆU */}
                <div className="mt-20 pt-10 border-t-2 border-[#00AFA9] text-center space-y-3">
                    <img src="/logo-full.png" alt="LYHU" className="h-10 w-auto mx-auto object-contain" />
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#007B77] tracking-wider uppercase">
                        KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 italic max-w-xl mx-auto">
                        Kiến tạo giải pháp phân phối thực phẩm chính ngạch, đồng hành cùng sự thịnh vượng của mọi điểm bán lẻ Việt.
                    </p>
                </div>

                {/* 5. KHỐI 4 SẢN PHẨM HERO VÀ 4 CAM KẾT VÀNG */}
                <div className="mt-14">
                    <BlogProductGrid products={products} />
                </div>
            </div>
        </article>
    );
}
