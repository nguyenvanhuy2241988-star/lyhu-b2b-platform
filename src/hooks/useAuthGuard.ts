"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserRole, getDashboardPath } from "@/lib/auth";

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
            const correctPath = getDashboardPath(user.role);
            router.push(correctPath);
            return;
        }

        setIsAuthorized(true);
    }, [expectedRole, router]);

    return isAuthorized;
}
