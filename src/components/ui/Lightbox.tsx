import Image from "next/image";
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
            <div className="relative w-[90vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <Image
                    src={src}
                    alt={alt || "Full screen preview"}
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        </div>
    );
}
