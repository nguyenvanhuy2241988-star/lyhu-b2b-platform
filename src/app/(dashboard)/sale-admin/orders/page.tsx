"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import OrderList from "@/components/orders/OrderList";

export default function SaleAdminOrdersPage() {
    return (
        <div className="space-y-0">
            <div className="flex justify-end -mb-10 relative z-10 pr-[140px]">
                <Link
                    href="/sale-admin/create-order"
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Tạo đơn hàng
                </Link>
            </div>
            <OrderList
                readOnly={false}
                maskSensitiveData={false}
                hideRevenue={false}
                canEditShipping={true}
            />
        </div>
    );
}
