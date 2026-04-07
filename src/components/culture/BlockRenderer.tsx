"use client";

import React from "react";
import EditableImage from "@/app/(dashboard)/culture/EditableImage";
import EditableText from "@/app/(dashboard)/culture/EditableText";
import { useCulture } from "./CultureProvider";

export default function BlockRenderer({ block }: { block: any }) {
    const { content } = useCulture();
    // Default configs fallback to the block.config from defaults, but the ACTUAL live text and image URLs are stored in the flat ROOT content dictionary!
    const baseId = block.id;

    if (block.type === 'HERO_BANNER') {
        return (
            <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200">
                <EditableImage id={`${baseId}_img`} className="aspect-[21/9] lg:aspect-[3/1] w-full !border-none !rounded-none opacity-90 object-cover" label="Ảnh nền dải băng" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/30 z-10 pointer-events-none">
                    <h2 className="text-3xl md:text-5xl lg:text-6xl text-white font-black uppercase tracking-widest mb-4 inline-block pointer-events-auto mix-blend-normal">
                        <EditableText id={`${baseId}_title`} defaultText={block.config?.title || "TIÊU ĐỀ LỚN"} />
                    </h2>
                    <p className="text-lg md:text-2xl font-medium tracking-wide text-white/90 inline-block pointer-events-auto drop-shadow-md">
                        <EditableText id={`${baseId}_sub`} defaultText={block.config?.subtitle || "Một câu slogan súc tích đi kèm..."} />
                    </p>
                </div>
            </div>
        );
    }

    if (block.type === 'SPLIT_TEXT') {
        return (
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-12 items-center hover:border-slate-200 transition-colors">
                <div className="w-full xl:w-5/12">
                    <EditableImage id={`${baseId}_img`} className="aspect-[4/3] w-full p-2 bg-slate-50 border border-slate-100 rounded-3xl" label="Ảnh Đại Diện Nhóm" />
                </div>
                <div className="w-full xl:w-7/12 space-y-6">
                    <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight uppercase">
                        <EditableText id={`${baseId}_title`} defaultText={block.config?.title || "TIÊU ĐỀ CHÍNH CỦA BÀI VIẾT"} />
                    </h3>
                    {/* Only show teal separator if subtitle exists or is left blank. But editable text needs to be clickable. */}
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-4">
                        <EditableText id={`${baseId}_sub`} defaultText={block.config?.subtitle || "Phụ đề nhỏ màu xám (xóa nếu không cần)"} />
                    </p>
                    <div className="h-1 w-16 rounded bg-teal-500" />
                    <p className="text-slate-600 text-lg leading-relaxed pt-2">
                        <EditableText id={`${baseId}_desc_1`} multiline defaultText={block.config?.desc1 || "Đoạn văn bản giải thích cốt lõi số 1..."} />
                    </p>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        <EditableText id={`${baseId}_desc_2`} multiline defaultText={block.config?.desc2 || "Đoạn văn bản giải thích cốt lõi số 2..."} />
                    </p>
                </div>
            </div>
        );
    }

    if (block.type === 'GRID_NUMBERS') {
        const items = block.config?.items || Array(4).fill({ title: "Tiêu đề hộp", desc: "Nội dung hộp" });
        return (
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 mt-4 hover:border-slate-200 transition-colors">
                <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                    <EditableText id={`${baseId}_grid_title`} defaultText={block.config?.title || "Tiêu đề lớn hệ sinh thái lưới"} />
                </h2>
                <div className="h-1 w-16 rounded bg-teal-500 mb-10 mt-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {items.map((_: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex gap-6 hover:shadow-md transition-shadow group">
                            <div className="w-20 lg:w-24 shrink-0">
                                <EditableImage id={`${baseId}_grid_img_${idx}`} className="w-full aspect-square bg-white rounded-xl shadow-sm border border-slate-200 p-2" label={`Icon Lưới ${idx+1}`} />
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="text-xl font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                    <EditableText id={`${baseId}_grid_t_${idx}`} defaultText={items[idx]?.title || `Tiêu đề Hộp ${idx+1}`} />
                                </h4>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    <EditableText id={`${baseId}_grid_d_${idx}`} multiline defaultText={items[idx]?.desc || `Mô tả ngắn gọn, súc tích gọn gàng cho mảng chức năng này.`} />
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (block.type === 'QUOTE') {
        return (
            <div className="mt-8 bg-slate-900 text-white p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-lg border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
                
                <div className="relative z-10 text-xl md:text-2xl tracking-wide font-light leading-relaxed italic text-center px-4 md:px-12">
                    <p className="text-teal-300 font-medium">
                        " <EditableText id={`${baseId}_quote_tex`} multiline defaultText={block.config?.text || "Ghi một câu nói đầy cảm hứng của tỷ phú hay của lãnh đạo bạn vào đây. Dấu ngoặc kép đã được đặt tự động."} /> "
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-lg">Unknown block type: {block.type}</div>
    );
}
