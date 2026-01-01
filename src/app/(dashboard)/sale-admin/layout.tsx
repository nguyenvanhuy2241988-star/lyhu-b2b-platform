"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function SaleAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.SALE_ADMIN as any);

    return (
        <DashboardShell role={ROLES.SALE_ADMIN} title="Hậu cần & Admin Sale">
            {children}
        </DashboardShell>
    );
}
