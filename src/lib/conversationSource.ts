/**
 * Nguồn khách hàng Inbox — MỘT nơi duy nhất quyết định "Quảng cáo" hay "Tự nhiên".
 * Dùng chung cho danh sách hội thoại, banner khung chat và sidebar.
 *
 * Quảng cáo: có ad_id HOẶC source_type === 'ads' HOẶC referral_source === 'ADS'.
 * Tự nhiên : tất cả trường hợp còn lại.
 */
type SourceFields = {
    ad_id?: string | null;
    ad_title?: string | null;
    source_type?: string | null;
    referral_source?: string | null;
};

export function isAdConversation(conv: SourceFields | null | undefined): boolean {
    if (!conv) return false;
    return Boolean(conv.ad_id) || conv.source_type === 'ads' || conv.referral_source === 'ADS';
}

/** Mã QC rút gọn (6 số cuối) để hiển thị, hoặc '' nếu không có ad_id. */
export function shortAdId(conv: SourceFields | null | undefined): string {
    return conv?.ad_id ? `#${String(conv.ad_id).slice(-6)}` : '';
}

/** Các trường cần ghi khi người dùng đổi nguồn thủ công. */
export function manualSourceUpdate(toAds: boolean) {
    return toAds
        ? { source_type: 'ads', referral_source: 'ADS' }
        // Về Tự nhiên phải xoá cả ad_id, nếu không ad_id vẫn khiến hội thoại hiển thị là Quảng cáo
        : { source_type: 'organic', referral_source: null, ad_id: null, ad_title: null };
}
