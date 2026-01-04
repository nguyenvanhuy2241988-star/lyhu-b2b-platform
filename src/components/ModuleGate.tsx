"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/AuthProvider";
import { Forbidden403 } from "@/components/Forbidden403";
import { resolvePermissions, hasAllPermissions } from "@/core/permissions/resolve";
import type { ModuleDef, Role } from "@/modules/types";
import { Loader2 } from "lucide-react";

interface ModuleGateProps {
    moduleDef: ModuleDef;
}

export function ModuleGate({ moduleDef }: ModuleGateProps) {
    const { user, role, isLoading } = useAuth();

    // Lazy load the module screen
    // We use useMemo to ensure the DynamicComponent is stable across renders
    const ModuleScreen = useMemo(() => {
        return dynamic(moduleDef.loader, {
            loading: () => (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
            ),
            ssr: false // Most dashboards need client-side data anyway
        });
    }, [moduleDef]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
        );
    }

    if (!user) {
        // AuthProvider or Middleware should handle redirect, but just in case
        return null;
    }

    // Check Permissions
    // NOTE: role in AuthProvider is string, cast to Role type
    const userRole = (role || 'customer') as Role;
    const isAllowed = hasAllPermissions(userRole, moduleDef.requiredPerms);

    if (!isAllowed) {
        return <Forbidden403 />;
    }

    return <ModuleScreen />;
}
