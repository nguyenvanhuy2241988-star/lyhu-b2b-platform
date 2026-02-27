'use client';

import React, { useState, useEffect } from 'react';
import { DocumentFolder, updateFolderGuidance } from '@/lib/documentsStore';
import {
    Info,
    Edit3,
    Save,
    X,
    Folder,
    Calendar,
    Users
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TagSelector } from './TagSelector';

interface FolderInspectorProps {
    folder: DocumentFolder;
    readOnly?: boolean;
    onUpdate: (updatedFolder: DocumentFolder) => void;
    onClose?: () => void;
}

export function FolderInspector({ folder, readOnly = false, onUpdate, onClose }: FolderInspectorProps) {
    const [editing, setEditing] = useState(false);
    const [guidance, setGuidance] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setGuidance(folder.guidance_md || '');
    }, [folder]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFolderGuidance(folder.id, guidance);
            onUpdate({ ...folder, guidance_md: guidance });
            setEditing(false);
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu hướng dẫn");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200 w-80 lg:w-96 shadow-xl relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Folder className="w-5 h-5 text-blue-500 shrink-0" />
                    <h3 className="font-semibold text-slate-800 truncate" title={folder.name}>
                        {folder.name}
                    </h3>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Meta */}
                <div className="space-y-3 pb-4 border-b border-slate-100">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Tạo ngày
                        </span>
                        <span className="text-slate-700 font-medium">
                            {format(new Date(folder.created_at), "dd/MM/yyyy", { locale: vi })}
                        </span>
                    </div>

                    {/* Tagging */}
                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <TagSelector
                            entityId={folder.id}
                            entityType="folder"
                            currentTags={folder.tags}
                            onTagsChanged={() => onUpdate(folder)}
                        />
                    </div>
                </div>

                {/* Guidance */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            Hướng dẫn & Quy định
                        </h4>
                        {!editing && !readOnly && (
                            <button
                                onClick={() => setEditing(true)}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded"
                            >
                                <Edit3 className="w-3 h-3" /> Sửa
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-2">
                            <textarea
                                className="w-full h-64 p-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                value={guidance}
                                onChange={e => setGuidance(e.target.value)}
                                placeholder="Nhập hướng dẫn (Markdown)..."
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setGuidance(folder.guidance_md || '');
                                    }}
                                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                                    disabled={saving}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-1"
                                    disabled={saving}
                                >
                                    {saving ? 'Lưu...' : <><Save className="w-3 h-3" /> Lưu</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px] text-sm text-slate-700 prose prose-sm max-w-none whitespace-pre-wrap">
                            {guidance ? guidance : <span className="text-slate-400 italic">Chưa có nội dung hướng dẫn.</span>}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
