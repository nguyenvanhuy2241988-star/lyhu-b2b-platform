
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LinkPreviewProps {
    url: string;
}

interface MetaData {
    title: string;
    description?: string;
    image?: string;
    siteName?: string;
    url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
    const [data, setData] = useState<MetaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
                if (mounted) {
                    if (json.error) {
                        setError(true);
                    } else {
                        setData(json);
                    }
                }
            } catch (err) {
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [url]);

    if (error) return null; // Don't show anything if failed

    if (loading) {
        return (
            <div className="mt-2 w-full max-w-sm bg-slate-50 rounded-lg border border-slate-200 p-2 animate-pulse flex gap-2">
                <div className="w-16 h-16 bg-slate-200 rounded shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block w-full max-w-sm bg-white rounded-lg border border-slate-200 overflow-hidden hover:bg-slate-50 hover:shadow-sm transition-all group/card text-left"
        >
            <div className="flex">
                {/* Image on the left if small/square, or logic for large image? 
                    Let's stick to a sidebar image layout for compactness in chat. 
                */}
                {data.image && (
                    <div className="w-24 h-24 shrink-0 bg-slate-100 relative overflow-hidden">
                        <Image
                            src={data.image}
                            alt={data.title}
                            fill
                            className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}
                <div className="p-3 flex flex-col justify-center min-w-0">
                    <h4 className="font-semibold text-sm text-slate-800 line-clamp-2 leading-tight mb-1">{data.title}</h4>
                    {data.description && <p className="text-xs text-slate-500 line-clamp-2 mb-1">{data.description}</p>}
                    <span className="text-[10px] text-slate-400 uppercase font-medium">{data.siteName || new URL(data.url).hostname}</span>
                </div>
            </div>
        </a>
    );
}
