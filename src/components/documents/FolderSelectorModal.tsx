"use client";

import React, { useEffect, useState } from "react";
import { X, FolderOpen } from "lucide-react";
import { DocumentFolder, listFolders } from "@/lib/documentsStore";
import { FolderTree } from "@/components/documents/FolderTree";

interface FolderSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (folderId: string, folderName: string) => void;
}

export default function FolderSelectorModal({ isOpen, onClose, onSelect }: FolderSelectorModalProps) {
    const [folders, setFolders] = useState<DocumentFolder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const fetchFolders = async () => {
            setIsLoading(true);
            try {
                const data = await listFolders();
                setFolders(data);
            } catch (error) {
                console.error("Error loading folders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFolders();
        setSelectedId(null); // Reset selection on open
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selectedId) return;
        const folder = folders.find(f => f.id === selectedId);
        if (folder) {
            onSelect(folder.id, folder.name);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-indigo-600" />
                        Chọn Thư Mục Tài Liệu
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400 animate-pulse">Đang tải cấu trúc thư mục...</div>
                    ) : folders.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Chưa có thư mục nào trong hệ thống.</div>
                    ) : (
                        <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                            <FolderTree 
                                folders={folders}
                                selectedFolderId={selectedId}
                                readOnly={true}
                                onSelectFolder={(id) => setSelectedId(id)}
                                onCreateFolder={() => {}}
                                onRenameFolder={() => {}}
                                onDeleteFolder={() => {}}
                            />
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        Đóng lại
                    </button>
                    <button 
                        disabled={!selectedId}
                        onClick={handleConfirm} 
                        className="px-5 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
                    >
                        Khóa Mục Tiêu
                    </button>
                </div>
            </div>
        </div>
    );
}
