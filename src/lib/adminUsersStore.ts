import { createClient } from "@/lib/supabaseClient";

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

/**
 * Fetches a paginated and searchable list of users (profiles).
 * Uses REST API for performance.
 */
export async function fetchPaginatedUsers(
    page: number = 1,
    pageSize: number = 20,
    searchTerm?: string,
    token?: string
): Promise<PaginatedUsersResponse> {
    const from = (page - 1) * pageSize;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials");
    }

    try {
        let url = `${supabaseUrl}/rest/v1/profiles?select=*`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token || supabaseKey}`,
            'Prefer': 'count=exact'
        };

        const filters: string[] = [];

        if (searchTerm) {
            // Flexible search across full_name and email
            filters.push(`or=(full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*)`);
        }

        if (filters.length > 0) {
            url += `&${filters.join('&')}`;
        }

        // Ordering and Range
        url += `&order=created_at.desc&offset=${from}&limit=${pageSize}`;

        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[fetchPaginatedUsers] Error:', response.status, errorText);
            throw new Error(`Failed to fetch paginated users: ${errorText}`);
        }

        const countHeader = response.headers.get('Content-Range');
        const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
        const data = await response.json();

        return { data: data || [], count };
    } catch (err) {
        console.error('[fetchPaginatedUsers] exception:', err);
        throw err;
    }
}
