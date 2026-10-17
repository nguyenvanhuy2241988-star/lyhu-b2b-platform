import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

export type VideoItem = {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    video_meta?: { duration?: number; poster_url?: string } | null;
    published_at?: string | null;
    created_at: string;
};

export function fmtDuration(sec?: number) {
    if (!sec) return '';
    return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}

export function slotOf(iso: string) {
    const h = Number(new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hour12: false }));
    return h < 12 ? 'Bản tin sáng' : 'Bản tin tối';
}

export function cleanTitle(t: string) {
    return t.replace(/^Bản tin FMCG 24\/7:\s*/i, '');
}

/** Thẻ video dọc 9:16: tiêu đề đè lên ảnh, nhãn buổi sáng/tối, thời lượng. */
export default function VideoCard({ v }: { v: VideoItem }) {
    const poster = v.video_meta?.poster_url || v.thumbnail_url;
    const when = v.published_at || v.created_at;
    const dur = fmtDuration(v.video_meta?.duration);
    return (
        <Link href={`/tin-tuc/${v.slug}`} className="group relative block aspect-[9/16] rounded-2xl overflow-hidden bg-[#0B3B3C] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {poster && <img src={poster} alt={v.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
            <span className="absolute left-3 top-3 text-[11px] font-extrabold uppercase tracking-wide bg-[#8DC63F] text-[#1c3a1c] px-2.5 py-1 rounded-full">
                {slotOf(when)}
            </span>
            {dur && <span className="absolute right-3 top-3 text-[11px] font-bold bg-black/60 text-white px-2 py-1 rounded-full">{dur}</span>}
            <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-[#00ABA9] fill-[#00ABA9] ml-0.5" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3.5">
                <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-3">{cleanTitle(v.title)}</h3>
                <p className="text-white/70 text-xs mt-1.5">
                    {new Date(when).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </p>
            </div>
        </Link>
    );
}
