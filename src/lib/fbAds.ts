/** Thông tin quảng cáo Meta hiển thị trong Inbox (an toàn dùng ở client). */
export interface FbAdInfo {
    ad_id: string;
    ad_name: string | null;
    status: string | null;
    effective_status: string | null;
    adset_id: string | null;
    adset_name: string | null;
    campaign_id: string | null;
    campaign_name: string | null;
    creative_title: string | null;
    creative_body: string | null;
    thumbnail_url: string | null;
    post_id: string | null;
    post_url: string | null;
    fetch_error: string | null;
    fetched_at: string;
}

/** Tên ngắn để hiện ở danh sách hội thoại. */
export function adShortLabel(ad?: FbAdInfo | null, fallbackTitle?: string | null): string | null {
    const name = ad?.ad_name || ad?.campaign_name || fallbackTitle || null;
    if (!name) return null;
    return name.replace(/^Quảng cáo\s*/i, '').trim() || name;
}

const STATUS_VI: Record<string, string> = {
    ACTIVE: 'Đang chạy', PAUSED: 'Tạm dừng', CAMPAIGN_PAUSED: 'Chiến dịch tạm dừng',
    ADSET_PAUSED: 'Nhóm QC tạm dừng', ARCHIVED: 'Đã lưu trữ', DELETED: 'Đã xoá',
    DISAPPROVED: 'Bị từ chối', PENDING_REVIEW: 'Đang duyệt', WITH_ISSUES: 'Có lỗi',
};
export function adStatusLabel(ad?: FbAdInfo | null): { text: string; active: boolean } | null {
    const s = ad?.effective_status || ad?.status;
    if (!s) return null;
    return { text: STATUS_VI[s] || s, active: s === 'ACTIVE' };
}
