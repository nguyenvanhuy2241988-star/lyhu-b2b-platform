/**
 * Level 3: Smart Scheduler Engine
 * "The Brain" that decides WHEN to act.
 * Logic:
 *  - High Activity Windows (Golden Hours): 7-9, 11-13, 20-22
 *  - Low Activity Windows: Other times
 *  - Sleep Windows: 0-6 (Midnight)
 *  - Jitter: Never run at exact times. +/- 15 mins variance.
 */

// Vanilla JS implementation (No external dependencies)

// Configuration
const GOLDEN_HOURS = [
    { start: 7, end: 9, label: 'Morning Coffee' },
    { start: 11, end: 13, label: 'Lunch Break' },
    { start: 19, end: 22, label: 'Prime Time' }
];

const SLEEP_HOURS = { start: 0, end: 6 };

/**
 * Returns the current comprehensive status
 */
function getSchedulerStatus(date = new Date()) {
    const hour = date.getHours();

    // Check Sleep
    if (hour >= SLEEP_HOURS.start && hour < SLEEP_HOURS.end) {
        return { status: 'SLEEP', label: 'Bot is sleeping' };
    }

    // Check Golden
    const golden = GOLDEN_HOURS.find(g => hour >= g.start && hour < g.end);
    if (golden) {
        return { status: 'GOLDEN', label: golden.label };
    }

    return { status: 'NORMAL', label: 'Regular Hours' };
}

/**
 * Calculates the next recommended action time.
 * If currently in Golden Hour: Returns NOW (with small delay).
 * If currently Sleep: Returns start of next Morning Golden Hour.
 * If currently Normal: Returns start of next Golden Hour or Random short interval.
 */
function getNextActionTime() {
    const now = new Date();
    const status = getSchedulerStatus(now);

    // Chaos Math: Random delay between 2-15 minutes
    const randomDelayMinutes = Math.floor(Math.random() * 13) + 2;

    if (status.status === 'GOLDEN') {
        // We are in prime time. Action should happen soon.
        // Add minimal variance (e.g. 1-5 mins) to mimic human hesitation.
        const next = new Date(now.getTime() + (Math.random() * 5 * 60000));
        return {
            waitMs: next.getTime() - now.getTime(),
            scheduledTime: next,
            reason: `Active inside ${status.label}`
        };
    }

    if (status.status === 'SLEEP') {
        // Wait until 7:00 AM + random variance
        const next = new Date(now);
        next.setHours(7, 0, 0, 0);
        // If it's already past midnight but before 6, it's today 7am.
        // But if it's 23:00, it's tomorrow 7am. Logic handles naturally if we reset hours?
        // Let's be safer:
        if (now.getHours() > 12) {
            next.setDate(next.getDate() + 1);
        }

        // Add variance to waking up: 7:00 - 7:30
        const variance = Math.floor(Math.random() * 30);
        next.setMinutes(next.getMinutes() + variance);

        return {
            waitMs: next.getTime() - now.getTime(),
            scheduledTime: next,
            reason: 'Sleeping until Morning'
        };
    }

    // Normal time -> Maybe waits for next Golden Hour?
    // Let's find next golden hour
    let nextGolden = null;
    // Simple sort check
    for (const g of GOLDEN_HOURS) {
        if (g.start > now.getHours()) {
            nextGolden = g;
            break;
        }
    }

    if (nextGolden) {
        const next = new Date(now);
        next.setHours(nextGolden.start, 0, 0, 0);
        // Add +/- 15 mins entrance variance
        const variance = Math.floor(Math.random() * 30) - 15;
        next.setMinutes(next.getMinutes() + variance);

        return {
            waitMs: next.getTime() - now.getTime(),
            scheduledTime: next,
            reason: `Waiting for ${nextGolden.label}`
        };
    } else {
        // No more golden hours today (e.g. it's 23:00) -> Wait for tomorrow morning
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(7, 0, 0, 0);
        const variance = Math.floor(Math.random() * 30);
        next.setMinutes(next.getMinutes() + variance);

        return {
            waitMs: next.getTime() - now.getTime(),
            scheduledTime: next,
            reason: 'Finished for today, waiting for tomorrow'
        };
    }
}

// CLI Test Interface
if (require.main === module) {
    console.log('[Scheduler Engine] Running Diagnostic...');
    const now = new Date();
    console.log(`Current Time: ${now.toLocaleTimeString()}`);

    const status = getSchedulerStatus();
    console.log(`Current Status: [${status.status}] - ${status.label}`);

    const plan = getNextActionTime();
    console.log('--- ACTION PLAN ---');
    console.log(`Reason: ${plan.reason}`);
    console.log(`Scheduled At: ${plan.scheduledTime.toLocaleTimeString()}`);
    console.log(`Wait Duration: ${(plan.waitMs / 60000).toFixed(1)} minutes`);
}

module.exports = { getSchedulerStatus, getNextActionTime };
