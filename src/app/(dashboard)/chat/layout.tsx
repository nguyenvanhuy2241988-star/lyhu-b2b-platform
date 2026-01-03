"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect to login if loading is finished AND we definitely have no user
        // and NO user in local storage (fallback)
        const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('lyhu_user') : null;

        if (!isLoading && !user && !cachedUser) {
            console.log("[ChatLayout] No user found, redirecting to login");
            router.push("/login?next=/chat");
        }
    }, [user, isLoading, router]);

    // Show loading if either auth is loading OR user is found but role isn't fetched yet
    if (isLoading || (user && !role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Role might be null if user is not in profiles table, fallback safely
    const displayRole = (role || 'customer') as any;

    return (
        <DashboardShell role={displayRole} title="Tin nhắn nội bộ">
            {children}
        </DashboardShell>
    );
}
