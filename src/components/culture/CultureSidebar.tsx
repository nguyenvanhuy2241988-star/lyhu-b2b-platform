"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { BookOpen, Sparkles, Plus, Edit2, Check, Trash2, GripVertical } from "lucide-react";
import { useCulture } from "./CultureProvider";

// Mapping string icons to Lucide components
import * as Icons from "lucide-react";

export default function CultureSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
    const { content, updateContent, isEditMode } = useCulture();
    const tabs = content.tabs || [];
    
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        
        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        if (sourceIndex === destIndex) return;

        const newTabs = Array.from(tabs);
        const [movedTab] = newTabs.splice(sourceIndex, 1);
        newTabs.splice(destIndex, 0, movedTab);

        updateContent("tabs", newTabs);
    };

    const addTab = () => {
        const newTab = {
            id: `t_${Date.now()}`,
            label: "Mục Mới",
            icon: "Feather"
        };
        const newTabs = [...tabs, newTab];
        updateContent("tabs", newTabs);
        
        // Ensure its pages array is initialized
        const newPages = { ...(content.pages || {}), [newTab.id]: [] };
        updateContent("pages", newPages);

        setActiveTab(newTab.id);
        startEdit(newTab.id, "Mục Mới");
    };

    const removeTab = (tabId: string) => {
        if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn menu này và TẤT CẢ nội dung bên trong nó?`)) return;
        const newTabs = tabs.filter((t: any) => t.id !== tabId);
        updateContent("tabs", newTabs);
        
        // Select nearest tab
        if (activeTab === tabId && newTabs.length > 0) {
            setActiveTab(newTabs[0].id);
        }
    };

    const startEdit = (id: string, currentLabel: string) => {
        setEditingTabId(id);
        setEditLabel(currentLabel);
    };

    const saveEdit = (id: string) => {
        const newTabs = tabs.map((t: any) => t.id === id ? { ...t, label: editLabel } : t);
        updateContent("tabs", newTabs);
        setEditingTabId(null);
    };

    const renderIcon = (iconName: string, className: string, style: any) => {
        const IconComponent = (Icons as any)[iconName] || Icons.FileText;
        return <IconComponent className={className} style={style} />;
    };

    return (
        <div className="w-72 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-full z-10 hidden md:flex">
            <div className="p-6 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2.5 text-slate-800 font-bold uppercase tracking-widest text-[13px]">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span>Cẩm Nang Hạt Nhân</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="tabsList">
                        {(provided) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                className="space-y-1"
                            >
                                {tabs.map((tab: any, index: number) => {
                                    const isActive = tab.id === activeTab;
                                    const isEditing = editingTabId === tab.id;

                                    return (
                                        <Draggable 
                                            key={tab.id} 
                                            draggableId={tab.id} 
                                            index={index}
                                            isDragDisabled={!isEditMode}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 relative ${
                                                        isActive 
                                                        ? "bg-white text-slate-900 border border-slate-200 shadow-sm font-semibold" 
                                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                                                    } ${snapshot.isDragging ? 'shadow-lg ring-2 ring-teal-500 z-50 bg-white' : ''}`}
                                                    onClick={() => !isEditing && setActiveTab(tab.id)}
                                                >
                                                    {/* Drag Handle */}
                                                    {isEditMode && (
                                                        <div 
                                                            className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            {...provided.dragHandleProps}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                                        {renderIcon(tab.icon, "w-4 h-4 shrink-0 transition-colors", { color: isActive ? '#04ACA9' : '#94a3b8' })}
                                                        
                                                        {isEditing ? (
                                                            <div className="flex-1 flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                                                                <input 
                                                                    autoFocus
                                                                    value={editLabel}
                                                                    onChange={e => setEditLabel(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(tab.id)}
                                                                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-teal-500"
                                                                />
                                                                <Check className="w-4 h-4 text-emerald-600 cursor-pointer shrink-0" onClick={() => saveEdit(tab.id)} />
                                                            </div>
                                                        ) : (
                                                            <span className="text-[14px] truncate">{tab.label}</span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Action Buttons for Edit Mode */}
                                                    {isEditMode && !isEditing && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-teal-600" onClick={(e) => { e.stopPropagation(); startEdit(tab.id, tab.label); }} />
                                                            {tabs.length > 1 && (
                                                                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600 ml-1" onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }} />
                                                            )}
                                                        </div>
                                                    )}

                                                    {!isEditMode && (
                                                        <Icons.ArrowRight className={`w-4 h-4 transition-all shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 -translate-x-2'}`} style={{ color: isActive ? '#04ACA9' : '' }} />
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                
                {isEditMode && (
                    <div 
                        onClick={addTab}
                        className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 cursor-pointer transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Tạo Tab Mới</span>
                    </div>
                )}
            </div>
        </div>
    );
}
