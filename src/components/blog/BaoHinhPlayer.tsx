'use client';
import React, { useRef } from 'react';

type Chapter = { t: string; label: string };

function toSec(t: string) {
    const [m, s] = t.split(':').map(Number);
    return (m || 0) * 60 + (s || 0);
}

/** Trình phát video dọc + danh sách "Nội dung chính" bấm để nhảy tới đoạn. */
export default function BaoHinhPlayer({ src, poster, chapters }: { src: string; poster?: string; chapters?: Chapter[] }) {
    const ref = useRef<HTMLVideoElement>(null);
    const seek = (t: string) => {
        const v = ref.current;
        if (!v) return;
        v.currentTime = toSec(t);
        v.play().catch(() => {});
    };
    return (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-6 items-start">
            <div className="w-full max-w-[360px] mx-auto md:mx-0 aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-lg">
                <video ref={ref} src={src} poster={poster} controls playsInline preload="metadata" className="w-full h-full object-contain" />
            </div>
            {chapters && chapters.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-[#2B4A52] mb-3 border-l-4 border-[#8DC63F] pl-3">Nội dung chính</h2>
                    <ol className="space-y-2">
                        {chapters.map((c, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={() => seek(c.t)}
                                    className="w-full text-left flex items-center gap-3 rounded-lg border border-gray-100 bg-[#E6F6F5]/50 hover:bg-[#E6F6F5] px-3 py-2.5 transition-colors"
                                >
                                    <span className="shrink-0 text-xs font-bold text-white bg-[#00ABA9] rounded px-2 py-1 tabular-nums">{c.t}</span>
                                    <span className="text-sm font-semibold text-[#2B4A52]">{c.label}</span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
