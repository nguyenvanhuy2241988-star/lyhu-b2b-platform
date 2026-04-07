"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, GripVertical, Trash2, Edit2, LayoutTemplate } from "lucide-react";
import { useCulture } from "./CultureProvider";
import BlockRenderer from "./BlockRenderer";

export default function CultureMain({ activeTab }: { activeTab: string }) {
    const { content, updateContent, isEditMode } = useCulture();

    // pages is an object: { tabId: [block1, block2] }
    const pages = content.pages || {};
    const blocks = pages[activeTab] || [];

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        
        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        
        if (sourceIndex === destIndex) return;

        const newBlocks = Array.from(blocks);
        const [movedBlock] = newBlocks.splice(sourceIndex, 1);
        newBlocks.splice(destIndex, 0, movedBlock);

        const newPages = {
            ...pages,
            [activeTab]: newBlocks
        };

        updateContent("pages", newPages);
    };

    const addBlock = (type: string) => {
        const newBlock = {
            id: `b_${Date.now()}`,
            type: type
        };
        const newBlocks = [...blocks, newBlock];
        updateContent("pages", { ...pages, [activeTab]: newBlocks });
    };

    const removeBlock = (blockId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa khối này?")) return;
        const newBlocks = blocks.filter((b: any) => b.id !== blockId);
        updateContent("pages", { ...pages, [activeTab]: newBlocks });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-y-auto scrollbar-thin">
            <div className="max-w-5xl mx-auto w-full p-6 md:p-10 lg:p-14 pb-32">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={`drop_${activeTab}`}>
                        {(provided) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                className="space-y-8 animate-in fade-in duration-500"
                            >
                                {blocks.map((block: any, index: number) => (
                                    <Draggable 
                                        key={block.id} 
                                        draggableId={block.id} 
                                        index={index}
                                        isDragDisabled={!isEditMode}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`relative group rounded-3xl transition-all ${
                                                    snapshot.isDragging ? 'shadow-xl ring-2 ring-teal-500 z-50 bg-white' : ''
                                                }`}
                                            >
                                                {/* DND Drag Handle */}
                                                {isEditMode && (
                                                    <div 
                                                        className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <GripVertical className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}

                                                {/* Delete Button */}
                                                {isEditMode && (
                                                    <div 
                                                        className="absolute -right-4 -top-4 p-2 bg-red-50 text-red-600 border border-red-100 rounded-full shadow-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100"
                                                        onClick={() => removeBlock(block.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </div>
                                                )}

                                                <BlockRenderer block={block} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {isEditMode && (
                    <div className="mt-12 p-8 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-teal-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2">Thêm Mảng Tổ Chức Trực Quan</h4>
                        <p className="text-slate-500 text-sm mb-6 max-w-sm">Chọn một loại bố cục mẫu dưới đây để nhúng thả thêm nội dung mới vào bộ cẩm nang.</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button onClick={() => addBlock('HERO_BANNER')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-teal-400 hover:text-teal-700 transition">Banner Tiêu Đề Cỡ Lớn</button>
                            <button onClick={() => addBlock('SPLIT_TEXT')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-teal-400 hover:text-teal-700 transition">Khối Text & Ảnh Song Song</button>
                            <button onClick={() => addBlock('GRID_NUMBERS')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-teal-400 hover:text-teal-700 transition">Lưới Block Gắn Icon To</button>
                            <button onClick={() => addBlock('QUOTE')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-teal-400 hover:text-teal-700 transition">Câu Trích Dẫn Bay Bổng</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
