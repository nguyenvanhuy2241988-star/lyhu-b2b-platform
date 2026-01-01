"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.MARKETING as any);

    return (
        <DashboardShell role={ROLES.MARKETING} title="Marketing & Truyền thông">
            {children}
        </DashboardShell>
    );
}
