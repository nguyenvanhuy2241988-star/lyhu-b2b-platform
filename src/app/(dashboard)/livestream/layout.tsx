"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function LivestreamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.LIVESTREAM as any);

    return (
        <DashboardShell role={ROLES.LIVESTREAM} title="Sale Live Stream">
            {children}
        </DashboardShell>
    );
}
