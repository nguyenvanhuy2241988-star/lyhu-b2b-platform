"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function MediaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.MEDIA_CREATOR);

    return (
        <DashboardShell role={ROLES.MEDIA_CREATOR} title="Media (Ảnh/Video)">
            {children}
        </DashboardShell>
    );
}
