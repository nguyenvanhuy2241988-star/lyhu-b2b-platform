"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem('lyhu_cookie_consent');
        if (!hasConsented) {
            // Small delay before showing
            const renderTimer = setTimeout(() => {
                setIsRendered(true);
                // Animate in
                setTimeout(() => setIsVisible(true), 50);
            }, 1500);
            return () => clearTimeout(renderTimer);
        }
    }, []);

    const handleAccept = () => {
        setIsVisible(false);
        setTimeout(() => {
            localStorage.setItem('lyhu_cookie_consent', 'true');
            setIsRendered(false);
        }, 300); // Wait for fade out animation
    };

    if (!isRendered) return null;

    return (
        <div 
            className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[420px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] p-5 flex flex-col gap-4 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="bg-primary-50 p-2.5 rounded-full shrink-0">
                    <ShieldAlert className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 text-base">Quyền riêng tư & Cookie</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Chúng tôi sử dụng Cookie và các công nghệ AI để phân tích hành vi, cá nhân hóa trải nghiệm và hiển thị nội dung phù hợp nhất dành riêng cho bạn.
                    </p>
                </div>
                <button 
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => setIsRendered(false), 300);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex gap-3 justify-end mt-1 pt-3 border-t border-gray-50">
                <button 
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => setIsRendered(false), 300);
                    }}
                    className="px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    Tùy chỉnh
                </button>
                <button 
                    onClick={handleAccept}
                    className="px-6 py-2 text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-sm hover:shadow transition-all"
                >
                    Đồng ý tất cả
                </button>
            </div>
        </div>
    );
}
