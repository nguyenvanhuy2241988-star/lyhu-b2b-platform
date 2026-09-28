import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini 3.8 Flash TTS — studio-quality neural voice (same tech as Gemini Omni / Flow)
const GEMINI_TTS_MODEL = "gemini-3.8-flash-tts";
const GEMINI_TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Fallback model if 3.8 is not available
const GEMINI_TTS_LITE_MODEL = "gemini-3.8-flash-lite-tts";
const GEMINI_TTS_LITE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_LITE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Map voice style to a voice configuration
// Gemini TTS uses voice_name from the prebuilt/extended library
// Common voices: Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr
interface VoiceStyle {
    voice_name: string;
    speech_instruction: string;
}

const VOICE_STYLES: Record<string, VoiceStyle> = {
    // Nữ Gen Z - trẻ trung, năng động
    "female-genz": {
        voice_name: "Kore",
        speech_instruction: "Nói với giọng trẻ trung, năng động, thân thiện như một cô gái Gen Z Việt Nam đang quay TikTok. Giọng vui tươi, tự nhiên, có chút nhí nhảnh."
    },
    // Nữ dịu dàng
    "female-sweet": {
        voice_name: "Aoede",
        speech_instruction: "Nói với giọng nữ dịu dàng, ấm áp, nhẹ nhàng như đang tâm sự với bạn bè. Giọng Việt Nam chuẩn, tự nhiên."
    },
    // Nữ chuyên nghiệp
    "female-pro": {
        voice_name: "Leda",
        speech_instruction: "Nói với giọng nữ chuyên nghiệp, tự tin, rõ ràng. Phù hợp cho video giới thiệu sản phẩm và quảng cáo."
    },
    // Nam Gen Z
    "male-genz": {
        voice_name: "Puck",
        speech_instruction: "Nói với giọng nam trẻ trung, năng động, hài hước kiểu Gen Z. Giọng tự nhiên như đang nói chuyện với bạn."
    },
    // Nam chuyên nghiệp
    "male-pro": {
        voice_name: "Fenrir",
        speech_instruction: "Nói với giọng nam trầm ấm, chuyên nghiệp, đáng tin cậy. Phù hợp cho video doanh nghiệp và thương mại."
    },
    // Nữ thời sự
    "female-news": {
        voice_name: "Zephyr",
        speech_instruction: "Nói với giọng nữ rõ ràng, mạch lạc, trang trọng kiểu MC truyền hình. Phát âm chuẩn, nhịp đều."
    },
    // Mặc định
    "female": {
        voice_name: "Kore",
        speech_instruction: "Nói với giọng nữ tự nhiên, thân thiện, dễ nghe. Giọng Việt Nam chuẩn."
    },
    "male": {
        voice_name: "Puck",
        speech_instruction: "Nói với giọng nam tự nhiên, trẻ trung, dễ nghe. Giọng Việt Nam chuẩn."
    }
};

// --------------- Gemini TTS Engine ---------------

async function synthesizeWithGeminiTTS(
    text: string,
    voiceStyle: string,
    speakingRate: number,
    voiceSampleBase64?: string
): Promise<Buffer> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured");
    }

    const style = VOICE_STYLES[voiceStyle] || VOICE_STYLES["female"];

    // Build speech instruction with rate guidance
    let rateInstruction = "";
    if (speakingRate < 0.8) {
        rateInstruction = " Nói chậm rãi, từ tốn.";
    } else if (speakingRate > 1.3) {
        rateInstruction = " Nói nhanh, nhịp độ cao, dồn dập.";
    } else if (speakingRate > 1.1) {
        rateInstruction = " Nói hơi nhanh, nhịp độ vừa phải.";
    }

    const voiceConfig = voiceSampleBase64 ? {
        replicated_voice_config: {
            voice_sample_audio: voiceSampleBase64,
            mime_type: "audio/wav"
        }
    } : {
        prebuilt_voice_config: {
            voice_name: style.voice_name
        }
    };

    const requestBody = {
        contents: [{
            parts: [
                {
                    speech_metadata: {
                        style: `${style.speech_instruction}${rateInstruction}`
                    },
                    text: text
                }
            ]
        }],
        generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
                voice_config: voiceConfig
            }
        }
    };

    // Try main model first, then lite model
    const urls = [GEMINI_TTS_URL, GEMINI_TTS_LITE_URL];

    for (const url of urls) {
        try {
            console.log(`[Gemini TTS] Trying ${url.includes("lite") ? "lite" : "flash"} model...`);

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                const errText = await res.text();
                console.warn(`[Gemini TTS] Error ${res.status}:`, errText.slice(0, 500));
                continue;
            }

            const json = await res.json();

            // Extract audio data from response
            // Response structure: { candidates: [{ content: { parts: [{ inlineData: { mimeType, data } }] } }] }
            const candidates = json.candidates;
            if (!candidates || candidates.length === 0) {
                console.warn("[Gemini TTS] No candidates in response");
                continue;
            }

            const parts = candidates[0]?.content?.parts;
            if (!parts || parts.length === 0) {
                console.warn("[Gemini TTS] No parts in response");
                continue;
            }

            // Find audio part
            for (const part of parts) {
                if (part.inlineData?.data) {
                    const audioBuffer = Buffer.from(part.inlineData.data, "base64");
                    const mimeType = part.inlineData.mimeType || "audio/wav";
                    console.log(`[Gemini TTS] Success! ${audioBuffer.length} bytes, ${mimeType}`);
                    return audioBuffer;
                }
            }

            console.warn("[Gemini TTS] No audio data found in response parts");
        } catch (err: any) {
            console.warn(`[Gemini TTS] Request failed:`, err.message);
        }
    }

    throw new Error("Gemini TTS failed with all models");
}

// --------------- ElevenLabs Voice Cloning Engine ---------------

async function synthesizeWithElevenLabs(
    text: string,
    voiceId: string,
    apiKey: string
): Promise<Buffer> {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.85
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`ElevenLabs error (${res.status}): ${err}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// --------------- Google Translate Fallback ---------------

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
            if (sentence.length > maxLen) {
                const words = sentence.split(" ");
                let wordChunk = "";
                for (const w of words) {
                    if ((wordChunk + " " + w).trim().length <= maxLen) {
                        wordChunk = (wordChunk + " " + w).trim();
                    } else {
                        if (wordChunk) chunks.push(wordChunk);
                        wordChunk = w;
                    }
                }
                if (wordChunk) current = wordChunk;
                else current = "";
            } else {
                current = sentence;
            }
        }
    }

    if (current) chunks.push(current);
    return chunks;
}

async function synthesizeWithGoogleTranslate(text: string): Promise<Buffer> {
    const chunks = splitTextIntoChunks(text);
    if (chunks.length === 0) throw new Error("No text chunks.");

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Referer: "https://translate.google.com/"
            }
        });

        if (!res.ok) continue;
        audioBuffers.push(Buffer.from(await res.arrayBuffer()));
    }

    if (audioBuffers.length === 0) throw new Error("All Google Translate chunks failed.");
    return Buffer.concat(audioBuffers);
}

// --------------- Main Handler ---------------

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice = "female", rate = "+0%", style = "female", voiceId, elevenApiKey, voiceSampleBase64 } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        // Normalize Vietnamese phonetics (LYHU -> Ly Hu, etc.)
        const normalizedText = normalizeVietnamesePhonetics(text);

        // Parse speaking rate from percentage string to multiplier
        let speakingRate = 1.0;
        const rateMatch = rate.match(/([+-]?\d+)%/);
        if (rateMatch) {
            speakingRate = 1.0 + parseInt(rateMatch[1], 10) / 100;
        }

        // Determine voice style key
        let voiceKey = style || voice || "female";
        // Backward compatibility: if old voice names are used, map them
        if (voiceKey.includes("HoaiMy") || voiceKey.includes("female")) {
            if (!VOICE_STYLES[voiceKey]) voiceKey = "female";
        }
        if (voiceKey.includes("NamMinh") || voiceKey.includes("male")) {
            if (!VOICE_STYLES[voiceKey]) voiceKey = "male";
        }

        let audioBuffer: Buffer;
        let contentType = "audio/mpeg";

        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // Ưu tiên 1: Nếu là giọng nhân bản (Custom Cloned Voice với ElevenLabs)
        if (voiceId && apiKey) {
            try {
                console.log("[TTS] Trying ElevenLabs Voice Cloning for voiceId:", voiceId);
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId, apiKey);
                contentType = "audio/mpeg";
                console.log("[TTS] ElevenLabs SUCCESS:", audioBuffer.length, "bytes");
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed, fallback to Gemini:", elevenErr.message);
                audioBuffer = await synthesizeWithGeminiTTS(normalizedText, voiceKey, speakingRate, voiceSampleBase64);
                contentType = "audio/wav";
            }
        } else {
            // Ưu tiên 2: Gemini TTS (chất lượng studio - có hỗ trợ sao chép giọng mẫu voiceSampleBase64) → Ưu tiên 3: Google Translate (fallback)
            try {
                console.log("[TTS] Trying Gemini 3.8 Flash TTS...", voiceSampleBase64 ? "(Replicated Voice Sample)" : "");
                audioBuffer = await synthesizeWithGeminiTTS(normalizedText, voiceKey, speakingRate, voiceSampleBase64);
                contentType = "audio/wav"; // Gemini returns WAV
                console.log("[TTS] Gemini TTS SUCCESS:", audioBuffer.length, "bytes");
            } catch (geminiErr: any) {
                console.warn("[TTS] Gemini TTS failed, falling back to Google Translate:", geminiErr.message);
                audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
                contentType = "audio/mpeg";
                console.log("[TTS] Google Translate fallback:", audioBuffer.length, "bytes");
            }
        }

        return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": `inline; filename="voiceover_lyhu.${contentType === "audio/wav" ? "wav" : "mp3"}"`,
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
