"use client";

import CustomerShell from "@/components/layout/CustomerShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Only allow customers (or admins acting as customers if we want, but let's stick to CUSTOMER for now)
    useAuthGuard(ROLES.CUSTOMER as any);

    return (
        <CustomerShell title="Tổng quan Khách hàng">
            {children}
        </CustomerShell>
    );
}
