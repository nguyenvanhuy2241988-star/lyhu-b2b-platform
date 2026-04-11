import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI can take a while

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, userId, history = [] } = body;

        if (!message || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        // 1. Lưu tin nhắn của User vào DB
        const { error: insertUserErr } = await supabaseAdmin
            .from("factory_setup_ai_chats")
            .insert({ user_id: userId, role: "user", content: message });
        
        if (insertUserErr) {
            console.error("DB User Message Error:", insertUserErr);
        }

        // 2. Chuyển đổi History từ DB format sang Gemini format
        // History array format từ fontend là: {role: 'user' | 'ai', content: string}
        const geminiHistory = history.map((item: any) => ({
            role: item.role === 'ai' ? 'model' : 'user',
            parts: [{ text: item.content }]
        }));

        const systemPrompt = `Bạn là một Chuyên gia Kỹ sư Quản lý Dự án (Project Manager) cực kỳ có kinh nghiệm trong việc tư vấn, thiết kế, tối ưu chi phí và thiết lập (setup) xưởng sản xuất thực phẩm, mỹ phẩm, hoặc gia công tại Việt Nam.
Tên bạn là "AI Chuyên gia Setup", thuộc hệ thống LYHU CRM.
Hãy trả lời các câu hỏi của người dùng một cách chuyên nghiệp, thực tế. Đưa ra chi phí dự kiến minh họa dựa theo vật giá Việt Nam nếu được hỏi.
Giao tiếp thân thiện, ngắn gọn và dùng ngôn ngữ tiếng Việt (Sử dụng markdown để in đậm, làm nổi bật các ý chính).`;

        // 3. Gọi Gemini API
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    ...geminiHistory,
                    { role: "user", parts: [{ text: message }] }
                ],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[Factory AI Chat] Gemini Error:", errorText);
            return NextResponse.json({ error: "Thất bại khi gọi API AI" }, { status: 500 });
        }

        const result = await res.json();
        const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
             return NextResponse.json({ error: "AI No Output" }, { status: 500 });
        }

        // 4. Lưu phản hồi của AI vào DB
        const { error: insertAiErr } = await supabaseAdmin
            .from("factory_setup_ai_chats")
            .insert({ user_id: userId, role: "ai", content: textResponse });
            
        if (insertAiErr) console.error("DB AI Message Error:", insertAiErr);

        return NextResponse.json({
            success: true,
            reply: textResponse
        });

    } catch (err: any) {
        console.error("[Factory AI Chat] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
