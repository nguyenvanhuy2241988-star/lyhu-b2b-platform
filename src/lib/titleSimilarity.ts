/**
 * Tiện ích chuẩn hóa và tính toán độ tương đồng tiêu đề bài viết (Title Similarity)
 * Ngăn chặn trùng lặp nội dung, tránh bị Google phạt Keyword Cannibalization.
 */

const STOP_WORDS = new Set([
    'va', 'cho', 'cac', 'cua', 'tai', 'nhung', 'trong', 'la', 've', 
    'nam', '2026', 'lai', 'moi', 'nhieu', 'nhat',
    'de', 'duoc', 'ra', 'sao', 'co', 'nay', 'voi', 'theo', 'den',
    'huong', 'dan', 'top', 'bi', 'quyet', 'cach'
]);

export function normalizeTitleText(str: string): string {
    return (str || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function getTitleWordSet(title: string): Set<string> {
    const words = normalizeTitleText(title)
        .split(' ')
        .filter(w => w.length > 1 && !STOP_WORDS.has(w));
    return new Set(words);
}

/**
 * Tính toán độ tương đồng từ ngữ (Jaccard Similarity) giữa 2 tiêu đề (0.0 -> 1.0)
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
    const setA = getTitleWordSet(titleA);
    const setB = getTitleWordSet(titleB);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersectionCount = 0;
    setA.forEach(item => {
        if (setB.has(item)) {
            intersectionCount++;
        }
    });

    const unionCount = setA.size + setB.size - intersectionCount;
    if (unionCount <= 0) return 0;

    return intersectionCount / unionCount;
}

/**
 * So khớp một tiêu đề ứng viên với toàn bộ danh sách tiêu đề đã có trong CSDL.
 * Trả về độ tương đồng lớn nhất và tiêu đề bị trùng lặp cao nhất.
 */
export function findMaxTitleSimilarity(candidate: string, existingTitles: string[]): { maxSim: number; matchedTitle: string | null } {
    const candidateWords = getTitleWordSet(candidate);
    if (candidateWords.size === 0) return { maxSim: 0, matchedTitle: null };

    let maxSim = 0;
    let matchedTitle: string | null = null;

    for (let i = 0; i < existingTitles.length; i++) {
        const title = existingTitles[i];
        if (!title) continue;
        const existingWords = getTitleWordSet(title);
        if (existingWords.size === 0) continue;

        let intersectionCount = 0;
        candidateWords.forEach(w => {
            if (existingWords.has(w)) {
                intersectionCount++;
            }
        });

        const unionCount = candidateWords.size + existingWords.size - intersectionCount;
        const sim = unionCount > 0 ? intersectionCount / unionCount : 0;

        if (sim > maxSim) {
            maxSim = sim;
            matchedTitle = title;
        }
    }

    return { maxSim, matchedTitle };
}

/**
 * Tự động loại bỏ số năm (2026, năm 2026, trong năm 2026...) bị nhồi nhét máy móc ở tiêu đề
 * Giúp tiêu đề tự nhiên, chuẩn mực văn phong báo chí kinh tế, tránh cảm giác rập khuôn bot AI.
 */
export function stripYearFromTitle(title: string): string {
    if (!title) return title;

    let res = title;

    // 1. Bỏ năm đứng trước dấu hai chấm / gạch ngang / phẩy: "Nhân sự bán lẻ 2026: ..." -> "Nhân sự bán lẻ: ..."
    res = res.replace(/(?:trong\s+)?năm\s+20\d{2}\s*([:,\-–])/gi, '$1');
    res = res.replace(/\b20\d{2}\s*([:,\-–])/gi, '$1');

    // 2. Bỏ năm ở cuối câu: "...năm 2026?" -> "...?" / "...cho tiệm tạp hóa 2026" -> "...cho tiệm tạp hóa"
    res = res.replace(/(?:\s+(?:trong|vào|cho)?\s*năm)?\s+20\d{2}(\s*[?!.]*)$/gi, '$1');

    // 3. Bỏ cụm "trong năm 2026" / "năm 2026" / "2026" đứng riêng lẻ
    res = res.replace(/\s+(?:trong|vào)\s+năm\s+20\d{2}\b/gi, '');
    res = res.replace(/\s+năm\s+20\d{2}\b/gi, '');
    res = res.replace(/\s+20\d{2}\b/gi, '');

    // 4. Chuẩn hóa khoảng trắng và dấu câu
    res = res.replace(/\s{2,}/g, ' ')
             .replace(/\s+([:,\?!.])/g, '$1')
             .trim();

    return res;
}

