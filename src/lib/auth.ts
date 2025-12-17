import { supabase } from "@/lib/supabaseClient";
import { User, loadUsers } from "@/lib/usersStore";

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

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
};

// --- MOCK / HYBRID AUTH ---

const STORAGE_KEY_USER = "lyhu_user"; // Align with setCurrentUser logic if possible. login/page uses set item?
// Actually login/page checks `authenticateUser` then `setCurrentUser`.

export const authenticateUser = (email: string): User | null => {
    // Mock authentication against loadUsers()
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    // For mock, any password works if email matches, or we can check logic.
    // Original login checked 'admin123' hardcoded in state? NO, login/page has state `password`.
    // But `authenticateUser` (step 594 viewed usage) only takes `email`.
    // So password check was skipped or inside authenticateUser?
    // Step 594: `const user = authenticateUser(email.trim());`. It ignored password.
    return user || null;
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
    // 1. Try Supabase
    const { data } = await supabase.auth.getUser();
    if (data.user) {
        // Map Supabase user to our User interface?
        return {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'telesales', // Fallback
            name: data.user.user_metadata?.full_name || data.user.email,
            // ... other fields
        };
    }

    // 2. Try LocalStorage
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY_USER);
        if (stored) {
            return JSON.parse(stored);
        }
    }

    return null;
};
