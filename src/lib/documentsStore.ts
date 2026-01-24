'use client';

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const FOLDERS_TABLE = 'documents_folders';
export const FILES_TABLE = 'documents_files';
export const ACTIVITY_TABLE = 'documents_activity';
export const BUCKET_NAME = 'lyhu-docs';

// Types
export interface DocumentFolder {
    id: string;
    parent_id?: string | null;
    name: string;
    slug?: string | null;
    guidance_md: string;
    visibility: 'all' | 'roles' | 'private';
    allowed_roles: string[];
    owner_id?: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

export interface DocumentFile {
    id: string;
    folder_id: string;
    title: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    storage_bucket: string;
    storage_path: string;
    visibility: 'inherit' | 'all' | 'roles' | 'private';
    allowed_roles: string[];
    owner_id?: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    captions?: string[]; // Marketing Content Variations
}

export interface DocumentActivity {
    id: number;
    entity_type: 'folder' | 'file';
    entity_id: string;
    action: 'create' | 'rename' | 'upload' | 'move' | 'delete' | 'update_guidance';
    message: string;
    actor_id: string;
    created_at: string;
}

// Store helpers
async function getUserIdSafe(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
}

// ---------- FOLDERS ----------

export async function listFolders(): Promise<DocumentFolder[]> {
    const { data, error } = await supabase
        .from(FOLDERS_TABLE)
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (error) {
        console.error('listFolders error:', error);
        throw error;
    }
    return (data || []) as DocumentFolder[];
}

export async function createFolder(input: {
    name: string;
    parent_id?: string | null;
    guidance_md?: string;
    visibility?: 'all' | 'roles' | 'private';
}): Promise<DocumentFolder> {
    const uid = await getUserIdSafe();
    if (!uid) throw new Error("Unauthorized");

    const payload = {
        name: input.name,
        parent_id: input.parent_id ?? null,
        guidance_md: input.guidance_md ?? '',
        visibility: input.visibility ?? 'all',
        created_by: uid
    };

    const { data, error } = await supabase
        .from(FOLDERS_TABLE)
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    // Log activity
    await logActivity('folder', data.id, 'create', `Created folder "${data.name}"`);

    return data as DocumentFolder;
}

export async function updateFolderGuidance(id: string, guidance_md: string): Promise<void> {
    const { error } = await supabase
        .from(FOLDERS_TABLE)
        .update({ guidance_md, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('folder', id, 'update_guidance', 'Updated guidance text');
}

export async function renameFolder(id: string, name: string): Promise<void> {
    const { error } = await supabase
        .from(FOLDERS_TABLE)
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('folder', id, 'rename', `Renamed to "${name}"`);
}

export async function deleteFolder(id: string): Promise<void> {
    const { error } = await supabase
        .from(FOLDERS_TABLE)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('folder', id, 'delete', 'Deleted folder');
}

// ---------- FILES ----------

export async function listFiles(
    folderId: string | null,
    search?: string,
    filterType?: 'all' | 'image' | 'pdf' | 'office'
): Promise<DocumentFile[]> {
    let q = supabase
        .from(FILES_TABLE)
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    // Only filter by folder if folderId is provided
    if (folderId) {
        q = q.eq('folder_id', folderId);
    }

    if (search) {
        q = q.ilike('title', `%${search}%`);
    }

    if (filterType && filterType !== 'all') {
        if (filterType === 'image') {
            q = q.like('mime_type', 'image/%');
        } else if (filterType === 'pdf') {
            q = q.ilike('mime_type', '%pdf%');
        } else if (filterType === 'office') {
            // Match word, excel, powerpoint, and openxml formats
            q = q.or('mime_type.ilike.%word%,mime_type.ilike.%excel%,mime_type.ilike.%sheet%,mime_type.ilike.%presentation%,mime_type.ilike.%openxmlformats%');
        }
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as DocumentFile[];
}

export async function uploadFiles(folderId: string, files: File[]): Promise<DocumentFile[]> {
    const uid = await getUserIdSafe();
    if (!uid) throw new Error("Unauthorized");

    const results: DocumentFile[] = [];

    for (const file of files) {
        const ext = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        // Structure: global/folderId/timestamp-uuid-name
        const storagePath = `global/${folderId}/${Date.now()}-${uuidv4()}-${safeName}`;

        // 1. Storage Upload
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, file);

        if (storageError) {
            console.error(`Upload failed for ${file.name}`, storageError);
            throw new Error(`Upload failed for ${file.name}: ${storageError.message}`);
        }

        // 2. DB Insert
        const { data, error: dbError } = await supabase
            .from(FILES_TABLE)
            .insert({
                folder_id: folderId,
                title: file.name,
                original_name: file.name,
                mime_type: file.type,
                size_bytes: file.size,
                storage_bucket: BUCKET_NAME,
                storage_path: storagePath,
                created_by: uid
            })
            .select()
            .single();

        if (dbError) {
            console.error('DB Insert failed', dbError);
            continue;
        }

        if (data) {
            results.push(data as DocumentFile);
            await logActivity('file', data.id, 'upload', `Uploaded file "${file.name}"`);
        }
    }

    return results;
}

export async function renameFile(id: string, title: string): Promise<void> {
    const { error } = await supabase
        .from(FILES_TABLE)
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('file', id, 'rename', `Renamed file to "${title}"`);
}

export async function updateFileCaptions(id: string, captions: string[]): Promise<void> {
    const { error } = await supabase
        .from(FILES_TABLE)
        .update({ captions, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('file', id, 'update_guidance', `Updated content variations (${captions.length})`);
}

export async function moveFile(id: string, targetFolderId: string): Promise<void> {
    const { error } = await supabase
        .from(FILES_TABLE)
        .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('file', id, 'move', 'Moved file to another folder');
}

export async function deleteFile(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
        .from(FILES_TABLE)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    await logActivity('file', id, 'delete', 'Deleted file');
}

export async function getFileSignedUrl(storagePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 3600); // 1hr

    if (error) return null;
    return data?.signedUrl ?? null;
}

// ---------- ACTIVITY ----------

export async function listActivity(entityType: 'folder' | 'file', entityId: string): Promise<DocumentActivity[]> {
    const { data, error } = await supabase
        .from(ACTIVITY_TABLE)
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as DocumentActivity[];
}

async function logActivity(
    type: 'folder' | 'file',
    id: string,
    action: DocumentActivity['action'],
    msg: string
) {
    const uid = await getUserIdSafe();
    if (!uid) return;

    await supabase.from(ACTIVITY_TABLE).insert({
        entity_type: type,
        entity_id: id,
        action,
        message: msg,
        actor_id: uid
    });
}
