"use client";

import DashboardShell from "@/components/layout/DashboardShell";

export default function TasksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // DashboardShell will auto-detect role from AuthProvider if not provided
    return (
        <DashboardShell title="Việc cần làm">
            {children}
        </DashboardShell>
    );
}
