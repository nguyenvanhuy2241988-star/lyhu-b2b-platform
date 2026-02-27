import React, { useEffect, useState } from 'react';
import { DocumentFile, DocumentActivity, listActivity, getFileSignedUrl, renameFile, deleteFile, updateFileCaptions } from '@/lib/documentsStore';
import {
    X,
    Download,
    FileText,
    Clock,
    Trash2,
    Edit2,
    Image as ImageIcon,
    Eye,
    MessageSquare,
    Plus,
    Save
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';
import { FilePreviewModal } from './FilePreviewModal';
import { TagSelector } from './TagSelector';
import { toast } from 'sonner';

interface DocDetailsPanelProps {
    file: DocumentFile | null;
    isAdmin: boolean;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh
}

export function DocDetailsPanel({ file, isAdmin, onClose, onUpdate }: DocDetailsPanelProps) {
    const [activity, setActivity] = useState<DocumentActivity[]>([]);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Content/Captions State
    const [captions, setCaptions] = useState<string[]>([]);
    const [isEditingContent, setIsEditingContent] = useState(false);

    useEffect(() => {
        if (file) {
            setNewName(file.title);
            // Load activity
            listActivity('file', file.id).then(setActivity);
            // Get URL (valid 1hr)
            getFileSignedUrl(file.storage_path).then(setSignedUrl);

            // Set captions (ensure array)
            const caps = file.captions || [];
            setCaptions(Array.isArray(caps) ? caps : []);
        } else {
            setActivity([]);
            setSignedUrl(null);
            setCaptions([]);
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

    // --- Content Manager Logic ---
    const handleAddCaption = () => {
        setCaptions([...captions, ""]);
        setIsEditingContent(true);
    };

    const handleUpdateCaption = (index: number, val: string) => {
        const newCaps = [...captions];
        newCaps[index] = val;
        setCaptions(newCaps);
    };

    const handleDeleteCaption = (index: number) => {
        const newCaps = captions.filter((_, i) => i !== index);
        setCaptions(newCaps);
        // If removing while saved, we might want to auto-save or wait for explicit save.
        // Let's require explicit save for safety.
        setIsEditingContent(true);
    };

    const handleSaveContent = async () => {
        try {
            // Filter empty
            const validCaptions = captions.filter(c => c.trim().length > 0);
            await updateFileCaptions(file.id, validCaptions);
            setCaptions(validCaptions);
            setIsEditingContent(false);
            toast.success("Đã lưu nội dung bài đăng!");
            onUpdate(); // refresh parent to keep sync
        } catch (error) {
            console.error(error);
            toast.error("Lỗi lưu nội dung");
        }
    };

    const isImage = file.mime_type.startsWith('image/');

    return (
        <>
            <div className="h-full flex flex-col bg-white border-l border-slate-200 w-80 lg:w-[450px] shadow-xl relative z-10 transition-transform">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-20">
                    <h3 className="font-semibold text-slate-800">Chi tiết Tài liệu</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">

                    {/* Preview Thumbnail */}
                    <div
                        className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 cursor-pointer group relative shadow-sm"
                        onClick={() => setShowPreview(true)}
                    >
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
                                <p className="text-xs text-slate-500 uppercase font-bold">{file.mime_type.split('/')[1] || 'FILE'}</p>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-medium flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Xem trước
                            </p>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
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
                                    {isAdmin && (
                                        <button onClick={() => setRenaming(true)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    )}
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

                        {/* Tagging */}
                        <div className="pt-2 border-t border-slate-200 mt-2">
                            <TagSelector
                                entityId={file.id}
                                entityType="file"
                                currentTags={file.tags}
                                onTagsChanged={onUpdate}
                            />
                        </div>
                    </div>

                    {/* --- CONTENT / CAPTIONS SECTION --- */}
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-600" />
                                Nội dung bài đăng ({captions.length})
                            </h4>
                            {isEditingContent ? (
                                <button
                                    onClick={handleSaveContent}
                                    className="text-xs flex items-center gap-1 bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                                >
                                    <Save className="w-3 h-3" /> Lưu
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddCaption}
                                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100"
                                >
                                    <Plus className="w-3 h-3" /> Thêm mẫu
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {captions.length === 0 ? (
                                <div className="text-center py-4 text-sm text-slate-400 italic">
                                    Chưa có mẫu content nào. Hãy thêm để Bot sử dụng.
                                </div>
                            ) : (
                                captions.map((cap, idx) => (
                                    <div key={idx} className="relative group">
                                        <textarea
                                            value={cap}
                                            onChange={(e) => {
                                                handleUpdateCaption(idx, e.target.value);
                                                setIsEditingContent(true);
                                            }}
                                            className="w-full text-sm p-3 rounded-lg border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                                            placeholder={`Mẫu nội dung #${idx + 1}...`}
                                        />
                                        <button
                                            onClick={() => handleDeleteCaption(idx)}
                                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Xóa mẫu này"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                ))
                            )}
                            {captions.length > 0 && (
                                <button
                                    onClick={handleAddCaption}
                                    className="w-full py-2 border border-dashed border-indigo-300 text-indigo-500 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Thêm biến thể mới
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                        >
                            <Eye className="w-4 h-4" /> Xem trước File
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href={signedUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={!signedUrl ? "pointer-events-none opacity-50 block" : "block"}
                            >
                                <button disabled={!signedUrl} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium">
                                    <Download className="w-4 h-4" /> Tải về
                                </button>
                            </a>

                            {isAdmin && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" /> Xóa
                                </button>
                            )}
                        </div>
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
                                            {a.action === 'update_guidance' && 'Cập nhật nội dung'}
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

            <FilePreviewModal
                file={file}
                open={showPreview}
                onClose={() => setShowPreview(false)}
            />
        </>
    );
}
