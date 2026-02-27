'use client';

import React, { useState, useEffect } from 'react';
import { DocumentFile, getFileSignedUrl } from '@/lib/documentsStore';
import { FileText, Download, Trash2, Eye, ExternalLink, ImageIcon, Loader2, FileSpreadsheet, FileIcon } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';

interface FilesGridProps {
    files: DocumentFile[];
    loading: boolean;
    selectedFileId: string | null;
    onSelectFile: (file: DocumentFile) => void;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-8 h-8 text-blue-500" />;
    return <FileIcon className="w-8 h-8 text-slate-400" />;
};

function FileThumbnail({ file }: { file: DocumentFile }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const isImage = file.mime_type.startsWith('image/');

    useEffect(() => {
        let mounted = true;
        if (isImage) {
            setLoading(true);
            getFileSignedUrl(file.storage_path).then(url => {
                if (mounted && url) setImageUrl(url);
                if (mounted) setLoading(false);
            });
        }
        return () => { mounted = false; };
    }, [file.id, file.storage_path, isImage]);

    if (!isImage) {
        return (
            <div className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-lg">
                {getFileIcon(file.mime_type)}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-32 flex items-center justify-center bg-slate-50 rounded-lg">
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
        );
    }

    if (imageUrl) {
        return (
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                <Image
                    src={imageUrl}
                    alt={file.title || "Tài liệu"}
                    fill
                    className="object-cover"
                />
            </div>
        );
    }

    // Fallback if image load failed or imageUrl is null
    return (
        <div className="w-full h-32 flex items-center justify-center bg-slate-50 rounded-lg text-slate-300">
            <ImageIcon className="w-8 h-8" />
        </div>
    );
}

export function FilesGrid({ files, loading, selectedFileId, onSelectFile }: FilesGridProps) {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map(file => {
                const isSelected = selectedFileId === file.id;
                return (
                    <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', file.id);
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        className={cn(
                            "group relative flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                            isSelected
                                ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20"
                                : "bg-white border-slate-200 hover:border-blue-200"
                        )}
                        onClick={() => onSelectFile(file)}
                    >
                        <div className="mb-3 w-full">
                            <FileThumbnail file={file} />
                        </div>

                        <div className="w-full text-center px-1">
                            <h3 className="text-sm font-medium text-slate-700 truncate w-full" title={file.title}>
                                {file.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                {(file.size_bytes / 1024).toFixed(0)} KB
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
