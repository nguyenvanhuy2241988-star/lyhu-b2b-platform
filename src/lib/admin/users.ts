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
export async function fetchPaginatedUsers(
    page: number = 1,
    searchTerm?: string
): Promise<PaginatedUsersResponse> {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
        let query = supabase.from('profiles').select('*', { count: 'exact' });

        if (searchTerm) {
            query = query.or(`full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*`);
        }

        // Apply pagination and ordering
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchPaginatedUsers] Error:', error);
            throw new Error(error.message);
        }

        return { data: (data as AdminUser[]) || [], count: count || 0 };
    } catch (err) {
        console.error('[fetchPaginatedUsers] exception:', err);
        throw err;
    }
}
