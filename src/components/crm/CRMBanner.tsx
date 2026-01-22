"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { getCRMBanner, updateCRMBanner, uploadCRMAsset } from "@/lib/crmStore";
import { Edit3, Trash2, Camera, User } from "lucide-react";

export default function CRMBanner() {
    const { role } = useAuth();
    // Normalize role check to be case-insensitive to handle 'ADMIN' vs 'admin'
    const isAdmin = role?.toLowerCase() === ROLES.ADMIN.toLowerCase();

    console.log('[CRMBanner] Debug - role:', role, 'isAdmin:', isAdmin);

    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getCRMBanner().then(setBannerUrl);
    }, []);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const url = await uploadCRMAsset(file);
            await updateCRMBanner(url);
            setBannerUrl(url);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tải ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Xóa banner CRM?")) return;
        try {
            await updateCRMBanner(null);
            setBannerUrl(null);
        } catch (error) {
            console.error(error);
        }
    };

    if (!bannerUrl && !isAdmin) return null;

    return (
        <div className="relative w-full bg-white mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200 group shrink-0">
            {bannerUrl ? (
                <img
                    src={bannerUrl}
                    alt="CRM Banner"
                    className="w-full h-auto object-cover max-h-64 md:max-h-80"
                />
            ) : (
                <div className="h-40 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                    <Camera className="w-8 h-8 opacity-50" />
                    <span className="text-xs">Chưa có banner (Chỉ Admin thấy khung này)</span>
                </div>
            )}

            {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded backdrop-blur-sm">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white p-1.5 rounded shadow hover:text-teal-600 disabled:opacity-50"
                        disabled={uploading}
                        title="Đổi Banner"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    {bannerUrl && (
                        <button
                            onClick={handleDelete}
                            className="bg-white p-1.5 rounded shadow hover:text-red-600"
                            title="Xóa Banner"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
