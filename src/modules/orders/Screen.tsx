"use client";

// Re-exporting the Telesales Orders Page for the "Orders" module screen.
// This allows shared usage across roles (Admin, Sales, Telesales...) while maintaining a single source of truth.
// In the future, permission checks inside the component can toggle specific actions (like "Delete Order").
import TelesalesOrdersPage from "@/app/(dashboard)/telesales/orders/page";

export default TelesalesOrdersPage;
