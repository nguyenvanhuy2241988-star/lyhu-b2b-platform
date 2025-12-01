"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.CUSTOMER as any);

    return (
        <DashboardShell role={ROLES.CUSTOMER} title="Customer Dashboard">
            {children}
        </DashboardShell>
    );
}
