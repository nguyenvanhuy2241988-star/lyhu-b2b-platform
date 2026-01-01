"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const user = await getCurrentUser();

            if (!user) {
                router.push("/login");
                return;
            }

            if (user.role !== expectedRole) {
                // Redirect to their correct dashboard
                const role = user.role as UserRole;
                const correctPath = ROLE_PATHS[role] || "/login";
                router.push(correctPath);
                return;
            }

            setIsAuthorized(true);
        };
        checkAuth();
    }, [expectedRole, router]);

    return isAuthorized;
}
