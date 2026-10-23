"use client";

import { useState } from 'react';
import { SocialConversation, SocialMessage } from '@/lib/marketingStore';
import { FbAdInfo, adStatusLabel } from '@/lib/fbAds';
import { shortAdId } from '@/lib/conversationSource';

interface Props {
    conversation: SocialConversation;
    ad?: FbAdInfo | null;
    messages?: SocialMessage[];
    variant: 'banner' | 'card';
}

const fmtTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const CTA_VI: Record<string, string> = {
    MESSAGE_PAGE: 'Gửi tin nhắn', LEARN_MORE: 'Tìm hiểu thêm', SHOP_NOW: 'Mua ngay',
    CONTACT_US: 'Liên hệ', SIGN_UP: 'Đăng ký', WHATSAPP_MESSAGE: 'WhatsApp', CALL_NOW: 'Gọi ngay',
};

/** Chi tiết quảng cáo khách đã bấm vào: dùng ở banner khung chat và sidebar. */
export default function InboxAdDetails({ conversation, ad, messages = [], variant }: Props) {
    const [open, setOpen] = useState(false);
    const firstCustomerMsg = messages.find(m => !m.is_from_page && m.content);
    const status = adStatusLabel(ad);
    const compact = variant === 'card';

    const adsManagerUrl = conversation.ad_id
        ? `https://www.facebook.com/ads/manager/account/campaigns?act=&selected_ad_ids=${conversation.ad_id}`
        : null;
    const title = ad?.ad_name || conversation.ad_title || (conversation.ad_id ? `QC ${shortAdId(conversation)}` : 'Quảng cáo (không rõ mẫu)');

    // Nội dung bài QC: ưu tiên bài viết thật, sau đó tới nội dung creative
    const text = ad?.post_message || ad?.creative_body || null;
    const image = ad?.post_image_url || ad?.thumbnail_url || null;
    const video = ad?.post_video_url || null;
    const hasContent = Boolean(text || image || video);
    const showFull = compact || open;

    return (
        <div className={compact
            ? 'rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-left space-y-2'
            : 'px-4 py-3 bg-blue-50 border-b border-blue-100 text-sm max-h-[45vh] overflow-y-auto'}>

            {/* Dòng đầu: nguồn + thời điểm + trạng thái */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                <span className="text-blue-900 font-semibold">📢 Khách nhắn từ quảng cáo</span>
                {firstCustomerMsg && <span className="text-xs text-slate-500">· {fmtTime(firstCustomerMsg.created_at)}</span>}
                {status && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${status.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {status.text}
                    </span>
                )}
                {!compact && hasContent && (
                    <button onClick={() => setOpen(o => !o)} className="ml-auto text-xs text-blue-600 hover:underline">
                        {open ? 'Thu gọn ▲' : 'Xem nội dung QC ▼'}
                    </button>
                )}
            </div>

            <div className={compact ? 'space-y-2' : 'mt-2 flex gap-3'}>
                {/* Ảnh / video quảng cáo */}
                {(image || video) && (
                    video && showFull ? (
                        <video src={video} poster={image || undefined} controls playsInline
                            className={compact ? 'w-full rounded border border-blue-200' : 'w-64 rounded border border-blue-200 flex-shrink-0'} />
                    ) : image ? (
                        <img src={image} alt="Ảnh quảng cáo" onClick={() => !compact && setOpen(true)}
                            className={compact
                                ? 'w-full rounded object-cover border border-blue-200'
                                : `${showFull ? 'w-64' : 'w-14 h-14 cursor-pointer'} rounded object-cover border border-blue-200 flex-shrink-0`} />
                    ) : null
                )}

                <div className="flex-1 min-w-0 space-y-1">
                    <Row label="Mẫu QC" value={title} strong />
                    {ad?.campaign_name && <Row label="Chiến dịch" value={ad.campaign_name} />}
                    {ad?.adset_name && <Row label="Nhóm QC" value={ad.adset_name} />}
                    {firstCustomerMsg && <Row label="Khách bấm" value={`“${firstCustomerMsg.content.slice(0, 80)}”`} />}

                    {/* Nội dung bài quảng cáo */}
                    {showFull && hasContent && (
                        <div className="mt-2 rounded-md bg-white border border-blue-100 p-2.5 space-y-1.5">
                            {ad?.creative_title && <p className="text-sm font-semibold text-slate-800">{ad.creative_title}</p>}
                            {text && <AdText text={text} clampLines={compact ? 6 : 0} />}
                            {ad?.call_to_action && (
                                <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border">
                                    Nút: {CTA_VI[ad.call_to_action] || ad.call_to_action}
                                </span>
                            )}
                        </div>
                    )}

                    {!conversation.ad_id && (
                        <p className="text-xs text-amber-700">Không có mã quảng cáo, nên không biết khách đến từ mẫu QC nào.</p>
                    )}
                    {conversation.ad_id && !hasContent && ad?.fetch_error && (
                        <p className="text-xs text-amber-700">Chưa lấy được nội dung QC: {ad.fetch_error}</p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        {ad?.post_url && (
                            <a href={ad.post_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200">
                                Mở bài QC trên Facebook ↗
                            </a>
                        )}
                        {adsManagerUrl && (
                            <a href={adsManagerUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200 font-mono"
                                title={`Ad ID: ${conversation.ad_id}`}>
                                Ads Manager {shortAdId(conversation)} ↗
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdText({ text, clampLines }: { text: string; clampLines: number }) {
    const [more, setMore] = useState(false);
    const long = clampLines > 0 && text.split('\n').length + text.length / 60 > clampLines;
    return (
        <div>
            <p className={`text-xs text-slate-700 whitespace-pre-line ${long && !more ? 'line-clamp-6' : ''}`}>{text}</p>
            {long && (
                <button onClick={() => setMore(m => !m)} className="text-[11px] text-blue-600 hover:underline mt-0.5">
                    {more ? 'Thu gọn' : 'Xem thêm'}
                </button>
            )}
        </div>
    );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex gap-2 text-xs min-w-0">
            <span className="text-slate-500 w-20 flex-shrink-0">{label}:</span>
            <span className={`truncate ${strong ? 'font-semibold text-blue-900' : 'text-slate-700'}`} title={value}>{value}</span>
        </div>
    );
}
