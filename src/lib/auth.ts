import { ROLES } from "@/lib/constants";

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

const STORAGE_KEY = "lyhu_current_user";

// Mock users dùng cho đăng nhập nội bộ
export const mockUsers: AuthUser[] = [
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
    },
    {
        id: "4",
        email: "customer@lyhu.vn",
        name: "Khách hàng LYHU",
        role: ROLES.CUSTOMER,
    },
];

// Kiểm tra email/password theo danh sách mock ở trên
export function authenticateUser(
    email: string,
): AuthUser | null {
    const user = mockUsers.find((u) => u.email === email);
    return user ?? null;
}

export function setCurrentUser(user: AuthUser | null) {
    if (typeof window === "undefined") return;
    if (!user) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
    }
    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }),
    );
}

export function getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed as AuthUser;
    } catch {
        return null;
    }
}

export function logout() {
    setCurrentUser(null);
}
