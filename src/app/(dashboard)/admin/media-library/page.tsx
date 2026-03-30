"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { FolderOpen, Upload, Film, Search, Grid, List, Trash2, ExternalLink, User } from "lucide-react";

const CATEGORIES: Record<string, string> = {
    product: "Sản phẩm",
    lifestyle: "Lifestyle",
    event: "Sự kiện",
    social: "Social Media",
    other: "Khác",
};

const CHUNK_SIZE = 3 * 1024 * 1024;

export default function AdminMediaLibraryPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterUser, setFilterUser] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [uploadPercent, setUploadPercent] = useState(0);
    const [users, setUsers] = useState<any[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    // Load users for filter dropdown
    useEffect(() => {
        supabase.from("users").select("id, full_name, role").eq("role", "media_creator").then(({ data }) => {
            setUsers(data || []);
        });
    }, []);

    const loadAssets = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("media_assets")
                .select("*, users:uploaded_by(full_name)")
                .order("created_at", { ascending: false });

            if (filterCategory !== "all") query = query.eq("category", filterCategory);
            if (filterType !== "all") query = query.eq("file_type", filterType);
            if (filterUser !== "all") query = query.eq("uploaded_by", filterUser);
            if (search.trim()) query = query.ilike("file_name", `%${search.trim()}%`);

            const { data } = await query;
            setAssets(data || []);
        } catch (err) {
            console.error("loadAssets error:", err);
        } finally {
            setLoading(false);
        }
    }, [filterCategory, filterType, filterUser, search]);

    useEffect(() => { loadAssets(); }, [loadAssets]);

    const uploadFile = async (file: File) => {
        if (!user) return;

        const initForm = new FormData();
        initForm.append("action", "init");
        initForm.append("fileName", file.name);
        initForm.append("mimeType", file.type);
        initForm.append("fileSize", String(file.size));
        initForm.append("userName", user.full_name || "Admin");

        const initRes = await fetch("/api/media/upload", { method: "POST", body: initForm });
        if (!initRes.ok) throw new Error((await initRes.json()).error || "Failed to init");
        const { uploadUrl, token } = await initRes.json();

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let driveFileId = "";

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size) - 1;
            setUploadPercent(Math.round(((i + 1) / totalChunks) * 100));

            const chunkForm = new FormData();
            chunkForm.append("action", "chunk");
            chunkForm.append("uploadUrl", uploadUrl);
            chunkForm.append("token", token);
            chunkForm.append("chunk", file.slice(start, end + 1), "chunk");
            chunkForm.append("rangeStart", String(start));
            chunkForm.append("rangeEnd", String(end));
            chunkForm.append("totalSize", String(file.size));

            const chunkRes = await fetch("/api/media/upload", { method: "POST", body: chunkForm });
            if (!chunkRes.ok) throw new Error((await chunkRes.json()).error || `Chunk ${i + 1} failed`);

            const chunkData = await chunkRes.json();
            if (chunkData.status === "complete") driveFileId = chunkData.driveFileId;
        }

        if (!driveFileId) throw new Error("No file ID returned");

        const completeForm = new FormData();
        completeForm.append("action", "complete");
        completeForm.append("driveFileId", driveFileId);
        completeForm.append("fileName", file.name);
        completeForm.append("fileSize", String(file.size));
        completeForm.append("fileType", file.type);
        completeForm.append("userId", user.id);

        const completeRes = await fetch("/api/media/upload", { method: "POST", body: completeForm });
        if (!completeRes.ok) throw new Error((await completeRes.json()).error || "Save failed");
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;
        setUploading(true);
        try {
            const fileArray = Array.from(files);
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                setUploadProgress(`${i + 1}/${fileArray.length}: ${file.name} (${formatSize(file.size)})`);
                setUploadPercent(0);
                try { await uploadFile(file); } catch (err: any) {
                    alert(`Lỗi upload ${file.name}: ${err.message}`);
                }
            }
            loadAssets();
        } finally {
            setUploading(false);
            setUploadProgress("");
            setUploadPercent(0);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa file này?")) return;
        const res = await fetch("/api/media/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId: id }),
        });
        if (!res.ok) { alert(`Lỗi xóa: ${(await res.json()).error}`); return; }
        loadAssets();
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const getThumbnailUrl = (asset: any) => {
        if (asset.drive_file_id) return `https://drive.google.com/thumbnail?id=${asset.drive_file_id}&sz=w400`;
        return asset.file_url;
    };

    const totalSize = assets.reduce((sum: number, a: any) => sum + (a.file_size || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thư viện Media (Admin)</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {assets.length} tệp · {formatSize(totalSize)}
                        <span className="ml-2 text-xs text-green-600">☁️ Google Drive</span>
                    </p>
                </div>
                <div>
                    <input ref={fileRef} type="file" multiple accept="image/*,video/*,.psd,.ai,.eps,.raw,.cr2,.nef,.arw" className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploading ? "Đang upload..." : "Upload lên Drive"}
                    </button>
                </div>
            </div>

            {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-blue-700 font-medium">Đang upload {uploadProgress}</p>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPercent}%` }} />
                    </div>
                    <p className="text-xs text-blue-500 mt-1 text-right">{uploadPercent}%</p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Tìm kiếm tên file..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="all">Tất cả nhân viên</option>
                    {users.map(u => (<option key={u.id} value={u.id}>{u.full_name}</option>))}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="all">Tất cả danh mục</option>
                    {Object.entries(CATEGORIES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="all">Tất cả loại</option>
                    <option value="image">Ảnh</option>
                    <option value="video">Video</option>
                </select>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-slate-400"}`}>
                        <Grid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-slate-400"}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

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
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {assets.map(asset => (
                        <div key={asset.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-slate-100 relative">
                                {asset.file_type === "video" ? (
                                    <div className="absolute inset-0 flex items-center justify-center"><Film className="w-10 h-10 text-slate-300" /></div>
                                ) : (
                                    <img src={getThumbnailUrl(asset)} alt={asset.file_name} className="w-full h-full object-cover" loading="lazy" />
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {asset.drive_view_link && (
                                        <a href={asset.drive_view_link} target="_blank" rel="noopener noreferrer"
                                            className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(asset.id)}
                                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
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
                                    <span className="text-[10px] text-blue-500 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {asset.users?.full_name || "—"}
                                    </span>
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
                                <th className="p-3 text-xs font-medium text-slate-500">Người upload</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Kích thước</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Ngày tải</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {assets.map(asset => (
                                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-medium text-slate-800">{asset.file_name}</td>
                                    <td className="p-3 text-slate-500">{asset.users?.full_name || "—"}</td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${asset.file_type === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                            {asset.file_type === "video" ? "Video" : "Ảnh"}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400">{formatSize(asset.file_size || 0)}</td>
                                    <td className="p-3 text-slate-400">{new Date(asset.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            {asset.drive_view_link && (
                                                <a href={asset.drive_view_link} target="_blank" rel="noopener noreferrer"
                                                    className="p-1 text-slate-300 hover:text-blue-500 transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button onClick={() => handleDelete(asset.id)}
                                                className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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
