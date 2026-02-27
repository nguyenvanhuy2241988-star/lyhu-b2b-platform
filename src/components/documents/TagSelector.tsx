'use client';

import React, { useEffect, useState } from 'react';
import { Tag as TagIcon, X, Plus, Loader2, Check } from 'lucide-react';
import {
    DocumentTag,
    listTags,
    createTag,
    assignTagToFile,
    removeTagFromFile,
    assignTagToFolder,
    removeTagFromFolder
} from '@/lib/documentsStore';

interface TagSelectorProps {
    entityId: string;
    entityType: 'file' | 'folder';
    currentTags?: DocumentTag[];
    onTagsChanged: () => void;
}

const COLORS = [
    { label: 'Gray', value: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    { label: 'Red', value: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    { label: 'Orange', value: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { label: 'Amber', value: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    { label: 'Green', value: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    { label: 'Blue', value: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { label: 'Purple', value: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { label: 'Pink', value: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
];

export function getTagColorClasses(color: string) {
    const c = COLORS.find(x => x.value === color) || COLORS[0];
    return `${c.bg} ${c.text} ${c.border}`;
}

export function TagSelector({ entityId, entityType, currentTags = [], onTagsChanged }: TagSelectorProps) {
    const [allTags, setAllTags] = useState<DocumentTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [openPicker, setOpenPicker] = useState(false);

    // Create mode
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('blue');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (openPicker) {
            loadTags();
        }
    }, [openPicker]);

    const loadTags = async () => {
        setLoading(true);
        try {
            const tags = await listTags();
            setAllTags(tags);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTag = async (tag: DocumentTag) => {
        const hasTag = currentTags.some(t => t.id === tag.id);
        setActionLoading(true);
        try {
            if (hasTag) {
                if (entityType === 'file') await removeTagFromFile(entityId, tag.id);
                else await removeTagFromFolder(entityId, tag.id);
            } else {
                if (entityType === 'file') await assignTagToFile(entityId, tag.id);
                else await assignTagToFolder(entityId, tag.id);
            }
            onTagsChanged();
        } catch (e: any) {
            alert('Lỗi: ' + (e.message || ''));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        setActionLoading(true);
        try {
            const tag = await createTag(newTagName.trim(), newTagColor);
            await loadTags();
            // Auto assign
            if (entityType === 'file') await assignTagToFile(entityId, tag.id);
            else await assignTagToFolder(entityId, tag.id);
            onTagsChanged();
            setIsCreating(false);
            setNewTagName('');
        } catch (e: any) {
            alert('Lỗi tạo Thẻ: ' + (e.message || ''));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="relative font-sans space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-slate-400" /> Nhãn (Tags)
                </span>
                <button
                    onClick={() => setOpenPicker(!openPicker)}
                    disabled={actionLoading}
                    className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded transition disabled:opacity-50"
                >
                    {openPicker ? 'Đóng' : 'Thêm nhãn'}
                </button>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-1.5">
                {currentTags.length === 0 && !openPicker && (
                    <span className="text-xs text-slate-400 italic">Chưa có nhãn</span>
                )}
                {currentTags.map(tag => (
                    <div
                        key={tag.id}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border flex items-center gap-1 ${getTagColorClasses(tag.color)}`}
                    >
                        {tag.name}
                        {openPicker && (
                            <button
                                onClick={() => handleToggleTag(tag)}
                                disabled={actionLoading}
                                className="hover:bg-black/10 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Picker / Create UI */}
            {openPicker && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                    {isCreating ? (
                        <div className="space-y-3">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Tên nhãn mới..."
                                className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                disabled={actionLoading}
                            />
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setNewTagColor(c.value)}
                                        className={`w-5 h-5 rounded-full ${c.bg} border ${c.border} flex items-center justify-center transition hover:ring-2 hover:ring-slate-300 ${newTagColor === c.value ? 'ring-2 ring-slate-400' : ''}`}
                                    >
                                        {newTagColor === c.value && <Check className={`w-3 h-3 ${c.text}`} />}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 bg-blue-600 text-white text-xs font-medium py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                                    onClick={handleCreateTag}
                                    disabled={!newTagName.trim() || actionLoading}
                                >
                                    {actionLoading ? 'Đang tạo...' : 'Tạo & Gắn'}
                                </button>
                                <button
                                    className="flex-1 bg-slate-200 text-slate-700 text-xs py-1.5 rounded hover:bg-slate-300"
                                    onClick={() => setIsCreating(false)}
                                    disabled={actionLoading}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-center py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" /></div>
                            ) : allTags.length === 0 ? (
                                <div className="text-xs text-center text-slate-500 py-2">Chưa có nhãn nào trên hệ thống</div>
                            ) : (
                                <div className="max-h-32 overflow-y-auto flex flex-col gap-1 pr-1 scrollbar-thin">
                                    {allTags.map(tag => {
                                        const isSelected = currentTags.some(t => t.id === tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleToggleTag(tag)}
                                                disabled={actionLoading}
                                                className={`flex items-center justify-between w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-200 text-slate-700'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${getTagColorClasses(tag.color).split(' ')[0]}`} />
                                                    {tag.name}
                                                </div>
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full mt-2 py-1.5 border border-dashed border-slate-300 text-slate-500 rounded text-xs hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Tạo nhãn mới
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
