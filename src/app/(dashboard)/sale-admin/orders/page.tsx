"use client";

import Link from "next/link";
import { PlusCircle, Plus } from "lucide-react";
import OrderList from "@/components/orders/OrderList";

export default function SaleAdminOrdersPage() {
    return (
        <div className="relative">
            {/* Desktop Button (hacky positioning for OrderList header) */}
            <div className="hidden lg:flex justify-end -mb-10 relative z-10 pr-[140px]">
                <Link
                    href="/sale-admin/create-order"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Tạo đơn hàng
                </Link>
            </div>
            
            {/* Mobile FAB */}
            <Link
                href="/sale-admin/create-order"
                className="lg:hidden fixed bottom-[150px] right-4 z-[45] flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl active:scale-95 transition-all duration-200"
            >
                <Plus className="w-6 h-6" />
            </Link>

            <OrderList
                readOnly={false}
                maskSensitiveData={false}
                hideRevenue={false}
                canEditShipping={true}
            />
        </div>
    );
}
