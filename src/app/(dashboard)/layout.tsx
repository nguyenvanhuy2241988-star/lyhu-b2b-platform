import React from "react";
import { TaskAssignNotification } from "@/components/tasks/TaskAssignNotification";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <TaskAssignNotification />
            {children}
        </>
    );
}
