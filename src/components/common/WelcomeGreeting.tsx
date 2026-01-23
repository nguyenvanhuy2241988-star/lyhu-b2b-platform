"use client";

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Smile, Sparkles } from 'lucide-react';

export const WelcomeGreeting = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Check LocalStorage
        const todayStr = new Date().toLocaleDateString('vi-VN'); // e.g. "23/01/2026"
        const lastWelcomeDate = localStorage.getItem('lyhu_last_welcome_date');

        if (lastWelcomeDate !== todayStr) {
            // New day or first login
            setIsVisible(true);

            // Mark as seen immediately to avoid loop if user reloads
            localStorage.setItem('lyhu_last_welcome_date', todayStr);

            // 2. Fire Confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#00afa9', '#98c93c', '#ffffff'] // LYHU colors
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#00afa9', '#98c93c', '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // 3. Auto hide popup
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-all animate-in fade-in duration-500">
            <div
                className="relative overflow-hidden rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-500 max-w-md w-full"
            >
                {/* Gradient Background: Primary -> Secondary */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 opacity-95"></div>

                {/* Decorative Circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                <div className="relative p-8 text-center text-white">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                            <Sparkles className="w-8 h-8 text-yellow-200 animate-pulse" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-2 tracking-tight drop-shadow-md">
                        Welcome to LYHU Platform
                    </h2>

                    {/* Message */}
                    <p className="text-white/90 text-lg font-medium leading-relaxed flex items-center justify-center gap-2 drop-shadow">
                        Chúc bạn một ngày làm việc vui vẻ và hiệu quả!!!
                        <Smile className="w-5 h-5 inline-block text-yellow-300" />
                    </p>

                    {/* Progress strip to indicate auto-close */}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                        <div className="h-full bg-white w-full animate-[shrink_3.5s_linear_forwards] origin-left"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
