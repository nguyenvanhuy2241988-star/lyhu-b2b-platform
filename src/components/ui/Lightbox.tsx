"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface LightboxProps {
    src: string;
    alt?: string;
    onClose: () => void;
}

export function Lightbox({ src, alt, onClose }: LightboxProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-8 h-8" />
            </button>
            <img
                src={src}
                alt={alt || "Full screen preview"}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
