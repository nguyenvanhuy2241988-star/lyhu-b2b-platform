"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/components/auth/AuthProvider";
import RichTextEditor from "@/components/ui/RichTextEditor";
import DOMPurify from "isomorphic-dompurify";
import { 
    Plus, 
    Pencil, 
    Trash2, 
    Save, 
    X,
    BookOpen,
    AlignLeft
} from "lucide-react";
import { 
    CultureSection, 
    getCultureSections, 
    createCultureSection, 
    updateCultureSection, 
    deleteCultureSection 
} from "@/lib/cultureStore";

export default function CulturePage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    const [sections, setSections] = useState<CultureSection[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Editor states
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await getCultureSections();
            setSections(data);
            if (data.length > 0 && !activeSectionId) {
                setActiveSectionId(data[0].id);
            }
        } catch (error) {
            console.error("Lỗi khi tải Danh mục Văn hóa:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSection = async () => {
        const title = window.prompt("Nhập tên danh mục mới (vd: Tầm nhìn & Sứ mệnh):");
        if (!title?.trim()) return;

        try {
            const newIndex = sections.length;
            const newSection = await createCultureSection(title.trim(), newIndex);
            setSections([...sections, newSection]);
            setActiveSectionId(newSection.id);
        } catch (error) {
            alert("Đã xảy ra lỗi khi tạo nhanh mục mới.");
            console.error(error);
        }
    };

    const handleRenameSection = async (id: string, currentTitle: string) => {
        const newTitle = window.prompt("Nhập tên danh mục mới:", currentTitle);
        if (!newTitle?.trim() || newTitle === currentTitle) return;

        try {
            await updateCultureSection(id, { title: newTitle.trim() });
            setSections(sections.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s));
        } catch (error) {
            alert("Lỗi đổi tên!");
        }
    };

    const handleDeleteSection = async (id: string, title: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn chuyên mục "${title}"?`)) return;

        try {
            await deleteCultureSection(id);
            const remaining = sections.filter(s => s.id !== id);
            setSections(remaining);
            if (activeSectionId === id) {
                setActiveSectionId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch (error) {
            alert("Lỗi xóa danh mục.");
        }
    };

    const handleStartEdit = (content: string) => {
        setEditContent(content);
        setIsEditing(true);
    };

    const handleSaveEdit = async (id: string) => {
        try {
            setIsSaving(true);
            await updateCultureSection(id, { content: editContent });
            setSections(sections.map(s => s.id === id ? { ...s, content: editContent } : s));
            setIsEditing(false);
        } catch (error) {
            alert("Lỗi lưu nội dung. Vui lòng thử lại!");
        } finally {
            setIsSaving(false);
        }
    };

    const activeSection = sections.find(s => s.id === activeSectionId);

    return (
        <DashboardShell title="Văn hóa doanh nghiệp">
            <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white shadow-sm rounded-2xl border border-slate-200">
                
                {/* LEFT SIDEBAR (Slider) */}
                <div className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                            <span>Mục Lục</span>
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={handleAddSection}
                                className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors"
                                title="Thêm mục mới"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                        {isLoading ? (
                            <div className="text-center py-4 text-slate-400 text-sm">Đang tải...</div>
                        ) : sections.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">Chưa có danh mục nào.</div>
                        ) : (
                            sections.map((section) => {
                                const isActive = section.id === activeSectionId;
                                return (
                                    <div 
                                        key={section.id}
                                        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all \${
                                            isActive 
                                            ? "bg-indigo-50 text-indigo-700 font-medium border border-indigo-100" 
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                                        }`}
                                        onClick={() => !isEditing && setActiveSectionId(section.id)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <AlignLeft className={`w-4 h-4 shrink-0 \${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                                            <span className="truncate text-sm">{section.title}</span>
                                        </div>

                                        {isAdmin && (
                                            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity \${isActive ? 'opacity-100' : ''}`}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRenameSection(section.id, section.title); }}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Đổi tên"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id, section.title); }}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 flex flex-col h-full min-w-0 bg-white relative">
                    {activeSection ? (
                        <>
                            {/* Content Topbar */}
                            <div className="h-16 shrink-0 border-b border-slate-100 flex items-center justify-between px-8 bg-white z-10 shadow-sm">
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{activeSection.title}</h1>
                                
                                {isAdmin && !isEditing && (
                                    <button 
                                        onClick={() => handleStartEdit(activeSection.content)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span>Soạn thảo nội dung</span>
                                    </button>
                                )}

                                {isAdmin && isEditing && (
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Hủy
                                        </button>
                                        <button 
                                            onClick={() => handleSaveEdit(activeSection.id)}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            <span>Lưu thay đổi</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content Viewer / Editor */}
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-thin">
                                <div className="max-w-4xl mx-auto">
                                    {isEditing ? (
                                        <RichTextEditor 
                                            content={editContent} 
                                            onChange={setEditContent} 
                                            placeholder="Bắt đầu viết nội dung văn hóa tại đây..."
                                        />
                                    ) : (
                                        <div 
                                            className="prose prose-slate prose-lg max-w-none 
                                            prose-headings:font-bold prose-headings:text-slate-800 
                                            prose-p:text-slate-700 prose-p:leading-relaxed 
                                            prose-a:text-indigo-600 hover:prose-a:text-indigo-500
                                            prose-img:rounded-xl prose-img:shadow-sm"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeSection.content) }}
                                        />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <BookOpen className="w-16 h-16 opacity-20" />
                            <p>Vui lòng chọn hoặc tạo một Danh mục bên trái để xem nội dung.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
