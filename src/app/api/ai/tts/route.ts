import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --------------- Helper: Timeout Wrapper ---------------
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// --------------- 1. Google Gemini Expressive Neural Audio (Tự nhiên & Biểu cảm nhất) ---------------

interface GeminiVoiceConfig {
    voiceName: string;
    instruction: string;
}

const GEMINI_VOICES: Record<string, GeminiVoiceConfig> = {
    "female-genz": {
        voiceName: "Kore",
        instruction: "Nói bằng tiếng Việt với giọng nữ trẻ trung, sôi động, tự nhiên, nhí nhảnh chuẩn phong cách TikTok viral bán hàng. Ngữ điệu chân thực, nhấn nhá vui vẻ."
    },
    "female-sweet": {
        voiceName: "Aoede",
        instruction: "Nói bằng tiếng Việt với giọng nữ dịu dàng, ấm áp, tình cảm, thân mật như người chị em tâm sự giới thiệu món ngon và hàng kho sỉ."
    },
    "female-pro": {
        voiceName: "Leda",
        instruction: "Nói bằng tiếng Việt với giọng nữ tự tin, chuyên nghiệp, rõ ràng, uy tín, chuẩn phong cách giới thiệu đối tác kinh doanh B2B."
    },
    "male-genz": {
        voiceName: "Puck",
        instruction: "Nói bằng tiếng Việt với giọng nam Gen Z năng động, hóm hỉnh, thân thiện, hào hứng như đang quay video đập hộp hàng mới về."
    },
    "male-pro": {
        voiceName: "Fenrir",
        instruction: "Nói bằng tiếng Việt với giọng nam trầm ấm, đĩnh đạc, chững chạc, tạo cảm giác tin cậy tuyệt đối cho đại lý và nhà phân phối."
    },
    "female": {
        voiceName: "Kore",
        instruction: "Nói bằng tiếng Việt tự nhiên, truyền cảm, nhấn nhá lôi cuốn người nghe."
    },
    "male": {
        voiceName: "Puck",
        instruction: "Nói bằng tiếng Việt giọng nam tự nhiên, hào hứng, lôi cuốn."
    }
};

async function synthesizeWithGemini(text: string, styleKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const config = GEMINI_VOICES[styleKey] || GEMINI_VOICES["female-genz"];
    const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-exp"];

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: `${config.instruction}\n\nĐọc chính xác nội dung kịch bản sau, không thêm bớt lời dẫn:\n"${text}"`
                    }
                ]
            }
        ],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: config.voiceName
                    }
                }
            }
        }
    };

    for (const model of models) {
        try {
            console.log(`[TTS] Trying Gemini Model ${model} for expressive voice (${config.voiceName})...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(12000)
            });

            if (!res.ok) {
                const errText = await res.text();
                console.warn(`[TTS] Gemini ${model} failed (${res.status}):`, errText.slice(0, 300));
                continue;
            }

            const json = await res.json();
            const parts = json?.candidates?.[0]?.content?.parts;
            if (!parts || parts.length === 0) continue;

            for (const part of parts) {
                if (part.inlineData?.data) {
                    const audioBuf = Buffer.from(part.inlineData.data, "base64");
                    const mime = part.inlineData.mimeType || "audio/wav";
                    console.log(`[TTS] Gemini Expressive Audio SUCCESS: ${audioBuf.length} bytes (${mime})`);
                    return { buffer: audioBuf, mimeType: mime };
                }
            }
        } catch (e: any) {
            console.warn(`[TTS] Error calling Gemini model ${model}:`, e.message);
        }
    }

    throw new Error("Gemini Audio synthesis failed across all models");
}

// --------------- 2. Microsoft Edge Neural Engine ---------------

async function synthesizeWithEdgeTTS(
    text: string,
    voiceName = "vi-VN-HoaiMyNeural",
    rate = "+8%",
    pitch = "+0Hz"
): Promise<Buffer> {
    const edgePromise = new Promise<Buffer>(async (resolve, reject) => {
        try {
            const tts = new MsEdgeTTS();
            await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
            const result = tts.toStream(text, { rate, pitch });

            const chunks: Buffer[] = [];
            result.audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
            result.audioStream.on("end", () => {
                const finalBuf = Buffer.concat(chunks);
                if (finalBuf.length === 0) {
                    reject(new Error("MsEdgeTTS empty"));
                } else {
                    resolve(finalBuf);
                }
            });
            result.audioStream.on("error", (err: any) => reject(err));
        } catch (err) {
            reject(err);
        }
    });

    return withTimeout(edgePromise, 4000, "Edge TTS timeout after 4s");
}

// --------------- 3. ElevenLabs Voice Cloning Engine ---------------

async function synthesizeWithElevenLabs(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
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
        signal: AbortSignal.timeout(9000)
    });

    if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

// --------------- 4. Google Translate Fast Multi-chunk Fallback ---------------

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
            signal: AbortSignal.timeout(3000)
        });

        if (!res.ok) throw new Error("Chunk failed");
        return Buffer.from(await res.arrayBuffer());
    });

    const buffers = await Promise.all(chunkPromises);
    return Buffer.concat(buffers);
}

// --------------- Main Handler ---------------

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice = "female", rate, pitch, style = "female-genz", voiceId, elevenApiKey, engine } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        const normalizedText = normalizeVietnamesePhonetics(text);
        const styleKey = style || voice || "female-genz";

        let audioBuffer: Buffer | null = null;
        let contentType = "audio/mpeg";

        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // ƯU TIÊN 1: ElevenLabs nếu người dùng cấu hình Voice ID
        if (voiceId && apiKey) {
            try {
                console.log("[TTS] Using ElevenLabs Voice Cloning...");
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId, apiKey);
                contentType = "audio/mpeg";
            } catch (e: any) {
                console.warn("[TTS] ElevenLabs failed:", e.message);
            }
        }

        // ƯU TIÊN 2: Google Gemini Neural Audio (Tự nhiên, cảm xúc, biểu cảm chuẩn người thật như mong đợi)
        if (!audioBuffer && engine !== "edge") {
            try {
                const geminiResult = await synthesizeWithGemini(normalizedText, styleKey);
                audioBuffer = geminiResult.buffer;
                contentType = geminiResult.mimeType || "audio/wav";
            } catch (geminiErr: any) {
                console.warn("[TTS] Gemini Neural failed, trying Edge TTS:", geminiErr.message);
            }
        }

        // ƯU TIÊN 3: Microsoft Edge Neural TTS
        if (!audioBuffer) {
            try {
                const targetVoice = styleKey.includes("male") ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural";
                audioBuffer = await synthesizeWithEdgeTTS(normalizedText, targetVoice, rate || "+8%", pitch || "+0Hz");
                contentType = "audio/mpeg";
            } catch (edgeErr: any) {
                console.warn("[TTS] Edge TTS failed, falling back to Google Translate fast:", edgeErr.message);
            }
        }

        // ƯU TIÊN 4: Google Translate Fast Fallback (< 600ms)
        if (!audioBuffer) {
            audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
            contentType = "audio/mpeg";
        }

        const fileExt = contentType.includes("wav") ? "wav" : "mp3";

        return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": `inline; filename="voiceover_lyhu.${fileExt}"`,
                "Cache-Control": "public, max-age=3600"
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
