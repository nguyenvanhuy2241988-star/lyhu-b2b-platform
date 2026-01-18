"use client";

import OrderList from "@/components/orders/OrderList";

export default function AccountantOrdersPage() {
    return <OrderList readOnly={false} maskSensitiveData={false} hideRevenue={false} />;
}
