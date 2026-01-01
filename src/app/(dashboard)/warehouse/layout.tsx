"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function WarehouseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.WAREHOUSE as any);

    return (
        <DashboardShell role={ROLES.WAREHOUSE} title="Quản lý Kho vận">
            {children}
        </DashboardShell>
    );
}
