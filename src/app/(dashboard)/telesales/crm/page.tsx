import { redirect } from "next/navigation";

// Redirect từ route cũ sang route mới
export default function OldCRMPage() {
    redirect("/crm");
}
