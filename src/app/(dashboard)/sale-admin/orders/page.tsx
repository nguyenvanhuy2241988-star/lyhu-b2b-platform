"use client";

import OrderList from "@/components/orders/OrderList";

export default function SaleAdminOrdersPage() {
    return (
        <OrderList
            readOnly={false}
            maskSensitiveData={false}
            hideRevenue={false}
            canEditShipping={true}
        />
    );
}
