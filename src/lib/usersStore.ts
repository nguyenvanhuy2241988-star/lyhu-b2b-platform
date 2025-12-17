import { ROLES } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";

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
const defaultMockUsers: User[] = [
    {
        id: "1",
        email: "admin@lyhu.vn",
        name: "Admin LYHU",
        role: ROLES.ADMIN,
    },
    {
        id: "2",
        email: "sales@lyhu.vn",
        name: "Sales LYHU",
        role: ROLES.SALES,
    },
    {
        id: "3",
        email: "ctv@lyhu.vn",
        name: "CTV LYHU",
        role: ROLES.CTV,
        referralCode: "CTV-LYHU",
        phone: "0901234567",
        address: "123 Nguyễn Huệ, Quận 1",
        province: "TP.HCM",
        region: "South",
    },
    {
        id: "4",
        email: "customer@lyhu.vn",
        name: "Khách hàng LYHU",
        role: ROLES.CUSTOMER,
    },
];

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
        if (stored) {
            return JSON.parse(stored);
        }
        // Initialize with defaults if not exists
        saveUsers(defaultMockUsers);
        return defaultMockUsers;
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

// --- SUPABASE ASYNC FUNCTIONS ---

export const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error("Error loading profiles:", error);
        return [];
    }

    return data.map((p: any) => ({
        id: p.id,
        email: p.email,
        name: p.full_name,
        role: p.role as UserRole,
        phone: p.phone,
        address: p.address,
        province: p.province,
        region: p.region,
        referralCode: p.referral_code,
        referredByCode: p.referred_by_code,
        activatedAt: p.activated_at
    }));
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        email: data.email,
        name: data.full_name,
        role: data.role as UserRole,
    };
};
