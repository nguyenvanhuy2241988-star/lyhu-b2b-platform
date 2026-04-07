"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { DEFAULT_CMS_DATA } from "./DefaultData";

const supabase = createClient();

interface CultureContextType {
    content: any;
    isEditMode: boolean;
    updateContent: (key: string, value: any) => void;
    uploadImage: (id: string, file: File | undefined) => Promise<void>;
    uploadingId: string | null;
}

export const CultureContext = createContext<CultureContextType>({
    content: {},
    isEditMode: false,
    updateContent: () => {},
    uploadImage: async () => {},
    uploadingId: null
});

export const useCulture = () => useContext(CultureContext);

export function CultureProvider({ 
    children,
    isEditMode,
    isSaving,
    setIsLoading,
    setIsEditMode // Only used to auto-switch if empty
}: { 
    children: React.ReactNode, 
    isEditMode: boolean, 
    isSaving: boolean,
    setIsLoading: (val: boolean) => void,
    setIsEditMode: (val: boolean) => void
}) {
    const [content, setContent] = useState<any>({});
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // Initial Load & Auto-Migration
    useEffect(() => {
        async function loadContent() {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('culture_settings')
                    .select('content')
                    .eq('slug', 'main_content')
                    .single();
                
                if (data && data.content) {
                    let loadedContent = data.content;
                    // Auto-migrate if it severely lacks the structural layout (e.g. old pure string dictionary)
                    if (!loadedContent.tabs || !loadedContent.pages) {
                        console.log("Old culture format detected. Auto-migrating to Block Builder Format...");
                        loadedContent = { ...loadedContent, tabs: DEFAULT_CMS_DATA.tabs, pages: DEFAULT_CMS_DATA.pages };
                        // Note: We don't auto-save to DB here to prevent overrides without User Consent via "Lưu Thay Đổi".
                    }
                    setContent(loadedContent);
                } else {
                    // Start fresh
                    setContent({ tabs: DEFAULT_CMS_DATA.tabs, pages: DEFAULT_CMS_DATA.pages });
                    setIsEditMode(true); // Default to edit mode if starting from scratch
                }
            } catch (err) {
                console.log("No config found or error fetching config", err);
                setContent({ tabs: DEFAULT_CMS_DATA.tabs, pages: DEFAULT_CMS_DATA.pages });
            }
            setIsLoading(false);
        }
        loadContent();
    }, []);

    const updateContent = (key: string, value: any) => {
        setContent((prev: any) => ({ ...prev, [key]: value }));
    };

    const uploadImage = async (id: string, file: File | undefined) => {
        if (!file) return;
        setUploadingId(id);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `culture_${id}_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(`culture/${fileName}`, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('media').getPublicUrl(`culture/${fileName}`);
            updateContent(id, data.publicUrl);
        } catch (err: any) {
            alert("Lỗi upload ảnh: " + err.message);
        }
        setUploadingId(null);
    };

    // We expose content so the parent component can save it, handled in layout/page
    React.useEffect(() => {
        // Expose content to a window variable or pass up?
        // Wait, saving is handled in page.tsx, so we should pass content up, OR handle saving HERE.
        // Actually, the simplest way is to handle saving in the Provider itself and expose `saveChanges`.
    }, [content]);

    return (
        <CultureContext.Provider value={{ content, isEditMode, updateContent, uploadImage, uploadingId }}>
            {children}
            {/* Hidden div to pass content up to parent page.tsx for saving. Wait, we can pass a function from parent. */}
        </CultureContext.Provider>
    );
}
