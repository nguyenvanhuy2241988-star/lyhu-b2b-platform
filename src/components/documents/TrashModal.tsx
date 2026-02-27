'use client';

import React, { useEffect, useState } from 'react';
import {
    DocumentFolder,
    DocumentFile,
    listDeletedFolders,
    listDeletedFiles,
    restoreFolder,
    restoreFile,
    permanentlyDeleteFolder,
    permanentlyDeleteFile
} from '@/lib/documentsStore';
import { X, RefreshCcw, Trash2, Folder, FileText, ImageIcon, FileSpreadsheet, FileIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface TrashModalProps {
    onClose: () => void;
    onRestored: () => void; // Trigger reload of main view when something is restored
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileIcon className="w-5 h-5 text-slate-400" />;
};

export function TrashModal({ onClose, onRestored }: TrashModalProps) {
    const [folders, setFolders] = useState<DocumentFolder[]>([]);
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadTrash = async () => {
        setLoading(true);
        try {
            const [fldrs, fls] = await Promise.all([
                listDeletedFolders(),
                listDeletedFiles()
            ]);
            setFolders(fldrs);
            setFiles(fls);
        } catch (error) {
            console.error("Lỗi tải thùng rác:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrash();
    }, []);

    const handleRestoreFolder = async (id: string) => {
        setActionLoading(`restore-folder-${id}`);
        try {
            await restoreFolder(id);
            await loadTrash();
            onRestored();
        } catch (e: any) {
            alert("Lỗi khôi phục: " + (e?.message || ""));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestoreFile = async (id: string) => {
        setActionLoading(`restore-file-${id}`);
        try {
            await restoreFile(id);
            await loadTrash();
            onRestored();
        } catch (e: any) {
            alert("Lỗi khôi phục: " + (e?.message || ""));
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermDeleteFolder = async (folder: DocumentFolder) => {
        if (!confirm(`Bạn chắc chắn muốn xóa vĩnh viễn thư mục "${folder.name}"? Hành động này không thể hoàn tác.`)) return;
        setActionLoading(`del-folder-${folder.id}`);
        try {
            await permanentlyDeleteFolder(folder.id);
            await loadTrash();
        } catch (e: any) {
            alert("Lỗi xóa vĩnh viễn: " + (e?.message || ""));
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermDeleteFile = async (file: DocumentFile) => {
        if (!confirm(`Bạn chắc chắn muốn xóa vĩnh viễn file "${file.title}"? Hành động này không thể hoàn tác.`)) return;
        setActionLoading(`del-file-${file.id}`);
        try {
            await permanentlyDeleteFile(file.id, file.storage_path);
            await loadTrash();
        } catch (e: any) {
            alert("Lỗi xóa vĩnh viễn: " + (e?.message || ""));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3 text-slate-800">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Thùng Rác</h2>
                            <p className="text-sm text-slate-500">Các thư mục và tài liệu đã bị xóa nằm ở đây.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="ml-2">Đang tải...</span>
                        </div>
                    ) : folders.length === 0 && files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <Trash2 className="w-12 h-12 mb-3 text-slate-300" />
                            <p>Thùng rác đang trống</p>
                        </div>
                    ) : (
                        <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                        <th className="py-3 px-4 w-10">Loại</th>
                                        <th className="py-3 px-4">Tên</th>
                                        <th className="py-3 px-4 w-40">Ngày xóa</th>
                                        <th className="py-3 px-4 w-32 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Folders */}
                                    {folders.map(folder => (
                                        <tr key={folder.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-center">
                                                <Folder className="w-5 h-5 text-blue-500 mx-auto" />
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-700 truncate max-w-[200px]" title={folder.name}>
                                                {folder.name}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">
                                                {format(new Date(folder.updated_at), 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        title="Khôi phục"
                                                        onClick={() => handleRestoreFolder(folder.id)}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                                                    >
                                                        {actionLoading === `restore-folder-${folder.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        title="Xóa vĩnh viễn"
                                                        onClick={() => handlePermDeleteFolder(folder)}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                    >
                                                        {actionLoading === `del-folder-${folder.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Files */}
                                    {files.map(file => (
                                        <tr key={file.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-center">
                                                {getFileIcon(file.mime_type)}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-700 truncate max-w-[200px]" title={file.title}>
                                                {file.title}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">
                                                {format(new Date(file.updated_at), 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        title="Khôi phục"
                                                        onClick={() => handleRestoreFile(file.id)}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                                                    >
                                                        {actionLoading === `restore-file-${file.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        title="Xóa vĩnh viễn"
                                                        onClick={() => handlePermDeleteFile(file)}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                    >
                                                        {actionLoading === `del-file-${file.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
            </div>
        </div>
    );
}
