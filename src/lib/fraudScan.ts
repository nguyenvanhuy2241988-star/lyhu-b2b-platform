import { Order, saveOrders, loadOrders } from "./ordersStore";
import { loadUsers } from "./usersStore";
import { mockCustomers } from "@/mocks/data"; // Fallback if customersStore not found
import { checkOrderForFraud } from "./antiFraudRules";

export function scanOrdersForFraud(): number {
    const orders = loadOrders();
    const users = loadUsers();
    let flaggedCount = 0;

    const getOrderReceiverInfo = (order: Order) => {
        // Try to get from order, fallback to customer
        // Note: In a real app, we'd use a store function, but direct mock access is fine if store missing
        const customer = mockCustomers.find(c => c.id === order.customerId);
        return {
            phone: order.receiverPhone || customer?.phone || "",
            address: order.receiverAddress || customer?.address || "",
        };
    };

    const recentOrders = orders.map(o => {
        const info = getOrderReceiverInfo(o);
        return {
            ctvId: o.ctvId || "",
            receiverPhone: info.phone,
            createdAt: o.createdAt,
        };
    });

    const updatedOrders = orders.map(order => {
        // Only scan CTV orders that are not yet confirmed fraud/clear
        if (order.source !== "CTV") return order;
        if (order.fraudStatus === "CONFIRMED" || order.fraudStatus === "CLEARED") return order;

        const ctv = users.find(u => u.id === order.ctvId);
        const info = getOrderReceiverInfo(order);

        const fraudCheck = checkOrderForFraud(
            {
                ctvId: order.ctvId || "",
                fulfillmentMode: order.fulfillmentMode,
                receiverPhone: info.phone,
                receiverAddress: info.address,
                createdAt: order.createdAt,
                ctvPhone: ctv?.phone,
            },
            recentOrders,
            ctv?.address
        );

        if (!fraudCheck.passed) {
            flaggedCount++;
            return {
                ...order,
                fraudStatus: "FLAGGED",
                flagged: true,
                flaggedReasons: fraudCheck.reasons,
            } as Order;
        }

        return order;
    });

    if (flaggedCount > 0) {
        saveOrders(updatedOrders);
    }

    return flaggedCount;
}
