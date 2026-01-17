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
    Image as ImageIcon,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';
import { FilePreviewModal } from './FilePreviewModal';

interface DocDetailsPanelProps {
    file: DocumentFile | null;
    isAdmin: boolean;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh
}

export function DocDetailsPanel({ file, isAdmin, onClose, onUpdate }: DocDetailsPanelProps) {
    const [activity, setActivity] = useState<DocumentActivity[]>([]);
    // ... (rest of local state)

    // ... (useEffect hook)

    if (!file) return null;

    // ... (rest of rename/delete actions)

    // UI logic modifications
    return (
        {/* ... (Header and Preview Thumbnail parts remain same) */ }
        // ...
        
        {/* Metadata */ }
    <div className="space-y-4">
        <div className="group">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tên file</label>
            {renaming ? (
                <div className="flex items-center gap-2 mt-1">
                    <input
                    // ...
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

        {/* ... (Size/Date parts remain same) */}
    </div>

    {/* Actions */ }
    <div className="flex flex-col gap-3">
        <button
            onClick={() => setShowPreview(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
        >
            <Eye className="w-4 h-4" /> Xem trước
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
        // ... (rest of component)
    );
}

{/* Activity Log */ }
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
                </div >
            </div >

    <FilePreviewModal
        file={file}
        open={showPreview}
        onClose={() => setShowPreview(false)}
    />
        </>
    );
}
