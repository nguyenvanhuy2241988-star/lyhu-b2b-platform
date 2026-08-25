"use client";

import OrderList from "@/components/orders/OrderList";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function AdminOrdersPage() {
    return (
        <div className="relative">
            {/* Mobile FAB */}
            <Link
                href="/sale-admin/create-order"
                className="lg:hidden fixed bottom-[150px] right-4 z-[45] flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl active:scale-95 transition-all duration-200"
            >
                <Plus className="w-6 h-6" />
            </Link>
            
            <OrderList readOnly={false} maskSensitiveData={false} hideRevenue={false} />
        </div>
    );
}
