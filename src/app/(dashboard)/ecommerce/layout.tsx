"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function EcommerceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.ECOMMERCE as any);

    return (
        <DashboardShell role={ROLES.ECOMMERCE} title="Thương mại điện tử">
            {children}
        </DashboardShell>
    );
}
