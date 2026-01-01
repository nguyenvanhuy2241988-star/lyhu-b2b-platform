'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    DocumentItem,
    DocumentCategory,
    fetchDocuments,
    fetchDocCategories
} from '@/lib/docsStore';
import {
    Search,
    Plus,
    FileText,
    Paperclip,
    Tag,
    Calendar,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function DocsListPage() {
    const router = useRouter();
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [d, c] = await Promise.all([
                fetchDocuments({ q: debouncedSearch, categoryId: selectedCat || undefined }),
                fetchDocCategories()
            ]);
            setDocs(d);
            setCategories(c);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedCat]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tài liệu</h1>
                    <p className="text-slate-500 text-sm mt-1">Kho tri thức & Hướng dẫn sử dụng</p>
                </div>
                <Link
                    href="/docs/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm mới</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài liệu..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="sm:w-64">
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                            value={selectedCat}
                            onChange={e => setSelectedCat(e.target.value)}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Đang tải...</div>
            ) : docs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Chưa có tài liệu nào.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {docs.map(doc => (
                        <Link
                            key={doc.id}
                            href={`/docs/${doc.id}`}
                            className="block bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition hover:border-blue-300 group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                                        {doc.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                                        {doc.files_count !== undefined && doc.files_count > 0 && (
                                            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                                <Paperclip className="w-3 h-3" />
                                                {doc.files_count} tệp
                                            </span>
                                        )}

                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(doc.updated_at), "dd/MM/yyyy", { locale: vi })}
                                        </span>

                                        {doc.category_name && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs border border-blue-100">
                                                {doc.category_name}
                                            </span>
                                        )}
                                    </div>

                                    {doc.tags && doc.tags.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {doc.tags.map(tag => (
                                                <span key={tag} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                    <Tag className="w-3 h-3 text-slate-400" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-slate-300 group-hover:text-blue-500">
                                    →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
