"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.SALES as any);

    return (
        <DashboardShell role={ROLES.SALES} title="Sales Dashboard">
            {children}
        </DashboardShell>
    );
}
