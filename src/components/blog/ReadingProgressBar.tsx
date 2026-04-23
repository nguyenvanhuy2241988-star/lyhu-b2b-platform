'use client';

import React, { useEffect, useState } from 'react';

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateScroll = () => {
            const currentScroll = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight) {
                setProgress(Number((currentScroll / scrollHeight).toFixed(2)) * 100);
            }
        };

        window.addEventListener('scroll', updateScroll);
        return () => window.removeEventListener('scroll', updateScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-200 z-50">
            <div 
                className="h-full bg-primary-500 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
