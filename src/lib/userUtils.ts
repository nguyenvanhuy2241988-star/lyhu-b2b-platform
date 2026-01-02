import { User, loadUsers } from "./usersStore";
import { ROLES } from "./constants";

// Normalize phone: trim, remove spaces/dots/dashes, convert +84 to 0
export function normalizePhone(phone: string): string {
    if (!phone) return "";
    let normalized = phone.trim().replace(/[\s.\-()]/g, "");
    if (normalized.startsWith("+84")) {
        normalized = "0" + normalized.slice(3);
    } else if (normalized.startsWith("84") && normalized.length > 9) {
        normalized = "0" + normalized.slice(2);
    }
    return normalized;
}

// Check if phone is unique among CTV users (excluding current user)
export function isPhoneUniqueForCtv(phone: string, currentUserId: string, users: User[]): boolean {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return true; // Empty phone is "unique"

    const ctvUsers = users.filter(u => u.role === ROLES.CTV && u.id !== currentUserId);

    return !ctvUsers.some(u => normalizePhone(u.phone || "") === normalizedPhone);
}

// Validate Vietnamese phone number (basic)
export function isValidVietnamesePhone(phone: string): boolean {
    const normalized = normalizePhone(phone);
    if (!normalized) return false;
    // Vietnamese phone: 10 digits, starts with 0
    return /^0\d{9}$/.test(normalized);
}

// Normalize address: trim, fix multiple spaces
export function normalizeAddress(address: string): string {
    if (!address) return "";
    return address.trim().replace(/\s\s+/g, ' ');
}
