/**
 * Chuẩn hóa / trích xuất số điện thoại Việt Nam.
 * Kết quả luôn ở dạng nội địa 0xxxxxxxxx (di động 10 số, bàn 11 số).
 */

const MOBILE_RE = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
const LANDLINE_RE = /^02\d{9}$/;

export function normalizeVnPhone(raw?: string | null): string | null {
    if (!raw) return null;
    let s = String(raw).replace(/\(0\)/g, ''); // "+84 (0) 912..." -> "+84 912..."
    let digits = s.replace(/[^0-9]/g, '');
    if (digits.startsWith('84') && (digits.length === 11 || digits.length === 12)) {
        digits = '0' + digits.slice(2);
    }
    if (MOBILE_RE.test(digits) || LANDLINE_RE.test(digits)) return digits;
    return null;
}

export function isMobilePhone(phone: string | null | undefined): boolean {
    return !!phone && MOBILE_RE.test(phone);
}

/** Tách chuỗi nhiều số (phân tách bằng ; , / hoặc "-" có khoảng trắng) và trả về số hợp lệ đầu tiên, ưu tiên di động. */
export function pickBestPhone(raw?: string | null): { phone: string; raw: string } | null {
    if (!raw) return null;
    const parts = String(raw).split(/[;,\/|]|\s-\s|\sor\s|\shoặc\s/i);
    const valid = parts
        .map((p) => ({ raw: p.trim(), phone: normalizeVnPhone(p) }))
        .filter((x): x is { raw: string; phone: string } => !!x.phone);
    if (valid.length === 0) {
        // Có thể số bị dính liền nhau trong một chuỗi: thử trích xuất bằng regex
        const found = extractVnPhones(String(raw));
        return found.length ? { phone: found[0], raw: String(raw).trim() } : null;
    }
    return valid.find((v) => isMobilePhone(v.phone)) || valid[0];
}

/** Trích xuất mọi số điện thoại VN hợp lệ từ một đoạn văn bản (loại trùng, giữ thứ tự xuất hiện). */
export function extractVnPhones(text: string): string[] {
    if (!text) return [];
    const re = /(?:\+?84|0)[\s.\-()]*\d(?:[\s.\-()]*\d){8,9}/g;
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        const p = normalizeVnPhone(m[0]);
        if (p && !out.includes(p)) out.push(p);
    }
    return out;
}
