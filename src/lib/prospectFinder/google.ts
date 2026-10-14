/**
 * Google Places API (New) - Text Search, chỉ gọi cho cửa hàng đã lọc.
 * Mỗi lần gọi có lấy SĐT/website được tính vào hạn mức theo tháng (xem prospect_try_use_quota).
 */

const URL = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.businessStatus',
].join(',');

export interface GoogleMatch {
    matched: boolean;
    placeId?: string;
    phoneRaw?: string;
    website?: string;
    address?: string;
}

function fold(s: string): string {
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Độ giống tên 0..1 (không dấu): chứa nhau => 1, ngược lại Jaccard theo từ. */
export function nameSimilarity(a: string, b: string): number {
    const fa = fold(a);
    const fb = fold(b);
    if (!fa || !fb) return 0;
    if (fa === fb || fa.includes(fb) || fb.includes(fa)) return 1;
    const ta = new Set(fa.split(' '));
    const tb = new Set(fb.split(' '));
    let inter = 0;
    ta.forEach((t) => {
        if (tb.has(t)) inter++;
    });
    return inter / (ta.size + tb.size - inter);
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const h =
        Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export async function findGooglePlace(opts: {
    apiKey: string;
    name: string;
    lat: number;
    lng: number;
}): Promise<GoogleMatch> {
    const res = await fetch(URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': opts.apiKey,
            'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
            textQuery: opts.name,
            languageCode: 'vi',
            regionCode: 'VN',
            maxResultCount: 3,
            locationBias: {
                circle: { center: { latitude: opts.lat, longitude: opts.lng }, radius: 250 },
            },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Google API ${res.status}: ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const places: any[] = data.places || [];

    let best: { place: any; score: number } | null = null;
    for (const p of places) {
        if (p.businessStatus === 'CLOSED_PERMANENTLY') continue;
        const loc = p.location;
        if (!loc || typeof loc.latitude !== 'number') continue;
        const dist = distanceMeters(opts.lat, opts.lng, loc.latitude, loc.longitude);
        const sim = nameSimilarity(opts.name, p.displayName?.text || '');
        // Phải đủ gần VÀ đủ giống tên để tránh ghép nhầm sang cửa hàng khác
        if (dist > 300 || sim < 0.6) continue;
        const score = sim - dist / 1000;
        if (!best || score > best.score) best = { place: p, score };
    }

    if (!best) return { matched: false };
    const p = best.place;
    return {
        matched: true,
        placeId: p.id,
        phoneRaw: p.nationalPhoneNumber || p.internationalPhoneNumber || undefined,
        website: p.websiteUri || undefined,
        address: p.formattedAddress || undefined,
    };
}
