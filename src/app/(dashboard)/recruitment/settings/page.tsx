"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Loader2, Save, Upload, X, Building, Globe, ImageIcon } from "lucide-react";
import { toast } from "sonner"; // Using alert if sonner not available

export default function RecruitmentSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        id: "",
        company_name: "",
        description: "",
        website: "",
        logo_url: "",
        culture_description: "",
        culture_images: [] as string[]
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('recruitment_settings')
            .select('*')
            .select('*')
            .maybeSingle();

        if (data) {
            setSettings({
                id: data.id,
                company_name: data.company_name || "",
                description: data.description || "",
                website: data.website || "",
                logo_url: data.logo_url || "",
                culture_description: data.culture_description || "",
                culture_images: data.culture_images || []
            });
        }
        setIsLoading(false);
    };

    // Generic Upload Helper
    const uploadAsset = async (file: File): Promise<string | null> => {
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `asset_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('recruitment_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('recruitment_assets')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload thất bại!");
            return null;
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadAsset(e.target.files[0]);
            if (url) setSettings({ ...settings, logo_url: url });
        }
    };

    const handleCultureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newUrls: string[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const url = await uploadAsset(e.target.files[i]);
                if (url) newUrls.push(url);
            }
            setSettings(prev => ({
                ...prev,
                culture_images: [...prev.culture_images, ...newUrls]
            }));
        }
    };

    const removeCultureImage = (index: number) => {
        const newImages = [...settings.culture_images];
        newImages.splice(index, 1);
        setSettings({ ...settings, culture_images: newImages });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const supabase = createClient();

        try {
            if (settings.id) {
                // Update
                const { error } = await supabase
                    .from('recruitment_settings')
                    .update({
                        company_name: settings.company_name,
                        description: settings.description,
                        website: settings.website,
                        logo_url: settings.logo_url,
                        culture_description: settings.culture_description,
                        culture_images: settings.culture_images,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', settings.id);
                if (error) throw error;
            } else {
                // Insert (first time)
                const { error } = await supabase
                    .from('recruitment_settings')
                    .insert([{
                        company_name: settings.company_name,
                        description: settings.description,
                        website: settings.website,
                        logo_url: settings.logo_url,
                        culture_description: settings.culture_description,
                        culture_images: settings.culture_images,
                    }]);
                if (error) throw error;
                loadSettings(); // Reload to get ID
            }
            alert("Đã lưu cài đặt!");
        } catch (err: any) {
            console.error(err);
            alert("Lỗi lưu cài đặt: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Đang tải...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hồ sơ Công ty</h1>
                    <p className="text-slate-500">Thông tin hiển thị trên trang ứng tuyển</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-70"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                </button>
            </div>

            <div className="space-y-8">
                {/* 1. Basic Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Building className="w-4 h-4" /> Thông tin chung
                    </h3>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Logo Upload */}
                        <div className="flex-shrink-0">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Logo công ty</label>
                            <div className="relative w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-50 overflow-hidden group">
                                {settings.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-slate-400 text-xs text-center px-2">Upload Logo</span>
                                )}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-50" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên công ty hiển thị</label>
                                <input
                                    value={settings.company_name}
                                    onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: LYHU Technology"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        value={settings.website}
                                        onChange={e => setSettings({ ...settings, website: e.target.value })}
                                        className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://lyhu.vn"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu ngắn (Về chúng tôi)</label>
                        <textarea
                            value={settings.description}
                            onChange={e => setSettings({ ...settings, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            placeholder="Giới thiệu về tầm nhìn, sứ mệnh, lĩnh vực hoạt động..."
                        />
                    </div>
                </div>

                {/* 2. Culture & Images */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Văn hóa & Hình ảnh
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả văn hóa</label>
                        <textarea
                            value={settings.culture_description}
                            onChange={e => setSettings({ ...settings, culture_description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            placeholder="Môi trường làm việc trẻ trung, năng động, happy hour hàng tuần..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh hoạt động (Team building, Office...)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {settings.culture_images.map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                                    <img src={img} alt="Culture" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeCultureImage(idx)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            <label className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 cursor-pointer transition">
                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-xs text-slate-500">Thêm ảnh</span>
                                <input type="file" accept="image/*" multiple onChange={handleCultureUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
