import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Play, Clock, CalendarCheck, ListChecks } from 'lucide-react';
import VideoCard, { VideoItem, cleanTitle, fmtDuration, slotOf } from '@/components/blog/VideoCard';

export const dynamic = 'force-dynamic';
const PER_PAGE = 20;

export const metadata: Metadata = {
    title: 'Báo hình FMCG 24/7 - Bản tin video ngành hàng tiêu dùng | LYHU',
    description: 'Bản tin video ngắn về ngành FMCG, bán lẻ, tạp hóa, siêu thị mini. Mỗi ngày hai bản tin lúc 06:30 và 19:30, số liệu có kiểm chứng và việc nên làm.',
    alternates: { canonical: 'https://lyhu.com.vn/bao-hinh' },
};

export default async function BaoHinhPage({ searchParams }: { searchParams: { page?: string } }) {
    const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
        global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    });
    const from = (page - 1) * PER_PAGE;
    const { data, count } = await supabase
        .from('blog_posts')
        .select('id, title, slug, thumbnail_url, video_url, video_meta, ai_summary, published_at, created_at', { count: 'exact' })
        .eq('status', 'published')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, from + PER_PAGE - 1);

    const items = (data || []) as (VideoItem & { video_url: string; ai_summary: string | null })[];
    const totalPages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));
    const hero = page === 1 ? items[0] : null;
    const rest = hero ? items.slice(1) : items;

    // Gom theo ngày
    const groups: { label: string; list: typeof rest }[] = [];
    rest.forEach(v => {
        const d = new Date(v.published_at || v.created_at);
        const label = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        const g = groups.find(x => x.label === label);
        if (g) g.list.push(v); else groups.push({ label, list: [v] });
    });

    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00ABA9] via-[#009896] to-[#006B6A] text-white">
                <svg className="absolute -right-24 -top-24 w-[520px] opacity-[0.08]" viewBox="0 0 200 200" aria-hidden>
                    <g fill="#fff"><rect x="10" y="10" width="80" height="80" transform="rotate(45 50 50)"/><rect x="110" y="60" width="80" height="80" transform="rotate(45 150 100)"/></g>
                </svg>
                <div className="relative grid md:grid-cols-[1fr_auto] gap-8 md:gap-14 items-center p-6 sm:p-10 lg:p-14">
                    <div>
                        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] bg-white/15 rounded-full px-3.5 py-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8DC63F] animate-pulse" /> Báo hình · FMCG 24/7
                        </span>
                        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
                            Tin ngành FMCG<br /><span className="text-[#C6F08A]">trong 50 giây</span>
                        </h1>
                        <p className="mt-5 text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
                            Bản tin video dành cho chủ tạp hóa, nhà phân phối và người bán lẻ. Số liệu có kiểm chứng, nói gọn, kèm việc nên làm.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
                            <span className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2"><CalendarCheck className="w-4 h-4" /> Mỗi ngày 06:30 và 19:30</span>
                            <span className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2"><ListChecks className="w-4 h-4" /> Có việc nên làm</span>
                            <span className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2"><Clock className="w-4 h-4" /> Dưới 1 phút</span>
                        </div>
                        {hero && (
                            <div className="mt-8">
                                <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">{slotOf(hero.published_at || hero.created_at)} mới nhất</p>
                                <h2 className="text-xl sm:text-2xl font-bold leading-snug max-w-xl">{cleanTitle(hero.title)}</h2>
                                <Link href={`/tin-tuc/${hero.slug}`} className="mt-4 inline-flex items-center gap-2 bg-white text-[#007C7A] font-bold rounded-full px-6 py-3 hover:bg-[#F2FFF8] transition-colors">
                                    <Play className="w-4 h-4 fill-current" /> Xem kèm nội dung chính
                                </Link>
                            </div>
                        )}
                    </div>
                    {hero && (
                        <div className="justify-self-center w-[240px] sm:w-[280px] lg:w-[310px]">
                            <div className="rounded-[2rem] p-2 bg-white/20 shadow-2xl">
                                <div className="aspect-[9/16] rounded-[1.5rem] overflow-hidden bg-black">
                                    <video
                                        src={hero.video_url}
                                        poster={hero.video_meta?.poster_url || hero.thumbnail_url || undefined}
                                        controls playsInline preload="metadata"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            {hero.video_meta?.duration ? <p className="text-center text-xs text-white/70 mt-3">Thời lượng {fmtDuration(hero.video_meta.duration)}</p> : null}
                        </div>
                    )}
                </div>
            </section>

            {/* DANH SÁCH */}
            {items.length === 0 ? (
                <p className="mt-12 text-center text-gray-500">Chưa có bản tin video nào.</p>
            ) : (
                <div className="mt-12 space-y-12">
                    {groups.map(g => (
                        <section key={g.label}>
                            <h2 className="text-lg sm:text-xl font-extrabold text-[#2B4A52] capitalize border-l-4 border-[#8DC63F] pl-3 mb-5">{g.label}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                                {g.list.map(v => <VideoCard key={v.id} v={v} />)}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-3 text-sm font-bold">
                    {page > 1 && <Link href={`/bao-hinh?page=${page - 1}`} className="px-5 py-2.5 rounded-full border border-gray-200 hover:border-[#00ABA9] hover:text-[#00ABA9]">← Mới hơn</Link>}
                    <span className="text-gray-500">Trang {page}/{totalPages}</span>
                    {page < totalPages && <Link href={`/bao-hinh?page=${page + 1}`} className="px-5 py-2.5 rounded-full bg-[#00ABA9] text-white hover:bg-[#009690]">Cũ hơn →</Link>}
                </nav>
            )}

            <p className="mt-14 text-center text-sm text-gray-500">
                Muốn đọc kỹ hơn? <Link href="/tin-tuc" className="font-bold text-[#00ABA9] hover:underline">Xem toàn bộ tin tức ngành</Link>
            </p>
        </div>
    );
}
