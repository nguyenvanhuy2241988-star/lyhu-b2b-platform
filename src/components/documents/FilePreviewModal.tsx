'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { DocumentFile, getFileSignedUrl } from '@/lib/documentsStore';

interface FilePreviewModalProps {
    file: DocumentFile | null;
    open: boolean;
    onClose: () => void;
}

export function FilePreviewModal({ file, open, onClose }: FilePreviewModalProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewerType, setViewerType] = useState<'google' | 'microsoft'>('google');

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

    const mime = file.mime_type || '';
    const isPdf = mime.includes('pdf') || file.original_name.toLowerCase().endsWith('.pdf');
    const isImage = mime.startsWith('image/');
    const isExcel = mime.includes('excel') || mime.includes('spreadsheet') || file.original_name.toLowerCase().endsWith('.xlsx') || file.original_name.toLowerCase().endsWith('.xls');
    const isOffice =
        isExcel ||
        mime.includes('word') ||
        mime.includes('presentation') ||
        mime.includes('openxmlformats') ||
        file.original_name.toLowerCase().endsWith('.docx') ||
        file.original_name.toLowerCase().endsWith('.pptx');

    const isLargeOfficeFile = isOffice && file.size_bytes > 10 * 1024 * 1024; // > 10MB Google/MS cannot preview

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center p-12 h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00AFA9] mb-4" />
                    <p className="text-slate-500 font-medium">Đang tải bản xem trước...</p>
                </div>
            );
        }

        if (!url) return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                <p className="text-center font-medium text-slate-700">Không thể tải liên kết xem trước của file.</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại hoặc tải file về máy.</p>
            </div>
        );

        // 1. Image
        if (isImage) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-auto p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={file.title} className="max-w-full max-h-full object-contain border border-slate-200 rounded shadow-sm" />
                </div>
            );
        }

        // 2. PDF (Native Embed)
        if (isPdf) {
            return (
                <iframe
                    src={url + "#toolbar=1"}
                    className="w-full h-full border-0 bg-white"
                    title="PDF Preview"
                />
            );
        }

        // 3. Large Office file (> 10MB) -> Google & MS viewers reject files over 10MB
        if (isLargeOfficeFile) {
            const sizeMB = (file.size_bytes / (1024 * 1024)).toFixed(1);
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 p-8 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{file.title}</h4>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 mb-4">
                        Dung lượng: {sizeMB} MB
                    </span>
                    <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                        Tệp Excel này có dung lượng lớn ({sizeMB} MB), vượt quá giới hạn 10MB của trình xem trực tuyến của Google.
                    </p>
                    <p className="text-xs text-slate-400 mb-6">
                        Để đảm bảo dữ liệu hiển thị chính xác và không bị gián đoạn, vui lòng tải về để mở bằng Microsoft Excel trên máy tính.
                    </p>
                    <a
                        href={url}
                        download={file.title}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-[#00AFA9] hover:bg-[#009690] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 text-sm"
                    >
                        <Download className="w-4 h-4" /> Tải về máy để mở Excel
                    </a>
                </div>
            );
        }

        // 4. Standard Office Files (<= 10MB)
        if (isOffice) {
            const viewerUrl = viewerType === 'google'
                ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
                : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

            return (
                <div className="w-full h-full flex flex-col">
                    <div className="px-4 py-2 bg-slate-100 border-b flex items-center justify-between text-xs text-slate-600">
                        <span>Trình xem: {viewerType === 'google' ? 'Google Docs Viewer' : 'Microsoft Office Viewer'}</span>
                        <button
                            onClick={() => setViewerType(v => v === 'google' ? 'microsoft' : 'google')}
                            className="text-[#00AFA9] hover:underline font-semibold"
                        >
                            Chuyển sang {viewerType === 'google' ? 'Microsoft Viewer' : 'Google Viewer'}
                        </button>
                    </div>
                    <iframe
                        src={viewerUrl}
                        className="w-full flex-1 border-0 bg-white"
                        title="Office Preview"
                    />
                </div>
            );
        }

        // 5. Default / Unsupported
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                <p className="mb-4 text-base font-medium">Định dạng file này chưa hỗ trợ xem trực tiếp trên trình duyệt.</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    download={file.title}
                    className="px-5 py-2.5 bg-[#00AFA9] text-white rounded-xl hover:bg-[#009690] flex items-center gap-2 font-semibold text-sm shadow-sm"
                >
                    <Download className="w-4 h-4" /> Tải về để xem
                </a>
            </div>
        );
    };

    return (
        open ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 md:p-8" onClick={onClose}>
                <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-teal-50 rounded-lg text-[#00AFA9] font-bold text-xs uppercase">
                                {isPdf ? "PDF" : isExcel ? "EXCEL" : isOffice ? "OFFICE" : isImage ? "IMG" : "FILE"}
                            </div>
                            <h3 className="font-semibold text-slate-800 truncate max-w-md text-sm" title={file.title}>
                                {file.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {url && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={file.title}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                    title="Tải file về máy"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Tải về</span>
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
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
