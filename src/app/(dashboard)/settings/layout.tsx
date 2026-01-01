"use client";

import DashboardShell from "@/components/layout/DashboardShell";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell title="Cài đặt hệ thống">
            {children}
        </DashboardShell>
    );
}
