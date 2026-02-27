'use client';

import React from 'react';
import { DocumentFile } from '@/lib/documentsStore';
import { FileText, ImageIcon, FileSpreadsheet, FileIcon } from "lucide-react";
import { cn } from '@/lib/utils';
import { format } from "date-fns";

interface FilesListProps {
    files: DocumentFile[];
    loading: boolean;
    selectedFileId: string | null;
    selectedFileIds?: Set<string>;
    onSelectFile: (file: DocumentFile) => void;
    onToggleFileSelect?: (fileId: string, multi: boolean) => void;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileIcon className="w-5 h-5 text-slate-400" />;
};

export function FilesList({ files, loading, selectedFileId, selectedFileIds = new Set(), onSelectFile, onToggleFileSelect }: FilesListProps) {
    if (loading) {
        return <div className="text-center py-12 text-slate-400">Đang tải tài liệu...</div>;
    }

    if (files.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
                    <FileIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-medium">Thư mục trống</p>
                <p className="text-xs text-slate-400 mt-1">Kéo thả file hoặc nhấn "Tải lên" để thêm tài liệu</p>
            </div>
        );
    }

    return (
        <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <th className="py-3 px-4 w-10"></th>
                        <th className="py-3 px-4">Tên tài liệu</th>
                        <th className="py-3 px-4 w-32">Kích thước</th>
                        <th className="py-3 px-4 w-40">Ngày tải lên</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map(file => {
                        const isSelected = selectedFileId === file.id || selectedFileIds.has(file.id);
                        return (
                            <tr
                                key={file.id}
                                draggable
                                onDragStart={(e) => {
                                    if (selectedFileIds.has(file.id) && selectedFileIds.size > 1) {
                                        e.dataTransfer.setData('text/plain', JSON.stringify(Array.from(selectedFileIds)));
                                    } else {
                                        e.dataTransfer.setData('text/plain', file.id);
                                    }
                                    e.dataTransfer.effectAllowed = 'move';

                                    if (selectedFileIds.has(file.id) && selectedFileIds.size > 1) {
                                        const crt = document.createElement("div");
                                        crt.innerHTML = `Đang di chuyển ${selectedFileIds.size} file`;
                                        crt.style.backgroundColor = "#2563eb";
                                        crt.style.color = "white";
                                        crt.style.padding = "4px 12px";
                                        crt.style.borderRadius = "8px";
                                        crt.style.position = "absolute";
                                        crt.style.top = "-1000px";
                                        document.body.appendChild(crt);
                                        e.dataTransfer.setDragImage(crt, 0, 0);
                                        setTimeout(() => document.body.removeChild(crt), 0);
                                    }
                                }}
                                className={cn(
                                    "border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors cursor-pointer select-none",
                                    isSelected ? "bg-blue-50 hover:bg-blue-50" : ""
                                )}
                                onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey) {
                                        if (onToggleFileSelect) onToggleFileSelect(file.id, true);
                                    } else {
                                        onSelectFile(file);
                                        if (onToggleFileSelect) onToggleFileSelect(file.id, false);
                                    }
                                }}
                            >
                                <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center">
                                        {getFileIcon(file.mime_type)}
                                    </div>
                                </td>
                                <td className="py-3 px-4 font-medium text-slate-700 truncate max-w-[200px]" title={file.title}>
                                    {file.title}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                    {(file.size_bytes / 1024).toFixed(0)} KB
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                    {format(new Date(file.created_at), 'dd/MM/yyyy HH:mm')}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
