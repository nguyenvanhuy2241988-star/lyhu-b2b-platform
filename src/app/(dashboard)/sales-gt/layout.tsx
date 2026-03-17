"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function SalesGTLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.SALES_GT as any);

    return (
        <DashboardShell role={ROLES.SALES_GT} title="Sales GT">
            {children}
        </DashboardShell>
    );
}
