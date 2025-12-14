"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function TelesalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.TELESALES as any);

    return (
        <DashboardShell role={ROLES.TELESALES} title="Tổng quan Telesales">
            {children}
        </DashboardShell>
    );
}
