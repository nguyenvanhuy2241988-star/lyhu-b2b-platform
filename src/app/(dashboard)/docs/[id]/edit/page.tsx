'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    DocumentCategory,
    fetchDocCategories,
    updateDocument,
    uploadDocumentFiles,
    fetchDocumentById,
    deleteDocumentFile,
    DocumentItem,
    DocumentFileItem,
    DocVisibility,
    DocStatus
} from '@/lib/docsStore';
import {
    Save,
    X,
    Upload,
    FileText,
    Users,
    Unlock,
    Lock,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { ROLES } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';

export default function EditDocPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [catId, setCatId] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<DocVisibility>('all');
    const [status, setStatus] = useState<DocStatus>('published');
    const [allowedRoles, setAllowedRoles] = useState<string[]>([]);

    const [existingFiles, setExistingFiles] = useState<DocumentFileItem[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);

    useEffect(() => {
        Promise.all([
            fetchDocCategories(),
            supabase.auth.getSession().then(({ data }: any) => data.session?.user?.id),
            fetchDocumentById(id)
        ]).then(([cats, uid, { doc, files }]) => {
            setCategories(cats);
            setCurrentUserId(uid ?? null);

            if (doc) {
                setTitle(doc.title);
                setContent(doc.content);
                setCatId(doc.category_id || '');
                setTags(doc.tags.join(', '));
                setVisibility(doc.visibility);
                setStatus(doc.status);
                setAllowedRoles(doc.allowed_roles);
                setExistingFiles(files);
            }
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return alert("Vui lòng nhập tiêu đề");

        setSubmitting(true);
        try {
            // 1. Update Doc
            await updateDocument(id, {
                title,
                content,
                category_id: catId || null,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                visibility,
                allowed_roles: allowedRoles,
                status
            });

            // 2. Upload New Files
            if (newFiles.length > 0) {
                await uploadDocumentFiles(id, newFiles);
            }

            router.push(`/docs/${id}`);
        } catch (error: any) {
            console.error(error);
            alert("Lỗi khi cập nhật tài liệu: " + (error?.message || "Unknown error"));
            setSubmitting(false);
        }
    };

    const handleDeleteExistingFile = async (fileId: string) => {
        if (!confirm("Bạn muốn xóa file này?")) return;
        try {
            await deleteDocumentFile(fileId);
            setExistingFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (e) {
            console.error(e);
            alert("Lỗi xóa file");
        }
    };

    const handleRoleToggle = (role: string) => {
        setAllowedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Đang tải...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa tài liệu</h1>
                <Link href={`/docs/${id}`} className="text-slate-500 hover:text-slate-700">
                    <X className="w-6 h-6" />
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Main Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập tiêu đề tài liệu..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                            <select
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={catId}
                                onChange={e => setCatId(e.target.value)}
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (cách nhau dấu phẩy)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="HDSD, Quy trình, Sale..."
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
                        <textarea
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px] font-mono text-sm"
                            placeholder="Hỗ trợ Markdown cơ bản..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    </div>
                </div>

                {/* Settings */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Unlock className="w-4 h-4" /> Cài đặt hiển thị
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Đối tượng xem</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={visibility === 'all'}
                                        onChange={() => setVisibility('all')}
                                    />
                                    <span>Tất cả mọi người</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={visibility === 'roles'}
                                        onChange={() => setVisibility('roles')}
                                    />
                                    <span>Theo vai trò (Role)</span>
                                </label>
                            </div>

                            {visibility === 'roles' && (
                                <div className="mt-3 pl-6 grid grid-cols-2 gap-2">
                                    {Object.values(ROLES).map(role => (
                                        <label key={role} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border">
                                            <input
                                                type="checkbox"
                                                checked={allowedRoles.includes(role)}
                                                onChange={() => handleRoleToggle(role)}
                                            />
                                            {role.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                            <select
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={status}
                                onChange={e => setStatus(e.target.value as DocStatus)}
                            >
                                <option value="published">Công khai (Published)</option>
                                <option value="draft">Nháp (Draft)</option>
                                <option value="archived">Lưu trữ (Archived)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Files */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Đính kèm tệp
                    </h3>

                    {/* Existing Files */}
                    {existingFiles.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-slate-700">Tệp hiện có:</p>
                            {existingFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm text-slate-700 truncate max-w-[200px]">{file.file_name}</span>
                                        <span className="text-xs text-slate-400">({(file.size ? (file.size / 1024).toFixed(1) : '0')} KB)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteExistingFile(file.id)}
                                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
                                        title="Xóa file"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New Files */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                        <input
                            type="file"
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => {
                                if (e.target.files) {
                                    setNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                                }
                            }}
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Click hoặc kéo thả file mới vào đây</p>
                    </div>

                    {newFiles.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Tệp mới:</p>
                            {newFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="sticky bottom-4 z-10 flex justify-end gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-lg">
                    <Link
                        href={`/docs/${id}`}
                        className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {submitting ? 'Đang lưu...' : (
                            <>
                                <Save className="w-4 h-4" /> Cập nhật
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
