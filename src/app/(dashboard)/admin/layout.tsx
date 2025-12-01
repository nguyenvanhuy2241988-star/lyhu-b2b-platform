"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.ADMIN as any);

    return (
        <DashboardShell role={ROLES.ADMIN} title="Admin Dashboard">
            {children}
        </DashboardShell>
    );
}
