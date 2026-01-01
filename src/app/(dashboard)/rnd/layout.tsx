"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function RndLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.RND as any);

    return (
        <DashboardShell role={ROLES.RND} title="Nghiên cứu & Phát triển">
            {children}
        </DashboardShell>
    );
}
