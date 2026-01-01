'use client';

import React, { useEffect, useState } from 'react';
import { DocumentFile, DocumentActivity, listActivity, getFileSignedUrl, renameFile, moveFile, deleteFile } from '@/lib/documentsStore';
import {
    X,
    Download,
    FileText,
    Clock,
    Trash2,
    Edit2,
    ArrowRight,
    Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';

interface DocDetailsPanelProps {
    file: DocumentFile | null;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh
}

export function DocDetailsPanel({ file, onClose, onUpdate }: DocDetailsPanelProps) {
    const [activity, setActivity] = useState<DocumentActivity[]>([]);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (file) {
            setNewName(file.title);
            // Load activity
            listActivity('file', file.id).then(setActivity);
            // Get URL (valid 1hr)
            getFileSignedUrl(file.storage_path).then(setSignedUrl);
        } else {
            setActivity([]);
            setSignedUrl(null);
        }
    }, [file]);

    if (!file) return null;

    const handleRename = async () => {
        if (!newName.trim() || newName === file.title) {
            setRenaming(false);
            return;
        }
        try {
            await renameFile(file.id, newName);
            onUpdate();
            setRenaming(false);
        } catch (error) {
            console.error(error);
            alert("Lỗi đổi tên");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc muốn xóa file này không?")) return;
        try {
            await deleteFile(file.id);
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Lỗi xóa file");
        }
    };

    const isImage = file.mime_type.startsWith('image/');

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200 w-80 lg:w-96 shadow-xl relative z-10 transition-transform">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Chi tiết</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Preview */}
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                    {isImage && signedUrl ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={signedUrl}
                                alt={file.title}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="text-center p-4">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">{file.mime_type}</p>
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="space-y-4">
                    <div className="group">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Tên file</label>
                        {renaming ? (
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    className="flex-1 px-2 py-1 text-sm border rounded"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    autoFocus
                                    onBlur={handleRename}
                                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-sm font-medium text-slate-900 break-words">{file.title}</p>
                                <button onClick={() => setRenaming(true)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Kích thước</label>
                            <p className="text-sm text-slate-700 mt-1">{(file.size_bytes / 1024).toFixed(1)} KB</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Ngày tạo</label>
                            <p className="text-sm text-slate-700 mt-1">{format(new Date(file.created_at), "dd/MM/yyyy", { locale: vi })}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <a
                        href={signedUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={!signedUrl ? "pointer-events-none opacity-50" : ""}
                    >
                        <button disabled={!signedUrl} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                            <Download className="w-4 h-4" /> Tải về
                        </button>
                    </a>
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                </div>

                {/* Activity Log */}
                <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Lịch sử hoạt động
                    </h4>
                    <div className="space-y-3">
                        {activity.map(a => (
                            <div key={a.id} className="flex gap-3 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-slate-700 font-medium">
                                        {a.action === 'create' && 'Tạo mới'}
                                        {a.action === 'upload' && 'Tải lên'}
                                        {a.action === 'rename' && 'Đổi tên'}
                                        {a.action === 'move' && 'Di chuyển'}
                                        {a.action === 'delete' && 'Xóa'}
                                        {a.action === 'update_guidance' && 'Cập nhật hướng dẫn'}
                                    </p>
                                    <p className="text-slate-500">{a.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {activity.length === 0 && <p className="text-xs text-slate-400 pl-4">Chưa có hoạt động nào.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
