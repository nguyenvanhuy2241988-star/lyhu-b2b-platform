import { createClient } from "@/lib/supabaseClient";

/**
 * Load the user's custom nav order for a given role.
 * Returns null if no custom order exists (use default).
 */
export async function loadNavOrder(userId: string, role: string): Promise<string[] | null> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("user_nav_order")
            .select("nav_order")
            .eq("user_id", userId)
            .eq("role", role)
            .maybeSingle();
        if (error) throw error;
        return data?.nav_order || null;
    } catch (err) {
        console.error("[NavOrder] Load failed:", err);
        return null;
    }
}

/**
 * Save the user's custom nav order for a given role.
 * Uses upsert to create or update.
 */
export async function saveNavOrder(userId: string, role: string, navOrder: string[]): Promise<boolean> {
    try {
        const supabase = createClient();
        const { error } = await supabase
            .from("user_nav_order")
            .upsert(
                {
                    user_id: userId,
                    role,
                    nav_order: navOrder,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,role" }
            );
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("[NavOrder] Save failed:", err);
        return false;
    }
}

/**
 * Reorder default nav items based on user's saved order.
 * Items not in saved order are appended at the end.
 * Items in saved order but removed from defaults are skipped.
 */
export function applyNavOrder<T extends { href: string }>(
    defaultItems: T[],
    savedOrder: string[] | null
): T[] {
    if (!savedOrder || savedOrder.length === 0) return defaultItems;

    const itemMap = new Map<string, T>();
    defaultItems.forEach(item => itemMap.set(item.href, item));

    // Build ordered list from saved order
    const ordered: T[] = [];
    const usedHrefs = new Set<string>();

    for (const href of savedOrder) {
        const item = itemMap.get(href);
        if (item) {
            ordered.push(item);
            usedHrefs.add(href);
        }
    }

    // Append remaining items not in saved order
    for (const item of defaultItems) {
        if (!usedHrefs.has(item.href)) {
            ordered.push(item);
        }
    }

    return ordered;
}
