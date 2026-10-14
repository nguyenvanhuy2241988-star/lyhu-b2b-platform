/**
 * Bổ sung liên hệ từ website / fanpage công khai của cửa hàng.
 * - Chỉ tải HTML công khai, không đăng nhập, không tự động hóa trình duyệt.
 * - Có chặn SSRF (không cho gọi vào IP nội bộ), giới hạn thời gian và dung lượng.
 */
import dns from 'dns';
import net from 'net';
import { extractVnPhones, normalizeVnPhone } from './phone';

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;
const UA = 'Mozilla/5.0 (compatible; LYHU-ProspectFinder/1.0)';

export interface WebContact {
    phone?: string;
    phoneRaw?: string;
    phoneSource?: 'website' | 'facebook';
    zalo?: string;
    email?: string;
    facebook?: string;
    fetched: boolean;
    error?: string;
}

function isPrivateIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        return (
            a === 10 ||
            a === 127 ||
            a === 0 ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 100 && b >= 64 && b <= 127)
        );
    }
    if (net.isIPv6(ip)) {
        const l = ip.toLowerCase();
        return l === '::1' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l.startsWith('::ffff:');
    }
    return true;
}

async function assertPublicUrl(u: URL): Promise<void> {
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Giao thức không hỗ trợ');
    const host = u.hostname;
    if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
        throw new Error('Host nội bộ bị chặn');
    }
    if (net.isIP(host)) {
        if (isPrivateIp(host)) throw new Error('IP nội bộ bị chặn');
        return;
    }
    const addrs = await dns.promises.lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('Địa chỉ nội bộ bị chặn');
}

async function fetchHtml(startUrl: string): Promise<string> {
    let current = new URL(startUrl);
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
        await assertPublicUrl(current);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(current.toString(), {
                headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'vi,en;q=0.8' },
                redirect: 'manual',
                signal: ctrl.signal,
            });
            if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
                current = new URL(res.headers.get('location')!, current);
                continue;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const ct = res.headers.get('content-type') || '';
            if (!/text\/html|application\/xhtml/i.test(ct)) throw new Error('Không phải trang HTML');

            const reader = res.body?.getReader();
            if (!reader) return await res.text();
            const chunks: Uint8Array[] = [];
            let total = 0;
            while (total < MAX_BYTES) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                total += value.length;
            }
            reader.cancel().catch(() => {});
            return Buffer.concat(chunks).toString('utf8');
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error('Quá nhiều chuyển hướng');
}

export function parseContactFromHtml(html: string): Omit<WebContact, 'fetched' | 'error'> {
    const out: Omit<WebContact, 'fetched' | 'error'> = {};

    // 1. tel: links (đáng tin nhất)
    const telRe = /href=["']tel:([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = telRe.exec(html)) !== null) {
        let decoded = m[1];
        try {
            decoded = decodeURIComponent(m[1]);
        } catch {
            /* giữ nguyên */
        }
        const p = normalizeVnPhone(decoded);
        if (p) {
            out.phone = p;
            out.phoneRaw = m[1];
            break;
        }
    }

    // 2. JSON-LD "telephone"
    if (!out.phone) {
        const ldRe = /"telephone"\s*:\s*"([^"]+)"/gi;
        while ((m = ldRe.exec(html)) !== null) {
            const p = normalizeVnPhone(m[1]);
            if (p) {
                out.phone = p;
                out.phoneRaw = m[1];
                break;
            }
        }
    }

    // 3. Số trong văn bản (đã bỏ script/style)
    if (!out.phone) {
        const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ');
        const found = extractVnPhones(text);
        if (found.length) {
            out.phone = found[0];
            out.phoneRaw = found[0];
        }
    }

    const zalo = html.match(/zalo\.me\/([A-Za-z0-9._-]+)/i);
    if (zalo && !/^(share|sharer)$/i.test(zalo[1])) out.zalo = zalo[1];

    const mail = html.match(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i);
    if (mail) out.email = mail[1];

    const fb = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|plugins|tr\?|dialog)[A-Za-z0-9._\-/]+/i);
    if (fb) out.facebook = fb[0];

    return out;
}

export async function enrichFromWeb(opts: { website?: string | null; facebook?: string | null }): Promise<WebContact> {
    const result: WebContact = { fetched: false };
    const targets: { url: string; kind: 'website' | 'facebook' }[] = [];
    if (opts.website) targets.push({ url: opts.website, kind: 'website' });
    if (opts.facebook) targets.push({ url: opts.facebook, kind: 'facebook' });

    const errors: string[] = [];
    for (const t of targets) {
        try {
            const html = await fetchHtml(t.url);
            result.fetched = true;
            const c = parseContactFromHtml(html);
            if (c.phone && !result.phone) {
                result.phone = c.phone;
                result.phoneRaw = c.phoneRaw;
                result.phoneSource = t.kind;
            }
            result.zalo = result.zalo || c.zalo;
            result.email = result.email || c.email;
            if (t.kind === 'website') result.facebook = result.facebook || c.facebook;
            if (result.phone && result.zalo) break;
        } catch (e: any) {
            errors.push(`${t.kind}: ${e?.message || 'lỗi'}`);
        }
    }
    if (!result.fetched && errors.length) result.error = errors.join('; ');
    return result;
}
