"use client";

import DashboardShell from "@/components/layout/DashboardShell";

export default function SharedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // No useAuthGuard — this is accessible to all authenticated roles.
    // DashboardShell auto-detects the user's role for sidebar display.
    return (
        <DashboardShell title="Tổng quan">
            {children}
        </DashboardShell>
    );
}
