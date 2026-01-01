"use client";

import DashboardShell from "@/components/layout/DashboardShell";

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell title="Hồ sơ người dùng">
            {children}
        </DashboardShell>
    );
}
