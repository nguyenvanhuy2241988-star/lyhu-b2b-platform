import { ROLES } from "@/lib/constants";

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

export function ensureCtvReferralCodes(): void {
    const users = loadUsers();
    let modified = false;

    const updatedUsers = users.map(user => {
        if (user.role === ROLES.CTV && !user.referralCode) {
            modified = true;
            return { ...user, referralCode: generateReferralCode() };
        }
        return user;
    });

    if (modified) {
        saveUsers(updatedUsers);
    }
}

export function ensureCtvLocationDefaults(): void {
    const users = loadUsers();
    let modified = false;

    const updatedUsers = users.map(user => {
        if (user.role === ROLES.CTV) {
            let needsUpdate = false;
            const updates: Partial<User> = {};

            if (!user.province) {
                updates.province = "Unknown";
                needsUpdate = true;
            }
            if (!user.region) {
                updates.region = "Other";
                needsUpdate = true;
            }

            if (needsUpdate) {
                modified = true;
                return { ...user, ...updates };
            }
        }
        return user;
    });

    if (modified) {
        saveUsers(updatedUsers);
    }
}

export function linkReferral(childUserId: string, referredByCode: string): boolean {
    const users = loadUsers();
    const parent = users.find(u => u.referralCode === referredByCode);

    if (!parent || parent.role !== ROLES.CTV) {
        return false;
    }

    const updatedUsers = users.map(user => {
        if (user.id === childUserId) {
            return {
                ...user,
                referredByCode,
                referredByCtvId: parent.id,
            };
        }
        return user;
    });

    saveUsers(updatedUsers);
    return true;
}

export function updateUserActivation(userId: string, activatedAt: string): void {
    const users = loadUsers();
    const updatedUsers = users.map(user => {
        if (user.id === userId && !user.activatedAt) {
            return { ...user, activatedAt };
        }
        return user;
    });
    saveUsers(updatedUsers);
}

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

export function addUser(user: User): void {
    const users = loadUsers();
    // Ensure unique referral code for CTV
    if (user.role === ROLES.CTV && !user.referralCode) {
        user.referralCode = generateReferralCode();
    }
    users.push(user);
    saveUsers(users);
}

export function getChildCtvs(parentReferralCode: string): User[] {
    const users = loadUsers();
    return users.filter(u => u.referredByCode === parentReferralCode);
}
