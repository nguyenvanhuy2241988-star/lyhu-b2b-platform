import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";

const ROLE_PATHS = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.SALES]: "/sales",
    [ROLES.CTV]: "/ctv",
    [ROLES.CUSTOMER]: "/customer",
    [ROLES.TELESALES]: "/telesales",
    [ROLES.RECRUITER]: "/recruitment",
    [ROLES.WAREHOUSE]: "/warehouse",
    [ROLES.MARKETING]: "/marketing",
    [ROLES.ECOMMERCE]: "/ecommerce",
    [ROLES.RND]: "/rnd",
    [ROLES.SHIPPER]: "/shipper",
    [ROLES.ACCOUNTANT]: "/accountant",
    [ROLES.SALE_ADMIN]: "/sale-admin",
    [ROLES.LIVESTREAM]: "/livestream",
};

export type UserRole = keyof typeof ROLE_PATHS;

export function useAuthGuard(expectedRole?: UserRole) {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            console.log("[useAuthGuard] No user, redirecting to login");
            router.push("/login");
            return;
        }

        // Wait for role to be populated if user exists
        if (user && role === null) {
            console.log("[useAuthGuard] User found but role still loading. Waiting...");
            return;
        }

        // If expectedRole is provided, enforce it
        if (expectedRole && role && role !== expectedRole) {
            // 🚀 Special case: Admins are always allowed to access other role pages
            if (role === ROLES.ADMIN) {
                console.log(`[useAuthGuard] Admin accessing ${expectedRole} page. Permitted.`);
                return;
            }

            console.warn(`[useAuthGuard] Role mismatch: ${role} vs ${expectedRole}. Redirecting home.`);
            const correctPath = ROLE_PATHS[role as UserRole] || "/login";
            router.push(correctPath);
        }
    }, [user, role, isLoading, expectedRole, router]);

    return !isLoading && user && (!expectedRole || role === expectedRole);
}
