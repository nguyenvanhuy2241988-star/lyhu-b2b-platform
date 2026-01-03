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
};

export type UserRole = keyof typeof ROLE_PATHS;

export function useAuthGuard(expectedRole: UserRole) {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            console.log("[useAuthGuard] No user, redirecting to login");
            router.push("/login");
            return;
        }

        if (role && role !== expectedRole) {
            console.warn(`[useAuthGuard] Role mismatch: ${role} vs ${expectedRole}. Redirecting home.`);
            const correctPath = ROLE_PATHS[role as UserRole] || "/login";
            router.push(correctPath);
        }
    }, [user, role, isLoading, expectedRole, router]);

    return !isLoading && user && role === expectedRole;
}
