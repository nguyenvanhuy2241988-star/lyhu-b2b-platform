"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function CTVLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.CTV as any);

    return (
        <DashboardShell role={ROLES.CTV} title="CTV Dashboard">
            {children}
        </DashboardShell>
    );
}
