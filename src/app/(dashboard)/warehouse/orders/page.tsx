"use client";

import OrderList from "@/components/orders/OrderList";

export default function WarehouseOrdersPage() {
    return (
        <OrderList
            readOnly={true}
            maskSensitiveData={true}
            hideRevenue={true}
            canEditShipping={true}
        />
    );
}
