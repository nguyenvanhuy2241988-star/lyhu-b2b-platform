'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    DocumentItem,
    DocumentFileItem,
    fetchDocumentById,
    deleteDocument,
    getFileSignedUrl
} from '@/lib/docsStore';
import {
    ArrowLeft,
    Calendar,
    Tag,
    FileText,
    Download,
    Eye,
    Edit,
    Trash2,
    Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';

export default function DocDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const id = params.id;

    const [doc, setDoc] = useState<DocumentItem | null>(null);
    const [files, setFiles] = useState<DocumentFileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }: any) => {
            setCurrentUserId(data.session?.user?.id ?? null);
        });

        fetchDocumentById(id).then(({ doc, files }) => {
            setDoc(doc);
            setFiles(files);
            setLoading(false);
        });
    }, [id]);

    const handleDownload = async (file: DocumentFileItem) => {
        try {
            const url = await getFileSignedUrl(file.storage_path);
            if (url) {
                window.open(url, '_blank');
            } else {
                alert("Không thể tạo link tải. Vui lòng thử lại.");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi khi tải file.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.")) return;
        try {
            await deleteDocument(id);
            router.push('/docs');
        } catch (e) {
            console.error(e);
            alert("Lỗi khi xóa tài liệu.");
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Đang tải...</div>;
    if (!doc) return <div className="p-12 text-center text-slate-500">Không tìm thấy tài liệu.</div>;

    const isOwner = currentUserId === doc.created_by;
    // Assuming we don't have easy admin check on frontend without custom claim or profile fetch
    // Use isOwner for now. Admin RLS will allow delete anyway if we tried, but UI logic might hide button.
    // For simplicity, just show if Owner.

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <Link href="/docs" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>

                {isOwner && (
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/docs/${id}/edit`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                        >
                            <Edit className="w-4 h-4" /> Sửa
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                            <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                        {doc.title}
                    </h1>
                    {doc.status !== 'published' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium uppercase tracking-wider">
                            {doc.status}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-6 text-slate-500 text-sm border-t border-slate-100 pt-4 mt-2">
                    <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Cập nhật: {format(new Date(doc.updated_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </span>
                    {doc.visibility !== 'all' && (
                        <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            {doc.visibility === 'roles' ? `Nhóm: ${doc.allowed_roles.join(', ')}` : 'Riêng tư'}
                        </span>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {doc.tags.map(tag => (
                                <span key={tag} className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Content */}
                <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                    {/* 
                        Ideally render Markdown here. 
                        Since we want to keep it simple and no libs allowed specifically unless installed, 
                        we will use whitespace-pre-wrap for now. 
                        Or install react-markdown if allowed? 
                        User said "content text not null default '' (dùng markdown/plain text)". 
                        "Render markdown đơn giản hoặc preformatted".
                     */}
                    <div className="prose max-w-none text-slate-800 whitespace-pre-wrap font-sans">
                        {doc.content || <em className="text-slate-400">Không có nội dung.</em>}
                    </div>
                </div>

                {/* Sidebar: Files */}
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Tài liệu đính kèm ({files.length})
                        </h3>

                        {files.length === 0 ? (
                            <p className="text-sm text-slate-400">Không có tệp đính kèm.</p>
                        ) : (
                            <div className="space-y-3">
                                {files.map(file => (
                                    <div key={file.id} className="group p-3 rounded-lg border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50 transition">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                                <p className="text-sm font-medium text-slate-700 truncate" title={file.file_name}>
                                                    {file.file_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-slate-400">
                                                {(file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown')}
                                            </span>
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                <Download className="w-3 h-3" /> Tải về
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
