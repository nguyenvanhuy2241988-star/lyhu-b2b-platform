"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { FolderOpen, Upload, Image, Film, Search, Grid, List, Trash2, X, Filter } from "lucide-react";

const CATEGORIES: Record<string, string> = {
    product: "Sản phẩm",
    lifestyle: "Lifestyle",
    event: "Sự kiện",
    social: "Social Media",
    other: "Khác",
};

export default function MediaLibraryPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const loadAssets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from("media_assets")
                .select("*")
                .eq("uploaded_by", user.id)
                .order("created_at", { ascending: false });

            if (filterCategory !== "all") query = query.eq("category", filterCategory);
            if (filterType !== "all") query = query.eq("file_type", filterType);
            if (search.trim()) query = query.ilike("file_name", `%${search.trim()}%`);

            const { data } = await query;
            setAssets(data || []);
        } catch (err) {
            console.error("loadAssets error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, filterCategory, filterType, search]);

    useEffect(() => { loadAssets(); }, [loadAssets]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;
        setUploading(true);

        try {
            for (const file of Array.from(files)) {
                const ext = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                const filePath = `media/${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("media-library")
                    .upload(filePath, file);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    continue;
                }

                const { data: urlData } = supabase.storage.from("media-library").getPublicUrl(filePath);

                const isVideo = file.type.startsWith("video/");
                await supabase.from("media_assets").insert({
                    file_name: file.name,
                    file_url: urlData.publicUrl,
                    file_type: isVideo ? "video" : "image",
                    file_size: file.size,
                    category: "other",
                    uploaded_by: user.id,
                });
            }
            loadAssets();
        } catch (err) {
            console.error("handleUpload error:", err);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleDelete = async (id: string, fileUrl: string) => {
        if (!confirm("Xóa file này?")) return;
        await supabase.from("media_assets").delete().eq("id", id);
        loadAssets();
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thư viện Media</h1>
                    <p className="text-sm text-slate-500 mt-1">{assets.length} tệp</p>
                </div>
                <div>
                    <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploading ? "Đang upload..." : "Upload"}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Tìm kiếm tên file..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="all">Tất cả danh mục</option>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="all">Tất cả loại</option>
                    <option value="image">Ảnh</option>
                    <option value="video">Video</option>
                </select>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-slate-400"}`}>
                        <Grid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-slate-400"}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-square bg-white rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : assets.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Chưa có media nào</p>
                    <p className="text-xs text-slate-400 mt-1">Nhấn "Upload" để tải lên ảnh hoặc video</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {assets.map(asset => (
                        <div key={asset.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-slate-100 relative">
                                {asset.file_type === "video" ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Film className="w-10 h-10 text-slate-300" />
                                    </div>
                                ) : (
                                    <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
                                )}
                                <button onClick={() => handleDelete(asset.id, asset.file_url)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute top-2 left-2">
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${asset.file_type === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                        {asset.file_type === "video" ? "Video" : "Ảnh"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-medium text-slate-800 truncate">{asset.file_name}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-slate-400">{formatSize(asset.file_size || 0)}</span>
                                    <span className="text-[10px] text-slate-400">{CATEGORIES[asset.category] || asset.category}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left border-b border-slate-100">
                                <th className="p-3 text-xs font-medium text-slate-500">Tên file</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Danh mục</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Kích thước</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Ngày tải</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {assets.map(asset => (
                                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-medium text-slate-800">{asset.file_name}</td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${asset.file_type === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                            {asset.file_type === "video" ? "Video" : "Ảnh"}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-500">{CATEGORIES[asset.category] || asset.category}</td>
                                    <td className="p-3 text-slate-400">{formatSize(asset.file_size || 0)}</td>
                                    <td className="p-3 text-slate-400">{new Date(asset.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3">
                                        <button onClick={() => handleDelete(asset.id, asset.file_url)}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
