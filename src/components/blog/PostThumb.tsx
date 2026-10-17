import React from 'react';
import { Play } from 'lucide-react';

type Props = {
    post: { title: string; thumbnail_url: string | null; video_url?: string | null; is_video_vertical?: boolean; video_meta?: { poster_url?: string } | null };
    size?: 'lg' | 'sm';
};

/**
 * Ảnh đại diện trong khung ngang. Bài thường: phủ kín khung như cũ.
 * Bài video dọc: nền mờ cùng ảnh + ảnh dọc nằm trọn giữa khung (không cắt, không lệch),
 * kèm nhãn BÁO HÌNH ở góc.
 */
export default function PostThumb({ post, size = 'sm' }: Props) {
    const isVideo = !!post.video_url && /\.mp4(\?|$)/i.test(post.video_url);
    const src = (isVideo && post.video_meta?.poster_url) || post.thumbnail_url;
    if (!src) return null;
    if (!isVideo) {
        return <img src={src} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />;
    }
    const lg = size === 'lg';
    return (
        <div className="absolute inset-0 bg-[#0B3B3C]">
            <img src={src} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#00ABA9]/40 via-transparent to-[#8DC63F]/30" />
            <img src={src} alt={post.title} loading="lazy" decoding="async" className="relative mx-auto h-full w-auto max-w-full object-contain shadow-2xl" />
            <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 bg-[#00ABA9] text-white font-extrabold uppercase tracking-wider rounded-full shadow ${lg ? 'text-xs px-3 py-1.5' : 'text-[10px] px-2.5 py-1'}`}>
                <Play className={lg ? 'w-3.5 h-3.5 fill-current' : 'w-3 h-3 fill-current'} /> Báo hình
            </span>
            <span className={`absolute right-3 bottom-3 rounded-full bg-white/95 flex items-center justify-center shadow-lg ${lg ? 'w-14 h-14' : 'w-9 h-9'}`}>
                <Play className={`${lg ? 'w-6 h-6' : 'w-4 h-4'} text-[#00ABA9] fill-[#00ABA9] ml-0.5`} />
            </span>
        </div>
    );
}
