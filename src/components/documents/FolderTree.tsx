'use client';

import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    Plus,
    Trash2,
    Edit2
} from 'lucide-react';
import { DocumentFolder } from '@/lib/documentsStore';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
    folders: DocumentFolder[];
    selectedFolderId: string | null;
    readOnly?: boolean;
    onSelectFolder: (id: string) => void;
    onCreateFolder: (parentId: string | null) => void;
    onRenameFolder: (folder: DocumentFolder) => void;
    onDeleteFolder: (folder: DocumentFolder) => void;
    onMoveFile?: (fileId: string, targetFolderId: string) => void;
    onReorderFolders?: (draggedId: string, targetId: string, position: 'top' | 'center' | 'bottom') => void;
}

// Separate component for each node to allow proper useState usage
function FolderNode({
    folder,
    allFolders,
    depth = 0,
    selectedFolderId,
    readOnly = false,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onMoveFile,
    onReorderFolders
}: {
    folder: DocumentFolder,
    allFolders: DocumentFolder[],
    depth: number,
    selectedFolderId: string | null,
    readOnly?: boolean,
    onSelectFolder: (id: string) => void,
    onCreateFolder: (parentId: string | null) => void,
    onRenameFolder: (folder: DocumentFolder) => void,
    onDeleteFolder: (folder: DocumentFolder) => void,
    onMoveFile?: (fileId: string, targetFolderId: string) => void,
    onReorderFolders?: (draggedId: string, targetId: string, position: 'top' | 'center' | 'bottom') => void
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [dragOverPos, setDragOverPos] = useState<'top' | 'center' | 'bottom' | null>(null);

    const children = allFolders.filter(f => f.parent_id === folder.id)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const isSelected = selectedFolderId === folder.id;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y < rect.height * 0.25) {
            setDragOverPos('top');
        } else if (y > rect.height * 0.75) {
            setDragOverPos('bottom');
        } else {
            setDragOverPos('center');
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverPos(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = dragOverPos;
        setDragOverPos(null);

        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;

        if (data.startsWith('folder:')) {
            const draggedFolderId = data.replace('folder:', '');
            // Prevent dropping onto itself
            if (draggedFolderId === folder.id) return;
            if (onReorderFolders && pos) {
                onReorderFolders(draggedFolderId, folder.id, pos);
            }
        } else {
            // It's a file payload (could be JSON array or single ID)
            if (onMoveFile && pos === 'center') {
                onMoveFile(data, folder.id);
            }
        }
    };

    return (
        <div className="select-none relative">
            <div
                draggable={!readOnly}
                onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData('text/plain', `folder:${folder.id}`);
                    e.dataTransfer.effectAllowed = 'move';
                }}
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group relative",
                    isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-100",
                    dragOverPos === 'center' && "ring-2 ring-blue-400 bg-blue-50"
                )}
                style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
                onClick={() => onSelectFolder(folder.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Visual Indication for Reordering */}
                {dragOverPos === 'top' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />}
                {dragOverPos === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />}

                {/* Expand Toggle */}
                {children.length > 0 ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-0.5 hover:bg-slate-200 rounded"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                ) : (
                    <div className="w-4" /> // spacer
                )}

                {/* Icon */}
                {isSelected ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-slate-400" />}

                {/* Name */}
                <span className="truncate flex-1 text-sm">{folder.name}</span>

                {/* Actions */}
                {!readOnly && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                            title="Đổi tên"
                            onClick={(e) => { e.stopPropagation(); onRenameFolder(folder); }}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-blue-500 rounded"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                            title="Tạo thư mục con"
                            onClick={(e) => { e.stopPropagation(); onCreateFolder(folder.id); }}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-green-500 rounded"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                        <button
                            title="Xóa"
                            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-red-500 rounded"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Recursion */}
            {isExpanded && children.length > 0 && (
                <div>
                    {children.map(child => (
                        <FolderNode
                            key={child.id}
                            folder={child}
                            allFolders={allFolders}
                            depth={depth + 1}
                            selectedFolderId={selectedFolderId}
                            readOnly={readOnly}
                            onSelectFolder={onSelectFolder}
                            onCreateFolder={onCreateFolder}
                            onRenameFolder={onRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                            onMoveFile={onMoveFile}
                            onReorderFolders={onReorderFolders}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderTree({
    folders,
    selectedFolderId,
    readOnly = false,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onMoveFile,
    onReorderFolders
}: FolderTreeProps) {
    const rootFolders = folders.filter(f => !f.parent_id)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thư mục</span>
                {!readOnly && (
                    <button
                        onClick={() => onCreateFolder(null)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Tạo thư mục gốc mới"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
            {rootFolders.length === 0 ? (
                <div className="text-sm text-slate-400 px-2 italic">Chưa có thư mục</div>
            ) : (
                rootFolders.map(root => (
                    <FolderNode
                        key={root.id}
                        folder={root}
                        allFolders={folders}
                        depth={0}
                        selectedFolderId={selectedFolderId}
                        readOnly={readOnly}
                        onSelectFolder={onSelectFolder}
                        onCreateFolder={onCreateFolder}
                        onRenameFolder={onRenameFolder}
                        onDeleteFolder={onDeleteFolder}
                        onMoveFile={onMoveFile}
                        onReorderFolders={onReorderFolders}
                    />
                ))
            )}
        </div>
    );
}
