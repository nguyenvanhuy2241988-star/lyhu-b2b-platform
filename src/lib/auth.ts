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
        // Try Supabase sign out with timeout
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('SignOut Timeout')), 3000)
        );

        await Promise.race([signOutPromise, timeoutPromise]);
    } catch (err) {
        console.warn('[signOut] Error or Timeout:', err);
    }

    // ALWAYS clear local session even if Supabase hang
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem("lyhu_user"); // standard key
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("sb-refresh-token");
        sessionStorage.clear();

        // Clear all cookies (brute force)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    }
    return { error: null };
};

export const logout = signOut;

export type UserRole = "admin" | "sales" | "ctv" | "customer" | "telesales" | "recruiter" | "warehouse" | "marketing" | "ecommerce" | "rnd" | "shipper" | "accountant" | "sale_admin" | "livestream";

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
};

// --- MOCK / HYBRID AUTH ---

const STORAGE_KEY_USER = "lyhu_user"; // Align with setCurrentUser logic if possible. login/page uses set item?
// Actually login/page checks `authenticateUser` then `setCurrentUser`.

// Mock authentication removed. Use Supabase Auth.
export const authenticateUser = (email: string): User | null => {
    return null;
};

export const setCurrentUser = (user: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    // Dispatch event for UI updates if any listen to it
    window.dispatchEvent(new Event("user-updated"));
};

// Hybrid getCurrentUser
// Returns Supabase user (mapped to User type?) or LocalStorage user
// Note: Supabase user has different shape than User interface.
// We should standardize. Telesales pages expect `user.id`.
// Hybrid getCurrentUser with timeout
export const getCurrentUser = async (): Promise<any | null> => {
    try {
        // 1. Try Supabase with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((_, reject) =>
            setTimeout(() => reject(new Error('Auth Timeout')), 5000)
        );

        const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (data?.session?.user) {
            const user = data.session.user;

            // Try fetching profile with its own (short) timeout
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                return {
                    id: user.id,
                    email: user.email,
                    role: profile?.role || 'customer',
                    name: user.user_metadata?.full_name || user.email,
                };
            } catch {
                // Return user even if profile fetch fails
                return {
                    id: user.id,
                    email: user.email,
                    role: 'customer',
                    name: user.user_metadata?.full_name || user.email,
                };
            }
        }
    } catch (err) {
        console.warn('[getCurrentUser] Error or Timeout:', err);
    }

    // 2. FALLBACK: LocalStorage
    if (typeof window !== "undefined") {
        const mockUserStr = localStorage.getItem(STORAGE_KEY_USER);
        if (mockUserStr) {
            try {
                return JSON.parse(mockUserStr);
            } catch {
                return null;
            }
        }
    }

    return null;
};
