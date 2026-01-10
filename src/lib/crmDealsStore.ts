import { createClient } from './supabaseClient';

const supabase = createClient();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

// =====================================================
// PERFORMANCE OPTIMIZATION (Cache & Deduplication)
// =====================================================
const G_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds
const G_FETCHING = new Map<string, Promise<any>>();

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = G_CACHE.get(key);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        console.log(`[Cache] Using cached data for ${key}`);
        return cached.data as T;
    }

    // Deduplication: if already fetching same key, return same promise
    if (G_FETCHING.has(key)) {
        console.log(`[Dedupe] Already fetching ${key}, reusing promise`);
        return G_FETCHING.get(key) as Promise<T>;
    }

    const fetchPromise = (async () => {
        try {
            const data = await fetcher();
            G_CACHE.set(key, { data, timestamp: Date.now() });
            return data;
        } finally {
            G_FETCHING.delete(key);
        }
    })();

    G_FETCHING.set(key, fetchPromise);
    return fetchPromise;
}

// Clear cache when data changes
export function invalidateCRMCache() {
    console.log('[Cache] Invalidating CRM Cache');
    G_CACHE.clear();
}

// Helper for Session with Timeout
async function getSessionSafe() {
    try {
        const { data } = await supabase.auth.getSession();
        return data?.session;
    } catch (e) {
        return null;
    }
}

// =====================================================
// TYPES
// =====================================================

export type DealStage =
    | 'new_data'
    | 'npp'
    | 'supermarket'
    | 'waiting'
    | 'meeting'
    | 'contract'
    | 'cskh'
    | 'order'
    | 'issues'
    | 'debt'
    | 'done';

export type DealPriority = 'low' | 'normal' | 'high' | 'urgent';
export type DealStatus = 'open' | 'won' | 'lost';
export type DealSource = 'data_moi' | 'inbound' | 'referral' | 'reactivation';

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
    new_data: 'Data mới nhận',
    npp: 'Chào hàng NPP',
    supermarket: 'Chào hàng siêu thị',
    waiting: 'Đợi khách phản hồi',
    meeting: 'Gặp mặt trực tiếp',
    contract: 'Lên hợp đồng',
    cskh: 'CSKH / Nhắc nhập hàng',
    order: 'Lên đơn',
    issues: 'Xử lý vấn đề',
    debt: 'Thu hồi công nợ',
    done: 'Hoàn tất',
};

export const DEAL_PRIORITY_LABELS: Record<DealPriority, string> = {
    low: 'Thấp',
    normal: 'Bình thường',
    high: 'Cao',
    urgent: 'Khẩn',
};

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    type?: string;
    province?: string;
    district?: string;
    owner_user_id?: string;
    status?: string;
    created_at?: string;
    tax_code?: string;
    misa_code?: string;
    contact_person?: string;
    zalo?: string;
    ward?: string;
    notes?: string;
}

export interface CRMDeal {
    id: string;
    title: string;
    customer_id: string;
    customer?: Customer; // Joined data
    owner?: { full_name: string; avatar_url: string };
    stage: DealStage;
    priority: DealPriority;
    next_action_at?: string | null;
    note?: string | null;
    source?: DealSource; // Original source enum
    source_category?: string; // New: SELF_FOUND | COMPANY
    source_detail?: string;
    potential_level?: string; // HOT | WARM | COLD
    tags?: string[];
    owner_user_id: string;
    status: DealStatus;
    lost_reason?: string | null;
    expected_value?: number | null;
    created_at: string;
    updated_at: string;
}

// =====================================================
// COLUMN MANAGEMENT (Local Storage)
// =====================================================

export interface CRMColumn {
    id: string;
    label: string;
    stage: DealStage;
    order: number;
    isDefault?: boolean;
    isVisible?: boolean;
}

export const DEFAULT_CRM_COLUMNS: CRMColumn[] = [
    { id: 'new_data', label: 'Data mới nhận', stage: 'new_data', order: 0, isDefault: true, isVisible: true },
    { id: 'npp', label: 'Chào hàng NPP', stage: 'npp', order: 1, isDefault: true, isVisible: true },
    { id: 'supermarket', label: 'Chào hàng siêu thị', stage: 'supermarket', order: 2, isDefault: true, isVisible: true },
    { id: 'waiting', label: 'Đợi khách phản hồi', stage: 'waiting', order: 3, isDefault: true, isVisible: true },
    { id: 'meeting', label: 'Gặp mặt trực tiếp', stage: 'meeting', order: 4, isDefault: true, isVisible: true },
    { id: 'contract', label: 'Lên hợp đồng', stage: 'contract', order: 5, isDefault: true, isVisible: true },
    { id: 'cskh', label: 'CSKH / Nhắc nhập hàng', stage: 'cskh', order: 6, isDefault: true, isVisible: true },
    { id: 'order', label: 'Lên đơn', stage: 'order', order: 7, isDefault: true, isVisible: true },
    { id: 'issues', label: 'Xử lý vấn đề', stage: 'issues', order: 8, isDefault: true, isVisible: true },
    { id: 'debt', label: 'Thu hồi công nợ', stage: 'debt', order: 9, isDefault: true, isVisible: true },
    { id: 'done', label: 'Hoàn tất', stage: 'done', order: 10, isDefault: true, isVisible: true },
];

const CRM_COLUMNS_KEY = 'lyhu:crm:columns:v2';

export async function fetchCRMColumnsFromDB(token?: string): Promise<CRMColumn[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        const headers = getHeaders(token);
        // Get the first row (assuming single settings row)
        const res = await fetch(`${supabaseUrl}/rest/v1/app_settings?select=crm_columns&limit=1`, { headers });
        if (!res.ok) throw new Error('Failed to fetch settings');

        const data = await res.json();
        if (data && data.length > 0 && data[0].crm_columns) {
            const cols = data[0].crm_columns;
            // Update local cache
            saveCRMColumns(cols);
            return cols;
        }
    } catch (err) {
        console.error('fetchCRMColumnsFromDB error:', err);
    }
    // Fallback to local
    return loadCRMColumns();
}

export async function saveCRMColumnsToDB(cols: CRMColumn[], token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Save local first for optimism
    saveCRMColumns(cols);

    try {
        console.log('[CRM Debug] Saving columns via RPC...', { count: cols.length });

        const { error } = await supabase.rpc('update_crm_columns', {
            new_columns: cols
        });

        if (error) {
            console.error('[CRM Debug] RPC Error:', error);
            return false;
        }

        console.log('[CRM Debug] Successfully saved columns to DB (RPC).');
        return true;
    } catch (err) {
        console.error('saveCRMColumnsToDB error:', err);
        return false;
    }
}

export function loadCRMColumns(): CRMColumn[] {
    if (typeof window === 'undefined') return DEFAULT_CRM_COLUMNS;
    try {
        const raw = localStorage.getItem(CRM_COLUMNS_KEY);
        if (!raw) return DEFAULT_CRM_COLUMNS;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CRM_COLUMNS;
    } catch {
        return DEFAULT_CRM_COLUMNS;
    }
}

export function saveCRMColumns(cols: CRMColumn[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CRM_COLUMNS_KEY, JSON.stringify(cols));
        // Dispatch local event for other tabs/components
        window.dispatchEvent(new Event("crm-columns-updated"));
    } catch { }
}

// =====================================================
// CUSTOMER FUNCTIONS
// =====================================================

// Updated fetchCustomers to support filtering
export async function fetchCustomers(
    ownerId?: string,
    token?: string,
    filters?: {
        province?: string;
        district?: string;
        ward?: string;
        type?: string;
        search?: string;
        fromDate?: string;
        toDate?: string;
        sortBy?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
    }
): Promise<Customer[]> {
    try {
        const headers = getHeaders(token);

        // Base query
        let url = `${SUPABASE_URL}/rest/v1/customers?select=*`;

        // If ownerId provided, filter OR (owner_id.eq.ID,owner_id.is.null)
        if (ownerId) {
            url += `&or=(owner_user_id.eq.${ownerId},owner_user_id.is.null)`;
        }

        // Apply filters
        if (filters) {
            if (filters.province) url += `&province=eq.${encodeURIComponent(filters.province)}`;
            if (filters.district) url += `&district=eq.${encodeURIComponent(filters.district)}`;
            if (filters.ward) url += `&ward=eq.${encodeURIComponent(filters.ward)}`;

            if (filters.type && filters.type !== 'Tất cả') {
                url += `&type=eq.${filters.type}`;
            }

            // Date Range Filters
            if (filters.fromDate) {
                url += `&created_at=gte.${filters.fromDate}T00:00:00`;
            }
            if (filters.toDate) {
                url += `&created_at=lte.${filters.toDate}T23:59:59`;
            }

            if (filters.search) {
                // Combine search with owner logic if both present is tricky with simple query params
                // But here we append AND condition. 
                // Note: PostgREST `or` param combines with AND.
                // search: name or phone
                url += `&or=(name.ilike.*${encodeURIComponent(filters.search)}*,phone.ilike.*${encodeURIComponent(filters.search)}*)`;
            }
        }

        // Sorting
        const sortMap: Record<string, string> = {
            'newest': 'created_at.desc',
            'oldest': 'created_at.asc',
            'name_asc': 'name.asc',
            'name_desc': 'name.desc'
        };

        const sortParam = filters?.sortBy ? sortMap[filters.sortBy] : 'created_at.desc';
        url += `&order=${sortParam}`;

        // Limit to prevent huge payloads if no filters
        if (!filters?.search && !filters?.province && !filters?.district && !filters?.fromDate) {
            url += `&limit=100`;
        } else {
            url += `&limit=500`;
        }

        const res = await fetch(url, { headers });

        if (!res.ok) {
            const err = await res.json();
            console.error('fetchCustomers error:', err);
            return [];
        }

        const data = await res.json();
        return (data || []) as Customer[];
    } catch (err) {
        console.error('fetchCustomers exception:', err);
        return [];
    }
}

// Check if phone number already exists
export async function checkDuplicatePhone(phone: string, token?: string): Promise<Customer | null> {
    if (!phone || phone.length < 8) return null;

    // Clean phone number (remove spaces, dashes)
    const cleanPhone = phone.replace(/[\s\-\.]/g, '');

    // Only use last 9 digits if phone is long enough
    const searchPhone = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;

    try {
        const headers = getHeaders(token);
        // Query: or=(phone.eq.cleanPhone,phone.ilike.*searchPhone*) & limit=1
        // Need to URL encode
        const query = `or=(phone.eq.${cleanPhone},phone.ilike.*${searchPhone})&limit=1`;

        const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&${query}`, { headers });

        if (!res.ok) {
            console.error('checkDuplicatePhone error:', await res.text());
            return null;
        }

        const data = await res.json();
        return data && data.length > 0 ? (data[0] as Customer) : null;
    } catch (err) {
        console.error('checkDuplicatePhone exception:', err);
        return null;
    }
}

export async function searchCustomers(query: string, ownerId?: string, token?: string): Promise<Customer[]> {
    if (!query || query.length < 2) return [];

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const headers = getHeaders(authToken);

        // ilike filter: name.ilike.%query%, phone.ilike.%query%
        // PostgREST or query needs to handle this carefully.
        // or=(name.ilike.*query*,phone.ilike.*query*)

        let url = `${SUPABASE_URL}/rest/v1/customers?select=*&limit=20`;

        const encodedQuery = encodeURIComponent(query);
        const searchFilter = `or=(name.ilike.*${encodedQuery}*,phone.ilike.*${encodedQuery}*)`;

        if (ownerId) {
            // We need (search) AND (owner)
            // PostgREST combines top-level params with AND.
            url += `&${searchFilter}`;
            url += `&or=(owner_user_id.eq.${ownerId},owner_user_id.is.null)`;
        } else {
            url += `&${searchFilter}`;
        }

        const res = await fetch(url, { headers });

        if (!res.ok) {
            console.error('searchCustomers error:', res.statusText);
            return [];
        }

        const data = await res.json();
        return (data || []) as Customer[];
    } catch (err) {
        console.error('searchCustomers exception:', err);
        return [];
    }
}

export async function updateCustomer(id: string, updates: Partial<Customer>, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/customers?id=eq.${id}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    ...updates,
                    // If we want to track update timestamps on customers too
                })
            }
        );

        if (response.ok) {
            invalidateCRMCache();
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

/**
 * Creates a new customer record using pure fetch.
 * This matches the pattern used in createDeal to avoid Supabase Realtime hangs.
 */
export async function createCustomer(customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    type?: string;
    province?: string;
    district?: string;
    owner_user_id: string;
    status?: string;
    contact_person?: string;
    zalo?: string;
    notes?: string;
    tax_code?: string;
    ward?: string;
}, token?: string): Promise<Customer> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
    }

    try {
        console.log('[createCustomer] START (pure fetch)');

        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/customers`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(customer)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[createCustomer] Error:', response.status, errorText);
            throw new Error(`Failed to create customer: ${errorText}`);
        }

        const data = await response.json();
        console.log('[createCustomer] SUCCESS');

        invalidateCRMCache();

        // Return first item from array (POST returns array)
        return (Array.isArray(data) ? data[0] : data) as Customer;
    } catch (err) {
        console.error('[createCustomer] exception:', err);
        throw err;
    }
}

export async function deleteCustomer(id: string, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/customers?id=eq.${id}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`
                }
            }
        );

        if (response.ok) {
            invalidateCRMCache();
            return true;
        }
        return false;
    } catch (err) {
        console.error('deleteCustomer exception:', err);
        return false;
    }
}

// =====================================================
// CRM DEALS FUNCTIONS
// =====================================================

// Fetch deals for a specific owner (Telesales, Sales use this) - Using PURE FETCH
export async function fetchDeals(ownerId?: string, token?: string): Promise<CRMDeal[]> {
    if (!ownerId) {
        console.warn('[fetchDeals] no ownerId provided');
        return [];
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[fetchDeals] Missing Supabase credentials');
        return [];
    }

    const cacheKey = `deals:${ownerId}`;
    return fetchWithCache(cacheKey, async () => {
        try {
            // 1. Fetch Deals (Without JOIN profiles to avoid 400 error if FK missing)
            const response = await fetch(
                `${supabaseUrl}/rest/v1/crm_deals?select=*,customer:customers(*)&owner_user_id=eq.${ownerId}&order=created_at.desc`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token || supabaseKey}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[fetchDeals] Error:', response.status, errorText);
                return [];
            }

            const data = await response.json();

            // 2. Manual Join Profiles (Robust Fallback)
            let enrichedData = data;
            try {
                const userIds = Array.from(new Set(data.map((d: any) => d.owner_user_id).filter(Boolean)));
                if (userIds.length > 0) {
                    const profilesRes = await fetch(
                        `${supabaseUrl}/rest/v1/profiles?select=id,full_name,avatar_url&id=in.(${userIds.join(',')})`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${token || supabaseKey}`
                            }
                        }
                    );
                    if (profilesRes.ok) {
                        const profiles = await profilesRes.json();
                        const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
                        enrichedData = data.map((d: any) => ({
                            ...d,
                            owner: d.owner_user_id ? profileMap.get(d.owner_user_id) : null
                        }));
                    }
                }
            } catch (err) {
                console.warn('[fetchDeals] Failed to join profiles manually', err);
            }

            console.log('[fetchDeals] SUCCESS, count:', enrichedData.length);

            return (enrichedData || []).map((d: any) => ({
                ...d,
                customer: Array.isArray(d.customer) ? d.customer[0] || null : (d.customer || null)
            })) as CRMDeal[];
        } catch (err) {
            console.error('[fetchDeals] exception:', err);
            return [];
        }
    });
}

// Fetch ALL deals (Admin, Sale Admin use this) - Using PURE FETCH
export async function fetchAllDeals(token?: string): Promise<CRMDeal[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[fetchAllDeals] Missing Supabase credentials');
        return [];
    }

    const cacheKey = `deals:all`;
    return fetchWithCache(cacheKey, async () => {
        try {
            console.log('[fetchAllDeals] START (pure fetch)');

            // 1. Fetch All Deals (Without JOIN profiles)
            const response = await fetch(
                `${supabaseUrl}/rest/v1/crm_deals?select=*,customer:customers(*)&order=created_at.desc`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token || supabaseKey}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                // If 400, it might be due to bad params, but now we removed the complex join.
                console.error('[fetchAllDeals] Error:', response.status, errorText);
                return [];
            }

            const data = await response.json();

            // 2. Manual Join Profiles (Robust Fallback)
            let enrichedData = data;
            try {
                const userIds = Array.from(new Set(data.map((d: any) => d.owner_user_id).filter(Boolean)));
                if (userIds.length > 0) {
                    const profilesRes = await fetch(
                        `${supabaseUrl}/rest/v1/profiles?select=id,full_name,avatar_url&id=in.(${userIds.join(',')})`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${token || supabaseKey}`
                            }
                        }
                    );
                    if (profilesRes.ok) {
                        const profiles = await profilesRes.json();
                        const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
                        enrichedData = data.map((d: any) => ({
                            ...d,
                            owner: d.owner_user_id ? profileMap.get(d.owner_user_id) : null
                        }));
                    }
                }
            } catch (err) {
                console.warn('[fetchAllDeals] Failed to join profiles manually', err);
            }

            console.log('[fetchAllDeals] SUCCESS, count:', enrichedData.length);

            return (enrichedData || []).map((d: any) => ({
                ...d,
                customer: Array.isArray(d.customer) ? d.customer[0] || null : (d.customer || null)
            })) as CRMDeal[];
        } catch (err) {
            console.error('[fetchAllDeals] exception:', err);
            return [];
        }
    });
}

// Wrapper: Auto-select based on user role
export async function fetchDealsForUser(
    userId: string,
    userRole: string,
    token?: string
): Promise<CRMDeal[]> {
    // Admin and Sale Admin can see all deals
    if (userRole === 'admin' || userRole === 'sale_admin') {
        return fetchAllDeals(token);
    }
    // Others (telesales, sales) see only their own
    return fetchDeals(userId, token);
}


/**
 * Fetches a paginated and filterable list of deals.
 * All filtering, searching, and pagination is done on the server using REST.
 */
export async function fetchPaginatedDeals(
    page: number = 1,
    pageSize: number = 15,
    stage: DealStage | 'all' = 'all',
    searchTerm?: string,
    ownerId?: string,
    token?: string
): Promise<{ data: CRMDeal[]; count: number }> {
    const from = (page - 1) * pageSize;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let url = `${supabaseUrl}/rest/v1/crm_deals?select=*,customer:customers(*),owner:profiles(full_name,avatar_url)`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': supabaseKey || '',
            'Authorization': `Bearer ${token || supabaseKey}`,
            'Prefer': 'count=exact'
        };

        const filters: string[] = [];

        if (stage !== 'all') {
            filters.push(`stage=eq.${stage}`);
        }

        if (searchTerm) {
            filters.push(`title=ilike.*${searchTerm}*`);
        }

        if (ownerId) {
            filters.push(`owner_user_id=eq.${ownerId}`);
        }

        if (filters.length > 0) {
            url += `&${filters.join('&')}`;
        }

        // Ordering and Range (PostgREST uses offset/limit)
        url += `&order=updated_at.desc&offset=${from}&limit=${pageSize}`;

        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[fetchPaginatedDeals] Error:', response.status, errorText);
            throw new Error(`Failed to fetch paginated deals: ${errorText}`);
        }

        const countHeader = response.headers.get('Content-Range');
        const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
        const data = await response.json();

        const formattedData = (data || []).map((d: any) => ({
            ...d,
            customer: Array.isArray(d.customer) ? d.customer[0] || null : (d.customer || null),
            owner: Array.isArray(d.owner) ? d.owner[0] || null : (d.owner || null)
        })) as CRMDeal[];

        return { data: formattedData, count };
    } catch (err) {
        console.error('[fetchPaginatedDeals] exception:', err);
        throw err;
    }
}

/**
 * Fetches the count of deals per stage and global metrics (overdue/today) using efficient RPC.
 */
export async function getDealStageCounts(ownerId?: string, token?: string): Promise<{
    stages: Record<string, number>;
    overdue: number;
    today: number;
}> {
    try {
        const { data, error } = await supabase.rpc('get_crm_deal_counts', {
            p_owner_id: ownerId || null
        });

        if (error) {
            console.error('[getDealStageCounts] error:', error);
            return { stages: {}, overdue: 0, today: 0 };
        }

        return (data || { stages: {}, overdue: 0, today: 0 }) as any;
    } catch (err) {
        console.error('[getDealStageCounts] exception:', err);
        return { stages: {}, overdue: 0, today: 0 };
    }
}

// Check if user can edit/delete a deal
export function canEditDeal(deal: CRMDeal, userId: string, userRole: string): boolean {
    // Admin can edit all
    if (userRole === 'admin') return true;
    // Sale Admin can edit all
    if (userRole === 'sale_admin') return true;
    // Others can only edit their own
    return deal.owner_user_id === userId;
}

export function canDeleteDeal(deal: CRMDeal, userId: string, userRole: string): boolean {
    // Admin can delete all
    if (userRole === 'admin') return true;
    // Sale Admin CANNOT delete others' deals
    if (userRole === 'sale_admin') return deal.owner_user_id === userId;
    // Others can only delete their own
    return deal.owner_user_id === userId;
}

export async function fetchDeal(id: string, token?: string): Promise<CRMDeal | null> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/crm_deals?select=*,customer:customers(*),owner:profiles(full_name,avatar_url)&id=eq.${id}&limit=1`,
            { headers: { ...headers, 'Accept': 'application/vnd.pgrst.object+json' } } // Single object
        );

        if (!res.ok) {
            console.error('fetchDeal error:', await res.text());
            return null;
        }

        const data = await res.json();
        const deal = data as any;
        if (Array.isArray(deal.customer)) {
            deal.customer = deal.customer[0] || null;
        }
        return deal as CRMDeal;
    } catch (err) {
        console.error('fetchDeal exception:', err);
        return null;
    }
}

// Using PURE FETCH to avoid Supabase client Realtime conflict
export async function createDeal(deal: {
    title: string;
    customer_id: string;
    stage?: DealStage;
    priority?: DealPriority;
    next_action_at?: string;
    note?: string;
    source?: DealSource;
    tags?: string[];
    expected_value?: number;
    owner_user_id: string;
}, token?: string): Promise<CRMDeal> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
    }

    try {
        console.log('[createDeal] START (pure fetch)');

        // Get current user session for RLS with timeout
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        if (!authToken) {
            console.warn('[createDeal] No auth token found, using ANON key (might fail RLS)');
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/crm_deals`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    title: deal.title,
                    customer_id: deal.customer_id,
                    stage: deal.stage || 'new_data',
                    priority: deal.priority || 'normal',
                    next_action_at: deal.next_action_at,
                    note: deal.note,
                    source: deal.source || 'data_moi',
                    tags: deal.tags || [],
                    expected_value: deal.expected_value,
                    owner_user_id: deal.owner_user_id,
                    status: 'open'
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[createDeal] Error:', response.status, errorText);
            throw new Error(`Failed to create deal: ${errorText}`);
        }

        const data = await response.json();
        console.log('[createDeal] SUCCESS');

        // IMPORTANT: Invalidate cache when data changes
        invalidateCRMCache();

        // Return first item from array (POST returns array)
        const newDeal = Array.isArray(data) ? data[0] : data;

        // Fetch customer data separately to return complete deal
        if (newDeal && newDeal.customer_id) {
            try {
                const customerResponse = await fetch(
                    `${supabaseUrl}/rest/v1/customers?id=eq.${newDeal.customer_id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${authToken || supabaseKey}` // Fixed: authToken -> token
                        }
                    }
                );
                if (customerResponse.ok) {
                    const customers = await customerResponse.json();
                    newDeal.customer = customers[0] || null;
                }
            } catch {
                newDeal.customer = null;
            }
        }

        return newDeal as CRMDeal;
    } catch (err) {
        console.error('[createDeal] exception:', err);
        throw err;
    }
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function updateDeal(id: string, updates: Partial<CRMDeal>, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[updateDeal] Missing Supabase credentials');
        return false;
    }

    try {
        console.log(`[updateDeal] START (pure fetch) updating deal ${id}`, updates);

        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/crm_deals?id=eq.${id}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[updateDeal] Error:', response.status, errorText);
            throw new Error(`Failed to update deal: ${errorText}`);
        }

        console.log('[updateDeal] SUCCESS (pure fetch)');
        // IMPORTANT: Invalidate cache when data changes
        invalidateCRMCache();
        return true;
    } catch (err) {
        console.error('[updateDeal] exception:', err);
        throw err;
    }
}

export async function deleteDeal(id: string, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/crm_deals?id=eq.${id}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`
                }
            }
        );

        if (!response.ok) {
            console.error('[deleteDeal] Error:', await response.text());
            return false;
        }

        // IMPORTANT: Invalidate cache when data changes
        invalidateCRMCache();
        return true;
    } catch (err) {
        console.error('deleteDeal exception:', err);
        return false;
    }
}

// Check if customer has open deals
export async function checkOpenDeals(customerId: string, token?: string): Promise<CRMDeal[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }
        const headers = getHeaders(authToken);

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_deals?select=*&customer_id=eq.${customerId}&status=eq.open`,
            { headers }
        );

        if (!res.ok) {
            console.error('checkOpenDeals error:', await res.text());
            return [];
        }

        const data = await res.json();
        return (data || []) as CRMDeal[];
    } catch (err) {
        console.error('checkOpenDeals exception:', err);
        return [];
    }
}

// =====================================================
// CRM ACTIVITIES (Lịch sử cuộc gọi)
// =====================================================

export type ActivityType = 'call' | 'note' | 'email' | 'meeting' | 'task';
export type CallResult = 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'callback';

export interface CRMActivity {
    id: string;
    deal_id: string;
    customer_id?: string;
    type: ActivityType;
    subject?: string;
    description?: string;
    call_duration_seconds?: number;
    call_result?: CallResult;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface CRMDealItem {
    id: string;
    deal_id: string;
    product_id: string;
    product?: {
        name: string;
        sku: string;
    };
    quantity: number;
    unit_price: number;
    total_amount: number;
    created_at: string;
}



export const CALL_RESULT_LABELS: Record<CallResult, string> = {
    answered: 'Đã nghe máy',
    no_answer: 'Không nghe máy',
    busy: 'Máy bận',
    voicemail: 'Hộp thư thoại',
    callback: 'Hẹn gọi lại'
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
    call: 'Cuộc gọi',
    note: 'Ghi chú',
    email: 'Email',
    meeting: 'Gặp mặt',
    task: 'Công việc'
};

export async function fetchActivities(dealId: string, token?: string): Promise<CRMActivity[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }
        const headers = getHeaders(authToken);

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_activities?select=*&deal_id=eq.${dealId}&order=created_at.desc`,
            { headers }
        );

        if (!res.ok) {
            console.error('fetchActivities error:', await res.text());
            return [];
        }

        const data = await res.json();
        return (data || []) as CRMActivity[];
    } catch (err) {
        console.error('fetchActivities exception:', err);
        return [];
    }
}

export async function createActivity(activity: {
    deal_id: string;
    customer_id?: string;
    type: ActivityType;
    subject?: string;
    description?: string;
    call_duration_seconds?: number;
    call_result?: CallResult;
    user_id: string;
}, token?: string): Promise<CRMActivity | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_activities`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    deal_id: activity.deal_id,
                    customer_id: activity.customer_id,
                    type: activity.type,
                    subject: activity.subject,
                    description: activity.description,
                    call_duration_seconds: activity.call_duration_seconds,
                    call_result: activity.call_result,
                    user_id: activity.user_id
                })
            }
        );

        if (!res.ok) {
            console.error('createActivity error:', await res.text());
            return null;
        }

        const data = await res.json();
        return (Array.isArray(data) ? data[0] : data) as CRMActivity;
    } catch (err) {
        console.error('createActivity exception:', err);
        return null;
    }
}

export async function deleteActivity(id: string, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_activities?id=eq.${id}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`
                }
            }
        );

        if (!res.ok) {
            console.error('deleteActivity error:', await res.text());
            return false;
        }

        return true;
    } catch (err) {
        console.error('deleteActivity exception:', err);
        return false;
    }
}

// =====================================================
// DEAL ITEMS (Sản phẩm trong Cơ hội)
// =====================================================

export async function fetchDealItems(dealId: string, token?: string): Promise<CRMDealItem[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }
        const headers = getHeaders(authToken);

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_deal_items?select=*,product:products(name,sku)&deal_id=eq.${dealId}&order=created_at.asc`,
            { headers }
        );

        if (!res.ok) {
            const err = await res.json();
            console.error('fetchDealItems error:', err);
            return [];
        }

        const data = await res.json();
        return (data || []) as CRMDealItem[];
    } catch (err) {
        console.error('fetchDealItems exception:', err);
        return [];
    }
}

export async function addDealItem(item: {
    deal_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
}, token?: string): Promise<CRMDealItem | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_deal_items`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    deal_id: item.deal_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                })
            }
        );

        if (!res.ok) {
            console.error('addDealItem error:', await res.text());
            return null;
        }

        const data = await res.json();
        const newItem = (Array.isArray(data) ? data[0] : data) as CRMDealItem;

        // Fetch product details manually for consistent return type
        try {
            const pRes = await fetch(`${supabaseUrl}/rest/v1/products?select=name,sku&id=eq.${newItem.product_id}`, {
                headers: { 'apikey': supabaseKey || '', 'Authorization': `Bearer ${authToken || supabaseKey}` }
            });
            if (pRes.ok) {
                const pData = await pRes.json();
                newItem.product = pData[0] || null;
            }
        } catch { }

        return newItem;
    } catch (err) {
        console.error('addDealItem exception:', err);
        return null;
    }
}

export async function deleteDealItem(id: string, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_deal_items?id=eq.${id}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`
                }
            }
        );

        return res.ok;
    } catch (err) {
        return false;
    }
}

export async function updateDealItem(id: string, updates: { quantity?: number, unit_price?: number }, token?: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        let authToken = token;
        if (!authToken) {
            const session = await getSessionSafe();
            authToken = session?.access_token;
        }

        const res = await fetch(
            `${supabaseUrl}/rest/v1/crm_deal_items?id=eq.${id}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey || '',
                    'Authorization': `Bearer ${authToken || supabaseKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updates)
            }
        );

        return res.ok;
    } catch (err) {
        return false;
    }
}
