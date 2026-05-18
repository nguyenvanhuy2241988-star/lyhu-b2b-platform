export type Role = "admin" | "telesales" | "sales" | "ctv" | "customer" | "recruiter" | "warehouse" | "marketing" | "ecommerce" | "rnd" | "shipper" | "accountant" | "sale_admin" | "livestream" | "sales_gt" | "media_creator";

export const ROLE_HOME: Record<Role, string> = {
    admin: "/admin",
    telesales: "/telesales",
    sales: "/sales",
    ctv: "/ctv",
    customer: "/customer",
    recruiter: "/recruitment",
    warehouse: "/warehouse",
    marketing: "/marketing",
    ecommerce: "/ecommerce",
    rnd: "/rnd",
    shipper: "/shipper",
    accountant: "/accountant",
    sale_admin: "/sale-admin",
    livestream: "/livestream",
    sales_gt: "/sales-gt",
    media_creator: "/media",
};

// Các đường dẫn dùng chung cho nhiều role
export const SHARED_PATHS = [
    "/chat",
    "/profile",
    "/settings",
    "/crm",       // CRM chung cho Admin, Sales, Telesales...
    "/tasks",     // Todo list chung
    "/documents", // Tài liệu chung
    "/shared"     // Shared pages (Media Library read-only, etc.)
];

// Danh sách tất cả các prefix cần bảo vệ (Yêu cầu đăng nhập)
export const PROTECTED_PREFIXES = [
    ...Object.values(ROLE_HOME),
    ...SHARED_PATHS
];

export function getHomePath(role?: string | null): string {
    if (!role) return "/";
    const r = role.toLowerCase() as Role;
    if (r === 'customer') return '/';
    return ROLE_HOME[r] ?? "/";
}

export function isRoleAllowedPath(role: Role, pathname: string): boolean {
    // 1. Cho phép các trang dùng chung
    if (SHARED_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
        return true;
    }

    // 2. Kiểm tra đúng khu vực bảo vệ theo role
    const normalizedRole = role.toLowerCase() as Role;
    const prefix = ROLE_HOME[normalizedRole];
    if (!prefix) return false;
    return pathname === prefix || pathname.startsWith(prefix + "/");
}
