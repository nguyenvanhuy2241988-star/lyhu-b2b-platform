// Payout cycle helpers - two cycles per month

export interface PayoutCycle {
    year: number;
    month: number; // 1-12
    cycleKey: string; // e.g. "2025-01-A" or "2025-01-B"
    cycleLetter: "A" | "B";
    startDate: string; // ISO
    endDate: string;   // ISO
    label: string; // e.g. "01-15/01/2025"
}

export function getCycleForDate(date: Date): PayoutCycle {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    const monthStr = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();

    if (day <= 15) {
        // Cycle A: 1-15
        return {
            year,
            month,
            cycleKey: `${year}-${monthStr}-A`,
            cycleLetter: "A",
            startDate: new Date(year, month - 1, 1).toISOString(),
            endDate: new Date(year, month - 1, 15, 23, 59, 59).toISOString(),
            label: `01-15/${monthStr}/${year}`,
        };
    } else {
        // Cycle B: 16-end
        return {
            year,
            month,
            cycleKey: `${year}-${monthStr}-B`,
            cycleLetter: "B",
            startDate: new Date(year, month - 1, 16).toISOString(),
            endDate: new Date(year, month - 1, lastDay, 23, 59, 59).toISOString(),
            label: `16-${lastDay}/${monthStr}/${year}`,
        };
    }
}

export function getCycleLabel(cycleKey: string): string {
    // Parse cycleKey like "2025-01-A"
    const parts = cycleKey.split("-");
    if (parts.length !== 3) return cycleKey;

    const year = parts[0];
    const month = parts[1];
    const letter = parts[2];

    if (letter === "A") {
        return `01-15/${month}/${year}`;
    } else {
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        return `16-${lastDay}/${month}/${year}`;
    }
}

export function getCurrentCycle(): PayoutCycle {
    return getCycleForDate(new Date());
}
