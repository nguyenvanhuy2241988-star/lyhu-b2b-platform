'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import {
    DocumentFolder,
    DocumentFile,
    listFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    listFiles,
    uploadFiles
} from '@/lib/documentsStore';
import { FolderTree } from '@/components/documents/FolderTree';
import { FilesGrid } from '@/components/documents/FilesGrid';
import { DocDetailsPanel } from '@/components/documents/DocDetailsPanel';
import { FolderInspector } from '@/components/documents/FolderInspector';
import {
    Search,
    Upload,
    Menu
} from 'lucide-react';

console.log('[DocumentsPage] Loaded');

function DocumentsPageContent() {
    console.log('[DocumentsPageContent] Rendering');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Permission
    const { user, session } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Data State
    const [folders, setFolders] = useState<DocumentFolder[]>([]);
    const [files, setFiles] = useState<DocumentFile[]>([]);

    // UI State
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    // Search Filters
    const [isGlobalSearch, setIsGlobalSearch] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf' | 'office'>('all');

    // Selection State
    const selectedFolderId = searchParams?.get('folder');
    const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const replaceFolderUrl = useCallback((id: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('folder', id);
        router.replace(url.pathname + url.search);
    }, [router]);

    const loadFolders = useCallback(async (silent = false) => {
        try {
            const data = await listFolders();
            setFolders(data);
            return data;
        } catch (error) {
            console.error(error);
            return [];
        }
    }, []);

    const loadFiles = useCallback(async (folderId: string | null, silent = false) => {
        if (!silent) setLoadingFiles(true);
        try {
            // If global search is on, pass null as folderId. Otherwise pass the selected folderId.
            const targetFolderId = isGlobalSearch ? null : folderId;

            // If not global search and no folder selected, don't load anything (or load root if logic dictates)
            if (!isGlobalSearch && !targetFolderId) {
                setFiles([]);
                return;
            }

            const data = await listFiles(targetFolderId, search, filterType);
            setFiles(data);
        } catch (error) {
            console.error(error);
        } finally {
            if (!silent) setLoadingFiles(false);
        }
    }, [search, isGlobalSearch, filterType]);

    // 1. Initial Load of Folders
    useEffect(() => {
        if (!session?.access_token) return;

        loadFolders().then((data) => {
            // If no folder in URL, select root "Công ty" or first folder
            if (!selectedFolderId && data.length > 0) {
                const root = data.find(f => f.name === 'Công ty' && !f.parent_id);
                const defaultId = root?.id || data[0].id;
                replaceFolderUrl(defaultId);
            }
        });

        // Realtime for Folders
        const folderChannel = supabase
            .channel('docs_folders_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_folders' }, () => loadFolders(true))
            .subscribe((status: any) => {
                if (status === 'SUBSCRIBED') loadFolders(true);
            });

        return () => {
            supabase.removeChannel(folderChannel);
        };
    }, [session?.access_token, loadFolders, replaceFolderUrl, selectedFolderId]);

    // 2. Load Files when params change
    useEffect(() => {
        if (!session?.access_token) return;

        loadFiles(selectedFolderId || null);

        // Realtime for Files 
        let fileChannel: any = null;
        if (selectedFolderId && !isGlobalSearch) {
            fileChannel = supabase
                .channel(`docs_files_${selectedFolderId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_files', filter: `folder_id=eq.${selectedFolderId}` }, () => loadFiles(selectedFolderId, true))
                .subscribe();
        }

        return () => {
            if (fileChannel) supabase.removeChannel(fileChannel);
        };
    }, [selectedFolderId, session?.access_token, loadFiles, isGlobalSearch]);

    // Actions
    const handleSelectFolder = (id: string) => {
        replaceFolderUrl(id);
        setIsGlobalSearch(false); // Switch back to folder view when a folder is clicked
    };

    const handleCreateFolder = async (parentId: string | null) => {
        const name = prompt("Nhập tên thư mục mới:", "Thư mục mới");
        if (!name) return;
        try {
            const newFolder = await createFolder({ name, parent_id: parentId });
            await loadFolders();
            handleSelectFolder(newFolder.id);
        } catch (e: any) {
            console.error(e);
            alert("Lỗi tạo thư mục: " + (e?.message || "Unknown error"));
        }
    };

    const handleRenameFolder = async (folder: DocumentFolder) => {
        const name = prompt("Nhập tên mới:", folder.name);
        if (!name || name === folder.name) return;
        try {
            await renameFolder(folder.id, name);
            loadFolders();
        } catch (e) {
            alert("Lỗi đổi tên");
        }
    };

    const handleDeleteFolder = async (folder: DocumentFolder) => {
        if (!confirm(`Bạn chắc chắn xóa thư mục "${folder.name}"?`)) return;
        try {
            await deleteFolder(folder.id);
            if (selectedFolderId === folder.id) {
                router.replace('/documents'); // clear selection or go to root
            }
            loadFolders();
        } catch (e) {
            alert("Lỗi xóa thư mục");
        }
    };

    const handleUploadFiles = async (fileList: File[]) => {
        if (!selectedFolderId) {
            alert("Vui lòng chọn thư mục để tải lên");
            return;
        }
        setUploading(true);
        try {
            await uploadFiles(selectedFolderId, fileList);
            // Reload files
            loadFiles(selectedFolderId);
        } catch (error: any) {
            console.error(error);
            alert("Lỗi tải file: " + (error?.message || "Unknown error"));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        handleUploadFiles(Array.from(e.target.files));
    };

    const [isDragging, setIsDragging] = useState(false);

    // Derived Selection
    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Left: Folder Tree */}
            <div
                className={`flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200 bg-white
                ${showSidebar ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden border-none'}`}
            >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 h-16 box-border">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded p-1 transition-colors"
                            title="Đóng danh sách"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="font-bold text-slate-800 whitespace-nowrap">Tài liệu</h2>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin w-64">
                    <FolderTree
                        folders={folders}
                        selectedFolderId={selectedFolderId}
                        readOnly={!isAdmin}
                        onSelectFolder={handleSelectFolder}
                        onCreateFolder={handleCreateFolder}
                        onRenameFolder={handleRenameFolder}
                        onDeleteFolder={handleDeleteFolder}
                    />
                </div>
            </div>

            {/* Center: Main Content (Files Grid) */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Topbar */}
                <div className="h-auto border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 shrink-0 bg-white z-10 transition-all">

                    <div className="flex items-center gap-4 flex-1 w-full">
                        {!showSidebar && (
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors shrink-0"
                                title="Mở danh sách thư mục"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 flex-1">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={isGlobalSearch ? "Tìm kiếm trong toàn bộ kho..." : "Tìm kiếm trong thư mục hiện tại..."}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 transition text-sm"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Filters */}
                            <select
                                className="px-3 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 transition text-sm text-slate-700 outline-none cursor-pointer"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                            >
                                <option value="all">Tất cả định dạng</option>
                                <option value="image">Hình ảnh</option>
                                <option value="pdf">PDF</option>
                                <option value="office">Word / Excel</option>
                            </select>

                            {/* Global Toggle */}
                            <button
                                onClick={() => setIsGlobalSearch(!isGlobalSearch)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                    ${isGlobalSearch
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {isGlobalSearch ? '🌐 Tìm tất cả' : '📁 Thư mục này'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <button
                            disabled={!selectedFolderId || uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium shadow-sm w-full md:w-auto justify-center"
                        >
                            {uploading ? (
                                <span className="animate-spin mr-1">↻</span>
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            Tải lên
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    className="flex-1 overflow-y-auto p-6 scrollbar-thin relative"
                    onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={e => {
                        e.preventDefault();
                        setIsDragging(false);
                    }}
                    onDrop={async e => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (!selectedFolderId) {
                            alert("Vui lòng chọn thư mục trước khi tải file!");
                            return;
                        }
                        const droppedFiles = Array.from(e.dataTransfer.files);
                        if (droppedFiles.length > 0) {
                            handleUploadFiles(droppedFiles);
                        }
                    }}
                >
                    {isDragging && (
                        <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-500 z-50 flex flex-col items-center justify-center pointer-events-none">
                            <Upload className="w-12 h-12 text-blue-500 mb-2" />
                            <p className="text-blue-700 font-medium text-lg">Thả file vào đây để tải lên</p>
                        </div>
                    )}

                    {selectedFolder ? (
                        <div className="pb-20">
                            {/* Breadcrumb or Title (optional) */}
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {selectedFolder.name}
                                </h2>
                            </div>

                            <FilesGrid
                                files={files}
                                loading={loadingFiles}
                                selectedFileId={selectedFile?.id || null}
                                onSelectFile={setSelectedFile}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <span className="text-4xl mb-4">📂</span>
                            <p>Chọn một thư mục để xem tài liệu</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Inspector Panel (File OR Folder) */}
            {selectedFile ? (
                <DocDetailsPanel
                    file={selectedFile}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedFile(null)}
                    onUpdate={() => selectedFolderId && loadFiles(selectedFolderId)}
                />
            ) : selectedFolder ? (
                <FolderInspector
                    folder={selectedFolder}
                    onUpdate={(updated) => {
                        setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
                    }}
                    onClose={() => { }}
                />
            ) : null}
        </div>
    );
}

export default function DocumentsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <DocumentsPageContent />
        </Suspense>
    );
}
