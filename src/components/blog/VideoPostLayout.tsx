import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ChevronRight, ClipboardCheck } from 'lucide-react';
import BaoHinhPlayer from './BaoHinhPlayer';
import ShareButtons from './ShareButtons';
import ViewCounter from './ViewCounter';
import VideoCard from './VideoCard';

/** Điều kiện dùng bố cục bản tin video: file mp4 dọc do pipeline Báo hình đăng. */
export function isBaoHinhPost(post: any): boolean {
    return !!post?.video_url && /\.mp4(\?|$)/i.test(post.video_url) && !!post.is_video_vertical;
}

export default async function VideoPostLayout({ post, postUrl, jsonLd }: { post: any; postUrl: string; jsonLd: any[] }) {
    const meta = (post.video_meta || {}) as {
        duration?: number; chapters?: { t: string; label: string }[]; transcript?: string[]; poster_url?: string; do_this?: string;
    };
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    const { data: more } = await supabase
        .from('blog_posts')
        .select('id, title, slug, thumbnail_url, video_meta, published_at, created_at')
        .eq('status', 'published')
        .not('video_url', 'is', null)
        .neq('id', post.id)
        .order('created_at', { ascending: false })
        .limit(8);

    return (
        <div className="bg-white min-h-screen pb-16">
            <ViewCounter postId={post.id} />
            {jsonLd.filter(Boolean).map((j, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
            ))}
            <nav className="border-b border-gray-100 bg-gray-50/50 py-3 hidden md:block">
                <ol className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center space-x-2 text-sm text-gray-500">
                    <li><Link href="/" className="hover:text-[#00ABA9]">Trang chủ</Link></li>
                    <li><ChevronRight className="w-3.5 h-3.5" /></li>
                    <li><Link href="/tin-tuc" className="hover:text-[#00ABA9]">Tin tức</Link></li>
                    <li><ChevronRight className="w-3.5 h-3.5" /></li>
                    <li><Link href="/bao-hinh" className="hover:text-[#00ABA9] font-medium">Báo hình</Link></li>
                </ol>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-white bg-[#00ABA9] rounded px-2.5 py-1 mb-3">
                    Báo hình FMCG 24/7
                </span>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#2B4A52] leading-snug mb-3">{post.title}</h1>
                <p className="text-sm text-gray-500 mb-6">
                    {new Date(post.published_at || post.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>

                <BaoHinhPlayer
                    src={post.video_url}
                    poster={meta.poster_url || post.thumbnail_url || undefined}
                    chapters={meta.chapters}
                />

                {post.ai_summary && (
                    <p className="mt-8 text-lg text-[#2B4A52] leading-relaxed border-l-4 border-[#8DC63F] pl-4">{post.ai_summary}</p>
                )}

                <div className="mt-6"><ShareButtons url={postUrl} title={post.title} /></div>

                {meta.do_this && (
                    <section className="mt-8 rounded-xl bg-[#E6F6F5] border border-[#00ABA9]/20 p-5">
                        <h2 className="text-lg font-bold text-[#2B4A52] mb-2 flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-[#00ABA9]" /> Việc nên làm
                        </h2>
                        <p className="text-[#2B4A52] leading-relaxed">{meta.do_this}</p>
                    </section>
                )}

                <article
                    className="prose prose-base sm:prose-lg prose-slate max-w-none mt-8 prose-headings:text-[#2B4A52] prose-p:text-gray-800"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {meta.transcript && meta.transcript.length > 0 && (
                    <details className="mt-8 rounded-xl border border-gray-200 p-5 group">
                        <summary className="cursor-pointer font-bold text-[#2B4A52]">Lời thoại trong video</summary>
                        <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
                            {meta.transcript.map((l, i) => <p key={i}>{l}</p>)}
                        </div>
                    </details>
                )}

                {more && more.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-extrabold text-[#2B4A52] border-l-4 border-[#8DC63F] pl-3">Bản tin khác</h2>
                            <Link href="/bao-hinh" className="text-sm font-bold text-[#00ABA9] hover:underline">Vào Báo hình</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
                            {more.slice(0, 4).map((v: any) => <VideoCard key={v.id} v={v} />)}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
