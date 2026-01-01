"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function ShipperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.SHIPPER as any);

    return (
        <DashboardShell role={ROLES.SHIPPER} title="Vận chuyển & Giao nhận">
            {children}
        </DashboardShell>
    );
}
