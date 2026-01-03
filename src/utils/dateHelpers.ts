import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Parse date string an toàn, tránh crash khi date invalid
 * @param dateVal - Date string, Date object hoặc bất kỳ giá trị nào
 * @returns Date object hợp lệ, fallback về current date nếu invalid
 */
export function parseChatDate(dateVal: any): Date {
    if (!dateVal) return new Date();
    const date = new Date(dateVal);
    return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Format ngày tháng cho Header trong danh sách tin nhắn
 */
export function formatHeaderDate(dateVal: any): string {
    const date = parseChatDate(dateVal);
    if (isToday(date)) return "Hôm nay";
    if (isYesterday(date)) return "Hôm qua";
    return format(date, "dd/MM/yyyy", { locale: vi });
}

/**
 * Format giờ:phút (HH:mm)
 */
export function formatShortTime(dateVal: any): string {
    const date = parseChatDate(dateVal);
    return format(date, 'HH:mm', { locale: vi });
}

/**
 * Kiểm tra xem tin nhắn có thuộc cùng một ngày hay không
 */
export function isSameChatDay(date1: any, date2: any): boolean {
    return isSameDay(parseChatDate(date1), parseChatDate(date2));
}
