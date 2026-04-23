'use client';

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from './imageCompression';

export const DOCS_TABLE = 'documents';
export const FILES_TABLE = 'document_files';
export const CATEGORIES_TABLE = 'document_categories';
export const BUCKET_NAME = 'docs';

export type DocVisibility = 'all' | 'roles' | 'users';
export type DocStatus = 'draft' | 'published' | 'archived';

export interface DocumentCategory {
    id: string;
    name: string;
    parent_id?: string | null;
    sort_order: number;
    created_at?: string;
}

export interface DocumentItem {
    id: string;
    title: string;
    content: string;
    category_id?: string | null;
    tags: string[];
    visibility: DocVisibility;
    allowed_roles: string[];
    allowed_user_ids: string[];
    status: DocStatus;
    created_by: string;
    created_at: string;
    updated_at: string;

    // Joint fields (optional depending on query)
    files_count?: number;
    category_name?: string;
    author_email?: string; // If joined with profiles
}

export interface DocumentFileItem {
    id: string;
    document_id: string;
    storage_path: string;
    file_name: string;
    mime_type?: string | null;
    size?: number | null;
    uploaded_by: string;
    created_at: string;
}

// --- Helpers ---

// Get safe user ID
async function getUserIdSafe(): Promise<string | null> {
    try {
        const { data } = await supabase.auth.getSession();
        return data.session?.user?.id ?? null;
    } catch {
        return null;
    }
}

// --- Categories ---

export async function fetchDocCategories(): Promise<DocumentCategory[]> {
    const { data, error } = await supabase
        .from(CATEGORIES_TABLE)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error('fetchDocCategories error:', error);
        return [];
    }
    return (data || []) as DocumentCategory[];
}

// --- Documents ---

export interface FetchDocsParams {
    q?: string;
    categoryId?: string;
    tag?: string;
    status?: DocStatus;
}

export async function fetchDocuments(params?: FetchDocsParams): Promise<DocumentItem[]> {
    let query = supabase
        .from(DOCS_TABLE)
        .select(`
            *,
            document_files (count)
        `)
        .order('updated_at', { ascending: false });

    if (params?.status) {
        query = query.eq('status', params.status);
    } else {
        // Default: only published unless specific status requested? 
        // Or if listing for admin? Assuming UI sends filter.
        // For general "All Docs" page, usually show published.
        // But if user is admin, maybe show all?
        // Let's stick to simple: if no status param, show 'published'.
        query = query.eq('status', 'published');
    }

    if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
    }

    if (params?.tag) {
        query = query.contains('tags', [params.tag]);
    }

    if (params?.q) {
        query = query.ilike('title', `%${params.q}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('fetchDocuments error:', error);
        return [];
    }

    // Transform count
    return (data || []).map((d: any) => ({
        ...d,
        files_count: d.document_files?.[0]?.count ?? 0
    })) as DocumentItem[];
}

export async function fetchDocumentById(id: string): Promise<{ doc: DocumentItem | null; files: DocumentFileItem[] }> {
    // 1. Get Doc
    const { data: docData, error: docError } = await supabase
        .from(DOCS_TABLE)
        .select('*')
        .eq('id', id)
        .single();

    if (docError || !docData) {
        console.error('fetchDocumentById error:', docError);
        return { doc: null, files: [] };
    }

    // 2. Get Files
    const { data: fileData, error: fileError } = await supabase
        .from(FILES_TABLE)
        .select('*')
        .eq('document_id', id)
        .order('created_at', { ascending: true });

    if (fileError) {
        console.error('fetchDocumentById files error:', fileError);
    }

    return {
        doc: docData as DocumentItem,
        files: (fileData || []) as DocumentFileItem[]
    };
}

export async function createDocument(input: Partial<DocumentItem>): Promise<DocumentItem> {
    const userId = await getUserIdSafe();
    if (!userId) throw new Error('Unauthorized');

    const payload = {
        title: input.title,
        content: input.content ?? '',
        category_id: input.category_id ?? null,
        tags: input.tags ?? [],
        visibility: input.visibility ?? 'all',
        allowed_roles: input.allowed_roles ?? [],
        allowed_user_ids: input.allowed_user_ids ?? [],
        status: input.status ?? 'published',
        created_by: userId
    };

    const { data, error } = await supabase
        .from(DOCS_TABLE)
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        console.error('createDocument error:', error);
        throw error;
    }
    return data as DocumentItem;
}

export async function updateDocument(id: string, patch: Partial<DocumentItem>): Promise<DocumentItem> {
    const { data, error } = await supabase
        .from(DOCS_TABLE)
        .update({
            title: patch.title,
            content: patch.content,
            category_id: patch.category_id,
            tags: patch.tags,
            visibility: patch.visibility,
            allowed_roles: patch.allowed_roles,
            allowed_user_ids: patch.allowed_user_ids,
            status: patch.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        console.error('updateDocument error:', error);
        throw error;
    }
    return data as DocumentItem;
}

export async function deleteDocument(id: string): Promise<void> {
    // Files are cascading delete in DB, but storage objects are NOT.
    // We should clean up storage first.
    // 1. Get files
    const { data: files } = await supabase
        .from(FILES_TABLE)
        .select('storage_path')
        .eq('document_id', id);

    if (files && files.length > 0) {
        const paths = files.map((f: any) => f.storage_path);
        await supabase.storage.from(BUCKET_NAME).remove(paths);
    }

    // 2. Delete doc (DB cascade removes file rows)
    const { error } = await supabase
        .from(DOCS_TABLE)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteDocument error:', error);
        throw error;
    }
}

// --- Files ---

export async function uploadDocumentFiles(documentId: string, files: File[]): Promise<DocumentFileItem[]> {
    const userId = await getUserIdSafe();
    if (!userId) throw new Error('Unauthorized');

    const results: DocumentFileItem[] = [];

    for (const file of files) {
        const fileToUpload = await compressImage(file);
        const ext = file.name.split('.').pop();
        // unique path: documents/{docId}/{date}_{random}.ext
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `documents/${documentId}/${Date.now()}_${safeName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileToUpload);

        if (uploadError) {
            console.error('Upload failed:', file.name, uploadError);
            continue; // Skip this file, try next
        }

        // 2. Insert DB Row
        const { data: row, error: dbError } = await supabase
            .from(FILES_TABLE)
            .insert({
                document_id: documentId,
                storage_path: storagePath,
                file_name: file.name,
                mime_type: fileToUpload.type,
                size: fileToUpload.size,
                uploaded_by: userId
            })
            .select('*')
            .single();

        if (dbError) {
            console.error('Insert file row failed:', file.name, dbError);
            // Try to cleanup storage?
            continue;
        }

        if (row) results.push(row as DocumentFileItem);
    }

    return results;
}

export async function deleteDocumentFile(fileId: string): Promise<void> {
    // 1. Get path
    const { data: fileRow } = await supabase
        .from(FILES_TABLE)
        .select('storage_path')
        .eq('id', fileId)
        .single();

    if (!fileRow) return;

    // 2. Remove from Storage
    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileRow.storage_path]);

    if (storageError) {
        console.warn('Storage remove warning:', storageError);
        // proceed to delete row anyway to keep DB clean
    }

    // 3. Delete DB Row
    await supabase.from(FILES_TABLE).delete().eq('id', fileId);
}

export async function getFileSignedUrl(storagePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 60 * 60); // 1 hour

    if (error || !data) {
        console.error('createSignedUrl error:', error);
        return null;
    }
    return data.signedUrl;
}
