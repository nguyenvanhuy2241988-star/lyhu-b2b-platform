"use client";

import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Loader2, Maximize, Target, Circle, MonitorPlay, Film } from "lucide-react";
import { useCulture } from "@/components/culture/CultureProvider";

export default function EditableImage({ id, label = "Hình ảnh", className = "" }: { id: string, label?: string, className?: string }) {
    const { content, isEditMode, uploadImage, uploadingId, updateContent } = useCulture();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hover, setHover] = useState(false);

    // Retrieve settings
    const imageUrl = content[id] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3E%C3%81nh tr%E1%BB%91ng%3C/text%3E%3C/svg%3E";
    const shape = content[`${id}_shape`] || 'default';
    const size = content[`${id}_size`] || 'default';
    const sharp = content[`${id}_sharp`] === true; // No border radius

    // Process Shape
    let dynamicClasses = "";
    if (shape === 'square') dynamicClasses += " !aspect-square";
    else if (shape === 'video') dynamicClasses += " !aspect-video";
    else if (shape === 'cinema') dynamicClasses += " !aspect-[21/9]";
    else if (shape === 'portrait') dynamicClasses += " !aspect-[3/4]";
    else if (shape === 'circle') dynamicClasses += " !aspect-square !rounded-full !overflow-hidden";

    if (!sharp && shape !== 'circle') {
        dynamicClasses += " rounded-2xl"; // default soft borders in new LYHU minimal
    } else if (sharp) {
        dynamicClasses += " !rounded-none"; // force sharp
    }

    // Process Size
    if (size === 'sm') dynamicClasses += " !max-w-[150px] !mx-auto";
    else if (size === 'md') dynamicClasses += " !max-w-[300px] !mx-auto";
    else if (size === 'lg') dynamicClasses += " !max-w-[500px] !mx-auto";
    else if (size === 'full') dynamicClasses += " !w-full";

    const isUploading = uploadingId === id;
    const finalClasses = `${className} ${dynamicClasses}`.trim();

    const handleFile = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadImage(id, file);
        }
    };

    if (!isEditMode) {
        if (!content[id]) return null;
        return (
            <div className={`relative overflow-hidden flex items-center justify-center ${finalClasses}`}>
                <img src={imageUrl} alt={label} className={`absolute inset-0 w-full h-full object-cover outline-none ${shape === 'circle' ? '!rounded-full' : (sharp ? '!rounded-none' : 'rounded-2xl')}`} />
            </div>
        );
    }

    return (
        <div 
            className={`relative overflow-hidden cursor-pointer flex items-center justify-center group ${finalClasses} ${hover ? 'ring-2 ring-teal-500' : 'ring-1 ring-slate-300 border-dashed border-2'}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={(e) => {
                // Prevent bubbling to DND if we click the wrapper but not the buttons
                if ((e.target as HTMLElement).closest('.settings-panel')) return;
                fileInputRef.current?.click();
            }}
        >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
            
            {/* Absolute constraint layer to prevent parent box scaling */}
            <div className="absolute inset-0 z-0">
                 <img src={imageUrl} alt={label} className={`w-full h-full object-cover opacity-60 ${shape === 'circle' ? '!rounded-full' : (sharp ? '!rounded-none' : 'rounded-2xl')}`} />
            </div>

            {/* Upload Indicator overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none p-4 w-full h-full bg-slate-900/30 group-hover:bg-slate-900/40 transition-colors">
                {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <UploadCloud className="w-8 h-8 text-white drop-shadow-md" />}
                <div className="text-white text-xs font-bold mt-2 drop-shadow-md tracking-wider uppercase text-center">{label}</div>
            </div>

            {/* Float Settings Panel */}
            <div className="settings-panel absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl border border-slate-200 rounded-xl p-2 z-20 flex gap-4 text-xs font-medium text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap scale-90 sm:scale-100 origin-bottom" onClick={(e) => e.stopPropagation()}>
                
                {/* Size Controls */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 shadow-inner">
                    {['sm', 'md', 'lg', 'full', 'default'].map(s => (
                        <div 
                            key={s} 
                            onClick={() => updateContent(`${id}_size`, s === 'default' ? null : s)}
                            className={`px-3 py-1.5 cursor-pointer rounded-md transition-colors ${size === s || (s === 'default' && !size) ? 'bg-white shadow relative text-teal-700 font-bold' : 'hover:bg-slate-200 text-slate-500'}`}
                        >
                            {s === 'full' ? '100%' : (s === 'default' ? 'MĐ' : s.toUpperCase())}
                        </div>
                    ))}
                </div>

                {/* Shape Controls */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 shadow-inner">
                    {[
                        {v:'square', icon: Maximize, title: "Vuông"}, 
                        {v:'portrait', icon: Film, title: "Dọc A4"}, 
                        {v:'video', icon: MonitorPlay, title: "Ngang"}, 
                        {v:'cinema', icon: Target, title: "Banner"}, 
                        {v:'circle', icon: Circle, title: "Tròn"}, 
                        {v:'default', icon: null, title: "MĐ"}
                    ].map(s => (
                        <div 
                            key={s.v} 
                            title={s.title}
                            onClick={() => updateContent(`${id}_shape`, s.v === 'default' ? null : s.v)}
                            className={`px-2 py-1.5 cursor-pointer rounded-md transition-colors flex items-center justify-center ${shape === s.v || (s.v === 'default' && !shape) ? 'bg-white shadow relative text-teal-700 font-bold' : 'hover:bg-slate-200 text-slate-500'}`}
                        >
                            {s.icon ? <s.icon className="w-4 h-4" /> : 'MĐ'}
                        </div>
                    ))}
                </div>

                {/* Sharp Border Controls */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 shadow-inner">
                    <div 
                        onClick={() => updateContent(`${id}_sharp`, !sharp)}
                        className={`px-3 py-1.5 cursor-pointer rounded-md transition-colors ${sharp ? 'bg-indigo-600 shadow text-white font-bold' : 'hover:bg-slate-200 text-slate-600'}`}
                        title="Tắt bo góc (Sắc nét)"
                    >
                        # Góc Vuông
                    </div>
                </div>

            </div>
        </div>
    );
}
