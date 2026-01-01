"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ROLES, NAV_ITEMS } from "@/lib/constants";
import { getCurrentUser, logout } from "@/lib/auth";
import { UserRole } from "@/lib/auth";

interface DashboardShellProps {
    role?: UserRole;
    allowedRoles?: UserRole[];
    title: string;
    children: React.ReactNode;
}

export default function DashboardShell({ children, role, allowedRoles, title }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const check = async () => {
            const user = await getCurrentUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            // Access Control Logic
            if (role && user.role !== role) {
                router.replace("/login");
                return; // Early return
            }

            if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.replace("/login");
                return;
            }

            setCurrentUser(user);
        };
        check();
    }, [router, role, allowedRoles]); // Added allowedRoles to dependency

    // Determine the role to display in Sidebar
    // Priority: Enforced Role -> User's Actual Role -> Fallback
    const displayRole = role || currentUser?.role || 'telesales';

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                role={displayRole}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Topbar
                    title={title}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
