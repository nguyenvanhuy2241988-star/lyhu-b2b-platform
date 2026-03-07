/**
 * Gemini AI Service for Messenger Auto-Reply
 * Uses Gemini 2.0 Flash (Free Tier: 15 req/min)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Common Vietnamese male/female name patterns
const FEMALE_NAMES = [
    'anh', 'ánh', 'ái', 'an', 'bích', 'chi', 'châu', 'cúc', 'diễm', 'diệu', 'dung', 'duyên',
    'đào', 'giang', 'hà', 'hạnh', 'hằng', 'hiền', 'hoa', 'hoài', 'hồng', 'huệ', 'hương',
    'huyền', 'khánh', 'khanh', 'kiều', 'lan', 'lệ', 'liên', 'linh', 'loan', 'ly', 'mai',
    'my', 'mỹ', 'nga', 'ngân', 'ngọc', 'nguyệt', 'nhi', 'nhung', 'nương', 'oanh',
    'phương', 'phượng', 'quỳnh', 'sang', 'sen', 'sương', 'thảo', 'thanh', 'thắm', 'thi',
    'thúy', 'thủy', 'trang', 'trinh', 'trâm', 'tuyết', 'uyên', 'vân', 'vi', 'vy',
    'xuyến', 'yến', 'yên', 'nhàn', 'hảo', 'thuỳ', 'thùy', 'trúc', 'xuân', 'thu',
    'hương', 'hạ', 'đông', 'cẩm', 'bảo', 'nguyên', 'như', 'quế', 'thư', 'uyển'
];

const MALE_NAMES = [
    'bình', 'cường', 'dũng', 'đại', 'đức', 'đạt', 'hải', 'hiếu', 'hoàng', 'hùng',
    'hưng', 'huy', 'khải', 'khang', 'khoa', 'kiên', 'lâm', 'lộc', 'long', 'mạnh',
    'minh', 'nam', 'nghĩa', 'phong', 'phúc', 'quang', 'quân', 'sơn', 'tài', 'thắng',
    'thiện', 'thuận', 'tiến', 'toàn', 'trí', 'trọng', 'trung', 'tú', 'tuấn', 'tùng',
    'vinh', 'vũ', 'vương', 'phát', 'bảo', 'nhật', 'thành', 'duy', 'khánh', 'hào',
    'kiệt', 'luân', 'nguyên', 'tân', 'triệu', 'trường', 'việt', 'hiệp', 'đăng'
];

/**
 * Detect gender from Vietnamese name
 * Returns 'Anh' (male) or 'Chị' (female) or 'Anh/Chị' (unknown)
 */
export function detectGender(fullName: string): string {
    if (!fullName || fullName === 'Facebook User') return 'Anh/Chị';

    // Vietnamese name: last word is usually the given name
    const parts = fullName.trim().toLowerCase().split(/\s+/);
    const givenName = parts[parts.length - 1];

    // Remove diacritics for matching
    const normalized = givenName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const givenNameLower = givenName.toLowerCase();

    // Check female names first (more distinctive)
    if (FEMALE_NAMES.some(n => givenNameLower === n || normalized === n.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        return 'Chị';
    }

    // Check male names
    if (MALE_NAMES.some(n => givenNameLower === n || normalized === n.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        return 'Anh';
    }

    return 'Anh/Chị';
}

/**
 * Extract a displayable short name from customer name.
 * For Vietnamese personal names, use the given name (last word).
 * For business/unrecognizable names, use the full name.
 */
function getDisplayName(customerName: string): string {
    if (!customerName || customerName === 'Facebook User') return '';

    const parts = customerName.trim().split(/\s+/);
    const lastWord = (parts[parts.length - 1] || '').toLowerCase();
    const normalized = lastWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Check if last word is a recognized Vietnamese name
    const isVietnameseName =
        FEMALE_NAMES.some(n => lastWord === n || normalized === n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ||
        MALE_NAMES.some(n => lastWord === n || normalized === n.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

    if (isVietnameseName) {
        return parts[parts.length - 1]; // Use given name: "Nguyễn Văn Huy" → "Huy"
    }

    // For business names or unrecognizable names, use full name if short, or skip
    return customerName.length <= 20 ? customerName : '';
}

/**
 * Check if message contains a Vietnamese phone number
 */
export function extractPhoneNumber(text: string): string | null {
    if (!text) return null;
    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/g;
    const match = text.match(phoneRegex);
    return match ? match[0] : null;
}

/**
 * Generate greeting messages (sent sequentially with delays)
 */
export function generateGreetingMessages(customerName: string, honorific: string): string[] {
    const displayName = getDisplayName(customerName);
    const greeting = displayName
        ? `Dạ, Em chào ${honorific} ${displayName} ạ 😊`
        : `Dạ, Em chào ${honorific} ạ 😊`;
    return [
        greeting,
        `${honorific} đang quan tâm tới sản phẩm bên em ạ?`,
        `${honorific} cho em xin số điện thoại em báo kinh doanh liên hệ mình ạ`
    ];
}

/**
 * Generate phone received messages
 */
export function generatePhoneReceivedMessages(honorific: string): string[] {
    return [
        `Dạ, Vâng ạ`,
        `Bộ phận kinh doanh bên em sẽ liên hệ ${honorific} trong thời gian sớm nhất`,
        `Em cảm ơn ${honorific} nhiều ạ 🙏`
    ];
}

/**
 * Generate follow-up messages (sent 1-2 days later)
 */
export function generateFollowUpMessages(customerName: string, honorific: string): string[] {
    const displayName = getDisplayName(customerName);
    const callout = displayName ? `${honorific} ${displayName} ơi` : `${honorific} ơi`;
    return [
        `Dạ, ${callout}`,
        `${honorific} có muốn để lại số điện thoại để bên em tư vấn thêm không ạ? 😊`
    ];
}

/**
 * Call Gemini AI for custom responses (when conversation goes off-script)
 * Used as fallback when messages don't match greeting/phone patterns
 */
export async function callGeminiAI(
    customerMessage: string,
    customerName: string,
    honorific: string,
    chatHistory: { role: string; content: string }[],
    hasPhone: boolean = false
): Promise<string> {
    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not configured');
        return '';
    }

    // Different prompts based on whether we already have the customer's phone
    const systemPrompt = hasPhone
        ? `Bạn là nhân viên chăm sóc khách hàng của LYHU - công ty phân phối thực phẩm (bánh tráng, khoai môn, snack, đồ ăn vặt).

Quy tắc:
- Xưng hô: gọi khách là "${honorific}", xưng "em"
- Khách ĐÃ GỬI SỐ ĐIỆN THOẠI rồi → KHÔNG xin SĐT nữa
- Trả lời NGẮN GỌN câu hỏi của khách (1-2 câu)
- Luôn kết thúc bằng: nhân viên kinh doanh sẽ liên hệ ${honorific} để tư vấn chi tiết hơn ạ
- KHÔNG trả lời về giá cả chi tiết, nói "bộ phận kinh doanh sẽ báo giá cụ thể khi liên hệ ${honorific} ạ"
- Thân thiện, đúng kiểu nhân viên Việt Nam
- Dùng emoji vừa phải (1-2 emoji)

Tên khách: ${customerName}`
        : `Bạn là nhân viên chăm sóc khách hàng của LYHU - công ty phân phối thực phẩm (bánh tráng, khoai môn, snack, đồ ăn vặt).

Quy tắc:
- Xưng hô: gọi khách là "${honorific}", xưng "em"
- Mục tiêu chính: XIN SỐ ĐIỆN THOẠI khách để sale liên hệ
- Trả lời NGẮN GỌN, thân thiện, đúng kiểu nhân viên Việt Nam
- KHÔNG hỏi nhiều câu hỏi, chỉ hướng tới việc lấy SĐT
- KHÔNG trả lời về giá cả chi tiết, nói "để sale báo giá cụ thể cho ${honorific} ạ"
- Nếu khách hỏi về sản phẩm cụ thể, trả lời sơ qua rồi xin SĐT
- Mỗi tin nhắn chỉ 1-2 câu, không dài dòng
- Dùng emoji vừa phải (1-2 emoji)

Tên khách: ${customerName}`;

    const contents = [
        {
            role: 'user',
            parts: [{ text: systemPrompt }]
        },
        {
            role: 'model',
            parts: [{ text: 'Dạ, em hiểu rồi ạ. Em sẽ chăm sóc khách hàng theo đúng quy trình.' }]
        },
        // Add chat history
        ...chatHistory.map(msg => ({
            role: msg.role === 'customer' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })),
        // Current message
        {
            role: 'user',
            parts: [{ text: customerMessage }]
        }
    ];

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150,
                    topP: 0.9,
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await res.json();
        if (data.error) {
            console.error('Gemini API Error:', data.error);
            return '';
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return reply.trim();
    } catch (e: any) {
        console.error('Gemini call failed:', e.message);
        return '';
    }
}

/**
 * Determine conversation state and generate appropriate response
 */
export async function getAIResponse(
    customerMessage: string,
    customerName: string,
    isFirstMessage: boolean,
    hasPhoneInDB: boolean,
    chatHistory: { role: string; content: string }[]
): Promise<{ messages: string[]; phoneDetected: string | null; state: string }> {
    const honorific = detectGender(customerName);

    // Check if current message contains a phone number
    const phoneDetected = extractPhoneNumber(customerMessage);

    if (phoneDetected) {
        return {
            messages: generatePhoneReceivedMessages(honorific),
            phoneDetected,
            state: 'phone_received'
        };
    }

    // First message from customer → greet + ask phone
    if (isFirstMessage) {
        return {
            messages: generateGreetingMessages(customerName, honorific),
            phoneDetected: null,
            state: 'greeted'
        };
    }

    // For other messages → use Gemini AI to respond naturally
    // Pass hasPhoneInDB so AI knows whether to ask for phone or guide to sales
    const aiReply = await callGeminiAI(customerMessage, customerName, honorific, chatHistory, hasPhoneInDB);
    if (aiReply) {
        // Split AI reply into multiple short messages if it contains \n
        const parts = aiReply.split('\n').filter(p => p.trim());
        return {
            messages: parts.length > 0 ? parts : [aiReply],
            phoneDetected: null,
            state: 'ai_reply'
        };
    }

    // Fallback if Gemini fails — adapt based on phone state
    const fallbackMsg = hasPhoneInDB
        ? `Dạ, bộ phận kinh doanh bên em sẽ liên hệ ${honorific} để tư vấn chi tiết ạ 😊`
        : `${honorific} cho em xin số điện thoại để kinh doanh liên hệ tư vấn ạ 😊`;
    return {
        messages: [fallbackMsg],
        phoneDetected: null,
        state: 'fallback'
    };
}
