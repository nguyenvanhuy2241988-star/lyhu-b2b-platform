"use client";

// GT Tasks page reuses the Telesales Kanban tasks system
// The telesalesTasksStore is user-scoped (filters by user_id), so tasks are already per-user
export { default } from "@/app/(dashboard)/telesales/tasks/page";
