import { supabase } from "@/lib/supabaseClient";
import { User, loadUsers } from "@/lib/usersStore";

export type AuthUser = User;

export const getRoleRedirect = (role?: string | null): string => {
    switch (role?.toLowerCase().trim()) {
        case "admin": return "/admin";
        case "telesales": return "/telesales";
        case "sales": return "/sales";
        case "ctv": return "/ctv";
        case "customer": return "/customer";
        default: return "/";
    }
};

// --- SUPABASE AUTH ---

export const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.warn('[signOut] Supabase signout error:', err);
    }

    // ALWAYS clear local session even if Supabase hang
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem("lyhu_user"); // standard key
        localStorage.removeItem("lyhu_access_token");
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    }
    return { error: null };
};

// ... (omitting logout export)

const STORAGE_KEY_USER = "lyhu_user";

// Hybrid getCurrentUser
export const getCurrentUser = async (): Promise<any | null> => {
    // FAST PATH: Try to get from localStorage immediately
    if (typeof window !== "undefined") {
        const mockUserStr = localStorage.getItem(STORAGE_KEY_USER);
        if (mockUserStr) {
            try {
                const userData = JSON.parse(mockUserStr);
                console.log('[getCurrentUser] Found local user, returning early');
                return userData;
            } catch (e) { }
        }
    }

    try {
        console.log('[getCurrentUser] Fetching session from Supabase (No Timeout)...');
        // No Promise.race here - we wait as long as it takes
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.warn('[getCurrentUser] Supabase error:', error.message);
            return null;
        }

        if (session?.user) {
            const user = session.user;
            console.log('[getCurrentUser] Session found, fetching role...');

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            const role = profile?.role || 'customer';

            const finalUser = {
                id: user.id,
                email: user.email,
                role: role,
                name: user.user_metadata?.full_name || user.email,
            };

            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(finalUser));
            }
            return finalUser;
        }
    } catch (err: any) {
        console.error('[getCurrentUser] Catastrophic error:', err);
    }

    console.log('[getCurrentUser] No user found');
    return null;
};
