import { ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export type Region = "North" | "Central" | "South" | "Other";

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;

    // CTV contact info
    phone?: string;
    address?: string;
    province?: string;
    region?: Region;

    // CTV referral fields
    referralCode?: string;
    referredByCode?: string | null;
    referredByCtvId?: string | null;
    activatedAt?: string | null;
}

const USERS_STORAGE_KEY = "lyhu_users";

// Default mock users with location data
// Default mock users deleted to enforce Supabase Auth
const defaultMockUsers: User[] = [];

function generateReferralCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "CTV-";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Normalize phone: remove spaces, dots, dashes, +84 -> 0
export function normalizePhone(phone: string): string {
    if (!phone) return "";
    let normalized = phone.replace(/[\s.\-()]/g, "");
    if (normalized.startsWith("+84")) {
        normalized = "0" + normalized.slice(3);
    } else if (normalized.startsWith("84") && normalized.length > 9) {
        normalized = "0" + normalized.slice(2);
    }
    return normalized;
}

// Normalize address: lowercase, trim, collapse spaces
export function normalizeAddress(addr: string): string {
    if (!addr) return "";
    return addr.toLowerCase().trim().replace(/\s+/g, " ");
}

export function loadUsers(): User[] {
    if (typeof window === "undefined") return defaultMockUsers;
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        let users: User[] = stored ? JSON.parse(stored) : [];

        if (users.length === 0) {
            users = defaultMockUsers;
            saveUsers(users);
        } else {
            // Ensure new defaults (like telesales) are present
            let hasNewDefaults = false;
            defaultMockUsers.forEach(defaultUser => {
                if (!users.find(u => u.email === defaultUser.email)) {
                    users.push(defaultUser);
                    hasNewDefaults = true;
                }
            });
            if (hasNewDefaults) {
                saveUsers(users);
            }
        }
        return users;
    } catch (error) {
        console.error("Failed to load users:", error);
        return defaultMockUsers;
    }
}

export function saveUsers(users: User[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        window.dispatchEvent(new Event("users-updated"));
    } catch (error) {
        console.error("Failed to save users:", error);
    }
}

export function getUserById(userId: string): User | undefined {
    const users = loadUsers();
    return users.find(u => u.id === userId);
}

export function getUserByReferralCode(code: string): User | undefined {
    const users = loadUsers();
    return users.find(u => u.referralCode === code);
}

/**
 * Get all CTV users referred by a specific referral code.
 */
export function getChildCtvs(referralCode: string): User[] {
    const users = loadUsers();
    return users.filter(u => u.referredByCode === referralCode);
}

// ... Additional Helpers (sync) omitted for brevity if unused, but preserving core ones

export function updateUser(userId: string, updates: Partial<User>): void {
    const users = loadUsers();
    const updatedUsers = users.map(user => {
        if (user.id === userId) {
            return { ...user, ...updates };
        }
        return user;
    });
    saveUsers(updatedUsers);
}

export function updateUserActivation(userId: string, activatedAt: string): void {
    updateUser(userId, { activatedAt });
}

export function ensureCtvReferralCodes(): void {
    if (typeof window === "undefined") return;
    const users = loadUsers();
    let hasUpdates = false;
    const updatedUsers = users.map(user => {
        if (user.role === ROLES.CTV && !user.referralCode) {
            hasUpdates = true;
            return {
                ...user,
                referralCode: generateReferralCode()
            };
        }
        return user;
    });

    if (hasUpdates) {
        saveUsers(updatedUsers);
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

// --- SUPABASE ASYNC FUNCTIONS ---

export const fetchUsers = async (token?: string): Promise<User[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=full_name.asc`, { headers });
        if (!res.ok) throw new Error(`Fetch users error: ${res.statusText}`);
        const data = await res.json();

        return (data || []).map((p: any) => ({
            id: p.id,
            email: p.email,
            name: p.full_name || "Chưa đặt tên",
            role: p.role as UserRole,
            phone: p.phone,
            address: p.address,
            province: p.province,
            region: p.region,
            referralCode: p.referral_code,
            referredByCode: p.referred_by_code,
            activatedAt: p.activated_at
        }));
    } catch (err) {
        console.error("[fetchUsers] Error:", err);
        return [];
    }
};

export const fetchUserById = async (userId: string, token?: string): Promise<User | null> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, { headers });
        if (!res.ok) throw new Error(`Fetch user by id error: ${res.statusText}`);
        const data = await res.json();

        if (!data || data.length === 0) return null;
        const p = data[0];

        return {
            id: p.id,
            email: p.email,
            name: p.full_name || "Chưa đặt tên",
            role: p.role as UserRole,
            phone: p.phone,
            address: p.address,
            province: p.province,
            region: p.region,
            referralCode: p.referral_code,
            referredByCode: p.referred_by_code,
            activatedAt: p.activated_at
        };
    } catch (err) {
        console.error("[fetchUserById] Error:", err);
        return null;
    }
};
