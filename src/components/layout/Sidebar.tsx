"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { LucideIcon } from "lucide-react";

interface SidebarProps {
    role: keyof typeof NAV_ITEMS;
    isOpen: boolean;
    onClose?: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const items = NAV_ITEMS[role] || [];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Container - CORE APP Style */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-center border-b border-slate-200 px-6">
                    <h1 className="text-2xl font-bold text-primary-500">LYHU</h1>
                </div>

                <nav className="p-4 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon as LucideIcon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                                    isActive
                                        ? "bg-primary-50 text-primary-600 font-medium"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
