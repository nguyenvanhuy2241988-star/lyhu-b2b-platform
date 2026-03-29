"use client";

// Admin Equipment Management — imports and renders the same component
// but from the admin layout context (no media_creator auth guard)
import MediaEquipmentPage from "@/app/(dashboard)/media/equipment/page";

export default function AdminMediaEquipmentPage() {
    return <MediaEquipmentPage />;
}
