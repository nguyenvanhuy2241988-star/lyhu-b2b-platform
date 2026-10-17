/** Daily editorial slots in Vietnam; request_id has a unique database index. */
export function getNewsSlot(now: Date) {
    const local = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const hour = local.getUTCHours();
    const angles: Record<number, string> = {
        7: 'Bản tin thị trường FMCG mới, sự kiện có nguồn và tác động tới điểm bán',
        13: 'Cẩm nang vận hành thực tiễn cho tạp hóa/NPP, có ví dụ và hướng dẫn cụ thể',
        19: 'Phân tích xu hướng bán lẻ, cơ hội, rủi ro và kế hoạch hành động'
    };
    if (!angles[hour]) return null;
    return { requestId: `lyhu-news:${local.toISOString().slice(0, 10)}:${hour}`, angle: angles[hour] };
}

export type NewsSource = { title: string; url: string };

export function getGroundedSources(chunks: { web?: { uri?: string; title?: string } }[]): NewsSource[] {
    const sources = new Map<string, NewsSource>();
    for (const chunk of chunks) {
        try {
            const url = new URL(chunk.web?.uri || '');
            if (url.protocol !== 'https:') continue;
            url.hash = '';
            sources.set(url.href, { title: chunk.web?.title || url.hostname, url: url.href });
        } catch { /* Ignore missing or malformed search citations. */ }
    }
    return [...sources.values()].slice(0, 10);
}

export function newsQualityIssues(content: string, images: string[], sources: NewsSource[]): string[] {
    const issues: string[] = [];
    const words = content.replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').trim().split(/\s+/).filter(Boolean).length;
    if (words < 800) issues.push('Nội dung chưa đủ chiều sâu (tối thiểu 800 từ).');
    if ((content.match(/<h2\b/gi) || []).length < 4) issues.push('Thiếu cấu trúc phân tích ít nhất 4 mục.');
    if (new Set(images.filter(Boolean)).size < 3) issues.push('Thiếu ảnh bìa và 2 ảnh minh họa khác nhau.');
    if (sources.length < 2) issues.push('Chưa có ít nhất 2 nguồn từ kết quả tìm kiếm.');
    if (/\[(?:PEXELS_IMAGE_\d+|TODO|TBD)\]|lyhu-asset:/i.test(content)) issues.push('Còn nội dung hoặc ảnh chưa hoàn thiện.');
    return issues;
}

export function escapeNewsHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
