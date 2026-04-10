"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FolderOpen, Film, Search, Grid, List,
    ChevronRight, Home, Folder, ArrowLeft,
    Download, Link2, X, ArrowUpDown,
    Eye, Image as ImageIcon, ExternalLink, Check
} from "lucide-react";

const ROOT_FOLDER_ID = "__ROOT__";

interface DriveItem {
    id: string; name: string; isFolder: boolean; mimeType: string;
    size: number; createdTime: string; thumbnailLink?: string; webViewLink?: string;
}
interface BreadcrumbItem { id: string; name: string; }

type SortField = "name" | "size" | "createdTime";
type SortDir = "asc" | "desc";

export default function SharedMediaLibraryPage() {
    // Navigation
    const [currentFolderId, setCurrentFolderId] = useState<string>(ROOT_FOLDER_ID);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: ROOT_FOLDER_ID, name: "LYHU Media" }]);
    const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
    const [loadingDrive, setLoadingDrive] = useState(true);

    // View & Sort
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Preview modal
    const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

    // Toast
    const [toast, setToast] = useState("");
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

    // Load folder
    const loadFolder = useCallback(async (folderId: string) => {
        setLoadingDrive(true);
        try {
            const parentParam = folderId === ROOT_FOLDER_ID ? "" : folderId;
            const res = await fetch(`/api/media/folders?parentId=${parentParam}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setDriveItems(data.items || []);
        } catch (err) { console.error(err); } finally { setLoadingDrive(false); }
    }, []);

    useEffect(() => { loadFolder(currentFolderId); }, [currentFolderId]);

    // Navigation
    const openFolder = (item: DriveItem) => {
        setBreadcrumb(prev => [...prev, { id: item.id, name: item.name }]);
        setCurrentFolderId(item.id);
    };
    const navigateTo = (index: number) => {
        setBreadcrumb(prev => prev.slice(0, index + 1));
        setCurrentFolderId(breadcrumb[index].id);
    };
    const goBack = () => { if (breadcrumb.length > 1) navigateTo(breadcrumb.length - 2); };

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

    // Helpers
    const formatSize = (b: number) => {
        if (!b) return ""; if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
        return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };
    const getFileType = (m: string) => m.startsWith("video/") ? "video" : m.startsWith("image/") ? "image" : "other";

    // Sort & filter
    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };
    const filtered = driveItems.filter(i => !search.trim() || i.name.toLowerCase().includes(search.toLowerCase()));
    const filteredSorted = [...filtered].sort((a, b) => {
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
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg border border-blue-200">
                        <Eye className="w-3.5 h-3.5" /> Chỉ xem & tải về
                    </span>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm overflow-x-auto">
                {breadcrumb.length > 1 && (<button onClick={goBack} className="p-1 text-slate-400 hover:text-slate-600 mr-1"><ArrowLeft className="w-4 h-4" /></button>)}
                {breadcrumb.map((item, i) => (
                    <div key={item.id} className="flex items-center shrink-0">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
                        <button onClick={() => navigateTo(i)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded ${i === breadcrumb.length - 1 ? "text-teal-600 font-medium bg-teal-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                            {i === 0 ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />} {item.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Search + sort + view */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    {(["name", "size", "createdTime"] as SortField[]).map(f => (
                        <button key={f} onClick={() => toggleSort(f)}
                            className={`px-2 py-1 rounded ${sortField === f ? "bg-teal-100 text-teal-600 font-medium" : "text-slate-500 hover:bg-slate-100"}`}>
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
                    <p className="text-xs text-slate-400 mt-1">Không có file nào trong thư mục này</p>
                </div>
            ) : viewMode === "grid" ? (
                <div>
                    {folders.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Thư mục ({folders.length})</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {folders.map(f => (
                                    <div key={f.id} className="group relative bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
                                        onClick={() => openFolder(f)}>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-10 h-10 text-amber-400 shrink-0" />
                                            <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
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
                                    <div key={file.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setPreviewItem(file)}>
                                        <div className="aspect-square bg-slate-100 relative">
                                            {getFileType(file.mimeType) === "video" ? (
                                                <div className="absolute inset-0 flex items-center justify-center"><Film className="w-10 h-10 text-slate-300" /></div>
                                            ) : (<img src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w400`} alt={file.name} className="w-full h-full object-cover" loading="lazy" />)}
                                            {/* Action buttons on hover */}
                                            <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={e => { e.stopPropagation(); copyLink(file.id); }} className="p-1.5 bg-white/90 text-slate-600 rounded-lg hover:bg-white shadow-sm" title="Copy link"><Link2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={e => { e.stopPropagation(); downloadFile(file.id, file.name); }} className="p-1.5 bg-white/90 text-slate-600 rounded-lg hover:bg-white shadow-sm" title="Tải xuống"><Download className="w-3.5 h-3.5" /></button>
                                            </div>
                                            <div className="absolute top-2 left-2">
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getFileType(file.mimeType) === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                                    {getFileType(file.mimeType) === "video" ? "Video" : "Ảnh"}
                                                </span>
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
                                <th className="p-3 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleSort("name")}>Tên {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleSort("size")}>Kích thước {sortField === "size" && (sortDir === "asc" ? "↑" : "↓")}</th>
                                <th className="p-3 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleSort("createdTime")}>Ngày tạo {sortField === "createdTime" && (sortDir === "asc" ? "↑" : "↓")}</th>
                                <th className="p-3 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSorted.map(item => (
                                <tr key={item.id} className={`transition-colors ${item.isFolder ? "hover:bg-amber-50 cursor-pointer" : "hover:bg-slate-50"}`}
                                    onClick={() => item.isFolder ? openFolder(item) : setPreviewItem(item)}>
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
        </div>
    );
}
