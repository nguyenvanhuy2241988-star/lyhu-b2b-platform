"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    FolderOpen, Upload, Film, Search, Grid, List, Trash2, ExternalLink,
    XCircle, FolderPlus, ChevronRight, Home, Folder, ArrowLeft
} from "lucide-react";

const CHUNK_SIZE = 3 * 1024 * 1024;
const ROOT_FOLDER_ID = "__ROOT__";

interface DriveItem {
    id: string;
    name: string;
    isFolder: boolean;
    mimeType: string;
    size: number;
    createdTime: string;
    thumbnailLink?: string;
    webViewLink?: string;
}

interface BreadcrumbItem {
    id: string;
    name: string;
}

export default function MediaLibraryPage() {
    const supabase = createClient();
    const { user } = useAuth();

    // Folder navigation state
    const [currentFolderId, setCurrentFolderId] = useState<string>(ROOT_FOLDER_ID);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: ROOT_FOLDER_ID, name: "LYHU Media" }]);
    const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
    const [loadingDrive, setLoadingDrive] = useState(true);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [uploadPercent, setUploadPercent] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Create folder state
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);

    // View
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");

    // Page leave warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (uploading) {
                e.preventDefault();
                e.returnValue = "Đang upload file. Bạn có chắc muốn rời trang?";
                return e.returnValue;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [uploading]);

    // Load folder contents from Google Drive
    const loadFolder = useCallback(async (folderId: string) => {
        setLoadingDrive(true);
        try {
            const parentParam = folderId === ROOT_FOLDER_ID ? "" : folderId;
            const res = await fetch(`/api/media/folders?parentId=${parentParam}`);
            if (!res.ok) throw new Error("Failed to load folder");
            const data = await res.json();
            setDriveItems(data.items || []);
        } catch (err) {
            console.error("loadFolder error:", err);
        } finally {
            setLoadingDrive(false);
        }
    }, []);

    useEffect(() => { loadFolder(currentFolderId); }, [currentFolderId, loadFolder]);

    // Navigate into a folder
    const openFolder = (item: DriveItem) => {
        setBreadcrumb(prev => [...prev, { id: item.id, name: item.name }]);
        setCurrentFolderId(item.id);
    };

    // Navigate via breadcrumb
    const navigateTo = (index: number) => {
        const target = breadcrumb[index];
        setBreadcrumb(prev => prev.slice(0, index + 1));
        setCurrentFolderId(target.id);
    };

    // Go back one level
    const goBack = () => {
        if (breadcrumb.length <= 1) return;
        navigateTo(breadcrumb.length - 2);
    };

    // Create folder
    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        try {
            const parentId = currentFolderId === ROOT_FOLDER_ID ? "" : currentFolderId;
            const res = await fetch("/api/media/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newFolderName.trim(), parentId }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(`Lỗi tạo thư mục: ${err.error}`);
                return;
            }
            setNewFolderName("");
            setShowNewFolder(false);
            loadFolder(currentFolderId);
        } catch (err: any) {
            alert(`Lỗi: ${err.message}`);
        } finally {
            setCreatingFolder(false);
        }
    };

    // Delete folder
    const deleteFolder = async (folderId: string, folderName: string) => {
        if (!confirm(`Xóa thư mục "${folderName}" và tất cả file bên trong?\n(Sẽ chuyển vào thùng rác Drive)`)) return;
        try {
            const res = await fetch("/api/media/folders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(`Lỗi xóa: ${err.error}`);
                return;
            }
            loadFolder(currentFolderId);
        } catch (err: any) {
            alert(`Lỗi: ${err.message}`);
        }
    };

    // Delete file from Drive
    const deleteFile = async (fileId: string) => {
        if (!confirm("Xóa file này?")) return;
        try {
            // Move file to trash on Drive
            const res = await fetch("/api/media/folders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: fileId }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(`Lỗi xóa: ${err.error}`);
                return;
            }
            // Also try to remove from Supabase
            await fetch("/api/media/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driveFileId: fileId }),
            });
            loadFolder(currentFolderId);
        } catch (err: any) {
            alert(`Lỗi: ${err.message}`);
        }
    };

    // Cancel upload
    const cancelUpload = () => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setUploading(false);
        setUploadProgress("");
        setUploadPercent(0);
        if (fileRef.current) fileRef.current.value = "";
    };

    // Upload file to current folder
    const uploadFile = async (file: File, signal: AbortSignal) => {
        if (!user) return;

        const initForm = new FormData();
        initForm.append("action", "init");
        initForm.append("fileName", file.name);
        initForm.append("mimeType", file.type);
        initForm.append("fileSize", String(file.size));
        initForm.append("userName", user.full_name || user.id.slice(0, 8));
        // Upload to current folder
        if (currentFolderId !== ROOT_FOLDER_ID) {
            initForm.append("targetFolderId", currentFolderId);
        }

        const initRes = await fetch("/api/media/upload", { method: "POST", body: initForm, signal });
        if (!initRes.ok) throw new Error((await initRes.json()).error || "Failed to init");
        const { uploadUrl, token } = await initRes.json();

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let driveFileId = "";

        for (let i = 0; i < totalChunks; i++) {
            if (signal.aborted) throw new DOMException("Upload cancelled", "AbortError");

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

            const chunkRes = await fetch("/api/media/upload", { method: "POST", body: chunkForm, signal });
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

        const completeRes = await fetch("/api/media/upload", { method: "POST", body: completeForm, signal });
        if (!completeRes.ok) throw new Error((await completeRes.json()).error || "Save failed");
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;
        const controller = new AbortController();
        abortRef.current = controller;
        setUploading(true);

        try {
            const fileArray = Array.from(files);
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                setUploadProgress(`${i + 1}/${fileArray.length}: ${file.name} (${formatSize(file.size)})`);
                setUploadPercent(0);
                if (controller.signal.aborted) break;
                try {
                    await uploadFile(file, controller.signal);
                } catch (err: any) {
                    if (err.name === "AbortError") break;
                    alert(`Lỗi upload ${file.name}: ${err.message}`);
                }
            }
            loadFolder(currentFolderId);
        } finally {
            setUploading(false);
            setUploadProgress("");
            setUploadPercent(0);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const getFileType = (mimeType: string) => {
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("image/")) return "image";
        return "other";
    };

    // Filter items by search
    const filteredItems = driveItems.filter(item =>
        !search.trim() || item.name.toLowerCase().includes(search.toLowerCase())
    );

    const folders = filteredItems.filter(i => i.isFolder);
    const files = filteredItems.filter(i => !i.isFolder);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thư viện Media</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {folders.length} thư mục · {files.length} tệp
                        <span className="ml-2 text-xs text-green-600">☁️ Google Drive</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowNewFolder(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                        <FolderPlus className="w-4 h-4" /> Tạo thư mục
                    </button>
                    <input ref={fileRef} type="file" multiple accept="image/*,video/*,.psd,.ai,.eps,.raw,.cr2,.nef,.arw" className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploading ? "Đang upload..." : "Upload"}
                    </button>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm overflow-x-auto">
                {breadcrumb.length > 1 && (
                    <button onClick={goBack} className="p-1 text-slate-400 hover:text-slate-600 mr-1">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}
                {breadcrumb.map((item, index) => (
                    <div key={item.id} className="flex items-center shrink-0">
                        {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
                        <button
                            onClick={() => navigateTo(index)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                                index === breadcrumb.length - 1
                                    ? "text-pink-600 font-medium bg-pink-50"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {index === 0 ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                            {item.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* New folder input */}
            {showNewFolder && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                    <FolderPlus className="w-5 h-5 text-amber-500" />
                    <input
                        autoFocus
                        className="flex-1 text-sm outline-none border-b border-slate-200 pb-1 focus:border-pink-400"
                        placeholder="Tên thư mục mới..."
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setShowNewFolder(false); }}
                    />
                    <button onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()}
                        className="px-3 py-1 bg-pink-600 text-white text-xs font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50">
                        {creatingFolder ? "Đang tạo..." : "Tạo"}
                    </button>
                    <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                        className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200">
                        Hủy
                    </button>
                </div>
            )}

            {/* Upload progress */}
            {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-blue-700 font-medium">Đang upload {uploadProgress}</p>
                        </div>
                        <button onClick={cancelUpload} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors">
                            <XCircle className="w-4 h-4" /> Hủy
                        </button>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPercent}%` }} />
                    </div>
                    <p className="text-xs text-blue-500 mt-1 text-right">{uploadPercent}%</p>
                </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-slate-400"}`}>
                        <Grid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-slate-400"}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loadingDrive ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Thư mục trống</p>
                    <p className="text-xs text-slate-400 mt-1">Tạo thư mục mới hoặc upload file vào đây</p>
                </div>
            ) : viewMode === "grid" ? (
                <div>
                    {/* Folders */}
                    {folders.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Thư mục ({folders.length})</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {folders.map(folder => (
                                    <div key={folder.id}
                                        className="group relative bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
                                        onClick={() => openFolder(folder)}>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-10 h-10 text-amber-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{folder.name}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id, folder.name); }}
                                            className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {files.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tệp ({files.length})</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {files.map(file => (
                                    <div key={file.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="aspect-square bg-slate-100 relative">
                                            {getFileType(file.mimeType) === "video" ? (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Film className="w-10 h-10 text-slate-300" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w400`}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={`https://drive.google.com/file/d/${file.id}/view`} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button onClick={() => deleteFile(file.id)}
                                                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="absolute top-2 left-2">
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                                    getFileType(file.mimeType) === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                                }`}>
                                                    {getFileType(file.mimeType) === "video" ? "Video" : "Ảnh"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                                            <span className="text-[10px] text-slate-400">{formatSize(file.size)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* List view */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left border-b border-slate-100">
                                <th className="p-3 text-xs font-medium text-slate-500">Tên</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Kích thước</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Ngày tạo</th>
                                <th className="p-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {folders.map(folder => (
                                <tr key={folder.id} className="hover:bg-amber-50 cursor-pointer transition-colors" onClick={() => openFolder(folder)}>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <Folder className="w-5 h-5 text-amber-400" />
                                            <span className="font-medium text-slate-800">{folder.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-400">Thư mục</td>
                                    <td className="p-3 text-slate-400">—</td>
                                    <td className="p-3 text-slate-400">{folder.createdTime ? new Date(folder.createdTime).toLocaleDateString('vi-VN') : "—"}</td>
                                    <td className="p-3">
                                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id, folder.name); }}
                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {files.map(file => (
                                <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {getFileType(file.mimeType) === "video" ?
                                                <Film className="w-5 h-5 text-blue-400" /> :
                                                <img src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w40`} className="w-5 h-5 rounded object-cover" alt="" />
                                            }
                                            <span className="font-medium text-slate-800">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                            getFileType(file.mimeType) === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                        }`}>
                                            {getFileType(file.mimeType) === "video" ? "Video" : "Ảnh"}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400">{formatSize(file.size)}</td>
                                    <td className="p-3 text-slate-400">{file.createdTime ? new Date(file.createdTime).toLocaleDateString('vi-VN') : "—"}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <a href={`https://drive.google.com/file/d/${file.id}/view`} target="_blank" rel="noopener noreferrer"
                                                className="p-1 text-slate-300 hover:text-blue-500 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button onClick={() => deleteFile(file.id)}
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
