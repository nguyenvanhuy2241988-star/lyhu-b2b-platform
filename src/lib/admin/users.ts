import { createClient } from "../supabaseClient";

const supabase = createClient();

export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    created_at: string;
}

export interface PaginatedUsersResponse {
    data: AdminUser[];
    count: number;
}

const ITEMS_PER_PAGE = 20;

/**
 * Fetches a paginated and searchable list of users for the admin area.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getAuthHeaders = async () => {
    let finalToken = null;
    try {
        const { data } = await supabase.auth.getSession();
        finalToken = data?.session?.access_token;
    } catch (e) {
        console.warn('[Admin Users] getAuthHeaders session issue');
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY || ''
    };
    if (finalToken) {
        headers['Authorization'] = `Bearer ${finalToken}`;
    } else {
        headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
};

/**
 * Fetches a paginated and searchable list of users for the admin area.
 * Refactored to use Pure Fetch to avoid Realtime client conflicts.
 */
export async function fetchPaginatedUsers(
    page: number = 1,
    searchTerm?: string
): Promise<PaginatedUsersResponse> {
    const from = (page - 1) * ITEMS_PER_PAGE;

    try {
        const headers = await getAuthHeaders();
        // Add Prefer: count=exact to get full count
        headers['Prefer'] = 'count=exact';

        const params = new URLSearchParams();
        params.set('select', '*'); // profile columns

        if (searchTerm) {
            params.set('or', `full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*`);
        }

        params.set('order', 'created_at.desc');
        params.set('offset', from.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());

        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${params.toString()}`, {
            headers,
            method: 'GET'
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[fetchPaginatedUsers] fetch error:', res.status, err);
            throw new Error(`Fetch failed: ${res.status}`);
        }

        // Get count from Content-Range header: 0-19/100
        const contentRange = res.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;

        const data = await res.json();

        return { data: (data as AdminUser[]) || [], count: isNaN(count) ? 0 : count };
    } catch (err) {
        console.error('[fetchPaginatedUsers] exception:', err);
        throw err;
    }
}
