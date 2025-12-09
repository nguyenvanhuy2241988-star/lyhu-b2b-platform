import { Order } from "./ordersStore";

export type CtvLevel = "Bronze" | "Silver" | "Gold" | "Diamond";

export interface LevelThreshold {
    level: CtvLevel;
    minSales: number;
    minOrders: number;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
    { level: "Diamond", minSales: 30000000, minOrders: 80 },
    { level: "Gold", minSales: 10000000, minOrders: 30 },
    { level: "Silver", minSales: 3000000, minOrders: 10 },
    { level: "Bronze", minSales: 0, minOrders: 0 },
];

export const LEVEL_COLORS: Record<CtvLevel, { bg: string; text: string; border: string }> = {
    Bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
    Silver: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-400" },
    Gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-400" },
    Diamond: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-400" },
};

export interface CtvLevelInfo {
    level: CtvLevel;
    progressText: string;
    nextLevel?: CtvLevel;
    currentSales: number;
    currentDeliveredOrders: number;
    salesProgress: number; // 0-100
    ordersProgress: number; // 0-100
}

export function getCtvLevel(orders: Order[], ctvId: string): CtvLevelInfo {
    // Only count LYHU_SHIP delivered orders
    const eligibleOrders = orders.filter(o =>
        o.source === "CTV" &&
        o.ctvId === ctvId &&
        o.fulfillmentMode === "LYHU_SHIP" &&
        o.status === "delivered"
    );

    const currentSales = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const currentDeliveredOrders = eligibleOrders.length;

    // Determine current level
    let currentLevel: CtvLevel = "Bronze";
    let nextLevel: CtvLevel | undefined;

    for (const threshold of LEVEL_THRESHOLDS) {
        if (currentSales >= threshold.minSales || currentDeliveredOrders >= threshold.minOrders) {
            currentLevel = threshold.level;
            break;
        }
    }

    // Find next level
    const currentThresholdIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === currentLevel);
    if (currentThresholdIndex > 0) {
        nextLevel = LEVEL_THRESHOLDS[currentThresholdIndex - 1].level;
    }

    // Calculate progress
    let progressText = "";
    let salesProgress = 100;
    let ordersProgress = 100;

    if (nextLevel) {
        const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === nextLevel);
        if (nextThreshold) {
            const salesNeeded = nextThreshold.minSales - currentSales;
            const ordersNeeded = nextThreshold.minOrders - currentDeliveredOrders;

            salesProgress = Math.min(100, (currentSales / nextThreshold.minSales) * 100);
            ordersProgress = Math.min(100, (currentDeliveredOrders / nextThreshold.minOrders) * 100);

            if (salesNeeded > 0 && ordersNeeded > 0) {
                progressText = `Còn ${formatVND(salesNeeded)} hoặc ${ordersNeeded} đơn để lên ${nextLevel}`;
            }
        }
    } else {
        progressText = "Bạn đã đạt cấp cao nhất!";
    }

    return {
        level: currentLevel,
        progressText,
        nextLevel,
        currentSales,
        currentDeliveredOrders,
        salesProgress,
        ordersProgress,
    };
}

function formatVND(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}tr`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
}
