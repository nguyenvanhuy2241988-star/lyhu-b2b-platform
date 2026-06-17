/**
 * Gemini AI Service for Messenger Auto-Reply
 * Uses Gemini 2.0 Flash (Free Tier: 15 req/min)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
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
 * Handles any format: 0933661095, 0933.661.095, 0933 661 095, 0933-661-095, 0933 661.095, 076 2225651
 */
export function extractPhoneNumber(text: string): string | null {
    if (!text) return null;
    // Match 0[35789] + 8 more digits, allowing dots/spaces/dashes between any digits
    const s = '[\\s.\\-]*'; // optional separator between digits
    const pattern = new RegExp(`0[35789]${s}\\d${s}\\d${s}\\d${s}\\d${s}\\d${s}\\d${s}\\d${s}\\d`, 'g');
    const match = text.match(pattern);
    if (match) {
        return match[0].replace(/\D/g, ''); // Clean: remove all non-digits
    }
    return null;
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
    const contextRules = `
NHẬN BIẾT NGỮ CẢNH (RẤT QUAN TRỌNG):
- Nếu khách CẢM ƠN, KHEN, REVIEW (v.d: "cảm ơn shop", "hàng ngon", "bé thích lắm", "chúc shop"): → Cảm ơn lại vui vẻ, chúc khách. KHÔNG hỏi SĐT, KHÔNG pitch bán hàng
- Nếu ai đó GIỚI THIỆU mình là nhân viên công ty khác, đối tác, logistics, vận chuyển, hoặc CHÀO BÁN DỊCH VỤ: → "Dạ cảm ơn bạn, em sẽ chuyển thông tin cho bộ phận phụ trách ạ". DỪNG, không hỏi SĐT
- Nếu khách hỏi về ĐƠN HÀNG đã đặt, GIAO HÀNG, SHIP: → "Em sẽ kiểm tra và phản hồi ${honorific} sớm ạ"
- Nếu khách gửi ẢNH mà không có text hoặc gửi "[Khách gửi hình ảnh]": → Hỏi nhẹ nhàng "${honorific} ơi, em có thể hỗ trợ gì ạ? 😊"
- Nếu khách chào/bye/kết thúc: → Chào lại tự nhiên, thân thiện

VỀ LYHU:
- LYHU là nhà PHÂN PHỐI thực phẩm: bánh tráng, khoai môn, snack, đồ ăn vặt
- KHÔNG cung cấp dịch vụ vận chuyển/logistics
- KHÔNG bịa thông tin về dịch vụ/sản phẩm mà LYHU không có
- Nếu không biết → nói "em sẽ hỏi lại và phản hồi ${honorific} ạ"`;

    const systemPrompt = hasPhone
        ? `Bạn là nhân viên chăm sóc khách hàng của LYHU - công ty phân phối thực phẩm (bánh tráng, khoai môn, snack, đồ ăn vặt).

Quy tắc:
- Xưng hô: gọi khách là "${honorific}", xưng "em"
- Khách ĐÃ GỬI SỐ ĐIỆN THOẠI rồi → TUYỆT ĐỐI KHÔNG xin SĐT nữa
- Trả lời NGẮN GỌN, tự nhiên theo ngữ cảnh (1-2 câu)
- CHỈ nhắc "kinh doanh sẽ liên hệ" khi khách HỎI THÊM về sản phẩm/giá/đặt hàng
- Nếu khách cảm ơn → cảm ơn lại, KHÔNG nhắc "kinh doanh sẽ liên hệ"
- Nếu khách chào/bye → chào lại tự nhiên
- KHÔNG trả lời về giá cả chi tiết
- Thân thiện, đúng kiểu nhân viên Việt Nam
- Dùng emoji vừa phải (1-2 emoji)
${contextRules}

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
${contextRules}

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
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                    topP: 0.9,
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await res.json();
        if (data.error) {
            console.error('Gemini API Error:', JSON.stringify(data.error));
            return '';
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!reply) {
            console.error('Gemini returned empty response. Status:', res.status, 'Data:', JSON.stringify(data).slice(0, 200));
        }
        return reply.trim();
    } catch (e: any) {
        console.error('Gemini call failed:', e.name, e.message);
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

    // IMPORTANT: If phone already in DB, skip greeting (don't ask for phone again!)
    // This prevents re-asking for phone when conversation is reopened or webhook retries
    if (isFirstMessage && !hasPhoneInDB) {
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

/**
 * AI Deep Analytics for Facebook Ads Campaigns
 */
export async function analyzeMarketingCampaign(data: any): Promise<string> {
    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not configured');
        return 'Hệ thống chưa được cấu hình API Key cho AI. Vui lòng liên hệ quản trị viên.';
    }

    const systemPrompt = `Bạn là một Chuyên gia Performance Marketing (Ads Optimizer) xuất sắc của công ty phân phối LYHU.
ĐẶC ĐIỂM KINH DOANH CỦA LYHU:
- LYHU là tổng thầu phân phối hàng tiêu dùng nhanh (FMCG) như Snack Khoai Môn CVT, bánh tráng...
- Đối tượng khách hàng mục tiêu (Target Audience): Khách mua sỉ, Nhà phân phối (NPP), Đại lý, Siêu thị, Tạp hóa, Mini mart, người kinh doanh buôn bán.

Nhiệm vụ của bạn là phân tích dữ liệu chiến dịch quảng cáo Facebook và đưa ra lời khuyên tối ưu sắc bén nhất để tìm được khách sỉ.

BỐ CỤC TRẢ LỜI BẮT BUỘC (Sử dụng Markdown):
1. 🩺 **Chẩn đoán Nhanh**: Tóm tắt tình trạng chiến dịch trong 1-2 câu.
2. 📊 **Phân tích Chỉ số**: Đánh giá các chỉ số (tốt/xấu, đắt/rẻ).
3. 🎯 **Đề xuất Hành động (Actionable Insights)**: Liệt kê 2-3 hành động cụ thể để tối ưu. Đặc biệt, nếu Targeting đang quá rộng (Broad) hoặc sai tệp, BẮT BUỘC phải gợi ý 3-5 từ khóa "Sở thích/Hành vi" cụ thể trên Facebook để target chuẩn khách sỉ, tạp hóa (Vd: Bán buôn, Doanh nghiệp nhỏ, Quản trị viên Trang kinh doanh...).

QUY TẮC CỰC KỲ QUAN TRỌNG:
- Ở dòng CÙNG của câu trả lời, BẮT BUỘC bạn phải in ra một thẻ cấu trúc chứa danh sách các từ khóa tiếng Anh chuẩn của Facebook mà bạn đề xuất (Ví dụ: Wholesale, Retail, Small business owner, Fast-moving consumer goods).
- Định dạng thẻ phải chính xác tuyệt đối như sau: \`<<<TARGETING:keyword1|keyword2|keyword3>>>\`
- Không được thiếu thẻ này ở cuối bài.
`;

    const actionsStr = data.actions && data.actions.length > 0 
        ? data.actions.map((a: any) => `${a.action_type}: ${a.value}`).join(', ') 
        : 'Không có';
        
    const cpaStr = data.costPerAction && data.costPerAction.length > 0
        ? data.costPerAction.map((a: any) => `${a.action_type}: ${a.value} đ`).join(', ') 
        : 'Không có';

    const userPrompt = `Dữ liệu chiến dịch cần phân tích:
- Tên chiến dịch: ${data.name}
- Mục tiêu chiến dịch (Objective): ${data.objective}
- Mục tiêu tối ưu của nhóm quảng cáo (Optimization Goal): ${data.optimizationGoal || 'Không rõ'}
- Trạng thái: ${data.status}
- Tuổi: ${data.ageMin}-${data.ageMax} | Vị trí: ${data.countries}
- Đã chi tiêu: ${data.spend} đ
- Các hành động tạo ra (Actions): ${actionsStr}
- Giá mỗi hành động (Cost per Action): ${cpaStr}
- Giá mỗi Click (CPC): ${data.cpc} đ
- Tỷ lệ Click (CTR): ${data.ctr}%
- Lượt tiếp cận (Reach): ${data.reach}
- Tần suất (Frequency): ${data.frequency}
- Nội dung bài quảng cáo: "${data.adBody}"

Hãy đưa ra bài phân tích chuyên sâu. 
LƯU Ý CỰC KỲ QUAN TRỌNG: 
1. CHỈ ĐÁNH GIÁ ĐẮT/RẺ DỰA TRÊN MỤC TIÊU TỐI ƯU CỦA NHÓM QUẢNG CÁO (Optimization Goal). Ví dụ Mục tiêu tối ưu là PAGE_LIKES thì chỉ xét giá của 'like' (khoảng 1000-3000đ/like là bình thường). Nếu mục tiêu là CONVERSATIONS thì xét 'messaging_conversation_started'.
2. TUYỆT ĐỐI KHÔNG lấy Tổng Chi Tiêu chia cho các hành động phụ (như link_click, tin nhắn trong chiến dịch like page) rồi kết luận là đắt hay tệ. Các hành động phụ chỉ là hệ quả đi kèm miễn phí, hãy khen ngợi nếu có nhiều hành động phụ (ví dụ chạy Like Page mà vẫn ra nhiều Video View hoặc Post Engagement là rất tốt).
3. Không liệt kê lắt nhắt từng loại action phụ. Chỉ tập trung vào Mục tiêu tối ưu chính, Tần suất, CTR, và CPC.`;

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
    ];

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 2500,
                    topP: 0.9,
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);
        const resData = await res.json();
        if (resData.error) return 'Lỗi từ máy chủ AI: ' + resData.error.message;

        const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return reply || 'AI không đưa ra được nhận xét nào cho dữ liệu này.';
    } catch (e: any) {
        return 'Không thể kết nối đến máy chủ AI lúc này. Vui lòng thử lại sau.';
    }
}

/**
 * AI Media Buyer: Analyzes a list of Ad Sets and decides whether to SCALE, PAUSE, or MAINTAIN based on KPIs.
 * Target Cost per Message: < 20,000 VND
 */
export async function autoOptimizeMarketingCampaigns(adSets: any[]) {
    try {
        const systemPrompt = `Bạn là một Chuyên gia Performance Marketing (Media Buyer) xuất sắc của công ty phân phối LYHU.
NHIỆM VỤ CỦA BẠN: Phân tích danh sách các Nhóm quảng cáo (Ad Sets) đang chạy, CÓ KẾT HỢP DỮ LIỆU CRM (Tỉ lệ để lại số điện thoại), và quyết định Tối ưu hóa.

CHỈ TIÊU KPI QUAN TRỌNG (Đánh giá theo chất lượng Data):
- Ngưỡng WIN: Cost per Phone (Chi phí ra 1 số điện thoại) < 50,000 VND. Nghĩa là khách nhắn tin rẻ VÀ chịu để lại số điện thoại. Những camp này cần được TĂNG NGÂN SÁCH (SCALE_UP).
- Ngưỡng LỖ: Cost per Phone > 100,000 VND HOẶC Cost per Message > 35,000 VND (Tin nhắn quá đắt hoặc toàn rác không ra số). Những camp này cần được TẮT NGAY (PAUSE).
- Ngưỡng AN TOÀN (MAINTAIN): Cost per Phone từ 50k - 100k, hoặc Cost per Message từ 20k - 35k (chưa ra số nhưng tin nhắn không quá đắt). Giữ nguyên theo dõi thêm.
- CHƯA ĐỦ DỮ LIỆU: Nếu nhóm quảng cáo chưa cắn tiền (spend = 0) hoặc chưa có kết quả (messages = 0), BẮT BUỘC trả về "MAINTAIN" và ghi lý do "Chưa đủ dữ liệu để đánh giá".

LƯU Ý VỀ TRẠNG THÁI (status):
- Nếu nhóm quảng cáo ĐÃ BỊ TẮT (status là PAUSED, ARCHIVED, DELETED), TUYỆT ĐỐI KHÔNG đề xuất "PAUSE" (vì nó đã tắt rồi). Thay vào đó, trả về "MAINTAIN" và ghi lý do "Nhóm quảng cáo đã được tắt". 
- Tuy nhiên, nếu nhóm đã tắt nhưng chỉ số TỐT (thuộc Ngưỡng WIN), hãy đề xuất "SCALE_UP" và khuyên người dùng BẬT LẠI.

LƯU Ý KHI TÍNH TOÁN:
- Nếu số điện thoại thu về (phone_count) = 0, thì Cost per Phone KHÔNG XÁC ĐỊNH. Đừng tự ý lấy Chi tiêu làm Cost per Phone. Trong trường hợp này, CHỈ DÙNG Cost per Message để đánh giá (nếu Cost per Message > 35k thì là LỖ).

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Bạn PHẢI trả về KẾT QUẢ DƯỚI DẠNG JSON MẢNG (JSON Array) chứa quyết định cho TẤT CẢ CÁC NHÓM QUẢNG CÁO TRONG DANH SÁCH (Không được bỏ sót bất kỳ nhóm nào). TUYỆT ĐỐI KHÔNG giải thích lằng nhằng ở ngoài.
Cấu trúc JSON:
[
  {
    "id": "adset_id_123",
    "name": "Tên nhóm QC",
    "action": "SCALE_UP" | "PAUSE" | "MAINTAIN",
    "reason": "Giải thích ngắn gọn (VD: Giá 1 SĐT chỉ 30k, chất lượng quá tốt. Tăng ngân sách!)"
  }
]
`;
        const userPrompt = `Dữ liệu các Nhóm Quảng Cáo đang chạy trong toàn thời gian (Lifetime):
${JSON.stringify(adSets, null, 2)}`;

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "user", parts: [{ text: userPrompt }] }
                ],
                generationConfig: {
                    temperature: 0.1, // Low temp for strictly following rules
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        
        try {
            const jsonStr = rawText.replace(/```json\n|\n```|```/g, "").trim();
            const recommendations = JSON.parse(jsonStr);
            return recommendations;
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON:", parseError, rawText);
            return [];
        }
    } catch (error) {
        console.error("autoOptimizeMarketingCampaigns Error:", error);
        return [];
    }
}

export async function generateAdCopyAndTargeting(goal: string, audience: string) {
    try {
        const prompt = `Bạn là một chuyên gia chạy Ads.
Mục tiêu chiến dịch: ${goal}
Khách hàng mục tiêu: ${audience}

Dựa vào thông tin trên, hãy viết 1 nội dung quảng cáo Facebook (Ad Copy) thật hấp dẫn và chọn 5 từ khóa sở thích (Interests) để nhắm mục tiêu.
TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SAU, không giải thích:
{
  "ad_copy": "Nội dung bài đăng...",
  "targeting_keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"]
}`;

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error("Gemini API Error");
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        return JSON.parse(rawText.replace(/```json\n|\n```|```/g, "").trim());
    } catch (e) {
        console.error("generateAdCopyAndTargeting Error:", e);
        return {
            ad_copy: "Khám phá lô hàng sỉ siêu chất lượng tại LYHU! Liên hệ ngay để nhận báo giá sỉ tốt nhất.",
            targeting_keywords: ["Bán buôn", "Doanh nghiệp nhỏ", "Kinh doanh"]
        };
    }
}
