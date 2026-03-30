"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    FolderOpen, Upload, Film, Search, Grid, List, Trash2, ExternalLink,
    XCircle, FolderPlus, ChevronRight, Home, Folder, ArrowLeft,
    Download, Link2, Pencil, Move, X, CheckSquare, Square, ArrowUpDown,
    Eye, Image as ImageIcon, FileText, HardDrive, Check
} from "lucide-react";

const CHUNK_SIZE = 3 * 1024 * 1024;
const ROOT_FOLDER_ID = "__ROOT__";

interface DriveItem {
    id: string; name: string; isFolder: boolean; mimeType: string;
    size: number; createdTime: string; thumbnailLink?: string; webViewLink?: string;
    selected?: boolean;
}

interface BreadcrumbItem { id: string; name: string; }
interface QuotaInfo { limit: number; usage: number; usageInDrive: number; usageInDriveTrash: number; }

type SortField = "name" | "size" | "createdTime";
type SortDir = "asc" | "desc";

export default function MediaLibraryPage() {
    const { user } = useAuth();

    // Navigation
    const [currentFolderId, setCurrentFolderId] = useState<string>(ROOT_FOLDER_ID);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: ROOT_FOLDER_ID, name: "LYHU Media" }]);
    const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
    const [loadingDrive, setLoadingDrive] = useState(true);
    const [rootFolderId, setRootFolderId] = useState("");

    // Upload
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [uploadPercent, setUploadPercent] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Folder
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);

    // View & Sort
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Multi-select
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Preview modal
    const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

    // Rename modal
    const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
    const [renameName, setRenameName] = useState("");

    // Move modal
    const [moveItems, setMoveItems] = useState<DriveItem[]>([]);
    const [moveFolders, setMoveFolders] = useState<DriveItem[]>([]);
    const [moveTarget, setMoveTarget] = useState("");
    const [loadingMoveFolders, setLoadingMoveFolders] = useState(false);

    // Quota
    const [quota, setQuota] = useState<QuotaInfo | null>(null);

    // Toast
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

    // Page leave warning
    useEffect(() => {
        const h = (e: BeforeUnloadEvent) => { if (uploading) { e.preventDefault(); e.returnValue = ""; } };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [uploading]);

    // Load folder
    const loadFolder = useCallback(async (folderId: string, withQuota = false) => {
        setLoadingDrive(true);
        try {
            const parentParam = folderId === ROOT_FOLDER_ID ? "" : folderId;
            const quotaParam = withQuota ? "&quota=1" : "";
            const res = await fetch(`/api/media/folders?parentId=${parentParam}${quotaParam}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setDriveItems(data.items || []);
            if (data.rootId) setRootFolderId(data.rootId);
            if (data.quota) setQuota(data.quota);
        } catch (err) { console.error(err); } finally { setLoadingDrive(false); }
    }, []);

    useEffect(() => { loadFolder(currentFolderId, !quota); }, [currentFolderId]);

    // Navigation
    const openFolder = (item: DriveItem) => {
        setBreadcrumb(prev => [...prev, { id: item.id, name: item.name }]);
        setCurrentFolderId(item.id);
        setSelectedIds(new Set());
    };
    const navigateTo = (index: number) => {
        setBreadcrumb(prev => prev.slice(0, index + 1));
        setCurrentFolderId(breadcrumb[index].id);
        setSelectedIds(new Set());
    };
    const goBack = () => { if (breadcrumb.length > 1) navigateTo(breadcrumb.length - 2); };

    // Create folder
    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        try {
            const parentId = currentFolderId === ROOT_FOLDER_ID ? "" : currentFolderId;
            const res = await fetch("/api/media/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newFolderName.trim(), parentId }) });
            if (!res.ok) { alert(`Lỗi: ${(await res.json()).error}`); return; }
            setNewFolderName(""); setShowNewFolder(false); loadFolder(currentFolderId);
        } finally { setCreatingFolder(false); }
    };

    // Delete single
    const deleteItem = async (id: string, name: string, isFolder: boolean) => {
        if (!confirm(`Xóa ${isFolder ? "thư mục" : "file"} "${name}"?`)) return;
        const res = await fetch("/api/media/folders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: id }) });
        if (!res.ok) { alert(`Lỗi: ${(await res.json()).error}`); return; }
        if (!isFolder) await fetch("/api/media/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driveFileId: id }) });
        loadFolder(currentFolderId);
    };

    // Bulk delete
    const bulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Xóa ${selectedIds.size} mục đã chọn?`)) return;
        for (const id of selectedIds) {
            await fetch("/api/media/folders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: id }) });
        }
        setSelectedIds(new Set()); setSelectMode(false);
        loadFolder(currentFolderId);
        showToast(`Đã xóa ${selectedIds.size} mục`);
    };

    // Rename
    const startRename = (item: DriveItem) => { setRenameItem(item); setRenameName(item.name); };
    const doRename = async () => {
        if (!renameItem || !renameName.trim()) return;
        const res = await fetch("/api/media/folders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: renameItem.id, newName: renameName.trim() }) });
        if (!res.ok) { alert(`Lỗi: ${(await res.json()).error}`); return; }
        setRenameItem(null); loadFolder(currentFolderId);
        showToast("Đã đổi tên");
    };

    // Move
    const startMove = (items: DriveItem[]) => {
        setMoveItems(items);
        setMoveTarget("");
        loadMoveFolders();
    };
    const loadMoveFolders = async () => {
        setLoadingMoveFolders(true);
        try {
            const parentParam = rootFolderId || "";
            const res = await fetch(`/api/media/folders?parentId=${parentParam}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setMoveFolders(data.items?.filter((i: DriveItem) => i.isFolder) || []);
        } finally { setLoadingMoveFolders(false); }
    };
    const doMove = async () => {
        if (!moveTarget || moveItems.length === 0) return;
        const currentParent = currentFolderId === ROOT_FOLDER_ID ? rootFolderId : currentFolderId;
        for (const item of moveItems) {
            await fetch("/api/media/folders", { method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: item.id, newParentId: moveTarget, oldParentId: currentParent }) });
        }
        setMoveItems([]); setSelectedIds(new Set()); setSelectMode(false);
        loadFolder(currentFolderId);
        showToast(`Đã di chuyển ${moveItems.length} mục`);
    };

    // Copy link
    const copyLink = (id: string) => {
        navigator.clipboard.writeText(`https://drive.google.com/file/d/${id}/view`);
        showToast("Đã copy link!");
    };

    // Download
    const downloadFile = (id: string, name: string) => {
        const a = document.createElement("a");
        a.href = `https://drive.google.com/uc?id=${id}&export=download`;
        a.download = name; a.target = "_blank";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    // Select
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };
    const selectAll = () => {
        if (selectedIds.size === filteredSorted.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredSorted.map(i => i.id)));
    };

    // Upload
    const cancelUpload = () => { abortRef.current?.abort(); abortRef.current = null; setUploading(false); setUploadProgress(""); setUploadPercent(0); if (fileRef.current) fileRef.current.value = ""; };

    const uploadFile = async (file: File, signal: AbortSignal) => {
        if (!user) return;
        const initForm = new FormData();
        initForm.append("action", "init"); initForm.append("fileName", file.name); initForm.append("mimeType", file.type);
        initForm.append("fileSize", String(file.size)); initForm.append("userName", user.full_name || user.id.slice(0, 8));
        if (currentFolderId !== ROOT_FOLDER_ID) initForm.append("targetFolderId", currentFolderId);

        const initRes = await fetch("/api/media/upload", { method: "POST", body: initForm, signal });
        if (!initRes.ok) throw new Error((await initRes.json()).error);
        const { uploadUrl, token } = await initRes.json();

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let driveFileId = "";
        for (let i = 0; i < totalChunks; i++) {
            if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
            const start = i * CHUNK_SIZE; const end = Math.min(start + CHUNK_SIZE, file.size) - 1;
            setUploadPercent(Math.round(((i + 1) / totalChunks) * 100));
            const cf = new FormData();
            cf.append("action", "chunk"); cf.append("uploadUrl", uploadUrl); cf.append("token", token);
            cf.append("chunk", file.slice(start, end + 1), "chunk"); cf.append("rangeStart", String(start));
            cf.append("rangeEnd", String(end)); cf.append("totalSize", String(file.size));
            const cr = await fetch("/api/media/upload", { method: "POST", body: cf, signal });
            if (!cr.ok) throw new Error((await cr.json()).error);
            const cd = await cr.json();
            if (cd.status === "complete") driveFileId = cd.driveFileId;
        }
        if (!driveFileId) throw new Error("No file ID");
        const cf2 = new FormData();
        cf2.append("action", "complete"); cf2.append("driveFileId", driveFileId); cf2.append("fileName", file.name);
        cf2.append("fileSize", String(file.size)); cf2.append("fileType", file.type); cf2.append("userId", user.id);
        const cr2 = await fetch("/api/media/upload", { method: "POST", body: cf2, signal });
        if (!cr2.ok) throw new Error((await cr2.json()).error);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;
        const controller = new AbortController(); abortRef.current = controller; setUploading(true);
        try {
            const arr = Array.from(files);
            for (let i = 0; i < arr.length; i++) {
                setUploadProgress(`${i + 1}/${arr.length}: ${arr[i].name} (${formatSize(arr[i].size)})`);
                setUploadPercent(0);
                if (controller.signal.aborted) break;
                try { await uploadFile(arr[i], controller.signal); } catch (err: any) {
                    if (err.name === "AbortError") break;
                    alert(`Lỗi: ${err.message}`);
                }
            }
            loadFolder(currentFolderId, true);
        } finally { setUploading(false); setUploadProgress(""); setUploadPercent(0); if (fileRef.current) fileRef.current.value = ""; }
    };

    // Helpers
    const formatSize = (b: number) => {
        if (!b) return ""; if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
        return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };
    const formatSizeTB = (b: number) => `${(b / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
    const getFileType = (m: string) => m.startsWith("video/") ? "video" : m.startsWith("image/") ? "image" : "other";

    // Sort & filter
    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };
    const filtered = driveItems.filter(i => !search.trim() || i.name.toLowerCase().includes(search.toLowerCase()));
    const filteredSorted = [...filtered].sort((a, b) => {
        // Folders always first
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
        let cmp = 0;
        if (sortField === "name") cmp = a.name.localeCompare(b.name);
        else if (sortField === "size") cmp = (a.size || 0) - (b.size || 0);
        else if (sortField === "createdTime") cmp = (a.createdTime || "").localeCompare(b.createdTime || "");
        return sortDir === "desc" ? -cmp : cmp;
    });
    const folders = filteredSorted.filter(i => i.isFolder);
    const files2 = filteredSorted.filter(i => !i.isFolder);

    return (
        <div className="space-y-4">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-[slideIn_0.3s_ease]">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thư viện Media</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {folders.length} thư mục · {files2.length} tệp
                        <span className="ml-2 text-xs text-green-600">☁️ Google Drive</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectMode ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                        <CheckSquare className="w-4 h-4" /> Chọn
                    </button>
                    <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200">
                        <FolderPlus className="w-4 h-4" /> Tạo thư mục
                    </button>
                    <input ref={fileRef} type="file" multiple accept="image/*,video/*,.psd,.ai,.eps,.raw,.cr2,.nef,.arw,.mp4,.mov,.avi" className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50">
                        <Upload className="w-4 h-4" /> {uploading ? "Đang upload..." : "Upload"}
                    </button>
                </div>
            </div>

            {/* Quota bar */}
            {quota && quota.limit > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Dung lượng Drive</span>
                        <span>{formatSize(quota.usage)} / {formatSizeTB(quota.limit)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((quota.usage / quota.limit) * 100, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Còn trống: {formatSizeTB(quota.limit - quota.usage)} · Thùng rác: {formatSize(quota.usageInDriveTrash)}
                    </p>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm overflow-x-auto">
                {breadcrumb.length > 1 && (<button onClick={goBack} className="p-1 text-slate-400 hover:text-slate-600 mr-1"><ArrowLeft className="w-4 h-4" /></button>)}
                {breadcrumb.map((item, i) => (
                    <div key={item.id} className="flex items-center shrink-0">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
                        <button onClick={() => navigateTo(i)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded ${i === breadcrumb.length - 1 ? "text-pink-600 font-medium bg-pink-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                            {i === 0 ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />} {item.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Bulk actions */}
            {selectMode && selectedIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-blue-700 font-medium">Đã chọn {selectedIds.size} mục</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { const items = driveItems.filter(i => selectedIds.has(i.id)); startMove(items); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200">
                            <Move className="w-3.5 h-3.5" /> Di chuyển
                        </button>
                        <button onClick={bulkDelete}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200">
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                    </div>
                </div>
            )}

            {/* New folder */}
            {showNewFolder && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                    <FolderPlus className="w-5 h-5 text-amber-500" />
                    <input autoFocus className="flex-1 text-sm outline-none border-b border-slate-200 pb-1 focus:border-pink-400" placeholder="Tên thư mục..."
                        value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setShowNewFolder(false); }} />
                    <button onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()} className="px-3 py-1 bg-pink-600 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                        {creatingFolder ? "Đang tạo..." : "Tạo"}
                    </button>
                    <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200">Hủy</button>
                </div>
            )}

            {/* Upload progress */}
            {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-blue-700 font-medium">Đang upload {uploadProgress}</p></div>
                        <button onClick={cancelUpload} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200"><XCircle className="w-4 h-4" /> Hủy</button>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPercent}%` }} /></div>
                    <p className="text-xs text-blue-500 mt-1 text-right">{uploadPercent}%</p>
                </div>
            )}

            {/* Search + sort + view */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {selectMode && (
                    <button onClick={selectAll} className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200">
                        <CheckSquare className="w-3.5 h-3.5" /> {selectedIds.size === filteredSorted.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </button>
                )}
                <div className="flex items-center gap-1 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    {(["name", "size", "createdTime"] as SortField[]).map(f => (
                        <button key={f} onClick={() => toggleSort(f)}
                            className={`px-2 py-1 rounded ${sortField === f ? "bg-pink-100 text-pink-600 font-medium" : "text-slate-500 hover:bg-slate-100"}`}>
                            {f === "name" ? "Tên" : f === "size" ? "Size" : "Ngày"} {sortField === f && (sortDir === "asc" ? "↑" : "↓")}
                        </button>
                    ))}
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-slate-400"}`}><Grid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-slate-400"}`}><List className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Content */}
            {loadingDrive ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (<div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />))}
                </div>
            ) : filteredSorted.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Thư mục trống</p>
                    <p className="text-xs text-slate-400 mt-1">Tạo thư mục mới hoặc upload file vào đây</p>
                </div>
            ) : viewMode === "grid" ? (
                <div>
                    {folders.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Thư mục ({folders.length})</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {folders.map(f => (
                                    <div key={f.id} className={`group relative bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${selectedIds.has(f.id) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-amber-300"}`}
                                        onClick={() => selectMode ? toggleSelect(f.id) : openFolder(f)}>
                                        {selectMode && (
                                            <div className="absolute top-2 left-2">
                                                {selectedIds.has(f.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-10 h-10 text-amber-400 shrink-0" />
                                            <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={e => { e.stopPropagation(); startRename(f); }} className="p-1 text-slate-400 hover:text-blue-500" title="Đổi tên"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={e => { e.stopPropagation(); startMove([f]); }} className="p-1 text-slate-400 hover:text-green-500" title="Di chuyển"><Move className="w-3.5 h-3.5" /></button>
                                            <button onClick={e => { e.stopPropagation(); deleteItem(f.id, f.name, true); }} className="p-1 text-slate-400 hover:text-red-500" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {files2.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tệp ({files2.length})</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {files2.map(file => (
                                    <div key={file.id} className={`group relative bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all ${selectedIds.has(file.id) ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"}`}
                                        onClick={() => selectMode ? toggleSelect(file.id) : setPreviewItem(file)}>
                                        {selectMode && (
                                            <div className="absolute top-2 left-2 z-10">
                                                {selectedIds.has(file.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-white drop-shadow" />}
                                            </div>
                                        )}
                                        <div className="aspect-square bg-slate-100 relative cursor-pointer">
                                            {getFileType(file.mimeType) === "video" ? (
                                                <div className="absolute inset-0 flex items-center justify-center"><Film className="w-10 h-10 text-slate-300" /></div>
                                            ) : (<img src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w400`} alt={file.name} className="w-full h-full object-cover" loading="lazy" />)}
                                            {!selectMode && (
                                                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={e => { e.stopPropagation(); copyLink(file.id); }} className="p-1.5 bg-white/90 text-slate-600 rounded-lg hover:bg-white shadow-sm" title="Copy link"><Link2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={e => { e.stopPropagation(); downloadFile(file.id, file.name); }} className="p-1.5 bg-white/90 text-slate-600 rounded-lg hover:bg-white shadow-sm" title="Tải xuống"><Download className="w-3.5 h-3.5" /></button>
                                                    <button onClick={e => { e.stopPropagation(); startRename(file); }} className="p-1.5 bg-white/90 text-slate-600 rounded-lg hover:bg-white shadow-sm" title="Đổi tên"><Pencil className="w-3.5 h-3.5" /></button>
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!selectMode && <>
                                                    <button onClick={e => { e.stopPropagation(); startMove([file]); }} className="p-1.5 bg-white/90 text-slate-600 rounded-lg hover:bg-white shadow-sm" title="Di chuyển"><Move className="w-3.5 h-3.5" /></button>
                                                    <button onClick={e => { e.stopPropagation(); deleteItem(file.id, file.name, false); }} className="p-1.5 bg-white/90 text-red-500 rounded-lg hover:bg-white shadow-sm" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </>}
                                            </div>
                                            <div className="absolute top-2 left-2">
                                                {!selectMode && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getFileType(file.mimeType) === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                                    {getFileType(file.mimeType) === "video" ? "Video" : "Ảnh"}
                                                </span>}
                                            </div>
                                        </div>
                                        <div className="p-3"><p className="text-xs font-medium text-slate-800 truncate">{file.name}</p><span className="text-[10px] text-slate-400">{formatSize(file.size)}</span></div>
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
                                {selectMode && <th className="p-3 w-8"><button onClick={selectAll}>{selectedIds.size === filteredSorted.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}</button></th>}
                                <th className="p-3 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleSort("name")}>Tên {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleSort("size")}>Kích thước {sortField === "size" && (sortDir === "asc" ? "↑" : "↓")}</th>
                                <th className="p-3 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleSort("createdTime")}>Ngày tạo {sortField === "createdTime" && (sortDir === "asc" ? "↑" : "↓")}</th>
                                <th className="p-3 w-32"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSorted.map(item => (
                                <tr key={item.id} className={`transition-colors ${selectedIds.has(item.id) ? "bg-blue-50" : item.isFolder ? "hover:bg-amber-50 cursor-pointer" : "hover:bg-slate-50"}`}
                                    onClick={() => selectMode ? toggleSelect(item.id) : item.isFolder ? openFolder(item) : setPreviewItem(item)}>
                                    {selectMode && <td className="p-3">{selectedIds.has(item.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}</td>}
                                    <td className="p-3"><div className="flex items-center gap-2">
                                        {item.isFolder ? <Folder className="w-5 h-5 text-amber-400" /> : getFileType(item.mimeType) === "video" ? <Film className="w-5 h-5 text-blue-400" /> : <ImageIcon className="w-5 h-5 text-green-400" />}
                                        <span className="font-medium text-slate-800">{item.name}</span>
                                    </div></td>
                                    <td className="p-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.isFolder ? "bg-amber-50 text-amber-600" : getFileType(item.mimeType) === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                        {item.isFolder ? "Thư mục" : getFileType(item.mimeType) === "video" ? "Video" : "Ảnh"}
                                    </span></td>
                                    <td className="p-3 text-slate-400">{item.isFolder ? "—" : formatSize(item.size)}</td>
                                    <td className="p-3 text-slate-400">{item.createdTime ? new Date(item.createdTime).toLocaleDateString('vi-VN') : "—"}</td>
                                    <td className="p-3"><div className="flex items-center gap-0.5">
                                        {!item.isFolder && <>
                                            <button onClick={e => { e.stopPropagation(); copyLink(item.id); }} className="p-1 text-slate-300 hover:text-blue-500" title="Copy link"><Link2 className="w-4 h-4" /></button>
                                            <button onClick={e => { e.stopPropagation(); downloadFile(item.id, item.name); }} className="p-1 text-slate-300 hover:text-green-500" title="Tải xuống"><Download className="w-4 h-4" /></button>
                                        </>}
                                        <button onClick={e => { e.stopPropagation(); startRename(item); }} className="p-1 text-slate-300 hover:text-blue-500" title="Đổi tên"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={e => { e.stopPropagation(); startMove([item]); }} className="p-1 text-slate-300 hover:text-green-500" title="Di chuyển"><Move className="w-4 h-4" /></button>
                                        <button onClick={e => { e.stopPropagation(); deleteItem(item.id, item.name, item.isFolder); }} className="p-1 text-slate-300 hover:text-red-500" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-medium text-slate-800 truncate max-w-[400px]">{previewItem.name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{formatSize(previewItem.size)} · {previewItem.createdTime ? new Date(previewItem.createdTime).toLocaleDateString('vi-VN') : ""}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => copyLink(previewItem.id)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-lg" title="Copy link"><Link2 className="w-5 h-5" /></button>
                                <button onClick={() => downloadFile(previewItem.id, previewItem.name)} className="p-2 text-slate-400 hover:text-green-500 hover:bg-slate-100 rounded-lg" title="Tải về"><Download className="w-5 h-5" /></button>
                                <a href={`https://drive.google.com/file/d/${previewItem.id}/view`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-lg" title="Mở trong Drive"><ExternalLink className="w-5 h-5" /></a>
                                <button onClick={() => setPreviewItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="bg-slate-900 flex items-center justify-center" style={{ maxHeight: "70vh" }}>
                            {getFileType(previewItem.mimeType) === "video" ? (
                                <video controls className="max-w-full max-h-[70vh]" autoPlay>
                                    <source src={`https://drive.google.com/uc?id=${previewItem.id}&export=download`} type={previewItem.mimeType} />
                                </video>
                            ) : (
                                <img src={`https://drive.google.com/thumbnail?id=${previewItem.id}&sz=w1200`} alt={previewItem.name} className="max-w-full max-h-[70vh] object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renameItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRenameItem(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Đổi tên</h3>
                        <input autoFocus className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 mb-4"
                            value={renameName} onChange={e => setRenameName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") doRename(); if (e.key === "Escape") setRenameItem(null); }} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRenameItem(null)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">Hủy</button>
                            <button onClick={doRename} disabled={!renameName.trim()} className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 disabled:opacity-50">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {moveItems.length > 0 && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMoveItems([])}>
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Di chuyển {moveItems.length} mục</h3>
                        <p className="text-xs text-slate-400 mb-4">Chọn thư mục đích:</p>
                        {loadingMoveFolders ? (
                            <div className="py-8 text-center text-sm text-slate-400">Đang tải...</div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto space-y-1 mb-4">
                                <button onClick={() => setMoveTarget(rootFolderId)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${moveTarget === rootFolderId ? "bg-pink-50 text-pink-600 border border-pink-200" : "hover:bg-slate-50"}`}>
                                    <Home className="w-4 h-4 text-amber-400" /> LYHU Media (Gốc)
                                </button>
                                {moveFolders.filter(f => !moveItems.find(mi => mi.id === f.id)).map(f => (
                                    <button key={f.id} onClick={() => setMoveTarget(f.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${moveTarget === f.id ? "bg-pink-50 text-pink-600 border border-pink-200" : "hover:bg-slate-50"}`}>
                                        <Folder className="w-4 h-4 text-amber-400" /> {f.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setMoveItems([])} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">Hủy</button>
                            <button onClick={doMove} disabled={!moveTarget} className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 disabled:opacity-50">Di chuyển</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
