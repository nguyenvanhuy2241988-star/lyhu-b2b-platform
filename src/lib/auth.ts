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
    // Try Supabase sign out
    const { error } = await supabase.auth.signOut();
    // Also clear local mock session
    if (typeof window !== "undefined") {
        localStorage.removeItem("lyhu_current_user"); // Legacy key? Or whatever setCurrentUser uses
        sessionStorage.removeItem("lyhu_current_user");
    }
    return { error };
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
export const getCurrentUser = async (): Promise<any | null> => {
    // 1. Try Supabase (Use getSession to avoid server-side hang on weak connections/sockets)
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
        const user = data.session.user;
        // Map Supabase user to our User interface?
        // Fetch role from profiles table (Source of Truth)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email,
            role: profile?.role || 'telesales', // Fallback only if profile missing (shouldn't happen)
            name: user.user_metadata?.full_name || user.email,
            // ... other fields
        };
    }

    // 2. Try LocalStorage - REMOVED for Security Standardization
    // User must be authenticated via Supabase.

    return null;
};
