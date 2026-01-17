"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserRole } from "@/lib/auth";

export default function DocumentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, role: userRole, isLoading } = useAuth();

    // Determine the role to display in Sidebar
    const sidebarRole = (userRole || user?.role || 'admin') as UserRole;

    if (isLoading && !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Reusing Global Sidebar */}
            <Sidebar
                role={sidebarRole}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen">
                {/* Reusing Global Topbar */}
                <Topbar
                    title="Tài liệu & Files"
                    onMenuClick={() => setSidebarOpen(true)}
                />

                {/* Custom Main for Documents - No Padding, No Global Scroll */}
                {/* The page itself handles scrolling and layout */}
                <main className="flex-1 relative overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
