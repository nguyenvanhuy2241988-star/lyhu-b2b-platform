"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentUser();
                if (user && user.role) {
                    setRole(user.role);
                } else {
                    router.push("/login"); // Fallback if no user
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                router.push("/login");
            }
        };
        init();
    }, [router]);

    if (!role) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <DashboardShell role={role as any} title="Tin nhắn nội bộ">
            {children}
        </DashboardShell>
    );
}
