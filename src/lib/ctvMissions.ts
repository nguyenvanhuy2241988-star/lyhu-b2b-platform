import { Order } from "./ordersStore";
import { User, getChildCtvs } from "./usersStore";
import { isValidActivationOrder } from "./antiFraudRules";

export interface Mission {
    id: string;
    title: string;
    target: number;
    current: number;
    completed: boolean;
    unit: string;
    rewardText?: string;
}

export interface MonthlyMissionsSummary {
    month: number;
    year: number;
    missions: Mission[];
    completedCount: number;
    totalCount: number;
}

export function getCtvMonthlyMissionsSummary(
    ctvId: string,
    month: number, // 1-12
    year: number,
    orders: Order[],
    users: User[]
): MonthlyMissionsSummary {
    // Filter orders for this month
    const monthlyOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return (
            o.source === "CTV" &&
            o.ctvId === ctvId &&
            d.getMonth() === month - 1 &&
            d.getFullYear() === year
        );
    });

    // Mission 1: 10 delivered LYHU_SHIP orders
    const deliveredLyhuShipOrders = monthlyOrders.filter(
        o => o.fulfillmentMode === "LYHU_SHIP" && o.status === "delivered"
    ).length;

    // Mission 2: 3,000,000 VND in LYHU_SHIP sales
    const lyhuShipSales = monthlyOrders
        .filter(o => o.fulfillmentMode === "LYHU_SHIP" && o.status === "delivered")
        .reduce((sum, o) => sum + o.totalAmount, 0);

    // Mission 3: Recruit 2 activated child CTVs
    // Find children activated this month
    const ctv = users.find(u => u.id === ctvId);
    const referralCode = ctv?.referralCode;
    let activatedChildrenThisMonth = 0;

    if (referralCode) {
        const children = getChildCtvs(referralCode);
        children.forEach(child => {
            // Check if child was activated this month
            const childOrders = orders.filter(o =>
                o.source === "CTV" &&
                o.ctvId === child.id
            );

            const firstActivationOrder = childOrders
                .filter(o => isValidActivationOrder(o))
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

            if (firstActivationOrder) {
                const activationDate = new Date(firstActivationOrder.createdAt);
                if (activationDate.getMonth() === month - 1 && activationDate.getFullYear() === year) {
                    activatedChildrenThisMonth++;
                }
            }
        });
    }

    const missions: Mission[] = [
        {
            id: "lyhu_ship_orders",
            title: "10 đơn LYHU giao đã hoàn thành",
            target: 10,
            current: deliveredLyhuShipOrders,
            completed: deliveredLyhuShipOrders >= 10,
            unit: "đơn",
            rewardText: "+50,000đ thưởng",
        },
        {
            id: "lyhu_ship_sales",
            title: "Doanh số LYHU giao đạt 3.000.000đ",
            target: 3000000,
            current: lyhuShipSales,
            completed: lyhuShipSales >= 3000000,
            unit: "VND",
            rewardText: "+100,000đ thưởng",
        },
        {
            id: "recruit_ctv",
            title: "Tuyển 2 CTV con đã kích hoạt",
            target: 2,
            current: activatedChildrenThisMonth,
            completed: activatedChildrenThisMonth >= 2,
            unit: "CTV",
            rewardText: "+150,000đ thưởng",
        },
    ];

    const completedCount = missions.filter(m => m.completed).length;

    return {
        month,
        year,
        missions,
        completedCount,
        totalCount: missions.length,
    };
}

export function formatMissionProgress(mission: Mission): string {
    if (mission.unit === "VND") {
        const current = mission.current >= 1000000
            ? `${(mission.current / 1000000).toFixed(1)}tr`
            : `${(mission.current / 1000).toFixed(0)}k`;
        const target = mission.target >= 1000000
            ? `${(mission.target / 1000000).toFixed(0)}tr`
            : `${(mission.target / 1000).toFixed(0)}k`;
        return `${current} / ${target}`;
    }
    return `${mission.current} / ${mission.target} ${mission.unit}`;
}

export function getMissionProgressPercent(mission: Mission): number {
    return Math.min(100, (mission.current / mission.target) * 100);
}
