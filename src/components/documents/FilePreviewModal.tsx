'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Assuming you have shadcn dialog or similar
import { DocumentFile, getFileSignedUrl } from '@/lib/documentsStore';

interface FilePreviewModalProps {
    file: DocumentFile | null;
    open: boolean;
    onClose: () => void;
}

export function FilePreviewModal({ file, open, onClose }: FilePreviewModalProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && file) {
            setLoading(true);
            getFileSignedUrl(file.storage_path).then(signedUrl => {
                setUrl(signedUrl);
                setLoading(false);
            });
        } else {
            setUrl(null);
        }
    }, [open, file]);

    if (!file) return null;

    const mime = file.mime_type;
    const isPdf = mime.includes('pdf');
    const isImage = mime.startsWith('image/');
    const isOffice =
        mime.includes('word') ||
        mime.includes('excel') ||
        mime.includes('spreadsheet') ||
        mime.includes('presentation') ||
        mime.includes('openxmlformats');

    // Helper to render content
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-slate-500">Đang tải bản xem trước...</p>
                </div>
            );
        }

        if (!url) return <p className="text-center text-red-500">Không thể tải URL file.</p>;

        // 1. Image
        if (isImage) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={file.title} className="max-w-full max-h-full object-contain shadow-lg" />
                </div>
            );
        }

        // 2. PDF (Native Embed)
        if (isPdf) {
            return (
                <iframe
                    src={url + "#toolbar=0"}
                    className="w-full h-full border-0 bg-white"
                    title="PDF Preview"
                />
            );
        }

        // 3. Office Files (Google Docs Viewer)
        if (isOffice) {
            // Google Viewer requires encoded URL
            const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
            return (
                <iframe
                    src={viewerUrl}
                    className="w-full h-full border-0 bg-white"
                    title="Office Preview"
                />
            );
        }

        // 4. Default / Unsupported
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p className="mb-4 text-lg">Định dạng này chưa hỗ trợ xem trước trực tiếp.</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> Tải về để xem
                </a>
            </div>
        );
    };

    return (
        // Simple Fixed Overlay if Dialog component is messy/complex to integrate quickly, 
        // but let's try to make a custom fullscreen overlay to be safe and independent.
        open ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
                <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-50 rounded text-blue-600">
                                {isPdf ? "PDF" : isOffice ? "OFFICE" : isImage ? "IMG" : "FILE"}
                            </div>
                            <h3 className="font-semibold text-slate-800 truncate max-w-md" title={file.title}>
                                {file.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {url && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 hover:bg-slate-100 rounded text-slate-600"
                                    title="Mở trong tab mới"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-slate-50 relative overflow-hidden">
                        {renderContent()}
                    </div>
                </div>
            </div>
        ) : null
    );
}
