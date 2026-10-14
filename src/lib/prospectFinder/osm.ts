/**
 * OpenStreetMap (Overpass API): lập danh sách cửa hàng theo khu vực.
 * Miễn phí, giấy phép ODbL (cần ghi nguồn "© OpenStreetMap contributors").
 */
import { pickBestPhone } from './phone';

export interface CategoryPreset {
    label: string;
    filters: string[]; // bộ lọc Overpass, vd ["shop"="convenience"]
}

export const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
    tap_hoa: {
        label: 'Tạp hóa / cửa hàng tiện lợi',
        filters: ['["shop"="convenience"]', '["shop"="general"]', '["shop"="variety_store"]'],
    },
    sieu_thi_mini: { label: 'Siêu thị / mini mart', filters: ['["shop"="supermarket"]'] },
    dai_ly: { label: 'Đại lý / bán sỉ', filters: ['["shop"="wholesale"]'] },
    quan_an: { label: 'Quán ăn / đồ ăn nhanh', filters: ['["amenity"="restaurant"]', '["amenity"="fast_food"]'] },
    tra_sua_cafe: { label: 'Cà phê / trà sữa', filters: ['["amenity"="cafe"]'] },
    tiem_banh: { label: 'Tiệm bánh', filters: ['["shop"="bakery"]', '["shop"="pastry"]'] },
};

export interface OsmProspect {
    osm_type: string;
    osm_id: number;
    name: string;
    category: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    phone_raw: string | null;
    website: string | null;
    facebook_url: string | null;
    email: string | null;
}

const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
];

const NAME_PREFIXES = ['Thành phố', 'Thị xã', 'Thị trấn', 'Quận', 'Huyện', 'Tỉnh', 'Phường', 'Xã', 'TP.', 'TP'];

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&');
}

/** Bỏ tiền tố hành chính ở đầu, giữ lại phần tên. */
export function stripAdminPrefix(input: string): string {
    let s = input.trim().replace(/\s+/g, ' ');
    for (const p of NAME_PREFIXES) {
        const re = new RegExp('^' + escapeRegex(p) + '\\s+', 'i');
        if (re.test(s)) {
            s = s.replace(re, '');
            break;
        }
    }
    return s;
}

/** Regex Overpass khớp tên có/không có tiền tố hành chính. */
function nameRegex(input: string): string {
    const core = escapeRegex(stripAdminPrefix(input));
    return `^(Thành phố |Thị xã |Thị trấn |Quận |Huyện |Tỉnh |Phường |Xã )?${core}$`;
}

export function buildOverpassQuery(opts: {
    province: string;
    district?: string;
    categories: string[];
    limit: number;
}): string {
    const filters = opts.categories.flatMap((c) => CATEGORY_PRESETS[c]?.filters ?? []);
    if (filters.length === 0) throw new Error('Chưa chọn nhóm cửa hàng hợp lệ');

    const lines: string[] = ['[out:json][timeout:50];'];
    lines.push(
        `rel["boundary"="administrative"]["admin_level"="4"]["name"~"${nameRegex(opts.province)}",i];`
    );
    if (opts.district && opts.district.trim()) {
        lines.push('map_to_area->.p;');
        lines.push(
            `rel["boundary"="administrative"]["admin_level"~"^[5-9]$"]["name"~"${nameRegex(opts.district)}",i](area.p);`
        );
    }
    lines.push('map_to_area->.a;');
    lines.push('(');
    for (const f of filters) lines.push(`  nwr${f}["name"](area.a);`);
    lines.push(');');
    lines.push(`out center tags ${Math.max(1, Math.floor(opts.limit))};`);
    return lines.join('\n');
}

export function categoryOfTags(tags: Record<string, string>): string {
    const shop = tags.shop;
    const amenity = tags.amenity;
    if (shop === 'convenience' || shop === 'general' || shop === 'variety_store') return 'tap_hoa';
    if (shop === 'supermarket') return 'sieu_thi_mini';
    if (shop === 'wholesale') return 'dai_ly';
    if (amenity === 'restaurant' || amenity === 'fast_food') return 'quan_an';
    if (amenity === 'cafe') return 'tra_sua_cafe';
    if (shop === 'bakery' || shop === 'pastry') return 'tiem_banh';
    return 'khac';
}

function buildAddress(t: Record<string, string>): string | null {
    if (t['addr:full']) return t['addr:full'];
    const parts = [
        [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
        t['addr:suburb'] || t['addr:subdistrict'],
        t['addr:district'],
        t['addr:city'] || t['addr:province'],
    ].filter((x) => x && String(x).trim());
    return parts.length ? parts.join(', ') : null;
}

const FB_RE = /facebook\.com|fb\.com|fb\.me/i;

export function parseOverpassElements(elements: any[]): OsmProspect[] {
    const out: OsmProspect[] = [];
    for (const el of elements || []) {
        const tags: Record<string, string> = el.tags || {};
        const name = (tags.name || '').trim();
        if (!name) continue;

        const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat ?? null;
        const lng = typeof el.lon === 'number' ? el.lon : el.center?.lon ?? null;

        const rawPhone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile || null;
        const best = pickBestPhone(rawPhone);

        const rawSite = tags.website || tags['contact:website'] || tags.url || null;
        const rawFb = tags['contact:facebook'] || tags.facebook || null;
        let website: string | null = null;
        let facebook: string | null = null;
        for (const u of [rawSite, rawFb]) {
            if (!u) continue;
            const url = /^https?:\/\//i.test(u) ? u : `https://${u}`;
            if (FB_RE.test(url)) facebook = facebook || url;
            else website = website || url;
        }

        out.push({
            osm_type: String(el.type),
            osm_id: Number(el.id),
            name,
            category: categoryOfTags(tags),
            address: buildAddress(tags),
            lat,
            lng,
            phone: best?.phone ?? null,
            phone_raw: best?.raw ?? (rawPhone ? String(rawPhone) : null),
            website,
            facebook_url: facebook,
            email: tags.email || tags['contact:email'] || null,
        });
    }
    return out;
}

export async function fetchOsmProspects(opts: {
    province: string;
    district?: string;
    categories: string[];
    limit: number;
}): Promise<OsmProspect[]> {
    const query = buildOverpassQuery(opts);
    let lastErr = 'Không gọi được Overpass API';

    for (const endpoint of ENDPOINTS) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 55_000);
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'LYHU-ProspectFinder/1.0',
                },
                body: 'data=' + encodeURIComponent(query),
                signal: ctrl.signal,
            });
            if (res.status === 429 || res.status >= 500) {
                lastErr = `Overpass trả về ${res.status}`;
                continue;
            }
            if (!res.ok) throw new Error(`Overpass lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`);
            const json = await res.json();
            return parseOverpassElements(json.elements || []);
        } catch (e: any) {
            lastErr = e?.name === 'AbortError' ? 'Overpass quá thời gian chờ' : e?.message || lastErr;
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error(lastErr);
}
