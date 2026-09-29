import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ── GEMINI 3.8 FLASH TTS (OMNI & FLOW AI SPEECH TECHNOLOGY) ──
interface GeminiVoiceConfig {
    voiceName: string;
    speechInstruction: string;
}

const GEMINI_VOICES: Record<string, GeminiVoiceConfig> = {
    // Nữ Gen Z - trẻ trung, năng động, chuẩn trend TikTok
    "female-genz": {
        voiceName: "Kore",
        speechInstruction: "Nói với giọng nữ Gen Z Việt Nam trẻ trung, tươi vui, năng động, hào hứng, tự nhiên như một bạn trẻ đang quay clip TikTok."
    },
    // Nữ dịu dàng - ấm áp, tâm sự, gần gũi
    "female-sweet": {
        voiceName: "Aoede",
        speechInstruction: "Nói với giọng nữ Việt Nam dịu dàng, ấm áp, nhẹ nhàng, truyền cảm như đang tâm sự thủ thỉ với người nghe."
    },
    // Nữ chuyên nghiệp - tự tin, rành mạch, giới thiệu thương hiệu sỉ
    "female-pro": {
        voiceName: "Leda",
        speechInstruction: "Nói với giọng nữ phát thanh viên chuyên nghiệp, tự tin, rành mạch, uy tín, chuẩn mực."
    },
    // Nam Gen Z - hóm hỉnh, trẻ trung, tự nhiên
    "male-genz": {
        voiceName: "Puck",
        speechInstruction: "Nói với giọng nam Gen Z Việt Nam trẻ trung, hoạt bát, dí dỏm, hào sảng, cực kỳ tự nhiên."
    },
    // Nam chuyên nghiệp - trầm ấm, uy tín, phát thanh viên
    "male-pro": {
        voiceName: "Fenrir",
        speechInstruction: "Nói với giọng nam trầm ấm, chín chắn, phong thái đĩnh đạc, uy tín, phát thanh viên doanh nghiệp."
    },
    // Mặc định
    "female": {
        voiceName: "Kore",
        speechInstruction: "Nói với giọng nữ Việt Nam chuẩn mực, tự nhiên, truyền cảm, dễ nghe."
    },
    "male": {
        voiceName: "Puck",
        speechInstruction: "Nói với giọng nam Việt Nam chuẩn mực, tự nhiên, ấm áp, dễ nghe."
    }
};

async function synthesizeWithGeminiTTS(
    text: string,
    styleKey: string
): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured");
    }

    const voiceCfg = GEMINI_VOICES[styleKey] || (styleKey.includes("male") ? GEMINI_VOICES["male-genz"] : GEMINI_VOICES["female-genz"]);
    const promptText = `${voiceCfg.speechInstruction}\n\nĐọc chính xác đoạn văn bản sau bằng tiếng Việt, tuyệt đối không thêm lời chào hay bất kỳ từ ngữ nào khác:\n\n"${text}"`;

    const models = [
        "gemini-3.8-flash-tts",
        "gemini-3.8-flash-lite-tts",
        "gemini-2.5-flash-preview-tts"
    ];

    for (const model of models) {
        try {
            console.log(`[Gemini TTS] Calling ${model} with voice ${voiceCfg.voiceName}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptText }
                        ]
                    }
                ],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceCfg.voiceName
                            }
                        }
                    }
                }
            };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(20000)
            });

            if (!res.ok) {
                const errText = await res.text();
                console.warn(`[Gemini TTS] ${model} failed (${res.status}):`, errText.slice(0, 200));
                continue;
            }

            const json = await res.json();
            const part = json.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
                const rawBuffer = Buffer.from(part.inlineData.data, "base64");
                const mimeType = part.inlineData.mimeType || "audio/wav";
                console.log(`[Gemini TTS] SUCCESS with ${model}: ${rawBuffer.length} bytes, ${mimeType}`);
                return { buffer: rawBuffer, mimeType };
            }
        } catch (e: any) {
            console.warn(`[Gemini TTS] ${model} error:`, e.message);
        }
    }

    throw new Error("Tất cả mô hình Gemini 3.8 Flash TTS đều bận hoặc không phản hồi");
}

// ── ELEVENLABS VOICE CLONING ENGINE ──
async function synthesizeWithElevenLabs(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
    console.log(`[ElevenLabs] Synthesizing voiceId ${voiceId}...`);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            language_code: "vi",
            voice_settings: {
                stability: 0.65,
                similarity_boost: 0.80,
                style: 0.05,
                use_speaker_boost: true
            }
        }),
        signal: AbortSignal.timeout(18000)
    });

    if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
}

// ── GOOGLE TRANSLATE FALLBACK ──
function splitTextIntoChunks(text: string, maxLen = 140): string[] {
    const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return [];

    const sentences = clean.split(/(?<=[.!?,;:\n])\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
        if ((current + " " + sentence).trim().length <= maxLen) {
            current = (current + " " + sentence).trim();
        } else {
            if (current) chunks.push(current);
            current = sentence;
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

async function synthesizeWithGoogleTranslate(text: string): Promise<Buffer> {
    const chunks = splitTextIntoChunks(text, 140);
    if (chunks.length === 0) throw new Error("No text chunks.");

    const chunkPromises = chunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Referer: "https://translate.google.com/"
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) throw new Error("Google chunk failed");
        return Buffer.from(await res.arrayBuffer());
    });

    const buffers = await Promise.all(chunkPromises);
    return Buffer.concat(buffers);
}

// ── MAIN HANDLER ──
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice, style = "female-genz", voiceId, elevenApiKey } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        const normalizedText = normalizeVietnamesePhonetics(text);

        let styleKey = style || "female-genz";
        if (voice && (voice.includes("NamMinh") || voice.includes("male") || voice.includes("Puck") || voice.includes("Fenrir"))) {
            if (!styleKey.includes("male")) styleKey = "male-genz";
        }

        console.log(`[TTS] Request: styleKey=${styleKey}`);

        let audioBuffer: Buffer | null = null;
        let mimeType = "audio/wav";
        let engineUsed = "gemini-3.8-flash-tts";
        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // ƯU TIÊN 1: ElevenLabs nếu người dùng cấu hình giọng nhân bản Voice ID
        if (voiceId && apiKey) {
            try {
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId, apiKey);
                engineUsed = "elevenlabs";
                mimeType = "audio/mpeg";
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed, falling back to Gemini:", elevenErr.message);
            }
        }

        // ƯU TIÊN 2: Google Gemini 3.8 Flash TTS (Công nghệ giọng Omni & Flow tự nhiên, cảm xúc đỉnh cao)
        if (!audioBuffer) {
            try {
                const geminiResult = await synthesizeWithGeminiTTS(normalizedText, styleKey);
                audioBuffer = geminiResult.buffer;
                mimeType = geminiResult.mimeType;
                engineUsed = "gemini-3.8-flash-tts";
            } catch (geminiErr: any) {
                console.warn("[TTS] Gemini TTS error:", geminiErr.message, "falling back to Google Translate");
                audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
                engineUsed = "google-translate-fallback";
                mimeType = "audio/mpeg";
            }
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error("Không thể tạo dữ liệu âm thanh.");
        }

        return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": `inline; filename="voiceover_gemini_lyhu.${mimeType.includes("wav") ? "wav" : "mp3"}"`,
                "Cache-Control": "public, max-age=3600",
                "X-TTS-Engine": engineUsed,
                "X-TTS-Voice": styleKey
            }
        });
    } catch (err: any) {
        console.error("[TTS API Error]:", err);
        return NextResponse.json(
            { error: err.message || "Lỗi xử lý giọng đọc trên hệ thống." },
            { status: 500 }
        );
    }
}
