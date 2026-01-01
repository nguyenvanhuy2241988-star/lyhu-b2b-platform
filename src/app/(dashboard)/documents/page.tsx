'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
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
import {
    FolderTree
} from '@/components/documents/FolderTree';
import {
    FilesGrid
} from '@/components/documents/FilesGrid';
import {
    DocDetailsPanel
} from '@/components/documents/DocDetailsPanel';
import {
    FolderInspector
} from '@/components/documents/FolderInspector';
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
    const { session } = useAuth();

    // Data State
    const [folders, setFolders] = useState<DocumentFolder[]>([]);
    const [files, setFiles] = useState<DocumentFile[]>([]);

    // UI State
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);

    // Selection State
    const selectedFolderId = searchParams?.get('folder');
    const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
    }, [session?.access_token]);

    // 2. Load Files when folder changes
    useEffect(() => {
        if (!session?.access_token) return;

        if (selectedFolderId) {
            loadFiles(selectedFolderId);
            setSelectedFile(null); // Deselect file when switching folder
        } else {
            setFiles([]);
        }

        // Realtime for Files in this folder
        const fileChannel = supabase
            .channel(`docs_files_${selectedFolderId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_files', filter: `folder_id=eq.${selectedFolderId}` }, () => loadFiles(selectedFolderId, true))
            .subscribe((status: any) => {
                if (status === 'SUBSCRIBED' && selectedFolderId) loadFiles(selectedFolderId, true);
            });

        return () => {
            supabase.removeChannel(fileChannel);
        };
    }, [selectedFolderId, session?.access_token]);

    const replaceFolderUrl = (id: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('folder', id);
        router.replace(url.pathname + url.search);
    };

    const loadFolders = async (silent = false) => {
        try {
            const data = await listFolders();
            setFolders(data);
            return data;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const loadFiles = async (folderId: string, silent = false) => {
        if (!silent) setLoadingFiles(true);
        try {
            const data = await listFiles(folderId, search);
            setFiles(data);
        } catch (error) {
            console.error(error);
        } finally {
            if (!silent) setLoadingFiles(false);
        }
    };

    // Actions
    const handleSelectFolder = (id: string) => {
        replaceFolderUrl(id);
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

    const [isDragging, setIsDragging] = useState(false);

    const handleUploadFiles = async (fileList: File[]) => {
        if (!selectedFolderId) return;
        setUploading(true);
        try {
            await uploadFiles(selectedFolderId, fileList);
            await loadFiles(selectedFolderId);
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

    // Derived Selection
    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Left: Folder Tree */}
            <div className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all ${selectedFolder ? 'block' : 'hidden md:flex'}`}>
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <Menu className="w-5 h-5 text-slate-400" />
                    <h2 className="font-bold text-slate-800">Tài liệu</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    <FolderTree
                        folders={folders}
                        selectedFolderId={selectedFolderId}
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
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tài liệu..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 transition text-sm"
                                value={search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    if (selectedFolderId) loadFiles(selectedFolderId);
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
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
                    onClose={() => setSelectedFile(null)}
                    onUpdate={() => selectedFolderId && loadFiles(selectedFolderId)}
                />
            ) : selectedFolder ? (
                <FolderInspector
                    folder={selectedFolder}
                    onUpdate={(updated) => {
                        // Update local list
                        setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
                    }}
                    onClose={() => {
                        // Optional: Allow "closing" the right panel to go full width?
                        // For now, keep it open Odoo-style
                    }}
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
