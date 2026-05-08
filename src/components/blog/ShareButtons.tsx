'use client';

import React, { useState } from 'react';
import { Share2, Facebook, Copy, Check, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
    url: string;
    title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToZalo = () => {
        window.open(
            `https://zalo.me/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
            '_blank'
        );
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <Share2 className="w-4 h-4" />
                    Chia sẻ:
                </span>
                
                <button
                    onClick={shareToFacebook}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#166FE5] transition-colors"
                    title="Chia sẻ lên Facebook"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                </button>

                <button
                    onClick={shareToZalo}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0068FF] text-white text-sm font-medium rounded-lg hover:bg-[#0054CC] transition-colors"
                    title="Chia sẻ qua Zalo"
                >
                    <MessageCircle className="w-4 h-4" />
                    Zalo
                </button>

                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        copied 
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                    title="Sao chép đường dẫn"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Đã sao chép!' : 'Sao chép link'}
                </button>
            </div>
        </div>
    );
}
