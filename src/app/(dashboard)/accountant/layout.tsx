"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function AccountantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.ACCOUNTANT as any);

    return (
        <DashboardShell role={ROLES.ACCOUNTANT} title="Kế toán & Tài chính">
            {children}
        </DashboardShell>
    );
}
