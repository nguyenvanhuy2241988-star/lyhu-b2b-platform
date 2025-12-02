"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

const ROLE_PATHS = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.SALES]: "/sales",
    [ROLES.CTV]: "/ctv",
    [ROLES.CUSTOMER]: "/customer",
};

export function useAuthGuard(expectedRole: UserRole) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const user = getCurrentUser();

        if (!user) {
            router.push("/login");
            return;
        }

        if (user.role !== expectedRole) {
            // Redirect to their correct dashboard
            const correctPath = ROLE_PATHS[user.role] || "/login";
            router.push(correctPath);
            return;
        }

        setIsAuthorized(true);
    }, [expectedRole, router]);

    return isAuthorized;
}
