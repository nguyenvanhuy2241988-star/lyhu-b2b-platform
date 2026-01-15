'use client';

import { supabase } from './supabaseClient';

// Helper for Pure Fetch
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getAuthHeaders = async (token?: string) => {
    let finalToken = token;
    if (!finalToken) {
        try {
            const { data } = await supabase.auth.getSession();
            finalToken = data?.session?.access_token;
        } catch (e) {
            console.warn('[Tasks Store] getAuthHeaders session issue');
        }
    }
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY || ''
    };
    if (finalToken) {
        headers['Authorization'] = `Bearer ${finalToken}`;
    } else {
        // Fallback to anon key in Authorization ONLY if that's what's intended for public access
        // but usually just 'apikey' is enough for Supabase.
        headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
};

// =====================================================
// PERFORMANCE OPTIMIZATION (Cache & Deduplication)
// =====================================================
const TASK_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds
const TASK_FETCHING = new Map<string, Promise<any>>();

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = TASK_CACHE.get(key);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        console.log(`[Tasks Cache] Using cached data for ${key}`);
        return cached.data as T;
    }

    if (TASK_FETCHING.has(key)) {
        console.log(`[Tasks Dedupe] Already fetching ${key}`);
        return TASK_FETCHING.get(key) as Promise<T>;
    }

    const fetchPromise = (async () => {
        try {
            const data = await fetcher();
            TASK_CACHE.set(key, { data, timestamp: Date.now() });
            return data;
        } finally {
            TASK_FETCHING.delete(key);
        }
    })();

    TASK_FETCHING.set(key, fetchPromise);
    return fetchPromise;
}

export function invalidateTasksCache() {
    console.log('[Tasks Cache] Invalidating Tasks Cache');
    TASK_CACHE.clear();
}

export const TABLE = 'telesales_tasks' as const;

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

// Updated TaskStatus as per latest request (omitting 'later' if that was intent, but safely keeping it if legacy data exists? User prompt was specific: "inbox" | "today" | "tomorrow" | "this_week" | "done")
export type TaskStatus = 'inbox' | 'today' | 'tomorrow' | 'this_week' | 'done';
export type TaskType = 'task'; // Phase 3: Removed 'lead' - use Leads Queue instead

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    inbox: 'Hộp thư đến',
    today: 'Hôm nay',
    tomorrow: 'Ngày mai',
    this_week: 'Tuần này',
    done: 'Hoàn tất',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
    low: 'Thấp',
    normal: 'Bình thường',
    high: 'Cao',
    urgent: 'Khẩn',
};

// Updated TelesalesColumn as per request
// Updated TelesalesColumn as per request
export type TelesalesColumn = {
    id: string;
    label: string; // Renamed from title to match Page expectation and User Request
    status: TaskStatus;
    order: number;
    isDefault?: boolean;
    isVisible?: boolean;
};

export const DEFAULT_COLUMNS: TelesalesColumn[] = [
    { id: 'inbox', label: 'Hộp thư đến', status: 'inbox', order: 10, isDefault: true, isVisible: true },
    { id: 'today', label: 'Hôm nay', status: 'today', order: 20, isDefault: true, isVisible: true },
    { id: 'tomorrow', label: 'Ngày mai', status: 'tomorrow', order: 30, isDefault: true, isVisible: true },
    { id: 'this_week', label: 'Tuần này', status: 'this_week', order: 40, isDefault: true, isVisible: true },
    { id: 'done', label: 'Đã xong', status: 'done', order: 50, isDefault: true, isVisible: true },
    { id: 'overdue', label: 'Quá hạn', status: 'inbox', order: 5, isDefault: true, isVisible: true }, // Added Overdue
];

const COLUMNS_KEY = 'lyhu:telesales:task_columns:v1';

export function loadColumns(): TelesalesColumn[] {
    if (typeof window === 'undefined') return DEFAULT_COLUMNS;
    try {
        const raw = localStorage.getItem(COLUMNS_KEY);
        if (!raw) return DEFAULT_COLUMNS;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COLUMNS;

        // Clean and ensure label exists
        const cleaned = parsed
            .filter((c: any) => c && typeof c.id === 'string')
            .map((c: any) => ({
                id: String(c.id),
                // Ensure label is derived from label -> title -> id to prevent "disappearing name"
                label: (typeof c.label === 'string' && c.label.trim()) ? c.label : (c.title || String(c.id)),
                // Preserve status and order for board logic
                status: (c.status as TaskStatus) || (c.id as TaskStatus),
                order: typeof c.order === 'number' ? c.order : 0,
                isDefault: !!c.isDefault,
                isVisible: c.isVisible !== false
            }));

        return cleaned.length > 0 ? cleaned : DEFAULT_COLUMNS;
    } catch {
        return DEFAULT_COLUMNS;
    }
}

export function saveColumns(cols: TelesalesColumn[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(cols ?? DEFAULT_COLUMNS));
    } catch { }
}

export type TelesalesTask = {
    id: string;
    user_id: string;

    title: string;
    customer_name?: string | null;
    phone?: string | null;
    note?: string | null;

    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType; // FIXED: Changed from task_type to type

    due_date?: string | null;      // ISO string
    completed_at?: string | null;  // ISO string

    assigned_to?: string | null;   // User ID of assignee (legacy)
    assignee_ids?: string[] | null; // Array of user IDs
    leader_id?: string | null;     // User ID of leader

    order?: number | null;

    created_at?: string;
    updated_at?: string;
};

// ---- helpers ----
async function getUserIdSafe(): Promise<string | null> {
    try {
        const { data } = await supabase.auth.getSession();
        return data.session?.user?.id ?? null;
    } catch (e) {
        return null;
    }
}

function logSupabaseError(where: string, error: any) {
    console.error(`[${where}]`, error?.message ?? error, error);
}

// ---- API ----
// ---- API ----
export async function fetchTasks(userId?: string, token?: string, filters?: { startDate?: string, endDate?: string }): Promise<TelesalesTask[]> {
    const activeUserId = userId || await getUserIdSafe();
    if (!activeUserId) {
        console.warn('[Tasks Store] fetchTasks failed: No activeUserId');
        return [];
    }

    const cacheKey = `tasks:${activeUserId}:${filters?.startDate || ''}:${filters?.endDate || ''}`;

    if (TASK_FETCHING.has(cacheKey)) {
        console.log(`[Tasks Dedupe] Already fetching tasks for: ${activeUserId}. Skipping duplicate call.`);
        return TASK_FETCHING.get(cacheKey) as Promise<TelesalesTask[]>;
    }

    return fetchWithCache(cacheKey, async () => {
        try {
            console.log(`[Tasks Store] Fetching tasks for: ${activeUserId}`);
            const headers = await getAuthHeaders(token);
            const params = new URLSearchParams();
            params.set('or', `(user_id.eq.${activeUserId},owner_id.eq.${activeUserId},assigned_to.eq.${activeUserId},assignee_ids.cs.{${activeUserId}},leader_id.eq.${activeUserId})`);
            params.set('order', 'order.asc.nullsfirst,created_at.desc');

            if (filters?.startDate) {
                params.set('completed_at', `gte.${filters.startDate}`);
            }
            if (filters?.endDate) {
                params.set('completed_at', `lte.${filters.endDate}`);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*&${params.toString()}`, {
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const err = await res.json();
                logSupabaseError('fetchTasks', err);
                return [];
            }

            const data = await res.json();
            console.log(`[Tasks Store] ✅ Fetched successfully: ${data?.length || 0} tasks`);
            return (data ?? []) as TelesalesTask[];
        } catch (e) {
            logSupabaseError('fetchTasks - Exception', e);
            return [];
        }
    });
};

/**
 * Fetches unified tasks (Deals + Manual Tasks) using RPC.
 * This is the main source for the "Work Schedule" and "Tasks" pages.
 */
export async function fetchUnifiedTasks(input: {
    userId?: string;
    startDate: Date;
    endDate: Date;
}, token?: string): Promise<TelesalesTask[]> {
    try {
        const activeUserId = input.userId || await getUserIdSafe();
        if (!activeUserId) return [];

        const headers = await getAuthHeaders(token);
        const { data, error } = await supabase.rpc('get_unified_tasks', {
            p_start_date: input.startDate.toISOString(),
            p_end_date: input.endDate.toISOString(),
            p_user_id: activeUserId
        });

        if (error) {
            console.error('[fetchUnifiedTasks] RPC error:', error);
            return [];
        }

        // Map RPC result to TelesalesTask interface
        return (data || []).map((t: any) => ({
            id: t.id,
            user_id: activeUserId, // RPC filters by user anyway
            title: t.title,
            customer_name: t.customer_name,
            phone: t.phone,
            due_date: t.due_date,
            status: t.status === 'won' ? 'done' : (t.status === 'lost' ? 'done' : (t.status || 'inbox')), // Map deal status to task status roughly
            priority: t.priority || 'normal',
            type: t.source_type, // 'deal' or 'task'
            is_overdue: t.is_overdue,
            assignee_ids: t.assignee_ids, // NEW
            leader_id: t.leader_id      // NEW
        })) as TelesalesTask[];

    } catch (err) {
        console.error('[fetchUnifiedTasks] exception:', err);
        return [];
    }
}

export async function createTaskSupabase(input: {
    title: string;
    customer_name?: string;
    phone?: string;
    note?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    type?: TaskType;
    assigned_to?: string | null;
    assignee_ids?: string[];
    leader_id?: string | null;
}, token?: string): Promise<TelesalesTask> { // Added token param
    const userId = await getUserIdSafe(); // Could pass this too, but for write mostly safe? Or use token payload?
    // Write operations are less prone to "loading" deadlocks than "onMount" reads, but safer to use Pure Fetch.
    // However, getting userId from token in Pure Fetch requires decoding.
    // Let's stick to supabase client for Writes? 
    // The deadlock usually happens on "await supabase.auth.getUser()" during page load.
    // Writes happen on user interaction.
    // BUT, if the WebSocket is trying to connect, ANY supabase client call might hang (mutex).
    // So Pure Fetch is safer for Writes too.
    // I need userId.

    // Let's assume for Writes, we can get userId from the caller or keep using getUserIdSafe (might hang).
    // Safest: Use Pure Fetch and pass userId explicitly if possible.
    // If I can't change all signatures easily, I'll attempt Supabase Client for Writes but pass Token to helper?
    // Ideally refactor all to Pure Fetch.

    // For now, I'll implement Pure Fetch but still rely on getUserIdSafe if caller doesn't provide it...
    // Wait, getUserIdSafe uses supabase.auth.getUser().
    // If that hangs, this hangs.
    // I'll update the signature to accept userId optionally, but I can't break existing callers easily yet.
    // I'll use `supabase.auth.getSession()` in `getUserIdSafe` instead of getUser() maybe? 
    // `getSession` reads from local storage/memory, `getUser` hits the server.
    // `getUser` is the one that hangs.

    // I will modify `getUserIdSafe` to try `getSession` first.

    // ... Actually, I'll stick to: Refactor `createTaskSupabase` to use Pure Fetch and accept token.
    // I will try to get userId from token if I can, or use logic.

    // RE-STRATEGY: I will modify `getUserIdSafe` to be non-blocking (use getSession).
    // And implement Pure Fetch for the HTTP request part.

    const activeUserId = await getUserIdSafe();
    if (!activeUserId) throw new Error('NOT_AUTHENTICATED');

    const headers = await getAuthHeaders(token);
    const payload = {
        user_id: activeUserId,
        owner_id: activeUserId, // Explicitly set owner_id to ensure visibility logic matches
        title: input.title,
        customer_name: input.customer_name ?? null,
        phone: input.phone ?? null,
        note: input.note ?? null,
        status: input.status ?? 'inbox',
        priority: input.priority ?? 'normal',
        due_date: input.due_date ?? (input.status === 'today' ? (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : (input.status === 'tomorrow' ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null)),
        type: input.type ?? 'task',
        assigned_to: input.assigned_to || null,
        assignee_ids: input.assignee_ids ?? [],
        leader_id: input.leader_id || null,
        order: Math.floor(Date.now() / 1000),
    };

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("createTaskSupabase error:", err);
            throw new Error(err.message);
        }

        const data = await res.json();
        invalidateTasksCache();
        return data[0] as TelesalesTask;
    } catch (e: any) {
        console.error("createTaskSupabase Exception:", e);
        throw e;
    }
}

export async function updateTaskSupabase(taskId: string, patch: Partial<TelesalesTask>, token?: string) {
    const userId = await getUserIdSafe();
    if (!userId) return { ok: false, error: 'NOT_AUTHENTICATED' as const };

    const headers = await getAuthHeaders(token);
    const body = {
        title: patch.title,
        customer_name: patch.customer_name ?? null,
        phone: patch.phone ?? null,
        note: patch.note ?? null,
        status: patch.status,
        priority: patch.priority,
        due_date: patch.due_date ?? (patch.status === 'today' && !patch.due_date ? (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : (patch.status === 'tomorrow' && !patch.due_date ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null)),
        completed_at: patch.completed_at ?? null,
        order: patch.order ?? undefined,
        type: patch.type,
        assigned_to: patch.assigned_to ?? undefined,
        assignee_ids: patch.assignee_ids ?? undefined,
        leader_id: patch.leader_id ?? undefined,
        updated_at: new Date().toISOString(),
    };

    // Clean undefined
    Object.keys(body).forEach(key => (body as any)[key] === undefined && delete (body as any)[key]);

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${taskId}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=representation' }, // Preserve Prefer header
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("updateTaskSupabase error:", err);
            return false;
        }

        invalidateTasksCache();
        return true;
    } catch (e) {
        console.error("updateTaskSupabase Exception:", e);
        return false;
    }
}

export async function moveTaskSupabase(taskId: string, status: TaskStatus, order?: number) {
    return updateTaskSupabase(taskId, { status, order: order ?? Date.now() });
}

export async function deleteTaskSupabase(taskId: string, token?: string) {
    const userId = await getUserIdSafe();
    if (!userId) return { ok: false, error: 'NOT_AUTHENTICATED' as const };

    try {
        const headers = await getAuthHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${taskId}&user_id=eq.${userId}`, {
            method: 'DELETE',
            headers
        });

        if (!res.ok) {
            const err = await res.json();
            logSupabaseError('deleteTaskSupabase', err);
            return { ok: false, error: err.message };
        }

        invalidateTasksCache();
        return { ok: true };
    } catch (e) {
        logSupabaseError('deleteTaskSupabase exception', e);
        return { ok: false, error: 'Network error or timeout' };
    }
}

// ---- backward-compatible aliases ----
export const getMyTasks = fetchTasks;
export const getTasks = fetchTasks;
// backward-compatible alias (fix addTaskSupabase not defined)
export const addTaskSupabase = createTaskSupabase;
export const addTask = createTaskSupabase; // Alias for leads-queue pages

// New: Dual-Write for Leads
export async function createLeadSupabase(input: {
    name: string;
    phone: string;
    note?: string;
}, token?: string): Promise<any> {
    const userId = await getUserIdSafe();
    if (!userId) throw new Error('NOT_AUTHENTICATED');

    try {
        const headers = await getAuthHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                assigned_to: userId,
                name: input.name,
                phone: input.phone,
                note: input.note,
                telesales_status: 'new',
                created_at: new Date().toISOString()
            })
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("createLeadSupabase error:", err);
            throw new Error(err.message || 'Failed to create lead');
        }

        const data = await res.json();
        return Array.isArray(data) ? data[0] : data;
    } catch (e) {
        console.error("createLeadSupabase exception:", e);
        throw e;
    }
}

export async function createLeadAsTask(input: {
    customer_name: string;
    phone: string;
    note?: string;
    due_date?: string | null;
}) {
    // 1. Create Lead in 'leads' table (Dual Write)
    try {
        await createLeadSupabase({
            name: input.customer_name,
            phone: input.phone,
            note: input.note
        });
    } catch (e) {
        console.warn("Could not create lead in public.leads (dual-write failed), proceeding with task only.", e);
        // We proceed so the user is not blocked, but we warn.
    }

    // 2. Create Task in 'telesales_tasks'
    return createTaskSupabase({
        title: 'Gọi lần 1',
        customer_name: input.customer_name,
        phone: input.phone,
        note: input.note ?? '',
        status: input.due_date ? 'today' : 'inbox',
        priority: 'normal',
        due_date: input.due_date ?? null,
        type: 'task', // Phase 3: Changed from 'lead' to 'task'
    });
}

/**
 * NEW: Fetches tasks with server-side pagination, search, and filtering.
 * Optimized for Kanban column loading.
 */
export async function fetchPaginatedTasks({
    userId,
    status,
    page = 1,
    pageSize = 20,
    filters = {},
    token
}: {
    userId?: string;
    status: TaskStatus | string;
    page?: number;
    pageSize?: number;
    filters?: {
        searchTerm?: string;
        priority?: TaskPriority | "all";
        dueDate?: "all" | "overdue" | "today" | "week";
        customerType?: "all" | "customer" | "personal";
    };
    token?: string;
}): Promise<{ data: TelesalesTask[], count: number }> {
    try {
        const activeUserId = userId || await getUserIdSafe();
        if (!activeUserId) return { data: [], count: 0 };

        const headers = (await getAuthHeaders(token)) as Record<string, string>;
        headers['Prefer'] = 'count=exact'; // Important for getting total count
        const offset = (page - 1) * pageSize;

        const params = new URLSearchParams();
        params.set('select', '*');
        params.set('status', `eq.${status}`);
        params.set('or', `(user_id.eq.${activeUserId},owner_id.eq.${activeUserId},assigned_to.eq.${activeUserId},assignee_ids.cs.{${activeUserId}},leader_id.eq.${activeUserId})`);
        params.set('order', 'order.asc.nullsfirst,created_at.desc');
        params.set('offset', offset.toString());
        params.set('limit', pageSize.toString());

        // Search Filter
        if (filters.searchTerm) {
            params.set('or', `(title.ilike.%${filters.searchTerm}%,customer_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%)`);
        }

        // Priority Filter
        if (filters.priority && filters.priority !== 'all') {
            params.set('priority', `eq.${filters.priority}`);
        }

        // Due Date Filter
        if (filters.dueDate && filters.dueDate !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (filters.dueDate === "overdue") {
                params.set('due_date', `lt.${today.toISOString()}`);
                params.set('status', 'neq.done');
            } else if (filters.dueDate === "today") {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                params.append('due_date', `gte.${today.toISOString()}`);
                params.append('due_date', `lt.${tomorrow.toISOString()}`);
            } else if (filters.dueDate === "week") {
                const weekFromNow = new Date(today);
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                params.append('due_date', `gte.${today.toISOString()}`);
                params.append('due_date', `lt.${weekFromNow.toISOString()}`);
            }
        }

        // Customer Type Filter
        if (filters.customerType && filters.customerType !== 'all') {
            if (filters.customerType === 'customer') {
                params.set('or', '(customer_name.is.not.null,phone.is.not.null)');
            } else if (filters.customerType === 'personal') {
                params.set('customer_name', 'is.null');
                params.set('phone', 'is.null');
            }
        }

        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${params.toString()}`, {
            headers
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[fetchPaginatedTasks] error:', res.status, errBody);
            return { data: [], count: 0 };
        }

        const contentRange = res.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;
        const data = await res.json();

        return { data: (data ?? []) as TelesalesTask[], count };
    } catch (e) {
        logSupabaseError('fetchPaginatedTasks - Exception', e);
        return { data: [], count: 0 };
    }
}

/**
 * NEW: Updates the order/rank of tasks in bulk.
 * Essential for smooth Kanban Drag & Drop.
 */
export async function updateTasksOrderSupabase(updates: { id: string, order: number }[], token?: string): Promise<boolean> {
    const userId = await getUserIdSafe();
    if (!userId) {
        console.error("[updateTasksOrderSupabase] Not authenticated.");
        return false;
    }

    try {
        const headers = await getAuthHeaders(token);

        // Use Promise.all to update orders in parallel via REST API
        const requests = updates.map(u => fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${u.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ order: u.order })
        }));

        const responses = await Promise.all(requests);
        const allOk = responses.every(res => res.ok);

        if (!allOk) {
            console.error("[updateTasksOrderSupabase] One or more requests failed.");
            return false;
        }

        return true;
    } catch (e) {
        logSupabaseError('updateTasksOrderSupabase - Exception', e);
        return false;
    }
}
