import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

type RailItem = {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    video_meta?: { duration?: number; poster_url?: string } | null;
    published_at?: string | null;
    created_at: string;
};

function fmtDuration(sec?: number) {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** Dải "Báo hình": các bản tin video dọc 9:16 mới nhất. Server component. */
export default function BaoHinhRail({ items }: { items: RailItem[] }) {
    if (!items || items.length === 0) return null;
    return (
        <section className="mb-10 pb-8 border-b border-gray-200" aria-label="Báo hình FMCG 24/7">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-[#8DC63F] pl-3 flex items-center gap-2">
                    Báo hình <span className="text-[#00ABA9]">FMCG 24/7</span>
                </h3>
                <Link href="/tin-tuc?type=video" className="text-sm font-semibold text-[#00ABA9] hover:text-[#009690]">
                    Xem tất cả
                </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-1 px-1">
                {items.map(v => {
                    const poster = v.video_meta?.poster_url || v.thumbnail_url;
                    const dur = fmtDuration(v.video_meta?.duration);
                    return (
                        <Link
                            key={v.id}
                            href={`/tin-tuc/${v.slug}`}
                            className="group snap-start shrink-0 w-[150px] sm:w-[170px]"
                        >
                            <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-[#E6F6F5]">
                                {poster ? (
                                    <img src={poster} alt={v.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#00ABA9]/50 font-bold">LYHU</div>
                                )}
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-11 h-11 rounded-full bg-[#00ABA9]/90 flex items-center justify-center shadow">
                                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                    </span>
                                </span>
                                {dur && (
                                    <span className="absolute right-2 bottom-2 bg-black/70 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">
                                        {dur}
                                    </span>
                                )}
                            </div>
                            <h4 className="mt-2 text-sm font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-[#00ABA9]">
                                {v.title.replace(/^Bản tin FMCG 24\/7:\s*/i, '')}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(v.published_at || v.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
