"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { Save, Edit3, BookOpen, Shapes, Palette, Scale, HeartHandshake, Map } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

import { CultureProvider, useCulture } from "@/components/culture/CultureProvider";
import CultureMain from "@/components/culture/CultureMain";
import CultureSidebar from "@/components/culture/CultureSidebar";

const supabase = createClient();

// A wrapper to handle the 'save' button logic since it needs to read `content` from Context
function CultureToolbar() {
    const { isEditMode, content } = useCulture();
    const [isSaving, setIsSaving] = useState(false);
    
    // We get setIsEditMode directly from window or parent via a prop? 
    // Actually, EditableMode is in Context now! Wait, CultureProvider didn't export setIsEditMode!
    // I should rewrite CultureProvider to include setIsEditMode. Let's do it in page.tsx itself!
    return null;
}

export default function CulturePage() {
    const [activeTab, setActiveTab] = useState('t_intro');
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <CultureProvider 
            isEditMode={isEditMode} 
            isSaving={isSaving} 
            setIsLoading={setIsLoading} 
            setIsEditMode={setIsEditMode}
        >
            <DashboardShell title="Văn hóa doanh nghiệp">
                <CultureToolbarController 
                    isEditMode={isEditMode} 
                    setIsEditMode={setIsEditMode}
                    isSaving={isSaving}
                    setIsSaving={setIsSaving}
                />

                <div className="flex h-[calc(100vh-180px)] w-full bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden font-sans relative">
                    <CultureSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    <CultureMain activeTab={activeTab} />
                </div>
            </DashboardShell>
        </CultureProvider>
    );
}

function CultureToolbarController({ isEditMode, setIsEditMode, isSaving, setIsSaving }: any) {
    const { content } = useCulture();

    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('culture_settings')
                .upsert({ slug: 'main_content', content: content }, { onConflict: 'slug' });
            
            if (error) throw error;
            alert("Đã lưu nội dung cực thành công! Trình Kéo Thả đã ghi nhớ bố cục mới.");
            setIsEditMode(false);
        } catch (err: any) {
            alert("Lỗi khi lưu bảng db: " + err.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="mb-4 flex items-center justify-end gap-3 px-2">
            {isEditMode ? (
                <>
                    <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                        Hủy Sửa
                    </button>
                    <button onClick={saveChanges} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg shadow-md hover:bg-teal-700 transition-colors disabled:opacity-70">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </button>
                </>
            ) : (
                <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors tooltip" title="Chỉnh sửa tự do. Kéo thả tùy ý.">
                    <Edit3 className="w-4 h-4 text-teal-600" />
                    Sửa Nội Dung Kéo-Thả
                </button>
            )}
        </div>
    );
}
